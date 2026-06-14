import { Injectable, signal } from '@angular/core';

import { Ingredient } from '../models/ingredient';
import { CookingTime, Cuisine, Diet, RecipeRequest } from '../models/recipe-request';

/**
 * Hält die Eingaben des Nutzers ZWISCHEN den Generator-Schritten
 * (Step 1 Zutaten → Step 2 Präferenzen → Absenden an n8n).
 *
 * Bewusst als root-Service mit Signals: So bleibt die Zutatenliste erhalten,
 * wenn der Nutzer zwischen den Schritten vor- und zurücknavigiert, ohne dass
 * die einzelnen Feature-Komponenten Daten aneinander durchreichen müssen.
 */
@Injectable({ providedIn: 'root' })
export class RecipeDraft {
  /** Die vom Nutzer in Schritt 1 zusammengestellten Zutaten. */
  readonly ingredients = signal<Ingredient[]>([]);

  /** Schritt 2 — Präferenzen (mit Defaults aus Vertrag 1). */
  readonly portions = signal(2);
  readonly cooks = signal(1);
  readonly cookingTime = signal<CookingTime>('quick');
  readonly cuisine = signal<Cuisine>('italian');
  readonly diet = signal<Diet>('none');

  /** Baut den Request (Vertrag 1) aus dem aktuellen Entwurf zusammen. */
  toRequest(): RecipeRequest {
    return {
      ingredients: this.ingredients(),
      portions: this.portions(),
      cooks: this.cooks(),
      cookingTime: this.cookingTime(),
      cuisine: this.cuisine(),
      diet: this.diet()
    };
  }
}
