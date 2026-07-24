import { Component } from '@angular/core';

import { Header } from '../../shared/header/header';
import { Footer } from '../../shared/footer/footer';

/**
 * Imprint / legal information. Static content page, reachable via the footer
 * link in the cookbook. Placeholder text – fill in with real details before go-live.
 */
@Component({
  selector: 'app-imprint',
  imports: [Header, Footer],
  templateUrl: './imprint.html',
  styleUrl: './imprint.scss'
})
export class Imprint {}
