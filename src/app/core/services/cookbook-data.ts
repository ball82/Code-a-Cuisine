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

/** Ein Firestore-Dokument aus der REST-API: Pfadname plus typisierte Felder. */
interface FirestoreDocument {
  name: string;
  fields?: Record<string, FirestoreValue>;
}

/** Antwort des Firestore-List-Endpunkts (eine Seite von Dokumenten). */
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

/**
 * Dekodiert eine Firestore-Feldabbildung rekursiv in ein natives Objekt.
 * @param fields Feld-Map eines Dokuments oder verschachtelten `mapValue`.
 * @returns Objekt mit denselben Schlüsseln und nativen JS-Werten.
 */
function decodeFields(fields: Record<string, FirestoreValue>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) out[key] = decodeValue(value);
  return out;
}

/**
 * Baut aus einem Firestore-Dokument ein {@link Recipe}; die ID stammt aus dem
 * Doc-Pfad. Das `cuisine`-Feld wird defensiv auf Kleinbuchstaben normalisiert:
 * der Vertrag schreibt technische Kleinwerte vor, ältere Daten enthalten aber
 * teils "Italian" – so fällt kein Rezept nur wegen Gross-/Kleinschreibung aus
 * seiner Kategorie.
 * @param doc Rohes Firestore-Dokument aus der REST-Antwort.
 * @returns Das dekodierte Rezept.
 */
function decodeRecipe(doc: FirestoreDocument): Recipe {
  const data = decodeFields(doc.fields ?? {}) as Omit<Recipe, 'id'>;
  const id = doc.name.split('/').pop() ?? '';
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
   * true, sobald der erste Firestore-Load durch ist (auch bei Fehler → Beispieldaten).
   * Die Detailseite wartet darauf, bevor sie einen unbekannten Deep-Link umleitet.
   */
  readonly ready = signal(false);

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

  /**
   * Startet beim Erzeugen des Services den einmaligen Firestore-Load und legt die
   * Rezepte zugleich in den {@link RecipeStore}, damit die Detailseite sie per ID
   * findet. `ready` wird danach gesetzt (auch im Fehlerfall über die Beispieldaten).
   */
  constructor() {
    this.load().subscribe((recipes) => {
      this.store.remember(recipes);
      this.loaded.set(recipes);
      this.ready.set(true);
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

  /**
   * Übernimmt den neuen Like-Zählerstand (aus der Like-Antwort) in beide Quellen
   * (geladen + lokal ergänzt), damit die Cookbook-Karten und die "Most liked"-
   * Leiste den Wert sofort zeigen – ohne Firestore-Reload.
   */
  updateLikeCount(id: string, likes: number): void {
    const patch = (list: Recipe[]) =>
      list.some((r) => r.id === id) ? list.map((r) => (r.id === id ? { ...r, likes } : r)) : list;
    this.loaded.update(patch);
    this.added.update(patch);
  }

  /**
   * Liest alle Rezepte aus Firestore. Ohne hinterlegte Firebase-Config liefert
   * die Methode lokale Beispieldaten. Andernfalls holt sie seitenweise ALLE
   * Dokumente: Firestore gibt pro Antwort einen `nextPageToken`, solange weitere
   * existieren; dem folgen wir via `expand` und sammeln die Seiten mit `reduce`
   * zu einer Liste. Netzwerk-/Rechtefehler dürfen das Cookbook nicht leer lassen,
   * daher fällt `catchError` ebenfalls auf die Beispieldaten zurück.
   * @returns Observable, das genau einmal die vollständige Rezeptliste emittiert.
   */
  private load(): Observable<Recipe[]> {
    const { projectId, apiKey } = environment.firebase;
    if (!projectId) {
      return of(SAMPLE_RECIPES);
    }

    const base = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/recipes`;
    const pageSize = 300;

    /**
     * Holt eine einzelne Firestore-Seite.
     * @param pageToken Token der Folgeseite; fehlt bei der ersten Seite.
     * @returns Observable mit der Firestore-Listenantwort.
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
