# Design — Code à Cuisine

Quelle der Wahrheit = Figma (Dev Mode / Inspect für exakte Werte).
Werte mit `← aus Figma` sind Schätzungen und MÜSSEN ersetzt werden.
Pixelgenaues Bauen: das jeweilige Screen-Bild NUR in der Aufgabe hochladen, in der dieser Screen gebaut wird.

## Farben (Design Tokens)
| Token | Verwendung | Wert |
|---|---|---|
| `--color-green-dark` | Hero-/Loader-Hintergrund, Buttons, Headings | #396039 ← aus Figma |
| `--color-green-accent` | Button-Text auf Creme, Links | #008000 ← aus Figma |
| `--color-cream` | Text auf Grün, Button auf Hero, Eingabefelder | #FAF0E6← aus Figma |
| `--color-sage` | Karten-Hintergrund (Zutaten, Präferenzen, Ergebnisse) | #3960394D← aus Figma |
| `--color-beige` | Pillen/Tags, Eingabefeld-Innenflächen | #FAF0E6 ← aus Figma |
| `--color-cream-warm` | Rezept-Detail-Karte | #FAF0E6← aus Figma |
| `--color-text` | Standard-Fließtext | #1F2A22 ← aus Figma |

## Typografie
- **Headings:** Ubuntu

- **Body:** Quicksand
- Mindestgrößen (Pflicht laut Checkliste): Fließtext ≥ 16px, Kleingedrucktes ≥ 14px.

## Abstände & Form
- Karten: großzügige Rundung (~12–16px `border-radius`) ← aus Figma
- Buttons: leicht gerundet, kräftiges Grün mit Creme-Text (primär) ODER Creme mit grünem Text (auf Hero)
- Pillen/Tags: voll gerundet (pill), Beige-Fläche mit grünem Text
- Eingabefelder: gerundet, Beige/Creme-Innenfläche

## Wiederkehrende Komponenten (→ shared/)
- **header:** Logo "Code à Cuisine" oben links (auf Grün in Creme, sonst dunkelgrün). Teils Zurück-Pfeil darunter.
- **button-primary:** dunkelgrün, Creme-Text (z.B. "Next step", "Generate a recipe").
- **button-ghost:** Creme-Fläche, grüner Text (z.B. "Get started").
- **recipe-card:** Sage-Karte: Glocken-Icon + "Recipe N", Titel, Kochzeit, "View"-Button.
- **tag/pill:** kleine Beige-Pille mit grünem Text (Vegetarian, Quick, ♡66 …).
- **loader:** Grüner Vollbild-Hintergrund, zentriertes Sage-Rechteck (Platzhalter), Text "Generating …". Animation: Text bleibt, die Punkte verschwinden einzeln und erscheinen wieder. (Animation ist NUR im Figma-Prototyp sichtbar.)
- **error-dialog:** Modal "Ups! Not quite enough…", Erklärtext, Button "Go back to ingredients". Erscheint bei zu wenigen Zutaten ODER zu geringen Mengen für die Portionszahl.

## Screens (Layout in Worten; Bild bei Bedarf gezielt hochladen)

### landing (Hero)
Grüner Hintergrund. Logo oben links. Große Headline "AI-Powered recipe generator / **Code à Cuisine**". Creme-Button "Get started". Unten "Hungry for inspiration? → Go to cookbook". Rechts (Desktop) bzw. oben kaskadierend (Mobile) drei runde Teller-Fotos.

**Asset-Anforderung `teller_1/2/3.svg` (bei Re-Export aus Figma beachten!):** Die viewBox MUSS eng auf die Form beschnitten sein — Kreis/Ellipse füllt die Box, Mittelpunkt bei 50%. Figma exportiert die Teller sonst so, wie sie im Frame beschnitten waren (`teller_1` oben, `teller_3` unten gekappt, unterschiedlich viel Luft in der Box). Das Layout stapelt die Teller über eine einzige Überlappungs-Konstante; ungleiche Boxen ⇒ ungleiche Mittelpunkt-Abstände ("Teller nicht gleich übereinander") und flache Schnittkanten mitten im Grün. Soll-Werte: `teller_1` 470×470 / `viewBox="0 -42 470 470"`, `teller_2` 484×484 / `viewBox="0 6 484 484"`, `teller_3` 482.6×502.4 / `viewBox="0.109 6.085 482.6 502.4"` (leicht oval = schräg fotografierter Teller, kein Fehler).

**Responsive-Regel Hero:** Die Teller sind höhenbasiert dimensioniert und schrumpfen beim Verschmälern NICHT mit — sie werden vom rechten Bildschirmrand zunehmend angeschnitten. Der Inhalt ist links verankert (max. 1400px, **kein** `margin-inline: auto`), damit das Logo auf jedem Screen gleich weit vom Rand steht.

### ingredients ("Generate recipe")
Weißer Hintergrund, zentrierte grüne Heading + Untertitel. Desktop: zwei Sage-Karten nebeneinander. Links: Eingabefeld "Ingredient" mit Autocomplete-Dropdown, "Serving size" (Zahl + Einheit-Dropdown), "+"-Button. Rechts: "List of your Ingredients" — Liste `• Menge  Name` mit Edit-/Delete-Icon je Zeile. **Neueste Zutat steht oben.** Mobile: Karten gestapelt. "Next step"-Button unten rechts (erscheint sobald Zutaten da sind).

### preferences ("Choose your preferences")
Weißer Hintergrund, Zurück-Link "Ingredients" oben. Zwei Stepper: "How many portions" (− 2 +), "How many are cooking" (− 1 +). Sage-Karte mit drei Gruppen aus Pillen: Cooking time (Quick / Medium / Complex je mit Zeit-Unterzeile), Cuisine (German / Italian / Indian / Japanese / Gourmet / Fusion), Diet preferences (Vegetarian / Vegan / Keto / No preferences). Unten zentriert "Generate a recipe".

### recipe-results ("Generated recipes")
Grüner Hintergrund. Heading + Untertitel, Roboterhand-Bild, aktive Tags (z.B. Italian, Quick). Drei Sage-`recipe-card` nebeneinander (Desktop) / gestapelt (Mobile), je mit "View". Unten "Generate new recipe →".

### recipe-detail
Warme Creme-Karte. Kopf: Kochzeit, grüner Titel, "Cooking person" mit Chef-1/Chef-2-Pillen, Tags + ♡-Zahl, "Nutritional information" (Energie / Protein / Fat / Carbs). Abschnitt "Ingredients" (Your ingredients | Extra ingredients) mit dekorativen Kräuter-Illustrationen. "Directions": nummerierte Schritte, jeder mit Chef-Badge. "Give it a heart"-Like unten. CTA-Leiste "Cookbook". "Generate new recipe →".
Zurück-Button kontextabhängig: vom Generator → zu recipe-results; vom Cookbook → zum Cookbook.

### cookbook (Übersicht)
Heading "Cookbook" + Intro. "Most liked recipes" als horizontale Karten. Darunter Kategorie-Raster mit Foto je Küche: Italian / German / Japanese / Gourmet / Indian / Fusion (jeweils mit Emoji). Kategorie-Bilder sind fest (ein Bild pro Küche, kein Bild pro Rezept) → liegen in assets/images/.

### cookbook-category (z.B. "Italian cuisine")
Header-Banner mit Küchen-Namen. Nummerierte Rezeptliste: je Eintrag Kochzeit, Titel, Tags, ♡-Zahl. Paginierung unten (< 1 2 3 … 8 >). Button "Generate a recipe".

## Responsive
- Funktioniert auf Desktop, Tablet, Smartphone (Pflicht).
- Desktop: mehrspaltig (Karten nebeneinander). Mobile: alles gestapelt, eine Spalte.
- Touch-Bedienung optimieren; Tap-Flächen großzügig.
- Recipe-Karten auch auf kleinen Screens gut lesbar.
