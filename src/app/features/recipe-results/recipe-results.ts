import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { RecipeStore } from '../../core/services/recipe-store';
import { RecipeDraft } from '../../core/services/recipe-draft';
import { RecipeCard } from '../../shared/recipe-card/recipe-card';

/** Wandelt einen technischen Kleinbuchstaben-Wert in einen Anzeigetext. */
function cap(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * Ergebnis-Seite ("Generated recipes"): grüner Hintergrund, aktive
 * Präferenz-Tags und die drei generierten Rezepte als Karten.
 * Die Rezepte kommen aus dem RecipeStore (dort von Preferences abgelegt).
 */
@Component({
  selector: 'app-recipe-results',
  imports: [RouterLink, RecipeCard],
  templateUrl: './recipe-results.html',
  styleUrl: './recipe-results.scss'
})
export class RecipeResults {
  private readonly store = inject(RecipeStore);
  private readonly draft = inject(RecipeDraft);
  private readonly router = inject(Router);

  /** Die drei generierten Rezepte. */
  readonly recipes = this.store.generated;

  /** Aktive Präferenzen als Tag-Band (z.B. Italian, Quick, Vegetarian). */
  readonly activeTags = computed(() => {
    const tags = [cap(this.draft.cuisine()), cap(this.draft.cookingTime())];
    if (this.draft.diet() !== 'none') tags.push(cap(this.draft.diet()));
    return tags;
  });

  constructor() {
    // Direktaufruf oder Reload ohne Ergebnisse → zurück zum Generator-Start.
    if (this.recipes().length === 0) {
      this.router.navigate(['/ingredients']);
    }
  }
}
