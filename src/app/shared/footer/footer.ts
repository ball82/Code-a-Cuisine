import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

type FooterTheme = 'light' | 'dark';

/** Einheitlicher Seitenabschluss mit dem Link zum Impressum. */
@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  templateUrl: './footer.html',
  styleUrl: './footer.scss'
})
export class Footer {
  /** Heller Footer auf weißen Seiten, dunkler Footer auf der Ergebnisseite. */
  @Input() theme: FooterTheme = 'light';
}
