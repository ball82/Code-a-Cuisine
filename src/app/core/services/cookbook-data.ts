import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EMPTY, Observable, catchError, expand, of, reduce } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Recipe } from '../models/recipe';
import { RecipeStore } from './recipe-store';
import { SAMPLE_RECIPES } from './cookbook-sample';

/** Ein typisierter Firestore-REST-Wert (nur die hier vorkommenden Typen). */
interface FirestoreValue {
  stringValue?: string;
  integerValue?: string;
  doubleValue?: number;
  booleanValue?: boolean;
  timestampValue?: string;
  nullValue?: null;
  arrayValue?: { values?: FirestoreValue[] };
  mapValue?: { fields?: Record<string, FirestoreValue> };
}

interface FirestoreDocument {
  name: string;
  fields?: Record<string, FirestoreValue>;
}

interface FirestoreListResponse {
  documents?: FirestoreDocument[];
  /** Vorhanden, solange es weitere Seiten gibt. */
  nextPageToken?: string;
}

/** Wandelt einen typisierten Firestore-Wert in den nativen JS-Wert zurück. */
function decodeValue(value: FirestoreValue): unknown {
  if (value.stringValue !== undefined) return value.stringValue;
  if (value.integerValue !== undefined) return Number(value.integerValue);
  if (value.doubleValue !== undefined) return value.doubleValue;
  if (value.booleanValue !== undefined) return value.booleanValue;
  if (value.timestampValue !== undefined) return value.timestampValue;
  if (value.arrayValue !== undefined) return (value.arrayValue.values ?? []).map(decodeValue);
  if (value.mapValue !== undefined) return decodeFields(value.mapValue.fields ?? {});
  return null;
}

function decodeFields(fields: Record<string, FirestoreValue>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) out[key] = decodeValue(value);
  return out;
}

/** Baut aus einem Firestore-Dokument ein Recipe (ID kommt aus dem Doc-Pfad). */
function decodeRecipe(doc: FirestoreDocument): Recipe {
  const data = decodeFields(doc.fields ?? {}) as Omit<Recipe, 'id'>;
  const id = doc.name.split('/').pop() ?? '';
  // cuisine defensiv auf Kleinbuchstaben normalisieren: der Vertrag schreibt
  // technische Kleinwerte vor, ältere Daten enthalten aber teils "Italian".
  // So bleibt kein Rezept nur wegen Gross-/Kleinschreibung aus der Kategorie.
  const cuisine = String(data.cuisine ?? '').toLowerCase() as Recipe['cuisine'];
  return { ...data, cuisine, id };
}

/**
 * Liest die öffentliche `recipes`-Collection fürs Cookbook. Die Security Rules
 * erlauben Client-Reads auf `recipes` (read: true) – wir lesen sie direkt über
 * die Firestore-REST-API mit dem öffentlichen Firebase-API-Key.
 *
 * Solange keine Firebase-Config hinterlegt ist (projectId leer), liefern wir
 * lokale Beispieldaten, damit das Layout ohne Backend funktioniert. Sobald die
 * Config in src/environments/ steht, kommen die echten Daten. (Kann später
 * 1:1 durch AngularFire ersetzt werden, wenn @angular/fire eingebunden wird.)
 */
@Injectable({ providedIn: 'root' })
export class CookbookData {
  private readonly http = inject(HttpClient);
  private readonly store = inject(RecipeStore);

  /** Live (bzw. Beispiel-)Rezepte aus Firestore – einmal geladen. */
  private readonly loaded = signal<Recipe[]>([]);

  /** Lokal ergänzte, frisch generierte Rezepte (sofort sichtbar, ohne Reload). */
  private readonly added = signal<Recipe[]>([]);

  /**
   * Alle Cookbook-Rezepte: zuerst die frisch generierten (neueste zuerst),
   * dann die geladenen. Zwei getrennte Quellen, damit ein spät eintreffender
   * Firestore-Load die lokal ergänzten Rezepte nicht überschreibt.
   */
  readonly recipes = computed(() => {
    const added = this.added();
    const rest = this.loaded().filter((r) => !added.some((a) => a.id === r.id));
    return [...added, ...rest];
  });

  constructor() {
    // In den Store legen, damit die Detailseite Rezepte per ID findet.
    this.load().subscribe((recipes) => {
      this.store.remember(recipes);
      this.loaded.set(recipes);
    });
  }

  /**
   * Ergänzt frisch generierte Rezepte sofort im Cookbook. n8n hat sie bereits
   * in Firestore gespeichert – hier spiegeln wir sie nur lokal in die bereits
   * geladene Liste, damit sie ohne Seiten-Reload erscheinen (nach ID dedupt).
   */
  addGenerated(recipes: Recipe[]): void {
    if (!recipes.length) return;
    this.store.remember(recipes);
    this.added.update((current) => {
      const fresh = recipes.filter((r) => !current.some((c) => c.id === r.id));
      return [...fresh, ...current];
    });
  }

  private load(): Observable<Recipe[]> {
    const { projectId, apiKey } = environment.firebase;
    if (!projectId) {
      return of(SAMPLE_RECIPES);
    }

    // Seitenweise ALLE Rezepte holen: Firestore liefert pro Antwort einen
    // nextPageToken, solange noch mehr Dokumente existieren. Wir folgen dem
    // Token via expand und sammeln alle Seiten mit reduce zu einer Liste.
    const base = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/recipes`;
    const pageSize = 300;

    const fetchPage = (pageToken?: string): Observable<FirestoreListResponse> => {
      let url = `${base}?pageSize=${pageSize}`;
      if (apiKey) url += `&key=${apiKey}`;
      if (pageToken) url += `&pageToken=${encodeURIComponent(pageToken)}`;
      return this.http.get<FirestoreListResponse>(url);
    };

    return fetchPage().pipe(
      expand((res) => (res.nextPageToken ? fetchPage(res.nextPageToken) : EMPTY)),
      reduce(
        (all, res) => all.concat((res.documents ?? []).map(decodeRecipe)),
        [] as Recipe[]
      ),
      // Netzwerk-/Rechtefehler dürfen das Cookbook nicht leer lassen.
      catchError(() => of(SAMPLE_RECIPES))
    );
  }
}
