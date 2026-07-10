import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { I18n } from '../../core/services/i18n';
import { LanguageToggle } from '../../shared/language-toggle/language-toggle';

@Component({
  selector: 'app-landing',
  imports: [RouterLink, LanguageToggle],
  templateUrl: './landing.html',
  styleUrl: './landing.scss'
})
export class Landing {
  readonly i18n = inject(I18n);
}
