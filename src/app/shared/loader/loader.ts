import { Component, input } from '@angular/core';

/**
 * Vollbild-Ladeanzeige während der 10–20 s dauernden Gemini-Generierung.
 * Grüner Hintergrund, zentriertes Sage-Rechteck mit Bild, Text + animierte Punkte
 * (die Punkte verschwinden einzeln und erscheinen wieder – vgl. DESIGN.md).
 */
@Component({
  selector: 'app-loader',
  templateUrl: './loader.html',
  styleUrl: './loader.scss'
})
export class Loader {
  /** Text, der vor den animierten Punkten steht. */
  readonly message = input('Generating your recipes');
}
