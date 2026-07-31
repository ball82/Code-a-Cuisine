import { Component, computed, effect, HostListener, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

import { Ingredient, Unit } from '../../core/models/ingredient';
import { IngredientData } from '../../core/services/ingredient-data';
import { OpenFoodFactsApi } from '../../core/services/openfoodfacts-api';
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
  private readonly foodApi = inject(OpenFoodFactsApi);
  private readonly draft = inject(RecipeDraft);
  private readonly router = inject(Router);

  /** Subject for debounced API searches. */
  private readonly searchQuery$ = new Subject<string>();

  /** Validated ingredients from the API (cached). */
  private readonly validatedIngredients = new Set<string>();

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

  /** Local autocomplete source as fallback. */
  private readonly localNames = toSignal(this.ingredientData.getIngredients(), {
    initialValue: [] as string[]
  });

  /** Live API suggestions from Open Food Facts. */
  readonly apiSuggestions = toSignal(
    this.searchQuery$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((query) => this.foodApi.searchIngredients(query))
    ),
    { initialValue: [] as string[] }
  );

  constructor() {
    // Trigger API search when user types
    effect(() => {
      const query = this.name();
      if (query.trim().length >= 2) {
        this.searchQuery$.next(query);
      }
    });
  }

  /** Combined suggestions from API and local fallback. */
  readonly suggestions = computed(() => {
    const q = this.name().trim();
    if (!q || q.length < 2) return [];

    const api = this.apiSuggestions();
    const local = this.localNames();
    const normalizedInput = this.normalizeName(q);

    // Prefer API suggestions
    if (api.length > 0) {
      return api.filter((n) => this.normalizeName(n) !== normalizedInput).slice(0, 8);
    }

    // Fallback to local list
    if (local.some((n) => this.normalizeName(n) === normalizedInput)) return [];

    return local
      .filter((n) => this.isSuggestionMatch(q, n))
      .sort((a, b) => {
        const aStarts = this.normalizeName(a).startsWith(normalizedInput) ? 0 : 1;
        const bStarts = this.normalizeName(b).startsWith(normalizedInput) ? 0 : 1;
        return aStarts - bStarts || a.localeCompare(b);
      })
      .slice(0, 8);
  });

  /** "+"/"Save" only active with a valid ingredient name + amount > 0. */
  readonly canAdd = computed(() => {
    const trimmed = this.name().trim();
    if (trimmed.length < 2 || this.amount() <= 0) return false;

    // Already validated or in suggestions
    if (this.validatedIngredients.has(this.normalizeName(trimmed))) return true;
    
    const api = this.apiSuggestions();
    const local = this.localNames();
    
    // Check if it matches API suggestions
    if (api.some((n) => this.normalizeName(n) === this.normalizeName(trimmed))) return true;
    
    // Fallback to local validation
    return this.isAcceptedIngredientName(trimmed, local);
  });

  /** "Next step" only active when at least one ingredient is present. */
  readonly canContinue = computed(() => this.items().length > 0);

  /** Short form of the unit for the list display ("100g", "1" for pieces). */
  short(unit: Unit): string {
    return { gram: 'g', ml: 'ml', liter: 'l', piece: '' }[unit];
  }

  /** Adopts an autocomplete suggestion into the name field. */
  pick(name: string): void {
    this.name.set(name);
    // Mark as validated
    this.validatedIngredients.add(this.normalizeName(name));
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
    const trimmed = this.name().trim();
    if (!this.canAdd()) return;

    // Mark as validated for future use
    this.validatedIngredients.add(this.normalizeName(trimmed));

    const entry: Ingredient = {
      name: trimmed,
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

  private normalizeName(value: string): string {
    return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
  }

  private isAcceptedIngredientName(value: string, localList: string[]): boolean {
    const normalizedInput = this.normalizeName(value);
    if (!normalizedInput || normalizedInput.length < 2) return false;

    const normalizedNames = localList.map((name) => this.normalizeName(name));
    if (normalizedNames.includes(normalizedInput)) return true;

    return normalizedNames.some((name) => this.isCloseMatch(normalizedInput, name));
  }

  private isSuggestionMatch(input: string, candidate: string): boolean {
    const normalizedInput = this.normalizeName(input);
    const normalizedCandidate = this.normalizeName(candidate);
    if (!normalizedInput || !normalizedCandidate) return false;
    if (normalizedCandidate.includes(normalizedInput)) return true;
    if (normalizedInput.includes(normalizedCandidate)) return true;
    return this.isCloseMatch(normalizedInput, normalizedCandidate);
  }

  private isCloseMatch(input: string, candidate: string): boolean {
    if (input === candidate) return true;
    if (input.length <= 2 || candidate.length <= 2) return false;
    if (input.startsWith(candidate) || candidate.startsWith(input)) return true;
    if (candidate.includes(input) || input.includes(candidate)) return true;
    return this.levenshteinDistance(input, candidate) <= 3;
  }

  private levenshteinDistance(a: string, b: string): number {
    const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));

    for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }

    return matrix[a.length][b.length];
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
