import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { Ingredient, Unit } from '../../core/models/ingredient';
import { Direction, Recipe } from '../../core/models/recipe';
import { RecipeApi } from '../../core/services/recipe-api';
import { RecipeStore } from '../../core/services/recipe-store';
import { CookbookData } from '../../core/services/cookbook-data';

/** Kurzform der Einheit für die Zutatenzeile. */
const UNIT_SHORT: Record<Unit, string> = { gram: 'g', ml: 'ml', liter: 'l', piece: '×' };

/** Rundet eine skalierte Menge auf max. 1 Nachkommastelle (ganze Zahlen bleiben ganz). */
function roundAmount(amount: number): number {
  return Math.round(amount * 10) / 10;
}

/** Energiegehalt pro Gramm Makronährstoff (kcal) – Basis der Prozent-Aufteilung. */
const KCAL_PER_GRAM = { protein: 4, fat: 9, carbs: 4 } as const;

/** Ein Segment der Makroverteilung für Chart, Legende und Tabelle. */
export interface MacroSlice {
  /** Schlüssel = zugleich CSS-Klassenendung (protein/fat/carbs). */
  key: 'protein' | 'fat' | 'carbs';
  label: string;
  /** Auf die gewählte Portionszahl skalierte Menge in Gramm. */
  grams: number;
  /** Ganzzahliger Anteil an der Nährenergie; die drei Werte ergeben zusammen 100. */
  percent: number;
  /** Datenfarbe des Segments (CSS-Variable aus styles.scss). */
  color: string;
}

/**
 * Rundet Anteile so auf ganze Prozent, dass die Summe exakt 100 bleibt
 * (Largest-Remainder-Verfahren): erst abrunden, dann die verbleibenden Punkte
 * an die Werte mit dem grössten Nachkomma-Rest verteilen.
 */
function roundPercentages(shares: number[]): number[] {
  const raw = shares.map((s) => s * 100);
  const floors = raw.map(Math.floor);
  let remainder = 100 - floors.reduce((a, b) => a + b, 0);
  const order = raw
    .map((value, i) => ({ i, frac: value - floors[i] }))
    .sort((a, b) => b.frac - a.frac);
  const result = [...floors];
  for (let k = 0; k < order.length && remainder > 0; k++, remainder--) {
    result[order[k].i]++;
  }
  return result;
}

/**
 * Rezept-Detailseite. Zeigt Nährwerte (skalierbar über einen Portions-Regler),
 * Zutaten (deine + Extra), die Kochschritte mit Chef-Badges und einen
 * Like-Button (Toggle, nach Klick kurz gesperrt gegen Doppelklicks).
 *
 * Zurück-Weg ist kontextabhängig (Query-Param `from`): vom Generator zurück zu
 * den Ergebnissen, vom Cookbook zurück ins Cookbook.
 */
@Component({
  selector: 'app-recipe-detail',
  imports: [RouterLink],
  templateUrl: './recipe-detail.html',
  styleUrl: './recipe-detail.scss'
})
export class RecipeDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(RecipeStore);
  private readonly api = inject(RecipeApi);
  private readonly cookbook = inject(CookbookData);

  /** Rezept-ID aus der Route. */
  private readonly id = this.route.snapshot.paramMap.get('id');

  /**
   * Das anzuzeigende Rezept. Erst im Store suchen (frisch generiert), sonst im
   * live geladenen Cookbook – Letzteres ist nötig, damit geteilte Deep-Links und
   * ein Reload funktionieren (Store-Cache ist dann leer, das Cookbook lädt aber
   * alle Rezepte direkt aus Firestore). Das reaktive `cookbook.recipes()` sorgt
   * dafür, dass der Lookup erneut läuft, sobald die Daten eintreffen.
   */
  readonly recipe = computed<Recipe | undefined>(() => {
    if (!this.id) return undefined;
    return this.store.byId(this.id) ?? this.cookbook.recipes().find((r) => r.id === this.id);
  });

  /** Merker, damit die Startwerte (Portionen/Likes) nur einmal gesetzt werden. */
  private seeded = false;

  /** Herkunft → bestimmt den Zurück-Weg (Link + Beschriftung). */
  private readonly from = this.route.snapshot.queryParamMap.get('from');
  readonly backLink = this.from === 'cookbook' ? '/cookbook' : '/recipe-results';
  readonly backLabel = this.from === 'cookbook' ? 'Cookbook' : 'Recipes';

  /** Portionen für die Nährwert-Skalierung (Werte im Vertrag sind pro Portion). */
  readonly portions = signal(1);

  /** Like-Zustand (lokal gemerkt) + aktueller Zähler + Klicksperre. */
  readonly liked = signal(false);
  readonly likeCount = signal(0);
  readonly likeBusy = signal(false);

  /** Gesamt-Nährwerte = Wert pro Portion × gewählte Portionszahl. */
  readonly nutrition = computed(() => {
    const r = this.recipe();
    if (!r) return null;
    const f = this.portions();
    const n = r.nutritionPerPortion;
    return {
      calories: Math.round(n.calories * f),
      protein: Math.round(n.protein * f),
      fat: Math.round(n.fat * f),
      carbs: Math.round(n.carbs * f)
    };
  });

  /**
   * Makroverteilung (US10): Anteil der drei Makronährstoffe an der Nährenergie.
   * Die Prozente kommen aus dem Energiegehalt (Fett 9 kcal/g, Protein/Carbs je
   * 4 kcal/g), nicht aus der Masse – so entspricht die Aufteilung dem, was der
   * kcal-Wert oben ausmacht. Die Prozente sind portionsunabhängig (ein
   * Verhältnis); die Gramm-Angaben skalieren mit dem Portionsregler.
   */
  readonly macros = computed<MacroSlice[]>(() => {
    const n = this.nutrition();
    if (!n) return [];
    const energy = {
      protein: n.protein * KCAL_PER_GRAM.protein,
      fat: n.fat * KCAL_PER_GRAM.fat,
      carbs: n.carbs * KCAL_PER_GRAM.carbs
    };
    const total = energy.protein + energy.fat + energy.carbs;
    const keys = ['protein', 'fat', 'carbs'] as const;
    const labels = { protein: 'Protein', fat: 'Fat', carbs: 'Carbs' };
    const colors = {
      protein: 'var(--chart-protein)',
      fat: 'var(--chart-fat)',
      carbs: 'var(--chart-carbs)'
    };
    // Ohne Nährenergie (alle Makros 0) bleibt die Aufteilung leer statt 0/0.
    const percents = total > 0 ? roundPercentages(keys.map((k) => energy[k] / total)) : [0, 0, 0];
    return keys.map((key, i) => ({
      key,
      label: labels[key],
      grams: n[key],
      percent: percents[i],
      color: colors[key]
    }));
  });

  /** Barrierefreie Textfassung der Makroverteilung (für den Screenreader). */
  readonly macroSummary = computed(() =>
    this.macros()
      .map((m) => `${m.label} ${m.percent}%`)
      .join(', ')
  );

  /**
   * Skalierungsfaktor für die Zutatenmengen: gewählte Portionen ÷ Portionen,
   * für die das Rezept ursprünglich generiert wurde. Bei gleicher Portionszahl
   * bleibt er 1 (Originalmengen).
   */
  readonly scale = computed(() => {
    const base = this.recipe()?.portions ?? 0;
    return base > 0 ? this.portions() / base : 1;
  });

  /** Zutaten des Nutzers, auf die gewählte Portionszahl hochgerechnet. */
  readonly yourIngredients = computed(() => this.scaleList(this.recipe()?.yourIngredients));

  /** Zusätzlich benötigte Zutaten, ebenfalls auf die Portionszahl skaliert. */
  readonly extraIngredients = computed(() => this.scaleList(this.recipe()?.extraIngredients));

  /** Chef-Nummern von 1..cooks (für die "Cooking person"-Pillen und die ToDo-Spalten). */
  readonly chefs = computed(() => {
    const r = this.recipe();
    return r ? Array.from({ length: r.cooks }, (_, i) => i + 1) : [];
  });

  /** Rechnet eine Zutatenliste mit dem aktuellen Skalierungsfaktor hoch (Menge × Faktor). */
  private scaleList(list: Ingredient[] | undefined): Ingredient[] {
    const factor = this.scale();
    return (list ?? []).map((ing) => ({ ...ing, amount: roundAmount(ing.amount * factor) }));
  }

  /**
   * Schritte eines bestimmten Kochs, in chronologischer Reihenfolge (US9:
   * eigene ToDo-Liste pro Person). Die globale Schrittnummer bleibt erhalten,
   * damit die zeitliche Abfolge über die Spalten hinweg erkennbar ist.
   */
  stepsForChef(chef: number): Direction[] {
    return this.recipe()?.directions.filter((d) => d.chef === chef) ?? [];
  }

  constructor() {
    // Reaktiv: Sobald das Rezept vorliegt (Store sofort, Cookbook nach dem Laden),
    // die Startwerte einmalig setzen. Erst wenn das Cookbook fertig geladen ist
    // UND das Rezept dann immer noch fehlt, zurück ins Cookbook umleiten – so
    // überlebt ein Deep-Link/Reload die kurze Ladephase.
    effect(() => {
      const recipe = this.recipe();
      if (recipe) {
        if (!this.seeded) {
          this.seeded = true;
          this.portions.set(recipe.portions);
          this.likeCount.set(recipe.likes);
          this.liked.set(this.store.isLiked(recipe.id));
        }
        return;
      }
      if (!this.id || this.cookbook.ready()) {
        this.router.navigate(['/cookbook']);
      }
    });
  }

  stepPortions(delta: number): void {
    this.portions.update((p) => Math.min(12, Math.max(1, p + delta)));
  }

  /** "80 g Pasta" bzw. "2× Egg" für Stück-Zutaten. */
  formatIngredient(ing: Ingredient): string {
    return ing.unit === 'piece'
      ? `${ing.amount}× ${ing.name}`
      : `${ing.amount} ${UNIT_SHORT[ing.unit]} ${ing.name}`;
  }

  /**
   * Toggelt den Like optimistisch, ruft den n8n-Webhook und gleicht mit der
   * Server-Antwort ab (Vertrag 3). Bei Fehler wird zurückgerollt. Der Button
   * bleibt während des Requests und danach ~500 ms gesperrt (Race-Condition).
   */
  toggleLike(): void {
    const r = this.recipe();
    if (!r || this.likeBusy()) return;

    const prevLiked = this.liked();
    const prevCount = this.likeCount();
    const nextLiked = !prevLiked;

    this.liked.set(nextLiked);
    this.likeCount.set(prevCount + (nextLiked ? 1 : -1));
    this.likeBusy.set(true);

    this.api.likeRecipe(r.id).subscribe({
      next: (res) => {
        this.liked.set(res.liked);
        this.likeCount.set(res.likes);
        this.store.setLiked(r.id, res.liked);
        this.releaseAfterCooldown();
      },
      error: () => {
        // Netzwerk-/Backend-Fehler → optimistische Änderung zurücknehmen.
        this.liked.set(prevLiked);
        this.likeCount.set(prevCount);
        this.releaseAfterCooldown();
      }
    });
  }

  private releaseAfterCooldown(): void {
    setTimeout(() => this.likeBusy.set(false), 500);
  }
}
