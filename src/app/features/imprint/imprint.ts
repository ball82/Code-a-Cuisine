import { Component } from '@angular/core';

import { Header } from '../../shared/header/header';

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
export class Imprint {}
