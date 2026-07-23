import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { CookingTime, Cuisine, Diet } from '../../core/models/recipe-request';
import { RecipeDraft } from '../../core/services/recipe-draft';
import { RecipeApi } from '../../core/services/recipe-api';
import { RecipeStore } from '../../core/services/recipe-store';
import { CookbookData } from '../../core/services/cookbook-data';
import { QuotaStatus } from '../../core/services/quota-status';
import { Loader } from '../../shared/loader/loader';
import { ErrorDialog } from '../../shared/error-dialog/error-dialog';
import { Header } from '../../shared/header/header';
import { Footer } from '../../shared/footer/footer';

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
  imports: [Loader, ErrorDialog, Header, Footer],
  templateUrl: './preferences.html',
  styleUrl: './preferences.scss'
})
export class Preferences {
  private readonly draft = inject(RecipeDraft);
  private readonly api = inject(RecipeApi);
  private readonly store = inject(RecipeStore);
  private readonly cookbook = inject(CookbookData);
  private readonly router = inject(Router);
  /** Verbleibende Tages-Generierungen – für die Transparenz-Zeile am Button. */
  readonly quota = inject(QuotaStatus);

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

  /** Ob die Portionszahl noch erhöht werden darf (Obergrenze 12, Vertrag 1). */
  readonly canMorePortions = computed(() => this.portions() < 12);

  /** Ob die Portionszahl noch verringert werden darf (Untergrenze 1). */
  readonly canFewerPortions = computed(() => this.portions() > 1);

  /** Ob die Anzahl kochender Personen noch erhöht werden darf (Obergrenze 3). */
  readonly canMoreCooks = computed(() => this.cooks() < 3);

  /** Ob die Anzahl kochender Personen noch verringert werden darf (Untergrenze 1). */
  readonly canFewerCooks = computed(() => this.cooks() > 1);

  /**
   * Ändert die Portionszahl und hält sie im gültigen Bereich 1–12 (Vertrag 1).
   * @param delta Schrittweite, üblicherweise +1 oder −1.
   */
  stepPortions(delta: number): void {
    this.portions.update((p) => Math.min(12, Math.max(1, p + delta)));
  }

  /**
   * Ändert die Anzahl kochender Personen und hält sie im gültigen Bereich 1–3
   * (Vertrag 1).
   * @param delta Schrittweite, üblicherweise +1 oder −1.
   */
  stepCooks(delta: number): void {
    this.cooks.update((c) => Math.min(3, Math.max(1, c + delta)));
  }

  /** Läuft gerade ein Generierungs-Request? Sperrt den Button gegen Doppelklicks. */
  readonly loading = signal(false);

  /** Freundliche Fehlermeldung (Validierung 400 / Quota 429 / Netzwerk) – sonst null. */
  readonly error = signal<string | null>(null);

  /** "Ups!"-Dialog: Gemini/n8n meldet, dass Zutaten/Mengen nicht reichen. */
  readonly showInsufficient = signal(false);

  /**
   * Schickt den Request (Vertrag 1) an den n8n-Webhook und bekommt 3 fertige,
   * bereits in Firestore gespeicherte Rezepte zurück (Vertrag 2). Firebase ist
   * hier NICHT beteiligt – n8n schreibt selbst und antwortet mit den IDs.
   *
   * Bei Erfolg landen die Rezepte im RecipeStore, werden zur sofortigen Anzeige
   * ins Cookbook gespiegelt (ohne Seiten-Reload) und wir wechseln zur
   * Ergebnisseite; einen vom Server bestätigten `remaining`-Stand übernimmt der
   * {@link QuotaStatus}. Meldet das Backend „zu wenig Zutaten", erscheint der
   * freundliche „Ups!"-Dialog statt einer Fehlermeldung. Bei ausgeschöpfter
   * Quota (429) wird der Rest-Stand auf 0 gesetzt.
   */
  generate(): void {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set(null);

    this.api.generateRecipes(this.draft.toRequest()).subscribe({
      next: (response) => {
        this.loading.set(false);
        if (!response?.recipes?.length) {
          this.showInsufficient.set(true);
          return;
        }
        if (typeof response.remaining === 'number') this.quota.record(response.remaining);
        this.store.setGenerated(response.recipes);
        this.cookbook.addGenerated(response.recipes);
        this.router.navigate(['/recipe-results']);
      },
      error: (err) => {
        this.loading.set(false);
        if ((err as { status?: number }).status === 429) this.quota.record(0);
        this.error.set(this.messageFor(err));
      }
    });
  }

  /** Schliesst den „Ups!"-Dialog und führt zurück zu den Zutaten. */
  dismissInsufficient(): void {
    this.showInsufficient.set(false);
    this.router.navigate(['/ingredients']);
  }

  /** Übersetzt die n8n-Statuscodes (siehe CLAUDE.md) in eine freundliche Meldung. */
  private messageFor(err: unknown): string {
    const status = (err as { status?: number }).status;
    if (status === 400) return 'Please check your ingredients and preferences and try again.';
    if (status === 429) return 'Our daily recipe quota is used up. Please try again tomorrow.';
    return 'Something went wrong while generating your recipes. Please try again.';
  }
}
