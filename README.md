# Code à Cuisine 🍳

KI-gestützter Rezeptgenerator. Nutzer geben ihre verfügbaren Zutaten und Präferenzen ein und erhalten drei passende Rezeptvorschläge, die automatisch in einem öffentlichen Cookbook landen.

## Features

- **KI-Rezeptgenerierung** – Google Gemini erstellt aus deinen Zutaten 3 vollständige Rezepte (mit Nährwerten, Kochschritten und Aufteilung auf mehrere Köche)
- **Öffentliches Cookbook** – alle generierten Rezepte sind für jeden sichtbar
- **Like-System** – Rezepte können geliked/entliked werden (Toggle, ein Like pro Nutzer)
- **Quota-Schutz** – 3 Generierungen pro Nutzer/Tag, 12 systemweit pro Tag

## Tech-Stack

| Schicht | Technologie |
|---|---|
| Frontend | Angular 22 |
| Backend | n8n Cloud (Workflows als API) |
| KI | Google Gemini (`gemini-3.5-flash`, JSON-Modus mit responseSchema) |
| Datenbank | Firebase Firestore (europe-west3) |
| Fehler-Alerting | E-Mail via SMTP (Error-Trigger-Workflow) |

## Architektur

```
┌─────────────┐   POST (Verträge)   ┌──────────────┐   REST/:commit   ┌───────────┐
│  Angular 22 │ ──────────────────▶ │  n8n Cloud   │ ───────────────▶ │ Firestore │
│  (Frontend) │                     │  (Backend)   │                  │           │
│             │ ◀────────────────── │              │                  │           │
│             │      read-only      │   ┌────────┐ │                  │           │
│             │ ◀───────────────────┼───│ Gemini │ │                  │           │
└─────────────┘   (recipes direkt)  └───┴────────┴─┘                  └───────────┘
```

### Architektur-Prinzipien

1. **API-Keys nur serverseitig** – Gemini-Key liegt ausschließlich als n8n-Credential vor, nie im Frontend
2. **Never trust the client** – alle Validierungen laufen in Angular UND nochmals in n8n
3. **Lese-/Schreib-Trennung** – Angular liest `recipes` direkt aus Firestore (read-only via Security Rules); jedes Schreiben läuft über n8n
4. **Kostenairbag** – billige Prüfungen (Validierung, Quota) laufen VOR dem teuren Gemini-Aufruf
5. **Zähler erst nach Erfolg** – Quota wird erst nach erfolgreichem Speichern erhöht (kein Verbrauch bei Gemini-Fehlern), atomar via Firestore `fieldTransforms.increment`

## Backend-Workflows (n8n)

### `recipe-generator`

```
Webhook → IP/Datum/IDs säubern → Eingaben validieren → IF
  ├ ungültig → 400 (Fehlerliste)
  └ gültig   → ipUsage lesen → dailyUsage lesen → Quota-Tor
                 ├ gesperrt → 429 (quota_exceeded)
                 └ frei     → Gemini (JSON-Modus + responseSchema)
                              → Antwort validieren (genau 3 Rezepte, ≤3 Extra-Zutaten)
                              → 3 Rezepte speichern
                              → likes initialisieren (Transform, echte Integer-0)
                              → Zähler atomar +1 (ipUsage, dailyUsage)
                              → 200 (Vertrag 2 mit Firestore-IDs)
```

### `like-recipe`

Toggle-Verhalten wie ein Instagram-Herz:

```
Webhook → IP säubern + recipeId validieren → Marker lesen (recipeLikes)
  ├ Marker fehlt    → Like:   Marker anlegen + likes +1  (atomarer Batch-Commit)
  └ Marker existiert → Unlike: Marker löschen + likes −1 (atomarer Batch-Commit)
→ aktuellen Stand lesen → { liked: bool, newLikeCount: int }
```

### `error-handler`

Error-Trigger-Workflow, mit beiden Hauptworkflows verknüpft. Verschickt bei technischen Abstürzen (Gemini down, Auth-Fehler etc.) eine E-Mail mit Fehlerdetails an den Entwickler. Feuert NICHT bei fachlichen Antworten (Validierungsfehler, Quota erreicht) – die bekommt der Nutzer als freundliche Meldung.

## Firestore-Datenmodell

| Collection | Doc-ID | Zweck |
|---|---|---|
| `recipes` | Auto-ID (20 Zeichen) | Rezepte fürs Cookbook |
| `ipUsage` | `{cleanIp}_{YYYY-MM-DD}` | Tageszähler pro IP (Limit 3) |
| `dailyUsage` | `{YYYY-MM-DD}` | Systemweiter Tageszähler (Limit 12) |
| `recipeLikes` | `{cleanIp}_{recipeId}` | Existenz = „diese IP hat geliked" |

IPs werden vor Verwendung gesäubert: `.` und `:` → `_` (Firestore-IDs dürfen kein `/` enthalten; IPv6 hat Doppelpunkte). Datum in UTC.

## Security Rules (Firestore)

```
recipes      → read: öffentlich   | write: gesperrt (nur n8n via Service-Konto)
alle anderen → read + write: gesperrt
```

Das n8n-Service-Konto umgeht die Rules (Admin-Zugriff) – die Rules schützen ausschließlich den Client-Zugang.

## API-Verträge

### Vertrag 1 — Rezepte generieren (Request an n8n)

`POST /webhook/generate-recipe`

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

Erlaubte Werte (kleingeschrieben): `unit`: gram|ml|liter|piece · `cookingTime`: quick|medium|complex · `cuisine`: german|italian|japanese|indian|gourmet|fusion · `diet`: vegetarian|vegan|keto|none

Validierung: ingredients ≥ 1 Eintrag, amount > 0 · portions 1–12 · cooks 1–3

### Vertrag 2 — Response

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

Regeln: Nährwerte pro Portion (Frontend skaliert) · max. 3 `extraIngredients` · `chef` 1–3, bei 1 Koch alle Schritte `chef: 1`

### Vertrag 3 — Like togglen

`POST /webhook/like-recipe`

Request: `{ "recipeId": "<firestore-id>" }`
Response: `{ "liked": true, "newLikeCount": 5 }`

### Fehler-Antworten

| Code | Body | Bedeutung |
|---|---|---|
| 400 | `{ "error": "Invalid input", "details": [...] }` | Validierung fehlgeschlagen |
| 429 | `{ "error": "quota_exceeded", "reason": "ip_limit" \| "daily_limit" }` | Tageslimit erreicht |

## Setup (Backend)

1. **Firebase:** Projekt anlegen, Firestore-DB erstellen (Produktionsmodus, europe-west3), Service-Konto-Key generieren
2. **n8n:** Credentials anlegen:
   - *Google Service Account API* (Email + Private Key aus der JSON, Toggle „Set up for use in HTTP Request node" aktivieren, Scope: `https://www.googleapis.com/auth/datastore`)
   - *Google Gemini(PaLM) Api* (API-Key aus Google AI Studio)
   - *SMTP* für Error-Mails
3. Workflows importieren, Project-ID in allen Firestore-URLs anpassen
4. Security Rules veröffentlichen
5. Workflows aktivieren, Production-URLs ins Frontend-Environment eintragen

## Lessons Learned

- Die n8n-Firestore-Node speichert numerische `0` als `null` → Workaround: `likes` beim Erstellen weglassen und per `fieldTransforms.increment` mit `integerValue: "0"` initialisieren (Increment auf fehlendes Feld **setzt** es)
- Firestore-REST erwartet `integerValue` als **String** (`"1"`, `"-1"`)
- `X-Forwarded-For` kann mehrere IPs enthalten (kommagetrennt) – die erste ist der Nutzer
- Error-Trigger feuern nur bei Production-Ausführungen, nicht bei manuellen Test-Läufen
- Gemini-Modellnamen veralten schnell (2.0-flash wurde Juni 2026 abgeschaltet) – Modellname zentral halten

## Roadmap

- [x] Backend-Workflows (recipe-generator, like-recipe, error-handler)
- [x] Firestore Security Rules
- [x] Angular-Frontend (Eingabeformular, Cookbook, Rezeptdetail, Like-Button)
- [ ] Optional: IP-Hashing für Datenschutz, TTL-Policy für alte Zähler-Dokumente
