import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

import { Header } from '../../shared/header/header';
import { Cuisine } from '../../core/models/recipe-request';
import { Recipe } from '../../core/models/recipe';
import { CookbookData } from '../../core/services/cookbook-data';

/** Anzeige-Metadaten je Küche (Name, Emoji, Banner-Bild). */
const CUISINE_META: Record<Cuisine, { label: string; emoji: string; image: string }> = {
  italian: { label: 'Italian cuisine', emoji: '🍝', image: '/img/italien_cuisine.svg' },
  german: { label: 'German cuisine', emoji: '🥨', image: '/img/german_cuisine.svg' },
  japanese: { label: 'Japanese cuisine', emoji: '🥢', image: '/img/japanese_cuisine.svg' },
  indian: { label: 'Indian cuisine', emoji: '🍛', image: '/img/indian_cuisine.svg' },
  gourmet: { label: 'Gourmet cuisine', emoji: '✨', image: '/img/gourmet_cusine.svg' },
  fusion: { label: 'Fusion cuisine', emoji: '🍱', image: '/img/fusion_cuisine.svg' }
};

/** Checkliste: 20 Rezepte pro Seite. */
const PAGE_SIZE = 20;

/**
 * Kategorieseite einer Küche (z.B. "Italian cuisine"). Banner + nummerierte
 * Rezeptliste (gefiltert nach Küche, neueste zuerst) + Paginierung (20/Seite).
 */
@Component({
  selector: 'app-cookbook-category',
  imports: [Header, RouterLink],
  templateUrl: './cookbook-category.html',
  styleUrl: './cookbook-category.scss'
})
export class CookbookCategory {
  private readonly route = inject(ActivatedRoute);
  private readonly cookbookData = inject(CookbookData);

  private readonly params = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap
  });
  private readonly allRecipes = toSignal(this.cookbookData.getRecipes(), {
    initialValue: [] as Recipe[]
  });

  /** Aktuelle Küche aus dem Routen-Parameter. */
  readonly cuisine = computed<Cuisine>(() => (this.params().get('cuisine') as Cuisine) ?? 'italian');
  readonly meta = computed(() => CUISINE_META[this.cuisine()] ?? CUISINE_META['italian']);

  /** Nach Küche gefiltert, neueste zuerst. */
  readonly recipes = computed(() =>
    this.allRecipes()
      .filter((r) => r.cuisine === this.cuisine())
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  );

  /** 1-basierte aktuelle Seite. */
  readonly page = signal(1);
  readonly pageCount = computed(() => Math.max(1, Math.ceil(this.recipes().length / PAGE_SIZE)));
  readonly pages = computed(() => Array.from({ length: this.pageCount() }, (_, i) => i + 1));

  /** Rezepte der aktuellen Seite (mit fortlaufender Nummer). */
  readonly pageRecipes = computed(() => {
    const start = (this.page() - 1) * PAGE_SIZE;
    return this.recipes()
      .slice(start, start + PAGE_SIZE)
      .map((recipe, i) => ({ recipe, number: start + i + 1 }));
  });

  constructor() {
    // Kategoriewechsel → zurück auf Seite 1.
    effect(() => {
      this.cuisine();
      this.page.set(1);
    });
  }

  goToPage(page: number): void {
    this.page.set(Math.min(this.pageCount(), Math.max(1, page)));
  }
}
