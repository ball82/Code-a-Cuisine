import { Component, inject } from '@angular/core';

import { I18n } from '../../core/services/i18n';

/** EN/DE-Umschalter. Liest/setzt die Sprache über den I18n-Service. */
@Component({
  selector: 'app-language-toggle',
  templateUrl: './language-toggle.html',
  styleUrl: './language-toggle.scss'
})
export class LanguageToggle {
  readonly i18n = inject(I18n);
}
