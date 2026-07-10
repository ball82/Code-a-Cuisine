import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { Ingredient, Unit } from '../../core/models/ingredient';
import { Recipe } from '../../core/models/recipe';
import { RecipeApi } from '../../core/services/recipe-api';
import { RecipeStore } from '../../core/services/recipe-store';
import { I18n } from '../../core/services/i18n';

/** Kurzform der Einheit für die Zutatenzeile. */
const UNIT_SHORT: Record<Unit, string> = { gram: 'g', ml: 'ml', liter: 'l', piece: '×' };

/**
 * Rezept-Detailseite. Zeigt Nährwerte (skalierbar über einen Portions-Regler),
 * Zutaten (deine + Extra), die Kochschritte mit Chef-Badges und einen
 * Like-Button (Toggle, nach Klick kurz gesperrt gegen Doppelklicks).
 *
 * Zurück-Weg ist kontextabhängig (Query-Param `from`): vom Generator zurück zu
 * den Ergebnissen, vom Cookbook zurück ins Cookbook.
 */
@Component({
  selector: 'app-recipe-detail',
  imports: [RouterLink],
  templateUrl: './recipe-detail.html',
  styleUrl: './recipe-detail.scss'
})
export class RecipeDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(RecipeStore);
  private readonly api = inject(RecipeApi);
  readonly i18n = inject(I18n);

  /** Das anzuzeigende Rezept (aus dem Store per ID). */
  readonly recipe: Recipe | undefined;

  /** Herkunft → bestimmt den Zurück-Weg (Label als i18n-Schlüssel). */
  private readonly from = this.route.snapshot.queryParamMap.get('from');
  readonly backLink = this.from === 'cookbook' ? '/cookbook' : '/recipe-results';
  readonly backLabel = this.from === 'cookbook' ? 'nav.cookbook' : 'nav.recipes';

  /** Portionen für die Nährwert-Skalierung (Werte im Vertrag sind pro Portion). */
  readonly portions = signal(1);

  /** Like-Zustand (lokal gemerkt) + aktueller Zähler + Klicksperre. */
  readonly liked = signal(false);
  readonly likeCount = signal(0);
  readonly likeBusy = signal(false);

  /** Gesamt-Nährwerte = Wert pro Portion × gewählte Portionszahl. */
  readonly nutrition = computed(() => {
    const r = this.recipe;
    if (!r) return null;
    const f = this.portions();
    const n = r.nutritionPerPortion;
    return {
      calories: Math.round(n.calories * f),
      protein: Math.round(n.protein * f),
      fat: Math.round(n.fat * f),
      carbs: Math.round(n.carbs * f)
    };
  });

  /** Chef-Nummern von 1..cooks (für die "Cooking person"-Pillen). */
  readonly chefs = computed(() =>
    this.recipe ? Array.from({ length: this.recipe.cooks }, (_, i) => i + 1) : []
  );

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    this.recipe = id ? this.store.byId(id) : undefined;

    // Kein Rezept im Store (z.B. direkter Deep-Link) → zurück ins Cookbook.
    if (!this.recipe) {
      this.router.navigate(['/cookbook']);
      return;
    }

    this.portions.set(this.recipe.portions);
    this.likeCount.set(this.recipe.likes);
    this.liked.set(this.store.isLiked(this.recipe.id));
  }

  stepPortions(delta: number): void {
    this.portions.update((p) => Math.min(12, Math.max(1, p + delta)));
  }

  /** "80 g Pasta" bzw. "2× Egg" für Stück-Zutaten. */
  formatIngredient(ing: Ingredient): string {
    return ing.unit === 'piece'
      ? `${ing.amount}× ${ing.name}`
      : `${ing.amount} ${UNIT_SHORT[ing.unit]} ${ing.name}`;
  }

  /**
   * Toggelt den Like optimistisch, ruft den n8n-Webhook und gleicht mit der
   * Server-Antwort ab (Vertrag 3). Bei Fehler wird zurückgerollt. Der Button
   * bleibt während des Requests und danach ~500 ms gesperrt (Race-Condition).
   */
  toggleLike(): void {
    const r = this.recipe;
    if (!r || this.likeBusy()) return;

    const prevLiked = this.liked();
    const prevCount = this.likeCount();
    const nextLiked = !prevLiked;

    this.liked.set(nextLiked);
    this.likeCount.set(prevCount + (nextLiked ? 1 : -1));
    this.likeBusy.set(true);

    this.api.likeRecipe(r.id).subscribe({
      next: (res) => {
        this.liked.set(res.liked);
        this.likeCount.set(res.newLikeCount);
        this.store.setLiked(r.id, res.liked);
        this.releaseAfterCooldown();
      },
      error: () => {
        // Netzwerk-/Backend-Fehler → optimistische Änderung zurücknehmen.
        this.liked.set(prevLiked);
        this.likeCount.set(prevCount);
        this.releaseAfterCooldown();
      }
    });
  }

  private releaseAfterCooldown(): void {
    setTimeout(() => this.likeBusy.set(false), 500);
  }
}
