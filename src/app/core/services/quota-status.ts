import { Injectable, signal } from '@angular/core';

/** localStorage key for the last confirmed quota state. */
const QUOTA_KEY = 'cac_quota_status';

/** Daily generation limit per IP (mirror of the backend value IP_LIMIT). */
const DAILY_LIMIT = 3;

/** Persisted state: number of remaining generations on a given day. */
interface StoredQuota {
  /** Day in format YYYY-MM-DD (UTC) on which `remaining` applied. */
  date: string;
  remaining: number;
}

/**
 * Makes the IP daily quota visible to the user (US11 transparency).
 *
 * The authoritative count lives server-side (n8n counts by IP). Here we only
 * remember the last `remaining` value confirmed by the server – from the
 * generation response or the 429 – and show it as long as it is from today.
 * Without a confirmed value (first generation of the day) the display falls
 * back to the daily limit as a neutral hint. So localStorage is only a
 * display cache, never the authority – another browser on the same IP may
 * differ; the server stays the truth and enforces the limit.
 */
@Injectable({ providedIn: 'root' })
export class QuotaStatus {
  readonly dailyLimit = DAILY_LIMIT;

  /** Remaining generations per today's server confirmation, otherwise null. */
  readonly remaining = signal<number | null>(this.loadForToday());

  /** Accepts a server-confirmed `remaining` value and persists it. */
  record(remaining: number): void {
    const clamped = Math.max(0, Math.min(DAILY_LIMIT, Math.floor(remaining)));
    this.remaining.set(clamped);
    this.persist({ date: this.today(), remaining: clamped });
  }

  /** Today's date (YYYY-MM-DD, UTC) – identical to the doc-ID logic in the backend. */
  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  /**
   * Reads the persisted remaining state, but only if it is from today. A state
   * from yesterday no longer applies – the counter is reset overnight.
   * @returns Today's `remaining` value or `null` if none is present.
   */
  private loadForToday(): number | null {
    if (typeof localStorage === 'undefined') return null;
    try {
      const raw = localStorage.getItem(QUOTA_KEY);
      if (!raw) return null;
      const stored = JSON.parse(raw) as StoredQuota;
      return stored.date === this.today() ? stored.remaining : null;
    } catch {
      return null;
    }
  }

  /**
   * Writes the remaining state along with the date into localStorage. If
   * localStorage is unavailable (private mode), the display applies to the
   * session only.
   * @param value State to store (date + remaining generations).
   */
  private persist(value: StoredQuota): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(QUOTA_KEY, JSON.stringify(value));
    } catch {
      return;
    }
  }
}
