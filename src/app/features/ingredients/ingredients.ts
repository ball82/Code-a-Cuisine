import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

import { Ingredient, Unit } from '../../core/models/ingredient';
import { IngredientData } from '../../core/services/ingredient-data';
import { RecipeDraft } from '../../core/services/recipe-draft';

/**
 * Schritt 1 des Generators ("Generate recipe").
 * Links: Eingabe-Karte (Zutat + Menge + Einheit, mit lokaler Autocomplete).
 * Rechts: die gesammelte Zutatenliste (bearbeiten / löschen).
 */
@Component({
  selector: 'app-ingredients',
  imports: [FormsModule],
  templateUrl: './ingredients.html',
  styleUrl: './ingredients.scss'
})
export class Ingredients {
  private readonly ingredientData = inject(IngredientData);
  private readonly draft = inject(RecipeDraft);
  private readonly router = inject(Router);

  /** Erlaubte Einheiten (Vertrag 1 — technische Kleinbuchstaben). */
  readonly units: Unit[] = ['gram', 'ml', 'liter', 'piece'];

  /** Aktuelle Formular-Eingabe (das obere Feld). */
  readonly name = signal('');
  readonly amount = signal(100);
  readonly unit = signal<Unit>('gram');

  /** Index der Zeile, die gerade bearbeitet wird – sonst null (= Neueintrag). */
  readonly editIndex = signal<number | null>(null);

  /**
   * Die fertige Liste liegt im RecipeDraft-Service (geteilter Zustand), damit
   * sie beim Vor-/Zurücknavigieren erhalten bleibt.
   */
  readonly items = this.draft.ingredients;

  /** Lokale Autocomplete-Quelle, einmal geladen (keine externe API). */
  private readonly allNames = toSignal(this.ingredientData.getIngredients(), {
    initialValue: [] as string[]
  });

  /** Vorschläge: Treffer am Wortanfang, ohne exakten Treffer, max. 6. */
  readonly suggestions = computed(() => {
    const q = this.name().trim().toLowerCase();
    if (!q) return [];
    const names = this.allNames();
    if (names.some((n) => n.toLowerCase() === q)) return [];
    return names.filter((n) => n.toLowerCase().startsWith(q)).slice(0, 6);
  });

  /** "+"/"Speichern" nur aktiv bei Name + Menge > 0 (Validierung Vertrag 1). */
  readonly canAdd = computed(() => this.name().trim().length > 0 && this.amount() > 0);

  /** "Next step" nur aktiv, wenn mindestens eine Zutat vorhanden ist. */
  readonly canContinue = computed(() => this.items().length > 0);

  /** Kurzform der Einheit für die Listenanzeige ("100g", "1" bei Stück). */
  short(unit: Unit): string {
    return { gram: 'g', ml: 'ml', liter: 'l', piece: '' }[unit];
  }

  /** Übernimmt einen Autocomplete-Vorschlag ins Namensfeld. */
  pick(name: string): void {
    this.name.set(name);
  }

  /** Fügt die aktuelle Eingabe hinzu – oder überschreibt die bearbeitete Zeile. */
  addOrUpdate(): void {
    if (!this.canAdd()) return;
    const entry: Ingredient = {
      name: this.name().trim(),
      amount: this.amount(),
      unit: this.unit()
    };
    const idx = this.editIndex();
    this.draft.ingredients.update((list) => {
      if (idx === null) return [...list, entry];
      const copy = [...list];
      copy[idx] = entry;
      return copy;
    });
    this.reset();
  }

  /** Lädt eine Zeile zurück ins Formular zum Bearbeiten. */
  edit(i: number): void {
    const it = this.items()[i];
    this.name.set(it.name);
    this.amount.set(it.amount);
    this.unit.set(it.unit);
    this.editIndex.set(i);
  }

  /** Entfernt eine Zeile (und verlässt ggf. den Bearbeiten-Modus). */
  remove(i: number): void {
    this.draft.ingredients.update((list) => list.filter((_, idx) => idx !== i));
    if (this.editIndex() === i) this.reset();
  }

  /** Weiter zu Schritt 2 (Präferenzen). Die Zutaten liegen bereits im Draft. */
  next(): void {
    if (!this.canContinue()) return;
    this.router.navigate(['/preferences']);
  }

  private reset(): void {
    this.name.set('');
    this.amount.set(100);
    this.unit.set('gram');
    this.editIndex.set(null);
  }
}
