import { Component, computed, HostListener, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

import { Ingredient, Unit } from '../../core/models/ingredient';
import { IngredientData } from '../../core/services/ingredient-data';
import { RecipeDraft } from '../../core/services/recipe-draft';
import { Header } from '../../shared/header/header';
import { Footer } from '../../shared/footer/footer';

/**
 * Schritt 1 des Generators ("Generate recipe").
 * Links: Eingabe-Karte (Zutat + Menge + Einheit, mit lokaler Autocomplete).
 * Rechts: die gesammelte Zutatenliste (bearbeiten / löschen).
 */
@Component({
  selector: 'app-ingredients',
  imports: [FormsModule, Header, Footer],
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
   * Auf/Zu-Zustand des eigenen Einheiten-Dropdowns. Ersetzt das native
   * <select>, dessen OS-Popup sich nicht positionieren/stylen ließ.
   */
  readonly unitOpen = signal(false);

  /**
   * Die fertige Liste liegt im RecipeDraft-Service (geteilter Zustand), damit
   * sie beim Vor-/Zurücknavigieren erhalten bleibt.
   */
  readonly items = this.draft.ingredients;

  /** Lokale Autocomplete-Quelle, einmal geladen (keine externe API). */
  private readonly allNames = toSignal(this.ingredientData.getIngredients(), {
    initialValue: [] as string[]
  });

  /**
   * Vorschläge: Teilwort-Treffer (nicht nur Wortanfang), ohne exakten Treffer,
   * max. 8. Wortanfang-Treffer werden vorgereiht, der Rest alphabetisch.
   */
  readonly suggestions = computed(() => {
    const q = this.name().trim().toLowerCase();
    if (!q) return [];
    const names = this.allNames();
    if (names.some((n) => n.toLowerCase() === q)) return [];
    return names
      .filter((n) => n.toLowerCase().includes(q))
      .sort((a, b) => {
        const aStarts = a.toLowerCase().startsWith(q) ? 0 : 1;
        const bStarts = b.toLowerCase().startsWith(q) ? 0 : 1;
        return aStarts - bStarts || a.localeCompare(b);
      })
      .slice(0, 8);
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

  /** Öffnet/schließt das Einheiten-Dropdown. */
  toggleUnit(): void {
    this.unitOpen.update((open) => !open);
  }

  /** Wählt eine Einheit und schließt das Dropdown. */
  pickUnit(u: Unit): void {
    this.unit.set(u);
    this.unitOpen.set(false);
  }

  /** Klick außerhalb schließt das Einheiten-Dropdown. */
  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent): void {
    if (this.unitOpen() && !(e.target as HTMLElement).closest('.unit-select')) {
      this.unitOpen.set(false);
    }
  }

  /** Escape schließt das Einheiten-Dropdown. */
  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.unitOpen.set(false);
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

  /**
   * Setzt das Eingabeformular auf die Ausgangswerte zurück (leerer Name, 100 g)
   * und verlässt einen etwaigen Bearbeitungsmodus.
   */
  private reset(): void {
    this.name.set('');
    this.amount.set(100);
    this.unit.set('gram');
    this.editIndex.set(null);
  }
}
