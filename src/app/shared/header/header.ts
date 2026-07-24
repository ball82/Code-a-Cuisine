import { Component, inject, Input } from '@angular/core';
import { Location } from '@angular/common';
import { RouterLink } from '@angular/router';

type HeaderTheme = 'light' | 'dark';
type BackPosition = 'top' | 'below';

/**
 * Page header: logo (link to the landing page) and a context-dependent back
 * button. Reusable across the feature pages.
 */
@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class Header {
  private readonly location = inject(Location);

  /** Label of the context-dependent back link. Empty = no link. */
  @Input() backLabel = '';

  /** Target of the back link. Without a target the browser history is used. */
  @Input() backLink: string | null = null;

  /** Position of the back link: in the row next to the logo or below it. */
  @Input() backPosition: BackPosition = 'below';

  /** Light header on white pages, dark header on the results page. */
  @Input() theme: HeaderTheme = 'light';

  get logoSrc(): string {
    return this.theme === 'dark' ? 'img/logo_baige.svg' : 'img/logo_gruen.svg';
  }

  /** Goes one step back in the browser history (context-dependent). */
  goBack(): void {
    this.location.back();
  }
}
