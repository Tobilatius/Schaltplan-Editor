===============================================================================
                    SCHALTPLAN-EDITOR-Web-Version v1.2.0
===============================================================================

STARTEN:
--------
- Doppelklick auf "index.html"

BAUTEILE LADEN:
------------------
- Nach öffnen der index.html den schwarzen Button 'Bauteile laden' klicken 
- Den Ordner 'Bauteile' auswählen

BAUTEILE HANDHABEN:
------------------
- Bauteil platzieren: In der linken Liste auf Bauteil klicken, dann auf Canvas
- Bauteil DREHEN: Rechtsklick auf Bauteil (90° Schritte)
- Bauteil VERSCHIEBEN: Maus gedrückt halten und ziehen
- Bauteile LÖSCHEN: Löschen-Button (oben rechts) aktivieren, dann auf Bauteil klicken.
- "Abbrechen" klicken, um Löschen-Modus zu verlassen

KABEL ZEICHNEN:
---------------
- Kabel-Button aktivieren, dann auf zwei Punkte klicken
- Kabel haben 5 Pixel Dicke (schwarz)
- Kabel werden HINTER Bauteilen gerendert

TEXT-FUNKTIONEN:
---------------
- Text erstellen: Text-Button (T) aktivieren, dann auf Canvas klicken
- Text BEARBEITEN: Kurz auf bestehenden Text klicken
- Text VERSCHIEBEN: Lang auf Text klicken und ziehen
- Text-Eingabe beenden: Enter oder Esc

TEXT-FORMATIERUNG (Für physikalische Formeln):
-----------------------------------------------
- Kursiver Text: *Variable* (z.B. *U* = *R* * *I*)
- Tiefgestellte Zahlen: R_1
- Griechische Buchstaben vorhanden: (z.B. \Omega \mu oder \Alpha)

TASTEN-KÜRZEL:
-------------
- Strg+Z: Rückgängig (Undo)
- Strg+Y: Wiederherstellen (Redo)
- F3: Entwickler-Tools ein/aus
- Esc: Text-Eingabe abbrechen
- Enter: Text-Eingabe bestätigen

ZOOM-FUNKTIONEN:
----------------
- Mausrad: Zoomen (Strg+Mausrad)
- +/- Buttons: Rechts im Canvas (5% Schritte)
- Start-Zoom: 50%

PROJEKT-FUNKTIONEN:
------------------
- Projekt speichern: "Projekt speichern" Button (.json Datei)
- Projekt laden: "Projekt laden" Button (.json Datei auswählen)
- PNG exportieren: "Export als png" Button (weißer Hintergrund)

===============================================================================
                            EIGENE BAUTEILE
===============================================================================

BAUTEILE HINZUFÜGEN:
-------------------
1. Ordner öffnen: Schaltplan-EditorBauteile
2. PNG-Dateien hineinlegen (400x400 Pixel empfohlen, Kabelbreite: 5 Pixel)
3. index.html neu laden

PNG-GRAFIK TIPPS:
----------------
- Auflösung: 400x400 Pixel (optimal)
- Hintergrund: Transparent, ggf. Flächen weiß (wird über Kabeln gerendert)
- Format: PNG mit Transparenz

===============================================================================
                           WEITERENTWICKLUNG
===============================================================================

CODE ANPASSEN:
-------------
Du kannst die App direkt anpassen ohne Neukompilierung:
- Dateien bearbeiten:
  - index.html: UI-Struktur und Texte ändern
  - renderer.js und main.js: Funktionen und Logik anpassen
  - styles.css: Farben und Layout ändern

===============================================================================

Schaltplan-Editor-Web-Version v1.2.0
© 2026 Tobias Meitner
tobi.meitner@gmail.com


