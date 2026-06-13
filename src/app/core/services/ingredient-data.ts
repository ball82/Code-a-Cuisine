import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';

/**
 * Lädt die lokale Autocomplete-Liste der Zutaten (keine externe API).
 * Quelle: public/data/ingredients.json → ausgeliefert unter /data/ingredients.json
 * (in angular.json ist nur public/ als Assets-Ordner konfiguriert).
 */
@Injectable({ providedIn: 'root' })
export class IngredientData {
  private readonly http = inject(HttpClient);

  /** Einmal geladene, geteilte Zutatenliste. */
  private readonly ingredients$ = this.http
    .get<string[]>('/data/ingredients.json')
    .pipe(shareReplay(1));

  /**
   * Liefert die vollständige Autocomplete-Liste der Zutatennamen.
   * @returns Observable mit allen Zutatennamen.
   */
  getIngredients(): Observable<string[]> {
    return this.ingredients$;
  }
}
