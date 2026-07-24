import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { Ingredient, Unit } from '../../core/models/ingredient';
import { Direction, Recipe } from '../../core/models/recipe';
import { RecipeApi } from '../../core/services/recipe-api';
import { RecipeStore } from '../../core/services/recipe-store';
import { CookbookData } from '../../core/services/cookbook-data';
import { Header } from '../../shared/header/header';
import { Footer } from '../../shared/footer/footer';

/** Short form of the unit for the ingredient line. */
const UNIT_SHORT: Record<Unit, string> = { gram: 'g', ml: 'ml', liter: 'l', piece: '×' };

/** Rounds a scaled amount to at most 1 decimal place (whole numbers stay whole). */
function roundAmount(amount: number): number {
  return Math.round(amount * 10) / 10;
}

/** Energy content per gram of macronutrient (kcal) – basis for the percentage split. */
const KCAL_PER_GRAM = { protein: 4, fat: 9, carbs: 4 } as const;

/** One segment of the macro distribution for chart, legend and table. */
export interface MacroSlice {
  /** Key = also the CSS class suffix (protein/fat/carbs). */
  key: 'protein' | 'fat' | 'carbs';
  label: string;
  /** Amount in grams scaled to the chosen portion count. */
  grams: number;
  /** Integer share of the nutritional energy; the three values add up to 100. */
  percent: number;
  /** Data color of the segment (CSS variable from styles.scss). */
  color: string;
}

/**
 * Rounds shares to whole percentages such that the sum stays exactly 100
 * (largest-remainder method): floor first, then distribute the remaining points
 * to the values with the largest fractional remainder.
 */
function roundPercentages(shares: number[]): number[] {
  const raw = shares.map((s) => s * 100);
  const floors = raw.map(Math.floor);
  let remainder = 100 - floors.reduce((a, b) => a + b, 0);
  const order = raw
    .map((value, i) => ({ i, frac: value - floors[i] }))
    .sort((a, b) => b.frac - a.frac);
  const result = [...floors];
  for (let k = 0; k < order.length && remainder > 0; k++, remainder--) {
    result[order[k].i]++;
  }
  return result;
}

/**
 * Recipe detail page. Shows nutrition values (scalable via a portions slider),
 * ingredients (yours + extra), the cooking steps with chef badges and a
 * like button (toggle, briefly locked after a click against double clicks).
 *
 * The back path is context-dependent (query param `from`): from the generator
 * back to the results, from the cookbook back to the cookbook.
 */
@Component({
  selector: 'app-recipe-detail',
  imports: [RouterLink, Header, Footer],
  templateUrl: './recipe-detail.html',
  styleUrl: './recipe-detail.scss'
})
export class RecipeDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(RecipeStore);
  private readonly api = inject(RecipeApi);
  private readonly cookbook = inject(CookbookData);

  /** Recipe ID from the route. */
  private readonly id = this.route.snapshot.paramMap.get('id');

  /**
   * The recipe to display. First look in the store (freshly generated), then in
   * the live-loaded cookbook – the latter is needed so shared deep links and a
   * reload work (the store cache is empty then, but the cookbook loads all
   * recipes directly from Firestore). The reactive `cookbook.recipes()` ensures
   * the lookup runs again as soon as the data arrives.
   */
  readonly recipe = computed<Recipe | undefined>(() => {
    if (!this.id) return undefined;
    return this.store.byId(this.id) ?? this.cookbook.recipes().find((r) => r.id === this.id);
  });

  /** Flag so the initial values (portions/likes) are set only once. */
  private seeded = false;

  /** Origin → determines the back path (link + label). */
  private readonly from = this.route.snapshot.queryParamMap.get('from');
  readonly backLink = this.from === 'cookbook' ? '/cookbook' : '/recipe-results';
  readonly backLabel = this.from === 'cookbook' ? 'Cookbook' : 'Recipes';

  /** Portions for the nutrition scaling (values in the contract are per portion). */
  readonly portions = signal(1);

  /** Like state (remembered locally) + current counter + click lock. */
  readonly liked = signal(false);
  readonly likeCount = signal(0);
  readonly likeBusy = signal(false);

  /** Total nutrition = value per portion × chosen portion count. */
  readonly nutrition = computed(() => {
    const r = this.recipe();
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

  /**
   * Macro distribution (US10): share of the three macronutrients in the
   * nutritional energy. The percentages come from the energy content (fat 9
   * kcal/g, protein/carbs 4 kcal/g each), not from the mass – so the split
   * matches what the kcal value above accounts for. The percentages are
   * portion-independent (a ratio); the gram figures scale with the portions
   * slider. Without nutritional energy (all macros 0) the split stays at 0 %
   * instead of 0/0.
   */
  readonly macros = computed<MacroSlice[]>(() => {
    const n = this.nutrition();
    if (!n) return [];
    const energy = {
      protein: n.protein * KCAL_PER_GRAM.protein,
      fat: n.fat * KCAL_PER_GRAM.fat,
      carbs: n.carbs * KCAL_PER_GRAM.carbs
    };
    const total = energy.protein + energy.fat + energy.carbs;
    const keys = ['protein', 'fat', 'carbs'] as const;
    const labels = { protein: 'Protein', fat: 'Fat', carbs: 'Carbs' };
    const colors = {
      protein: 'var(--chart-protein)',
      fat: 'var(--chart-fat)',
      carbs: 'var(--chart-carbs)'
    };
    const percents = total > 0 ? roundPercentages(keys.map((k) => energy[k] / total)) : [0, 0, 0];
    return keys.map((key, i) => ({
      key,
      label: labels[key],
      grams: n[key],
      percent: percents[i],
      color: colors[key]
    }));
  });

  /** Accessible text version of the macro distribution (for the screen reader). */
  readonly macroSummary = computed(() =>
    this.macros()
      .map((m) => `${m.label} ${m.percent}%`)
      .join(', ')
  );

  /**
   * Scaling factor for the ingredient amounts: chosen portions ÷ portions for
   * which the recipe was originally generated. At the same portion count it
   * stays 1 (original amounts).
   */
  readonly scale = computed(() => {
    const base = this.recipe()?.portions ?? 0;
    return base > 0 ? this.portions() / base : 1;
  });

  /** The user's ingredients, scaled up to the chosen portion count. */
  readonly yourIngredients = computed(() => this.scaleList(this.recipe()?.yourIngredients));

  /** Additionally required ingredients, likewise scaled to the portion count. */
  readonly extraIngredients = computed(() => this.scaleList(this.recipe()?.extraIngredients));

  /** Chef numbers from 1..cooks (for the "Cooking person" pills and the to-do columns). */
  readonly chefs = computed(() => {
    const r = this.recipe();
    return r ? Array.from({ length: r.cooks }, (_, i) => i + 1) : [];
  });

  /** Scales an ingredient list by the current scaling factor (amount × factor). */
  private scaleList(list: Ingredient[] | undefined): Ingredient[] {
    const factor = this.scale();
    return (list ?? []).map((ing) => ({ ...ing, amount: roundAmount(ing.amount * factor) }));
  }

  /**
   * Steps of a specific cook, in chronological order (US9: an individual to-do
   * list per person). The global step number is preserved so the temporal
   * sequence remains recognizable across the columns.
   */
  stepsForChef(chef: number): Direction[] {
    return this.recipe()?.directions.filter((d) => d.chef === chef) ?? [];
  }

  /**
   * Sets up an effect that reacts reactively to the recipe: as soon as it is
   * available (immediately from the store, after loading from the cookbook), the
   * initial values (portions, likes, like status) are set once. Only when the
   * cookbook has finished loading AND the recipe is still missing does it
   * redirect back to the cookbook – so a deep link/reload survives the short
   * loading phase.
   */
  constructor() {
    effect(() => {
      const recipe = this.recipe();
      if (recipe) {
        if (!this.seeded) {
          this.seeded = true;
          this.portions.set(recipe.portions);
          this.likeCount.set(recipe.likes);
          this.liked.set(this.store.isLiked(recipe.id));
        }
        return;
      }
      if (!this.id || this.cookbook.ready()) {
        this.router.navigate(['/cookbook']);
      }
    });
  }

  /**
   * Changes the displayed portion count and keeps it in the range 1–12. Nutrition
   * values and ingredient amounts scale reactively along with it.
   * @param delta Step size, usually +1 or −1.
   */
  stepPortions(delta: number): void {
    this.portions.update((p) => Math.min(12, Math.max(1, p + delta)));
  }

  /** "80 g Pasta" or "2× Egg" for piece-based ingredients. */
  formatIngredient(ing: Ingredient): string {
    return ing.unit === 'piece'
      ? `${ing.amount}× ${ing.name}`
      : `${ing.amount} ${UNIT_SHORT[ing.unit]} ${ing.name}`;
  }

  /**
   * Toggles the like optimistically, calls the n8n webhook and reconciles with
   * the server response (Contract 3). On error it rolls back. The button stays
   * locked during the request and for ~500 ms afterwards (race condition).
   */
  toggleLike(): void {
    const r = this.recipe();
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
        this.likeCount.set(res.likes);
        this.store.setLiked(r.id, res.liked);
        this.store.updateLikeCount(r.id, res.likes);
        this.cookbook.updateLikeCount(r.id, res.likes);
        this.releaseAfterCooldown();
      },
      error: () => {
        this.liked.set(prevLiked);
        this.likeCount.set(prevCount);
        this.releaseAfterCooldown();
      }
    });
  }

  /**
   * Releases the like button again after a short cooldown (~500 ms) –
   * protects against accidental double clicks right after a toggle.
   */
  private releaseAfterCooldown(): void {
    setTimeout(() => this.likeBusy.set(false), 500);
  }
}
