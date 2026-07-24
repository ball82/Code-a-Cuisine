import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

import { Header } from '../../shared/header/header';
import { Footer } from '../../shared/footer/footer';
import { Cuisine } from '../../core/models/recipe-request';
import { CookbookData } from '../../core/services/cookbook-data';

/** Display metadata per cuisine (name, emoji, banner image). */
const CUISINE_META: Record<Cuisine, { label: string; emoji: string; image: string }> = {
  italian: { label: 'Italian cuisine', emoji: '🍝', image: 'img/italien_cuisine.svg' },
  german: { label: 'German cuisine', emoji: '🥨', image: 'img/german_cuisine.svg' },
  japanese: { label: 'Japanese cuisine', emoji: '🥢', image: 'img/japanese_cuisine.svg' },
  indian: { label: 'Indian cuisine', emoji: '🍛', image: 'img/indian_cuisine.svg' },
  gourmet: { label: 'Gourmet cuisine', emoji: '✨', image: 'img/gourmet_cusine.svg' },
  fusion: { label: 'Fusion cuisine', emoji: '🍱', image: 'img/fusion_cuisine.svg' }
};

/** Checklist: 20 recipes per page. */
const PAGE_SIZE = 20;

/**
 * Category page of a cuisine (e.g. "Italian cuisine"). Banner + numbered
 * recipe list (filtered by cuisine, newest first) + pagination (20/page).
 */
@Component({
  selector: 'app-cookbook-category',
  imports: [Header, Footer, RouterLink],
  templateUrl: './cookbook-category.html',
  styleUrl: './cookbook-category.scss'
})
export class CookbookCategory {
  private readonly route = inject(ActivatedRoute);
  private readonly cookbookData = inject(CookbookData);

  /** Route params as a signal (with the snapshot as the initial value). */
  private readonly params = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap
  });

  /** All loaded cookbook recipes (source before the cuisine filtering). */
  private readonly allRecipes = this.cookbookData.recipes;

  /** Current cuisine from the route param. */
  readonly cuisine = computed<Cuisine>(() => (this.params().get('cuisine') as Cuisine) ?? 'italian');

  /** Banner metadata (label, emoji, image) of the current cuisine. */
  readonly meta = computed(() => CUISINE_META[this.cuisine()] ?? CUISINE_META['italian']);

  /** Filtered by cuisine, newest first. */
  readonly recipes = computed(() =>
    this.allRecipes()
      .filter((r) => r.cuisine === this.cuisine())
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  );

  /** 1-based current page. */
  readonly page = signal(1);

  /** Total number of pages (at least 1, even for an empty list). */
  readonly pageCount = computed(() => Math.max(1, Math.ceil(this.recipes().length / PAGE_SIZE)));

  /** Page numbers `[1..pageCount]` for the pagination navigation. */
  readonly pages = computed(() => Array.from({ length: this.pageCount() }, (_, i) => i + 1));

  /** Recipes of the current page (with running number). */
  readonly pageRecipes = computed(() => {
    const start = (this.page() - 1) * PAGE_SIZE;
    return this.recipes()
      .slice(start, start + PAGE_SIZE)
      .map((recipe, i) => ({ recipe, number: start + i + 1 }));
  });

  /**
   * Resets the pagination to page 1 on every category change so you don't
   * land on a no-longer-existing page of the new cuisine.
   */
  constructor() {
    effect(() => {
      this.cuisine();
      this.page.set(1);
    });
  }

  /**
   * Switches to the given page, clamped to the valid range `[1, pageCount]`.
   * @param page Desired 1-based page number.
   */
  goToPage(page: number): void {
    this.page.set(Math.min(this.pageCount(), Math.max(1, page)));
  }
}
