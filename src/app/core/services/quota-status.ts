import { Injectable, signal } from '@angular/core';

/** localStorage-Schlüssel für den zuletzt bestätigten Quota-Stand. */
const QUOTA_KEY = 'cac_quota_status';

/** Tageslimit an Generierungen pro IP (Spiegel des Backend-Werts IP_LIMIT). */
const DAILY_LIMIT = 3;

/** Persistierter Stand: Anzahl verbleibender Generierungen an einem bestimmten Tag. */
interface StoredQuota {
  /** Tag im Format YYYY-MM-DD (UTC), an dem `remaining` galt. */
  date: string;
  remaining: number;
}

/**
 * Macht das IP-Tageskontingent für den Nutzer sichtbar (US11-Transparenz).
 *
 * Die maßgebliche Zählung liegt serverseitig (n8n zählt nach IP). Hier merken
 * wir uns nur den zuletzt vom Server bestätigten `remaining`-Wert – aus der
 * Generierungs-Antwort bzw. dem 429 – und zeigen ihn, solange er von heute ist.
 * Ohne bestätigten Wert (erste Generierung des Tages) fällt die Anzeige auf das
 * Tageslimit als neutralen Hinweis zurück. Das localStorage ist also nur ein
 * Anzeige-Cache, nie die Autorität – ein anderer Browser derselben IP kann davon
 * abweichen, der Server bleibt die Wahrheit und setzt das Limit durch.
 */
@Injectable({ providedIn: 'root' })
export class QuotaStatus {
  readonly dailyLimit = DAILY_LIMIT;

  /** Verbleibende Generierungen laut Server-Bestätigung von heute, sonst null. */
  readonly remaining = signal<number | null>(this.loadForToday());

  /** Übernimmt einen vom Server bestätigten `remaining`-Wert und persistiert ihn. */
  record(remaining: number): void {
    const clamped = Math.max(0, Math.min(DAILY_LIMIT, Math.floor(remaining)));
    this.remaining.set(clamped);
    this.persist({ date: this.today(), remaining: clamped });
  }

  /** Heutiges Datum (YYYY-MM-DD, UTC) – identisch zur Doc-ID-Logik im Backend. */
  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private loadForToday(): number | null {
    if (typeof localStorage === 'undefined') return null;
    try {
      const raw = localStorage.getItem(QUOTA_KEY);
      if (!raw) return null;
      const stored = JSON.parse(raw) as StoredQuota;
      // Ein Stand von gestern gilt heute nicht mehr – der Zähler ist zurückgesetzt.
      return stored.date === this.today() ? stored.remaining : null;
    } catch {
      return null;
    }
  }

  private persist(value: StoredQuota): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(QUOTA_KEY, JSON.stringify(value));
    } catch {
      /* localStorage nicht verfügbar (privater Modus) – Anzeige gilt nur für die Sitzung. */
    }
  }
}
