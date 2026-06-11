class CircuitEditor {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = 400;
        this.dotSize = 2;
        this.dotColor = '#ccc';
        this.components = [];
        this.selectedComponent = null;
        this.availableComponents = [];
        this.placementMode = null;
        
        this.init();
    }

    init() {
        this.setupCanvas();
        this.drawGrid();
        this.setupEventListeners();
        this.setupUploadHandlers();
        this.loadStoredComponents();
    }

    setupCanvas() {
        this.canvas.width = 2400;
        this.canvas.height = 1600;
    }

    drawGrid() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.strokeStyle = this.dotColor;
        this.ctx.fillStyle = this.dotColor;
        
        for (let x = 0; x <= this.canvas.width; x += this.gridSize) {
            for (let y = 0; y <= this.canvas.height; y += this.gridSize) {
                this.ctx.beginPath();
                this.ctx.arc(x, y, this.dotSize, 0, 2 * Math.PI);
                this.ctx.fill();
            }
        }
    }

    setupEventListeners() {
        window.addEventListener('resize', () => {
            this.setupCanvas();
            this.drawGrid();
        });

        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const gridX = Math.round(x / this.gridSize) * this.gridSize;
            const gridY = Math.round(y / this.gridSize) * this.gridSize;
            
            this.canvas.title = `Position: (${gridX}, ${gridY})`;
        });

        this.canvas.addEventListener('click', (e) => {
            if (this.placementMode) {
                const rect = this.canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const gridPos = this.getGridPosition(x, y);
                this.placeComponent(gridPos.x, gridPos.y, this.placementMode);
                
                this.placementMode = null;
                this.canvas.style.cursor = 'crosshair';
            } else {
                const rect = this.canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const gridPos = this.getGridPosition(x, y);
                this.showComponentMenu(gridPos.x, gridPos.y);
            }
        });
    }

    clear() {
        this.components = [];
        this.drawGrid();
    }

    getGridPosition(x, y) {
        const gridX = Math.round(x / this.gridSize) * this.gridSize;
        const gridY = Math.round(y / this.gridSize) * this.gridSize;
        return { x: gridX, y: gridY };
    }

    async loadComponents() {
        // Diese Methode wird nicht mehr verwendet, da wir Datei-Upload verwenden
        console.log('Verwende Datei-Upload anstelle von Dateisystem-Zugriff');
    }

    showComponentMenu(gridX, gridY) {
        if (!this.availableComponents || this.availableComponents.length === 0) {
            this.showUploadHint();
            return;
        }

        const menu = document.createElement('div');
        menu.style.cssText = `
            position: fixed;
            background: white;
            border: 2px solid #333;
            border-radius: 8px;
            padding: 10px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            z-index: 1000;
            max-height: 300px;
            overflow-y: auto;
        `;

        const title = document.createElement('h3');
        title.textContent = 'Bauteil auswählen:';
        title.style.cssText = 'margin: 0 0 10px 0; font-size: 14px;';
        menu.appendChild(title);

        this.availableComponents.forEach(comp => {
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
            item.onclick = () => {
                this.placeComponent(gridX, gridY, comp);
                document.body.removeChild(menu);
            };
            menu.appendChild(item);
        });

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
        
        const rect = this.canvas.getBoundingClientRect();
        menu.style.left = `${rect.left + gridX / (this.canvas.width / rect.width)}px`;
        menu.style.top = `${rect.top + gridY / (this.canvas.height / rect.height)}px`;
    }

    showUploadHint() {
        const hint = document.createElement('div');
        hint.style.cssText = `
            position: fixed;
            background: #fff3cd;
            border: 2px solid #ffc107;
            border-radius: 8px;
            padding: 15px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            z-index: 1000;
            max-width: 300px;
        `;
        hint.innerHTML = `
            <h4 style="margin: 0 0 10px 0; color: #856404;">Keine Bauteile gefunden</h4>
            <p style="margin: 0; color: #856404;">Bitte lade zuerst PNG-Dateien über den Upload-Button oder Drag-and-Drop hoch.</p>
        `;
        
        document.body.appendChild(hint);
        
        setTimeout(() => {
            if (document.body.contains(hint)) {
                document.body.removeChild(hint);
            }
        }, 3000);
    }

    placeComponent(gridX, gridY, component) {
        const comp = {
            x: gridX,
            y: gridY,
            width: 400,
            height: 400,
            imageData: component.imageData,
            name: component.name
        };
        
        this.components.push(comp);
        this.redraw();
    }

    redraw() {
        this.drawGrid();
        
        this.components.forEach(comp => {
            const img = new Image();
            img.onload = () => {
                this.ctx.drawImage(img, comp.x, comp.y, comp.width, comp.height);
            };
            img.src = comp.imageData;
        });
    }

    setupUploadHandlers() {
        const fileInput = document.getElementById('fileInput');
        const uploadBtn = document.getElementById('uploadBtn');
        const dropZone = document.getElementById('dropZone');

        uploadBtn.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });

        dropZone.addEventListener('click', () => fileInput.click());

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('dragover');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            this.handleFiles(e.dataTransfer.files);
        });
    }

    handleFiles(files) {
        Array.from(files).forEach(file => {
            if (file.type === 'image/png') {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const component = {
                        name: file.name.replace('.png', ''),
                        imageData: e.target.result
                    };
                    this.availableComponents.push(component);
                    this.updateComponentList();
                    this.saveComponents();
                };
                reader.readAsDataURL(file);
            } else {
                alert(`Datei ${file.name} ist keine PNG-Datei`);
            }
        });
    }

    updateComponentList() {
        const listContainer = document.getElementById('componentList');
        listContainer.innerHTML = '';

        this.availableComponents.forEach((comp, index) => {
            const item = document.createElement('div');
            item.className = 'component-item';
            
            const img = document.createElement('img');
            img.src = comp.imageData;
            
            const name = document.createElement('span');
            name.className = 'name';
            name.textContent = comp.name;
            
            const deleteBtn = document.createElement('span');
            deleteBtn.className = 'delete';
            deleteBtn.textContent = '×';
            deleteBtn.onclick = () => this.deleteComponent(index);
            
            item.appendChild(img);
            item.appendChild(name);
            item.appendChild(deleteBtn);
            
            item.onclick = (e) => {
                if (e.target !== deleteBtn) {
                    this.placementMode = comp;
                    this.canvas.style.cursor = 'copy';
                }
            };
            
            listContainer.appendChild(item);
        });
    }

    deleteComponent(index) {
        this.availableComponents.splice(index, 1);
        this.updateComponentList();
        this.saveComponents();
    }

    saveComponents() {
        const data = {
            availableComponents: this.availableComponents,
            placedComponents: this.components
        };
        localStorage.setItem('circuitEditorComponents', JSON.stringify(data));
    }

    loadStoredComponents() {
        const stored = localStorage.getItem('circuitEditorComponents');
        if (stored) {
            try {
                const data = JSON.parse(stored);
                this.availableComponents = data.availableComponents || [];
                this.components = data.placedComponents || [];
                this.updateComponentList();
                this.redraw();
            } catch (error) {
                console.error('Fehler beim Laden der gespeicherten Bauteile:', error);
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const editor = new CircuitEditor('circuitCanvas');
    window.circuitEditor = editor;
});
