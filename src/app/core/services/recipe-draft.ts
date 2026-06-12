import { Injectable, signal } from '@angular/core';

import { Ingredient } from '../models/ingredient';

/**
 * Hält die Eingaben des Nutzers ZWISCHEN den Generator-Schritten
 * (Step 1 Zutaten → Step 2 Präferenzen → Absenden an n8n).
 *
 * Bewusst als root-Service mit Signals: So bleibt die Zutatenliste erhalten,
 * wenn der Nutzer zwischen den Schritten vor- und zurücknavigiert, ohne dass
 * die einzelnen Feature-Komponenten Daten aneinander durchreichen müssen.
 * Die Präferenz-Felder (portions, cooks, …) kommen in Schritt 2 dazu.
 */
@Injectable({ providedIn: 'root' })
export class RecipeDraft {
  /** Die vom Nutzer in Schritt 1 zusammengestellten Zutaten. */
  readonly ingredients = signal<Ingredient[]>([]);
}
