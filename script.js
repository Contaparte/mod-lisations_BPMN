document.addEventListener('DOMContentLoaded', function() {
    // Variables globales
    const canvas = document.getElementById('canvas');
    const toolButtons = document.querySelectorAll('.tool-button');
    const propertiesModal = document.getElementById('propertiesModal');
    const modalBody = propertiesModal.querySelector('.modal-body');
    const saveButton = document.getElementById('saveButton');
    const cancelButton = document.getElementById('cancelButton');
    const closeBtn = propertiesModal.querySelector('.close-btn');
    
    let selectedTool = null;
    let elements = [];
    let elementCounter = 0;
    let isDrawingFlow = false;
    let flowStartElement = null;
    let isDragging = false;
    let draggedElement = null;
    let dragOffset = { x: 0, y: 0 };
    let currentElement = null;
    
    // Types d'éléments BPMN
    const elementTypes = {
        'start-event': { class: 'bpmn-event start-event', label: 'Début' },
        'end-event': { class: 'bpmn-event end-event', label: 'Fin' },
        'intermediate-event': { class: 'bpmn-event', label: 'Intermédiaire' },
        'activity-generic': { class: 'bpmn-activity', label: 'Activité' },
        'activity-manual': { class: 'bpmn-activity', label: 'Activité manuelle', icon: '✋' },
        'activity-user': { class: 'bpmn-activity', label: 'Activité utilisateur', icon: '👤' },
        'activity-service': { class: 'bpmn-activity', label: 'Activité service', icon: '⚙️' },
        'gateway-exclusive': { class: 'bpmn-gateway gateway-exclusive', label: 'Passerelle' },
        'data-object': { class: 'bpmn-data', label: 'Objet de données' },
        'data-store': { class: 'bpmn-data-store', label: 'Magasin de données' },
        'pool': { class: 'bpmn-pool', label: 'Piscine' },
        'lane': { class: 'bpmn-lane', label: 'Couloir' }
    };
    
    // Types de flux
    const flowTypes = {
        'flow-sequence': { class: 'flow-sequence', label: 'Flux de séquence' },
        'flow-message': { class: 'flow-message', label: 'Flux de message', dashArray: '5,5' }
    };
    
    // Initialisation
    function init() {
        // Événements pour les outils
        toolButtons.forEach(button => {
            button.addEventListener('click', () => selectTool(button));
        });
        
        // Événements pour le canvas
        canvas.addEventListener('click', handleCanvasClick);
        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseup', handleMouseUp);
        
        // Événements pour le modal
        closeBtn.addEventListener('click', closeModal);
        saveButton.addEventListener('click', saveProperties);
        cancelButton.addEventListener('click', closeModal);
        
        // Événement pour fermer le modal si on clique en dehors
        window.addEventListener('click', (e) => {
            if (e.target === propertiesModal) {
                closeModal();
            }
        });
    }
    
    // Sélectionner un outil
    function selectTool(button) {
        // Désélectionner l'outil actuel
        if (selectedTool) {
            document.querySelector(`[data-tool="${selectedTool}"]`).classList.remove('tool-selected');
        }
        
        // Sélectionner le nouvel outil
        button.classList.add('tool-selected');
        selectedTool = button.getAttribute('data-tool');
        
        // Si on sélectionne un outil de flux, on réinitialise l'état de dessin
        if (selectedTool === 'flow-sequence' || selectedTool === 'flow-message') {
            isDrawingFlow = false;
            flowStartElement = null;
        }
    }
    
    // Gérer le clic sur le canvas
    function handleCanvasClick(e) {
        if (!selectedTool) return;
        
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Si on dessine un flux
        if ((selectedTool === 'flow-sequence' || selectedTool === 'flow-message') && isDrawingFlow) {
            const targetElement = getElementAtPosition(x, y);
            
            if (targetElement && targetElement !== flowStartElement) {
                createFlow(flowStartElement, targetElement);
                isDrawingFlow = false;
                flowStartElement = null;
            }
            return;
        }
        
        // Si on commence à dessiner un flux
        if (selectedTool === 'flow-sequence' || selectedTool === 'flow-message') {
            const element = getElementAtPosition(x, y);
            if (element) {
                isDrawingFlow = true;
                flowStartElement = element;
            }
            return;
        }
        
        // Si on clique sur un élément existant
        const clickedElement = getElementAtPosition(x, y);
        if (clickedElement) {
            showPropertiesModal(clickedElement);
            return;
        }
        
        // Créer un nouvel élément
        createElement(selectedTool, x, y);
    }
    
    // Créer un élément BPMN
    function createElement(type, x, y) {
        if (!elementTypes[type]) return;
        
        const id = `element-${++elementCounter}`;
        const typeInfo = elementTypes[type];
        
        const element = {
            id: id,
            type: type,
            label: typeInfo.label,
            x: x,
            y: y,
            width: type.includes('activity') ? 100 : (type.includes('gateway') ? 40 : 40),
            height: type.includes('activity') ? 60 : (type.includes('gateway') ? 40 : 40),
            properties: {}
        };
        
        elements.push(element);
        renderElement(element);
        showPropertiesModal(element);
    }
    
    // Afficher un élément sur le canvas
    function renderElement(element) {
        let existingElement = document.getElementById(element.id);
        if (existingElement) {
            existingElement.remove();
        }
        
        const div = document.createElement('div');
        div.id = element.id;
        div.className = `bpmn-element ${elementTypes[element.type].class}`;
        div.style.left = `${element.x}px`;
        div.style.top = `${element.y}px`;
        div.style.width = `${element.width}px`;
        div.style.height = `${element.height}px`;
        
        // Ajouter une icône si nécessaire
        if (elementTypes[element.type].icon) {
            const icon = document.createElement('span');
            icon.className = 'element-icon';
            icon.textContent = elementTypes[element.type].icon;
            div.appendChild(icon);
        }
        
        // Ajouter un libellé si nécessaire
        if (element.label && !element.type.includes('gateway')) {
            const label = document.createElement('span');
            label.className = 'element-label';
            label.textContent = element.label;
            div.appendChild(label);
        } else if (element.type.includes('gateway')) {
            // Pour les passerelles, le texte est affiché à côté
            const label = document.createElement('div');
            label.className = 'gateway-label';
            label.textContent = element.label;
            label.style.position = 'absolute';
            label.style.left = `${element.width + 5}px`;
            label.style.top = `0px`;
            label.style.whiteSpace = 'nowrap';
            div.appendChild(label);
        }
        
        canvas.appendChild(div);
    }
    
    // Créer un flux entre deux éléments
    function createFlow(startElement, endElement) {
        const id = `flow-${++elementCounter}`;
        const type = selectedTool;
        
        // Calcul des points de départ et d'arrivée
        const startCenter = {
            x: startElement.x + startElement.width / 2,
            y: startElement.y + startElement.height / 2
        };
        
        const endCenter = {
            x: endElement.x + endElement.width / 2,
            y: endElement.y + endElement.height / 2
        };
        
        // Créer l'objet flux
        const flow = {
            id: id,
            type: type,
            startElement: startElement.id,
            endElement: endElement.id,
            startX: startCenter.x,
            startY: startCenter.y,
            endX: endCenter.x,
            endY: endCenter.y,
            properties: {
                label: flowTypes[type].label
            }
        };
        
        elements.push(flow);
        renderFlow(flow);
    }
    
    // Afficher un flux sur le canvas
    function renderFlow(flow) {
        let existingFlow = document.getElementById(flow.id);
        if (existingFlow) {
            existingFlow.remove();
        }
        
        const startElement = elements.find(el => el.id === flow.startElement);
        const endElement = elements.find(el => el.id === flow.endElement);
        
        if (!startElement || !endElement) return;
        
        // Recalculer les points de départ et d'arrivée
        const startCenter = {
            x: startElement.x + startElement.width / 2,
            y: startElement.y + startElement.height / 2
        };
        
        const endCenter = {
            x: endElement.x + endElement.width / 2,
            y: endElement.y + endElement.height / 2
        };
        
        // Distance et angle
        const dx = endCenter.x - startCenter.x;
        const dy = endCenter.y - startCenter.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        
        // Créer le conteneur
        const connector = document.createElement('div');
        connector.id = flow.id;
        connector.className = 'connector';
        connector.style.left = `${startCenter.x}px`;
        connector.style.top = `${startCenter.y}px`;
        
        // Créer la ligne
        const line = document.createElement('div');
        line.className = 'connector-line';
        line.style.width = `${distance}px`;
        line.style.transform = `rotate(${angle}deg)`;
        
        // Appliquer le style de ligne en fonction du type de flux
        if (flow.type === 'flow-message') {
            line.style.borderBottom = '2px dashed #333';
            line.style.height = '0';
        }
        
        // Créer la flèche
        const arrow = document.createElement('div');
        arrow.className = 'connector-arrow';
        arrow.style.left = `${distance - 10}px`;
        arrow.style.top = `-6px`;
        
        // Ajouter le libellé si nécessaire
        if (flow.properties && flow.properties.label) {
            const label = document.createElement('div');
            label.className = 'flow-label';
            label.textContent = flow.properties.label;
            label.style.position = 'absolute';
            label.style.left = `${distance / 2}px`;
            label.style.top = `-20px`;
            label.style.transform = `rotate(${angle}deg) translate(-50%, -50%) rotate(${-angle}deg)`;
            label.style.whiteSpace = 'nowrap';
            connector.appendChild(label);
        }
        
        connector.appendChild(line);
        line.appendChild(arrow);
        canvas.appendChild(connector);
    }
    
    // Obtenir l'élément à la position donnée
    function getElementAtPosition(x, y) {
        // Parcourir les éléments du plus récent au plus ancien
        for (let i = elements.length - 1; i >= 0; i--) {
            const element = elements[i];
            
            // Ignorer les flux
            if (element.type.includes('flow')) continue;
            
            // Vérifier si les coordonnées sont dans l'élément
            if (x >= element.x && x <= element.x + element.width &&
                y >= element.y && y <= element.y + element.height) {
                return element;
            }
        }
        
        return null;
    }
    
    // Afficher le modal de propriétés
    function showPropertiesModal(element) {
        currentElement = element;
        
        // Vider le corps du modal
        modalBody.innerHTML = '';
        
        // Ajouter le champ de libellé
        const labelGroup = document.createElement('div');
        labelGroup.className = 'form-group';
        
        const labelLabel = document.createElement('label');
        labelLabel.textContent = 'Libellé:';
        labelGroup.appendChild(labelLabel);
        
        const labelInput = document.createElement('input');
        labelInput.type = 'text';
        labelInput.id = 'element-label';
        labelInput.value = element.label || '';
        labelGroup.appendChild(labelInput);
        
        modalBody.appendChild(labelGroup);
        
        // Ajouter des champs spécifiques selon le type d'élément
        if (element.type.includes('activity')) {
            // Type d'activité
            const typeGroup = document.createElement('div');
            typeGroup.className = 'form-group';
            
            const typeLabel = document.createElement('label');
            typeLabel.textContent = 'Type d\'activité:';
            typeGroup.appendChild(typeLabel);
            
            const typeSelect = document.createElement('select');
            typeSelect.id = 'activity-type';
            
            const options = [
                { value: 'activity-generic', text: 'Générique' },
                { value: 'activity-manual', text: 'Manuelle' },
                { value: 'activity-user', text: 'Utilisateur' },
                { value: 'activity-service', text: 'Service' }
            ];
            
            options.forEach(option => {
                const opt = document.createElement('option');
                opt.value = option.value;
                opt.textContent = option.text;
                opt.selected = element.type === option.value;
                typeSelect.appendChild(opt);
            });
            
            typeGroup.appendChild(typeSelect);
            modalBody.appendChild(typeGroup);
        } 
        else if (element.type.includes('event')) {
            // Type d'événement
            const typeGroup = document.createElement('div');
            typeGroup.className = 'form-group';
            
            const typeLabel = document.createElement('label');
            typeLabel.textContent = 'Type d\'événement:';
            typeGroup.appendChild(typeLabel);
            
            const typeSelect = document.createElement('select');
            typeSelect.id = 'event-type';
            
            const options = [
                { value: 'start-event', text: 'Début' },
                { value: 'intermediate-event', text: 'Intermédiaire' },
                { value: 'end-event', text: 'Fin' }
            ];
            
            options.forEach(option => {
                const opt = document.createElement('option');
                opt.value = option.value;
                opt.textContent = option.text;
                opt.selected = element.type === option.value;
                typeSelect.appendChild(opt);
            });
            
            typeGroup.appendChild(typeSelect);
            modalBody.appendChild(typeGroup);
        }
        
        // Afficher le modal
        propertiesModal.style.display = 'flex';
    }
    
    // Fermer le modal
    function closeModal() {
        propertiesModal.style.display = 'none';
        currentElement = null;
    }
    
    // Sauvegarder les propriétés
    function saveProperties() {
        if (!currentElement) return;
        
        // Récupérer les valeurs
        const label = document.getElementById('element-label').value;
        currentElement.label = label;
        
        // Mettre à jour le type si nécessaire
        if (currentElement.type.includes('activity') && document.getElementById('activity-type')) {
            const activityType = document.getElementById('activity-type').value;
            currentElement.type = activityType;
        } 
        else if (currentElement.type.includes('event') && document.getElementById('event-type')) {
            const eventType = document.getElementById('event-type').value;
            currentElement.type = eventType;
        }
        
        // Mettre à jour l'affichage
        renderElement(currentElement);
        
        // Mettre à jour les flux connectés
        elements.forEach(element => {
            if (element.type.includes('flow') && 
                (element.startElement === currentElement.id || element.endElement === currentElement.id)) {
                renderFlow(element);
            }
        });
        
        closeModal();
    }
    
    // Gérer le début du drag
    function handleMouseDown(e) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const element = getElementAtPosition(x, y);
        
        if (element) {
            isDragging = true;
            draggedElement = element;
            dragOffset = {
                x: x - element.x,
                y: y - element.y
            };
        }
    }
    
    // Gérer le déplacement
    function handleMouseMove(e) {
        if (!isDragging || !draggedElement) return;
        
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Mettre à jour la position de l'élément
        draggedElement.x = x - dragOffset.x;
        draggedElement.y = y - dragOffset.y;
        
        // Limiter la position au canvas
        draggedElement.x = Math.max(0, Math.min(canvas.clientWidth - draggedElement.width, draggedElement.x));
        draggedElement.y = Math.max(0, Math.min(canvas.clientHeight - draggedElement.height, draggedElement.y));
        
        // Mettre à jour l'affichage
        renderElement(draggedElement);
        
        // Mettre à jour les flux connectés
        elements.forEach(element => {
            if (element.type.includes('flow') && 
                (element.startElement === draggedElement.id || element.endElement === draggedElement.id)) {
                renderFlow(element);
            }
        });
    }
    
    // Gérer la fin du drag
    function handleMouseUp() {
        isDragging = false;
        draggedElement = null;
    }
    
    // Initialiser l'application
    init();
});
