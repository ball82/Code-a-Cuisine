# Code à Cuisine — Projekt-Kontext für die Frontend-Entwicklung

> Diese Datei ins Angular-Repo legen (z.B. als `docs/PROJEKT-KONTEXT.md`).
> Sie enthält alles, was das Frontend über das Backend wissen muss.
> Stand: Backend komplett fertig (n8n + Firestore + Security Rules).

---

## 1. Was das Frontend tun muss

| Feature | Datenquelle / Endpoint |
|---|---|
| Cookbook anzeigen (alle Rezepte) | **Firestore direkt lesen** (Collection `recipes`, read-only) |
| Rezepte generieren | `POST` an n8n-Webhook `generate-recipe` |
| Rezept liken/entliken (Toggle) | `POST` an n8n-Webhook `like-recipe` |

**Wichtig — Lese-/Schreib-Trennung:** Das Frontend liest `recipes` direkt über das Firebase-Web-SDK. Es schreibt **niemals** direkt in Firestore — jedes Schreiben läuft über n8n. Die Security Rules blockieren Client-Writes ohnehin.

**Der Gemini-API-Key existiert im Frontend nicht.** Er liegt nur in n8n.

---

## 2. Endpoints (n8n Production-URLs)

```
POST https://<n8n-instanz>.app.n8n.cloud/webhook/generate-recipe
POST https://<n8n-instanz>.app.n8n.cloud/webhook/like-recipe
```

→ Die konkreten URLs in `environment.ts` pflegen, nicht hartcodieren.

```typescript
// environment.ts (Beispielstruktur)
export const environment = {
  production: false,
  n8n: {
    generateRecipeUrl: 'https://<instanz>.app.n8n.cloud/webhook/generate-recipe',
    likeRecipeUrl: 'https://<instanz>.app.n8n.cloud/webhook/like-recipe',
  },
  firebase: {
    // Firebase-Web-Config aus der Firebase Console
    // (apiKey hier ist öffentlich & unkritisch — echte Sicherheit machen die Rules)
  },
};
```

---

## 3. API-Verträge

### 3.1 Rezepte generieren

**Request (Vertrag 1):**

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

**Erlaubte Werte** (technische Kleinbuchstaben-Werte — die UI zeigt eigene Anzeigetexte):

| Feld | Werte |
|---|---|
| `unit` | `gram`, `ml`, `liter`, `piece` |
| `cookingTime` | `quick`, `medium`, `complex` |
| `cuisine` | `german`, `italian`, `japanese`, `indian`, `gourmet`, `fusion` |
| `diet` | `vegetarian`, `vegan`, `keto`, `none` |

**Validierung (in Angular VOR dem Senden — Backend prüft nochmal):**
- `ingredients`: mindestens 1 Eintrag; je Eintrag `name` nicht leer, `amount > 0`, `unit` aus Liste
- `portions`: ganze Zahl 1–12 (Default 2)
- `cooks`: ganze Zahl 1–3
- `cookingTime`, `cuisine`, `diet`: nur Werte aus der Liste

**Response 200 (Vertrag 2):**

```json
{
  "recipes": [{
    "id": "bl7dHPQikw8eKNMEBVqs",
    "title": "Quick Vegetarian Pasta al Pomodoro",
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
    "createdAt": "2026-06-13T22:26:48.441Z"
  }]
}
```

Immer genau 3 Rezepte. Nährwerte sind **pro Portion** — bei Portionsänderung in der UI skaliert das Frontend selbst. Max. 3 `extraIngredients`. `chef` läuft von 1 bis `cooks`.

**Fehler-Responses:**

| Code | Body | UI-Verhalten |
|---|---|---|
| 400 | `{ "error": "Invalid input", "details": ["portions must be…", …] }` | Sollte nie auftreten, wenn Frontend-Validierung greift. Generische Fehlermeldung zeigen. |
| 429 | `{ "error": "quota_exceeded", "reason": "ip_limit" }` | „Du hast dein Tageslimit von 3 Rezept-Generierungen erreicht. Versuch es morgen wieder!" |
| 429 | `{ "error": "quota_exceeded", "reason": "daily_limit" }` | „Der Rezeptgenerator ist für heute ausgelastet. Versuch es morgen wieder!" |
| 5xx / Timeout | – | „Etwas ist schiefgelaufen, bitte später erneut versuchen." |

**Hinweis Antwortzeit:** Der Gemini-Aufruf dauert 10–20 Sekunden. UI braucht einen Ladezustand (Spinner/Skeleton, Button deaktivieren, evtl. Fortschrittstext).

### 3.2 Like togglen

**Request:** `{ "recipeId": "bl7dHPQikw8eKNMEBVqs" }`

**Response 200:** `{ "liked": true, "newLikeCount": 5 }`
- `liked: true` → Nutzer hat jetzt geliked (Herz gefüllt anzeigen)
- `liked: false` → Like wurde zurückgenommen (Herz leer)
- `newLikeCount` direkt in die Anzeige übernehmen (kein Firestore-Nachladen nötig)

**Response 400:** `{ "error": "Invalid input", "details": [...] }`

**⚠️ Pflicht im Frontend:** Like-Button nach Klick für ~500 ms deaktivieren (Doppelklick-Schutz). Das Backend sichert schnelle Doppel-Requests bewusst NICHT per Transaktion ab — der Schutz liegt beim Client.

---

## 4. TypeScript-Interfaces (Vorschlag)

```typescript
// models/recipe.model.ts

export type Unit = 'gram' | 'ml' | 'liter' | 'piece';
export type CookingTime = 'quick' | 'medium' | 'complex';
export type Cuisine = 'german' | 'italian' | 'japanese' | 'indian' | 'gourmet' | 'fusion';
export type Diet = 'vegetarian' | 'vegan' | 'keto' | 'none';

export interface Ingredient {
  name: string;
  amount: number;
  unit: Unit;
}

export interface Direction {
  step: number;
  title: string;
  chef: number; // 1..cooks
  instruction: string;
}

export interface NutritionPerPortion {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

export interface Recipe {
  id: string;
  title: string;
  cuisine: string;
  tags: string[];
  cookingTimeMinutes: number;
  portions: number;
  cooks: number;
  nutritionPerPortion: NutritionPerPortion;
  yourIngredients: Ingredient[];
  extraIngredients: Ingredient[];
  directions: Direction[];
  likes: number;
  createdAt: string; // ISO
}

// Vertrag 1 (Request)
export interface GenerateRecipeRequest {
  ingredients: Ingredient[];
  portions: number;   // 1..12
  cooks: number;      // 1..3
  cookingTime: CookingTime;
  cuisine: Cuisine;
  diet: Diet;
}

// Vertrag 2 (Response)
export interface GenerateRecipeResponse {
  recipes: Recipe[];
}

// Like
export interface LikeRequest {
  recipeId: string;
}
export interface LikeResponse {
  liked: boolean;
  newLikeCount: number;
}

// Fehler
export interface ApiError {
  error: string; // "Invalid input" | "quota_exceeded"
  details?: string[];
  reason?: 'ip_limit' | 'daily_limit';
}
```

---

## 5. Firestore-Anbindung (Cookbook lesen)

Collection: `recipes` — Felder entsprechen dem `Recipe`-Interface (ohne `id`, die kommt aus der Doc-ID).

```typescript
// Beispiel mit @angular/fire
import { collection, collectionData, query, orderBy } from '@angular/fire/firestore';

const recipesRef = collection(this.firestore, 'recipes');
const q = query(recipesRef, orderBy('createdAt', 'desc'));
this.recipes$ = collectionData(q, { idField: 'id' }) as Observable<Recipe[]>;
```

**Sortierung nach Beliebtheit** ist möglich: `orderBy('likes', 'desc')` — `likes` ist garantiert eine echte Zahl (Backend initialisiert per Firestore-Transform).

**Security Rules (bereits deployed):**
- `recipes`: read öffentlich, write gesperrt
- `ipUsage`, `dailyUsage`, `recipeLikes`: komplett gesperrt für Clients

→ Versuche, vom Client zu schreiben oder andere Collections zu lesen, schlagen mit `permission-denied` fehl. Das ist gewollt.

---

## 6. Firestore-Datenmodell (Vollständigkeit halber — Frontend nutzt nur `recipes`)

| Collection | Doc-ID | Inhalt | Frontend-Zugriff |
|---|---|---|---|
| `recipes` | Auto-ID (20 Zeichen alphanumerisch) | Rezepte (siehe Interface) | read-only |
| `ipUsage` | `{ip}_{YYYY-MM-DD}` | `count` (Limit 3/Tag) | keiner |
| `dailyUsage` | `{YYYY-MM-DD}` | `count` (Limit 12/Tag) | keiner |
| `recipeLikes` | `{ip}_{recipeId}` | `createdAt` — Existenz = geliked | keiner |

Das Backend identifiziert Nutzer per IP (aus `X-Forwarded-For`, serverseitig gelesen). Das Frontend schickt **keine** IP mit — das Backend vertraut dem Client nicht.

Konsequenz für die UI: Das Frontend **weiß nicht**, ob der Nutzer ein Rezept bereits geliked hat (der Marker liegt in einer gesperrten Collection). Herz-Zustand daher optimistisch behandeln: Zustand aus der Like-Response übernehmen und z.B. im localStorage/sessionStorage des Browsers merken. Nach dem ersten Klick ist der Zustand durch `liked` in der Antwort ohnehin bekannt.

---

## 7. UX-Anforderungen aus der Backend-Architektur

1. **Ladezustand beim Generieren:** 10–20 s Gemini-Laufzeit → Spinner + Button sperren
2. **Like-Button debouncen:** nach Klick ~500 ms deaktivieren (Race-Condition-Schutz)
3. **Quota-Meldungen freundlich formulieren** (siehe Tabelle in 3.1) — der 429er ist kein „Fehler", sondern ein normaler Zustand
4. **Nährwerte skalieren:** Werte sind pro Portion; bei Portions-Regler in der UI multiplizieren
5. **Kochschritte nach `chef` gruppierbar anzeigen** (z.B. zwei Spalten bei 2 Köchen), bei `cooks: 1` normale Liste
6. **Frontend-Validierung** exakt spiegelbildlich zur Backend-Validierung (Abschnitt 3.1) — das Backend lehnt sonst mit 400 ab

---

## 8. Offene Punkte / Roadmap

- [ ] Angular-Projekt aufsetzen (Angular 22, @angular/fire)
- [ ] Eingabeformular (Zutaten dynamisch hinzufügen/entfernen, Dropdowns für Präferenzen)
- [ ] Ergebnis-Ansicht (3 Rezeptkarten nach Generierung)
- [ ] Cookbook (Liste aus Firestore, Sortierung neu/beliebt)
- [ ] Rezept-Detailseite (Zutaten, Schritte nach Koch, Nährwerte mit Portions-Skalierung)
- [ ] Like-Button mit Toggle-Zustand
- [ ] Fehler-/Quota-Handling (Toasts/Banner)
- [ ] Optional Backend-Nachrüstung: IP-Hashing (Datenschutz), TTL-Policy für alte `ipUsage`-Dokumente

---

## 9. Backend-Referenz (falls Debugging nötig)

- n8n-Workflows: `recipe-generator`, `like-recipe`, `error-handler` (E-Mail bei technischen Crashes)
- Gemini-Modell: `gemini-3.5-flash` (JSON-Modus, responseSchema) — Modellnamen veralten, bei 404 vom Gemini-Endpoint zuerst Modellnamen prüfen
- Firestore-Region: `europe-west3`, Datenbank `(default)`
- Zähler-Logik: Datum in **UTC** → Tageswechsel um 00:00 UTC (01:00/02:00 Schweizer Zeit)
- Bekannter n8n-Bug: Firestore-Node speichert numerische `0` als `null` → deshalb wird `likes` per REST-Transform initialisiert
