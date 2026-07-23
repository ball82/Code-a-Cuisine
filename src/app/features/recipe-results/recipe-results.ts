import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { CookingTime, Cuisine, Diet } from '../../core/models/recipe-request';
import { RecipeStore } from '../../core/services/recipe-store';
import { RecipeDraft } from '../../core/services/recipe-draft';
import { RecipeCard } from '../../shared/recipe-card/recipe-card';
import { Header } from '../../shared/header/header';

/** Anzeige-Labels für die Präferenz-Tags (technischer Wert → Text). */
const CUISINE_LABEL: Record<Cuisine, string> = {
  german: 'German',
  italian: 'Italian',
  japanese: 'Japanese',
  indian: 'Indian',
  gourmet: 'Gourmet',
  fusion: 'Fusion'
};
const TIME_LABEL: Record<CookingTime, string> = {
  quick: 'Quick',
  medium: 'Medium',
  complex: 'Complex'
};
const DIET_LABEL: Record<Diet, string> = {
  vegetarian: 'Vegetarian',
  vegan: 'Vegan',
  keto: 'Keto',
  none: 'No preferences'
};

/**
 * Ergebnis-Seite ("Generated recipes"): grüner Hintergrund, aktive
 * Präferenz-Tags und die drei generierten Rezepte als Karten.
 * Die Rezepte kommen aus dem RecipeStore (dort von Preferences abgelegt).
 */
@Component({
  selector: 'app-recipe-results',
  imports: [RouterLink, RecipeCard, Header],
  templateUrl: './recipe-results.html',
  styleUrl: './recipe-results.scss'
})
export class RecipeResults {
  private readonly store = inject(RecipeStore);
  private readonly draft = inject(RecipeDraft);
  private readonly router = inject(Router);

  /** Die drei generierten Rezepte. */
  readonly recipes = this.store.generated;

  /** Aktive Präferenzen als Anzeige-Tags (z.B. Italian, Quick, Vegetarian). */
  readonly activeTags = computed(() => {
    const tags = [CUISINE_LABEL[this.draft.cuisine()], TIME_LABEL[this.draft.cookingTime()]];
    if (this.draft.diet() !== 'none') tags.push(DIET_LABEL[this.draft.diet()]);
    return tags;
  });

  /**
   * Leitet bei Direktaufruf oder Reload ohne vorhandene Ergebnisse zurück zum
   * Generator-Start (`/ingredients`) – ohne generierte Rezepte gäbe es nichts
   * anzuzeigen.
   */
  constructor() {
    if (this.recipes().length === 0) {
      this.router.navigate(['/ingredients']);
    }
  }
}
