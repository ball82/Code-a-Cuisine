import { Component, input } from '@angular/core';

/**
 * Full-screen loading indicator during the 10–20 s Gemini generation.
 * Green background, centered sage rectangle with image, text + animated dots
 * (the dots disappear one by one and reappear).
 */
@Component({
  selector: 'app-loader',
  templateUrl: './loader.html',
  styleUrl: './loader.scss'
})
export class Loader {
  /** Text shown before the animated dots. */
  readonly message = input('Generating your recipes');
}
