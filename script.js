document.addEventListener('DOMContentLoaded', function() {
    const generateBtn = document.getElementById('generate-btn');
    const refineBtn = document.getElementById('refine-btn');
    const scenario = document.getElementById('scenario');
    const output = document.getElementById('output');
    const elementSection = document.getElementById('element-section');
    const elementList = document.getElementById('element-list');
    const updateDescriptionBtn = document.getElementById('update-description-btn');
    
    let currentStructure = null;
    
    // Génération de la description BPMN
    generateBtn.addEventListener('click', function() {
        const scenarioText = scenario.value.trim();
        if (!scenarioText) {
            output.textContent = 'Veuillez entrer une description du processus d\'affaires.';
            return;
        }
        
        try {
            const description = generateBPMNDescription(scenarioText);
            output.textContent = description;
            refineBtn.disabled = false;
        } catch (error) {
            console.error('Erreur lors de la génération:', error);
            output.textContent = 'Une erreur est survenue lors de la génération. Veuillez réessayer.';
        }
    });
    
    // Affiner la description
    refineBtn.addEventListener('click', function() {
        if (!currentStructure) return;
        
        // Afficher la section d'éléments
        elementSection.style.display = 'block';
        elementList.innerHTML = '';
        
        // Créer des options de position pour chaque élément
        populateElementList(currentStructure);
        
        // Faire défiler vers la section
        elementSection.scrollIntoView({ behavior: 'smooth' });
    });
    
    // Mettre à jour la description
    updateDescriptionBtn.addEventListener('click', function() {
        if (!currentStructure) return;
        
        // Mettre à jour les positions des éléments
        updateElementPositions(currentStructure);
        
        // Générer une nouvelle description
        const updatedDescription = formatBPMNDescription(currentStructure);
        output.textContent = updatedDescription;
        
        // Masquer la section d'éléments
        elementSection.style.display = 'none';
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
    
    // Stockage de la structure pour utilisation ultérieure
    currentStructure = processStructure;
    
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
 * Divise un texte en phrases
 * @param {string} text - Texte à diviser
 * @return {string[]} - Tableau de phrases
 */
function splitIntoSentences(text) {
    return text
        .replace(/([.!?])[ \t]+(?=[A-Z])/g, "$1|")
        .split("|")
        .map(s => s.trim())
        .filter(s => s.length > 0);
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
        activities: extractActivities(sentences, processedText),
        decisions: extractDecisions(sentences, processedText),
        dataObjects: extractDataObjects(sentences, processedText),
        events: extractEvents(sentences, processedText)
    };
    
    return components;
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
        {name: 'directeur', pattern: /directeur|direction/i, isInternal: true},
        {name: 'pharmacien', pattern: /pharmacien|chimiste/i, isInternal: false},
        {name: 'usine', pattern: /usine|fabrique|manufacture/i, isInternal: false},
        {name: 'contrôle qualité', pattern: /contrôle\s+qualité|assurance\s+qualité|qualité/i, isInternal: true},
        {name: 'développeur', pattern: /développeur|programmeur|codeur/i, isInternal: true},
        {name: 'chef d\'équipe', pattern: /chef\s+d['']équipe|team\s+lead/i, isInternal: true},
        {name: 'vendeur', pattern: /vendeur|représentant\s+des\s+ventes/i, isInternal: true},
        {name: 'représentant du service à la clientèle', pattern: /représentant\s+du\s+service\s+à\s+la\s+clientèle|service\s+client/i, isInternal: true}
    ];
    
    // Détecter les acteurs dans le texte
    potentialActors.forEach(potentialActor => {
        if (text.match(potentialActor.pattern)) {
            // Rechercher les activités liées à cet acteur
            const hasActivities = sentences.some(sentence => 
                sentence.match(potentialActor.pattern) && 
                /\b(vérifie|crée|saisit|envoie|reçoit|traite|analyse|approuve|rejette|valide)\b/i.test(sentence)
            );
            
            actors.push({
                name: capitalizeFirstLetter(potentialActor.name),
                pattern: potentialActor.pattern,
                isInternal: potentialActor.isInternal,
                hasActivities: hasActivities
            });
        }
    });

    // Affiner la détection des acteurs internes/externes
    actors.forEach(actor => {
        // Si l'acteur est mentionné comme externe, le marquer comme tel
        if (sentences.some(s => 
            actor.pattern.test(s) && 
            (s.includes('externe') || s.includes('partenaire')))) {
            actor.isInternal = false;
        }
        
        // Si l'acteur est mentionné comme interne, le marquer comme tel
        if (sentences.some(s => 
            actor.pattern.test(s) && 
            (s.includes('interne') || s.includes('de l\'entreprise') || 
             s.includes('de la société') || s.includes('employé')))) {
            actor.isInternal = true;
        }
    });
    
    // S'assurer qu'il y a au moins un acteur interne et un acteur externe
    if (!actors.some(a => a.isInternal)) {
        actors.push({
            name: 'Système',
            pattern: /système/i,
            isInternal: true,
            hasActivities: true
        });
    }
    
    if (!actors.some(a => !a.isInternal)) {
        actors.push({
            name: 'Client',
            pattern: /client/i,
            isInternal: false,
            hasActivities: false
        });
    }
    
    return actors;
}

/**
 * Extrait les activités du processus
 * @param {string[]} sentences - Phrases du scénario
 * @param {string} fullText - Texte complet du scénario
 * @return {Object[]} - Activités identifiées
 */
function extractActivities(sentences, fullText) {
    const activities = [];
    
    // Mots-clés pour identifier les activités
    const actionKeywords = [
        'vérifie', 'crée', 'saisit', 'envoie', 'reçoit', 'traite', 'analyse', 
        'approuve', 'rejette', 'transfère', 'communique', 'consulte', 'valide',
        'prépare', 'génère', 'imprime', 'enregistre', 'classe', 'stocke',
        'expédie', 'livre', 'exécute', 'calcule', 'compare', 'examine',
        'programme', 'rédige', 'documente', 'teste', 'identifie', 'évalue',
        'autorise', 'informe', 'présente', 'collecte', 'transmet', 'instancie'
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
            const responsibleActor = identifyActorForActivity(sentence, fullText);
            
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
                                   sentence.includes('rapport') ||
                                   sentence.includes('fichier') ||
                                   sentence.includes('formulaire')
            });
        }
    });
    
    return activities;
}

/**
 * Vérifie si une phrase est une phrase de transition/connexion
 * @param {string} sentence - Phrase à vérifier
 * @return {boolean} - Vrai si c'est une phrase de connexion
 */
function isConnectorSentence(sentence) {
    const connectorPhrases = [
        'ensuite', 'puis', 'après', 'finalement', 'enfin', 'donc', 'ainsi', 
        'par conséquent', 'cependant', 'néanmoins', 'toutefois', 'mais',
        'en effet', 'de plus', 'en outre', 'également', 'notamment',
        'par ailleurs', 'en revanche', 'à cet égard', 'à ce propos'
    ];
    
    const lowerSentence = sentence.toLowerCase();
    return connectorPhrases.some(phrase => lowerSentence.startsWith(phrase)) ||
           lowerSentence.length < 15; // Phrases très courtes sont souvent des transitions
}

/**
 * Identifie l'acteur responsable d'une activité
 * @param {string} sentence - Phrase décrivant l'activité
 * @param {string} fullText - Texte complet pour le contexte
 * @return {string} - Nom de l'acteur
 */
function identifyActorForActivity(sentence, fullText) {
    const actorKeywords = {
        'préposé aux comptes': ['préposé aux comptes', 'préposé', 'comptable'],
        'gestionnaire': ['gestionnaire', 'manager', 'responsable'],
        'employé': ['employé', 'salarié', 'travailleur'],
        'système': ['système', 'application', 'logiciel', 'automatiquement'],
        'client': ['client', 'acheteur', 'consommateur'],
        'agent': ['agent', 'représentant'],
        'superviseur': ['superviseur', 'chef d\'équipe'],
        'agent technique': ['agent technique', 'technicien'],
        'comptabilité': ['comptabilité'],
        'service livraison': ['service livraison', 'livreur'],
        'entrepôt': ['entrepôt', 'magasin', 'stockage'],
        'représentant du service à la clientèle': ['représentant du service à la clientèle', 'service client'],
        'développeur': ['développeur', 'programmeur', 'codeur'],
        'contrôle qualité': ['contrôle qualité', 'assurance qualité', 'qualité'],
        'pharmacien': ['pharmacien', 'chimiste']
    };
    
    // Rechercher les mentions explicites d'acteurs dans la phrase
    for (const [actor, keywords] of Object.entries(actorKeywords)) {
        for (const keyword of keywords) {
            if (sentence.toLowerCase().includes(keyword.toLowerCase())) {
                return capitalizeFirstLetter(actor);
            }
        }
    }
    
    // Si aucun acteur n'est mentionné dans la phrase, analyser le contexte
    const sentenceIndex = fullText.indexOf(sentence);
    const contextBefore = fullText.substring(Math.max(0, sentenceIndex - 200), sentenceIndex);
    
    // Chercher l'acteur mentionné le plus récemment dans le contexte
    for (const [actor, keywords] of Object.entries(actorKeywords)) {
        for (const keyword of keywords) {
            if (contextBefore.toLowerCase().includes(keyword.toLowerCase())) {
                return capitalizeFirstLetter(actor);
            }
        }
    }
    
    // Acteur par défaut si aucun n'est identifié
    return 'Système';
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
        lowerSentence.includes('est généré par') ||
        lowerSentence.includes('le système calcule') ||
        lowerSentence.includes('est calculé par') ||
        lowerSentence.includes('le système imprime') ||
        lowerSentence.includes('le système envoie') ||
        lowerSentence.includes('le système valide') ||
        lowerSentence.includes('le système exécute')) {
        return 'service';
    }
    
    // Manuelle (sans système)
    if (lowerSentence.includes('manuellement') || 
        lowerSentence.includes('papier') ||
        lowerSentence.includes('physiquement') ||
        lowerSentence.includes('classe') && lowerSentence.includes('document') ||
        lowerSentence.includes('classe') && lowerSentence.includes('dossier') ||
        lowerSentence.includes('imprime') && !lowerSentence.includes('système') ||
        (lowerSentence.includes('photocopie') && !lowerSentence.includes('système'))) {
        return 'manuelle';
    }
    
    // Utilisateur (interaction humain-système)
    if (lowerSentence.includes('saisit dans') || 
        lowerSentence.includes('consulte le système') ||
        lowerSentence.includes('entre les données') ||
        lowerSentence.includes('entre dans le système') ||
        lowerSentence.includes('utilise le système') ||
        lowerSentence.includes('met à jour') && 
        (lowerSentence.includes('système') || lowerSentence.includes('base de données'))) {
        return 'utilisateur';
    }
    
    // Par défaut: détecter d'après le contexte
    if (lowerSentence.includes('système') || lowerSentence.includes('logiciel') || 
        lowerSentence.includes('application') || lowerSentence.includes('base de données') ||
        lowerSentence.includes('pgi') || lowerSentence.includes('erp') ||
        lowerSentence.includes('dans le si')) {
        return 'utilisateur';
    }
    
    return 'manuelle';
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
        'expédie', 'livre', 'exécute', 'calcule', 'compare', 'examine',
        'programme', 'rédige', 'documente', 'teste', 'identifie', 'évalue',
        'autorise', 'informe', 'présente', 'collecte', 'transmet', 'instancie'
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
        'examine': 'Examiner',
        'programme': 'Programmer',
        'rédige': 'Rédiger',
        'documente': 'Documenter',
        'teste': 'Tester',
        'identifie': 'Identifier',
        'évalue': 'Évaluer',
        'autorise': 'Autoriser',
        'informe': 'Informer',
        'présente': 'Présenter',
        'collecte': 'Collecter',
        'transmet': 'Transmettre',
        'instancie': 'Instancier'
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
        let afterVerb = sentence.substring(actionIndex + actionVerb.length);
        
        // Nettoyer l'objet de l'action
        afterVerb = afterVerb.split(/[,.;:]/, 1)[0].trim();
        afterVerb = afterVerb.replace(/^(si|le|la|les|du|de la|des|au|aux|à|pour|dans|en|par|sur|sous|avec)\s+/, '');
        
        // Limiter la longueur de l'objet pour un nom concis
        if (afterVerb.length > 30) {
            afterVerb = afterVerb.substring(0, 27) + '...';
        }
        
        // Construire le nom de l'activité
        return verbMapping[actionVerb] + ' ' + afterVerb;
    }
    
    // Fallback: utiliser la première partie de la phrase
    let name = sentence;
    if (name.length > 40) {
        name = name.substring(0, 37) + '...';
    }
    
    return capitalizeFirstLetter(name);
}

/**
 * Extrait les décisions/conditions du processus
 * @param {string[]} sentences - Phrases du scénario
 * @param {string} fullText - Texte complet pour le contexte
 * @return {Object[]} - Décisions identifiées
 */
function extractDecisions(sentences, fullText) {
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
                    actor: identifyActorForDecision(sentence, fullText)
                });
            }
        }
    });
    
    return decisions;
}

/**
 * Identifie l'acteur responsable d'une décision
 * @param {string} sentence - Phrase décrivant la décision
 * @param {string} fullText - Texte complet pour le contexte
 * @return {string} - Nom de l'acteur
 */
function identifyActorForDecision(sentence, fullText) {
    return identifyActorForActivity(sentence, fullText); // Même logique
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
    if (condition.match(/montant\s+(est\s+)?(de|égal à)?\s*\d+\$?\s*ou\s+moins/i)) {
        const montant = condition.match(/\d+/)[0];
        return `Montant ≤ ${montant}$ ?`;
    }
    
    if (condition.match(/montant\s+(est\s+)?(supérieur|plus grand|plus élevé)(\s+à|\s+que)?\s*\d+\$?/i)) {
        const montant = condition.match(/\d+/)[0];
        return `Montant > ${montant}$ ?`;
    }
    
    if (condition.match(/employé\s+(existe|n['']existe\s+pas)/i)) {
        return `L'employé existe ?`;
    }
    
    if (condition.match(/client\s+(existe|n['']existe\s+pas)/i)) {
        return `Client existe ?`;
    }
    
    if (condition.match(/pharmacien\s+(existe|n['']existe\s+pas)/i)) {
        return `Pharmacien existe ?`;
    }
    
    if (condition.match(/approuve\s+le\s+rapport|rapport\s+.+\s+n['']est\s+pas\s+approuvé/i)) {
        return `Rapport approuvé ?`;
    }
    
    if (condition.match(/crédit\s+(est\s+)?(acceptable|bon|valide|approuvé)/i)) {
        return `Crédit acceptable ?`;
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
        const nextSentence = sentences[position + 1];
        
        // Éviter les phrases qui contiennent "sinon" ou "si ... ne pas"
        if (!nextSentence.toLowerCase().includes('sinon') && 
            !nextSentence.toLowerCase().match(/si.+ne\s+pas/)) {
            return nextSentence.trim();
        }
    }
    
    // Si la phrase suivante n'est pas pertinente, chercher plus loin
    if (position < sentences.length - 2) {
        const secondNextSentence = sentences[position + 2];
        return secondNextSentence.trim();
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
    for (let i = position + 1; i < Math.min(position + 5, sentences.length); i++) {
        const nextSentence = sentences[i].toLowerCase();
        
        if (nextSentence.includes('sinon') || 
            nextSentence.startsWith('si') && nextSentence.includes('n\'est pas') || 
            nextSentence.startsWith('si') && nextSentence.includes('ne pas')) {
            return sentences[i].trim();
        }
    }
    
    // Rechercher des phrases avec "si... ne... pas"
    for (let i = position + 1; i < Math.min(position + 5, sentences.length); i++) {
        if (sentences[i].toLowerCase().includes('n\'est pas') || 
            sentences[i].toLowerCase().includes('ne pas') ||
            sentences[i].toLowerCase().includes('non')) {
            return sentences[i].trim();
        }
    }
    
    return '';
}

/**
 * Extrait les objets de données mentionnés dans le processus
 * @param {string[]} sentences - Phrases du scénario
 * @param {string} fullText - Texte complet pour le contexte
 * @return {Object[]} - Objets de données identifiés
 */
function extractDataObjects(sentences, fullText) {
    const dataObjects = [];
    
    // Mots-clés plus complets
    const dataKeywords = {
        'magasin': [
            'base de données', 'système', 'système d\'information', 
            'logiciel', 'application', 'dossier', 'filière', 'classeur',
            'répertoire', 'entrepôt de données', 'archive', 'registre',
            'pgi', 'erp', 'sgbd'
        ],
        'objet': [
            'document', 'rapport', 'formulaire', 'fichier', 'facture', 
            'bon de commande', 'bon de livraison', 'courriel', 'message', 
            'avis', 'notification', 'liste', 'reçu', 'confirmation',
            'contrat', 'lettre', 'mémo', 'bordereau', 'devis', 'requête'
        ]
    };
    
    // Traiter chaque phrase
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

/**
 * Détermine le mode d'accès à un objet de données
 * @param {string} sentence - Phrase mentionnant l'objet
 * @return {string} - Mode d'accès (lecture, création, mise à jour)
 */
function determineDataAccessMode(sentence) {
    const lowerSentence = sentence.toLowerCase();
    
    // Mots-clés pour la création
    if (lowerSentence.includes('crée') || 
        lowerSentence.includes('génère') || 
        lowerSentence.includes('produit') || 
        lowerSentence.includes('rédige') ||
        lowerSentence.includes('élabore') ||
        lowerSentence.includes('établit') ||
        lowerSentence.includes('prépare') ||
        lowerSentence.includes('initialise')) {
        return 'création';
    }
    
    // Mots-clés pour la mise à jour
    if (lowerSentence.includes('met à jour') || 
        lowerSentence.includes('modifie') || 
        lowerSentence.includes('actualise') ||
        lowerSentence.includes('complète') ||
        lowerSentence.includes('révise') ||
        lowerSentence.includes('édite')) {
        return 'mise à jour';
    }
    
    // Mots-clés pour la lecture
    if (lowerSentence.includes('consulte') || 
        lowerSentence.includes('vérifie') || 
        lowerSentence.includes('lit') ||
        lowerSentence.includes('regarde') ||
        lowerSentence.includes('observe') ||
        lowerSentence.includes('recherche dans') ||
        lowerSentence.includes('identifie dans')) {
        return 'lecture';
    }
    
    return 'indéterminé';
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
    
    if (keyword === 'base de données' && lowerSentence.includes('client')) {
        return 'Clients';
    }
    
    if (keyword === 'système' && lowerSentence.includes('information')) {
        return 'Système d\'information';
    }
    
    if (keyword === 'pgi' || keyword === 'erp') {
        return 'PGI';
    }
    
    if (keyword === 'filière' && lowerSentence.includes('commande')) {
        return 'Filière des commandes';
    }
    
    if (keyword === 'dossier' && lowerSentence.includes('livraison')) {
        return 'Dossier des livraisons';
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
    
    if (keyword === 'facture') {
        return 'Facture';
    }
    
    if (keyword === 'document' && lowerSentence.includes('technique')) {
        return 'Document technique';
    }
    
    // Par défaut
    return capitalizeFirstLetter(keyword);
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
        name: inferStartEventName(sentences[0], fullText),
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
                name: inferEndEventName(sentence, fullText),
                position: index
            });
        }
    });
    
    // Rechercher les événements intermédiaires (minuterie, message)
    sentences.forEach((sentence, index) => {
        // Minuteries
        if (sentence.includes('mardi matin') || 
            sentence.includes('le lendemain') || 
            sentence.includes('chaque matin') ||
            sentence.includes('tous les matins') ||
            sentence.includes('le matin') ||
            sentence.match(/\ble\s+(?:lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\s+matin\b/i) ||
            sentence.match(/\bvers\s+\d+h/i) ||
            sentence.match(/\bà\s+\d+h/i)) {
            
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
 * Infère le nom de l'événement de début à partir du contexte
 * @param {string} firstSentence - Première phrase du scénario
 * @param {string} fullText - Texte complet du scénario
 * @return {string} - Nom de l'événement de début
 */
function inferStartEventName(firstSentence, fullText) {
    const lowerSentence = firstSentence.toLowerCase();
    
    // Cas spécifiques
    if (lowerSentence.includes('rapport de dépenses')) {
        return 'Rapport de dépenses';
    }
    
    if (lowerSentence.includes('commande')) {
        return 'Commande';
    }
    
    if (lowerSentence.includes('demande')) {
        return 'Demande';
    }
    
    if (lowerSentence.includes('facture')) {
        return 'Facture';
    }
    
    // Extraire un objet du début
    const objects = ['rapport', 'demande', 'commande', 'requête', 'document', 'formulaire'];
    for (const obj of objects) {
        if (lowerSentence.includes(obj)) {
            return capitalizeFirstLetter(obj);
        }
    }
    
    // Par défaut
    return 'Début du processus';
}

/**
 * Infère le nom de l'événement de fin à partir du contexte
 * @param {string} sentence - Phrase contenant la fin
 * @param {string} fullText - Texte complet du scénario
 * @return {string} - Nom de l'événement de fin
 */
function inferEndEventName(sentence, fullText) {
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
    
    if (lowerSentence.includes('complétée') || lowerSentence.includes('terminée')) {
        return 'Commande complétée';
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
    if (lowerSentence.includes('lundi matin')) return 'Lundi matin';
    if (lowerSentence.includes('mardi matin')) return 'Mardi matin';
    if (lowerSentence.includes('mercredi matin')) return 'Mercredi matin';
    if (lowerSentence.includes('jeudi matin')) return 'Jeudi matin';
    if (lowerSentence.includes('vendredi matin')) return 'Vendredi matin';
    if (lowerSentence.includes('samedi matin')) return 'Samedi matin';
    if (lowerSentence.includes('dimanche matin')) return 'Dimanche matin';
    
    // Jours génériques
    if (lowerSentence.includes('lundi')) return 'Lundi';
    if (lowerSentence.includes('mardi')) return 'Mardi';
    if (lowerSentence.includes('mercredi')) return 'Mercredi';
    if (lowerSentence.includes('jeudi')) return 'Jeudi';
    if (lowerSentence.includes('vendredi')) return 'Vendredi';
    if (lowerSentence.includes('samedi')) return 'Samedi';
    if (lowerSentence.includes('dimanche')) return 'Dimanche';
    
    // Moments spécifiques
    if (lowerSentence.includes('le matin') || lowerSentence.includes('chaque matin') || 
        lowerSentence.includes('tous les matins')) return 'Le matin';
    if (lowerSentence.includes('soir')) return 'Le soir';
    if (lowerSentence.includes('lendemain')) return 'Le lendemain';
    
    // Heures spécifiques
    const heureMatch = lowerSentence.match(/vers\s+(\d+)h/);
    if (heureMatch) {
        return `À ${heureMatch[1]}h`;
    }
    
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
    if (lowerSentence.includes('paiement')) return 'Paiement';
    if (lowerSentence.includes('marchandise')) return 'Marchandise';
    
    // Par défaut
    return 'Message';
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
        processStructure.dataObjects,
        text
    );
    
    // Nommer le processus principal en fonction du contexte
    processStructure.mainProcess = identifyProcessName(text, components);
    
    return processStructure;
}

/**
 * Organise les acteurs en couloirs (lanes)
 * @param {Object[]} actors - Acteurs identifiés
 * @return {Object[]} - Couloirs organisés
 */
function organizeActorsIntoLanes(actors) {
    const lanes = [];
    const externalActors = [];
    
    // Filtrer pour ne garder que les acteurs internes avec des activités
    const internalActors = actors.filter(actor => actor.isInternal);
    
    // Ajouter les acteurs internes comme couloirs
    if (internalActors.length === 0) {
        // Si aucun acteur interne n'a été identifié, créer un couloir système par défaut
        lanes.push({
            name: 'Système',
            isDefault: true
        });
    } else {
        internalActors.forEach(actor => {
            lanes.push({
                name: actor.name,
                isDefault: false
            });
        });
    }
    
    // Identifier les acteurs externes
    actors.filter(actor => !actor.isInternal).forEach(actor => {
        externalActors.push({
            name: actor.name
        });
    });
    
    return {
        internal: lanes,
        externalActors: externalActors
    };
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
 * @param {Object} lanes - Couloirs du processus
 * @return {Object[]} - Activités préparées
 */
function prepareActivities(activities, lanes) {
    const preparedActivities = [];
    
    activities.forEach(activity => {
        // Déterminer le couloir approprié pour l'activité
        let laneName = activity.actor;
        
        // Vérifier si le couloir existe
        if (!lanes.internal.some(lane => lane.name === laneName)) {
            // Utiliser le premier couloir disponible comme fallback
            laneName = lanes.internal[0].name;
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
 * Détermine le couloir pour une passerelle
 * @param {Object} decision - Décision
 * @param {Object[]} activities - Activités
 * @return {string} - Nom du couloir
 */
function determineGatewayLane(decision, activities) {
    // Trouver l'activité la plus proche de la décision
    let closestActivity = null;
    let minDistance = Infinity;
    
    activities.forEach(activity => {
        const distance = Math.abs(activity.position - decision.position);
        if (distance < minDistance) {
            minDistance = distance;
            closestActivity = activity;
        }
    });
    
    // Utiliser le couloir de l'activité la plus proche
    return closestActivity ? closestActivity.lane : activities[0].lane;
}

/**
 * Prépare les événements avec leurs attributs pour la génération du BPMN
 * @param {Object[]} events - Événements bruts
 * @param {Object} lanes - Couloirs du processus
 * @return {Object[]} - Événements préparés
 */
function prepareEvents(events, lanes) {
    const preparedEvents = [];
    
    events.forEach(event => {
        // Déterminer le couloir approprié pour l'événement
        let laneName;
        
        if (event.type === 'début') {
            // Premier événement va dans le premier couloir
            laneName = lanes.internal[0].name;
        } else if (event.type === 'fin') {
            // Événements de fin dans le dernier couloir impliqué
            laneName = lanes.internal[lanes.internal.length - 1].name;
        } else {
            // Événements intermédiaires dans le couloir approprié
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
 * Détermine le couloir pour un événement intermédiaire
 * @param {Object} event - Événement intermédiaire
 * @param {Object} lanes - Couloirs du processus
 * @return {string} - Nom du couloir
 */
function determineIntermediateEventLane(event, lanes) {
    if (event.type.includes('minuterie')) {
        // Pour les minuteries, utiliser un couloir approprié en fonction du contexte
        if (event.name.includes('matin')) {
            const processingLanes = lanes.internal.filter(lane => 
                lane.name.includes('Entrepôt') || 
                lane.name.includes('Préposé') ||
                lane.name.includes('Service')
            );
            if (processingLanes.length > 0) {
                return processingLanes[0].name;
            }
        }
    }
    
    if (event.type.includes('message')) {
        // Pour les messages, utiliser le couloir approprié en fonction du contexte
        if (event.isEmission) {
            const communicationLanes = lanes.internal.filter(lane => 
                lane.name.includes('Service') || 
                lane.name.includes('Agent') ||
                lane.name.includes('Vendeur') ||
                lane.name.includes('Représentant')
            );
            if (communicationLanes.length > 0) {
                return communicationLanes[0].name;
            }
        } else {
            const receptionLanes = lanes.internal.filter(lane => 
                lane.name.includes('Service') || 
                lane.name.includes('Agent') ||
                lane.name.includes('Comptabilité')
            );
            if (receptionLanes.length > 0) {
                return receptionLanes[0].name;
            }
        }
    }
    
    // Par défaut, premier couloir
    return lanes.internal[0].name;
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
            accessMode: dataObject.accessMode,
            associatedActivities: relatedActivities.map(act => act.id)
        });
    });
    
    return preparedDataObjects;
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
    
    // Si aucune activité n'a été trouvée, prendre la plus proche avec interaction de données
    if (relatedActivities.length === 0) {
        const dataActivities = activities.filter(a => a.hasDataInteraction);
        if (dataActivities.length > 0) {
            let nearestActivity = null;
            let minDistance = Infinity;
            
            dataActivities.forEach(activity => {
                const distance = Math.abs(activity.position - dataObject.position);
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestActivity = activity;
                }
            });
            
            if (nearestActivity) {
                relatedActivities.push(nearestActivity);
            }
        }
    }
    
    return relatedActivities;
}

/**
 * Établit les flux entre les composants du processus
 * @param {Object[]} activities - Activités préparées
 * @param {Object[]} gateways - Passerelles préparées
 * @param {Object[]} events - Événements préparés
 * @param {Object[]} dataObjects - Objets de données préparés
 * @param {string} text - Texte du scénario
 * @return {Object[]} - Flux établis
 */
function establishFlows(activities, gateways, events, dataObjects, text) {
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
        
        // Vérifier s'il y a une passerelle ou un événement intermédiaire entre ces deux activités
        const gatewayBetween = findGatewayBetween(gateways, currentActivity.position, nextActivity.position);
        const eventBetween = findEventBetween(events, currentActivity.position, nextActivity.position);
        
        if (!gatewayBetween && !eventBetween) {
            flows.push({
                id: 'f' + (flows.length + 1),
                type: 'sequence',
                from: currentActivity.id,
                to: nextActivity.id,
                condition: ''
            });
        } else if (gatewayBetween) {
            // Connecter l'activité à la passerelle
            flows.push({
                id: 'f' + (flows.length + 1),
                type: 'sequence',
                from: currentActivity.id,
                to: gatewayBetween.id,
                condition: ''
            });
            
            // Si c'est une passerelle de bifurcation, connecter aux cibles appropriées
            if (gatewayBetween.isBifurcation) {
                const positiveTarget = findActivityForOutcome(activities, gatewayBetween.positiveOutcome);
                const negativeTarget = findActivityForOutcome(activities, gatewayBetween.negativeOutcome);
                
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
            } else {
                // Si c'est une passerelle de convergence, connecter à l'activité suivante
                flows.push({
                    id: 'f' + (flows.length + 1),
                    type: 'sequence',
                    from: gatewayBetween.id,
                    to: nextActivity.id,
                    condition: ''
                });
            }
        } else if (eventBetween) {
            // Connecter l'activité à l'événement intermédiaire
            flows.push({
                id: 'f' + (flows.length + 1),
                type: 'sequence',
                from: currentActivity.id,
                to: eventBetween.id,
                condition: ''
            });
            
            // Connecter l'événement intermédiaire à l'activité suivante
            flows.push({
                id: 'f' + (flows.length + 1),
                type: 'sequence',
                from: eventBetween.id,
                to: nextActivity.id,
                condition: ''
            });
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
    events.filter(e => e.type.includes('message')).forEach(messageEvent => {
        // Pour chaque événement message, déterminer l'acteur externe correspondant
        const messageContext = text.substring(Math.max(0, messageEvent.position - 200), 
                                            Math.min(text.length, messageEvent.position + 200));
        
        // Rechercher les mots-clés d'acteurs externes
        const externalActorKeywords = {
            'Client': ['client', 'acheteur', 'consommateur'],
            'Employé': ['employé', 'salarié', 'travailleur'],
            'Fournisseur': ['fournisseur', 'prestataire', 'vendeur'],
            'Institution financière': ['banque', 'institution financière'],
            'Pharmacien': ['pharmacien', 'chimiste']
        };
        
        // Identifier l'acteur externe le plus pertinent
        let externalActor = null;
        for (const [actor, keywords] of Object.entries(externalActorKeywords)) {
            if (keywords.some(keyword => messageContext.toLowerCase().includes(keyword))) {
                externalActor = actor;
                break;
            }
        }
        
        // Par défaut, utiliser "Client"
        if (!externalActor) {
            externalActor = 'Client';
        }
        
        // Créer le flux de message
        if (messageEvent.isEmission) {
            // Message sortant
            flows.push({
                id: 'f' + (flows.length + 1),
                type: 'message',
                from: messageEvent.id,
                to: externalActor,
                name: messageEvent.name.replace('Message ', '')
            });
        } else {
            // Message entrant
            flows.push({
                id: 'f' + (flows.length + 1),
                type: 'message',
                from: externalActor,
                to: messageEvent.id,
                name: messageEvent.name.replace('Réception ', '')
            });
        }
    });
    
    // 5. Ajouter les flux pour les événements de fin qui envoient des messages
    events.filter(e => e.type === 'fin' && 
                 (e.name.includes('livrée') || 
                  e.name.includes('payée') || 
                  e.name.includes('complétée'))).forEach(finEvent => {
        
        // Rechercher l'acteur externe approprié
        let externalActor = 'Client';
        if (finEvent.name.includes('livrée')) {
            // Message concernant une livraison
            flows.push({
                id: 'f' + (flows.length + 1),
                type: 'message',
                from: finEvent.id,
                to: externalActor,
                name: 'Marchandise'
            });
        } else if (finEvent.name.includes('payée')) {
            // Message concernant un paiement
            flows.push({
                id: 'f' + (flows.length + 1),
                type: 'message',
                from: finEvent.id,
                to: 'Institution financière',
                name: 'Paiement'
            });
        } else {
            // Autre type de message
            flows.push({
                id: 'f' + (flows.length + 1),
                type: 'message',
                from: finEvent.id,
                to: externalActor,
                name: 'Confirmation'
            });
        }
    });
    
    return flows;
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
 * Trouve un événement intermédiaire entre deux positions
 * @param {Object[]} events - Événements
 * @param {number} startPos - Position de départ
 * @param {number} endPos - Position d'arrivée
 * @return {Object} - Événement trouvé ou null
 */
function findEventBetween(events, startPos, endPos) {
    return events.find(event => 
        event.type.startsWith('intermédiaire') && 
        event.position > startPos && 
        event.position < endPos
    );
}

/**
 * Trouve une activité correspondant à une conséquence
 * @param {Object[]} activities - Activités
 * @param {string} outcome - Description de la conséquence
 * @return {Object} - Activité trouvée ou null
 */
function findActivityForOutcome(activities, outcome) {
    if (!outcome) return null;
    
    // Rechercher des mots-clés de l'activité dans la description
    const keywords = extractKeywords(outcome);
    
    return activities.find(activity => {
        const activityKeywords = extractKeywords(activity.name);
        return keywords.some(keyword => 
            activityKeywords.includes(keyword) ||
            activity.name.toLowerCase().includes(keyword)
        );
    });
}

/**
 * Extrait les mots-clés d'un texte
 * @param {string} text - Texte à analyser
 * @return {string[]} - Mots-clés extraits
 */
function extractKeywords(text) {
    if (!text) return [];
    
    return text.toLowerCase()
        .replace(/[.,;:!?]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 3)
        .filter(word => !['pour', 'avec', 'dans', 'cette', 'entre', 'alors', 'donc', 'mais', 'puis', 'ensuite'].includes(word));
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
    const activityContext = text.substring(Math.max(0, text.indexOf(activity.name) - 100), 
                                         Math.min(text.length, text.indexOf(activity.name) + activity.name.length + 200));
    
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
    
    if (activityContext.includes('paie') && endEvents.some(e => e.name.includes('payé'))) {
        return endEvents.find(e => e.name.includes('payé'));
    }
    
    if ((activityContext.includes('complet') || activityContext.includes('termin')) && 
        endEvents.some(e => e.name.includes('complété') || e.name.includes('terminé'))) {
        return endEvents.find(e => e.name.includes('complété') || e.name.includes('terminé'));
    }
    
    // Par défaut, utiliser le premier événement de fin
    return endEvents[0];
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
        {keyword: 'gestion', name: 'Processus de gestion'},
        {keyword: 'paiement', name: 'Processus de paiement'},
        {keyword: 'dépense', name: 'Processus de remboursement des dépenses'}
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
    if (structure.lanes.internal.length === 1) {
        description += `un couloir pour l'acteur interne: « ${structure.lanes.internal[0].name} ».\n\n`;
    } else {
        description += `${structure.lanes.internal.length} couloirs pour les acteurs internes: `;
        description += structure.lanes.internal.map(lane => `« ${lane.name} »`).join(', ') + '.\n\n';
    }
    
    // 3. Événements de début
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
    
    // 4. Tracer les activités et les éléments liés dans l'ordre du flux
    const sequence = determineElementSequence(structure);
    for (let i = 0; i < sequence.length; i++) {
        const element = sequence[i];
        
        if (element.type === 'activity') {
            // Tracer l'activité
            const activity = structure.activities.find(a => a.id === element.id);
            if (activity) {
                const activityType = activity.type === 'manuelle' ? 'manuelle' : 
                                    activity.type === 'service' ? 'service' : 'utilisateur';
                
                description += `Tracer l'activité ${activityType} « ${activity.name} » dans le couloir « ${activity.lane} »`;
                
                // Si ce n'est pas le premier élément, relier au précédent
                if (i > 0 && sequence[i-1].element) {
                    description += ` et relier ${sequence[i-1].element} à cette activité par un flux de séquence`;
                    
                    // Ajouter la condition si nécessaire
                    if (element.condition) {
                        description += ` « ${element.condition} »`;
                    }
                }
                
                description += '.\n\n';
                
                // Stocker une référence à cet élément pour les liens futurs
                element.element = `l'activité ${activityType} « ${activity.name} »`;
                
                // Ajouter les objets de données associés
                addDataObjectsToActivity(activity, structure.dataObjects, description);
            }
        } else if (element.type === 'gateway') {
            // Tracer la passerelle
            const gateway = structure.gateways.find(g => g.id === element.id);
            if (gateway) {
                if (gateway.isConvergence) {
                    description += `Tracer une passerelle exclusive de convergence`;
                } else {
                    description += `Tracer une passerelle exclusive de bifurcation « ${gateway.name} »`;
                }
                
                description += ` dans le couloir « ${gateway.lane} »`;
                
                // Si ce n'est pas le premier élément, relier au précédent
                if (i > 0 && sequence[i-1].element) {
                    description += ` et relier ${sequence[i-1].element} à cette passerelle par un flux de séquence`;
                }
                
                description += '.\n\n';
                
                // Stocker une référence à cet élément pour les liens futurs
                element.element = gateway.isConvergence ? 
                    `la passerelle exclusive de convergence` : 
                    `la passerelle exclusive de bifurcation « ${gateway.name} »`;
            }
        } else if (element.type === 'event') {
            // Tracer l'événement
            const event = structure.events.find(e => 
                e.id === element.id || 
                (element.eventType === 'début' && e.type === 'début') ||
                (element.eventType === 'fin' && e.type === 'fin'));
            
            if (event && (event.type === 'intermédiaire-minuterie' || event.type === 'intermédiaire-message')) {
                const eventTypeStr = event.type === 'intermédiaire-minuterie' ? 'intermédiaire minuterie' : 
                                   (event.isEmission ? 'intermédiaire émission message' : 'intermédiaire réception message');
                
                description += `Tracer un événement ${eventTypeStr} « ${event.name} » dans le couloir « ${event.lane} »`;
                
                // Si ce n'est pas le premier élément, relier au précédent
                if (i > 0 && sequence[i-1].element) {
                    description += ` et relier ${sequence[i-1].element} à cet événement par un flux de séquence`;
                }
                
                description += '.\n\n';
                
                // Si c'est un événement message, ajouter le flux de message
                if (event.type === 'intermédiaire-message') {
                    const messageFlow = structure.flows.find(f => 
                        (f.type === 'message' && f.from === event.id) || 
                        (f.type === 'message' && f.to === event.id));
                    
                    if (messageFlow) {
                        const externalActor = typeof messageFlow.from === 'string' && !messageFlow.from.startsWith('e') ? 
                            messageFlow.from : messageFlow.to;
                        
                        if (event.isEmission) {
                            description += `Tracer un flux de message « ${messageFlow.name} » de cet événement jusqu'à la frontière de la piscine « ${externalActor} ».\n\n`;
                        } else {
                            description += `Tracer un flux de message « ${messageFlow.name} » de la frontière de la piscine « ${externalActor} » jusqu'à cet événement.\n\n`;
                        }
                    }
                }
                
                // Stocker une référence à cet élément pour les liens futurs
                element.element = `l'événement ${eventTypeStr} « ${event.name} »`;
            } else if (event && event.type === 'fin') {
                description += `Tracer un événement fin ${event.name.includes('Marchandise') || 
                                            event.name.includes('Paiement') || 
                                            event.name.includes('Avis') ? 'message' : 'générique'} « ${event.name} » dans le couloir « ${event.lane} »`;
                
                // Si ce n'est pas le premier élément, relier au précédent
                if (i > 0 && sequence[i-1].element) {
                    description += ` et relier ${sequence[i-1].element} à cet événement par un flux de séquence`;
                }
                
                description += '.\n\n';
                
                // Si c'est un événement de fin avec message, ajouter le flux de message
                if (event.name.includes('Marchandise') || event.name.includes('Paiement') || event.name.includes('Avis')) {
                    const messageFlow = structure.flows.find(f => 
                        f.type === 'message' && f.from === event.id);
                    
                    if (messageFlow) {
                        description += `Tracer un flux de message « ${messageFlow.name} », de l'événement de fin « ${event.name} » jusqu'à à la frontière de la piscine « ${messageFlow.to} ».\n\n`;
                    }
                }
            }
        }
    }
    
    // 5. Ajouter les associations entre activités et données qui n'ont pas encore été incluses
    structure.dataObjects.forEach(dataObject => {
        if (dataObject.associatedActivities && dataObject.associatedActivities.length > 0) {
            dataObject.associatedActivities.forEach(activityId => {
                const activity = structure.activities.find(a => a.id === activityId);
                if (activity) {
                    const activityType = activity.type === 'manuelle' ? 'manuelle' : 
                                       activity.type === 'service' ? 'service' : 'utilisateur';
                    
                    if (dataObject.accessMode === 'lecture') {
                        description += `Tracer une association entre le ${dataObject.type} de données « ${dataObject.name} » et l'activité ${activityType} « ${activity.name} » pour indiquer que l'activité lit les données.\n\n`;
                    } else if (dataObject.accessMode === 'création') {
                        description += `Tracer une association entre l'activité ${activityType} « ${activity.name} » et le ${dataObject.type} de données « ${dataObject.name} » pour indiquer que l'activité crée les données.\n\n`;
                    } else if (dataObject.accessMode === 'mise à jour') {
                        description += `Tracer une association bidirectionnelle entre l'activité ${activityType} « ${activity.name} » et le ${dataObject.type} de données « ${dataObject.name} » pour indiquer que l'activité met à jour les données.\n\n`;
                    }
                }
            });
        }
    });
    
    return description;
}

/**
 * Ajoute les objets de données liés à une activité à la description
 * @param {Object} activity - Activité
 * @param {Object[]} dataObjects - Objets de données
 * @param {string} description - Description en cours
 */
function addDataObjectsToActivity(activity, dataObjects, description) {
    const relatedDataObjects = dataObjects.filter(dataObject => 
        dataObject.associatedActivities && 
        dataObject.associatedActivities.includes(activity.id)
    );
    
    relatedDataObjects.forEach(dataObject => {
        const position = dataObject.type === 'magasin' ? 'au-dessus' : 'au-dessous';
        
        // Ajouter l'objet de données
        description += `Tracer un ${dataObject.type} de données « ${dataObject.name} » ${position} de l'activité « ${activity.name} » et `;
        
        // Ajouter l'association appropriée
        if (dataObject.accessMode === 'lecture') {
            description += `relier le ${dataObject.type} de données « ${dataObject.name} » à l'activité par une association pour indiquer que l'activité lit les données`;
        } else if (dataObject.accessMode === 'création') {
            description += `relier l'activité au ${dataObject.type} de données « ${dataObject.name} » par une association pour indiquer que l'activité crée les données`;
        } else if (dataObject.accessMode === 'mise à jour') {
            description += `relier l'activité et le ${dataObject.type} de données « ${dataObject.name} » par une association bidirectionnelle pour indiquer que l'activité met à jour les données`;
        } else {
            description += `relier ces deux éléments par une association`;
        }
        
        description += '.\n\n';
    });
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
    
    // Suivre les flux pour déterminer l'ordre des éléments
    const visited = new Set();
    if (startEvent) {
        visited.add(startEvent.id);
    }
    
    // Trouver les activités dans l'ordre
    structure.activities.forEach(activity => {
        if (!visited.has(activity.id)) {
            sequence.push({
                type: 'activity',
                id: activity.id
            });
            visited.add(activity.id);
            
            // Rechercher les passerelles associées
            const gatewayAfter = structure.flows.find(flow => 
                flow.from === activity.id && 
                flow.to.startsWith('g')
            );
            
            if (gatewayAfter && !visited.has(gatewayAfter.to)) {
                sequence.push({
                    type: 'gateway',
                    id: gatewayAfter.to
                });
                visited.add(gatewayAfter.to);
            }
            
            // Rechercher les événements intermédiaires associés
            const eventAfter = structure.flows.find(flow => 
                flow.from === activity.id && 
                flow.to.startsWith('e')
            );
            
            if (eventAfter && !visited.has(eventAfter.to)) {
                const event = structure.events.find(e => e.id === eventAfter.to);
                if (event) {
                    sequence.push({
                        type: 'event',
                        eventType: event.type,
                        id: event.id
                    });
                    visited.add(event.id);
                }
            }
        }
    });
    
    // Ajouter les événements de fin
    structure.events.filter(e => e.type === 'fin').forEach(endEvent => {
        if (!visited.has(endEvent.id)) {
            sequence.push({
                type: 'event',
                eventType: 'fin',
                id: endEvent.id
            });
            visited.add(endEvent.id);
        }
    });
    
    return sequence;
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

/**
 * Remplit la liste des éléments pour l'affinage de la description
 * @param {Object} structure - Structure du processus
 */
function populateElementList(structure) {
    const elementList = document.getElementById('element-list');
    elementList.innerHTML = '';
    
    // Ajouter les activités
    structure.activities.forEach(activity => {
        const activityItem = document.createElement('div');
        activityItem.className = 'element-item';
        activityItem.innerHTML = `
            <strong>Activité « ${activity.name} »</strong>
            <div class="position-selector">
                <label>Position:</label>
                <select data-element-id="${activity.id}" data-element-type="activity">
                    <option value="left" ${activity.position === 'left' ? 'selected' : ''}>À gauche</option>
                    <option value="right" ${activity.position === 'right' ? 'selected' : ''}>À droite</option>
                    <option value="above" ${activity.position === 'above' ? 'selected' : ''}>Au-dessus</option>
                    <option value="below" ${activity.position === 'below' ? 'selected' : ''}>Au-dessous</option>
                </select>
            </div>
        `;
        elementList.appendChild(activityItem);
    });
    
    // Ajouter les passerelles
    structure.gateways.forEach(gateway => {
        const gatewayItem = document.createElement('div');
        gatewayItem.className = 'element-item';
        gatewayItem.innerHTML = `
            <strong>Passerelle « ${gateway.name} »</strong>
            <div class="position-selector">
                <label>Position:</label>
                <select data-element-id="${gateway.id}" data-element-type="gateway">
                    <option value="left" ${gateway.position === 'left' ? 'selected' : ''}>À gauche</option>
                    <option value="right" ${gateway.position === 'right' ? 'selected' : ''}>À droite</option>
                    <option value="above" ${gateway.position === 'above' ? 'selected' : ''}>Au-dessus</option>
                    <option value="below" ${gateway.position === 'below' ? 'selected' : ''}>Au-dessous</option>
                </select>
            </div>
        `;
        elementList.appendChild(gatewayItem);
    });
    
    // Ajouter les objets de données
    structure.dataObjects.forEach(dataObject => {
        const dataItem = document.createElement('div');
        dataItem.className = 'element-item';
        dataItem.innerHTML = `
            <strong>${dataObject.type === 'magasin' ? 'Magasin' : 'Objet'} de données « ${dataObject.name} »</strong>
            <div class="position-selector">
                <label>Position:</label>
                <select data-element-id="${dataObject.id}" data-element-type="dataObject">
                    <option value="above" ${dataObject.position === 'above' ? 'selected' : ''}>Au-dessus</option>
                    <option value="below" ${dataObject.position === 'below' ? 'selected' : ''}>Au-dessous</option>
                    <option value="left" ${dataObject.position === 'left' ? 'selected' : ''}>À gauche</option>
                    <option value="right" ${dataObject.position === 'right' ? 'selected' : ''}>À droite</option>
                </select>
            </div>
        `;
        elementList.appendChild(dataItem);
    });
}

/**
 * Met à jour les positions des éléments dans la structure
 * @param {Object} structure - Structure du processus
 */
function updateElementPositions(structure) {
    const positionSelects = document.querySelectorAll('[data-element-id]');
    
    positionSelects.forEach(select => {
        const elementId = select.getAttribute('data-element-id');
        const elementType = select.getAttribute('data-element-type');
        const position = select.value;
        
        if (elementType === 'activity') {
            const activity = structure.activities.find(a => a.id === elementId);
            if (activity) {
                activity.position = position;
            }
        } else if (elementType === 'gateway') {
            const gateway = structure.gateways.find(g => g.id === elementId);
            if (gateway) {
                gateway.position = position;
            }
        } else if (elementType === 'dataObject') {
            const dataObject = structure.dataObjects.find(d => d.id === elementId);
            if (dataObject) {
                dataObject.position = position;
            }
        }
    });
}
