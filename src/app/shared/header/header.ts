import { Component, inject, Input } from '@angular/core';
import { Location } from '@angular/common';
import { RouterLink } from '@angular/router';

type HeaderTheme = 'light' | 'dark';
type BackPosition = 'top' | 'below';

/**
 * Seitenkopf: Logo (Link zur Landing-Seite) und ein kontextabhängiger
 * Zurück-Button. Wiederverwendbar über die Feature-Seiten.
 */
@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class Header {
  private readonly location = inject(Location);

  /** Beschriftung des kontextabhängigen Zurück-Links. Leer = kein Link. */
  @Input() backLabel = '';

  /** Ziel des Zurück-Links. Ohne Ziel wird der Browser-Verlauf verwendet. */
  @Input() backLink: string | null = null;

  /** Position des Zurück-Links: in der Zeile neben dem Logo oder darunter. */
  @Input() backPosition: BackPosition = 'below';

  /** Heller Header auf weißen Seiten, dunkler Header auf der Ergebnisseite. */
  @Input() theme: HeaderTheme = 'light';

  get logoSrc(): string {
    return this.theme === 'dark' ? 'img/logo_baige.svg' : 'img/logo_gruen.svg';
  }

  /** Geht im Browser-Verlauf einen Schritt zurück (kontextabhängig). */
  goBack(): void {
    this.location.back();
  }
}
