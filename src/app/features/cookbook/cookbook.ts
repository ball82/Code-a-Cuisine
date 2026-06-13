import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Header } from '../../shared/header/header';
import { Cuisine } from '../../core/models/recipe-request';

/** Eine Küchen-Kachel im Cookbook-Raster (festes Kategorie-Bild aus public/img). */
interface CuisineTile {
  key: Cuisine;
  label: string;
  emoji: string;
  image: string;
}

/** Kompakte Vorschau eines Rezepts in der "Most liked"-Leiste. */
interface MostLikedPreview {
  id: string;
  title: string;
  cookingTimeMinutes: number;
  likes: number;
}

/**
 * Cookbook-Übersicht: "Most liked"-Leiste oben, darunter das Raster der
 * sechs Küchen-Kategorien. Die Kategorien sind fest verdrahtet (feste Bilder),
 * die Rezeptdaten kommen später direkt via Firebase SDK aus der recipes-Collection.
 */
@Component({
  selector: 'app-cookbook',
  imports: [Header, RouterLink],
  templateUrl: './cookbook.html',
  styleUrl: './cookbook.scss'
})
export class Cookbook {
  /** Sechs feste Kategorien mit Bildern aus public/img (Dateinamen wie geliefert). */
  readonly cuisines: CuisineTile[] = [
    { key: 'italian', label: 'Italian cuisine', emoji: '🍝', image: '/img/italien_cuisine.svg' },
    { key: 'german', label: 'German cuisine', emoji: '🥨', image: '/img/german_cuisine.svg' },
    { key: 'japanese', label: 'Japanese cuisine', emoji: '🥢', image: '/img/japanese_cuisine.svg' },
    { key: 'gourmet', label: 'Gourmet cuisine', emoji: '✨', image: '/img/gourmet_cusine.svg' },
    { key: 'indian', label: 'Indian cuisine', emoji: '🍛', image: '/img/indian_cuisine.svg' },
    { key: 'fusion', label: 'Fusion cuisine', emoji: '🍱', image: '/img/fusion_cuisine.svg' }
  ];

  /**
   * Meistgelikte Rezepte für die obere Leiste.
   * TODO: aus Firestore (recipes, sortiert nach `likes` absteigend) laden, sobald
   * der direkte Firebase-Read steht. Bis dahin Beispieldaten fürs Layout.
   */
  readonly mostLiked = signal<MostLikedPreview[]>([
    { id: 'sample-1', title: 'Pasta with spinach and cherry tomatoes', cookingTimeMinutes: 20, likes: 66 },
    { id: 'sample-2', title: 'Low Carb Vegan No-Bake Paleo Bars', cookingTimeMinutes: 35, likes: 57 },
    { id: 'sample-3', title: 'Schnitzel with potato salad', cookingTimeMinutes: 45, likes: 41 }
  ]);
}
