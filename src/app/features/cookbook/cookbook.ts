import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';


import { Header } from '../../shared/header/header';
import { Footer } from '../../shared/footer/footer';
import { Cuisine, CUISINE_LABELS } from '../../core/models/recipe-request';
import { CookbookData } from '../../core/services/cookbook-data';

/** A cuisine tile in the cookbook grid (fixed category image from public/img). */
interface CuisineTile {
  key: Cuisine;
  label: string;
  emoji: string;
  image: string;
}

/**
 * Cookbook overview: "Most liked" bar at the top (live from Firestore/sample
 * data, sorted by `likes`), below it the grid of the six cuisine categories.
 * The categories are hard-wired (fixed images), the recipe data comes via
 * CookbookData (direct read of the recipes collection).
 */
@Component({
  selector: 'app-cookbook',
  imports: [Header, Footer, RouterLink],
  templateUrl: './cookbook.html',
  styleUrl: './cookbook.scss'
})
export class Cookbook {
  private readonly cookbookData = inject(CookbookData);

  /** Display labels for the cooking style (US12: cooking style in the "Most liked" bar). */
  readonly cuisineLabels = CUISINE_LABELS;

  /** Six fixed categories with images from public/img (filenames as delivered). */
  readonly cuisines: CuisineTile[] = [
    { key: 'italian', label: 'Italian cuisine', emoji: '🍝', image: 'img/italien_cuisine.svg' },
    { key: 'german', label: 'German cuisine', emoji: '🥨', image: 'img/german_cuisine.svg' },
    { key: 'japanese', label: 'Japanese cuisine', emoji: '🥢', image: 'img/japanese_cuisine.svg' },
    { key: 'gourmet', label: 'Gourmet cuisine', emoji: '✨', image: 'img/gourmet_cusine.svg' },
    { key: 'indian', label: 'Indian cuisine', emoji: '🍛', image: 'img/indian_cuisine.svg' },
    { key: 'fusion', label: 'Fusion cuisine', emoji: '🍱', image: 'img/fusion_cuisine.svg' }
  ];

  /** All recipes (live or sample data). */
  private readonly recipes = this.cookbookData.recipes;

  /** The three most-liked recipes for the top bar. */
  readonly mostLiked = computed(() =>
    [...this.recipes()].sort((a, b) => b.likes - a.likes).slice(0, 3)
  );
}
