import { Injectable, signal } from '@angular/core';

import { Ingredient } from '../models/ingredient';
import { CookingTime, Cuisine, Diet, RecipeRequest } from '../models/recipe-request';

/**
 * Holds the user's input BETWEEN the generator steps
 * (step 1 ingredients → step 2 preferences → submit to n8n).
 *
 * Deliberately a root service with signals: this way the ingredient list is
 * preserved when the user navigates back and forth between the steps, without
 * the individual feature components having to pass data to one another.
 */
@Injectable({ providedIn: 'root' })
export class RecipeDraft {
  /** The ingredients assembled by the user in step 1. */
  readonly ingredients = signal<Ingredient[]>([]);

  /** Step 2 — preferences (with defaults from Contract 1). */
  readonly portions = signal(2);
  readonly cooks = signal(1);
  readonly cookingTime = signal<CookingTime>('quick');
  readonly cuisine = signal<Cuisine>('italian');
  readonly diet = signal<Diet>('none');

  /** Assembles the request (Contract 1) from the current draft. */
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
