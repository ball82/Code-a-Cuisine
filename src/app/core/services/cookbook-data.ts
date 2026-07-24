import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EMPTY, Observable, catchError, expand, of, reduce } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Recipe } from '../models/recipe';
import { RecipeStore } from './recipe-store';
import { SAMPLE_RECIPES } from './cookbook-sample';

/** A typed Firestore REST value (only the types that occur here). */
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

/** A Firestore document from the REST API: path name plus typed fields. */
interface FirestoreDocument {
  name: string;
  fields?: Record<string, FirestoreValue>;
}

/** Response of the Firestore list endpoint (one page of documents). */
interface FirestoreListResponse {
  documents?: FirestoreDocument[];
  /** Present as long as more pages exist. */
  nextPageToken?: string;
}

/** Converts a typed Firestore value back into the native JS value. */
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

/**
 * Recursively decodes a Firestore field map into a native object.
 * @param fields Field map of a document or nested `mapValue`.
 * @returns Object with the same keys and native JS values.
 */
function decodeFields(fields: Record<string, FirestoreValue>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) out[key] = decodeValue(value);
  return out;
}

/**
 * Builds a {@link Recipe} from a Firestore document; the ID comes from the
 * doc path. The `cuisine` field is defensively normalized to lowercase:
 * the contract mandates technical lowercase values, but older data sometimes
 * contains "Italian" – this way no recipe drops out of its category just
 * because of casing.
 * @param doc Raw Firestore document from the REST response.
 * @returns The decoded recipe.
 */
function decodeRecipe(doc: FirestoreDocument): Recipe {
  const data = decodeFields(doc.fields ?? {}) as Omit<Recipe, 'id'>;
  const id = doc.name.split('/').pop() ?? '';
  const cuisine = String(data.cuisine ?? '').toLowerCase() as Recipe['cuisine'];
  return { ...data, cuisine, id };
}

/**
 * Reads the public `recipes` collection for the cookbook. The security rules
 * allow client reads on `recipes` (read: true) – we read them directly via
 * the Firestore REST API using the public Firebase API key.
 *
 * As long as no Firebase config is set (projectId empty), we return local
 * sample data so the layout works without a backend. Once the config is in
 * src/environments/, the real data comes through. (Can later be replaced
 * one-to-one by AngularFire if @angular/fire is added.)
 */
@Injectable({ providedIn: 'root' })
export class CookbookData {
  private readonly http = inject(HttpClient);
  private readonly store = inject(RecipeStore);

  /** Live (or sample) recipes from Firestore – loaded once. */
  private readonly loaded = signal<Recipe[]>([]);

  /** Locally added, freshly generated recipes (visible immediately, no reload). */
  private readonly added = signal<Recipe[]>([]);

  /**
   * true once the first Firestore load has completed (also on error → sample data).
   * The detail page waits for this before redirecting an unknown deep link.
   */
  readonly ready = signal(false);

  /**
   * All cookbook recipes: first the freshly generated ones (newest first),
   * then the loaded ones. Two separate sources so that a late-arriving
   * Firestore load does not overwrite the locally added recipes.
   */
  readonly recipes = computed(() => {
    const added = this.added();
    const rest = this.loaded().filter((r) => !added.some((a) => a.id === r.id));
    return [...added, ...rest];
  });

  /**
   * On service creation, starts the one-time Firestore load and also puts the
   * recipes into the {@link RecipeStore} so the detail page finds them by ID.
   * `ready` is set afterwards (even on error, via the sample data).
   */
  constructor() {
    this.load().subscribe((recipes) => {
      this.store.remember(recipes);
      this.loaded.set(recipes);
      this.ready.set(true);
    });
  }

  /**
   * Adds freshly generated recipes to the cookbook immediately. n8n has already
   * stored them in Firestore – here we only mirror them locally into the
   * already-loaded list so they appear without a page reload (deduped by ID).
   */
  addGenerated(recipes: Recipe[]): void {
    if (!recipes.length) return;
    this.store.remember(recipes);
    this.added.update((current) => {
      const fresh = recipes.filter((r) => !current.some((c) => c.id === r.id));
      return [...fresh, ...current];
    });
  }

  /**
   * Applies the new like counter (from the like response) to both sources
   * (loaded + locally added) so the cookbook cards and the "Most liked"
   * bar show the value immediately – without a Firestore reload.
   */
  updateLikeCount(id: string, likes: number): void {
    const patch = (list: Recipe[]) =>
      list.some((r) => r.id === id) ? list.map((r) => (r.id === id ? { ...r, likes } : r)) : list;
    this.loaded.update(patch);
    this.added.update(patch);
  }

  /**
   * Reads all recipes from Firestore. Without a configured Firebase config the
   * method returns local sample data. Otherwise it fetches ALL documents page
   * by page: Firestore returns a `nextPageToken` per response as long as more
   * exist; we follow it via `expand` and collect the pages into one list with
   * `reduce`. Network/permission errors must not leave the cookbook empty,
   * so `catchError` also falls back to the sample data.
   * @returns Observable that emits the complete recipe list exactly once.
   */
  private load(): Observable<Recipe[]> {
    const { projectId, apiKey } = environment.firebase;
    if (!projectId) {
      return of(SAMPLE_RECIPES);
    }

    const base = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/recipes`;
    const pageSize = 300;

    /**
     * Fetches a single Firestore page.
     * @param pageToken Token of the next page; absent on the first page.
     * @returns Observable with the Firestore list response.
     */
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
      catchError(() => of(SAMPLE_RECIPES))
    );
  }
}
