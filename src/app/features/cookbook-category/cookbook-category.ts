import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

import { Header } from '../../shared/header/header';
import { Footer } from '../../shared/footer/footer';
import { Cuisine } from '../../core/models/recipe-request';
import { CookbookData } from '../../core/services/cookbook-data';

/** Display metadata per cuisine. The decorative banner is shared by all categories. */
const CUISINE_META: Record<Cuisine, { label: string }> = {
  italian: { label: 'Italian cuisine' },
  german: { label: 'German cuisine' },
  japanese: { label: 'Japanese cuisine' },
  indian: { label: 'Indian cuisine' },
  gourmet: { label: 'Gourmet cuisine' },
  fusion: { label: 'Fusion cuisine' }
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

  /** Banner metadata (label) of the current cuisine. */
  readonly meta = computed(() => CUISINE_META[this.cuisine()] ?? CUISINE_META['italian']);

  /** Shared banner artwork; the title above it changes with the cuisine route. */
  readonly bannerImage = 'img/banner_cookbook_cuisine.svg';

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

  /** Compact page navigation matching the cookbook visual design. */
  readonly paginationItems = computed<Array<number | 'ellipsis'>>(() => {
    const count = this.pageCount();
    if (count <= 7) return this.pages();
    return [1, 2, 3, 'ellipsis', count];
  });

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
