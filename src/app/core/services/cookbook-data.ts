import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, shareReplay, tap } from 'rxjs';

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
  const data = decodeFields(doc.fields ?? {});
  const id = doc.name.split('/').pop() ?? '';
  return { ...(data as Omit<Recipe, 'id'>), id };
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

  /** Einmal geladene, geteilte Rezeptliste (live oder Beispieldaten). */
  private readonly recipes$ = this.load().pipe(
    // In den Store legen, damit die Detailseite Rezepte per ID findet.
    tap((recipes) => this.store.remember(recipes)),
    shareReplay(1)
  );

  /** Alle Cookbook-Rezepte. */
  getRecipes(): Observable<Recipe[]> {
    return this.recipes$;
  }

  private load(): Observable<Recipe[]> {
    const { projectId, apiKey } = environment.firebase;
    if (!projectId) {
      return of(SAMPLE_RECIPES);
    }

    const base = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/recipes`;
    const url = apiKey ? `${base}?key=${apiKey}` : base;

    return this.http.get<FirestoreListResponse>(url).pipe(
      map((res) => (res.documents ?? []).map(decodeRecipe)),
      // Netzwerk-/Rechtefehler dürfen das Cookbook nicht leer lassen.
      catchError(() => of(SAMPLE_RECIPES))
    );
  }
}
