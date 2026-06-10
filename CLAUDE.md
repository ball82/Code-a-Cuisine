# Code à Cuisine

KI-Rezeptgenerator. Nutzer gibt vorhandene Zutaten + Präferenzen ein, bekommt 3
Rezeptvorschläge. Alle generierten Rezepte landen in einer öffentlichen Bibliothek
(Cookbook). Ziel: Lebensmittelverschwendung reduzieren.

## Tech-Stack
- **Frontend:** Angular 22 (standalone, Signals, `inject()`, KEIN NgModule)
- **Backend:** n8n Cloud (Workflows = das Backend)
- **KI:** Google Gemini (im JSON-Modus / structured output)
- **DB:** Firebase Firestore

## Architektur / Datenfluss
Angular → n8n-Webhook → Validierung → Quota-Tor → Gemini → Firestore speichern → Antwort an Angular.

**Lese-/Schreib-Trennung:**
- LESEN: Angular liest `recipes` DIREKT via Firebase SDK (Cookbook, ohne Account).
- SCHREIBEN: ausschließlich über n8n. Firestore Security Rules: `recipes` read-only
  für Clients, Client-Writes überall verboten; Quota-/Like-Collections für Clients
  weder les- noch schreibbar.
- LIKES: eigener zweiter (kleiner) n8n-Webhook — IP MUSS serverseitig aus dem Header
  ermittelt werden, der Client darf seine IP nie selbst melden.

**Sicherheitsregeln (nicht verhandelbar):**
- Gemini-API-Key liegt NUR in n8n (als Credential), NIE im Angular-Code.
- Webhook-URLs + öffentliche Firebase-Config gehören in `src/environments/` (werden committed — enthalten keine Geheimnisse).
- "Never trust the client": Jede Validierung passiert in Angular UND nochmals in n8n.

## JSON-Vertrag 1 — Angular → n8n (Request)
```json
{
  "ingredients": [{ "name": "Pasta", "amount": 100, "unit": "gram" }],
  "portions": 2,
  "cooks": 2,
  "cookingTime": "quick",
  "cuisine": "italian",
  "diet": "vegetarian"
}
```

## JSON-Vertrag 2 — n8n → Angular (Response)
Rezepte sind bereits in Firestore gespeichert, jedes mit eigener `id`.
```json
{
  "recipes": [{
    "id": "<firestore-auto-id>",
    "title": "Pasta with spinach and cherry tomatoes",
    "cuisine": "italian",
    "tags": ["vegetarian", "quick"],
    "cookingTimeMinutes": 20,
    "portions": 2,
    "cooks": 2,
    "nutritionPerPortion": { "calories": 630, "protein": 18, "fat": 24, "carbs": 58 },
    "yourIngredients": [{ "name": "Pasta noodles", "amount": 80, "unit": "gram" }],
    "extraIngredients": [{ "name": "Parmesan cheese", "amount": 40, "unit": "gram" }],
    "directions": [{ "step": 1, "title": "Cook the pasta", "chef": 1, "instruction": "..." }],
    "likes": 0,
    "createdAt": "<ISO-timestamp>"
  }]
}
```
- Nährwerte NUR pro Portion. Frontend rechnet Gesamtwerte = Wert × `portions`.
- `extraIngredients`: maximal 3 (n8n prüft das nach Gemini).
- `chef`: Zahl 1–3, mappt auf "Chef 1/2/3". Bei 1 Koch: alle Schritte `chef: 1`.

## Erlaubte Werte (technische Kleinbuchstaben, NICHT die Anzeigetexte)
- `unit`: `gram` | `ml` | `liter` | `piece`
- `cookingTime`: `quick` | `medium` | `complex`
- `cuisine`: `german` | `italian` | `japanese` | `indian` | `gourmet` | `fusion`
- `diet`: `vegetarian` | `vegan` | `keto` | `none`

## Validierungsregeln (Angular + n8n)
- `ingredients`: mind. 1 Eintrag; `amount` > 0; `unit` aus erlaubter Liste
- `portions`: ganze Zahl 1–12 (Default 2)
- `cooks`: ganze Zahl 1–3
- restliche Felder: nur erlaubte Werte (siehe oben)
- Mengen-Plausibilität ("reicht das für N Portionen?") wird NICHT im Frontend geprüft —
  Gemini beurteilt das und gibt bei unzureichenden Mengen ein Fehlersignal statt Rezepten
  zurück; n8n reicht das als freundliche Meldung durch ("Ups!"-Dialog).

## Firestore-Datenmodell
- **`recipes`** — Auto-ID. Felder = Vertrag 2. Quelle fürs Cookbook.
- **`ipUsage`** — Doc-ID `{ip}_{date}` (z.B. `203_0_113_5_2026-06-09`). Feld: `count`. Limit 3/IP/Tag.
- **`dailyUsage`** — Doc-ID `{date}`. Feld: `count`. Limit 12/Tag systemweit.
- **`recipeLikes`** — Doc-ID `{ip}_{recipeId}`. Existenz = "diese IP hat geliked".
- Firestore-IDs dürfen KEINE `/` enthalten → IP vor Verwendung säubern.

## n8n-Workflow (Reihenfolge wichtig: billige Prüfungen VOR teurem Gemini = "Kostenairbag")
1. Webhook empfängt Request.
2. Echte Nutzer-IP aus `X-Forwarded-For`-Header lesen (NICHT die direkte Verbindung) + säubern.
3. Eingaben validieren (Vertrag 1). Ungültig → freundliche Fehlermeldung, KEIN Gemini-Aufruf.
4. Quota-Tor: `ipUsage` (max 3) + `dailyUsage` (max 12) aus Firestore lesen. Erschöpft → freundliche Fehlermeldung, KEIN Gemini-Aufruf.
5. Gemini aufrufen (JSON-Modus). ← einziger teurer Schritt.
6. Gemini-Antwort validieren: gültiges JSON? genau 3 Rezepte? max 3 `extraIngredients`?
7. Die 3 Rezepte in `recipes` speichern (Firestore erzeugt die IDs), IDs einsammeln.
8. Zähler `ipUsage` + `dailyUsage` erhöhen — ERST nach Erfolg (fehlgeschlagener Gemini-Call kostet den Nutzer keine Quota). Atomares increment bevorzugen.
9. Antwort (Vertrag 2, Rezepte MIT IDs) via "Respond to Webhook" zurückgeben.

**Zwei Arten von Fehler trennen:**
- Nutzer sieht eine freundliche Meldung (z.B. Quota erreicht).
- Separater Error-Trigger-Workflow → E-Mail an Entwickler bei technischem Absturz.

**Likes (zweiter n8n-Webhook "like-recipe"):** empfängt nur `recipeId` → echte IP aus
`X-Forwarded-For` lesen + säubern → existiert `recipeLikes/{ip}_{recipeId}` schon?
Ja → ignorieren. Nein → Dokument anlegen + `likes` im Rezept atomar +1.

## Ordnerstruktur (in src/app)
```
features/   landing, ingredients, preferences, recipe-results, recipe-detail, cookbook, imprint
shared/     header, loader, error-dialog, recipe-card
core/
  models/   ingredient.ts, recipe-request.ts, recipe.ts  (= die JSON-Verträge als TS-Typen)
  services/ recipe-api.ts (spricht mit n8n), ingredient-data.ts
```
- `assets/data/ingredients.json` = lokale Autocomplete-Liste (KEINE externe API).
- `assets/images/` = feste Kategorie-Bilder fürs Cookbook (kein Bild pro Rezept).

## Angular-22-Konventionen
- Dateinamen: kebab-case, KEIN Typ-Suffix → `home.ts`, nicht `home.component.ts`.
- Organisation nach Feature, nicht nach Dateityp (kein `components/`-Ordner im Feature).
- `inject()` statt Constructor-Injection.
- Eine Komponente/Service pro Datei. Tests als `*.spec.ts` daneben.

## Offene Punkte / nächste Schritte
- **Gemini-Prompt-Design:** Gemini zu gültigem JSON (Vertrag 2) zwingen; ≥70 % der Nutzer-Zutaten verwenden; ≤3 Extra-Zutaten; Schritte auf die Köche aufteilen.
- **Routing:** Zurück-Button kontextabhängig — vom Generator → zurück zu den Ergebnissen; vom Cookbook → zurück zum Cookbook.
- **Walking Skeleton zuerst:** Angular → n8n → festes Beispielrezept → Anzeige. Erst danach echte KI, dann Firestore, dann Quota.
- Cookbook: Paginierung ab 20 Rezepten, Filter nach `cuisine`, "Most liked" nach `likes`.

## Arbeitsweise
- Nach jeder Session committen, klare Commit-Messages. n8n-Projekt ebenfalls ins Git.
- `.gitignore`: `node_modules`, `dist`, `.angular` u.ä. — `src/environments/` wird
  COMMITTED (enthält nur öffentliche Werte; ohne sie baut das Projekt nicht).
- Bei Widerspruch Checkliste vs. Design-PDF gewinnt die Checkliste
  (Zeitkategorien: quick ≤20 / medium 20–45 / complex 45+; Paginierung: 20 pro Seite).
- Tippfehler aus dem Design ("Coocking", "Recipie", "Cousine") NICHT übernehmen.
