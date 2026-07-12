import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Recipe } from '../../core/models/recipe';

/**
 * Sage-Karte für ein Rezept in der Ergebnis-Übersicht: Glocke + "Recipe N",
 * Titel, Kochzeit, Tags/Likes und ein "View"-Link zur Detailseite.
 * Der `context` landet als `from`-Query-Param, damit der Zurück-Button auf der
 * Detailseite weiss, wohin er führt (Ergebnisse vs. Cookbook).
 */
@Component({
  selector: 'app-recipe-card',
  imports: [RouterLink],
  templateUrl: './recipe-card.html',
  styleUrl: './recipe-card.scss'
})
export class RecipeCard {
  /** Das darzustellende Rezept. */
  readonly recipe = input.required<Recipe>();
  /** Optionale Nummer für das "Recipe N"-Label (1-basiert). */
  readonly index = input<number | null>(null);
  /** Herkunft, damit die Detailseite den Zurück-Weg kennt. */
  readonly context = input<'results' | 'cookbook'>('results');
}
