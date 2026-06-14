# Code à Cuisine

KI-Rezeptgenerator. Nutzer gibt vorhandene Zutaten + Präferenzen ein, bekommt 3
Rezeptvorschläge. Alle generierten Rezepte landen in einer öffentlichen Bibliothek
(Cookbook). Ziel: Lebensmittelverschwendung reduzieren.

DIE SEITE AUF ENGLISCH ERSTELLEN

---

## 🟢 Projekt-Status (Stand: 2026-06-14)

**Backend (n8n) — KOMPLETT FERTIG:**
- ✅ Workflow `recipe-generator` — voller Pfad inkl. Quota-Airbag, Gemini, Firestore-Speichern, Zähler.
- ✅ Workflow `like-recipe` — Toggle-Verhalten (like/unlike wie Instagram-Herz).
- ✅ Workflow `error-handler` — SMTP-Alarm bei echten Exceptions, mit beiden Workflows verknüpft.

**Firebase — KOMPLETT FERTIG:**
- ✅ Projekt + Firestore (`europe-west3`, default-DB) eingerichtet.
- ✅ Service-Konto eingerichtet (Scope `datastore`, in n8n als Credential).
- ✅ **Security Rules publiziert + getestet** (Rules Playground: `read` auf `recipes` = Allow, `create` = Deny; n8n schreibt über Service-Account weiter durch).
- ✅ Gemini-API-Key als n8n-Credential hinterlegt.
- ✅ SMTP-Versand über green.ch funktioniert (Error-Mails).

**👉 AKTUELLER ARBEITSSCHRITT: Frontend-Integration (Angular 22).** Siehe Abschnitt
„Frontend-Integration" weiter unten.

---

## Tech-Stack
- **Frontend:** Angular 22 (standalone, Signals, `inject()`, KEIN NgModule)
- **Backend:** n8n Cloud (Workflows = das Backend) — fertig
- **KI:** Google Gemini `gemini-2.5-flash` (JSON-Modus / structured output mit `responseSchema`)
- **DB:** Firebase Firestore (`europe-west3`, default-DB)
- **Firestore-Zugriff (Frontend):** AngularFire (`@angular/fire`) — offizielle Angular-Hülle über das Firebase JS SDK

## Architektur / Datenfluss
Angular → n8n-Webhook → Validierung → Quota-Tor → Gemini → Firestore speichern → Antwort an Angular.

**Lese-/Schreib-Trennung (jetzt per Security Rules ERZWUNGEN, nicht nur Konvention):**
- LESEN: Angular liest `recipes` DIREKT via Firebase SDK / AngularFire (Cookbook, ohne Account).
- SCHREIBEN: ausschließlich über n8n mit Service-Account (umgeht Rules legitim auf Admin-Ebene).
- Security Rules live: `recipes` read-only für Clients (`read: true`, `write: false`);
  `ipUsage` / `dailyUsage` / `recipeLikes` für Clients komplett dicht (`read, write: false`);
  Sicherheitsnetz `/{document=**}` → alles andere standardmäßig verboten.
- LIKES: eigener zweiter n8n-Webhook — IP MUSS serverseitig aus dem Header
  ermittelt werden, der Client darf seine IP nie selbst melden.

**Sicherheitsregeln (nicht verhandelbar):**
- Gemini-API-Key liegt NUR in n8n (als Credential), NIE im Angular-Code.
- Webhook-URLs + öffentliche Firebase-Config gehören in `src/environments/` (werden committed — enthalten keine Geheimnisse).
- "Never trust the client": Jede Validierung passiert in Angular UND nochmals in n8n.

## JSON-Vertrag 1 — Angular → n8n (Request für `recipe-generator`)
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

## JSON-Vertrag 2 — n8n → Angular (Response von `recipe-generator`)
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

## JSON-Vertrag 3 — `like-recipe` (zweiter Webhook)
- Request: `{ "recipeId": "<id>" }`
- Response: `{ "liked": <bool>, "newLikeCount": <int> }`
- Toggle-Verhalten: war noch nicht geliked → liken (`liked: true`); war schon geliked → unliken (`liked: false`).

## HTTP-Status-Codes der Webhook-Antworten (`recipe-generator`)
- `200` — Erfolg (Vertrag 2, Rezepte MIT IDs).
- `400` — Validierungsfehler (Vertrag 1 verletzt). Freundliche Meldung, KEIN Gemini-Call.
- `429` — Quota erschöpft (`quota_exceeded`). Freundliche Meldung, KEIN Gemini-Call.
- Echte Exceptions (Absturz) → kein Nutzer-relevanter Code, sondern `error-handler` → E-Mail an Entwickler.

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
- **`ipUsage`** — Doc-ID `{cleanIp}_{date}` (z.B. `203_0_113_5_2026-06-09`). Feld: `count`. Limit 3/IP/Tag.
- **`dailyUsage`** — Doc-ID `{date}` (YYYY-MM-DD, UTC). Feld: `count`. Limit 12/Tag systemweit.
- **`recipeLikes`** — Doc-ID `{cleanIp}_{recipeId}`. Existenz = "diese IP hat geliked". Feld: `createdAt`.
- Firestore-IDs dürfen KEINE `/` enthalten. IP vor Verwendung säubern:
  **Punkte UND Doppelpunkte durch `_` ersetzen** (Doppelpunkte wichtig wegen IPv6).

## n8n-Workflows — Aufbau (FERTIG, hier dokumentiert)

### `recipe-generator` ✅
Reihenfolge wichtig: billige Prüfungen VOR teurem Gemini = "Kostenairbag".
```
Webhook → IP/Datum/IDs säubern → Eingaben validieren → IF
  ├ false → Respond 400 (Validierungsfehler)
  └ true  → ipUsage lesen → dailyUsage lesen → Quota prüfen → Quota-Tor (IF)
              ├ true (gesperrt) → Respond 429 (quota_exceeded)
              └ false (frei)    → Gemini-Prompt bauen → Gemini aufrufen
                                    (gemini-2.5-flash, JSON-Modus + responseSchema)
                                  → Gemini-Antwort prüfen (genau 3 Items, ≤3 extraIngredients)
                                  → Server-Felder ergänzen (likes:0, createdAt)
                                  → In Firestore-Format (typisiertes REST-JSON)
                                  → Rezept speichern (HTTP POST an Firestore REST, läuft 3×)
                                  → Ergebnisse bündeln (3 Auto-IDs, Items auf 1 reduzieren)
                                  → ipUsage hochsetzen (atomar +1 via fieldTransforms)
                                  → dailyUsage hochsetzen (atomar +1)
                                  → Antwort bauen (Vertrag 2 mit IDs)
                                  → Respond 200
```
Zähler werden ERST nach erfolgreichem Speichern erhöht (fehlgeschlagener Gemini-Call kostet keine Quota).

### `like-recipe` ✅ (Toggle wie Instagram-Herz)
```
Webhook → Vorbereiten/Validieren (IP säubern, recipeId-Format prüfen) → IF
  ├ false → Respond 400
  └ true  → Marker lesen (recipeLikes/{cleanIp}_{recipeId}) → Aktion entscheiden
              → Switch (action: like/unlike)
                ├ like   → Batch-Commit: recipeLikes anlegen + recipes.likes +1
                └ unlike → Batch-Commit: recipeLikes löschen + recipes.likes -1
              → Aktuelle Likes lesen → Antwort bauen → Respond 200
```
Race-Condition bei sehr schnellen Doppel-Klicks bewusst NICHT via Firestore-Transaktion
abgesichert → **Frontend muss den Button nach Klick kurz deaktivieren.**

### `error-handler` ✅
`Error Trigger → Send Email (SMTP green.ch)` an Entwickler. Mit beiden Workflows
verknüpft (Workflow Settings → Error Workflow). Feuert NUR bei echten Exceptions,
NICHT bei Validierungs- (400) oder Quota-Antworten (429).

## ⚠️ Wichtige Lehren aus dem n8n-Bau (nicht vergessen!)
- **n8n-Firestore-Node speichert numerisches `0` als `null` (Bug).** Workaround: HTTP-Request
  direkt gegen die Firestore REST API (`:commit`) mit selbst typisierten Werten
  (`stringValue` / `integerValue` / `arrayValue` / `mapValue`).
- **Service-Account-Credential** braucht Scope `https://www.googleapis.com/auth/datastore`,
  zu aktivieren über Toggle "Set up for use in HTTP Request node".
- **Atomare Counter** via `fieldTransforms.increment` mit `integerValue` als String (`"1"` / `"-1"`).
- **Datum immer in UTC:** `new Date().toISOString().slice(0,10)`.

## Frontend-Integration (Angular 22) — AKTUELLER SCHRITT
Reihenfolge der Teilschritte:
1. **Firebase einbinden:** öffentliche Firebase-Config + AngularFire in `app.config.ts`
   (`provideFirebaseApp`, `provideFirestore`). Config in `src/environments/`.
2. **`Recipe`-Modell** als TS-Interface (spiegelt Vertrag 2) in `core/models/recipe.ts`.
3. **Lese-Pfad:** Service zieht `recipes`-Collection live aus Firestore → Cookbook anzeigen.
4. **Schreib-Pfad 1 (Generator):** Formular → in Angular validieren → POST an `recipe-generator`-Webhook → 3 Vorschläge.
5. **Schreib-Pfad 2 (Likes):** Herz-Button → POST an `like-recipe`-Webhook → Button kurz sperren (Race-Condition).

### ⚠️ Zu klärende Punkte beim Frontend
- **CORS:** n8n-Webhook muss Browser-Requests von der Angular-Domain erlauben
  (Webhook-Response-Header / "Allowed Origins"), sonst blockt der Browser.
- **Production-Webhook-URLs** (nicht die Test-URLs!) in `src/environments/` eintragen.
- **„Welche Rezepte hat DIESE IP geliked?"** — `recipeLikes` ist für Clients gesperrt
  UND nach Server-IP geschlüsselt. Das Frontend kann den Like-Status beim Laden des
  Cookbooks also NICHT direkt aus Firestore lesen. Herzen starten leer.
  Lösungsoptionen (noch zu entscheiden): localStorage im Browser ODER kleiner
  Read-Endpoint in n8n. Bewusste Design-Entscheidung, kein Bug.

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

## Offene Punkte / nächste Schritte (nach dem Frontend-Walking-Skeleton)
- **Gemini-Prompt-Design verfeinern:** ≥70 % der Nutzer-Zutaten verwenden; ≤3 Extra-Zutaten; Schritte sauber auf die Köche aufteilen. (Workflow läuft bereits, Prompt-Qualität iterieren.)
- **Routing:** Zurück-Button kontextabhängig — vom Generator → zurück zu den Ergebnissen; vom Cookbook → zurück zum Cookbook.
- **Walking Skeleton zuerst:** Angular → n8n → echtes Rezept → Anzeige durchstechen, dann verfeinern.
- **Cookbook:** Paginierung ab 20 Rezepten, Filter nach `cuisine`, "Most liked" nach `likes`.

## Arbeitsweise
- Nach jeder Session committen, klare Commit-Messages. n8n-Projekt ebenfalls ins Git.
- `.gitignore`: `node_modules`, `dist`, `.angular` u.ä. — `src/environments/` wird
  COMMITTED (enthält nur öffentliche Werte; ohne sie baut das Projekt nicht).
- Bei Widerspruch Checkliste vs. Design-PDF gewinnt die Checkliste
  (Zeitkategorien: quick ≤20 / medium 20–45 / complex 45+; Paginierung: 20 pro Seite).
- Tippfehler aus dem Design ("Coocking", "Recipie", "Cousine") NICHT übernehmen.