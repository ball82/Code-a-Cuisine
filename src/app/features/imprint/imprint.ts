import { Component, inject } from '@angular/core';

import { Header } from '../../shared/header/header';
import { I18n } from '../../core/services/i18n';

/**
 * Impressum / rechtliche Angaben. Statische Inhaltsseite, erreichbar über den
 * Footer-Link im Cookbook. Platzhaltertexte – vor Go-live mit echten Angaben füllen.
 */
@Component({
  selector: 'app-imprint',
  imports: [Header],
  templateUrl: './imprint.html',
  styleUrl: './imprint.scss'
})
export class Imprint {
  readonly i18n = inject(I18n);
}
