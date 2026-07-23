import { Component } from '@angular/core';

import { Header } from '../../shared/header/header';
import { Footer } from '../../shared/footer/footer';

/**
 * Impressum / rechtliche Angaben. Statische Inhaltsseite, erreichbar über den
 * Footer-Link im Cookbook. Platzhaltertexte – vor Go-live mit echten Angaben füllen.
 */
@Component({
  selector: 'app-imprint',
  imports: [Header, Footer],
  templateUrl: './imprint.html',
  styleUrl: './imprint.scss'
})
export class Imprint {}
