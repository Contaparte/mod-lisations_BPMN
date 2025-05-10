// Générateur de diagrammes BPMN

// Variables globales
let bpmnModeler;
let bpmnJSLoaded = false;

// Fonction pour charger dynamiquement les scripts requis
function loadScript(url, callback) {
    console.log(`Chargement de ${url}...`);
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;
    
    script.onload = function() {
        console.log(`Script ${url} chargé avec succès`);
        callback(null, url);
    };
    
    script.onerror = function() {
        console.error(`Échec du chargement de ${url}`);
        callback(new Error(`Échec du chargement de ${url}`), url);
    };
    
    document.head.appendChild(script);
}

// Chargement des dépendances requises
function loadDependencies(callback) {
    // Vérifier si jQuery est déjà chargé
    if (typeof jQuery === 'undefined') {
        loadScript('https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js', function(err) {
            if (err) return callback(err);
            loadBpmnJS(callback);
        });
    } else {
        loadBpmnJS(callback);
    }
}

// Chargement spécifique de BPMN-JS
function loadBpmnJS(callback) {
    // Vérifier si BpmnJS est déjà chargé
    if (typeof BpmnJS === 'undefined') {
        loadScript('https://unpkg.com/bpmn-js@9.4.1/dist/bpmn-modeler.production.min.js', function(err) {
            if (err) return callback(err);
            bpmnJSLoaded = true;
            callback(null);
        });
    } else {
        bpmnJSLoaded = true;
        callback(null);
    }
}

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM chargé, initialisation de l\'application...');
    
    // Charger les dépendances
    loadDependencies(function(err) {
        if (err) {
            console.error('Erreur lors du chargement des dépendances:', err);
            alert('Une erreur est survenue lors du chargement des bibliothèques nécessaires. Veuillez rafraîchir la page ou vérifier votre connexion internet.');
            return;
        }
        
        console.log('Toutes les dépendances sont chargées, initialisation du modeler BPMN...');
        
        try {
            // Initialiser le modeler BPMN
            bpmnModeler = new BpmnJS({ container: '#canvas' });
            console.log('BPMN Modeler initialisé avec succès');
            
            // Charger un diagramme vide
            createNewDiagram();
            
            // Attacher les gestionnaires d'événements
            attachEventHandlers();
        } catch (error) {
            console.error('Erreur lors de l\'initialisation du modeler BPMN:', error);
            alert('Erreur lors de l\'initialisation du diagramme. ' + error.message);
        }
    });
});

// Attacher les gestionnaires d'événements aux boutons
function attachEventHandlers() {
    const buttons = [
        { id: 'analyze-btn', handler: analyzeScenario },
        { id: 'generate-btn', handler: generateDiagram },
        { id: 'reset-btn', handler: resetForm },
        { id: 'edit-btn', handler: toggleEditMode },
        { id: 'export-xml-btn', handler: exportXML },
        { id: 'export-json-btn', handler: exportJSON },
        { id: 'export-svg-btn', handler: exportSVG },
        { id: 'export-png-btn', handler: exportPNG },
        { id: 'download-xml-btn', handler: downloadXML },
        { id: 'download-json-btn', handler: downloadJSON },
        { id: 'add-actor-btn', handler: addActor },
        { id: 'add-activity-btn', handler: addActivity },
        { id: 'add-gateway-btn', handler: addGateway }
    ];
    
    buttons.forEach(button => {
        const element = document.getElementById(button.id);
        if (element) {
            element.addEventListener('click', button.handler);
            console.log(`Gestionnaire attaché pour ${button.id}`);
        } else {
            console.warn(`Élément avec ID ${button.id} non trouvé`);
        }
    });
    
    // Attacher les gestionnaires pour les onglets
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function(event) {
            let tabName;
            if (this.getAttribute('data-tab')) {
                tabName = this.getAttribute('data-tab');
            } else if (this.getAttribute('onclick')) {
                const match = this.getAttribute('onclick').match(/'([^']+)'/);
                if (match) tabName = match[1];
            }
            
            if (tabName) {
                openTab(event, tabName);
            }
        });
    });
    
    console.log('Tous les gestionnaires d\'événements ont été attachés');
}

// Gestion des onglets
function openTab(evt, tabName) {
    const tabcontent = document.getElementsByClassName("tabcontent");
    for (let i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    
    const tablinks = document.getElementsByClassName("tab");
    for (let i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    
    const currentTab = document.getElementById(tabName);
    if (currentTab) {
        currentTab.style.display = "block";
        evt.currentTarget.className += " active";
        
        if (tabName === 'diagram-tab' && bpmnModeler) {
            setTimeout(() => {
                bpmnModeler.get('canvas').zoom('fit-viewport');
            }, 100);
        }
    }
}

// Créer un nouveau diagramme vide
function createNewDiagram() {
    if (!bpmnJSLoaded || !bpmnModeler) {
        alert('Le modeler BPMN n\'est pas initialisé correctement.');
        return;
    }
    
    const diagramXML = `
    <?xml version="1.0" encoding="UTF-8"?>
    <bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" 
                      xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" 
                      xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" 
                      xmlns:di="http://www.omg.org/spec/DD/20100524/DI" 
                      id="Definitions_0" 
                      targetNamespace="http://bpmn.io/schema/bpmn">
      <bpmn:process id="Process_1" isExecutable="false">
        <bpmn:startEvent id="StartEvent_1"/>
      </bpmn:process>
      <bpmndi:BPMNDiagram id="BPMNDiagram_1">
        <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
          <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">
            <dc:Bounds x="152" y="102" width="36" height="36" />
          </bpmndi:BPMNShape>
        </bpmndi:BPMNPlane>
      </bpmndi:BPMNDiagram>
    </bpmn:definitions>
    `;

    bpmnModeler.importXML(diagramXML).catch(err => {
        console.error('Erreur lors du chargement du diagramme vide', err);
    });
}

// Analyser le texte de la mise en situation
function analyzeScenario() {
    if (!bpmnJSLoaded) {
        alert('Veuillez attendre le chargement complet de la bibliothèque BPMN-JS.');
        return null;
    }
    
    const scenarioText = document.getElementById('scenario').value;
    
    if (!scenarioText) {
        alert('Veuillez entrer une mise en situation à analyser.');
        return null;
    }
    
    // Analyse du texte
    const analysis = {
        actors: extractActors(scenarioText),
        activities: extractActivities(scenarioText),
        decisions: extractDecisions(scenarioText),
        events: extractEvents(scenarioText),
        dataObjects: extractDataObjects(scenarioText),
        flows: extractFlows(scenarioText)
    };
    
    // Afficher les résultats de l'analyse
    document.getElementById('analysis-results').innerText = JSON.stringify(analysis, null, 2);
    
    return analysis;
}

// Extraction des acteurs
function extractActors(text) {
    const actors = [];
    const actorKeywords = [
        'client', 'utilisateur', 'agent', 'employé', 'responsable', 'préposé', 
        'gestionnaire', 'superviseur', 'technicien', 'représentant', 'service',
        'département', 'équipe', 'système', 'application', 'logiciel'
    ];
    
    const lines = text.split('\n');
    
    for (const line of lines) {
        // Chercher les acteurs explicites
        let matches = line.match(/(?:Le|La|Un|Une|L'|Les|Des)\s+([A-Z][a-zéèêëàâäôöûüùïî]+(?: [a-zéèêëàâäôöûüùïî]+)*)/g);
        if (matches) {
            for (const match of matches) {
                const actor = match.replace(/^(?:Le|La|Un|Une|L'|Les|Des)\s+/, '').trim();
                if (actor && !actors.includes(actor)) {
                    actors.push(actor);
                }
            }
        }
        
        // Chercher les mots clés d'acteurs
        for (const keyword of actorKeywords) {
            const regex = new RegExp(`\\b${keyword}\\b(?:\\s+[a-zéèêëàâäôöûüùïî]+)*(?:\\s+(?:de|du|des|à|aux|au)\\s+[a-zéèêëàâäôöûüùïî]+)*`, 'gi');
            matches = line.match(regex);
            
            if (matches) {
                for (const match of matches) {
                    const actor = match.trim();
                    if (actor && !actors.includes(actor)) {
                        actors.push(actor);
                    }
                }
            }
        }
    }
    
    return actors;
}

// Extraction des activités
function extractActivities(text) {
    const activities = [];
    
    const actionVerbs = [
        'créer', 'vérifier', 'valider', 'envoyer', 'recevoir', 'traiter', 
        'analyser', 'examiner', 'consulter', 'saisir', 'modifier', 'supprimer',
        'approuver', 'refuser', 'générer', 'imprimer', 'classer', 'archiver',
        'notifier', 'informer', 'contacter', 'appeler', 'répondre', 'préparer',
        'livrer', 'expédier', 'commander', 'planifier', 'organiser', 'contrôler'
    ];
    
    const lines = text.split(/[.;]/);
    
    for (const line of lines) {
        for (const verb of actionVerbs) {
            const verbForms = [
                verb,
                `${verb}e`,
                `${verb}es`, 
                `${verb}ent`,
                `${verb}é`
            ];
            
            for (const form of verbForms) {
                const regex = new RegExp(`\\b${form}\\b(?:\\s+(?:le|la|les|l'|un|une|des|du|au|aux|à|par))?(?:\\s+[a-zéèêëàâäôöûüùïî]+){1,5}`, 'gi');
                const matches = line.match(regex);
                
                if (matches) {
                    for (const match of matches) {
                        const activity = match.trim().toLowerCase();
                        
                        if (activity.length > 5 && !activities.some(a => activity.includes(a) || a.includes(activity))) {
                            activities.push(activity);
                        }
                    }
                }
            }
        }
    }
    
    return activities;
}

// Extraction des décisions
function extractDecisions(text) {
    const decisions = [];
    
    const conditionPatterns = [
        /si\s+([^,.?!]+)/gi,
        /est-ce\s+que\s+([^,.?!]+)/gi,
        /vérifier\s+si\s+([^,.?!]+)/gi,
        /([^,.?!]+)\s+\?\s*/gi
    ];
    
    for (const pattern of conditionPatterns) {
        const matches = Array.from(text.matchAll(pattern));
        for (const match of matches) {
            if (match[1] && match[1].length > 5) {
                decisions.push(match[1].trim());
            }
        }
    }
    
    return decisions;
}

// Extraction des événements
function extractEvents(text) {
    const events = [];
    
    const startKeywords = [
        'lorsque', 'quand', 'dès que', 'aussitôt que', 'au moment où',
        'après que', 'suite à', 'à la réception', 'au début', 'commence',
        'démarre', 'débute', 'lors de', 'à l\'arrivée'
    ];
    
    const endKeywords = [
        'terminé', 'complété', 'fini', 'achevé', 'livré', 'envoyé', 'transmis',
        'une fois', 'après avoir', 'lorsque terminé', 'à la fin', 'se termine',
        'entraîne', 'provoque', 'conduit à', 'résulte en', 'met fin'
    ];
    
    const timePatterns = [
        /\b(?:chaque|tous les)\s+(?:jour|matin|soir|lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche|semaine|mois|an)\b/gi,
        /\bà\s+(?:\d{1,2}h\d{0,2}|\d{1,2}:\d{2})\b/gi,
        /\bvers\s+(?:\d{1,2}h\d{0,2}|\d{1,2}:\d{2})\b/gi
    ];
    
    // Rechercher les événements de début
    for (const keyword of startKeywords) {
        const regex = new RegExp(`\\b${keyword}\\b(?:\\s+[^,.;!?]+){1,6}`, 'gi');
        const matches = text.match(regex);
        
        if (matches) {
            for (const match of matches) {
                events.push({ type: 'start', description: match.trim() });
            }
        }
    }
    
    // Rechercher les événements de fin
    for (const keyword of endKeywords) {
        const regex = new RegExp(`(?:[^,.;!?]+\\s+)?\\b${keyword}\\b(?:\\s+[^,.;!?]+){0,6}`, 'gi');
        const matches = text.match(regex);
        
        if (matches) {
            for (const match of matches) {
                events.push({ type: 'end', description: match.trim() });
            }
        }
    }
    
    // Rechercher les motifs temporels
    for (const pattern of timePatterns) {
        const matches = text.match(pattern);
        
        if (matches) {
            for (const match of matches) {
                events.push({ type: 'timer', description: match.trim() });
            }
        }
    }
    
    return events;
}

// Extraction des objets de données
function extractDataObjects(text) {
    const dataObjects = [];
    
    const dataObjectKeywords = [
        'fichier', 'document', 'formulaire', 'rapport', 'demande', 'commande',
        'facture', 'bon', 'contrat', 'devis', 'offre', 'soumission', 'dossier'
    ];
    
    const dataStoreKeywords = [
        'base de données', 'système', 'répertoire', 'classeur', 'archive',
        'dépôt', 'registre', 'journal', 'liste', 'catalogue', 'inventaire'
    ];
    
    // Rechercher les objets de données
    for (const keyword of dataObjectKeywords) {
        const regex = new RegExp(`\\b${keyword}\\b(?:\\s+(?:de|du|des|à|aux|au))?(?:\\s+[a-zéèêëàâäôöûüùïî]+){0,3}`, 'gi');
        const matches = text.match(regex);
        
        if (matches) {
            for (const match of matches) {
                dataObjects.push({ type: 'object', name: match.trim() });
            }
        }
    }
    
    // Rechercher les magasins de données
    for (const keyword of dataStoreKeywords) {
        const regex = new RegExp(`\\b${keyword.replace(/\s+/g, '\\s+')}\\b(?:\\s+(?:de|du|des|à|aux|au))?(?:\\s+[a-zéèêëàâäôöûüùïî]+){0,3}`, 'gi');
        const matches = text.match(regex);
        
        if (matches) {
            for (const match of matches) {
                dataObjects.push({ type: 'store', name: match.trim() });
            }
        }
    }
    
    return dataObjects;
}

// Extraction des flux
function extractFlows(text) {
    const flows = [];
    
    const sequenceKeywords = [
        'puis', 'ensuite', 'après', 'avant', 'finalement', 'enfin',
        'premièrement', 'deuxièmement', 'troisièmement', 'ultérieurement',
        'par la suite', 'à la fin', 'au début', 'une fois que'
    ];
    
    const messageKeywords = [
        'envoie', 'envoyer', 'envoi', 'transmet', 'transmettre', 'transmission',
        'communique', 'communiquer', 'communication', 'notifie', 'notifier',
        'notification', 'informe', 'informer', 'information', 'réception',
        'recevoir', 'reçoit', 'reçu'
    ];
    
    // Rechercher les flux séquentiels
    for (const keyword of sequenceKeywords) {
        const regex = new RegExp(`\\b${keyword}\\b[^.;!?]{5,100}`, 'gi');
        const matches = text.match(regex);
        
        if (matches) {
            for (const match of matches) {
                flows.push({ type: 'sequence', description: match.trim() });
            }
        }
    }
    
    // Rechercher les flux de messages
    for (const keyword of messageKeywords) {
        const regex = new RegExp(`[^.;!?]{0,50}\\b${keyword}\\b[^.;!?]{5,100}`, 'gi');
        const matches = text.match(regex);
        
        if (matches) {
            for (const match of matches) {
                flows.push({ type: 'message', description: match.trim() });
            }
        }
    }
    
    return flows;
}

// Générer un diagramme BPMN à partir de l'analyse
function generateDiagram() {
    if (!bpmnJSLoaded || !bpmnModeler) {
        alert('Le modeler BPMN n\'est pas initialisé correctement.');
        return;
    }
    
    const analysis = analyzeScenario();
    
    if (!analysis || !analysis.actors || analysis.actors.length === 0) {
        alert('L\'analyse n\'a pas détecté suffisamment d\'éléments pour générer un diagramme.');
        return;
    }
    
    // Créer un modèle BPMN à partir de l'analyse
    const bpmnModel = createBpmnModel(analysis);
    
    // Charger le modèle dans le visualiseur
    bpmnModeler.importXML(bpmnModel).then(() => {
        // Passer à l'onglet du diagramme
        const diagramTab = document.querySelector('[onclick="openTab(event, \'diagram-tab\')"]');
        if (diagramTab) {
            diagramTab.click();
        } else {
            openTab({ currentTarget: { className: '' } }, 'diagram-tab');
        }
        
        // Ajuster le zoom pour afficher tout le diagramme
        setTimeout(() => {
            bpmnModeler.get('canvas').zoom('fit-viewport');
        }, 100);
    }).catch(err => {
        console.error('Erreur lors du chargement du diagramme généré', err);
        alert('Erreur lors de la génération du diagramme.');
    });
}

// Créer un modèle BPMN XML à partir de l'analyse
function createBpmnModel(analysis) {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" 
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" 
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" 
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI" 
                  id="Definitions_1" 
                  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:collaboration id="Collaboration_1">`;
    
    // Créer une piscine pour chaque acteur
    for (let i = 0; i < analysis.actors.length; i++) {
        xml += `
    <bpmn:participant id="Participant_${i}" name="${analysis.actors[i]}" processRef="Process_${i}" />`;
    }
    
    // Ajouter les flux de messages entre participants
    if (analysis.flows && analysis.flows.length > 0) {
        const messageFlows = analysis.flows.filter(flow => flow.type === 'message');
        for (let i = 0; i < messageFlows.length && i < 5; i++) {
            const sourceIdx = i % analysis.actors.length;
            const targetIdx = (i + 1) % analysis.actors.length;
            
            xml += `
    <bpmn:messageFlow id="MessageFlow_${i}" sourceRef="Participant_${sourceIdx}" targetRef="Participant_${targetIdx}" name="${messageFlows[i].description.substring(0, 30)}..." />`;
        }
    }
    
    xml += `
  </bpmn:collaboration>`;
    
    // Créer un processus pour chaque acteur
    for (let i = 0; i < analysis.actors.length; i++) {
        xml += `
  <bpmn:process id="Process_${i}" isExecutable="false">`;
        
        // Ajouter un événement de début
        xml += `
    <bpmn:startEvent id="StartEvent_${i}" name="Début">
      <bpmn:outgoing>SequenceFlow_${i}_1</bpmn:outgoing>
    </bpmn:startEvent>`;
        
        // Ajouter des activités pour cet acteur
        const activitiesPerActor = Math.min(3, Math.ceil(analysis.activities.length / analysis.actors.length));
        const startIdx = i * activitiesPerActor;
        const endIdx = Math.min(startIdx + activitiesPerActor, analysis.activities.length);
        
        for (let j = startIdx; j < endIdx; j++) {
            const idx = j - startIdx;
            const incoming = idx === 0 ? `SequenceFlow_${i}_1` : `SequenceFlow_${i}_${idx + 1}`;
            const outgoing = idx === endIdx - startIdx - 1 ? `SequenceFlow_${i}_end` : `SequenceFlow_${i}_${idx + 2}`;
            
            xml += `
    <bpmn:task id="Task_${i}_${idx}" name="${analysis.activities[j]}">
      <bpmn:incoming>${incoming}</bpmn:incoming>
      <bpmn:outgoing>${outgoing}</bpmn:outgoing>
    </bpmn:task>`;
        }
        
        // Ajouter un événement de fin
        xml += `
    <bpmn:endEvent id="EndEvent_${i}" name="Fin">
      <bpmn:incoming>SequenceFlow_${i}_end</bpmn:incoming>
    </bpmn:endEvent>`;
        
        // Ajouter les flux de séquence
        xml += `
    <bpmn:sequenceFlow id="SequenceFlow_${i}_1" sourceRef="StartEvent_${i}" targetRef="Task_${i}_0" />`;
        
        for (let j = 0; j < endIdx - startIdx - 1; j++) {
            xml += `
    <bpmn:sequenceFlow id="SequenceFlow_${i}_${j + 2}" sourceRef="Task_${i}_${j}" targetRef="Task_${i}_${j + 1}" />`;
        }
        
        xml += `
    <bpmn:sequenceFlow id="SequenceFlow_${i}_end" sourceRef="Task_${i}_${endIdx - startIdx - 1}" targetRef="EndEvent_${i}" />`;
        
        xml += `
  </bpmn:process>`;
    }
    
    // Ajouter le diagramme graphique
    xml += `
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Collaboration_1">`;
    
    // Positionner les piscines
    for (let i = 0; i < analysis.actors.length; i++) {
        xml += `
      <bpmndi:BPMNShape id="Participant_${i}_di" bpmnElement="Participant_${i}" isHorizontal="true">
        <dc:Bounds x="160" y="${100 + i * 200}" width="800" height="150" />
      </bpmndi:BPMNShape>`;
    }
    
    // Positionner les éléments dans chaque piscine
    for (let i = 0; i < analysis.actors.length; i++) {
        // Événement de début
        xml += `
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_${i}" bpmnElement="StartEvent_${i}">
        <dc:Bounds x="212" y="${165 + i * 200}" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="218" y="${208 + i * 200}" width="26" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>`;
        
        // Activités
        const activitiesPerActor = Math.min(3, Math.ceil(analysis.activities.length / analysis.actors.length));
        const startIdx = i * activitiesPerActor;
        const endIdx = Math.min(startIdx + activitiesPerActor, analysis.activities.length);
        
        for (let j = startIdx; j < endIdx; j++) {
            const idx = j - startIdx;
            xml += `
      <bpmndi:BPMNShape id="Task_${i}_${idx}_di" bpmnElement="Task_${i}_${idx}">
        <dc:Bounds x="${300 + idx * 150}" y="${150 + i * 200}" width="100" height="80" />
      </bpmndi:BPMNShape>`;
        }
        
        // Événement de fin
        xml += `
      <bpmndi:BPMNShape id="EndEvent_${i}_di" bpmnElement="EndEvent_${i}">
        <dc:Bounds x="${800}" y="${165 + i * 200}" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="${808}" y="${208 + i * 200}" width="15" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>`;
        
        // Flux de séquence
        xml += `
      <bpmndi:BPMNEdge id="SequenceFlow_${i}_1_di" bpmnElement="SequenceFlow_${i}_1">
        <di:waypoint x="248" y="${183 + i * 200}" />
        <di:waypoint x="300" y="${183 + i * 200}" />
      </bpmndi:BPMNEdge>`;
        
        for (let j = 0; j < endIdx - startIdx - 1; j++) {
            xml += `
      <bpmndi:BPMNEdge id="SequenceFlow_${i}_${j + 2}_di" bpmnElement="SequenceFlow_${i}_${j + 2}">
        <di:waypoint x="${400 + j * 150}" y="${190 + i * 200}" />
        <di:waypoint x="${450 + j * 150}" y="${190 + i * 200}" />
      </bpmndi:BPMNEdge>`;
        }
        
        xml += `
      <bpmndi:BPMNEdge id="SequenceFlow_${i}_end_di" bpmnElement="SequenceFlow_${i}_end">
        <di:waypoint x="${700}" y="${190 + i * 200}" />
        <di:waypoint x="${800}" y="${183 + i * 200}" />
      </bpmndi:BPMNEdge>`;
    }
    
    // Flux de messages
    if (analysis.flows && analysis.flows.length > 0) {
        const messageFlows = analysis.flows.filter(flow => flow.type === 'message');
        for (let i = 0; i < messageFlows.length && i < 5; i++) {
            const sourceIdx = i % analysis.actors.length;
            const targetIdx = (i + 1) % analysis.actors.length;
            
            xml += `
      <bpmndi:BPMNEdge id="MessageFlow_${i}_di" bpmnElement="MessageFlow_${i}">
        <di:waypoint x="${300 + i * 100}" y="${190 + sourceIdx * 200}" />
        <di:waypoint x="${300 + i * 100}" y="${190 + targetIdx * 200}" />
      </bpmndi:BPMNEdge>`;
        }
    }
    
    xml += `
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

    return xml;
}

// Réinitialiser le formulaire
function resetForm() {
    document.getElementById('scenario').value = '';
    document.getElementById('analysis-results').innerText = '';
    
    if (bpmnJSLoaded && bpmnModeler) {
        createNewDiagram();
    }
    
    // Revenir à l'onglet d'entrée
    const inputTab = document.querySelector('[onclick="openTab(event, \'input-tab\')"]');
    if (inputTab) {
        inputTab.click();
    } else {
        openTab({ currentTarget: { className: '' } }, 'input-tab');
    }
}

// Fonctions supplémentaires (implémentations simplifiées)
function toggleEditMode() {
    const button = document.getElementById('edit-btn');
    if (button) {
        button.textContent = button.textContent === 'Éditer le diagramme' ? 'Terminer l\'édition' : 'Éditer le diagramme';
    }
}

function addActor() {
    if (!bpmnJSLoaded || !bpmnModeler) {
        alert('Le modeler BPMN n\'est pas initialisé correctement.');
        return;
    }
    
    const name = prompt('Nom de l\'acteur:', '');
    if (name) {
        try {
            const elementFactory = bpmnModeler.get('elementFactory');
            const modeling = bpmnModeler.get('modeling');
            const canvas = bpmnModeler.get('canvas');
            
            const participantShape = elementFactory.createParticipantShape({
                businessObject: { name: name }
            });
            
            modeling.createShape(participantShape, { x: 350, y: 200 }, canvas.getRootElement());
        } catch (error) {
            console.error('Erreur lors de l\'ajout d\'un acteur:', error);
        }
    }
}

function addActivity() {
    if (!bpmnJSLoaded || !bpmnModeler) {
        alert('Le modeler BPMN n\'est pas initialisé correctement.');
        return;
    }
    
    const name = prompt('Description de l\'activité:', '');
    if (name) {
        try {
            const elementFactory = bpmnModeler.get('elementFactory');
            const modeling = bpmnModeler.get('modeling');
            
            const taskShape = elementFactory.createShape({
                type: 'bpmn:Task',
                businessObject: { name: name }
            });
            
            modeling.createShape(taskShape, { x: 350, y: 200 }, bpmnModeler.get('canvas').getRootElement());
        } catch (error) {
            console.error('Erreur lors de l\'ajout d\'une activité:', error);
        }
    }
}

function addGateway() {
    if (!bpmnJSLoaded || !bpmnModeler) {
        alert('Le modeler BPMN n\'est pas initialisé correctement.');
        return;
    }
    
    const name = prompt('Question de la passerelle:', '');
    if (name) {
        try {
            const elementFactory = bpmnModeler.get('elementFactory');
            const modeling = bpmnModeler.get('modeling');
            
            const gatewayShape = elementFactory.createShape({
                type: 'bpmn:ExclusiveGateway',
                businessObject: { name: name }
            });
            
            modeling.createShape(gatewayShape, { x: 350, y: 200 }, bpmnModeler.get('canvas').getRootElement());
        } catch (error) {
            console.error('Erreur lors de l\'ajout d\'une passerelle:', error);
        }
    }
}

// Fonctions d'exportation
function exportXML() {
    if (!bpmnJSLoaded || !bpmnModeler) {
        alert('Le modeler BPMN n\'est pas initialisé correctement.');
        return;
    }
    
    bpmnModeler.saveXML({ format: true }).then(({ xml }) => {
        document.getElementById('xml-output').innerText = xml;
    }).catch(err => {
        console.error('Erreur lors de l\'exportation XML:', err);
    });
}

function exportJSON() {
    if (!bpmnJSLoaded || !bpmnModeler) {
        alert('Le modeler BPMN n\'est pas initialisé correctement.');
        return;
    }
    
    bpmnModeler.saveXML({ format: true }).then(({ xml }) => {
        const jsonObj = {
            xml: xml,
            metadata: {
                exportDate: new Date().toISOString(),
                elements: {
                    activities: document.querySelectorAll('.djs-element.bpmn-icon-task').length || 0,
                    events: (document.querySelectorAll('.djs-element.bpmn-icon-start-event, .djs-element.bpmn-icon-end-event').length) || 0,
                    gateways: document.querySelectorAll('.djs-element.bpmn-icon-gateway-xor').length || 0,
                    pools: document.querySelectorAll('.djs-element.bpmn-icon-participant').length || 0
                }
            }
        };
        
        document.getElementById('json-output').innerText = JSON.stringify(jsonObj, null, 2);
    }).catch(err => {
        console.error('Erreur lors de l\'exportation JSON:', err);
    });
}

function exportSVG() {
    if (!bpmnJSLoaded || !bpmnModeler) {
        alert('Le modeler BPMN n\'est pas initialisé correctement.');
        return;
    }
    
    bpmnModeler.saveSVG().then(({ svg }) => {
        const imagePreview = document.getElementById('image-preview');
        imagePreview.innerHTML = svg;
        
        // Ajuster les dimensions
        const svgElement = imagePreview.querySelector('svg');
        if (svgElement) {
            svgElement.setAttribute('width', '100%');
            svgElement.setAttribute('height', '400px');
        }
    }).catch(err => {
        console.error('Erreur lors de l\'exportation SVG:', err);
    });
}

function exportPNG() {
    if (!bpmnJSLoaded || !bpmnModeler) {
        alert('Le modeler BPMN n\'est pas initialisé correctement.');
        return;
    }
    
    bpmnModeler.saveSVG().then(({ svg }) => {
        // Créer une image à partir du SVG
        const imagePreview = document.getElementById('image-preview');
        
        try {
            // Encodage base64 du SVG
            const svgBase64 = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
            
            // Créer l'image
            const img = new Image();
            img.onload = function() {
                // Créer un canvas
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                
                // Dessiner l'image
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                
                try {
                    // Convertir en PNG
                    const pngUrl = canvas.toDataURL('image/png');
                    
                    // Afficher l'image
                    imagePreview.innerHTML = `<img src="${pngUrl}" alt="Diagramme BPMN" style="max-width: 100%; max-height: 400px;">`;
                    
                    // Lien de téléchargement
                    const downloadLink = document.createElement('a');
                    downloadLink.href = pngUrl;
                    downloadLink.download = 'diagram.png';
                    downloadLink.textContent = 'Télécharger l\'image PNG';
                    downloadLink.style.display = 'block';
                    downloadLink.style.marginTop = '10px';
                    imagePreview.appendChild(downloadLink);
                } catch (e) {
                    console.error('Erreur de conversion en PNG:', e);
                    imagePreview.innerHTML = 'Erreur de conversion en PNG. Utilisez le format SVG.';
                }
            };
            
            img.onerror = function() {
                console.error('Erreur de chargement du SVG');
                imagePreview.innerHTML = 'Erreur de chargement du SVG. Essayez l\'export SVG.';
            };
            
            img.src = svgBase64;
        } catch (error) {
            console.error('Erreur de traitement du SVG:', error);
            imagePreview.innerHTML = 'Erreur de traitement du SVG.';
        }
    }).catch(err => {
        console.error('Erreur lors de l\'exportation PNG:', err);
    });
}

function downloadXML() {
    if (!bpmnJSLoaded || !bpmnModeler) {
        alert('Le modeler BPMN n\'est pas initialisé correctement.');
        return;
    }
    
    bpmnModeler.saveXML({ format: true }).then(({ xml }) => {
        const downloadLink = document.createElement('a');
        downloadLink.href = 'data:application/xml;charset=utf-8,' + encodeURIComponent(xml);
        downloadLink.download = 'diagram.bpmn';
        
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    }).catch(err => {
        console.error('Erreur lors du téléchargement XML:', err);
    });
}

function downloadJSON() {
    if (!bpmnJSLoaded || !bpmnModeler) {
        alert('Le modeler BPMN n\'est pas initialisé correctement.');
        return;
    }
    
    bpmnModeler.saveXML({ format: true }).then(({ xml }) => {
        const jsonObj = {
            xml: xml,
            metadata: {
                exportDate: new Date().toISOString(),
                elements: {
                    activities: document.querySelectorAll('.djs-element.bpmn-icon-task').length || 0,
                    events: (document.querySelectorAll('.djs-element.bpmn-icon-start-event, .djs-element.bpmn-icon-end-event').length) || 0,
                    gateways: document.querySelectorAll('.djs-element.bpmn-icon-gateway-xor').length || 0,
                    pools: document.querySelectorAll('.djs-element.bpmn-icon-participant').length || 0
                }
            }
        };
        
        const downloadLink = document.createElement('a');
        downloadLink.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(jsonObj, null, 2));
        downloadLink.download = 'diagram.json';
        
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    }).catch(err => {
        console.error('Erreur lors du téléchargement JSON:', err);
    });
}
