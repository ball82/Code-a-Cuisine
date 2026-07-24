import { Ingredient } from './ingredient';

/** Allowed time categories (quick ≤20 / medium 20–45 / complex 45+ minutes). */
export type CookingTime = 'quick' | 'medium' | 'complex';

/** Allowed cuisine styles. */
export type Cuisine =
  | 'german'
  | 'italian'
  | 'japanese'
  | 'indian'
  | 'gourmet'
  | 'fusion';

/** Display labels for the cuisine styles (technical value → UI label). */
export const CUISINE_LABELS: Record<Cuisine, string> = {
  german: 'German',
  italian: 'Italian',
  japanese: 'Japanese',
  indian: 'Indian',
  gourmet: 'Gourmet',
  fusion: 'Fusion'
};

/** Allowed diets. */
export type Diet = 'vegetarian' | 'vegan' | 'keto' | 'none';

/** Contract 1 — request from Angular to the n8n webhook. */
export interface RecipeRequest {
  ingredients: Ingredient[];
  /** Integer 1–12 (default 2). */
  portions: number;
  /** Integer 1–3. */
  cooks: number;
  cookingTime: CookingTime;
  cuisine: Cuisine;
  diet: Diet;
}
