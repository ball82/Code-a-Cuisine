import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';

/**
 * Loads the local autocomplete list of ingredients (no external API).
 * Source: public/data/ingredients.json → served at /data/ingredients.json
 * (in angular.json only public/ is configured as the assets folder).
 */
@Injectable({ providedIn: 'root' })
export class IngredientData {
  private readonly http = inject(HttpClient);

  /** Ingredient list loaded once and shared. */
  private readonly ingredients$ = this.http
    .get<string[]>('/data/ingredients.json')
    .pipe(shareReplay(1));

  /**
   * Returns the complete autocomplete list of ingredient names.
   * @returns Observable with all ingredient names.
   */
  getIngredients(): Observable<string[]> {
    return this.ingredients$;
  }
}
