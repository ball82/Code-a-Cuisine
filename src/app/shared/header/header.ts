import { Component, inject } from '@angular/core';
import { Location } from '@angular/common';
import { RouterLink } from '@angular/router';

import { I18n } from '../../core/services/i18n';
import { LanguageToggle } from '../language-toggle/language-toggle';

/**
 * Seitenkopf: Logo (Link zur Landing-Seite), Sprachumschalter und ein
 * kontextabhängiger Zurück-Button. Wiederverwendbar über die Feature-Seiten.
 */
@Component({
  selector: 'app-header',
  imports: [RouterLink, LanguageToggle],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class Header {
  private readonly location = inject(Location);
  readonly i18n = inject(I18n);

  /** Geht im Browser-Verlauf einen Schritt zurück (kontextabhängig). */
  goBack(): void {
    this.location.back();
  }
}
