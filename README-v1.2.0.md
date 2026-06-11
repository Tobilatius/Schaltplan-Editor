# Schaltplan-Editor v1.2.0 - Portable Fix

## Installation (für Kollegen)

### Schritt 1: ZIP-Datei entpacken
1. Lade die `Schaltplan-Editor-v1.2.0-Portable-Fix.zip` Datei herunter
2. Klicke mit rechts auf die Datei -> "Alle extrahieren" oder "Entpacken"
3. Wähle einen Ordner aus (z.B. `C:\Programme\Schaltplan-Editor`)

### Schritt 2: Programm starten
1. Öffne den entpackten Ordner `Schaltplan-Editor-win32-x64`
2. Doppelklicke auf `Schaltplan-Editor.exe`
3. Das Programm startet sofort!

## WICHTIG: v1.2.0 Portable Fix

### **Problem in v1.1.0 behoben:**
- **Projekt-Lade-Fehler** in portabler Version behoben
- **Bauteile-Pfade** werden jetzt korrekt gefunden
- **Portable Ordnerstruktur** vollständig unterstützt

### **Ordnerstruktur in portabler Version:**
```
Schaltplan-Editor-win32-x64/
  resources/
    app/
      Bauteile/           # Hier kommen eigene Bauteile rein
        Widerstände/
        Kondensatoren/
        Dioden/
        ...
```

## Alle Funktionen aus v1.1.0 + v1.2.0 Fixes

### 1. **Text-Tool** (v1.1.0)
- **Text-Button** in der Header-Leiste
- **Klick auf Canvas** -> Textbox erstellen
- **Text bearbeiten** -> Kurz klicken auf bestehenden Text
- **Text verschieben** -> Lang klicken und ziehen
- **Tiefgestellte Zahlen**: `R_1` -> R¹, `C_10` -> C¹
- **Griechische Buchstaben**: `\Omega` -> ``, `\mu` -> `µ`, `\alpha` -> ``

### 2. **Kursiv-Text** (v1.2.0)
- **Physikalische Formeln**: `*U* = *R* * *I*`
- **Mehrere Paare**: `*a* normal *b* kursiv *c*`
- **Kombination**: `*Spannung* = *Widerstand* * *Strom*`

### 3. **Verbesserter Zoom** (v1.1.0)
- **5% Schritte** statt 10% (feinere Kontrolle)
- **Zoom-Bereich**: 5% - 100%
- **Start-Zoom**: 50% (bessere Übersicht)
- **Funktionierende +/- Buttons** rechts im Canvas

### 4. **Schnelles Bauteile-Reload** (v1.1.0)
- **F1 Taste** -> Nur Bauteile neu laden
- **Kein kompletter App-Reload** nötig
- **Schaltplan bleibt erhalten**
- **Sofort neue Bauteile sichtbar**

### 5. **PNG-Export mit weißem Hintergrund** (v1.1.0)
- **Weißer Hintergrund** statt transparent
- **Bessere Druckbarkeit**
- **Professionelles Aussehen**
- **Alle Elemente bleiben sichtbar**

### 6. **Undo/Redo für alles** (v1.1.0 + v1.2.0)
- **Strg+Z / Strg+Y** funktioniert für:
  - Bauteile platzieren
  - **Bauteile verschieben** (v1.2.0 Fix!)
  - Bauteile rotieren
  - Bauteile löschen
  - Kabel zeichnen/löschen
  - Texte erstellen/bearbeiten/verschieben/löschen
  - Alles löschen

### 7. **Verbesserte UI** (v1.1.0)
- **Gruppierte Header-Buttons**: Hauptfunktionen | Edit-Funktionen
- **Bessere visuelle Trennung**
- **Copyright**: ©Tobias Meitner
- **Deutsche Button-Texte**: "Export als png", "Projekt speichern", "Projekt laden"

### 8. **Portable Kompatibilität** (v1.2.0)
- **Projekte speichern/laden** funktioniert in portabler Version
- **Bauteile-Pfade** werden korrekt aufgelöst
- **Keine "Bauteile nicht gefunden" Fehler**
- **Vollständig portable Anwendung**

## Eigene Bauteile hinzufügen

### Bauteile-Ordner finden
Im Programmordner findest du einen Ordner namens `resources\app\Bauteile`

### Bauteile hinzufügen
1. Öffne den Ordner: `[Installationsordner]\Schaltplan-Editor-win32-x64\resources\app\Bauteile`
2. Lege deine PNG-Bilder von Bauteilen in diesen Ordner
3. **F1 drücken** -> Bauteile werden neu geladen
4. Deine Bauteile erscheinen sofort in der Seitenleiste

### Bauteile organisieren (optional)
Du kannst Unterordner erstellen:
```
Bauteile/
  Widerstände/
    R_10k.png
    R_1k.png
  Kondensatoren/
    C_10uF.png
    C_100nF.png
  Dioden/
    LED_rot.png
    1N4148.png
```

## Alle Funktionen

### Schaltplan erstellen
- **Bauteile platzieren**: Klicke auf ein Bauteil in der Seitenleiste, dann auf den Canvas
- **Kabel zeichnen**: Klicke auf den Kabel-Button, dann auf zwei Verbindungspunkte
- **Text hinzufügen**: Klicke auf den Text-Button (T), dann auf den Canvas
- **Elemente löschen**: Klicke auf den Löschen-Button, dann auf Element

### Text-Notationen
- **Tiefgestellte Zahlen**: `R_1` -> R¹, `C_10` -> C¹, `U_2` -> U²
- **Griechische Buchstaben**: `\Omega` -> ``, `\mu` -> `µ`, `\alpha` -> ``, `\beta` -> `ß`, `\gamma` -> ``
- **Kursiv-Text**: `*Variable*` -> *Variable*
- **Kombination**: `R_1 = 10\Omega bei *T* = 25°C` -> `R¹ = 10 bei *T* = 25°C`

### Zoom und Navigation
- **Zoomen**: Strg + Mausrad oder +/- Buttons (5% Schritte)
- **Verschieben**: Mausrad ohne Strg
- **Zoom-Bereich**: 5% - 100%
- **Start-Zoom**: 50%

### Tastatur-Shortcuts
- **Strg+Z**: Undo
- **Strg+Y**: Redo
- **F1**: Bauteile neu laden
- **F3**: Entwickler-Tools ein/aus
- **Esc**: Text-Eingabe abbrechen
- **Enter**: Text-Eingabe bestätigen

### Speichern und Exportieren
- **Projekt speichern**: Projekt speichern -> JSON-Datei
- **Projekt laden**: Projekt laden -> JSON-Datei auswählen
- **PNG exportieren**: Export als png -> Bilddatei mit weißem Hintergrund

## Systemanforderungen

- **Windows 10 oder 11** (64-Bit)
- **Keine zusätzliche Software** erforderlich
- **Kein Node.js, npm oder Electron** nötig
- **Ca. 200 MB freier Speicher**

## Probleme?

### Programm startet nicht
1. Stelle sicher dass du Windows 10/11 64-Bit verwendest
2. Überprüfe ob die ZIP-Datei vollständig entpackt wurde
3. Versuche einen anderen Ordner für die Installation

### Bauteile werden nicht angezeigt
1. Prüfe ob die PNG-Dateien im richtigen Ordner liegen: `resources\app\Bauteile`
2. Stelle sicher dass die Dateien das PNG-Format haben
3. **F1 drücken** -> Bauteile neu laden

### Projekt lädt nicht richtig (v1.1.0 Problem)
- **Dies ist in v1.2.0 behoben!**
- Projekte werden jetzt korrekt in portabler Version geladen
- Bauteile-Pfade werden richtig aufgelöst

### Text wird im PNG-Export nicht angezeigt
- Dies ist in v1.1.0 behoben. Texte werden mit exportiert.

### Zoom funktioniert nicht
- Die +/- Buttons rechts im Canvas funktionieren jetzt
- Strg + Mausrad funktioniert weiterhin
- 5% Schritte für feine Kontrolle

## v1.2.0 vs v1.1.0

### **Was ist neu in v1.2.0?**
- **Portable Kompatibilität** für Projekte
- **Kursiv-Text** für physikalische Formeln
- **Undo/Redo** für Bauteil-Verschieben
- **Verbesserte Pfad-Auflösung**
- **Deutsche UI-Texte**
- **Copyright** hinzugefügt

### **Was wurde behoben?**
- **Projekt-Lade-Fehler** in portabler Version
- **Bauteile-Pfade** werden korrekt gefunden
- **Undo/Redo** funktioniert jetzt für Verschieben

## Support

Bei Problemen kontaktiere bitte den Entwickler oder erstelle einen Screenshot des Fehlers.

---

**Version 1.2.0 Features:**
- **Portable Kompatibilität** (Projekt-Lade-Fix)
- **Kursiv-Text** für physikalische Formeln
- **Vollständiges Undo/Redo** (inkl. Verschieben)
- **Deutsche UI** und Copyright
- **Alle v1.1.0 Features** erhalten

**Hinweis**: Diese portable Version benötigt keine Installation und kann auf jedem Windows-Computer ausgeführt werden. Die Projekt-Kompatibilität zwischen Entwicklungs- und portable Version ist jetzt vollständig gewährleistet.
