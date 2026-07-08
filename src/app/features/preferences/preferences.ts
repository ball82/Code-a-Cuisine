import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CookingTime, Cuisine, Diet } from '../../core/models/recipe-request';
import { RecipeDraft } from '../../core/services/recipe-draft';
import { RecipeApi } from '../../core/services/recipe-api';

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
  private readonly api = inject(RecipeApi);

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

  /** Läuft gerade ein Generierungs-Request? Sperrt den Button gegen Doppelklicks. */
  readonly loading = signal(false);

  /** Freundliche Fehlermeldung (Validierung 400 / Quota 429 / Netzwerk) – sonst null. */
  readonly error = signal<string | null>(null);

  /**
   * Schickt den Request (Vertrag 1) an den n8n-Webhook und bekommt 3 fertige,
   * bereits in Firestore gespeicherte Rezepte zurück (Vertrag 2). Firebase ist
   * hier NICHT beteiligt – n8n schreibt selbst und antwortet mit den IDs.
   *
   * Die Ergebnis-Seite folgt separat; vorerst landet die Antwort in der Konsole.
   */
  generate(): void {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set(null);

    this.api.generateRecipes(this.draft.toRequest()).subscribe({
      next: (response) => {
        this.loading.set(false);
        console.log('Recipes from n8n:', response.recipes);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(this.messageFor(err));
      }
    });
  }

  /** Übersetzt die n8n-Statuscodes (siehe CLAUDE.md) in eine freundliche Meldung. */
  private messageFor(err: unknown): string {
    const status = (err as { status?: number }).status;
    if (status === 400) return 'Please check your ingredients and preferences and try again.';
    if (status === 429) return 'Our daily recipe quota is used up. Please try again tomorrow.';
    return 'Something went wrong while generating your recipes. Please try again.';
  }
}
