import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

type FooterTheme = 'light' | 'dark';

/** Uniform page footer with the link to the imprint. */
@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  templateUrl: './footer.html',
  styleUrl: './footer.scss'
})
export class Footer {
  /** Light footer on white pages, dark footer on the results page. */
  @Input() theme: FooterTheme = 'light';
}
