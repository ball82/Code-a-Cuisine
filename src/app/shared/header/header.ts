import { Component, inject } from '@angular/core';
import { Location } from '@angular/common';
import { RouterLink } from '@angular/router';

/**
 * Seitenkopf: Logo (Link zur Landing-Seite) + kontextabhängiger Zurück-Button.
 * Wiederverwendbar über die Feature-Seiten hinweg (Cookbook, Generator, …).
 */
@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class Header {
  private readonly location = inject(Location);

  /** Geht im Browser-Verlauf einen Schritt zurück (kontextabhängig). */
  goBack(): void {
    this.location.back();
  }
}
