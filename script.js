document.addEventListener('DOMContentLoaded', function() {
    const generateBtn = document.getElementById('generate-btn');
    const exampleBtn = document.getElementById('example-btn');
    const clearBtn = document.getElementById('clear-btn');
    const copyBtn = document.getElementById('copy-btn');
    const scenario = document.getElementById('scenario');
    const output = document.getElementById('output');
    
    // Génération de la description BPMN
    generateBtn.addEventListener('click', function() {
        const scenarioText = scenario.value.trim();
        if (!scenarioText) {
            output.textContent = 'Veuillez entrer une description du processus d\'affaires.';
            return;
        }
        
        const description = generateBPMNDescription(scenarioText);
        output.textContent = description;
    });
    
    // Charger un exemple
    exampleBtn.addEventListener('click', function() {
        scenario.value = `Lorsqu'un rapport de dépenses papier est reçu par le préposé aux comptes, celui-ci vérifie si l'employé existe dans la base de données des employés. Si l'employé n'existe pas, le préposé le crée dans le système.

Ensuite que ce soit un employé qui existait ou un employé qui vient d'être crée, le préposé vérifie sur le rapport de dépense si le montant est de 200$ ou moins. Si c'est le cas, le rapport de dépenses est approuvé et l'argent est transféré à l'institution financière dans le compte bancaire de l'employé, ce qui met fin au processus.

Si le montant est supérieur à 200$, le rapport de dépenses est transféré au gestionnaire afin qu'il le valide. Les gestionnaires analysent les rapports de dépenses le mardi matin. Le moment venu, le gestionnaire analyse le rapport de dépense, si celui-ci approuve le rapport de dépenses, il communique son verdict au préposé, qui approuve le rapport de dépenses et transfère l'argent dans le compte bancaire de l'employé. Si le rapport de dépenses n'est pas approuvé, le gestionnaire communique avec l'employé pour l'en aviser (par courriel), ce qui met fin au processus.`;
    });
    
    // Effacer le contenu
    clearBtn.addEventListener('click', function() {
        scenario.value = '';
        output.textContent = '';
    });
    
    // Copier la description générée
    copyBtn.addEventListener('click', function() {
        if (output.textContent.trim() !== '') {
            navigator.clipboard.writeText(output.textContent)
                .then(() => {
                    const originalText = copyBtn.textContent;
                    copyBtn.textContent = 'Copié !';
                    setTimeout(() => {
                        copyBtn.textContent = originalText;
                    }, 2000);
                })
                .catch(err => {
                    console.error('Erreur lors de la copie :', err);
                });
        }
    });
});

/**
 * Génère une description BPMN complète à partir du texte du scénario
 * @param {string} scenarioText - Texte du scénario décrivant le processus
 * @return {string} - Description BPMN formatée
 */
function generateBPMNDescription(scenarioText) {
    // Prétraitement du texte pour faciliter l'analyse
    const processedText = preprocessText(scenarioText);
    
    // Extraction des composants principaux du processus
    const processComponents = extractProcessComponents(processedText);
    
    // Analyse des relations entre les composants
    const processStructure = analyzeProcessStructure(processComponents, processedText);
    
    // Génération de la description BPMN
    return formatBPMNDescription(processStructure);
}

/**
 * Prétraite le texte pour standardiser les formulations
 * @param {string} text - Texte brut du scénario
 * @return {string} - Texte prétraité
 */
function preprocessText(text) {
    return text
        .replace(/\n+/g, ' ')  // Remplacer les sauts de ligne par des espaces
        .replace(/\s+/g, ' ')  // Normaliser les espaces multiples
        .replace(/\s+([.,;:])/g, '$1')  // Supprimer les espaces avant ponctuation
        .replace(/([.,;:])(?=[^\s])/g, '$1 ')  // Ajouter des espaces après ponctuation
        .trim();
}

/**
 * Extrait les composants principaux du processus
 * @param {string} processedText - Texte prétraité
 * @return {Object} - Composants du processus (acteurs, activités, etc.)
 */
function extractProcessComponents(processedText) {
    const sentences = splitIntoSentences(processedText);
    
    // Structure pour stocker les composants
    const components = {
        actors: extractActors(processedText, sentences),
        activities: extractActivities(sentences),
        decisions: extractDecisions(sentences),
        dataObjects: extractDataObjects(sentences),
        events: extractEvents(sentences, processedText)
    };
    
    return components;
}

/**
 * Analyse la structure du processus et les relations entre composants
 * @param {Object} components - Composants du processus
 * @param {string} text - Texte du scénario
 * @return {Object} - Structure du processus avec relations
 */
function analyzeProcessStructure(components, text) {
    // Structure pour organiser le processus
    const processStructure = {
        mainProcess: 'Processus principal',
        lanes: [],
        activities: [],
        gateways: [],
        events: [],
        dataObjects: [],
        flows: []
    };
    
    // Organiser les acteurs en couloirs (lanes)
    processStructure.lanes = organizeActorsIntoLanes(components.actors);
    
    // Assigner des IDs uniques à tous les composants
    assignUniqueIds(components);
    
    // Préparer les activités et leur ordre
    processStructure.activities = prepareActivities(components.activities, processStructure.lanes);
    
    // Préparer les passerelles de décision
    processStructure.gateways = prepareGateways(components.decisions, processStructure.activities);
    
    // Préparer les événements
    processStructure.events = prepareEvents(components.events, processStructure.lanes);
    
    // Préparer les objets et magasins de données
    processStructure.dataObjects = prepareDataObjects(components.dataObjects, processStructure.activities);
    
    // Établir les flux entre composants
    processStructure.flows = establishFlows(
        processStructure.activities, 
        processStructure.gateways, 
        processStructure.events,
        text
    );
    
    // Nommer le processus principal en fonction du contexte
    processStructure.mainProcess = identifyProcessName(text, components);
    
    return processStructure;
}

/**
 * Extrait les acteurs du processus
 * @param {string} text - Texte complet du scénario
 * @param {string[]} sentences - Phrases du scénario
 * @return {Object[]} - Acteurs identifiés
 */
function extractActors(text, sentences) {
    const actors = [];
    // Dictionnaire des acteurs potentiels à rechercher
    const potentialActors = [
        {name: 'préposé aux comptes', pattern: /préposé(?:\s+aux\s+comptes)?/i, isInternal: true},
        {name: 'gestionnaire', pattern: /gestionnaire|manager|responsable/i, isInternal: true},
        {name: 'employé', pattern: /employé|salarié|travailleur/i, isInternal: false},
        {name: 'institution financière', pattern: /institution\s+financière|banque/i, isInternal: false},
        {name: 'client', pattern: /client|acheteur|consommateur/i, isInternal: false},
        {name: 'fournisseur', pattern: /fournisseur|prestataire|vendeur/i, isInternal: false},
        {name: 'système', pattern: /système|système d['']information|application|logiciel/i, isInternal: true},
        {name: 'service technique', pattern: /service\s+technique|service\s+informatique|support/i, isInternal: true},
        {name: 'service livraison', pattern: /service\s+livraison|équipe\s+de\s+livraison|livreur/i, isInternal: true},
        {name: 'agent', pattern: /agent(?:\s+aux\s+soumissions)?|représentant/i, isInternal: true},
        {name: 'superviseur', pattern: /superviseur|chef\s+d['']équipe/i, isInternal: true},
        {name: 'agent technique', pattern: /agent\s+technique|technicien/i, isInternal: true},
        {name: 'comptabilité', pattern: /comptabilité|comptable/i, isInternal: true},
        {name: 'entrepôt', pattern: /entrepôt|magasin|stockage/i, isInternal: true},
        {name: 'directeur', pattern: /directeur|direction/i, isInternal: true}
        {name: 'pharmacien', pattern: /pharmacien|chimiste/i, isInternal: false},
        {name: 'usine', pattern: /usine|fabrique|manufacture/i, isInternal: false},
    ];
    
// Ajouter une logique pour mieux distinguer les acteurs internes et externes
    actors.forEach(actor => {
        if (sentences.some(s => 
            actor.pattern.test(s) && 
            (s.includes('externe') || s.includes('partenaire')))) {
            actor.isInternal = false;
        }
    });
}

/**
 * Extrait les activités du processus
 * @param {string[]} sentences - Phrases du scénario
 * @return {Object[]} - Activités identifiées
 */
function extractActivities(sentences) {
    const activities = [];
    
    // Mots-clés pour identifier les activités
    const actionKeywords = [
        'vérifie', 'crée', 'saisit', 'envoie', 'reçoit', 'traite', 'analyse', 
        'approuve', 'rejette', 'transfère', 'communique', 'consulte', 'valide',
        'prépare', 'génère', 'imprime', 'enregistre', 'classe', 'stocke',
        'expédie', 'livre', 'exécute', 'calcule', 'compare', 'examine'
    ];
    
    sentences.forEach((sentence, index) => {
        // Ignorer les phrases trop courtes ou qui ne décrivent pas d'actions
        if (sentence.length < 10 || isConnectorSentence(sentence)) return;
        
        // Détecter si la phrase décrit une activité
        const containsActionKeyword = actionKeywords.some(keyword => 
            sentence.toLowerCase().includes(keyword)
        );
        
        if (containsActionKeyword) {
            // Identifier l'acteur responsable de l'activité
            const responsibleActor = identifyActorForActivity(sentence);
            
            // Identifier le type d'activité
            const activityType = identifyActivityType(sentence);
            
            // Extraire le nom de l'activité
            const activityName = extractActivityName(sentence);
            
            activities.push({
                name: activityName,
                description: sentence,
                type: activityType,
                actor: responsibleActor,
                position: index,
                hasDataInteraction: sentence.includes('système') || 
                                   sentence.includes('base de données') ||
                                   sentence.includes('document') ||
                                   sentence.includes('rapport')
            });
        }
    });
    
    return activities;
}

/**
 * Extrait les décisions/conditions du processus
 * @param {string[]} sentences - Phrases du scénario
 * @return {Object[]} - Décisions identifiées
 */
function extractDecisions(sentences) {
    const decisions = [];
    
    sentences.forEach((sentence, index) => {
        // Rechercher les phrases conditionnelles "si..."
        if (sentence.toLowerCase().includes(' si ')) {
            const condition = extractCondition(sentence);
            
            if (condition) {
                // Déterminer les conséquences positives et négatives
                const positiveOutcome = extractPositiveOutcome(sentence, sentences, index);
                const negativeOutcome = extractNegativeOutcome(sentence, sentences, index);
                
                decisions.push({
                    condition: condition,
                    question: convertConditionToQuestion(condition),
                    positiveOutcome: positiveOutcome,
                    negativeOutcome: negativeOutcome,
                    position: index,
                    actor: identifyActorForDecision(sentence)
                });
            }
        }
    });
    
    return decisions;
}

/**
 * Extrait les objets de données mentionnés dans le processus
 * @param {string[]} sentences - Phrases du scénario
 * @return {Object[]} - Objets de données identifiés
 */
function extractDataObjects(sentences) {
    const dataObjects = [];
    
    // Mots-clés plus complets
    const dataKeywords = {
        magasin: [
            'base de données', 'système', 'système d\'information', 
            'logiciel', 'application', 'dossier', 'filière', 'classeur'
        ],
        objet: [
            'document', 'rapport', 'formulaire', 'fichier', 'facture', 
            'bon de commande', 'bon de livraison', 'courriel', 'message', 
            'avis', 'notification', 'liste', 'reçu', 'confirmation'
        ]
    };
    
    // Améliorer la logique de détection
    sentences.forEach((sentence, index) => {
        // Pour chaque type de données
        Object.entries(dataKeywords).forEach(([type, keywords]) => {
            keywords.forEach(keyword => {
                if (sentence.toLowerCase().includes(keyword)) {
                    // Extraire le nom complet
                    let name = type === 'magasin' ? 
                        extractDataStoreName(sentence, keyword) : 
                        extractDataObjectName(sentence, keyword);
                    
                    // Éviter les doublons
                    if (!dataObjects.some(obj => 
                        obj.name.toLowerCase() === name.toLowerCase() && 
                        obj.type === type)) {
                        
                        // Déterminer le mode d'accès (lecture/écriture/mise à jour)
                        const accessMode = determineDataAccessMode(sentence);
                        
                        dataObjects.push({
                            name: name,
                            type: type,
                            position: index,
                            accessMode: accessMode,
                            relatedActivities: []
                        });
                    }
                }
            });
        });
    });
    
    return dataObjects;
}

function determineDataAccessMode(sentence) {
    const lowerSentence = sentence.toLowerCase();
    
    if (lowerSentence.includes('crée') || 
        lowerSentence.includes('génère') || 
        lowerSentence.includes('produit') || 
        lowerSentence.includes('rédige')) {
        return 'création';
    }
    
    if (lowerSentence.includes('met à jour') || 
        lowerSentence.includes('modifie') || 
        lowerSentence.includes('actualise')) {
        return 'mise à jour';
    }
    
    if (lowerSentence.includes('consulte') || 
        lowerSentence.includes('vérifie') || 
        lowerSentence.includes('lit')) {
        return 'lecture';
    }
    
    return 'indéterminé';
}
        
        // Vérifier les objets de données
        dataKeywords.objet.forEach(keyword => {
            if (sentence.toLowerCase().includes(keyword)) {
                // Essayer d'extraire le nom complet de l'objet de données
                let name = extractDataObjectName(sentence, keyword);
                
                // Éviter les doublons
                if (!dataObjects.some(obj => obj.name.toLowerCase() === name.toLowerCase() && obj.type === 'objet')) {
                    dataObjects.push({
                        name: name,
                        type: 'objet',
                        position: index,
                        relatedActivities: []
                    });
                }
            }
        });
    });
    
    return dataObjects;
}

/**
 * Extrait les événements du processus
 * @param {string[]} sentences - Phrases du scénario
 * @param {string} fullText - Texte complet du scénario
 * @return {Object[]} - Événements identifiés
 */
function extractEvents(sentences, fullText) {
    const events = [];
    
    // Ajouter l'événement de début par défaut
    events.push({
        type: 'début',
        name: inferStartEventName(sentences[0]),
        position: 0
    });
    
    // Rechercher les événements de fin
    sentences.forEach((sentence, index) => {
        if (sentence.includes('met fin au processus') || 
            sentence.includes('ce qui met fin') || 
            sentence.includes('fin du processus') ||
            sentence.includes('termine le processus') ||
            (index === sentences.length - 1 && !events.some(e => e.type === 'fin'))) {
            
            events.push({
                type: 'fin',
                name: inferEndEventName(sentence),
                position: index
            });
        }
    });
    
    // Rechercher les événements intermédiaires (minuterie, message)
    sentences.forEach((sentence, index) => {
        // Minuteries
        if (sentence.includes('mardi matin') || 
            sentence.includes('le lendemain') || 
            sentence.includes('après') ||
            sentence.includes('plus tard') ||
            sentence.match(/\ble\s+\d+\s+(?:janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\b/i)) {
            
            events.push({
                type: 'intermédiaire-minuterie',
                name: extractTemporalEvent(sentence),
                position: index
            });
        }
        
        // Messages
        if ((sentence.includes('envoie') || sentence.includes('transmet')) && 
            (sentence.includes('message') || sentence.includes('courriel') || 
             sentence.includes('notification') || sentence.includes('communique'))) {
            
            events.push({
                type: 'intermédiaire-message',
                name: 'Message ' + extractMessageEventName(sentence),
                position: index,
                isEmission: true
            });
        }
        
        if ((sentence.includes('reçoit') || sentence.includes('attend')) && 
            (sentence.includes('message') || sentence.includes('courriel') || 
             sentence.includes('notification') || sentence.includes('réponse'))) {
            
            events.push({
                type: 'intermédiaire-message',
                name: 'Réception ' + extractMessageEventName(sentence),
                position: index,
                isEmission: false
            });
        }
    });
    
    // Si aucun événement de fin n'a été identifié, en ajouter un par défaut
    if (!events.some(e => e.type === 'fin')) {
        events.push({
            type: 'fin',
            name: 'Fin du processus',
            position: sentences.length - 1
        });
    }
    
    return events;
}

/**
 * Organise les acteurs en couloirs (lanes)
 * @param {Object[]} actors - Acteurs identifiés
 * @return {Object[]} - Couloirs organisés
 */
function organizeActorsIntoLanes(actors) {
    const lanes = [];
    
    // Filtrer pour ne garder que les acteurs internes avec des activités
    const internalActors = actors.filter(actor => actor.isInternal && actor.hasActivities);
    
    // Si aucun acteur interne n'a été identifié, créer un couloir système par défaut
    if (internalActors.length === 0) {
        lanes.push({
            name: 'Système',
            isDefault: true
        });
    } else {
        // Ajouter les acteurs internes comme couloirs
        internalActors.forEach(actor => {
            lanes.push({
                name: actor.name,
                isDefault: false
            });
        });
    }
    
    // Identifier les acteurs externes pour la piscine
    const externalActors = actors.filter(actor => !actor.isInternal);
    
    // Ajouter les acteurs externes comme propriété séparée
    lanes.externalActors = externalActors;
    
    return lanes;
}

/**
 * Assigne des IDs uniques à tous les composants
 * @param {Object} components - Composants du processus
 */
function assignUniqueIds(components) {
    // Assigner IDs aux activités
    components.activities.forEach((activity, index) => {
        activity.id = 'a' + (index + 1);
    });
    
    // Assigner IDs aux décisions
    components.decisions.forEach((decision, index) => {
        decision.id = 'g' + (index + 1);
    });
    
    // Assigner IDs aux objets de données
    components.dataObjects.forEach((dataObject, index) => {
        dataObject.id = 'd' + (index + 1);
    });
    
    // Assigner IDs aux événements
    components.events.forEach((event, index) => {
        if (event.type === 'début') {
            event.id = 'start';
        } else if (event.type === 'fin') {
            event.id = 'end' + (components.events.filter(e => e.type === 'fin').indexOf(event) + 1);
        } else {
            event.id = 'e' + (index + 1);
        }
    });
}

/**
 * Prépare les activités avec leurs attributs pour la génération du BPMN
 * @param {Object[]} activities - Activités brutes
 * @param {Object[]} lanes - Couloirs du processus
 * @return {Object[]} - Activités préparées
 */
function prepareActivities(activities, lanes) {
    const preparedActivities = [];
    
    activities.forEach(activity => {
        // Déterminer le couloir approprié pour l'activité
        let laneName = activity.actor;
        
        // Vérifier si le couloir existe
        if (!lanes.some(lane => lane.name === laneName)) {
            // Utiliser le premier couloir disponible comme fallback
            laneName = lanes[0].name;
        }
        
        preparedActivities.push({
            id: activity.id,
            name: activity.name,
            type: activity.type,
            lane: laneName,
            position: activity.position,
            hasDataInteraction: activity.hasDataInteraction
        });
    });
    
    return preparedActivities;
}

/**
 * Prépare les passerelles avec leurs attributs pour la génération du BPMN
 * @param {Object[]} decisions - Décisions brutes
 * @param {Object[]} activities - Activités préparées
 * @return {Object[]} - Passerelles préparées
 */
function prepareGateways(decisions, activities) {
    function prepareGateways(decisions, activities) {
    const preparedGateways = [];
    
    decisions.forEach(decision => {
        // Déterminer si c'est une passerelle de bifurcation ou de convergence
        const isBifurcation = decision.positiveOutcome && decision.negativeOutcome;
        const isConvergence = !isBifurcation && decisions.some(d => 
            Math.abs(d.position - decision.position) <= 5 && d !== decision);
        
        // Construire une question plus précise pour la passerelle
        let question = decision.question;
        if (question.includes('existe') || question.includes('présent')) {
            question = question.replace('?', ' dans le système ?');
        }
        
        // Déterminer le bon couloir pour la passerelle
        const laneName = determineGatewayLane(decision, activities);
        
        preparedGateways.push({
            id: decision.id,
            name: question,
            type: 'exclusive',
            isConvergence: isConvergence,
            isBifurcation: isBifurcation,
            lane: laneName,
            position: decision.position,
            positiveOutcome: decision.positiveOutcome,
            negativeOutcome: decision.negativeOutcome
        });
    });
    
    return preparedGateways;
}

/**
 * Prépare les événements avec leurs attributs pour la génération du BPMN
 * @param {Object[]} events - Événements bruts
 * @param {Object[]} lanes - Couloirs du processus
 * @return {Object[]} - Événements préparés
 */
function prepareEvents(events, lanes) {
    const preparedEvents = [];
    
    events.forEach(event => {
        // Déterminer le couloir approprié pour l'événement
        let laneName;
        
        if (event.type === 'début') {
            // Premier événement va toujours dans le premier couloir
            laneName = lanes[0].name;
        } else if (event.type === 'fin') {
            // Les événements de fin vont dans le couloir associé au contexte
            laneName = determineEndEventLane(event, lanes);
        } else {
            // Événements intermédiaires vont dans le couloir le plus pertinent
            laneName = determineIntermediateEventLane(event, lanes);
        }
        
        preparedEvents.push({
            id: event.id,
            name: event.name,
            type: event.type,
            lane: laneName,
            position: event.position,
            isEmission: event.isEmission
        });
    });
    
    return preparedEvents;
}

/**
 * Prépare les objets de données avec leurs attributs pour la génération du BPMN
 * @param {Object[]} dataObjects - Objets de données bruts
 * @param {Object[]} activities - Activités préparées
 * @return {Object[]} - Objets de données préparés
 */
function prepareDataObjects(dataObjects, activities) {
    const preparedDataObjects = [];
    
    dataObjects.forEach(dataObject => {
        // Trouver les activités associées à cet objet de données
        const relatedActivities = findRelatedActivities(dataObject, activities);
        
        preparedDataObjects.push({
            id: dataObject.id,
            name: dataObject.name,
            type: dataObject.type,
            associatedActivities: relatedActivities.map(act => act.id)
        });
    });
    
    return preparedDataObjects;
}

/**
 * Établit les flux entre les composants du processus
 * @param {Object[]} activities - Activités préparées
 * @param {Object[]} gateways - Passerelles préparées
 * @param {Object[]} events - Événements préparés
 * @param {string} text - Texte du scénario
 * @return {Object[]} - Flux établis
 */
function establishFlows(activities, gateways, events, text) {
    const flows = [];
    
    // 1. Flux depuis l'événement de début vers la première activité
    const startEvent = events.find(e => e.type === 'début');
    if (startEvent && activities.length > 0) {
        flows.push({
            id: 'f1',
            type: 'sequence',
            from: startEvent.id,
            to: activities[0].id,
            condition: ''
        });
    }
    
    // 2. Connecter les activités séquentiellement, sauf si une passerelle intervient
    for (let i = 0; i < activities.length - 1; i++) {
        const currentActivity = activities[i];
        const nextActivity = activities[i + 1];
        
        // Vérifier s'il y a une passerelle entre ces deux activités
        const gatewayBetween = findGatewayBetween(gateways, currentActivity.position, nextActivity.position);
        
        if (!gatewayBetween) {
            flows.push({
                id: 'f' + (flows.length + 1),
                type: 'sequence',
                from: currentActivity.id,
                to: nextActivity.id,
                condition: ''
            });
        } else {
            // Connecter l'activité à la passerelle
            flows.push({
                id: 'f' + (flows.length + 1),
                type: 'sequence',
                from: currentActivity.id,
                to: gatewayBetween.id,
                condition: ''
            });
            
            // Connecter la passerelle aux activités suivantes (branchement)
            const positiveTarget = findActivityByDescription(activities, gatewayBetween.positiveOutcome);
            const negativeTarget = findActivityByDescription(activities, gatewayBetween.negativeOutcome);
            
            if (positiveTarget) {
                flows.push({
                    id: 'f' + (flows.length + 1),
                    type: 'sequence',
                    from: gatewayBetween.id,
                    to: positiveTarget.id,
                    condition: 'Oui'
                });
            }
            
            if (negativeTarget) {
                flows.push({
                    id: 'f' + (flows.length + 1),
                    type: 'sequence',
                    from: gatewayBetween.id,
                    to: negativeTarget.id,
                    condition: 'Non'
                });
            }
        }
    }
    
    // 3. Connecter les dernières activités aux événements de fin
    const endEvents = events.filter(e => e.type === 'fin');
    if (endEvents.length > 0 && activities.length > 0) {
        // Trouver les activités qui n'ont pas de flux sortant
        const activitiesWithoutOutflow = activities.filter(activity => 
            !flows.some(flow => flow.from === activity.id)
        );
        
        // Connecter ces activités aux événements de fin appropriés
        activitiesWithoutOutflow.forEach(activity => {
            // Trouver l'événement de fin le plus pertinent
            const relevantEndEvent = findMostRelevantEndEvent(activity, endEvents, text);
            
            if (relevantEndEvent) {
                flows.push({
                    id: 'f' + (flows.length + 1),
                    type: 'sequence',
                    from: activity.id,
                    to: relevantEndEvent.id,
                    condition: ''
                });
            }
        });
    }
    
    // 4. Gérer les flux de message
    const messageEvents = events.filter(e => e.type.includes('message'));
    messageEvents.forEach(messageEvent => {
        // Déterminer l'acteur externe cible ou source
        const externalActor = inferExternalActorForMessageEvent(messageEvent, text);
        
        if (externalActor) {
            flows.push({
                id: 'f' + (flows.length + 1),
                type: 'message',
                from: messageEvent.isEmission ? messageEvent.id : externalActor,
                to: messageEvent.isEmission ? externalActor : messageEvent.id,
                messageName: messageEvent.name.replace('Message ', '').replace('Réception ', '')
            });
        }
    });
    
    return flows;
}

/**
 * Identifie le nom du processus en fonction du contexte
 * @param {string} text - Texte du scénario
 * @param {Object} components - Composants du processus
 * @return {string} - Nom du processus
 */
function identifyProcessName(text, components) {
    // Rechercher des mots-clés indiquant le type de processus
    const processTypes = [
        {keyword: 'remboursement', name: 'Processus de remboursement des dépenses'},
        {keyword: 'vente', name: 'Processus de vente'},
        {keyword: 'achat', name: 'Processus d\'achat'},
        {keyword: 'commande', name: 'Processus de prise de commande'},
        {keyword: 'livraison', name: 'Processus de livraison'},
        {keyword: 'facturation', name: 'Processus de facturation'},
        {keyword: 'validation', name: 'Processus de validation'},
        {keyword: 'approbation', name: 'Processus d\'approbation'},
        {keyword: 'plainte', name: 'Processus de gestion des plaintes'},
        {keyword: 'rapport', name: 'Processus de gestion des rapports'},
        {keyword: 'recrutement', name: 'Processus de recrutement'},
        {keyword: 'gestion', name: 'Processus de gestion'}
    ];
    
    for (const type of processTypes) {
        if (text.toLowerCase().includes(type.keyword)) {
            return type.name;
        }
    }
    
    // Si aucun type spécifique n'est identifié, utiliser un nom générique
    return 'Processus principal';
}

/**
 * Formate la description BPMN à partir de la structure du processus
 * @param {Object} structure - Structure du processus
 * @return {string} - Description BPMN formatée
 */
function formatBPMNDescription(structure) {
    let description = '';
    
    // 1. Tracer d'abord les piscines pour les acteurs externes
    if (structure.lanes.externalActors && structure.lanes.externalActors.length > 0) {
        structure.lanes.externalActors.forEach(actor => {
            description += `Tracer une piscine pour l'acteur externe « ${actor.name} ».\n\n`;
        });
    }
    
    // 2. Tracer la piscine principale avec ses couloirs
    description += `Tracer une piscine « ${structure.mainProcess} » dans laquelle on retrouve `;
    if (structure.lanes.length === 1) {
        description += `un couloir pour l'acteur interne: « ${structure.lanes[0].name} ».\n\n`;
    } else {
        description += `${structure.lanes.length} couloirs pour les acteurs internes: `;
        description += structure.lanes.map(lane => `« ${lane.name} »`).join(', ') + '.\n\n';
    }
    
    // 3. Événements de début plus précis
    const startEvent = structure.events.find(e => e.type === 'début');
    if (startEvent) {
        if (structure.lanes.externalActors && structure.lanes.externalActors.length > 0) {
            // Événement de début avec message depuis un acteur externe
            const externalActor = structure.lanes.externalActors[0];
            description += `Tracer un événement début générique à la frontière de la piscine « ${externalActor.name} ».\n\n`;
            description += `Tracer un événement début message au début du couloir « ${startEvent.lane} » et relier l'événement de début générique à l'événement début message par le flux de message « ${startEvent.name} ».\n\n`;
        } else {
            // Événement de début standard
            description += `Tracer un événement début générique au début du couloir « ${startEvent.lane} ».\n\n`;
        }
    }
    
    // Continuer avec le reste des éléments...
    
    return description;
}

/**
 * Détermine la séquence des éléments dans le processus
 * @param {Object} structure - Structure du processus
 * @return {Object[]} - Séquence des éléments
 */
function determineElementSequence(structure) {
    const sequence = [];
    
    // Commencer par l'événement de début
    const startEvent = structure.events.find(e => e.type === 'début');
    if (startEvent) {
        sequence.push({
            type: 'event',
            eventType: 'début',
            id: startEvent.id
        });
    }
    
    // Suivre les flux pour déterminer la séquence des éléments
    let currentElementId = startEvent ? startEvent.id : null;
    const visitedElements = new Set();
    
    while (currentElementId && !visitedElements.has(currentElementId)) {
        visitedElements.add(currentElementId);
        
        // Trouver les flux sortants de l'élément actuel
        const outgoingFlows = structure.flows.filter(flow => flow.from === currentElementId);
        
        if (outgoingFlows.length > 0) {
            // Prendre le premier flux (cas simple)
            const nextFlow = outgoingFlows[0];
            const nextElementId = nextFlow.to;
            
            // Déterminer le type de l'élément suivant
            if (nextElementId.startsWith('a')) {
                sequence.push({
                    type: 'activity',
                    id: nextElementId,
                    condition: nextFlow.condition
                });
            } else if (nextElementId.startsWith('g')) {
                sequence.push({
                    type: 'gateway',
                    id: nextElementId
                });
                
                // Pour une passerelle, considérer les chemins multiples
                const gatewayOutflows = structure.flows.filter(flow => flow.from === nextElementId);
                
                // Traiter le chemin "Oui" d'abord
                const positiveFlow = gatewayOutflows.find(flow => flow.condition === 'Oui');
                if (positiveFlow) {
                    processSubPath(positiveFlow.to, structure, sequence, visitedElements, 'Oui');
                }
                
                // Puis le chemin "Non"
                const negativeFlow = gatewayOutflows.find(flow => flow.condition === 'Non');
                if (negativeFlow) {
                    processSubPath(negativeFlow.to, structure, sequence, visitedElements, 'Non');
                }
            } else if (nextElementId.startsWith('e') || nextElementId.startsWith('end')) {
                // Événement intermédiaire ou de fin
                const event = structure.events.find(e => e.id === nextElementId);
                if (event) {
                    sequence.push({
                        type: 'event',
                        eventType: event.type,
                        id: nextElementId
                    });
                }
            }
            
            currentElementId = nextElementId;
        } else {
            // Pas de flux sortant, fin de la séquence
            currentElementId = null;
        }
    }
    
    return sequence;
}

/**
 * Traite un sous-chemin du processus (pour les passerelles)
 * @param {string} elementId - ID de l'élément de départ
 * @param {Object} structure - Structure du processus
 * @param {Object[]} sequence - Séquence des éléments
 * @param {Set} visitedElements - Éléments déjà visités
 * @param {string} condition - Condition du chemin
 */
function processSubPath(elementId, structure, sequence, visitedElements, condition) {
    if (visitedElements.has(elementId)) return;
    
    visitedElements.add(elementId);
    
    if (elementId.startsWith('a')) {
        sequence.push({
            type: 'activity',
            id: elementId,
            condition: condition
        });
    } else if (elementId.startsWith('g')) {
        sequence.push({
            type: 'gateway',
            id: elementId
        });
    } else if (elementId.startsWith('e') || elementId.startsWith('end')) {
        const event = structure.events.find(e => e.id === elementId);
        if (event) {
            sequence.push({
                type: 'event',
                eventType: event.type,
                id: elementId
            });
        }
    }
    
    // Continuer la séquence si nécessaire
    const outFlows = structure.flows.filter(flow => flow.from === elementId);
    if (outFlows.length > 0) {
        const nextId = outFlows[0].to;
        if (!visitedElements.has(nextId)) {
            processSubPath(nextId, structure, sequence, visitedElements);
        }
    }
}

/**
 * Associe une activité aux objets de données pertinents
 * @param {Object} activity - Activité
 * @param {Object[]} dataObjects - Objets de données
 * @param {string} description - Description BPMN en cours
 */
function associateWithDataObjects(activity, dataObjects, description) {
    const relevantDataObjects = dataObjects.filter(obj => 
        obj.associatedActivities.includes(activity.id)
    );
    
    relevantDataObjects.forEach(dataObject => {
        const position = dataObject.type === 'magasin' ? 'au-dessus' : 'au-dessous';
        description += `Tracer un ${dataObject.type} de données « ${dataObject.name} » ${position} de cette activité et relier ce ${dataObject.type} à l'activité par une association.\n\n`;
    });
}

/**
 * Divise un texte en phrases
 * @param {string} text - Texte à diviser
 * @return {string[]} - Tableau de phrases
 */
function splitIntoSentences(text) {
    return text
        .replace(/([.!?])\s*(?=[A-Z])/g, "$1|")
        .split("|")
        .map(s => s.trim())
        .filter(s => s.length > 0);
}

/**
 * Vérifie si une phrase est une phrase de transition/connexion
 * @param {string} sentence - Phrase à vérifier
 * @return {boolean} - Vrai si c'est une phrase de connexion
 */
function isConnectorSentence(sentence) {
    const connectorPhrases = [
        'ensuite', 'puis', 'après', 'finalement', 'enfin', 'donc', 'ainsi', 
        'par conséquent', 'cependant', 'néanmoins', 'toutefois', 'mais'
    ];
    
    const lowerSentence = sentence.toLowerCase();
    return connectorPhrases.some(phrase => lowerSentence.startsWith(phrase));
}

/**
 * Identifie l'acteur responsable d'une activité
 * @param {string} sentence - Phrase décrivant l'activité
 * @return {string} - Nom de l'acteur
 */
function identifyActorForActivity(sentence) {
    const actorKeywords = {
        'préposé aux comptes': ['préposé aux comptes', 'préposé', 'comptable'],
        'gestionnaire': ['gestionnaire', 'manager', 'responsable'],
        'employé': ['employé', 'salarié', 'travailleur'],
        'système': ['système', 'application', 'logiciel'],
        'client': ['client', 'acheteur', 'consommateur'],
        'agent': ['agent', 'représentant'],
        'superviseur': ['superviseur', 'chef'],
        'agent technique': ['agent technique', 'technicien'],
        'comptabilité': ['comptabilité'],
        'service livraison': ['service livraison', 'livreur']
    };
    
    for (const [actor, keywords] of Object.entries(actorKeywords)) {
        for (const keyword of keywords) {
            if (sentence.toLowerCase().includes(keyword.toLowerCase())) {
                return capitalizeFirstLetter(actor);
            }
        }
    }
    
    // Acteur par défaut si aucun n'est identifié
    return 'Système';
}

/**
 * Identifie l'acteur responsable d'une décision
 * @param {string} sentence - Phrase décrivant la décision
 * @return {string} - Nom de l'acteur
 */
function identifyActorForDecision(sentence) {
    return identifyActorForActivity(sentence); // Même logique
}

/**
 * Identifie le type d'activité
 * @param {string} sentence - Phrase décrivant l'activité
 * @return {string} - Type d'activité
 */
function identifyActivityType(sentence) {
    const lowerSentence = sentence.toLowerCase();
    
    // Service (automatique)
    if (lowerSentence.includes('automatiquement') || 
        lowerSentence.includes('le système génère') ||
        lowerSentence.includes('est généré automatiquement') ||
        lowerSentence.includes('est calculé par')) {
        return 'service';
    }
    
    // Manuelle (sans système)
    if (lowerSentence.includes('manuellement') || 
        lowerSentence.includes('papier') ||
        lowerSentence.includes('physiquement') ||
        lowerSentence.includes('classe') && lowerSentence.includes('document')) {
        return 'manuelle';
    }
    
    // Utilisateur (interaction humain-système)
    if (lowerSentence.includes('saisit dans') || 
        lowerSentence.includes('consulte le système') ||
        lowerSentence.includes('entre les données') ||
        lowerSentence.includes('met à jour') && 
        (lowerSentence.includes('système') || lowerSentence.includes('base de données'))) {
        return 'utilisateur';
    }
    
    // Par défaut: détecter d'après le contexte
    if (lowerSentence.includes('système') || lowerSentence.includes('logiciel') || 
        lowerSentence.includes('application') || lowerSentence.includes('base de données')) {
        return 'utilisateur';
    }
    
    return 'générique';
}

/**
 * Extrait le nom d'une activité à partir d'une phrase
 * @param {string} sentence - Phrase décrivant l'activité
 * @return {string} - Nom de l'activité
 */
function extractActivityName(sentence) {
    // Identifier le verbe principal
    const actionVerbs = [
        'vérifie', 'crée', 'saisit', 'envoie', 'reçoit', 'traite', 'analyse', 
        'approuve', 'rejette', 'transfère', 'communique', 'consulte', 'valide',
        'prépare', 'génère', 'imprime', 'enregistre', 'classe', 'stocke',
        'expédie', 'livre', 'exécute', 'calcule', 'compare', 'examine'
    ];
    
    // Convertir les verbes du texte au mode infinitif pour le nom
    const verbMapping = {
        'vérifie': 'Vérifier',
        'crée': 'Créer',
        'saisit': 'Saisir',
        'envoie': 'Envoyer',
        'reçoit': 'Recevoir',
        'traite': 'Traiter',
        'analyse': 'Analyser',
        'approuve': 'Approuver',
        'rejette': 'Rejeter',
        'transfère': 'Transférer',
        'communique': 'Communiquer',
        'consulte': 'Consulter',
        'valide': 'Valider',
        'prépare': 'Préparer',
        'génère': 'Générer',
        'imprime': 'Imprimer',
        'enregistre': 'Enregistrer',
        'classe': 'Classer',
        'stocke': 'Stocker',
        'expédie': 'Expédier',
        'livre': 'Livrer',
        'exécute': 'Exécuter',
        'calcule': 'Calculer',
        'compare': 'Comparer',
        'examine': 'Examiner'
    };
    
    const lowerSentence = sentence.toLowerCase();
    let actionVerb = null;
    
    for (const verb of actionVerbs) {
        if (lowerSentence.includes(verb)) {
            actionVerb = verb;
            break;
        }
    }
    
    if (actionVerb) {
        // Extraire l'objet de l'action
        const actionIndex = lowerSentence.indexOf(actionVerb);
        const afterVerb = sentence.substring(actionIndex + actionVerb.length);
        
        // Limiter la longueur de l'objet pour un nom concis
        let objectPart = afterVerb.split(/[,.;:]/, 1)[0].trim();
        if (objectPart.length > 30) {
            objectPart = objectPart.substring(0, 27) + '...';
        }
        
        // Construire le nom de l'activité
        return verbMapping[actionVerb] + objectPart;
    }
    
    // Fallback: utiliser la première partie de la phrase
    let name = sentence;
    if (name.length > 40) {
        name = name.substring(0, 37) + '...';
    }
    
    return capitalizeFirstLetter(name);
}

/**
 * Extrait une condition à partir d'une phrase conditionnelle
 * @param {string} sentence - Phrase conditionnelle
 * @return {string} - Condition extraite
 */
function extractCondition(sentence) {
    const siIndex = sentence.toLowerCase().indexOf(' si ');
    if (siIndex === -1) return '';
    
    // Extraire la partie après "si"
    let condition = sentence.substring(siIndex + 4);
    
    // Couper à la virgule, point ou autre marqueur
    condition = condition.split(/[,.:;]|\s+alors\s+/)[0].trim();
    
    return condition;
}

/**
 * Convertit une condition en question pour le nom d'une passerelle
 * @param {string} condition - Condition à convertir
 * @return {string} - Question pour la passerelle
 */
function convertConditionToQuestion(condition) {
    // Cas spécifiques de conditions
    if (condition.includes('montant est de 200$ ou moins')) {
        return 'Montant ≤ 200$ ?';
    }
    if (condition.includes('montant est supérieur à 200$')) {
        return 'Montant > 200$ ?';
    }
    if (condition.includes('employé existe') || condition.includes('employé n\'existe pas')) {
        return 'L\'employé existe ?';
    }
    if (condition.includes('approuve le rapport') || condition.includes('rapport de dépenses n\'est pas approuvé')) {
        return 'Rapport approuvé ?';
    }
    
    // Cas général: reformuler en question
    if (condition.includes(' est ')) {
        const parts = condition.split(' est ');
        return `${capitalizeFirstLetter(parts[0])} est ${parts[1]} ?`;
    }
    
    if (condition.includes(' a ')) {
        const parts = condition.split(' a ');
        return `${capitalizeFirstLetter(parts[0])} a ${parts[1]} ?`;
    }
    
    // Dernier recours
    return `${capitalizeFirstLetter(condition)} ?`;
}

/**
 * Extrait la conséquence positive d'une condition
 * @param {string} sentence - Phrase conditionnelle
 * @param {string[]} sentences - Toutes les phrases du scénario
 * @param {number} position - Position de la phrase dans le scénario
 * @return {string} - Conséquence positive
 */
function extractPositiveOutcome(sentence, sentences, position) {
    // Si la phrase contient elle-même la conséquence positive
    if (sentence.includes(', alors ') || sentence.includes(', celui-ci ')) {
        const parts = sentence.split(/,\s+(?:alors|celui-ci)\s+/);
        if (parts.length > 1) {
            return parts[1].trim();
        }
    }
    
    // Sinon, chercher dans la phrase suivante
    if (position < sentences.length - 1) {
        return sentences[position + 1].trim();
    }
    
    return '';
}

/**
 * Extrait la conséquence négative d'une condition
 * @param {string} sentence - Phrase conditionnelle
 * @param {string[]} sentences - Toutes les phrases du scénario
 * @param {number} position - Position de la phrase dans le scénario
 * @return {string} - Conséquence négative
 */
function extractNegativeOutcome(sentence, sentences, position) {
    // Chercher les clauses "sinon"
    if (position < sentences.length - 2) {
        const nextSentence = sentences[position + 1].toLowerCase();
        const afterNextSentence = sentences[position + 2].toLowerCase();
        
        if (nextSentence.includes('sinon') || nextSentence.startsWith('si') || 
            nextSentence.includes('n\'est pas') || nextSentence.includes('ne pas')) {
            return sentences[position + 1].trim();
        } else if (afterNextSentence.includes('sinon') || afterNextSentence.startsWith('si')) {
            return sentences[position + 2].trim();
        }
    }
    
    // Rechercher des phrases avec "si... ne... pas"
    for (let i = position + 1; i < Math.min(position + 4, sentences.length); i++) {
        if (sentences[i].toLowerCase().includes('n\'est pas') || 
            sentences[i].toLowerCase().includes('ne pas') ||
            sentences[i].toLowerCase().includes('non')) {
            return sentences[i].trim();
        }
    }
    
    return '';
}

/**
 * Extrait le nom d'un magasin de données
 * @param {string} sentence - Phrase mentionnant le magasin
 * @param {string} keyword - Mot-clé ayant identifié le magasin
 * @return {string} - Nom du magasin
 */
function extractDataStoreName(sentence, keyword) {
    const lowerSentence = sentence.toLowerCase();
    const keywordIndex = lowerSentence.indexOf(keyword);
    
    if (keywordIndex !== -1) {
        // Rechercher des descripteurs adjacents
        const beforeKeyword = sentence.substring(0, keywordIndex).trim();
        const afterKeyword = sentence.substring(keywordIndex + keyword.length).trim();
        
        if (beforeKeyword.match(/\b(la|le|les|des|de|du)\s+([a-zéèêàçùïëA-Z-]+)\s*$/)) {
            const matches = beforeKeyword.match(/\b(la|le|les|des|de|du)\s+([a-zéèêàçùïëA-Z-]+)\s*$/);
            return capitalizeFirstLetter(matches[2] + ' ' + keyword);
        }
        
        if (afterKeyword.match(/^des\s+([a-zéèêàçùïëA-Z-]+)/)) {
            const matches = afterKeyword.match(/^des\s+([a-zéèêàçùïëA-Z-]+)/);
            return capitalizeFirstLetter(keyword + ' des ' + matches[1]);
        }
        
        if (afterKeyword.match(/^de\s+([a-zéèêàçùïëA-Z-]+)/)) {
            const matches = afterKeyword.match(/^de\s+([a-zéèêàçùïëA-Z-]+)/);
            return capitalizeFirstLetter(keyword + ' de ' + matches[1]);
        }
    }
    
    // Cas spécifiques communs
    if (keyword === 'base de données' && lowerSentence.includes('employé')) {
        return 'Employés';
    }
    
    if (keyword === 'système' && lowerSentence.includes('information')) {
        return 'Système d\'information';
    }
    
    // Par défaut
    return capitalizeFirstLetter(keyword);
}

/**
 * Extrait le nom d'un objet de données
 * @param {string} sentence - Phrase mentionnant l'objet
 * @param {string} keyword - Mot-clé ayant identifié l'objet
 * @return {string} - Nom de l'objet
 */
function extractDataObjectName(sentence, keyword) {
    const lowerSentence = sentence.toLowerCase();
    const keywordIndex = lowerSentence.indexOf(keyword);
    
    if (keywordIndex !== -1) {
        // Rechercher des descripteurs adjacents
        const beforeKeyword = sentence.substring(0, keywordIndex).trim();
        const afterKeyword = sentence.substring(keywordIndex + keyword.length).trim();
        
        if (beforeKeyword.match(/\b(le|la|les|du|de|des)\s+([a-zéèêàçùïëA-Z-]+)\s*$/)) {
            const matches = beforeKeyword.match(/\b(le|la|les|du|de|des)\s+([a-zéèêàçùïëA-Z-]+)\s*$/);
            return capitalizeFirstLetter(matches[2] + ' ' + keyword);
        }
        
        if (afterKeyword.match(/^de\s+([a-zéèêàçùïëA-Z-]+)/)) {
            const matches = afterKeyword.match(/^de\s+([a-zéèêàçùïëA-Z-]+)/);
            return capitalizeFirstLetter(keyword + ' de ' + matches[1]);
        }
    }
    
    // Cas spécifiques communs
    if (keyword === 'rapport' && lowerSentence.includes('dépense')) {
        return 'Rapport de dépenses';
    }
    
    if (keyword === 'bon' && lowerSentence.includes('commande')) {
        return 'Bon de commande';
    }
    
    if (keyword === 'bon' && lowerSentence.includes('livraison')) {
        return 'Bon de livraison';
    }
    
    // Par défaut
    return capitalizeFirstLetter(keyword);
}

/**
 * Infère le nom de l'événement de début à partir du contexte
 * @param {string} firstSentence - Première phrase du scénario
 * @return {string} - Nom de l'événement de début
 */
function inferStartEventName(firstSentence) {
    const lowerSentence = firstSentence.toLowerCase();
    
    // Cas spécifiques
    if (lowerSentence.includes('rapport de dépenses')) {
        return 'Recevoir rapport de dépenses';
    }
    
    if (lowerSentence.includes('commande')) {
        return 'Recevoir commande';
    }
    
    if (lowerSentence.includes('demande')) {
        return 'Recevoir demande';
    }
    
    if (lowerSentence.includes('facture')) {
        return 'Recevoir facture';
    }
    
    // Extraire un objet du début
    const objects = ['rapport', 'demande', 'commande', 'requête', 'document', 'formulaire'];
    for (const obj of objects) {
        if (lowerSentence.includes(obj)) {
            return 'Recevoir ' + obj;
        }
    }
    
    // Par défaut
    return 'Début du processus';
}

/**
 * Infère le nom de l'événement de fin à partir du contexte
 * @param {string} sentence - Phrase contenant la fin
 * @return {string} - Nom de l'événement de fin
 */
function inferEndEventName(sentence) {
    const lowerSentence = sentence.toLowerCase();
    
    // Cas spécifiques
    if (lowerSentence.includes('approuvé')) {
        return 'Rapport approuvé';
    }
    
    if (lowerSentence.includes('refusé') || lowerSentence.includes('n\'est pas approuvé')) {
        return 'Rapport refusé';
    }
    
    if (lowerSentence.includes('livrée') || lowerSentence.includes('livraison')) {
        return 'Commande livrée';
    }
    
    if (lowerSentence.includes('payée') || lowerSentence.includes('paiement')) {
        return 'Commande payée';
    }
    
    if (lowerSentence.includes('annulée')) {
        return 'Commande annulée';
    }
    
    // Par défaut
    return 'Fin du processus';
}

/**
 * Extrait le nom d'un événement temporel
 * @param {string} sentence - Phrase mentionnant l'événement
 * @return {string} - Nom de l'événement
 */
function extractTemporalEvent(sentence) {
    const lowerSentence = sentence.toLowerCase();
    
    // Jours spécifiques
    if (lowerSentence.includes('lundi')) return 'Lundi';
    if (lowerSentence.includes('mardi')) return 'Mardi';
    if (lowerSentence.includes('mercredi')) return 'Mercredi';
    if (lowerSentence.includes('jeudi')) return 'Jeudi';
    if (lowerSentence.includes('vendredi')) return 'Vendredi';
    if (lowerSentence.includes('samedi')) return 'Samedi';
    if (lowerSentence.includes('dimanche')) return 'Dimanche';
    
    // Moments spécifiques
    if (lowerSentence.includes('matin')) return 'Mardi matin';
    if (lowerSentence.includes('soir')) return 'Le soir';
    if (lowerSentence.includes('lendemain')) return 'Le lendemain';
    
    // Périodes
    if (lowerSentence.match(/\d+\s+(?:heure|minute|jour|semaine|mois)/)) {
        const matches = lowerSentence.match(/(\d+)\s+(heure|minute|jour|semaine|mois)/);
        if (matches) {
            return `Après ${matches[1]} ${matches[2]}${matches[1] > 1 ? 's' : ''}`;
        }
    }
    
    // Par défaut
    return 'Attente';
}

/**
 * Extrait le nom d'un événement message
 * @param {string} sentence - Phrase mentionnant l'événement
 * @return {string} - Nom de l'événement
 */
function extractMessageEventName(sentence) {
    const lowerSentence = sentence.toLowerCase();
    
    // Types de messages communs
    if (lowerSentence.includes('facture')) return 'Facture';
    if (lowerSentence.includes('confirmation')) return 'Confirmation';
    if (lowerSentence.includes('commande')) return 'Commande';
    if (lowerSentence.includes('avis')) return 'Avis';
    if (lowerSentence.includes('notification')) return 'Notification';
    if (lowerSentence.includes('demande')) return 'Demande';
    if (lowerSentence.includes('réponse')) return 'Réponse';
    if (lowerSentence.includes('rapport')) return 'Rapport';
    if (lowerSentence.includes('verdict')) return 'Verdict';
    
    // Par défaut
    return 'Message';
}

/**
 * Détermine le couloir pour un événement de fin
 * @param {Object} event - Événement de fin
 * @param {Object[]} lanes - Couloirs du processus
 * @return {string} - Nom du couloir
 */
function determineEndEventLane(event, lanes) {
    if (event.name.includes('approuvé') || event.name.includes('payée')) {
        // Si l'événement concerne une approbation ou un paiement
        const approverLanes = lanes.filter(lane => 
            lane.name === 'Préposé aux comptes' || 
            lane.name === 'Comptabilité'
        );
        
        if (approverLanes.length > 0) {
            return approverLanes[0].name;
        }
    }
    
    if (event.name.includes('refusé') || event.name.includes('rejetée') || event.name.includes('annulée')) {
        // Si l'événement concerne un refus
        const deciderLanes = lanes.filter(lane => 
            lane.name === 'Gestionnaire' || 
            lane.name === 'Superviseur'
        );
        
        if (deciderLanes.length > 0) {
            return deciderLanes[0].name;
        }
    }
    
    if (event.name.includes('livrée') || event.name.includes('livraison') || event.name.includes('expédiée')) {
        // Si l'événement concerne une livraison
        const deliveryLanes = lanes.filter(lane => 
            lane.name === 'Entrepôt' || 
            lane.name === 'Service livraison'
        );
        
        if (deliveryLanes.length > 0) {
            return deliveryLanes[0].name;
        }
    }
    
    // Par défaut, utiliser le premier couloir
    return lanes[0].name;
}

/**
 * Détermine le couloir pour un événement intermédiaire
 * @param {Object} event - Événement intermédiaire
 * @param {Object[]} lanes - Couloirs du processus
 * @return {string} - Nom du couloir
 */
function determineIntermediateEventLane(event, lanes) {
    if (event.type.includes('minuterie') && event.name.includes('matin')) {
        // Si c'est une minuterie pour le matin
        const managerLanes = lanes.filter(lane => 
            lane.name === 'Gestionnaire' || 
            lane.name === 'Superviseur'
        );
        
        if (managerLanes.length > 0) {
            return managerLanes[0].name;
        }
    }
    
    if (event.type.includes('message') && event.isEmission) {
        // Si c'est une émission de message
        const senderLanes = lanes.filter(lane => 
            lane.name === 'Préposé aux comptes' || 
            lane.name === 'Agent' ||
            lane.name === 'Agent aux soumissions'
        );
        
        if (senderLanes.length > 0) {
            return senderLanes[0].name;
        }
    }
    
    if (event.type.includes('message') && !event.isEmission) {
        // Si c'est une réception de message
        const receiverLanes = lanes.filter(lane => 
            lane.name === 'Préposé aux comptes' || 
            lane.name === 'Agent' ||
            lane.name === 'Agent aux soumissions'
        );
        
        if (receiverLanes.length > 0) {
            return receiverLanes[0].name;
        }
    }
    
    // Par défaut, utiliser le premier couloir
    return lanes[0].name;
}

/**
 * Trouve l'activité la plus proche d'une position donnée
 * @param {Object[]} activities - Activités
 * @param {number} position - Position à comparer
 * @return {Object} - Activité la plus proche
 */
function findNearestActivityByPosition(activities, position) {
    let nearestActivity = null;
    let minDistance = Infinity;
    
    activities.forEach(activity => {
        const distance = Math.abs(activity.position - position);
        if (distance < minDistance) {
            minDistance = distance;
            nearestActivity = activity;
        }
    });
    
    return nearestActivity;
}

/**
 * Trouve les activités liées à un objet de données
 * @param {Object} dataObject - Objet de données
 * @param {Object[]} activities - Activités
 * @return {Object[]} - Activités liées
 */
function findRelatedActivities(dataObject, activities) {
    const relatedActivities = [];
    
    // Rechercher les activités proches de la position de l'objet de données
    activities.forEach(activity => {
        const positionDistance = Math.abs(activity.position - dataObject.position);
        
        // Considérer les activités proches et qui interagissent avec des données
        if (positionDistance <= 2 && activity.hasDataInteraction) {
            relatedActivities.push(activity);
        }
    });
    
    // Si aucune activité n'a été trouvée, prendre la plus proche
    if (relatedActivities.length === 0) {
        const nearestActivity = findNearestActivityByPosition(activities, dataObject.position);
        if (nearestActivity) {
            relatedActivities.push(nearestActivity);
        }
    }
    
    return relatedActivities;
}

/**
 * Trouve une passerelle entre deux positions
 * @param {Object[]} gateways - Passerelles
 * @param {number} startPos - Position de départ
 * @param {number} endPos - Position d'arrivée
 * @return {Object} - Passerelle trouvée ou null
 */
function findGatewayBetween(gateways, startPos, endPos) {
    return gateways.find(gateway => 
        gateway.position > startPos && gateway.position < endPos
    );
}

/**
 * Trouve une activité par sa description
 * @param {Object[]} activities - Activités
 * @param {string} description - Description à rechercher
 * @return {Object} - Activité trouvée ou null
 */
function findActivityByDescription(activities, description) {
    if (!description) return null;
    
    // Rechercher des mots-clés de l'activité dans la description
    return activities.find(activity => {
        const keywords = activity.name.toLowerCase().split(' ').filter(word => word.length > 3);
        return keywords.some(keyword => description.toLowerCase().includes(keyword));
    });
}

/**
 * Trouve l'événement de fin le plus pertinent pour une activité
 * @param {Object} activity - Activité
 * @param {Object[]} endEvents - Événements de fin
 * @param {string} text - Texte du scénario
 * @return {Object} - Événement de fin pertinent
 */
function findMostRelevantEndEvent(activity, endEvents, text) {
    // Si un seul événement de fin, l'utiliser
    if (endEvents.length === 1) {
        return endEvents[0];
    }
    
    // Rechercher des indices contextuels
    const activityContext = text.substring(Math.max(0, text.indexOf(activity.name) - 50), 
                                         Math.min(text.length, text.indexOf(activity.name) + activity.name.length + 100));
    
    // Chercher des mots-clés de fin spécifiques
    if (activityContext.includes('approuv') && endEvents.some(e => e.name.includes('approuvé'))) {
        return endEvents.find(e => e.name.includes('approuvé'));
    }
    
    if ((activityContext.includes('refus') || activityContext.includes('rejet')) && 
        endEvents.some(e => e.name.includes('refusé') || e.name.includes('rejeté'))) {
        return endEvents.find(e => e.name.includes('refusé') || e.name.includes('rejeté'));
    }
    
    if (activityContext.includes('livrai') && endEvents.some(e => e.name.includes('livré'))) {
        return endEvents.find(e => e.name.includes('livré'));
    }
    
    if (activityContext.includes('annul') && endEvents.some(e => e.name.includes('annulé'))) {
        return endEvents.find(e => e.name.includes('annulé'));
    }
    
    // Par défaut, utiliser le premier événement de fin
    return endEvents[0];
}

/**
 * Infère l'acteur externe pour un événement message
 * @param {Object} messageEvent - Événement message
 * @param {string} text - Texte du scénario
 * @return {string} - Acteur externe
 */
function inferExternalActorForMessageEvent(messageEvent, text) {
    const messageContext = text.substring(Math.max(0, text.indexOf(messageEvent.name) - 100), 
                                        Math.min(text.length, text.indexOf(messageEvent.name) + messageEvent.name.length + 100));
    
    // Acteurs externes communs
    const externalActors = [
        {name: 'Client', keywords: ['client', 'acheteur', 'consommateur']},
        {name: 'Employé', keywords: ['employé', 'salarié', 'travailleur']},
        {name: 'Fournisseur', keywords: ['fournisseur', 'prestataire', 'vendeur']},
        {name: 'Institution financière', keywords: ['banque', 'institution financière']}
    ];
    
    for (const actor of externalActors) {
        if (actor.keywords.some(keyword => messageContext.toLowerCase().includes(keyword))) {
            return actor.name;
        }
    }
    
    // Par défaut, utiliser "Client"
    return 'Client';
}

/**
 * Trouve un élément par son ID dans la structure du processus
 * @param {string} id - ID de l'élément
 * @param {Object} structure - Structure du processus
 * @return {Object} - Élément trouvé ou null
 */
function findElementById(id, structure) {
    if (id.startsWith('a')) {
        return structure.activities.find(a => a.id === id);
    } else if (id.startsWith('g')) {
        return structure.gateways.find(g => g.id === id);
    } else if (id.startsWith('e') || id.startsWith('start') || id.startsWith('end')) {
        return structure.events.find(e => e.id === id);
    }
    
    return null;
}

/**
 * Met en majuscule la première lettre d'une chaîne
 * @param {string} str - Chaîne à modifier
 * @return {string} - Chaîne avec la première lettre en majuscule
 */
function capitalizeFirstLetter(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}
