<div align="center">

<img src="public/img/logo_gruen.svg" alt="Code à Cuisine Logo" width="120" />

# Code à Cuisine 🍳

**KI-gestützter Rezeptgenerator** – aus deinen Zutaten entstehen in Sekunden drei fertige Rezepte, die in einem öffentlichen Cookbook für alle sichtbar landen.

[![Angular](https://img.shields.io/badge/Angular-21-DD0031?logo=angular&logoColor=white)](https://angular.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Firebase](https://img.shields.io/badge/Firestore-europe--west3-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com)
[![n8n](https://img.shields.io/badge/n8n-Workflows_as_API-EA4B71?logo=n8n&logoColor=white)](https://n8n.io)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-3.5_Flash-4285F4?logo=googlegemini&logoColor=white)](https://ai.google.dev)
[![Vitest](https://img.shields.io/badge/Tests-Vitest-6E9F18?logo=vitest&logoColor=white)](https://vitest.dev)

</div>

---

## Inhaltsverzeichnis

- [Über das Projekt](#über-das-projekt)
- [Features](#features)
- [Tech-Stack](#tech-stack)
- [Architektur](#architektur)
- [User-Flow](#user-flow)
- [Projektstruktur](#projektstruktur)
- [Schnellstart (Frontend)](#schnellstart-frontend)
- [Backend-Setup (n8n + Firebase)](#backend-setup-n8n--firebase)
- [Backend-Workflows (n8n)](#backend-workflows-n8n)
- [API-Verträge](#api-verträge)
- [Datenmodell & Security](#datenmodell--security)
- [Lessons Learned](#lessons-learned)
- [Roadmap](#roadmap)
- [Autor & Lizenz](#autor--lizenz)

---

## Über das Projekt

**Code à Cuisine** löst das alltägliche „Was koche ich heute?" mit dem, was gerade im Kühlschrank liegt. Du gibst deine verfügbaren Zutaten und ein paar Präferenzen ein – Portionen, Anzahl Köche, Küchenstil, Ernährungsform, Zeitbudget – und Google Gemini erzeugt **drei vollständige Rezepte** inklusive Nährwerten, Kochschritten und einer sinnvollen Aufteilung auf mehrere Köche. Jedes generierte Rezept wandert automatisch in ein **öffentliches Cookbook**, das ganz ohne Account durchstöbert und geliked werden kann.

Das Projekt zeigt eine bewusst schlanke, sichere Architektur: Ein **Angular-Frontend** ohne serverseitigen Code, das **komplette Backend als n8n-Workflows** (Low-Code als API), **Firestore** als Datenbank und **Gemini** als KI – ohne dass je ein API-Key den Browser erreicht.

---

## Features

- 🤖 **KI-Rezeptgenerierung** – aus deinen Zutaten entstehen 3 komplette Rezepte mit Nährwerten pro Portion, nummerierten Kochschritten und Chef-Aufteilung (bis zu 3 Köche, inkl. parallel laufender Schritte).
- 📖 **Öffentliches Cookbook** – jedes generierte Rezept ist sofort für alle sichtbar, filterbar nach Küchenstil – ganz ohne Login.
- ❤️ **Like-System** – Rezepte lassen sich liken/entliken (Instagram-Toggle, ein Like pro Nutzer), atomar serverseitig gezählt.
- 🍽️ **6 Küchenstile & 4 Ernährungsformen** – German, Italian, Japanese, Indian, Gourmet, Fusion · vegetarian, vegan, keto, none.
- 🛡️ **Quota-Schutz** – 3 Generierungen pro Nutzer/Tag und 12 systemweit pro Tag, transparent im UI angezeigt – schützt vor Kosten- und Missbrauchsspitzen.
- 🔒 **Keine Secrets im Client** – der Gemini-Key existiert ausschließlich als n8n-Credential; das Frontend liest Rezepte read-only direkt aus Firestore.
- ⚡ **Moderne Angular-Basis** – standalone Components, Signals und SCSS auf Angular 21.

---

## Tech-Stack

| Schicht | Technologie |
|---|---|
| **Frontend** | Angular 21 · TypeScript 5.9 · RxJS · SCSS (standalone Components, Signals) |
| **Backend** | n8n Cloud – Workflows als API (kein eigener Server-Code) |
| **KI** | Google Gemini (`gemini-3.5-flash`, JSON-Modus mit `responseSchema`) |
| **Datenbank** | Firebase Firestore (Region `europe-west3`) |
| **Tests** | Vitest + jsdom |
| **Fehler-Alerting** | E-Mail via SMTP (n8n Error-Trigger-Workflow) |
| **Tooling** | Angular CLI · Prettier |

---

## Architektur

```
┌─────────────┐   POST (Verträge)   ┌──────────────┐   REST /:commit   ┌───────────┐
│  Angular 21 │ ──────────────────▶ │   n8n Cloud  │ ────────────────▶ │ Firestore │
│  (Frontend) │                     │   (Backend)  │                   │           │
│             │ ◀────────────────── │              │                   │           │
│             │      Antwort        │   ┌────────┐ │                   │           │
│             │ ◀───────────────────┼───│ Gemini │ │                   │           │
└─────────────┘   liest recipes     └───┴────────┴─┘                   └───────────┘
                  direkt (read-only)
```

### Architektur-Prinzipien

1. **API-Keys nur serverseitig** – der Gemini-Key liegt ausschließlich als n8n-Credential vor, niemals im Frontend.
2. **Never trust the client** – jede Validierung läuft in Angular **und** noch einmal in n8n.
3. **Lese-/Schreib-Trennung** – Angular liest `recipes` direkt aus Firestore (read-only via Security Rules); jedes Schreiben läuft über n8n.
4. **Kostenairbag** – billige Prüfungen (Validierung, Quota) laufen **vor** dem teuren Gemini-Aufruf.
5. **Zähler erst nach Erfolg** – die Quota wird erst nach erfolgreichem Speichern erhöht (kein Verbrauch bei Gemini-Fehlern), atomar via Firestore `fieldTransforms.increment`.

---

## User-Flow

```
Landing  →  Zutaten wählen  →  Präferenzen  →  3 Rezepte  →  Rezept-Detail
   /         /ingredients      /preferences   /recipe-results   /recipe/:id
                                                     │
                                                     ▼
                                              Cookbook (öffentlich)
                                               /cookbook · /cookbook/:cuisine
```

1. **Landing** – Hero mit Einstieg in den Generator.
2. **Ingredients** – Zutaten mit Menge & Einheit erfassen (Autocomplete aus lokaler Liste).
3. **Preferences** – Portionen (1–12), Köche (1–3), Küchenstil, Ernährungsform, Zeitbudget.
4. **Recipe Results** – die drei frisch generierten Vorschläge nebeneinander.
5. **Recipe Detail** – Nährwerte, Schritt-für-Schritt-Anleitung, Like-Button.
6. **Cookbook** – öffentliche Bibliothek aller je generierten Rezepte, nach Küche filterbar.

---

## Projektstruktur

```
src/
├── app/
│   ├── core/
│   │   ├── models/          # Typverträge: Recipe, RecipeRequest, Ingredient, Like
│   │   └── services/        # RecipeApi, CookbookData, RecipeStore, QuotaStatus …
│   ├── features/            # Seiten: landing, ingredients, preferences,
│   │   │                    #         recipe-results, recipe-detail,
│   │   │                    #         cookbook, cookbook-category, imprint
│   │   └── …
│   ├── shared/              # Wiederverwendbar: header, loader, recipe-card,
│   │   │                    #                   error-dialog
│   │   └── …
│   ├── app.config.ts        # Provider (Router, HttpClient)
│   └── app.routes.ts        # Routen-Tabelle
├── environments/            # environment.ts (nur öffentliche Werte, wird committed)
└── styles.scss              # globale Styles

public/                      # statische Assets (Logos, Küchen-Illustrationen, ingredients.json)
n8n/                         # exportierte Workflows: recipe-generator, like-recipe, error-handler
```

---

## Schnellstart (Frontend)

### Voraussetzungen

- **Node.js** ≥ 20
- **npm** 10 (`packageManager: npm@10.9.3`)

### Installation & Entwicklung

```bash
# Repository klonen
git clone https://github.com/ball82/Code-a-Cuisine.git
cd Code-a-Cuisine

# Abhängigkeiten installieren
npm install

# Dev-Server starten (öffnet http://localhost:4200 automatisch)
npm start
```

### Weitere Skripte

| Befehl | Zweck |
|---|---|
| `npm start` | Dev-Server mit Live-Reload (`ng serve -o`) |
| `npm run build` | Produktions-Build nach `dist/` |
| `npm run watch` | Kontinuierlicher Development-Build |
| `npm test` | Unit-Tests mit Vitest |

> **Hinweis:** Das Frontend läuft sofort gegen das bereits deployte n8n-Backend – die öffentlichen Webhook- und Firebase-Werte stehen committet in `src/environments/`. Für ein eigenes Backend siehe den nächsten Abschnitt.

---

## Backend-Setup (n8n + Firebase)

1. **Firebase:** Projekt anlegen, Firestore-DB erstellen (Produktionsmodus, `europe-west3`), Service-Konto-Key generieren.
2. **n8n:** Credentials anlegen:
   - *Google Service Account API* – Email + Private Key aus der JSON, Toggle „Set up for use in HTTP Request node" aktivieren, Scope `https://www.googleapis.com/auth/datastore`.
   - *Google Gemini (PaLM) API* – API-Key aus Google AI Studio.
   - *SMTP* – für die Fehler-Mails.
3. Workflows aus `n8n/` importieren, Project-ID in allen Firestore-URLs anpassen.
4. Security Rules veröffentlichen (siehe unten).
5. Workflows aktivieren und die Production-Webhook-URLs in `src/environments/environment.ts` eintragen.

---

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
  ├ Marker fehlt     → Like:   Marker anlegen + likes +1  (atomarer Batch-Commit)
  └ Marker existiert → Unlike: Marker löschen + likes −1  (atomarer Batch-Commit)
→ aktuellen Stand lesen → { liked: bool, newLikeCount: int }
```

### `error-handler`

Error-Trigger-Workflow, mit beiden Hauptworkflows verknüpft. Verschickt bei technischen Abstürzen (Gemini down, Auth-Fehler etc.) eine E-Mail mit Fehlerdetails an den Entwickler. Feuert **nicht** bei fachlichen Antworten (Validierungsfehler, Quota erreicht) – die bekommt der Nutzer als freundliche Meldung.

---

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

Erlaubte Werte (kleingeschrieben): `unit`: `gram|ml|liter|piece` · `cookingTime`: `quick|medium|complex` · `cuisine`: `german|italian|japanese|indian|gourmet|fusion` · `diet`: `vegetarian|vegan|keto|none`

Validierung: `ingredients` ≥ 1 Eintrag, `amount` > 0 · `portions` 1–12 · `cooks` 1–3

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
  }],
  "remaining": 2
}
```

Regeln: Nährwerte pro Portion (Frontend skaliert auf Gesamtwerte) · max. 3 `extraIngredients` · `chef` 1–3, bei 1 Koch alle Schritte `chef: 1` · `remaining` = verbleibende Generierungen des Tages.

### Vertrag 3 — Like togglen

`POST /webhook/like-recipe`

Request: `{ "recipeId": "<firestore-id>", "userId": "<anonyme-id>" }`
Response: `{ "liked": true, "newLikeCount": 5 }`

### Fehler-Antworten

| Code | Body | Bedeutung |
|---|---|---|
| `400` | `{ "error": "Invalid input", "details": [...] }` | Validierung fehlgeschlagen |
| `429` | `{ "error": "quota_exceeded", "reason": "ip_limit" \| "daily_limit" }` | Tageslimit erreicht |

---

## Datenmodell & Security

### Firestore-Collections

| Collection | Doc-ID | Zweck |
|---|---|---|
| `recipes` | Auto-ID (20 Zeichen) | Rezepte fürs Cookbook |
| `ipUsage` | `{cleanIp}_{YYYY-MM-DD}` | Tageszähler pro IP (Limit 3) |
| `dailyUsage` | `{YYYY-MM-DD}` | Systemweiter Tageszähler (Limit 12) |
| `recipeLikes` | `{cleanIp}_{recipeId}` | Existenz = „diese IP hat geliked" |

IPs werden vor Verwendung gesäubert: `.` und `:` → `_` (Firestore-IDs dürfen kein `/` enthalten; IPv6 hat Doppelpunkte). Datum in UTC.

### Security Rules

```
recipes      → read: öffentlich   | write: gesperrt (nur n8n via Service-Konto)
alle anderen → read + write: gesperrt
```

Das n8n-Service-Konto umgeht die Rules (Admin-Zugriff) – die Rules schützen ausschließlich den Client-Zugang.

---

## Lessons Learned

- Die n8n-Firestore-Node speichert numerische `0` als `null` → Workaround: `likes` beim Erstellen weglassen und per `fieldTransforms.increment` mit `integerValue: "0"` initialisieren (Increment auf ein fehlendes Feld **setzt** es).
- Firestore-REST erwartet `integerValue` als **String** (`"1"`, `"-1"`).
- `X-Forwarded-For` kann mehrere IPs enthalten (kommagetrennt) – die erste ist der Nutzer.
- Error-Trigger feuern nur bei Production-Ausführungen, nicht bei manuellen Test-Läufen.
- Gemini-Modellnamen veralten schnell – den Modellnamen zentral halten, um Deprecations mit einem Handgriff nachzuziehen.

---

## Roadmap

- [x] Backend-Workflows (`recipe-generator`, `like-recipe`, `error-handler`)
- [x] Firestore Security Rules
- [x] Angular-Frontend (Eingabeformular, Cookbook, Rezeptdetail, Like-Button)
- [x] Quota-Management inkl. Transparenz-Anzeige im UI
- [ ] IP-Hashing für Datenschutz
- [ ] TTL-Policy für alte Zähler-Dokumente

---

## Autor & Lizenz

Entwickelt von **[bajo-dev.ch](https://bajo-dev.ch)** · Kontakt: `mail@bajo-dev.ch`

Dieses Projekt ist bislang ohne explizite Lizenz veröffentlicht. Für eine Nachnutzung bitte den Autor kontaktieren.

<div align="center">

Mit ❤️ und viel ☕ gebaut.

</div>
