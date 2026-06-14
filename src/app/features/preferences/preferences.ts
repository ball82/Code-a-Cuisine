import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CookingTime, Cuisine, Diet } from '../../core/models/recipe-request';
import { RecipeDraft } from '../../core/services/recipe-draft';

/** Eine Chip-Option: technischer Wert + Anzeigetext (+ optionaler Hinweis). */
interface ChipOption<T> {
  value: T;
  label: string;
  hint?: string;
}

/**
 * Schritt 2 des Generators ("Choose your preferences").
 * Portionen/Köche als Stepper, Kochzeit/Küche/Diät als Single-Select-Chips.
 * Der Zustand liegt im RecipeDraft-Service, bleibt also beim Zurück erhalten.
 */
@Component({
  selector: 'app-preferences',
  imports: [RouterLink],
  templateUrl: './preferences.html',
  styleUrl: './preferences.scss'
})
export class Preferences {
  private readonly draft = inject(RecipeDraft);

  /** Geteilter Zustand aus dem Draft (Signals). */
  readonly portions = this.draft.portions;
  readonly cooks = this.draft.cooks;
  readonly cookingTime = this.draft.cookingTime;
  readonly cuisine = this.draft.cuisine;
  readonly diet = this.draft.diet;

  /** Zeitkategorien laut Checkliste (quick ≤20 / medium 20–45 / complex 45+). */
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

  /** Stepper-Grenzen (Vertrag 1: portions 1–12, cooks 1–3). */
  readonly canMorePortions = computed(() => this.portions() < 12);
  readonly canFewerPortions = computed(() => this.portions() > 1);
  readonly canMoreCooks = computed(() => this.cooks() < 3);
  readonly canFewerCooks = computed(() => this.cooks() > 1);

  stepPortions(delta: number): void {
    this.portions.update((p) => Math.min(12, Math.max(1, p + delta)));
  }

  stepCooks(delta: number): void {
    this.cooks.update((c) => Math.min(3, Math.max(1, c + delta)));
  }

  /**
   * Stellt den vollständigen Request (Vertrag 1) zusammen.
   * Das Absenden an n8n + die Ergebnis-Seite folgen im nächsten Schritt.
   */
  generate(): void {
    const request = this.draft.toRequest();
    console.log('Recipe request (TODO: an n8n senden):', request);
  }
}
