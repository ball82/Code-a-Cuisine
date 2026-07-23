import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';


import { Header } from '../../shared/header/header';
import { Cuisine, CUISINE_LABELS } from '../../core/models/recipe-request';
import { CookbookData } from '../../core/services/cookbook-data';

/** Eine Küchen-Kachel im Cookbook-Raster (festes Kategorie-Bild aus public/img). */
interface CuisineTile {
  key: Cuisine;
  label: string;
  emoji: string;
  image: string;
}

/**
 * Cookbook-Übersicht: "Most liked"-Leiste oben (live aus Firestore/Beispieldaten,
 * nach `likes` sortiert), darunter das Raster der sechs Küchen-Kategorien.
 * Die Kategorien sind fest verdrahtet (feste Bilder), die Rezeptdaten kommen
 * über CookbookData (direkter Read der recipes-Collection).
 */
@Component({
  selector: 'app-cookbook',
  imports: [Header, RouterLink],
  templateUrl: './cookbook.html',
  styleUrl: './cookbook.scss'
})
export class Cookbook {
  private readonly cookbookData = inject(CookbookData);

  /** Anzeigetexte für den Kochstil (US12: Kochstil in der "Most liked"-Leiste). */
  readonly cuisineLabels = CUISINE_LABELS;

  /** Sechs feste Kategorien mit Bildern aus public/img (Dateinamen wie geliefert). */
  readonly cuisines: CuisineTile[] = [
    { key: 'italian', label: 'Italian cuisine', emoji: '🍝', image: 'img/italien_cuisine.svg' },
    { key: 'german', label: 'German cuisine', emoji: '🥨', image: 'img/german_cuisine.svg' },
    { key: 'japanese', label: 'Japanese cuisine', emoji: '🥢', image: 'img/japanese_cuisine.svg' },
    { key: 'gourmet', label: 'Gourmet cuisine', emoji: '✨', image: 'img/gourmet_cusine.svg' },
    { key: 'indian', label: 'Indian cuisine', emoji: '🍛', image: 'img/indian_cuisine.svg' },
    { key: 'fusion', label: 'Fusion cuisine', emoji: '🍱', image: 'img/fusion_cuisine.svg' }
  ];

  /** Alle Rezepte (live oder Beispieldaten). */
  private readonly recipes = this.cookbookData.recipes;

  /** Die drei meistgelikten Rezepte für die obere Leiste. */
  readonly mostLiked = computed(() =>
    [...this.recipes()].sort((a, b) => b.likes - a.likes).slice(0, 3)
  );
}
