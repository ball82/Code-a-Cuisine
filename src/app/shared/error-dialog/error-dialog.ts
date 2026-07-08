import { Component, input, output } from '@angular/core';

/**
 * Modaler "Ups!"-Dialog. Erscheint, wenn Gemini/n8n signalisiert, dass die
 * Zutaten (oder deren Mengen) nicht für die gewünschten Portionen reichen –
 * kein technischer Fehler, sondern eine freundliche Rückmeldung (vgl. DESIGN.md).
 */
@Component({
  selector: 'app-error-dialog',
  templateUrl: './error-dialog.html',
  styleUrl: './error-dialog.scss'
})
export class ErrorDialog {
  /** Überschrift des Dialogs. */
  readonly heading = input('Ups! Not quite enough…');
  /** Erklärender Fließtext. */
  readonly message = input(
    'Your ingredients (or the amounts) are not enough for the recipes you asked for. Add a bit more and try again.'
  );
  /** Beschriftung des Bestätigungs-Buttons. */
  readonly actionLabel = input('Go back to ingredients');

  /** Feuert, wenn der Nutzer den Dialog schliesst (Button oder Backdrop). */
  readonly dismiss = output<void>();
}
