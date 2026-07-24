import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Recipe } from '../../core/models/recipe';
import { CUISINE_LABELS } from '../../core/models/recipe-request';

/**
 * Sage card for a recipe in the results overview: bell + "Recipe N", title,
 * cooking time, tags/likes and a "View" link to the detail page.
 * The `context` ends up as the `from` query param so the back button on the
 * detail page knows where it leads (results vs. cookbook).
 */
@Component({
  selector: 'app-recipe-card',
  imports: [RouterLink],
  templateUrl: './recipe-card.html',
  styleUrl: './recipe-card.scss'
})
export class RecipeCard {
  /** Display labels for the cooking style (US12: cooking style visible on the card). */
  readonly cuisineLabels = CUISINE_LABELS;

  /** The recipe to display. */
  readonly recipe = input.required<Recipe>();
  /** Optional number for the "Recipe N" label (1-based). */
  readonly index = input<number | null>(null);
  /** Origin so the detail page knows the back path. */
  readonly context = input<'results' | 'cookbook'>('results');
}
