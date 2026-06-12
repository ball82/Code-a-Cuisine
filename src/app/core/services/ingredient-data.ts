import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';

/**
 * Lädt die lokale Autocomplete-Liste der Zutaten (keine externe API).
 * Quelle: assets/data/ingredients.json.
 */
@Injectable({ providedIn: 'root' })
export class IngredientData {
  private readonly http = inject(HttpClient);

  /** Einmal geladene, geteilte Zutatenliste. */
  private readonly ingredients$ = this.http
    .get<string[]>('assets/data/ingredients.json')
    .pipe(shareReplay(1));

  /**
   * Liefert die vollständige Autocomplete-Liste der Zutatennamen.
   * @returns Observable mit allen Zutatennamen.
   */
  getIngredients(): Observable<string[]> {
    return this.ingredients$;
  }
}
