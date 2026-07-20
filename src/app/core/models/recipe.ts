import { Ingredient } from './ingredient';
import { Cuisine } from './recipe-request';

/** Nährwerte – ausschliesslich pro Portion (Frontend rechnet Gesamtwerte = Wert × portions). */
export interface NutritionPerPortion {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

/** Ein einzelner Kochschritt. */
export interface Direction {
  step: number;
  title: string;
  /** Zahl 1–3, mappt auf "Chef 1/2/3". Bei 1 Koch: alle Schritte chef: 1. */
  chef: number;
  instruction: string;
  /**
   * Markiert einen Schritt, der parallel zum vorangehenden läuft (z.B. während
   * einer Wartezeit im Ofen oder von einem zweiten Koch gleichzeitig erledigt).
   * Optional: ältere Rezepte ohne dieses Feld gelten als rein sequenziell.
   */
  parallel?: boolean;
}

/** Vertrag 2 — ein von Gemini erzeugtes, in Firestore gespeichertes Rezept. */
export interface Recipe {
  /** Firestore-Auto-ID. */
  id: string;
  title: string;
  cuisine: Cuisine;
  tags: string[];
  cookingTimeMinutes: number;
  portions: number;
  cooks: number;
  nutritionPerPortion: NutritionPerPortion;
  /** Vom Nutzer beigesteuerte Zutaten. */
  yourIngredients: Ingredient[];
  /** Zusätzlich benötigte Zutaten (maximal 3). */
  extraIngredients: Ingredient[];
  directions: Direction[];
  likes: number;
  /** ISO-Timestamp. */
  createdAt: string;
}

/** Vertrag 2 — Antwort von n8n an Angular: genau 3 Rezepte mit IDs. */
export interface RecipeResponse {
  recipes: Recipe[];
  /**
   * Verbleibende Generierungen für die IP an diesem Tag (US11-Transparenz).
   * Optional: ältere Backend-Versionen liefern das Feld noch nicht.
   */
  remaining?: number;
}
