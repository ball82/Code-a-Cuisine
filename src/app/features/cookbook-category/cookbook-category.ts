import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

import { Header } from '../../shared/header/header';
import { Footer } from '../../shared/footer/footer';
import { Cuisine } from '../../core/models/recipe-request';
import { CookbookData } from '../../core/services/cookbook-data';

/** Anzeige-Metadaten je Küche (Name, Emoji, Banner-Bild). */
const CUISINE_META: Record<Cuisine, { label: string; emoji: string; image: string }> = {
  italian: { label: 'Italian cuisine', emoji: '🍝', image: 'img/italien_cuisine.svg' },
  german: { label: 'German cuisine', emoji: '🥨', image: 'img/german_cuisine.svg' },
  japanese: { label: 'Japanese cuisine', emoji: '🥢', image: 'img/japanese_cuisine.svg' },
  indian: { label: 'Indian cuisine', emoji: '🍛', image: 'img/indian_cuisine.svg' },
  gourmet: { label: 'Gourmet cuisine', emoji: '✨', image: 'img/gourmet_cusine.svg' },
  fusion: { label: 'Fusion cuisine', emoji: '🍱', image: 'img/fusion_cuisine.svg' }
};

/** Checkliste: 20 Rezepte pro Seite. */
const PAGE_SIZE = 20;

/**
 * Kategorieseite einer Küche (z.B. "Italian cuisine"). Banner + nummerierte
 * Rezeptliste (gefiltert nach Küche, neueste zuerst) + Paginierung (20/Seite).
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

  /** Routen-Parameter als Signal (mit dem Snapshot als Startwert). */
  private readonly params = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap
  });

  /** Alle geladenen Cookbook-Rezepte (Quelle vor der Küchen-Filterung). */
  private readonly allRecipes = this.cookbookData.recipes;

  /** Aktuelle Küche aus dem Routen-Parameter. */
  readonly cuisine = computed<Cuisine>(() => (this.params().get('cuisine') as Cuisine) ?? 'italian');

  /** Banner-Metadaten (Label, Emoji, Bild) der aktuellen Küche. */
  readonly meta = computed(() => CUISINE_META[this.cuisine()] ?? CUISINE_META['italian']);

  /** Nach Küche gefiltert, neueste zuerst. */
  readonly recipes = computed(() =>
    this.allRecipes()
      .filter((r) => r.cuisine === this.cuisine())
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  );

  /** 1-basierte aktuelle Seite. */
  readonly page = signal(1);

  /** Gesamtzahl der Seiten (mindestens 1, auch bei leerer Liste). */
  readonly pageCount = computed(() => Math.max(1, Math.ceil(this.recipes().length / PAGE_SIZE)));

  /** Seitenzahlen `[1..pageCount]` für die Paginierungs-Navigation. */
  readonly pages = computed(() => Array.from({ length: this.pageCount() }, (_, i) => i + 1));

  /** Rezepte der aktuellen Seite (mit fortlaufender Nummer). */
  readonly pageRecipes = computed(() => {
    const start = (this.page() - 1) * PAGE_SIZE;
    return this.recipes()
      .slice(start, start + PAGE_SIZE)
      .map((recipe, i) => ({ recipe, number: start + i + 1 }));
  });

  /**
   * Setzt die Paginierung bei jedem Kategoriewechsel zurück auf Seite 1, damit
   * man nicht auf einer nicht mehr existierenden Seite der neuen Küche landet.
   */
  constructor() {
    effect(() => {
      this.cuisine();
      this.page.set(1);
    });
  }

  /**
   * Wechselt zur angegebenen Seite, begrenzt auf den gültigen Bereich
   * `[1, pageCount]`.
   * @param page Gewünschte 1-basierte Seitenzahl.
   */
  goToPage(page: number): void {
    this.page.set(Math.min(this.pageCount(), Math.max(1, page)));
  }
}
