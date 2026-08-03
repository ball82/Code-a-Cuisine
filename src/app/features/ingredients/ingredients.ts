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
 * Step 1 of the generator ("Generate recipe").
 * Left: input card (ingredient + amount + unit, with local autocomplete).
 * Right: the collected ingredient list (edit / delete).
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

  /** Allowed units (Contract 1 — technical lowercase values). */
  readonly units: Unit[] = ['gram', 'ml', 'liter', 'piece'];

  /** Current form input (the top field). */
  readonly name = signal('');
  readonly amount = signal(100);
  readonly unit = signal<Unit>('gram');

  /** Index of the row currently being edited – otherwise null (= new entry). */
  readonly editIndex = signal<number | null>(null);

  /**
   * Open/closed state of the custom unit dropdown. Replaces the native
   * <select>, whose OS popup could not be positioned/styled.
   */
  readonly unitOpen = signal(false);

  /**
   * The finished list lives in the RecipeDraft service (shared state) so it is
   * preserved when navigating back and forth.
   */
  readonly items = this.draft.ingredients;

  /** Local autocomplete source, loaded once (no external API). */
  private readonly allNames = toSignal(this.ingredientData.getIngredients(), {
    initialValue: [] as string[]
  });

  /** Each name paired with its normalized form, so typing does not re-normalize the list. */
  private readonly nameEntries = computed(() =>
    this.allNames().map((name) => ({ name, key: this.normalize(name) }))
  );

  /** Normalized name → canonical spelling, so lookups ignore case and spacing. */
  private readonly nameIndex = computed(
    () => new Map(this.nameEntries().map(({ name, key }) => [key, name]))
  );

  /**
   * Suggestions: substring matches (not just prefix), excluding an exact match,
   * max. 8. Prefix matches are moved to the front, the rest alphabetical.
   */
  readonly suggestions = computed(() => {
    const q = this.normalize(this.name());
    if (!q) return [];
    if (this.nameIndex().has(q)) return [];
    return this.nameEntries()
      .filter(({ key }) => key.includes(q))
      .sort((a, b) => {
        const aStarts = a.key.startsWith(q) ? 0 : 1;
        const bStarts = b.key.startsWith(q) ? 0 : 1;
        return aStarts - bStarts || a.name.localeCompare(b.name);
      })
      .slice(0, 8)
      .map(({ name }) => name);
  });

  /**
   * The list entry the input resolves to – null if it is not a known
   * ingredient. Only these names may end up in the draft.
   */
  readonly matchedName = computed(() => this.nameIndex().get(this.normalize(this.name())) ?? null);

  /** Shown once the typed text can no longer become a known ingredient. */
  readonly showUnknownHint = computed(
    () => this.name().trim().length > 0 && !this.matchedName() && this.suggestions().length === 0
  );

  /** "+"/"Save" only active for a known ingredient with amount > 0. */
  readonly canAdd = computed(() => this.matchedName() !== null && this.amount() > 0);

  /** "Next step" only active when at least one ingredient is present. */
  readonly canContinue = computed(() => this.items().length > 0);

  /** Short form of the unit for the list display ("100g", "1" for pieces). */
  short(unit: Unit): string {
    return { gram: 'g', ml: 'ml', liter: 'l', piece: '' }[unit];
  }

  /** Adopts an autocomplete suggestion into the name field. */
  pick(name: string): void {
    this.name.set(name);
  }

  /** Enter adds a valid ingredient, otherwise it adopts the first suggestion. */
  onEnter(): void {
    if (this.canAdd()) {
      this.addOrUpdate();
      return;
    }
    const first = this.suggestions()[0];
    if (first) this.pick(first);
  }

  /** Ignores case, spacing and punctuation ("olive-oil" → "oliveoil"). */
  private normalize(value: string): string {
    return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
  }

  /** Opens/closes the unit dropdown. */
  toggleUnit(): void {
    this.unitOpen.update((open) => !open);
  }

  /** Selects a unit and closes the dropdown. */
  pickUnit(u: Unit): void {
    this.unit.set(u);
    this.unitOpen.set(false);
  }

  /** A click outside closes the unit dropdown. */
  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent): void {
    if (this.unitOpen() && !(e.target as HTMLElement).closest('.unit-select')) {
      this.unitOpen.set(false);
    }
  }

  /** Escape closes the unit dropdown. */
  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.unitOpen.set(false);
  }

  /** Adds the current input – or overwrites the edited row. */
  addOrUpdate(): void {
    const matched = this.matchedName();
    if (!matched || !this.canAdd()) return;
    const entry: Ingredient = {
      name: matched,
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

  /** Loads a row back into the form for editing. */
  edit(i: number): void {
    const it = this.items()[i];
    this.name.set(it.name);
    this.amount.set(it.amount);
    this.unit.set(it.unit);
    this.editIndex.set(i);
  }

  /** Removes a row (and leaves edit mode if applicable). */
  remove(i: number): void {
    this.draft.ingredients.update((list) => list.filter((_, idx) => idx !== i));
    if (this.editIndex() === i) this.reset();
  }

  /** Continue to step 2 (preferences). The ingredients are already in the draft. */
  next(): void {
    if (!this.canContinue()) return;
    this.router.navigate(['/preferences']);
  }

  /**
   * Resets the input form to its initial values (empty name, 100 g) and leaves
   * any edit mode.
   */
  private reset(): void {
    this.name.set('');
    this.amount.set(100);
    this.unit.set('gram');
    this.editIndex.set(null);
  }
}
