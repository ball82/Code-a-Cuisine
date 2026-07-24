import { Component, input, output } from '@angular/core';

/**
 * Modal "Oops!" dialog. Appears when Gemini/n8n signals that the ingredients
 * (or their amounts) are not enough for the requested portions – not a
 * technical error, but a friendly response.
 */
@Component({
  selector: 'app-error-dialog',
  templateUrl: './error-dialog.html',
  styleUrl: './error-dialog.scss'
})
export class ErrorDialog {
  /** Heading of the dialog. */
  readonly heading = input('Ups! Not quite enough…');
  /** Explanatory body text. */
  readonly message = input(
    'Your ingredients (or the amounts) are not enough for the recipes you asked for. Add a bit more and try again.'
  );
  /** Label of the confirmation button. */
  readonly actionLabel = input('Go back to ingredients');

  /** Fires when the user closes the dialog (button or backdrop). */
  readonly dismiss = output<void>();
}
