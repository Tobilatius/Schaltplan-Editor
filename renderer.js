class CircuitEditor {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = 400;
        this.baseDotSize = 4;
        this.dotColor = '#bbb';
        this.components = [];
        this.availableComponents = [];
        this.placementMode = null;
        
        // Drag & Drop Variablen
        this.isDragging = false;
        this.draggedComponent = null;
        this.dragOffset = { x: 0, y: 0 };
        
        // Highlight Variablen
        this.highlightedGridX = null;
        this.highlightedGridY = null;
        
        // Kabel-Modus
        this.cableMode = false;
        this.cableStart = null;
        this.cables = [];
        
        // Undo/Redo System
        this.history = [];
        this.historyStep = -1;
        this.maxHistorySteps = 50;
        
        // Löschmodus
        this.deleteMode = false;
        
        // Entwicklermodus
        this.devMode = false;
        
        // Pinned Bauteile
        this.pinnedComponents = [];
        
        // Geöffnete Ordner
        this.openFolders = new Set();
        
        // Animation Frame für optimiertes Neuzeichnen
        this.animationFrameId = null;
        
        // Text-Mode
        this.textMode = false;
        this.texts = []; // Array für alle Text-Objekte
        this.selectedText = null;
        this.isDraggingText = false;
        this.draggedText = null;
        this.dragOffsetText = { x: 0, y: 0 };
        this.textClickTimer = null; // Timer für Klickdauer-Unterscheidung
        this.hasTextMoved = false; // Flag für Drag-Bewegung
        
        this.scale = 0.35; // Start mit 50% Zoom für bessere Übersicht
        this.minScale = 0.05;
        this.maxScale = 1;
        this.zoomStep = 0.05;
        
        this.init();
    }

    // Pinned Components aus localStorage laden
    loadPinnedComponents() {
        const pinned = localStorage.getItem('pinnedComponents');
        if (pinned) {
            this.pinnedComponents = JSON.parse(pinned);
        }
    }

    // Pinned Components speichern
    savePinnedComponents() {
        localStorage.setItem('pinnedComponents', JSON.stringify(this.pinnedComponents));
    }

    // Pin umschalten
    togglePin(componentName) {
        const index = this.pinnedComponents.indexOf(componentName);
        if (index > -1) {
            this.pinnedComponents.splice(index, 1); // Entpinnen
        } else {
            this.pinnedComponents.push(componentName); // Pinnen
        }
        this.savePinnedComponents();
        this.updateComponentList(); // Liste neu zeichnen
    }

    // Ordner umschalten
    toggleFolder(folderName) {
        if (this.openFolders.has(folderName)) {
            this.openFolders.delete(folderName); // Schließen
        } else {
            this.openFolders.add(folderName); // Öffnen
        }
        this.updateComponentList(); // Liste neu zeichnen
    }

    init() {
        this.setupCanvas();
        this.setupZoomControls();
        this.setupEventListeners();
        this.loadComponents();
        this.drawGrid();
        this.setupKeyboardShortcuts();
        this.setupDeleteListeners();
        this.loadPinnedComponents(); // Pinned Components laden
        
        // Leeren Start-Zustand speichern für Undo
        this.saveState();
        
        // Zoom am Anfang anwenden
        setTimeout(() => {
            this.applyZoom();
        }, 100);
    }

    setupCanvas() {
        // Größeren Canvas für mehr Arbeitsfläche
        this.canvas.width = 8000;
        this.canvas.height = 6000;
    }

    setupZoomControls() {
        // Kombinierte Zoom-Steuerung
        const zoomControls = document.createElement('div');
        zoomControls.className = 'zoom-controls';
        zoomControls.innerHTML = `
            <button id="zoomOut">-</button>
            <span class="zoom-info">15%</span>
            <button id="zoomIn">+</button>
        `;
        document.querySelector('.canvas-container').appendChild(zoomControls);
        
        // Zoom-Info Referenz speichern
        this.zoomInfo = zoomControls.querySelector('.zoom-info');
        
        // Zoom-Buttons Event Listener
        document.getElementById('zoomIn').addEventListener('click', () => this.zoom(this.zoomStep));
        document.getElementById('zoomOut').addEventListener('click', () => this.zoom(-this.zoomStep));

        // Header-Buttons Event Listener
        document.getElementById('exportPNG').addEventListener('click', () => this.exportToPNG());
        document.getElementById('saveProject').addEventListener('click', () => this.saveProject());
        document.getElementById('loadProject').addEventListener('change', (e) => this.loadProject(e.target.files[0]));
        document.getElementById('textMode').addEventListener('click', () => this.toggleTextMode());
        document.getElementById('deleteMode').addEventListener('click', () => this.toggleDeleteMode());
        // Neuer Button: Ordner manuell laden
        const loadFolderBtn = document.getElementById('loadFolder');
        if (loadFolderBtn) {
            loadFolderBtn.addEventListener('click', () => this.selectComponentsFolder());
        }

        // Dark Mode Toggle Button
        const darkModeButton = document.createElement('button');
        darkModeButton.textContent = '🌙';
        darkModeButton.style.cssText = `
            background: #f0f0f0;
            color: #333;
            border: 1px solid #ccc;
            padding: 8px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            font-size: 14px;
            margin-left: 10px;
        `;
        darkModeButton.onclick = () => this.toggleDarkMode();
        document.querySelector('.header-right').appendChild(darkModeButton);
    }

    zoom(delta) {
        const newScale = Math.max(this.minScale, Math.min(this.maxScale, this.scale + delta));
        if (newScale !== this.scale) {
            this.scale = newScale;
            this.applyZoom();
        }
    }

    resetZoom() {
        this.scale = 0.15; // Auf Start-Zoom zurücksetzen
        this.applyZoom();
    }

    applyZoom() {
        this.canvas.style.transform = `scale(${this.scale})`;
        this.canvas.style.transformOrigin = 'top left';
        this.zoomInfo.textContent = `${Math.round(this.scale * 100)}%`;
        this.redraw();
    }

    drawGrid() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#fafafa';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = this.dotColor;
        
        for (let x = 0; x <= this.canvas.width; x += this.gridSize) {
            for (let y = 0; y <= this.canvas.height; y += this.gridSize) {
                this.ctx.beginPath();
                this.ctx.arc(x, y, this.baseDotSize, 0, 2 * Math.PI);
                this.ctx.fill();
            }
        }
        
        // Highlight für aktuellen Grid-Punkt zeichnen (entspricht PNG-Position)
        if (this.highlightedGridX !== null && this.highlightedGridY !== null) {
            this.ctx.fillStyle = 'rgba(52, 152, 219, 0.3)'; // Leichtes Blau
            this.ctx.fillRect(
                this.highlightedGridX - this.gridSize/2,
                this.highlightedGridY - this.gridSize/2,
                this.gridSize,
                this.gridSize
            );
            
            // Border für bessere Sichtbarkeit
            this.ctx.strokeStyle = 'rgba(52, 152, 219, 0.8)';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(
                this.highlightedGridX - this.gridSize/2,
                this.highlightedGridY - this.gridSize/2,
                this.gridSize,
                this.gridSize
            );
            
            // Mittelpunkt markieren (wo PNG-Mitte landet)
            this.ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
            this.ctx.beginPath();
            this.ctx.arc(this.highlightedGridX, this.highlightedGridY, 4, 0, 2 * Math.PI);
            this.ctx.fill();
        }
    }

    setupEventListeners() {
        this.canvas.parentElement.addEventListener('wheel', (e) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -this.zoomStep : this.zoomStep;
                this.zoom(delta);
            }
            // Normales Scrollen erlauben (nicht blockieren)
        }, { passive: false });

        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) / this.scale;
            const y = (e.clientY - rect.top) / this.scale;
            
            const gridX = Math.round(x / this.gridSize) * this.gridSize;
            const gridY = Math.round(y / this.gridSize) * this.gridSize;
            
            // Highlight nur aktualisieren wenn sich Position geändert hat
            if (this.highlightedGridX !== gridX || this.highlightedGridY !== gridY) {
                this.highlightedGridX = gridX;
                this.highlightedGridY = gridY;
                
                // Drag & Drop Logik
                if (this.isDragging && this.draggedComponent) {
                    const newX = Math.round((x - this.dragOffset.x) / this.gridSize) * this.gridSize;
                    const newY = Math.round((y - this.dragOffset.y) / this.gridSize) * this.gridSize;
                    
                    // Sicherstellen dass wir genau auf Grid-Punkten landen (PNG-Mitte auf Grid-Punkt)
                    this.draggedComponent.x = newX - 200;
                    this.draggedComponent.y = newY - 200;
                    this.redraw();
                } else if (this.isDraggingText && this.draggedText) {
                    // Text-Dragging (ohne Grid-Snapping)
                    this.draggedText.x = x - this.dragOffsetText.x;
                    this.draggedText.y = y - this.dragOffsetText.y;
                    this.hasTextMoved = true; // Bewegung stattgefunden
                    this.redraw();
                } else {
                    // Nur bei Grid-Wechsel neu zeichnen (optimiert mit requestAnimationFrame)
                    this.scheduleRedraw();
                }
            } else if (this.isDragging && this.draggedComponent) {
                // Drag-Logik auch bei gleicher Grid-Position für flüssiges Drag
                const newX = Math.round((x - this.dragOffset.x) / this.gridSize) * this.gridSize;
                const newY = Math.round((y - this.dragOffset.y) / this.gridSize) * this.gridSize;
                
                this.draggedComponent.x = newX - 200;
                this.draggedComponent.y = newY - 200;
                this.redraw();
            } else if (this.isDraggingText && this.draggedText) {
                // Text-Dragging auch bei gleicher Position
                this.draggedText.x = x - this.dragOffsetText.x;
                this.draggedText.y = y - this.dragOffsetText.y;
                this.redraw();
            }
            
            this.canvas.title = `Position: (${gridX}, ${gridY}) - Zoom: ${Math.round(this.scale * 100)}%${this.devMode ? ' | 🔧 DEV' : ''}`;
        });

        this.canvas.addEventListener('mousedown', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) / this.scale;
            const y = (e.clientY - rect.top) / this.scale;
            
            // Text-Mode: Text verschieben
            if (this.textMode && e.button === 0) {
                const clickedText = this.getTextAt(x, y);
                if (clickedText) {
                    // Flag für Drag-Bewegung
                    this.hasTextMoved = false;
                    
                    // Timer für langen Klick starten
                    this.textClickTimer = setTimeout(() => {
                        // Langer Klick → Drag-Modus
                        this.isDraggingText = true;
                        this.draggedText = clickedText;
                        this.dragOffsetText.x = x - clickedText.x;
                        this.dragOffsetText.y = y - clickedText.y;
                        this.canvas.style.cursor = 'move';
                        console.log('Langer Klick → Text-Drag-Modus');
                    }, 200); // 200ms = langer Klick
                    
                    // MouseUp Event für kurzen Klick
                    const handleMouseUp = () => {
                        clearTimeout(this.textClickTimer);
                        if (!this.isDraggingText && !this.hasTextMoved) {
                            // Kurzer Klick UND keine Bewegung → Text bearbeiten
                            this.editText(clickedText);
                            console.log('Kurzer Klick → Text bearbeiten');
                        }
                        this.isDraggingText = false;
                        this.draggedText = null;
                        this.hasTextMoved = false;
                        document.removeEventListener('mouseup', handleMouseUp);
                    };
                    
                    document.addEventListener('mouseup', handleMouseUp, { once: true });
                    e.preventDefault();
                    return;
                }
            }
            
            // Prüfen ob auf ein Bauteil geklickt wurde
            const clickedComponent = this.getComponentAt(x, y);
            if (clickedComponent) {
                // Links-Klick für Drag & Drop, Rechtsklick für Rotation
                if (e.button === 0) {
                    this.isDragging = true;
                    this.draggedComponent = clickedComponent;
                    // Offset auf PNG-Mitte beziehen (nicht linke obere Ecke)
                    const centerX = clickedComponent.x + 200; // PNG-Mitte
                    const centerY = clickedComponent.y + 200; // PNG-Mitte
                    this.dragOffset.x = x - centerX;
                    this.dragOffset.y = y - centerY;
                    this.canvas.style.cursor = 'move';
                    e.preventDefault();
                    return;
                }
                // Rechtsklick für Rotation
                if (e.button === 2) {
                    clickedComponent.rotation = (clickedComponent.rotation || 0) + 90;
                    if (clickedComponent.rotation >= 360) clickedComponent.rotation = 0;
                    this.redraw();
                    this.saveState(); // Nach Rotation speichern
                    e.preventDefault();
                    return;
                }
            }
        });

        this.canvas.addEventListener('mouseup', () => {
            if (this.isDragging) {
                this.isDragging = false;
                this.draggedComponent = null;
                this.canvas.style.cursor = 'crosshair';
                this.saveState(); // Nach Bauteil-Verschieben speichern
            }
            if (this.isDraggingText) {
                this.isDraggingText = false;
                this.draggedText = null;
                this.canvas.style.cursor = this.textMode ? 'text' : 'default';
                this.saveState(); // Nach Text-Verschieben speichern
            }
        });

        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault(); // Kontextmenü unterbinden
        });

        this.canvas.addEventListener('click', (e) => {
            if (this.isDragging) return; // Nicht während Drag auslösen
            if (this.deleteMode) return; // Nicht im Löschmodus auslösen
            
            const rect = this.canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) / this.scale;
            const y = (e.clientY - rect.top) / this.scale;
            
            // Text-Mode: Text erstellen oder bearbeiten
            if (this.textMode && !this.isDraggingText) {
                console.log('Text-Mode aktiv, Klick bei:', x, y);
                const clickedText = this.getTextAt(x, y);
                if (clickedText) {
                    // Wird jetzt in mousedown behandelt
                    return;
                } else {
                    console.log('Neuen Text erstellen');
                    this.createText(x, y);
                }
                return;
            }
            
            // Prüfen ob auf ein Bauteil geklickt wurde
            const clickedComponent = this.getComponentAt(x, y);
            if (clickedComponent) return; // Nichts machen bei Klick auf Bauteil
            
            const gridPos = this.getGridPosition(x, y);
            
            if (this.cableMode) {
                // Kabel-Modus: Start oder Endpunkt setzen
                if (!this.cableStart) {
                    this.cableStart = gridPos;
                    console.log(`Kabel-Start bei (${gridPos.x}, ${gridPos.y})`);
                } else {
                    // Kabel zeichnen
                    this.cables.push({
                        start: this.cableStart,
                        end: gridPos
                    });
                    console.log(`Kabel von (${this.cableStart.x}, ${this.cableStart.y}) nach (${gridPos.x}, ${gridPos.y})`);
                    this.cableStart = null;
                    this.redraw();
                    this.saveState(); // Nach Kabel speichern
                }
            } else if (this.placementMode) {
                this.placeComponent(gridPos.x, gridPos.y, this.placementMode);
                this.placementMode = null;
                this.canvas.style.cursor = 'crosshair';
            }
            // Kein Menü mehr bei leerem Klick
        });
    }

    getGridPosition(x, y) {
        // Exakt auf den nächsten Grid-Punkt runden
        const gridX = Math.round(x / this.gridSize) * this.gridSize;
        const gridY = Math.round(y / this.gridSize) * this.gridSize;
        
        return { x: gridX, y: gridY };
    }

    getComponentAt(x, y) {
        // Von hinten nach vorne prüfen (obere Bauteile zuerst)
        for (let i = this.components.length - 1; i >= 0; i--) {
            const comp = this.components[i];
            if (x >= comp.x && x <= comp.x + comp.width &&
                y >= comp.y && y <= comp.y + comp.height) {
                return comp;
            }
        }
        return null;
    }

    // Helfer: sichere Base64-Beschaffung für ein Component-Objekt
    async getBase64For(comp) {
        // Wenn bereits Base64 vorhanden → verwenden
        if (!comp) return null;
        if (comp.base64Data) return comp.base64Data;
        if (comp.imageData) return comp.imageData;
        // Versuche relative Pfade via Fetch zu laden (wenn Dateien im Web-Deployment vorhanden sind)
        if (comp.path) {
            try {
                const resp = await fetch(comp.path);
                if (resp.ok) {
                    const blob = await resp.blob();
                    return await new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => {
                            const dataUrl = reader.result;
                            const base64 = dataUrl.split(',')[1];
                            resolve(base64);
                        };
                        reader.onerror = reject;
                        reader.readAsDataURL(blob);
                    });
                }
            } catch (err) {
                console.warn('Fehler beim Laden über fetch für', comp.path, err);
            }
        }

        // Keine Daten verfügbar
        return null;
    }

    async loadComponents() {
        try {
            // Versuche zuerst eine Komponenten-Manifest-Datei im Web-Deployment zu laden
            let loaded = false;
            try {
                const resp = await fetch('Bauteile/components.json');
                if (resp.ok) {
                    const data = await resp.json();
                    this.availableComponents = data;
                    // Falls Pfade vorhanden, versuche Base64 per fetch zu bekommen
                    for (const item of this.availableComponents) {
                        if (item.isFolder && Array.isArray(item.components)) {
                            for (const comp of item.components) {
                                try {
                                    const base64Data = await this.getBase64For(comp);
                                    if (base64Data) comp.base64Data = base64Data;
                                } catch (err) {
                                    console.error('Fehler beim Laden der Bild-Vorschau (Ordner-Komponente):', comp.path, err);
                                }
                            }
                        } else {
                            try {
                                const base64Data = await this.getBase64For(item);
                                if (base64Data) item.base64Data = base64Data;
                            } catch (err) {
                                console.error('Fehler beim Laden der Bild-Vorschau (Direkt):', item.path, err);
                            }
                        }
                    }
                    loaded = true;
                }
            } catch (err) {
                console.info('Kein components.json gefunden oder Fehler beim Laden, benutze Web-Fallback.');
            }

            if (!loaded) {
                // Keine automatische Quelle gefunden → leere Liste; Nutzer kann Ordner manuell laden
                this.availableComponents = [];
                console.info('Keine Komponenten automatisch geladen. Verwende den "Ordner laden" Button, um Bauteile auszuwählen.');
            }
            
            this.updateComponentList();
        } catch (error) {
            console.error('Fehler beim Laden der Bauteile:', error);
        }
    }

    updateComponentList() {
        const listContainer = document.getElementById('componentList');
        if (!listContainer) return;
        
        listContainer.innerHTML = '';
        
        // Kabel-Item immer zuerst
        const cableItem = document.createElement('div');
        cableItem.className = 'component-item cable-item';
        cableItem.innerHTML = `
            <span class="name" style="color: white;">Kabel</span>
        `;
        cableItem.onclick = () => {
            this.placementMode = null;
            this.cableMode = true;
            this.canvas.style.cursor = 'crosshair';
            // Alle anderen Items deselektieren
            document.querySelectorAll('.component-item').forEach(item => {
                item.style.backgroundColor = 'transparent';
                item.style.color = '#333';
                item.style.border = '1px solid #ddd';
            });
            cableItem.style.backgroundColor = '#e8e8e8';
            cableItem.style.color = 'white';
        };
        listContainer.appendChild(cableItem);
        
        // Alle verfügbaren Bauteile sammeln und sortieren
        const allItems = [];
        
        // Direkte Bauteile (nicht in Ordnern)
        const directComponents = this.availableComponents.filter(item => !item.isFolder);
        const sortedDirectComponents = directComponents.sort((a, b) => {
            const aPinned = this.pinnedComponents.includes(a.name);
            const bPinned = this.pinnedComponents.includes(b.name);
            if (aPinned && !bPinned) return -1;
            if (!aPinned && bPinned) return 1;
            return a.name.localeCompare(b.name);
        });
        
        allItems.push(...sortedDirectComponents);

        // Ordner
        const folders = this.availableComponents.filter(item => item.isFolder);
        const sortedFolders = folders.sort((a, b) => a.name.localeCompare(b.name));
        allItems.push(...sortedFolders);

        // Items rendern
        allItems.forEach((item) => {
            if (item.isFolder) {
                // Ordner-Item erstellen
                const folderItem = document.createElement('div');
                folderItem.className = 'folder-item';
                const isOpen = this.openFolders.has(item.name);
                
                folderItem.innerHTML = `
                    <span class="folder-icon">${isOpen ? '📂' : '📁'}</span>
                    <span class="folder-name">${item.name}</span>
                    <span class="folder-count">(${item.components.length})</span>
                `;
                
                folderItem.onclick = () => {
                    const isCurrentlyOpen = this.openFolders.has(item.name);
                    this.toggleFolder(item.name);
                    
                    // Scroll-Logik: Öffnen = nach unten, Schließen = nach oben
                    setTimeout(() => {
                        if (!isCurrentlyOpen) {
                            // Ordner wurde geöffnet -> ganz nach unten scrollen
                            listContainer.scrollTop = listContainer.scrollHeight;
                        } else {
                            // Ordner wurde geschlossen -> ganz nach oben scrollen
                            listContainer.scrollTop = 0;
                        }
                    }, 100);
                };
                
                listContainer.appendChild(folderItem);
                
                // Wenn Ordner geöffnet ist, Bauteile direkt unter dem Ordner einfügen
                if (isOpen) {
                    // Bauteile innerhalb des Ordners sortieren (Pinned zuerst)
                    const sortedComponents = item.components.sort((a, b) => {
                        const aFullPath = `${item.name}/${a.name}`;
                        const bFullPath = `${item.name}/${b.name}`;
                        const aPinned = this.pinnedComponents.includes(aFullPath);
                        const bPinned = this.pinnedComponents.includes(bFullPath);
                        // Pinned-Bauteile zuerst (negative Rückgabe = kommt früher)
                        if (aPinned && !bPinned) return -1;
                        if (!aPinned && bPinned) return 1;
                        // Wenn beide gepinned oder beide nicht gepinned, alphabetisch sortieren
                        return a.name.localeCompare(b.name);
                    });
                    
                    // Bauteile sequentiell laden und in der richtigen Reihenfolge einfügen
                    const loadComponentsSequentially = async () => {
                        let insertPosition = folderItem; // Startposition direkt nach dem Ordner
                        
                        for (const comp of sortedComponents) {
                            try {
                                const fullCompPath = `${item.name}/${comp.name}`;
                                
                                // Erst vorhandene Base64-Daten nutzen (z.B. aus Fallback-Datei-Upload)
                                let base64Data = comp.base64Data || comp.imageData;
                                
                                // Wenn noch keine Base64-Daten vorhanden sind, nur dann versuchen über IPC zu laden
                                if (!base64Data) {
                                    base64Data = await this.getBase64For(comp);
                                }
                                
                                if (!base64Data) {
                                    // Kein Bild verfügbar -> überspringen und Warnung loggen
                                    console.warn('Kein Bild gefunden für', comp.name, '-> Element übersprungen');
                                    continue;
                                }
                                
                                comp.base64Data = base64Data;
                                
                                const compItem = document.createElement('div');
                                compItem.className = 'component-item sub-item';
                                const isPinned = this.pinnedComponents.includes(fullCompPath);
                                
                                const img = document.createElement('img');
                                img.src = `data:image/png;base64,${comp.base64Data}`;
                                img.style.cssText = 'width: 30px; height: 30px; margin-right: 10px; object-fit: contain;';
                                
                                const name = document.createElement('span');
                                name.className = 'name';
                                name.textContent = comp.name;
                                
                                // Pin-Button hinzufügen
                                const pinButton = document.createElement('button');
                                pinButton.textContent = isPinned ? '📌' : '📍';
                                pinButton.style.cssText = `
                                    background: none;
                                    border: none;
                                    cursor: pointer;
                                    font-size: 12px;
                                    padding: 2px;
                                    margin-left: 5px;
                                    opacity: 0.7;
                                `;
                                pinButton.onclick = (e) => {
                                    e.stopPropagation();
                                    this.togglePin(fullCompPath);
                                };
                                
                                compItem.appendChild(img);
                                compItem.appendChild(name);
                                compItem.appendChild(pinButton);
                                
                                // Pinned-Items hervorheben
                                if (isPinned) {
                                    compItem.style.border = '1px solid #ddd';
                                    compItem.style.backgroundColor = '#f8f8f8';
                                    compItem.classList.add('pinned');
                                }
                                
                                compItem.onclick = () => {
                                    this.placementMode = {
                                        ...comp,
                                        name: fullCompPath
                                    };
                                    this.cableMode = false;
                                    this.canvas.style.cursor = 'crosshair';
                                    document.querySelectorAll('.component-item').forEach(item => {
                                        item.style.backgroundColor = 'transparent';
                                        item.style.color = '#333';
                                        item.style.border = '1px solid #ddd';
                                    });
                                    compItem.style.backgroundColor = '#e8e8e8';
                                    compItem.style.color = '#333';
                                };
                                
                                // Nach dem aktuellen Element einfügen und Position aktualisieren
                                insertPosition.insertAdjacentElement('afterend', compItem);
                                insertPosition = compItem; // Nächstes Element nach diesem einfügen
                                
                            } catch (error) {
                                console.error('Fehler beim Laden des Bauteils:', comp.name, error);
                            }
                        }
                    };
                    
                    loadComponentsSequentially();
                }
            } else {
                // Normales Bauteil (direkt im Hauptordner)
                const compItem = document.createElement('div');
                compItem.className = 'component-item';
                const isPinned = this.pinnedComponents.includes(item.name);
                
                // Vorschau-Bild hinzufügen
                const img = document.createElement('img');
                img.src = item.imageData || (item.base64Data ? `data:image/png;base64,${item.base64Data}` : (item.path || ''));
                img.style.cssText = 'width: 30px; height: 30px; margin-right: 10px; object-fit: contain;';
                
                const name = document.createElement('span');
                name.className = 'name';
                name.textContent = item.name;
                
                // Pin-Button hinzufügen
                const pinButton = document.createElement('button');
                pinButton.textContent = isPinned ? '📌' : '📍';
                pinButton.style.cssText = `
                    background: none;
                    border: none;
                    cursor: pointer;
                    font-size: 12px;
                    padding: 2px;
                    margin-left: 5px;
                    opacity: 0.7;
                `;
                pinButton.onclick = (e) => {
                    e.stopPropagation(); // Nicht das Bauteil auswählen
                    this.togglePin(item.name);
                };
                
                compItem.appendChild(img);
                compItem.appendChild(name);
                compItem.appendChild(pinButton);
                
                // Pinned-Items hervorheben
                if (isPinned) {
                    compItem.style.border = '1px solid #ddd';
                    compItem.style.backgroundColor = '#f8f8f8';
                    compItem.classList.add('pinned');
                }
                
                compItem.onclick = () => {
                    this.placementMode = item;
                    this.cableMode = false;
                    this.canvas.style.cursor = 'crosshair';
                    // Alle anderen Items deselektieren
                    document.querySelectorAll('.component-item').forEach(item => {
                        item.style.backgroundColor = 'transparent';
                        item.style.color = '#333';
                        item.style.border = '1px solid #ddd';
                    });
                    compItem.style.backgroundColor = '#e8e8e8';
                    compItem.style.color = '#333';
                };
                
                listContainer.appendChild(compItem);
            }
        });
    }

    async showComponentMenu(gridX, gridY) {
        if (this.availableComponents.length === 0) {
            alert('Keine Bauteile gefunden.\nLege PNG-Dateien in den "Bauteile" Ordner.');
            return;
        }

        const menu = document.createElement('div');
        menu.className = 'component-menu';
        menu.style.cssText = `
            position: fixed;
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 10px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            z-index: 1000;
            max-height: 300px;
            overflow-y: auto;
            min-width: 200px;
        `;

        const title = document.createElement('h3');
        title.textContent = 'Bauteil auswählen:';
        title.style.cssText = 'margin: 0 0 10px 0; font-size: 14px;';
        menu.appendChild(title);

        for (const comp of this.availableComponents) {
            const item = document.createElement('div');
            item.textContent = comp.name;
            item.style.cssText = `
                padding: 5px 10px;
                cursor: pointer;
                border-radius: 4px;
                margin: 2px 0;
            `;
            item.onmouseover = () => item.style.backgroundColor = '#f0f0f0';
            item.onmouseout = () => item.style.backgroundColor = 'transparent';
            item.onclick = async () => {
                await this.placeComponent(gridX, gridY, comp);
                document.body.removeChild(menu);
            };
            menu.appendChild(item);
        }

        const cancel = document.createElement('div');
        cancel.textContent = 'Abbrechen';
        cancel.style.cssText = `
            padding: 5px 10px;
            cursor: pointer;
            border-radius: 4px;
            margin: 5px 0 0 0;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 8px;
        `;
        cancel.onmouseover = () => cancel.style.backgroundColor = '#f0f0f0';
        cancel.onmouseout = () => cancel.style.backgroundColor = 'transparent';
        cancel.onclick = () => document.body.removeChild(menu);
        menu.appendChild(cancel);

        document.body.appendChild(menu);
        
        const canvasRect = this.canvas.getBoundingClientRect();
        const menuX = canvasRect.left + (gridX * this.scale);
        const menuY = canvasRect.top + (gridY * this.scale);
        
        menu.style.left = `${Math.min(menuX, window.innerWidth - 220)}px`;
        menu.style.top = `${Math.min(menuY, window.innerHeight - 200)}px`;
    }

    async placeComponent(gridX, gridY, component) {
        try {
            // Wenn bereits base64-Daten vorhanden sind (z.B. Fallback aus Browser-Ordner-Picker) verwenden,
            // ansonsten versuchen wir per Fetch relative Pfade zu laden.
            // Priorisiere direkte Pfade (z.B. /Bauteile/foo.png) — ideal für statische Hosts wie GitHub Pages.
            let base64Data = component.base64Data || component.imageData || null;

            const img = new Image();
            img.onload = () => {
               // PNG-Mitte auf Grid-Punkt zentrieren (200px nach links/oben)
               const comp = {
                   x: gridX - 200, // 400px / 2
                   y: gridY - 200, // 400px / 2
                   width: 400,
                   height: 400,
                   rotation: 0, // Rotation in Grad
                   image: img,
                   imageData: base64Data, // Falls vorhanden für Undo/Redo speichern
                   name: component.name
               };

               this.components.push(comp);
               this.redraw();
               this.saveState(); // Nach Platzierung speichern
            };
            img.onerror = () => {
                console.error('Fehler beim Laden des Bildes');
            };

            // Lade-Strategie:
            // 1) Zuerst base64Data verwenden (wenn vorhanden) - funktioniert für manuell geladene Bauteile
            // 2) Ansonsten component.path verwenden (funktioniert auf GitHub Pages)
            // 3) Falls noch nichts vorhanden ist, versuchen wir per Fetch Base64 zu erzeugen.
            if (base64Data) {
                img.src = `data:image/png;base64,${base64Data}`;
            } else if (component.path) {
                img.src = component.path;
            } else {
                // Letzter Versuch: Base64 per Fetch besorgen
                base64Data = await this.getBase64For(component);
                if (!base64Data) {
                    console.error('Fehler beim Laden des Bildes (keine Bilddaten gefunden)');
                    return;
                }
                img.src = `data:image/png;base64,${base64Data}`;
            }
         } catch (error) {
             console.error('Fehler beim Platzieren des Bauteils:', error);
         }
     }
 
    // HTML-Text auf Canvas rendern (unterstützt kursiv)
    renderTextWithHTML(ctx, text, x, y, fontSize, color) {
        // Prüfen ob HTML-Tags vorhanden sind
        if (text.includes('<i>') && text.includes('</i>')) {
            // Text in normale und kursive Teile aufteilen
            const parts = text.split(/(<i>.*?<\/i>|[^<]+)/).filter(part => part !== '');
            
            let currentX = x;
            
            parts.forEach(part => {
                if (part.startsWith('<i>') && part.endsWith('</i>')) {
                    // Kursiver Text
                    const italicText = part.slice(3, -4);
                    ctx.save();
                    ctx.font = `italic ${fontSize}px Arial`;
                    ctx.fillStyle = color;
                    ctx.fillText(italicText, currentX, y);
                    currentX += ctx.measureText(italicText).width;
                    ctx.restore();
                } else if (part.trim() !== '') {
                    // Normaler Text
                    ctx.save();
                    ctx.font = `${fontSize}px Arial`;
                    ctx.fillStyle = color;
                    ctx.fillText(part, currentX, y);
                    currentX += ctx.measureText(part).width;
                    ctx.restore();
                }
            });
        } else {
            // Keine HTML-Tags - normal rendern
            ctx.font = `${fontSize}px Arial`;
            ctx.fillStyle = color;
            ctx.fillText(text, x, y);
        }
    }

    scheduleRedraw() {
        if (this.animationFrameId === null) {
            this.animationFrameId = requestAnimationFrame(() => {
                this.redraw();
                this.animationFrameId = null;
            });
        }
    }

    redraw() {
        this.drawGrid();
        
        // Kabel zeichnen
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 5;
        this.ctx.lineCap = 'round';
        
        this.cables.forEach(cable => {
            this.ctx.beginPath();
            this.ctx.moveTo(cable.start.x, cable.start.y);
            this.ctx.lineTo(cable.end.x, cable.end.y);
            this.ctx.stroke();
        });
        
        // Bauteile zeichnen
        this.components.forEach(comp => {
            this.ctx.save();
            
            // Zum Mittelpunkt des Bauteils bewegen
            const centerX = comp.x + comp.width / 2;
            const centerY = comp.y + comp.height / 2;
            
            // Rotation anwenden
            this.ctx.translate(centerX, centerY);
            this.ctx.rotate((comp.rotation || 0) * Math.PI / 180);
            this.ctx.translate(-centerX, -centerY);
            
            // Bild zeichnen
            this.ctx.drawImage(comp.image, comp.x, comp.y, comp.width, comp.height);
            
            this.ctx.restore();
        });
        
        // Kabel-Startpunkt markieren
        if (this.cableStart) {
            this.ctx.fillStyle = '#ff0000';
            this.ctx.beginPath();
            this.ctx.arc(this.cableStart.x, this.cableStart.y, 8, 0, 2 * Math.PI);
            this.ctx.fill();
        }
        
        // Texte zeichnen
        this.texts.forEach((text, index) => {
            this.renderTextWithHTML(this.ctx, text.text, text.x, text.y, text.fontSize, text.color);
        });
    }

    clear() {
        this.components = [];
        this.cables = [];
        this.texts = []; // Texte auch löschen
        this.cableStart = null;
        this.drawGrid();
        this.saveState(); // Clear als History-Step speichern
    }

    // Undo/Redo Funktionen
    saveState() {
        // Aktuellen Zustand speichern
        const state = {
            components: JSON.parse(JSON.stringify(this.components)),
            cables: JSON.parse(JSON.stringify(this.cables)),
            texts: JSON.parse(JSON.stringify(this.texts)) // Texte auch speichern
        };
        
        // History nach aktuellem Schritt abschneiden
        this.history = this.history.slice(0, this.historyStep + 1);
        
        // Neuen Zustand hinzufügen
        this.history.push(state);
        
        // History begrenzen
        if (this.history.length > this.maxHistorySteps) {
            this.history.shift();
        } else {
            this.historyStep++;
        }
    }

    undo() {
        if (this.historyStep > 0) {
            this.historyStep--;
            this.restoreState(this.history[this.historyStep]);
            console.log('Undo:', this.historyStep);
        }
    }

    redo() {
        if (this.historyStep < this.history.length - 1) {
            this.historyStep++;
            this.restoreState(this.history[this.historyStep]);
            console.log('Redo:', this.historyStep);
        }
    }

    restoreState(state) {
        this.components = JSON.parse(JSON.stringify(state.components));
        this.cables = JSON.parse(JSON.stringify(state.cables));
        this.texts = JSON.parse(JSON.stringify(state.texts || [])); // Texte wiederherstellen
        this.cableStart = null;
        
        // Bilder wiederherstellen mit imageData
        const loadPromises = this.components.map((comp, index) => {
            return new Promise((resolve) => {
                if (comp.imageData) {
                    const img = new Image();
                    img.onload = () => {
                        this.components[index].image = img;
                        resolve();
                    };
                    img.src = `data:image/png;base64,${comp.imageData}`;
                } else {
                    resolve();
                }
            });
        });
        
        Promise.all(loadPromises).then(() => {
            this.redraw();
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Strg+Z für Undo
            if (e.ctrlKey && e.key === 'z') {
                e.preventDefault();
                this.undo();
            }
            // Strg+Y für Redo
            if (e.ctrlKey && e.key === 'y') {
                e.preventDefault();
                this.redo();
            }
            // F3 für Entwicklermodus umschalten
            if (e.key === 'F3') {
                e.preventDefault();
                this.toggleDevMode();
            }
            // F5 für Bauteile neu laden (nur wenn nicht in Text-Eingabe)
            if (e.key === 'F1' && !e.target.matches('input[type="text"]')) {
                e.preventDefault();
                this.reloadComponents();
            }
        });
    }

    reloadComponents() {
        console.log('Bauteile werden neu geladen...');
        this.availableComponents = []; // Zurücksetzen
        this.openFolders.clear(); // Ordner auch zurücksetzen
        this.loadComponents(); // Neu laden
    }

    exportToPNG() {
        // exportToPNG: Erzeuge PNG im temporären Canvas und biete Save-Dialog an (wenn unterstützt).
        (async () => {
            // Bounding Box finden
            let minX = this.canvas.width;
            let minY = this.canvas.height;
            let maxX = 0;
            let maxY = 0;
            
            // Bauteile prüfen
            this.components.forEach(comp => {
                minX = Math.min(minX, comp.x);
                minY = Math.min(minY, comp.y);
                maxX = Math.max(maxX, comp.x + comp.width);
                maxY = Math.max(maxY, comp.y + comp.height);
            });
            
            // Kabel-Endpunkte prüfen
            this.cables.forEach(cable => {
                minX = Math.min(minX, cable.start.x, cable.end.x);
                minY = Math.min(minY, cable.start.y, cable.end.y);
                maxX = Math.max(maxX, cable.start.x, cable.end.x);
                maxY = Math.max(maxY, cable.start.y, cable.end.y);
            });
            
            // Texte prüfen
            this.texts.forEach(text => {
                this.ctx.font = `${text.fontSize}px Arial`;
                const metrics = this.ctx.measureText(text.text);
                const textWidth = metrics.width;
                const textHeight = text.fontSize;
                
                minX = Math.min(minX, text.x);
                minY = Math.min(minY, text.y - textHeight);
                maxX = Math.max(maxX, text.x + textWidth);
                maxY = Math.max(maxY, text.y);
            });
            
            const padding = 20;
            minX = Math.max(0, minX - padding);
            minY = Math.max(0, minY - padding);
            maxX = Math.min(this.canvas.width, maxX + padding);
            maxY = Math.min(this.canvas.height, maxY + padding);
            
            const width = Math.max(1, maxX - minX);
            const height = Math.max(1, maxY - minY);
            
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = width;
            tempCanvas.height = height;
            const tempCtx = tempCanvas.getContext('2d');
            
            // Weißer Hintergrund
            tempCtx.fillStyle = '#ffffff';
            tempCtx.fillRect(0, 0, width, height);
            
            // Kabel zeichnen
            tempCtx.strokeStyle = '#000';
            tempCtx.lineWidth = 5;
            tempCtx.lineCap = 'round';
            this.cables.forEach(cable => {
                tempCtx.beginPath();
                tempCtx.moveTo(cable.start.x - minX, cable.start.y - minY);
                tempCtx.lineTo(cable.end.x - minX, cable.end.y - minY);
                tempCtx.stroke();
            });
            
            // Bauteile zeichnen
            this.components.forEach(comp => {
                tempCtx.save();
                const relX = comp.x - minX;
                const relY = comp.y - minY;
                tempCtx.translate(relX + comp.width / 2, relY + comp.height / 2);
                tempCtx.rotate((comp.rotation || 0) * Math.PI / 180);
                tempCtx.translate(-comp.width / 2, -comp.height / 2);
                tempCtx.drawImage(comp.image, 0, 0, comp.width, comp.height);
                tempCtx.restore();
            });
            
            // Texte zeichnen
            this.texts.forEach(text => {
                const relX = text.x - minX;
                const relY = text.y - minY;
                this.renderTextWithHTML(tempCtx, text.text, relX, relY, text.fontSize, text.color);
            });

            // Blob erstellen
            const blob = await new Promise(resolve => tempCanvas.toBlob(resolve, 'image/png'));
            if (!blob) {
                alert('Fehler: PNG konnte nicht erstellt werden.');
                return;
            }

            // Wenn File System Access API verfügbar -> Save-Dialog anbieten
            if (window && typeof window.showSaveFilePicker === 'function') {
                try {
                    const opts = {
                        types: [{
                            description: 'PNG Image',
                            accept: { 'image/png': ['.png'] }
                        }]
                    };
                    const handle = await window.showSaveFilePicker(opts);
                    const writable = await handle.createWritable();
                    await writable.write(blob);
                    await writable.close();
                    console.log('PNG gespeichert via File Picker');
                    return;
                } catch (err) {
                    // Benutzer hat den Dialog vermutlich abgebrochen -> NICHT zum Download-Fallback wechseln
                    if (err && (err.name === 'AbortError' || err.name === 'NotAllowedError' || (err.message && /cancel/i.test(err.message)))) {
                        console.log('Save dialog abgebrochen vom Nutzer, kein Download erstellt.');
                        return;
                    }
                    console.warn('Save dialog abgebrochen oder Fehler, verwende Download-Fallback:', err);
                    // fallthrough to download fallback for other errors
                }
            }

            // Fallback: klassischer Download
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `schaltplan_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.png`;
            a.click();
            URL.revokeObjectURL(url);
        })();
    }

    toggleDarkMode() {
        document.body.classList.toggle('dark');
        const isDark = document.body.classList.contains('dark');
        console.log('Dark Mode:', isDark ? 'AKTIVIERT' : 'DEAKTIVIERT');
    }

    toggleDevMode() {
        this.devMode = !this.devMode;
        
        if (this.devMode) {
            console.log('🔧 Entwicklermodus AKTIVIERT');
            console.log('Verfügbare Befehle: F3, Strg+Z, Strg+Y');
            // Web: Kein programmatisches Öffnen/Schließen der DevTools möglich — No-Op
        } else {
            console.log('🔧 Entwicklermodus DEAKTIVIERT');
        }
    }

    showDevInfo() {
        const devInfo = document.createElement('div');
        devInfo.id = 'devInfo';
        devInfo.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 12px;
            z-index: 1000;
            max-width: 300px;
        `;
        devInfo.innerHTML = `
            <strong>🔧 Entwicklermodus</strong><br>
            <small>F3: Umschalten | Strg+Z: Undo | Strg+Y: Redo</small><br>
            <small>Maustitel zeigt Grid-Koordinaten</small>
        `;
        document.body.appendChild(devInfo);
    }

    hideDevInfo() {
        const devInfo = document.getElementById('devInfo');
        if (devInfo) {
            document.body.removeChild(devInfo);
        }
    }

    toggleDeleteMode() {
        this.deleteMode = !this.deleteMode;
        
        if (this.deleteMode) {
            this.canvas.style.cursor = 'crosshair';
            // Alle anderen Modi deaktivieren
            this.placementMode = null;
            this.cableMode = false;
            this.cableStart = null;
            this.textMode = false;
        } else {
            this.canvas.style.cursor = 'default';
        }
        
        // Button-Text aktualisieren
        const deleteButton = document.getElementById('deleteMode');
        if (deleteButton) {
            deleteButton.textContent = this.deleteMode ? 'Abbrechen' : '🗑️ Löschen';
        }
    }

    toggleTextMode() {
        this.textMode = !this.textMode;
        
        if (this.textMode) {
            this.canvas.style.cursor = 'text';
            // Alle anderen Modi deaktivieren
            this.placementMode = null;
            this.cableMode = false;
            this.cableStart = null;
            this.deleteMode = false;
        } else {
            this.canvas.style.cursor = 'default';
            this.selectedText = null;
        }
        
        // Button-Text aktualisieren
        const textButton = document.getElementById('textMode');
        if (textButton) {
            textButton.textContent = this.textMode ? 'Abbrechen' : '📝 Text';
        }
    }

    createText(x, y) {
        console.log('createText aufgerufen bei:', x, y);
        
        // HTML-Eingabe statt prompt()
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Text eingeben... (z.B. R_1 oder \\Omega)';
        input.style.cssText = `
            position: fixed;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            padding: 10px;
            font-size: 16px;
            border: 2px solid #333;
            border-radius: 4px;
            z-index: 10000;
            background: white;
            min-width: 300px;
        `;
        
        document.body.appendChild(input);
        input.focus();
        input.select();
        
        const handleInput = (e) => {
            if (e.key === 'Enter') {
                let text = input.value.trim();
                document.body.removeChild(input);
                document.removeEventListener('keydown', handleInput);
                
                if (text === '') {
                    console.log('Text-Eingabe leer');
                    return;
                }
                
                // Schaltplan-Notationen verarbeiten
                text = this.processCircuitNotation(text);
                
                const newText = {
                    id: Date.now(),
                    text: text,
                    x: x,
                    y: y,
                    fontSize: 100, // 3x größer für bessere Lesbarkeit
                    color: '#000000'
                };
                
                console.log('Neuer Text erstellt:', newText);
                this.texts.push(newText);
                this.redraw();
                this.saveState();
            } else if (e.key === 'Escape') {
                document.body.removeChild(input);
                document.removeEventListener('keydown', handleInput);
                console.log('Text-Eingabe abgebrochen');
            }
        };
        
        input.addEventListener('keydown', handleInput);
        
        // Auch bei Klick außerhalb schließen
        const handleClickOutside = (e) => {
            if (e.target !== input && document.body.contains(input)) {
                document.body.removeChild(input);
                document.removeEventListener('keydown', handleInput);
                document.removeEventListener('click', handleClickOutside);
                console.log('Text-Eingabe abgebrochen (Klick außerhalb)');
            }
        };
        
        setTimeout(() => {
            document.addEventListener('click', handleClickOutside);
        }, 100);
    }

    processCircuitNotation(text) {
        // Kursiv-Notation: *text* → kursiver Text
        // Mehrere Paare unterstützen: *a* normal *b* kursiv *c*
        text = text.replace(/\*([^*]+)\*/g, (match, content, offset, fullString) => {
            // HTML-Kursiv-Tags verwenden
            return `<i>${content}</i>`;
        });
        
        // Unterstrich-Notation: R_1 → R₁
        text = text.replace(/([A-Za-z]+)_(\d+)/g, (match, prefix, number) => {
            // Zahl zu tiefgestelltem Unicode-Zeichen konvertieren
            const subscriptNumbers = '₀₁₂₃₄₅₆₇₈₉';
            let subscript = '';
            for (let digit of number) {
                subscript += subscriptNumbers[parseInt(digit)];
            }
            return prefix + subscript;
        });
        
        // Backslash-Notation: \\Omega → Ω
        text = text.replace(/\\Omega/g, 'Ω');
        text = text.replace(/\\omega/g, 'ω');
        text = text.replace(/\\Alpha/g, 'Α');
        text = text.replace(/\\alpha/g, 'α');
        text = text.replace(/\\Beta/g, 'Β');
        text = text.replace(/\\beta/g, 'β');
        text = text.replace(/\\Gamma/g, 'Γ');
        text = text.replace(/\\gamma/g, 'γ');
        text = text.replace(/\\Delta/g, 'Δ');
        text = text.replace(/\\delta/g, 'δ');
        text = text.replace(/\\Epsilon/g, 'Ε');
        text = text.replace(/\\epsilon/g, 'ε');
        text = text.replace(/\\Zeta/g, 'Ζ');
        text = text.replace(/\\zeta/g, 'ζ');
        text = text.replace(/\\Eta/g, 'Η');
        text = text.replace(/\\eta/g, 'η');
        text = text.replace(/\\Theta/g, 'Θ');
        text = text.replace(/\\theta/g, 'θ');
        text = text.replace(/\\Iota/g, 'Ι');
        text = text.replace(/\\iota/g, 'ι');
        text = text.replace(/\\Kappa/g, 'Κ');
        text = text.replace(/\\kappa/g, 'κ');
        text = text.replace(/\\Lambda/g, 'Λ');
        text = text.replace(/\\lambda/g, 'λ');
        text = text.replace(/\\Mu/g, 'Μ');
        text = text.replace(/\\mu/g, 'μ');
        text = text.replace(/\\Nu/g, 'Ν');
        text = text.replace(/\\nu/g, 'ν');
        text = text.replace(/\\Xi/g, 'Ξ');
        text = text.replace(/\\xi/g, 'ξ');
        text = text.replace(/\\Pi/g, 'Π');
        text = text.replace(/\\pi/g, 'π');
        text = text.replace(/\\Rho/g, 'Ρ');
        text = text.replace(/\\rho/g, 'ρ');
        text = text.replace(/\\Sigma/g, 'Σ');
        text = text.replace(/\\sigma/g, 'σ');
        text = text.replace(/\\Tau/g, 'Τ');
        text = text.replace(/\\tau/g, 'τ');
        text = text.replace(/\\Upsilon/g, 'Υ');
        text = text.replace(/\\upsilon/g, 'υ');
        text = text.replace(/\\Phi/g, 'Φ');
        text = text.replace(/\\phi/g, 'φ');
        text = text.replace(/\\Chi/g, 'Χ');
        text = text.replace(/\\chi/g, 'χ');
        text = text.replace(/\\Psi/g, 'Ψ');
        text = text.replace(/\\psi/g, 'ψ');
        
        return text;
    }

    getTextAt(x, y) {
        // Von hinten nach vorne suchen (oben liegende zuerst)
        for (let i = this.texts.length - 1; i >= 0; i--) {
            const text = this.texts[i];
            
            // Text-Messung für ungefähre Größe
            this.ctx.font = `${text.fontSize}px Arial`;
            const metrics = this.ctx.measureText(text.text);
            const textWidth = metrics.width;
            const textHeight = text.fontSize;
            
            // Prüfen ob Punkt im Text-Bereich liegt
            if (x >= text.x && x <= text.x + textWidth &&
                y >= text.y - textHeight && y <= text.y) {
                return text;
            }
        }
        return null;
    }

    editText(text) {
        // HTML-Eingabe statt prompt()
        const input = document.createElement('input');
        input.type = 'text';
        input.value = text.text;
        input.placeholder = 'Text bearbeiten...';
        input.style.cssText = `
            position: fixed;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            padding: 10px;
            font-size: 16px;
            border: 2px solid #333;
            border-radius: 4px;
            z-index: 10000;
            background: white;
            min-width: 300px;
        `;
        
        document.body.appendChild(input);
        input.focus();
        input.select();
        
        const handleInput = (e) => {
            if (e.key === 'Enter') {
                const newText = input.value.trim();
                document.body.removeChild(input);
                document.removeEventListener('keydown', handleInput);
                
                if (newText === '') {
                    // Text löschen wenn leer
                    const index = this.texts.indexOf(text);
                    if (index > -1) {
                        this.texts.splice(index, 1);
                    }
                    console.log('Text gelöscht');
                } else {
                    // Schaltplan-Notationen verarbeiten
                    text.text = this.processCircuitNotation(newText);
                    console.log('Text bearbeitet:', text.text);
                }
                
                this.redraw();
                this.saveState();
            } else if (e.key === 'Escape') {
                document.body.removeChild(input);
                document.removeEventListener('keydown', handleInput);
                console.log('Text-Bearbeitung abgebrochen');
            }
        };
        
        input.addEventListener('keydown', handleInput);
        
        // Auch bei Klick außerhalb schließen
        const handleClickOutside = (e) => {
            if (e.target !== input && document.body.contains(input)) {
                document.body.removeChild(input);
                document.removeEventListener('keydown', handleInput);
                document.removeEventListener('click', handleClickOutside);
                console.log('Text-Bearbeitung abgebrochen (Klick außerhalb)');
            }
        };
        
        setTimeout(() => {
            document.addEventListener('click', handleClickOutside);
        }, 100);
    }

    setupDeleteListeners() {
        this.canvas.addEventListener('click', (e) => {
            if (this.deleteMode) {
                e.preventDefault();
                this.deleteAtPosition(e);
            }
        });
    }

    deleteAtPosition(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / this.scale;
        const y = (e.clientY - rect.top) / this.scale;
        
        // Zuerst Kabel löschen
        const cableIndex = this.cables.findIndex(cable => {
            return this.isPointNearLine(x, y, cable.start, cable.end);
        });
        
        if (cableIndex !== -1) {
            this.cables.splice(cableIndex, 1);
            this.redraw();
            this.saveState();
            console.log('Kabel gelöscht');
            return;
        }
        
        // Dann Bauteile löschen
        const componentIndex = this.components.findIndex(comp => {
            return x >= comp.x && x <= comp.x + comp.width &&
                   y >= comp.y && y <= comp.y + comp.height;
        });
        
        if (componentIndex !== -1) {
            this.components.splice(componentIndex, 1);
            this.redraw();
            this.saveState();
            console.log('Bauteil gelöscht:', this.components[componentIndex]?.name);
        }
    }

    isPointNearLine(px, py, start, end) {
        const distance = this.pointToLineDistance(px, py, start.x, start.y, end.x, end.y);
        return distance < 10; // 10px Toleranz
    }

    pointToLineDistance(px, py, x1, y1, x2, y2) {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;
        
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;
        
        if (lenSq !== 0) {
            param = dot / lenSq;
        }
        
        if (param < 0) {
            param = 0;
        } else if (param > 1) {
            param = 1;
        }
        
        const xx = x1 + param * C;
        const yy = y1 + param * D;
        
        const dx = px - xx;
        const dy = py - yy;
        
        return Math.sqrt(dx * dx + dy * dy);
    }

    saveProject() {
        // Projekt-Daten sammeln
        const projectData = {
            version: '1.0',
            created: new Date().toISOString(),
            components: this.components.map(comp => {
                // Versuche möglichst vollständige Reproduktion: speichere Pfad/Name UND die Base64-Daten (wenn vorhanden)
                let imagePath = comp.name;
                let imageData = comp.imageData || comp.base64Data || null;
 
                // Falls noch kein imageData, schaue in availableComponents nach (z.B. wenn Bauteile vorher geladen wurden)
                if (!imageData && Array.isArray(this.availableComponents)) {
                    const matchingComponent = this.availableComponents.find(item => {
                        if (item.isFolder && Array.isArray(item.components)) {
                            return item.components.some(sub => sub.name === (comp.name || comp.imagePath.replace('.png','')));
                        } else {
                            return item.name === (comp.name || comp.imagePath.replace('.png',''));
                        }
                    });
                    if (matchingComponent) {
                        if (matchingComponent.isFolder) {
                            const subComp = matchingComponent.components.find(sub => sub.name === (comp.name || comp.imagePath.replace('.png','')));
                            if (subComp) {
                                imagePath = subComp.path;
                                imageData = subComp.base64Data || subComp.imageData || imageData;
                            }
                        } else {
                            imagePath = matchingComponent.path || imagePath;
                            imageData = matchingComponent.base64Data || matchingComponent.imageData || imageData;
                        }
                    }
                }
 
                // Fallback: setze imagePath (sinnvoll für Export/Import)
                if (!imagePath.endsWith('.png')) imagePath = imagePath + '.png';
 
                return {
                    name: comp.name || imagePath,
                    x: comp.x,
                    y: comp.y,
                    width: comp.width,
                    height: comp.height,
                    rotation: comp.rotation || 0,
                    imagePath: imagePath,
                    imageData: imageData // kann null sein, aber wenn vorhanden ermöglicht es komplettes Wiederherstellen
                };
             }),
             cables: this.cables.map(cable => ({
                 startX: cable.start.x,
                 startY: cable.start.y,
                 endX: cable.end.x,
                 endY: cable.end.y
             })),
             texts: this.texts.map(text => ({
                 id: text.id,
                 text: text.text,
                 x: text.x,
                 y: text.y,
                 fontSize: text.fontSize,
                 color: text.color
             }))
         };
 
        // JSON erstellen und herunterladen
        const jsonString = JSON.stringify(projectData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `schaltplan_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        console.log('Projekt gespeichert:', projectData);
    }

    loadProject(file) {
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const projectData = JSON.parse(e.target.result);
                console.log('Projekt geladen:', projectData);
                
                // Alte Daten löschen
                this.components = [];
                this.cables = [];
                this.texts = []; // Texte auch löschen
                this.cableStart = null;
                
                // Kabel wiederherstellen
                if (projectData.cables) {
                    projectData.cables.forEach(cableData => {
                        this.cables.push({
                            start: { x: cableData.startX, y: cableData.startY },
                            end: { x: cableData.endX, y: cableData.endY }
                        });
                    });
                }
                
                // Bauteile wiederherstellen (mehrstufige Strategie)
                if (projectData.components) {
                    const loadPromises = projectData.components.map(async (compData, index) => {
                        // 1) Wenn imageData in JSON enthalten ist => sofort verwenden
                        if (compData.imageData) {
                            try {
                                const img = new Image();
                                await new Promise((resolve, reject) => {
                                    img.onload = resolve;
                                    img.onerror = reject;
                                    img.src = `data:image/png;base64,${compData.imageData}`;
                                });
                                this.components[index] = {
                                    name: compData.name || compData.imagePath,
                                    x: compData.x,
                                    y: compData.y,
                                    width: compData.width,
                                    height: compData.height,
                                    rotation: compData.rotation || 0,
                                    image: img,
                                    imageData: compData.imageData
                                };
                                return;
                            } catch (err) {
                                console.warn('Fehler beim Erstellen des Bildes aus imageData für', compData.name, err);
                            }
                        }
 
                        // 2) Suche in this.availableComponents nach einem passenden Element mit base64
                        let foundBase64 = null;
                        if (Array.isArray(this.availableComponents) && this.availableComponents.length > 0) {
                            const match = this.availableComponents.find(item => {
                                if (item.isFolder && Array.isArray(item.components)) {
                                    return item.components.some(sub => sub.name === (compData.name || compData.imagePath.replace('.png','')));
                                } else {
                                    return item.name === (compData.name || compData.imagePath.replace('.png',''));
                                }
                            });
                            if (match) {
                                if (match.isFolder && Array.isArray(match.components)) {
                                    const sub = match.components.find(s => s.name === (compData.name || compData.imagePath.replace('.png','')));
                                    if (sub) foundBase64 = sub.base64Data || sub.imageData || null;
                                } else {
                                    foundBase64 = match.base64Data || match.imageData || null;
                                }
                            }
                        }
 
                        // 3) Wenn noch kein base64, versuche relative Pfade per Fetch (Web) als Fallback
                        if (!foundBase64 && (compData.imagePath || compData.name)) {
                            try {
                                foundBase64 = await this.getBase64For({ path: compData.imagePath || compData.name });
                            } catch (err) {
                                console.warn('Fehler beim Laden per Fetch von', compData.imagePath || compData.name, err);
                            }
                        }
 
                        if (foundBase64) {
                            try {
                                const img = new Image();
                                await new Promise((resolve, reject) => {
                                    img.onload = resolve;
                                    img.onerror = reject;
                                    img.src = `data:image/png;base64,${foundBase64}`;
                                });
                                this.components[index] = {
                                    name: compData.name || compData.imagePath,
                                    x: compData.x,
                                    y: compData.y,
                                    width: compData.width,
                                    height: compData.height,
                                    rotation: compData.rotation || 0,
                                    image: img,
                                    imageData: foundBase64
                                };
                                return;
                            } catch (err) {
                                console.warn('Fehler beim Erstellen des Bildes aus gefundenen Base64 für', compData.name, err);
                            }
                        }
 
                        // 4) Wenn alles fehlschlägt → Bauteil überspringen, aber nicht das Laden abbrechen
                        console.warn('Bauteil konnte nicht wiederhergestellt werden (kein imageData, kein matching component):', compData.name || compData.imagePath);
                        return;
                    });
 
                    Promise.all(loadPromises).then(() => {
                        // Texte wiederherstellen
                        if (projectData.texts) {
                            this.texts = projectData.texts.map(textData => ({
                                id: textData.id,
                                text: textData.text,
                                x: textData.x,
                                y: textData.y,
                                fontSize: textData.fontSize,
                                color: textData.color
                            }));
                        }
 
                        this.redraw();
                        this.saveState(); // Geladenen Zustand speichern
                        console.log('Projekt (so weit wie möglich) geladen');
                    });
                }
             } catch (error) {
                 console.error('Fehler beim Laden des Projekts:', error);
                 alert('Fehler beim Laden der Projektdatei. Bitte überprüfen Sie das Dateiformat.');
             }
         };
         
         reader.readAsText(file);
     }

    // Neuer Handler: öffnet Dialog via Web file input (webkitdirectory) — keine Electron-Abhängigkeiten
    async selectComponentsFolder() {
		// Nur Web-Fallback: Datei-Input mit webkitdirectory
		const input = document.createElement('input');
		input.type = 'file';
		input.multiple = true;
		// Ermöglicht Ordner-Auswahl in unterstützten Browsern
		input.webkitdirectory = true;
		input.accept = '.png,.jpg,.jpeg,image/png,image/jpeg';
		input.style.display = 'none';
		document.body.appendChild(input);

		const readFileAsDataURL = (file) => new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(reader.result);
			reader.onerror = reject;
			reader.readAsDataURL(file);
		});

		input.addEventListener('change', async (e) => {
			const files = Array.from(e.target.files || []);
			if (files.length === 0) {
				document.body.removeChild(input);
				return;
			}

			// Gruppieren nach erstem Verzeichnis (top-level folder) oder root
			const folderMap = {};
			files.forEach(f => {
				const rel = f.webkitRelativePath || f.name;
				const parts = rel.split(/[/\\]/);
				if (parts.length > 1) {
					const folder = parts[0];
					folderMap[folder] = folderMap[folder] || [];
					folderMap[folder].push(f);
				} else {
					folderMap['__root__'] = folderMap['__root__'] || [];
					folderMap['__root__'].push(f);
				}
			});

			const result = [];
			// Root files as direct components
			if (folderMap['__root__']) {
				for (const f of folderMap['__root__']) {
					try {
						const dataUrl = await readFileAsDataURL(f);
						const base64 = dataUrl.split(',')[1];
						result.push({
							name: f.name.replace(/\.(png|jpg|jpeg)$/i, ''),
							path: f.name, // relative placeholder
							isFolder: false,
							base64Data: base64
						});
					} catch (err) {
						console.error('Fehler beim Lesen von', f.name, err);
					}
				}
			}

			// Subfolders
			for (const [folderName, fileList] of Object.entries(folderMap)) {
				if (folderName === '__root__') continue;
				const components = [];
				for (const f of fileList) {
					try {
						const dataUrl = await readFileAsDataURL(f);
						const base64 = dataUrl.split(',')[1];
						components.push({
							name: f.name.replace(/\.(png|jpg|jpeg)$/i, ''),
							path: f.webkitRelativePath || f.name,
							isFolder: false,
							base64Data: base64
						});
					} catch (err) {
						console.error('Fehler beim Lesen von', f.name, err);
					}
				}
				result.push({
					name: folderName,
					path: folderName,
					isFolder: true,
					components: components
				});
			}

			this.availableComponents = [...this.availableComponents, ...result];
			this.updateComponentList();
			document.body.removeChild(input);
			console.log('Bauteile-Ordner (Web-Fallback) geladen');
		}, { once: true });

		input.click();
	}
}

document.addEventListener('DOMContentLoaded', () => {
    const editor = new CircuitEditor('circuitCanvas');
    window.circuitEditor = editor;
});
