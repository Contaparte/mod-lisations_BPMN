// Initialiser le module BPMN
let bpmnModeler;

document.addEventListener('DOMContentLoaded', function() {
    // Initialiser le modeler BPMN
    bpmnModeler = new BpmnJS({
        container: '#canvas'
    });

    // Charger un diagramme vide au démarrage
    createNewDiagram();

    // Gestionnaires d'événements
    document.getElementById('analyze-btn').addEventListener('click', analyzeScenario);
    document.getElementById('generate-btn').addEventListener('click', generateDiagram);
    document.getElementById('reset-btn').addEventListener('click', resetForm);
    document.getElementById('edit-btn').addEventListener('click', toggleEditMode);
    document.getElementById('export-xml-btn').addEventListener('click', exportXML);
    document.getElementById('export-json-btn').addEventListener('click', exportJSON);
    document.getElementById('export-svg-btn').addEventListener('click', exportSVG);
    document.getElementById('export-png-btn').addEventListener('click', exportPNG);
    document.getElementById('download-xml-btn').addEventListener('click', downloadXML);
    document.getElementById('download-json-btn').addEventListener('click', downloadJSON);
    document.getElementById('add-actor-btn').addEventListener('click', addActor);
    document.getElementById('add-activity-btn').addEventListener('click', addActivity);
    document.getElementById('add-gateway-btn').addEventListener('click', addGateway);
});

// Fonctions pour manipuler les onglets
function openTab(evt, tabName) {
    let tabcontent = document.getElementsByClassName("tabcontent");
    for (let i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    
    let tablinks = document.getElementsByClassName("tab");
    for (let i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";

    // Si on passe à l'onglet du diagramme, s'assurer que le canvas est correctement affiché
    if (tabName === 'diagram-tab') {
        bpmnModeler.get('canvas').zoom('fit-viewport');
    }
}

// Créer un nouveau diagramme vide
function createNewDiagram() {
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

    bpmnModeler.importXML(diagramXML, function(err) {
        if (err) {
            console.error('Erreur lors du chargement du diagramme', err);
        }
    });
}

// Analyser le texte de la mise en situation
function analyzeScenario() {
    const scenarioText = document.getElementById('scenario').value;
    
    if (!scenarioText) {
        alert('Veuillez entrer une mise en situation à analyser.');
        return;
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

// Extraction des acteurs (personnes, rôles, systèmes)
function extractActors(text) {
    const actors = [];
    // Liste des mots clés qui pourraient signaler des acteurs
    const actorKeywords = [
        'client', 'utilisateur', 'agent', 'employé', 'responsable', 'préposé', 
        'gestionnaire', 'superviseur', 'technicien', 'représentant', 'service',
        'département', 'équipe', 'système', 'application', 'logiciel'
    ];
    
    // Rechercher des acteurs en analysant chaque ligne
    const lines = text.split('\n');
    
    for (const line of lines) {
        // Chercher les acteurs explicites (marqués par "Le [acteur]", "Un [acteur]", etc.)
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

// Extraction des activités (verbes d'action)
function extractActivities(text) {
    const activities = [];
    
    // Liste des verbes d'action couramment utilisés dans les processus
    const actionVerbs = [
        'créer', 'vérifier', 'valider', 'envoyer', 'recevoir', 'traiter', 
        'analyser', 'examiner', 'consulter', 'saisir', 'modifier', 'supprimer',
        'approuver', 'refuser', 'générer', 'imprimer', 'classer', 'archiver',
        'notifier', 'informer', 'contacter', 'appeler', 'répondre', 'préparer',
        'livrer', 'expédier', 'commander', 'planifier', 'organiser', 'contrôler'
    ];
    
    // Chercher les verbes d'action suivis de compléments
    const lines = text.split(/[.;]/);
    
    for (const line of lines) {
        for (const verb of actionVerbs) {
            // Différentes formes verbales (infinitif, conjugaisons courantes)
            const verbForms = [
                verb, // infinitif
                `${verb}e`, // il/elle verbe
                `${verb}es`, // tu verbes
                `${verb}ent`, // ils/elles verbent
                `${verb}é` // participe passé
            ];
            
            for (const form of verbForms) {
                const regex = new RegExp(`\\b${form}\\b(?:\\s+(?:le|la|les|l'|un|une|des|du|au|aux|à|par))?(?:\\s+[a-zéèêëàâäôöûüùïî]+){1,5}`, 'gi');
                const matches = line.match(regex);
                
                if (matches) {
                    for (const match of matches) {
                        const activity = match.trim().toLowerCase();
                        
                        // Exclure les matches trop courts ou répétés
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

// Extraction des décisions (conditions, questions)
function extractDecisions(text) {
    const decisions = [];
    
    // Rechercher les structures de décision (Si..., Est-ce que..., Vérifier si...)
    const conditionPatterns = [
        /si\s+([^,.?!]+)/gi,
        /est-ce\s+que\s+([^,.?!]+)/gi,
        /vérifier\s+si\s+([^,.?!]+)/gi,
        /([^,.?!]+)\s+\?\s*/gi
    ];
    
    for (const pattern of conditionPatterns) {
        const matches = text.matchAll(pattern);
        for (const match of matches) {
            if (match[1] && match[1].length > 5) {
                decisions.push(match[1].trim());
            }
        }
    }
    
    return decisions;
}

// Extraction des événements (déclencheurs, résultats)
function extractEvents(text) {
    const events = [];
    
    // Mots clés pour les événements de début
    const startKeywords = [
        'lorsque', 'quand', 'dès que', 'aussitôt que', 'au moment où',
        'après que', 'suite à', 'à la réception', 'au début', 'commence',
        'démarre', 'débute', 'lors de', 'à l\'arrivée'
    ];
    
    // Mots clés pour les événements intermédiaires ou de fin
    const endKeywords = [
        'terminé', 'complété', 'fini', 'achevé', 'livré', 'envoyé', 'transmis',
        'une fois', 'après avoir', 'lorsque terminé', 'à la fin', 'se termine',
        'entraîne', 'provoque', 'conduit à', 'résulte en', 'met fin'
    ];
    
    // Expressions temporelles
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

// Extraction des objets de données et magasins de données
function extractDataObjects(text) {
    const dataObjects = [];
    
    // Mots clés pour les objets de données
    const dataObjectKeywords = [
        'fichier', 'document', 'formulaire', 'rapport', 'demande', 'commande',
        'facture', 'bon', 'contrat', 'devis', 'offre', 'soumission', 'dossier'
    ];
    
    // Mots clés pour les magasins de données
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

// Extraction des flux (séquentiels et messages)
function extractFlows(text) {
    const flows = [];
    
    // Mots clés indiquant des transitions séquentielles
    const sequenceKeywords = [
        'puis', 'ensuite', 'après', 'avant', 'finalement', 'enfin',
        'premièrement', 'deuxièmement', 'troisièmement', 'ultérieurement',
        'par la suite', 'à la fin', 'au début', 'une fois que'
    ];
    
    // Mots clés indiquant des échanges de messages
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
    const analysis = analyzeScenario();
    
    if (!analysis || !analysis.actors || analysis.actors.length === 0) {
        alert('L\'analyse n\'a pas détecté suffisamment d\'éléments pour générer un diagramme.');
        return;
    }
    
    // Créer un modèle BPMN à partir de l'analyse
    const bpmnModel = createBpmnModel(analysis);
    
    // Charger le modèle dans le visualiseur
    bpmnModeler.importXML(bpmnModel, function(err) {
        if (err) {
            console.error('Erreur lors du chargement du diagramme généré', err);
            alert('Erreur lors de la génération du diagramme.');
        } else {
            // Passer à l'onglet du diagramme
            document.querySelector('[onclick="openTab(event, \'diagram-tab\')"]').click();
            
            // Ajuster le zoom pour afficher tout le diagramme
            bpmnModeler.get('canvas').zoom('fit-viewport');
        }
    });
}

// Créer un modèle BPMN XML à partir de l'analyse
function createBpmnModel(analysis) {
    // Cette fonction crée un modèle BPMN XML à partir des résultats de l'analyse
    // C'est une version simplifiée, dans une application réelle cette fonction serait beaucoup plus complexe
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" 
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" 
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" 
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI" 
                  id="Definitions_1" 
                  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:collaboration id="Collaboration_1">`;
    
    // Créer une piscine (pool) pour chaque acteur
    for (let i = 0; i < analysis.actors.length; i++) {
        xml += `
    <bpmn:participant id="Participant_${i}" name="${analysis.actors[i]}" processRef="Process_${i}" />`;
    }
    
    // Ajouter les flux de messages entre participants
    if (analysis.flows) {
        const messageFlows = analysis.flows.filter(flow => flow.type === 'message');
        for (let i = 0; i < messageFlows.length && i < 5; i++) { // Limiter à 5 pour simplifier
            xml += `
    <bpmn:messageFlow id="MessageFlow_${i}" sourceRef="Participant_0" targetRef="Participant_1" name="${messageFlows[i].description.substring(0, 30)}..." />`;
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
    
    // Ajouter le diagramme graphique (simplifié)
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
    if (analysis.flows) {
        const messageFlows = analysis.flows.filter(flow => flow.type === 'message');
        for (let i = 0; i < messageFlows.length && i < 5; i++) {
            xml += `
      <bpmndi:BPMNEdge id="MessageFlow_${i}_di" bpmnElement="MessageFlow_${i}">
        <di:waypoint x="${300 + i * 100}" y="${190}" />
        <di:waypoint x="${300 + i * 100}" y="${390}" />
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
    
    // Recharger un diagramme vide
    createNewDiagram();
    
    // Revenir à l'onglet d'entrée
    document.querySelector('[onclick="openTab(event, \'input-tab\')"]').click();
}

// Basculer en mode édition de diagramme
function toggleEditMode() {
    const button = document.getElementById('edit-btn');
    
    if (button.textContent === 'Éditer le diagramme') {
        button.textContent = 'Terminer l\'édition';
        // Activer plus de fonctionnalités d'édition si nécessaire
    } else {
        button.textContent = 'Éditer le diagramme';
        // Désactiver les fonctionnalités d'édition supplémentaires
    }
}

// Ajouter un nouvel acteur (piscine)
function addActor() {
    const modeling = bpmnModeler.get('modeling');
    const elementFactory = bpmnModeler.get('elementFactory');
    const canvas = bpmnModeler.get('canvas');
    
    const name = prompt('Nom de l\'acteur:', '');
    
    if (name) {
        // Obtenez l'élément racine (généralement un <bpmn:Collaboration>)
        const rootElement = canvas.getRootElement();
        
        // Créer une nouvelle piscine
        const participantShape = elementFactory.createParticipantShape({
            businessObject: {
                name: name
            }
        });
        
        // Ajouter la piscine au diagramme
        modeling.createShape(participantShape, { x: 350, y: 200 }, rootElement);
    }
}

// Ajouter une nouvelle activité
function addActivity() {
    const modeling = bpmnModeler.get('modeling');
    const elementFactory = bpmnModeler.get('elementFactory');
    
    const name = prompt('Description de l\'activité:', '');
    
    if (name) {
        // Créer une nouvelle activité (tâche)
        const taskShape = elementFactory.createShape({
            type: 'bpmn:Task',
            businessObject: {
                name: name
            }
        });
        
        // Ajouter l'activité au diagramme à une position par défaut
        modeling.createShape(taskShape, { x: 350, y: 200 }, bpmnModeler.get('canvas').getRootElement());
    }
}

// Ajouter une nouvelle passerelle
function addGateway() {
    const modeling = bpmnModeler.get('modeling');
    const elementFactory = bpmnModeler.get('elementFactory');
    
    const name = prompt('Question de la passerelle:', '');
    
    if (name) {
        // Créer une nouvelle passerelle exclusive
        const gatewayShape = elementFactory.createShape({
            type: 'bpmn:ExclusiveGateway',
            businessObject: {
                name: name
            }
        });
        
        // Ajouter la passerelle au diagramme à une position par défaut
        modeling.createShape(gatewayShape, { x: 350, y: 200 }, bpmnModeler.get('canvas').getRootElement());
    }
}

// Exporter le diagramme en format XML
function exportXML() {
    bpmnModeler.saveXML({ format: true }, function(err, xml) {
        if (err) {
            console.error('Erreur lors de la sauvegarde du diagramme', err);
        } else {
            document.getElementById('xml-output').innerText = xml;
        }
    });
}

// Exporter le diagramme en format JSON
function exportJSON() {
    bpmnModeler.saveXML({ format: true }, function(err, xml) {
        if (err) {
            console.error('Erreur lors de la sauvegarde du diagramme', err);
        } else {
            // Conversion simplifiée XML vers JSON
            const jsonObj = {
                xml: xml,
                metadata: {
                    exportDate: new Date().toISOString(),
                    elements: {
                        activities: document.querySelectorAll('.djs-element.bpmn-icon-task').length,
                        events: document.querySelectorAll('.djs-element.bpmn-icon-start-event, .djs-element.bpmn-icon-end-event').length,
                        gateways: document.querySelectorAll('.djs-element.bpmn-icon-gateway-xor').length,
                        pools: document.querySelectorAll('.djs-element.bpmn-icon-participant').length
                    }
                }
            };
            
            document.getElementById('json-output').innerText = JSON.stringify(jsonObj, null, 2);
        }
    });
}

// Exporter le diagramme en format SVG
function exportSVG() {
    bpmnModeler.saveSVG(function(err, svg) {
        if (err) {
            console.error('Erreur lors de la sauvegarde du diagramme en SVG', err);
        } else {
            const imagePreview = document.getElementById('image-preview');
            imagePreview.innerHTML = svg;
            
            // Ajuster les dimensions
            const svgElement = imagePreview.querySelector('svg');
            svgElement.setAttribute('width', '100%');
            svgElement.setAttribute('height', '400px');
        }
    });
}

// Exporter le diagramme en format PNG
function exportPNG() {
    bpmnModeler.saveSVG(function(err, svg) {
        if (err) {
            console.error('Erreur lors de la sauvegarde du diagramme en SVG', err);
        } else {
            // Convertir SVG en PNG à l'aide d'un canvas
            const imagePreview = document.getElementById('image-preview');
            
            // Créer une image à partir du SVG
            const img = new Image();
            img.onload = function() {
                // Créer un canvas temporaire
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                
                // Dessiner l'image sur le canvas
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                
                // Convertir le canvas en URL de données PNG
                try {
                    const pngUrl = canvas.toDataURL('image/png');
                    
                    // Afficher l'image PNG
                    imagePreview.innerHTML = `<img src="${pngUrl}" alt="Diagramme BPMN" style="max-width: 100%; max-height: 400px;">`;
                    
                    // Ajouter un lien de téléchargement
                    const downloadLink = document.createElement('a');
                    downloadLink.href = pngUrl;
                    downloadLink.download = 'diagram.png';
                    downloadLink.textContent = 'Télécharger l\'image PNG';
                    downloadLink.style.display = 'block';
                    downloadLink.style.marginTop = '10px';
                    imagePreview.appendChild(downloadLink);
                } catch (e) {
                    console.error('Erreur lors de la conversion en PNG', e);
                    imagePreview.innerHTML = 'Erreur lors de la conversion en PNG. Essayez d\'utiliser le format SVG à la place.';
                }
            };
            
            // Déclencher le chargement de l'image à partir du SVG
            img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
        }
    });
}

// Télécharger le diagramme en format XML
function downloadXML() {
    bpmnModeler.saveXML({ format: true }, function(err, xml) {
        if (err) {
            console.error('Erreur lors de la sauvegarde du diagramme', err);
        } else {
            // Créer un lien de téléchargement
            const downloadLink = document.createElement('a');
            downloadLink.href = 'data:application/xml;charset=utf-8,' + encodeURIComponent(xml);
            downloadLink.download = 'diagram.bpmn';
            
            // Cliquer sur le lien pour déclencher le téléchargement
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        }
    });
}

// Télécharger le diagramme en format JSON
function downloadJSON() {
    bpmnModeler.saveXML({ format: true }, function(err, xml) {
        if (err) {
            console.error('Erreur lors de la sauvegarde du diagramme', err);
        } else {
            // Conversion simplifiée XML vers JSON
            const jsonObj = {
                xml: xml,
                metadata: {
                    exportDate: new Date().toISOString(),
                    elements: {
                        activities: document.querySelectorAll('.djs-element.bpmn-icon-task').length,
                        events: document.querySelectorAll('.djs-element.bpmn-icon-start-event, .djs-element.bpmn-icon-end-event').length,
                        gateways: document.querySelectorAll('.djs-element.bpmn-icon-gateway-xor').length,
                        pools: document.querySelectorAll('.djs-element.bpmn-icon-participant').length
                    }
                }
            };
            
            // Créer un lien de téléchargement
            const downloadLink = document.createElement('a');
            downloadLink.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(jsonObj, null, 2));
            downloadLink.download = 'diagram.json';
            
            // Cliquer sur le lien pour déclencher le téléchargement
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        }
    });
}