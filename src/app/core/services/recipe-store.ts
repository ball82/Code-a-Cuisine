import { Injectable, signal } from '@angular/core';

import { Recipe } from '../models/recipe';

/** localStorage-Schlüssel für die vom Browser gelikten Rezept-IDs. */
const LIKED_KEY = 'cac_liked_recipes';

/**
 * Hält die zuletzt generierten Rezepte für die Ergebnis- und Detailseite und
 * merkt sich, welche Rezepte dieser Browser geliked hat.
 *
 * Warum der Like-Zustand hier (und im localStorage) liegt: Der Like-Marker
 * steht serverseitig in der gesperrten `recipeLikes`-Collection und ist nach
 * Server-IP geschlüsselt – das Frontend kann ihn NICHT aus Firestore lesen
 * (siehe PROJEKT-KONTEXT.md §6). Wir merken uns den Zustand daher lokal, sobald
 * der Nutzer klickt oder ihn aus der Like-Antwort erfährt.
 */
@Injectable({ providedIn: 'root' })
export class RecipeStore {
  /** Die zuletzt generierten Rezepte (Reihenfolge = Anzeige auf der Ergebnisseite). */
  readonly generated = signal<Recipe[]>([]);

  /** Alle je gesehenen Rezepte (generiert ODER aus dem Cookbook) für die Detail-Suche. */
  private readonly cache = new Map<string, Recipe>();

  /** IDs, die dieser Browser geliked hat. */
  readonly liked = signal<Set<string>>(this.loadLiked());

  /** Übernimmt frisch generierte Rezepte als aktuelle Ergebnisliste. */
  setGenerated(recipes: Recipe[]): void {
    this.remember(recipes);
    this.generated.set(recipes);
  }

  /** Legt Rezepte in den Lookup-Cache (z.B. beim Laden des Cookbooks). */
  remember(recipes: Recipe[]): void {
    for (const recipe of recipes) this.cache.set(recipe.id, recipe);
  }

  /** Findet ein Rezept nach ID (aus generierten oder gecachten Cookbook-Daten). */
  byId(id: string): Recipe | undefined {
    return this.cache.get(id);
  }

  /**
   * Übernimmt den neuen Like-Zählerstand (aus der Like-Antwort) in den
   * Lookup-Cache und die Ergebnisliste, damit Detail- und Ergebniskarten den
   * Wert ohne Reload zeigen. Die betroffenen Rezepte werden durch neue Objekte
   * ersetzt, damit die Signale reaktiv nachziehen.
   */
  updateLikeCount(id: string, likes: number): void {
    const cached = this.cache.get(id);
    if (cached) this.cache.set(id, { ...cached, likes });
    this.generated.update((list) =>
      list.some((r) => r.id === id) ? list.map((r) => (r.id === id ? { ...r, likes } : r)) : list
    );
  }

  /** Hat dieser Browser das Rezept geliked? */
  isLiked(id: string): boolean {
    return this.liked().has(id);
  }

  /** Setzt den lokalen Like-Zustand und spiegelt ihn ins localStorage. */
  setLiked(id: string, liked: boolean): void {
    this.liked.update((current) => {
      const next = new Set(current);
      if (liked) next.add(id);
      else next.delete(id);
      this.persist(next);
      return next;
    });
  }

  /**
   * Lädt die gelikten Rezept-IDs aus dem localStorage.
   * @returns Set der IDs; leer, wenn nichts gespeichert oder nicht lesbar ist.
   */
  private loadLiked(): Set<string> {
    if (typeof localStorage === 'undefined') return new Set();
    try {
      const raw = localStorage.getItem(LIKED_KEY);
      return new Set(raw ? (JSON.parse(raw) as string[]) : []);
    } catch {
      return new Set();
    }
  }

  /**
   * Schreibt die gelikten Rezept-IDs ins localStorage. Ist es nicht verfügbar
   * (privater Modus), bleibt der Like nur für die Sitzung erhalten.
   * @param ids Aktueller Satz gelikter Rezept-IDs.
   */
  private persist(ids: Set<string>): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(LIKED_KEY, JSON.stringify([...ids]));
    } catch {
      return;
    }
  }
}
