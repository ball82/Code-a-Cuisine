import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { CookingTime, Cuisine, Diet } from '../../core/models/recipe-request';
import { RecipeStore } from '../../core/services/recipe-store';
import { RecipeDraft } from '../../core/services/recipe-draft';
import { RecipeCard } from '../../shared/recipe-card/recipe-card';
import { Header } from '../../shared/header/header';
import { Footer } from '../../shared/footer/footer';

/** Display labels for the preference tags (technical value → text). */
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
 * Results page ("Generated recipes"): green background, active preference tags
 * and the three generated recipes as cards.
 * The recipes come from the RecipeStore (placed there by Preferences).
 */
@Component({
  selector: 'app-recipe-results',
  imports: [RouterLink, RecipeCard, Header, Footer],
  templateUrl: './recipe-results.html',
  styleUrl: './recipe-results.scss'
})
export class RecipeResults {
  private readonly store = inject(RecipeStore);
  private readonly draft = inject(RecipeDraft);
  private readonly router = inject(Router);

  /** The three generated recipes. */
  readonly recipes = this.store.generated;

  /** Active preferences as display tags (e.g. Italian, Quick, Vegetarian). */
  readonly activeTags = computed(() => {
    const tags = [CUISINE_LABEL[this.draft.cuisine()], TIME_LABEL[this.draft.cookingTime()]];
    if (this.draft.diet() !== 'none') tags.push(DIET_LABEL[this.draft.diet()]);
    return tags;
  });

  /**
   * On direct access or reload without existing results, redirects back to the
   * generator start (`/ingredients`) – without generated recipes there would be
   * nothing to display.
   */
  constructor() {
    if (this.recipes().length === 0) {
      this.router.navigate(['/ingredients']);
    }
  }
}
