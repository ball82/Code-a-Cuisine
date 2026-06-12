import { Ingredient } from './ingredient';

/** Erlaubte Zeitkategorien (quick ≤20 / medium 20–45 / complex 45+ Minuten). */
export type CookingTime = 'quick' | 'medium' | 'complex';

/** Erlaubte Küchenstile. */
export type Cuisine =
  | 'german'
  | 'italian'
  | 'japanese'
  | 'indian'
  | 'gourmet'
  | 'fusion';

/** Erlaubte Ernährungsformen. */
export type Diet = 'vegetarian' | 'vegan' | 'keto' | 'none';

/** Vertrag 1 — Anfrage von Angular an den n8n-Webhook. */
export interface RecipeRequest {
  ingredients: Ingredient[];
  /** Ganze Zahl 1–12 (Default 2). */
  portions: number;
  /** Ganze Zahl 1–3. */
  cooks: number;
  cookingTime: CookingTime;
  cuisine: Cuisine;
  diet: Diet;
}
