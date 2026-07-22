import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Wurzel-Komponente der Anwendung. Enthält ausschliesslich den `RouterOutlet`;
 * die eigentlichen Seiten werden über die {@link routes} eingehängt.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {}
