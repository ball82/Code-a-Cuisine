import { DOCUMENT } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { CookingTime, Cuisine, Diet } from '../../core/models/recipe-request';
import { RecipeDraft } from '../../core/services/recipe-draft';
import { RecipeApi } from '../../core/services/recipe-api';
import { RecipeStore } from '../../core/services/recipe-store';
import { CookbookData } from '../../core/services/cookbook-data';
import { QuotaStatus } from '../../core/services/quota-status';
import { Loader } from '../../shared/loader/loader';
import { ErrorDialog } from '../../shared/error-dialog/error-dialog';
import { Header } from '../../shared/header/header';
import { Footer } from '../../shared/footer/footer';

/** A chip option: technical value + display label (+ optional hint). */
interface ChipOption<T> {
  value: T;
  label: string;
  hint?: string;
}

/**
 * Step 2 of the generator ("Choose your preferences").
 * Portions/cooks as steppers, cooking time/cuisine/diet as single-select chips.
 * The state lives in the RecipeDraft service, so it is preserved on back.
 */
@Component({
  selector: 'app-preferences',
  imports: [Loader, ErrorDialog, Header, Footer],
  templateUrl: './preferences.html',
  styleUrl: './preferences.scss'
})
export class Preferences {
  private readonly document = inject(DOCUMENT);
  private readonly draft = inject(RecipeDraft);
  private readonly api = inject(RecipeApi);
  private readonly store = inject(RecipeStore);
  private readonly cookbook = inject(CookbookData);
  private readonly router = inject(Router);
  /** Remaining daily generations – for the transparency line on the button. */
  readonly quota = inject(QuotaStatus);

  /** Shared state from the draft (signals). */
  readonly portions = this.draft.portions;
  readonly cooks = this.draft.cooks;
  readonly cookingTime = this.draft.cookingTime;
  readonly cuisine = this.draft.cuisine;
  readonly diet = this.draft.diet;

  /** Time categories per the checklist (quick ≤20 / medium 20–45 / complex 45+). */
  readonly cookingTimes: ChipOption<CookingTime>[] = [
    { value: 'quick', label: 'Quick', hint: 'Up to 20 min' },
    { value: 'medium', label: 'Medium', hint: '20–45 min' },
    { value: 'complex', label: 'Complex', hint: '45+ min' }
  ];

  readonly cuisines: ChipOption<Cuisine>[] = [
    { value: 'german', label: 'German' },
    { value: 'italian', label: 'Italian' },
    { value: 'indian', label: 'Indian' },
    { value: 'japanese', label: 'Japanese' },
    { value: 'gourmet', label: 'Gourmet' },
    { value: 'fusion', label: 'Fusion' }
  ];

  readonly diets: ChipOption<Diet>[] = [
    { value: 'vegetarian', label: 'Vegetarian' },
    { value: 'vegan', label: 'Vegan' },
    { value: 'keto', label: 'Keto' },
    { value: 'none', label: 'No preferences' }
  ];

  /** Whether the portion count may still be increased (upper limit 12, Contract 1). */
  readonly canMorePortions = computed(() => this.portions() < 12);

  /** Whether the portion count may still be decreased (lower limit 1). */
  readonly canFewerPortions = computed(() => this.portions() > 1);

  /** Whether the number of cooks may still be increased (upper limit 3). */
  readonly canMoreCooks = computed(() => this.cooks() < 3);

  /** Whether the number of cooks may still be decreased (lower limit 1). */
  readonly canFewerCooks = computed(() => this.cooks() > 1);

  /**
   * Changes the portion count and keeps it within the valid range 1–12 (Contract 1).
   * @param delta Step size, usually +1 or −1.
   */
  stepPortions(delta: number): void {
    this.portions.update((p) => Math.min(12, Math.max(1, p + delta)));
  }

  /**
   * Changes the number of cooks and keeps it within the valid range 1–3
   * (Contract 1).
   * @param delta Step size, usually +1 or −1.
   */
  stepCooks(delta: number): void {
    this.cooks.update((c) => Math.min(3, Math.max(1, c + delta)));
  }

  /** Is a generation request currently running? Locks the button against double clicks. */
  readonly loading = signal(false);

  /** Friendly error message (validation 400 / quota 429 / network) – otherwise null. */
  readonly error = signal<string | null>(null);

  /** "Oops!" dialog: Gemini/n8n reports that the ingredients/amounts are insufficient. */
  readonly showInsufficient = signal(false);

  constructor() {
    effect((onCleanup) => {
      this.document.body.classList.toggle('is-loading', this.loading());
      onCleanup(() => this.document.body.classList.remove('is-loading'));
    });
  }

  /**
   * Sends the request (Contract 1) to the n8n webhook and gets back 3 finished
   * recipes already stored in Firestore (Contract 2). Firebase is NOT involved
   * here – n8n writes them itself and responds with the IDs.
   *
   * On success the recipes land in the RecipeStore, are mirrored into the
   * cookbook for immediate display (without a page reload) and we switch to the
   * results page; a server-confirmed `remaining` value is taken over by the
   * {@link QuotaStatus}. If the backend reports "not enough ingredients", the
   * friendly "Oops!" dialog appears instead of an error message. When the quota
   * is exhausted (429) the remaining value is set to 0.
   */
  generate(): void {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set(null);

    this.api.generateRecipes(this.draft.toRequest()).subscribe({
      next: (response) => {
        this.loading.set(false);
        if (!response?.recipes?.length) {
          this.showInsufficient.set(true);
          return;
        }
        if (typeof response.remaining === 'number') this.quota.record(response.remaining);
        this.store.setGenerated(response.recipes);
        this.cookbook.addGenerated(response.recipes);
        this.router.navigate(['/recipe-results']);
      },
      error: (err) => {
        this.loading.set(false);
        if ((err as { status?: number }).status === 429) this.quota.record(0);
        this.error.set(this.messageFor(err));
      }
    });
  }

  /** Closes the "Oops!" dialog and leads back to the ingredients. */
  dismissInsufficient(): void {
    this.showInsufficient.set(false);
    this.router.navigate(['/ingredients']);
  }

  /** Translates the n8n status codes into a friendly message. */
  private messageFor(err: unknown): string {
    const status = (err as { status?: number }).status;
    if (status === 400) return 'Please check your ingredients and preferences and try again.';
    if (status === 429) return 'Our daily recipe quota is used up. Please try again tomorrow.';
    return 'Something went wrong while generating your recipes. Please try again.';
  }
}
