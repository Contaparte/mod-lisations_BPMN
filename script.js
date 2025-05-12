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
            output.textContent = 'Une erreur est survenue lors de la génération: ' + error.message;
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
        .replace(/\(\s*/g, '(')      // Normaliser l'espace après parenthèse ouvrante
        .replace(/\s*\)/g, ')')      // Normaliser l'espace avant parenthèse fermante
        .trim();
}

/**
 * Divise un texte en phrases
 * @param {string} text - Texte à diviser
 * @return {string[]} - Tableau de phrases
 */
function splitIntoSentences(text) {
    // Remplacer les points d'interrogation et d'exclamation par des points pour simplifier
    const normalizedText = text.replace(/\?|!/g, '.');
    
    // Gérer les cas spéciaux comme les abréviations courantes
    const withPreservedAbbreviations = normalizedText
        .replace(/M\./g, 'M_ABBR_')
        .replace(/Mme\./g, 'Mme_ABBR_')
        .replace(/Dr\./g, 'Dr_ABBR_')
        .replace(/etc\./g, 'etc_ABBR_')
        .replace(/ex\./g, 'ex_ABBR_');

    // Diviser par les points suivis d'un espace et d'une majuscule
    const rawSentences = withPreservedAbbreviations
        .replace(/\.+\s+(?=[A-Z])/g, '.|')
        .split('|');
    
    // Restaurer les abréviations et nettoyer le résultat
    return rawSentences
        .map(sentence => sentence
            .replace(/M_ABBR_/g, 'M.')
            .replace(/Mme_ABBR_/g, 'Mme.')
            .replace(/Dr_ABBR_/g, 'Dr.')
            .replace(/etc_ABBR_/g, 'etc.')
            .replace(/ex_ABBR_/g, 'ex.')
            .trim())
        .filter(sentence => sentence.length > 0);
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
    const lowerText = text.toLowerCase();
    
    // Dictionnaire des acteurs potentiels à rechercher, en ordre de spécificité
    const potentialActors = [
        // Acteurs internes
        {name: 'Préposé aux comptes', pattern: /préposé(?:\s+aux\s+comptes)?/i, isInternal: true},
        {name: 'Gestionnaire', pattern: /gestionnaire|manager|responsable/i, isInternal: true},
        {name: 'Employé', pattern: /employé|salarié|travailleur/i, isInternal: false},
        {name: 'Institution financière', pattern: /institution\s+financière|banque/i, isInternal: false},
        {name: 'Service livraison', pattern: /service\s+livraison|équipe\s+de\s+livraison|livreur/i, isInternal: true},
        {name: 'Service technique', pattern: /service\s+technique|service\s+informatique|support/i, isInternal: true},
        {name: 'Vendeur', pattern: /vendeur|représentant\s+des\s+ventes/i, isInternal: true},
        {name: 'Représentant du service à la clientèle', pattern: /représentant\s+du\s+service\s+à\s+la\s+clientèle|service\s+client/i, isInternal: true},
        {name: 'Agent', pattern: /agent(?:\s+aux\s+soumissions)?|représentant/i, isInternal: true},
        {name: 'Superviseur', pattern: /superviseur|chef\s+d['']équipe/i, isInternal: true},
        {name: 'Agent technique', pattern: /agent\s+technique|technicien/i, isInternal: true},
        {name: 'Comptabilité', pattern: /comptabilité|comptable/i, isInternal: true},
        {name: 'Entrepôt', pattern: /entrepôt|magasin|stockage/i, isInternal: true},
        {name: 'Chef d\'équipe', pattern: /chef\s+d['']équipe|team\s+lead/i, isInternal: true},
        {name: 'Contrôle qualité', pattern: /contrôle\s+qualité|assurance\s+qualité|qualité/i, isInternal: true},
        {name: 'Développeur', pattern: /développeur|programmeur|codeur/i, isInternal: true},
        
        // Acteurs externes
        {name: 'Client', pattern: /client|acheteur|consommateur/i, isInternal: false},
        {name: 'Fournisseur', pattern: /fournisseur|prestataire|vendeur/i, isInternal: false},
        {name: 'Pharmacien', pattern: /pharmacien|chimiste/i, isInternal: false},
        {name: 'Usine', pattern: /usine|fabrique|manufacture/i, isInternal: false}
    ];
    
    // Rechercher des mentions explicites de participants
    const participantPattern = /(?:participant|acteur|impliqué)s?\s+(?:interne|externe)s?\s*:\s*([^.]+)/ig;
    let participantMatch;
    while ((participantMatch = participantPattern.exec(text)) !== null) {
        const participantsText = participantMatch[1];
        const participantsList = participantsText.split(/(?:,|et)\s+/);
        
        participantsList.forEach(participant => {
            const trimmedParticipant = participant.trim();
            if (trimmedParticipant) {
                const isInternal = participantMatch[0].toLowerCase().includes('interne');
                actors.push({
                    name: capitalizeFirstLetter(trimmedParticipant),
                    pattern: new RegExp(trimmedParticipant.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
                    isInternal: isInternal,
                    hasActivities: true,
                    isPrimaryMention: true
                });
            }
        });
    }
    
    // Détecter les acteurs spécifiques dans le texte
    potentialActors.forEach(potentialActor => {
        if (lowerText.match(potentialActor.pattern) && 
            !actors.some(a => a.name.toLowerCase() === potentialActor.name.toLowerCase())) {
            // Rechercher les activités liées à cet acteur
            const hasActivities = sentences.some(sentence => 
                sentence.toLowerCase().match(potentialActor.pattern) && 
                /\b(vérifie|crée|saisit|envoie|reçoit|traite|analyse|approuve|rejette|valide|examine|gère|communique)\b/i.test(sentence)
            );
            
            actors.push({
                name: capitalizeFirstLetter(potentialActor.name),
                pattern: potentialActor.pattern,
                isInternal: potentialActor.isInternal,
                hasActivities: hasActivities,
                isPrimaryMention: false
            });
        }
    });
    
    // Cas spécial pour le système, souvent utilisé mais pas toujours mentionné comme acteur
    if (lowerText.includes('système') && 
        !actors.some(a => a.name.toLowerCase() === 'système')) {
        actors.push({
            name: 'Système',
            pattern: /système|application|logiciel|pgi|erp/i,
            isInternal: true,
            hasActivities: lowerText.match(/\ble\s+système\s+(génère|calcule|envoie|traite|valide)/i) !== null,
            isPrimaryMention: false
        });
    }

    // Affiner la détection des acteurs internes/externes
    actors.forEach(actor => {
        // Si l'acteur est mentionné comme externe, le marquer comme tel
        if (sentences.some(s => 
            actor.pattern.test(s.toLowerCase()) && 
            (s.toLowerCase().includes('externe') || s.toLowerCase().includes('partenaire')))) {
            actor.isInternal = false;
        }
        
        // Si l'acteur est mentionné comme interne, le marquer comme tel
        if (sentences.some(s => 
            actor.pattern.test(s.toLowerCase()) && 
            (s.toLowerCase().includes('interne') || s.toLowerCase().includes('de l\'entreprise') || 
             s.toLowerCase().includes('de la société') || s.toLowerCase().includes('notre')))) {
            actor.isInternal = true;
        }
    });
    
    // S'assurer qu'il y a au moins un acteur interne et un acteur externe
    if (!actors.some(a => a.isInternal)) {
        actors.push({
            name: 'Système',
            pattern: /système/i,
            isInternal: true,
            hasActivities: true,
            isPrimaryMention: false
        });
    }
    
    if (!actors.some(a => !a.isInternal)) {
        actors.push({
            name: 'Client',
            pattern: /client/i,
            isInternal: false,
            hasActivities: false,
            isPrimaryMention: false
        });
    }
    
    // Détermine quels acteurs devraient avoir leur propre couloir
    actors.forEach(actor => {
        // Un acteur devrait avoir son propre couloir s'il:
        // 1. Est interne ET
        // 2. A des activités OU est mentionné explicitement comme participant
        actor.requiresLane = actor.isInternal && (actor.hasActivities || actor.isPrimaryMention);
    });
    
    return actors;
}

/**
 * Extrait les activités du processus
 * @param {string[]} sentences - Phrases du scénario
 * @param {string} fullText - Texte complet pour le contexte
 * @return {Object[]} - Activités identifiées
 */
function extractActivities(sentences, fullText) {
    const activities = [];
    const lowerFullText = fullText.toLowerCase();
    
    // Mots-clés pour identifier les activités
    const actionKeywords = [
        'vérifie', 'crée', 'saisit', 'envoie', 'reçoit', 'traite', 'analyse', 
        'approuve', 'rejette', 'transfère', 'communique', 'consulte', 'valide',
        'prépare', 'génère', 'imprime', 'enregistre', 'classe', 'stocke',
        'expédie', 'livre', 'exécute', 'calcule', 'compare', 'examine',
        'programme', 'rédige', 'documente', 'teste', 'identifie', 'évalue',
        'autorise', 'informe', 'présente', 'collecte', 'transmet', 'instancie',
        'confirme', 'transmets', 'annule', 'décide', 'détermine', 'met à jour'
    ];
    
    // Extraire les activités selon deux approches
    
    // 1. Approche séquentielle: parcourir les phrases en ordre pour identifier le flux de travail
    for (let i = 0; i < sentences.length; i++) {
        const sentence = sentences[i];
        
        // Ignorer les phrases trop courtes ou qui ne décrivent pas d'actions
        if (sentence.length < 10 || isConnectorSentence(sentence)) continue;
        
        // Détecter si la phrase décrit une activité
        const containsActionKeyword = actionKeywords.some(keyword => 
            sentence.toLowerCase().includes(keyword)
        );
        
        if (containsActionKeyword) {
            // Identifier l'acteur responsable de l'activité
            const responsibleActor = identifyActorForActivity(sentence, fullText);
            
            // Identifier le type d'activité
            const activityType = identifyActivityType(sentence, lowerFullText);
            
            // Extraire le nom de l'activité
            const activityName = extractActivityName(sentence);
            
            // Déterminer si cette activité dépend d'une condition
            const dependsOnCondition = i > 0 && 
                (sentences[i-1].toLowerCase().includes('si ') || 
                 sentence.toLowerCase().includes('sinon') || 
                 sentence.toLowerCase().match(/^(dans\s+le\s+cas\s+(où|ou)|lorsque)/i));
            
            // Détecter les relations de dépendance avec d'autres activités
            const previousActivity = activities.length > 0 ? 
                activities[activities.length - 1] : null;
            
            // Initialiser les propriétés de dépendance
            let dependsOn = null;
            let isBranchActivity = false;
            
            // Vérifier si cette activité est une branche d'une condition
            if (dependsOnCondition && previousActivity) {
                if (previousActivity.dependsOnCondition) {
                    // C'est une activité parallèle dans une autre branche
                    dependsOn = previousActivity.dependsOn;
                    isBranchActivity = true;
                } else {
                    // C'est une activité qui dépend de la condition précédente
                    dependsOn = previousActivity.id;
                }
            }
            
            // Ajouter l'activité
            activities.push({
                id: `a${activities.length + 1}`,
                name: activityName,
                description: sentence,
                type: activityType,
                actor: responsibleActor,
                position: i,
                hasDataInteraction: sentence.toLowerCase().includes('système') || 
                                   sentence.toLowerCase().includes('base de données') ||
                                   sentence.toLowerCase().includes('document') ||
                                   sentence.toLowerCase().includes('rapport') ||
                                   sentence.toLowerCase().includes('fichier') ||
                                   sentence.toLowerCase().includes('formulaire'),
                dependsOnCondition: dependsOnCondition,
                dependsOn: dependsOn,
                isBranchActivity: isBranchActivity
            });
        }
    }
    
    // 2. Approche par mots-clés: rechercher des motifs spécifiques d'activités
    const activityPatterns = [
        {
            pattern: /v[ée]rifi(e|er)\s+si\s+([^.]+)/i,
            type: 'utilisateur',
            nameTemplate: 'Vérifier $1'
        },
        {
            pattern: /cr[ée]{1,2}(r|e)\s+([^.]+)\s+dans\s+(le|la|les)\s+syst[èe]me/i,
            type: 'utilisateur',
            nameTemplate: 'Créer $1'
        },
        {
            pattern: /saisi(r|t)\s+([^.]+)\s+dans\s+(le|la|les)\s+syst[èe]me/i,
            type: 'utilisateur',
            nameTemplate: 'Saisir $1'
        },
        {
            pattern: /approuv(e|er)\s+([^.,]+)/i,
            type: 'utilisateur',
            nameTemplate: 'Approuver $1'
        },
        {
            pattern: /communiqu(e|er)\s+(avec|à)\s+([^.,]+)/i,
            type: 'manuelle',
            nameTemplate: 'Communiquer avec $2'
        }
    ];
    
    // Parcourir à nouveau les phrases pour capturer les activités basées sur des motifs spécifiques
    sentences.forEach((sentence, index) => {
        activityPatterns.forEach(patternObj => {
            const matches = sentence.match(patternObj.pattern);
            if (matches) {
                // Vérifier si cette activité n'a pas déjà été capturée
                const activityName = patternObj.nameTemplate.replace('$1', matches[2] || '')
                                                           .replace('$2', matches[3] || '');
                
                if (!activities.some(a => areStringSimilar(a.name, activityName))) {
                    // Identifier l'acteur responsable
                    const responsibleActor = identifyActorForActivity(sentence, fullText);
                    
                    activities.push({
                        id: `a${activities.length + 1}`,
                        name: activityName,
                        description: sentence,
                        type: patternObj.type,
                        actor: responsibleActor,
                        position: index,
                        hasDataInteraction: patternObj.type === 'utilisateur',
                        dependsOnCondition: false,
                        dependsOn: null,
                        isBranchActivity: false
                    });
                }
            }
        });
    });
    
    // Identifier et marquer les activités de validation/approbation
    activities.forEach(activity => {
        if (activity.name.toLowerCase().includes('valide') || 
            activity.name.toLowerCase().includes('approuve') ||
            activity.name.toLowerCase().includes('vérifie')) {
            activity.isApproval = true;
        }
    });
    
    // Détecter et marquer les activités de fin (qui mettent fin au processus)
    activities.forEach(activity => {
        if (activity.description.toLowerCase().includes('met fin') || 
            activity.description.toLowerCase().includes('termine le processus') ||
            activity.description.toLowerCase().includes('fin du processus')) {
            activity.isEndActivity = true;
        }
    });
    
    return activities;
}

/**
 * Compare deux chaînes pour déterminer si elles sont similaires
 * @param {string} str1 - Première chaîne
 * @param {string} str2 - Deuxième chaîne
 * @return {boolean} - Vrai si les chaînes sont similaires
 */
function areStringSimilar(str1, str2) {
    if (!str1 || !str2) return false;
    
    // Normaliser les chaînes (minuscules, sans ponctuation)
    const normalize = s => s.toLowerCase().replace(/[.,;:!?]/g, '').trim();
    const norm1 = normalize(str1);
    const norm2 = normalize(str2);
    
    // Si une chaîne contient l'autre, elles sont similaires
    if (norm1.includes(norm2) || norm2.includes(norm1)) return true;
    
    // Compter les mots communs
    const words1 = norm1.split(/\s+/);
    const words2 = norm2.split(/\s+/);
    
    let commonWords = 0;
    words1.forEach(word => {
        if (words2.includes(word) && word.length > 3) {
            commonWords++;
        }
    });
    
    // Si plus de 50% des mots sont communs, les chaînes sont similaires
    const similarityThreshold = Math.min(words1.length, words2.length) * 0.5;
    return commonWords >= similarityThreshold;
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
           lowerSentence.length < 15 || // Phrases très courtes sont souvent des transitions
           lowerSentence.includes('le processus commence') || 
           lowerSentence.includes('le processus débute');
}

/**
 * Identifie l'acteur responsable d'une activité
 * @param {string} sentence - Phrase décrivant l'activité
 * @param {string} fullText - Texte complet pour le contexte
 * @return {string} - Nom de l'acteur
 */
function identifyActorForActivity(sentence, fullText) {
    const actorKeywords = {
        'Préposé aux comptes': ['préposé aux comptes', 'préposé', 'comptable'],
        'Gestionnaire': ['gestionnaire', 'manager', 'responsable', 'chef d\'équipe'],
        'Employé': ['employé', 'salarié', 'travailleur'],
        'Institution financière': ['institution financière', 'banque', 'établissement bancaire'],
        'Système': ['système', 'application', 'logiciel', 'pgi', 'erp', 'automatiquement', 'algorithme'],
        'Client': ['client', 'acheteur', 'consommateur', 'utilisateur'],
        'Agent': ['agent', 'représentant', 'technicien'],
        'Superviseur': ['superviseur', 'chef d\'équipe', 'supérieur hiérarchique'],
        'Comptabilité': ['comptabilité', 'service comptable', 'département financier'],
        'Service livraison': ['service livraison', 'livreur', 'livraison'],
        'Entrepôt': ['entrepôt', 'magasin', 'stockage', 'préposé à l\'entrepôt'],
        'Représentant du service à la clientèle': ['représentant du service à la clientèle', 'service client', 'conseiller'],
        'Développeur': ['développeur', 'programmeur', 'codeur'],
        'Contrôle qualité': ['contrôle qualité', 'assurance qualité', 'qualité'],
        'Pharmacien': ['pharmacien', 'chimiste', 'préparateur']
    };
    
    const lowerSentence = sentence.toLowerCase();
    
    // 1. Rechercher des mentions explicites du sujet de la phrase
    for (const [actor, keywords] of Object.entries(actorKeywords)) {
        for (const keyword of keywords) {
            // Vérifier si le mot-clé est le sujet d'un verbe d'action
            const subjectPattern = new RegExp(`(le\\s+|la\\s+|les\\s+|un\\s+|une\\s+)?${keyword}\\s+(qui\\s+)?\\b(vérifie|crée|saisit|envoie|reçoit|traite|analyse|approuve|rejette|valide|examine)\\b`, 'i');
            if (lowerSentence.match(subjectPattern)) {
                return actor;
            }
            
            // Vérifier si le mot-clé est mentionné au début de la phrase
            const startPattern = new RegExp(`^(le\\s+|la\\s+|les\\s+|un\\s+|une\\s+)?${keyword}\\b`, 'i');
            if (lowerSentence.match(startPattern)) {
                return actor;
            }
        }
    }
    
    // 2. Détecter les constructions passives
    const passiveVerbPattern = /est\s+(vérifié|créé|saisi|envoyé|reçu|traité|analysé|approuvé|rejeté|validé|examiné)\s+par\s+(le|la|les|un|une)\s+([a-zéèêàçùïëâîôû-]+)/i;
    const passiveMatch = lowerSentence.match(passiveVerbPattern);
    if (passiveMatch) {
        const actorMentioned = passiveMatch[3];
        for (const [actor, keywords] of Object.entries(actorKeywords)) {
            if (keywords.some(k => k.toLowerCase().includes(actorMentioned))) {
                return actor;
            }
        }
    }
    
    // 3. Analyser le contexte autour de la phrase
    const sentenceIndex = fullText.indexOf(sentence);
    const contextBefore = fullText.substring(Math.max(0, sentenceIndex - 300), sentenceIndex);
    
    // Rechercher des mentions explicites d'acteurs dans le contexte récent
    for (const [actor, keywords] of Object.entries(actorKeywords)) {
        for (const keyword of keywords) {
            const actorMentionPattern = new RegExp(`${keyword}[^.]*\\.(\\s|$)`, 'i');
            if (contextBefore.match(actorMentionPattern)) {
                return actor;
            }
        }
    }
    
    // 4. Déterminer l'acteur par inférence basée sur l'action
    if (lowerSentence.includes('système génère') || 
        lowerSentence.includes('système calcule') || 
        lowerSentence.includes('système valide') ||
        lowerSentence.includes('automatiquement')) {
        return 'Système';
    }
    
    if (lowerSentence.includes('vérifier si') || 
        lowerSentence.includes('vérifier le') || 
        lowerSentence.includes('approuver') || 
        lowerSentence.includes('valider')) {
        // Les activités de vérification/approbation sont souvent faites par le gestionnaire
        return 'Gestionnaire';
    }
    
    if (lowerSentence.includes('saisir') || 
        lowerSentence.includes('créer') || 
        lowerSentence.includes('remplir') ||
        lowerSentence.includes('formulaire')) {
        // Les activités de saisie sont souvent faites par le préposé
        return 'Préposé aux comptes';
    }
    
    if (lowerSentence.includes('préparer') || 
        lowerSentence.includes('emballer') || 
        lowerSentence.includes('livrer')) {
        return 'Service livraison';
    }
    
    // 5. Acteur par défaut selon le contexte global du texte
    if (fullText.toLowerCase().includes('remboursement') || 
        fullText.toLowerCase().includes('dépense')) {
        return 'Préposé aux comptes';
    }
    
    if (fullText.toLowerCase().includes('commande') || 
        fullText.toLowerCase().includes('achat')) {
        return 'Préposé aux comptes';
    }
    
    // Acteur par défaut si aucun n'est identifié avec certitude
    return 'Système';
}

/**
 * Identifie le type d'activité
 * @param {string} sentence - Phrase décrivant l'activité
 * @param {string} fullText - Texte complet du scénario en minuscules
 * @return {string} - Type d'activité
 */
function identifyActivityType(sentence, fullText) {
    const lowerSentence = sentence.toLowerCase();
    
    // Système (Service)
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
    
    // Détection spécifique basée sur les verbes et les contextes
    if (lowerSentence.includes('vérifie') || lowerSentence.includes('vérifier')) {
        if (lowerSentence.includes('base de données') || 
            lowerSentence.includes('système') || 
            lowerSentence.includes('application')) {
            return 'utilisateur';
        }
    }
    
    if (lowerSentence.includes('crée') || lowerSentence.includes('créer')) {
        if (lowerSentence.includes('base de données') || 
            lowerSentence.includes('système') || 
            lowerSentence.includes('application')) {
            return 'utilisateur';
        }
    }
    
    // Vérifier le contexte global du texte
    if ((lowerSentence.includes('vérifie') || lowerSentence.includes('vérifier')) &&
        (fullText.includes('base de données') || fullText.includes('système d\'information'))) {
        return 'utilisateur';
    }
    
    // Manuelle (sans système)
    if (lowerSentence.includes('manuellement') || 
        lowerSentence.includes('papier') ||
        lowerSentence.includes('physiquement') ||
        lowerSentence.includes('classe') && lowerSentence.includes('document') ||
        lowerSentence.includes('classe') && lowerSentence.includes('dossier') ||
        lowerSentence.includes('communique avec') ||
        lowerSentence.includes('contacte') ||
        lowerSentence.includes('appelle') ||
        lowerSentence.includes('imprime') && !lowerSentence.includes('système') ||
        (lowerSentence.includes('photocopie') && !lowerSentence.includes('système'))) {
        return 'manuelle';
    }
    
    // Par défaut: détecter d'après le contexte
    if (lowerSentence.includes('système') || 
        lowerSentence.includes('logiciel') || 
        lowerSentence.includes('application') || 
        lowerSentence.includes('base de données') ||
        lowerSentence.includes('pgi') || 
        lowerSentence.includes('erp') ||
        lowerSentence.includes('dans le si')) {
        return 'utilisateur';
    }
    
    // Par défaut
    return 'manuelle';
}

/**
 * Extrait le nom d'une activité à partir d'une phrase
 * @param {string} sentence - Phrase décrivant l'activité
 * @return {string} - Nom de l'activité
 */
function extractActivityName(sentence) {
    // Identifier le verbe principal et l'objet
    const actionVerbs = [
        'vérifie', 'crée', 'saisit', 'envoie', 'reçoit', 'traite', 'analyse', 
        'approuve', 'rejette', 'transfère', 'communique', 'consulte', 'valide',
        'prépare', 'génère', 'imprime', 'enregistre', 'classe', 'stocke',
        'expédie', 'livre', 'exécute', 'calcule', 'compare', 'examine',
        'programme', 'rédige', 'documente', 'teste', 'identifie', 'évalue',
        'autorise', 'informe', 'présente', 'collecte', 'transmet', 'instancie',
        'avise', 'notifie', 'annule', 'met à jour', 'confirme', 'modifie'
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
        'instancie': 'Instancier',
        'avise': 'Aviser',
        'notifie': 'Notifier',
        'annule': 'Annuler',
        'met à jour': 'Mettre à jour',
        'confirme': 'Confirmer',
        'modifie': 'Modifier'
    };
    
    // Rechercher des modèles spécifiques d'abord
    
    // Modèle "vérifier si" commun dans BPMN
    const verifierSiPattern = /(vérifie|vérifier)\s+si\s+([^.,;:]+)/i;
    const verifierSiMatch = sentence.match(verifierSiPattern);
    if (verifierSiMatch) {
        return 'Vérifier si ' + verifierSiMatch[2].trim();
    }
    
    // Modèle "communiquer avec/à"
    const communiquerPattern = /(communique|communiquer)\s+(avec|à)\s+([^.,;:]+)/i;
    const communiquerMatch = sentence.match(communiquerPattern);
    if (communiquerMatch) {
        return 'Communiquer avec ' + communiquerMatch[3].trim();
    }
    
    // Recherche standard par verbe d'action
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
    
    // Extraire les décisions basées sur des conditions "si..."
    for (let i = 0; i < sentences.length; i++) {
        const sentence = sentences[i];
        const lowerSentence = sentence.toLowerCase();
        
        // Rechercher les phrases conditionnelles "si..."
        if (lowerSentence.includes(' si ') || 
            lowerSentence.match(/^\s*si\s+/i)) {
            
            const condition = extractCondition(sentence);
            
            if (condition) {
                // Déterminer les conséquences positives et négatives
                const positiveOutcome = extractPositiveOutcome(sentence, sentences, i);
                const negativeOutcome = extractNegativeOutcome(sentence, sentences, i);
                
                decisions.push({
                    id: `g${decisions.length + 1}`,
                    condition: condition,
                    question: convertConditionToQuestion(condition),
                    positiveOutcome: positiveOutcome,
                    negativeOutcome: negativeOutcome,
                    position: i,
                    actor: identifyActorForDecision(sentence, fullText)
                });
            }
        }
        
        // Rechercher les clauses "sinon" séparées
        if (lowerSentence.startsWith('sinon') || 
            lowerSentence.startsWith('dans le cas contraire')) {
            
            // Trouver la décision précédente
            const previousDecision = decisions.length > 0 ? 
                decisions[decisions.length - 1] : null;
            
            if (previousDecision && !previousDecision.negativeOutcome) {
                previousDecision.negativeOutcome = sentence;
            }
        }
    }
    
    // Extraire les décisions basées sur des constructions spécifiques
    for (let i = 0; i < sentences.length; i++) {
        const sentence = sentences[i];
        const lowerSentence = sentence.toLowerCase();
        
        // Détecter les décisions basées sur des montants
        const montantPattern = /si\s+le\s+montant\s+(est|dépasse|excède|est supérieur à|est inférieur à|est égal à)\s+([0-9]+[$€])/i;
        const montantMatch = lowerSentence.match(montantPattern);
        
        if (montantMatch && !decisions.some(d => d.position === i)) {
            const comparator = montantMatch[1].toLowerCase();
            const amount = montantMatch[2].replace(/[$€]/, '');
            
            let question = '';
            if (comparator === 'est supérieur à' || comparator === 'dépasse' || comparator === 'excède') {
                question = `Montant > ${amount}$ ?`;
            } else if (comparator === 'est inférieur à') {
                question = `Montant < ${amount}$ ?`;
            } else if (comparator === 'est égal à') {
                question = `Montant = ${amount}$ ?`;
            } else {
                question = `Montant ${amount}$ ?`;
            }
            
            decisions.push({
                id: `g${decisions.length + 1}`,
                condition: montantMatch[0],
                question: question,
                positiveOutcome: extractPositiveOutcome(sentence, sentences, i),
                negativeOutcome: extractNegativeOutcome(sentence, sentences, i),
                position: i,
                actor: identifyActorForDecision(sentence, fullText)
            });
        }
        
        // Détecter les décisions basées sur l'existence
        const existsPattern = /(si|lorsque)\s+(le|la|l['']|les)\s+([^\s]+)\s+(existe|n['']existe pas|est présent|n['']est pas présent)/i;
        const existsMatch = lowerSentence.match(existsPattern);
        
        if (existsMatch && !decisions.some(d => d.position === i)) {
            const entity = existsMatch[3];
            const exists = !existsMatch[4].includes('pas');
            
            const question = exists ? 
                `${capitalizeFirstLetter(entity)} existe ?` : 
                `${capitalizeFirstLetter(entity)} n'existe pas ?`;
            
            decisions.push({
                id: `g${decisions.length + 1}`,
                condition: existsMatch[0],
                question: question,
                positiveOutcome: extractPositiveOutcome(sentence, sentences, i),
                negativeOutcome: extractNegativeOutcome(sentence, sentences, i),
                position: i,
                actor: identifyActorForDecision(sentence, fullText)
            });
        }
        
        // Détecter les décisions basées sur l'approbation
        const approvalPattern = /(si|lorsque)\s+(le|la|l['']|les)\s+([^\s]+)\s+(est|sont)\s+(approuvé|validé|confirmé|accepté)/i;
        const approvalMatch = lowerSentence.match(approvalPattern);
        
        if (approvalMatch && !decisions.some(d => d.position === i)) {
            const entity = approvalMatch[3];
            
            decisions.push({
                id: `g${decisions.length + 1}`,
                condition: approvalMatch[0],
                question: `${capitalizeFirstLetter(entity)} approuvé ?`,
                positiveOutcome: extractPositiveOutcome(sentence, sentences, i),
                negativeOutcome: extractNegativeOutcome(sentence, sentences, i),
                position: i,
                actor: identifyActorForDecision(sentence, fullText)
            });
        }
    }
    
    // Identifier les passerelles de convergence
    identifyConvergenceGateways(decisions, sentences);
    
    return decisions;
}

/**
 * Identifie les passerelles de convergence
 * @param {Object[]} decisions - Décisions identifiées
 * @param {string[]} sentences - Phrases du scénario
 */
function identifyConvergenceGateways(decisions, sentences) {
    // Analyse du texte pour trouver des indications de convergence
    const convergenceKeywords = [
        'dans tous les cas',
        'quelle que soit la décision',
        'indépendamment du résultat',
        'une fois la vérification terminée',
        'après la validation',
        'ensuite',
        'puis',
        'finalement'
    ];
    
    // Identifier les points de convergence potentiels
    for (let i = 0; i < sentences.length; i++) {
        const sentence = sentences[i].toLowerCase();
        
        // Vérifier si la phrase contient un mot-clé de convergence
        const hasConvergenceKeyword = convergenceKeywords.some(keyword => 
            sentence.includes(keyword)
        );
        
        if (hasConvergenceKeyword) {
            // Trouver une décision antérieure récente
            const recentDecisions = decisions.filter(d => d.position < i && i - d.position <= 3);
            
            if (recentDecisions.length > 0) {
                // Ajouter une passerelle de convergence
                decisions.push({
                    id: `g${decisions.length + 1}`,
                    isConvergence: true,
                    position: i,
                    actor: recentDecisions[0].actor // Même acteur que la décision précédente
                });
            }
        }
    }
    
    // Identifier les points où plusieurs chemins peuvent converger
    decisions.forEach(decision => {
        if (decision.positiveOutcome && decision.negativeOutcome) {
            // Vérifier si les deux branches mènent au même type d'activité
            const positiveLower = decision.positiveOutcome.toLowerCase();
            const negativeLower = decision.negativeOutcome.toLowerCase();
            
            const commonActivityTypes = [
                {type: 'approuver', keywords: ['approuve', 'valide', 'confirme']},
                {type: 'envoyer', keywords: ['envoie', 'transmet', 'communique']},
                {type: 'saisir', keywords: ['saisit', 'enregistre', 'entre']},
                {type: 'vérifier', keywords: ['vérifie', 'contrôle', 'examine']}
            ];
            
            for (const activityType of commonActivityTypes) {
                const positiveHasType = activityType.keywords.some(k => positiveLower.includes(k));
                const negativeHasType = activityType.keywords.some(k => negativeLower.includes(k));
                
                // Si les deux branches ont le même type d'activité, c'est un signe de convergence
                if (positiveHasType && negativeHasType) {
                    // Ajouter une passerelle de convergence après ces activités
                    decisions.push({
                        id: `g${decisions.length + 1}`,
                        isConvergence: true,
                        position: decision.position + 2, // Approximation
                        actor: decision.actor
                    });
                    break;
                }
            }
        }
    });
}

/**
 * Identifie l'acteur responsable d'une décision
 * @param {string} sentence - Phrase décrivant la décision
 * @param {string} fullText - Texte complet pour le contexte
 * @return {string} - Nom de l'acteur
 */
function identifyActorForDecision(sentence, fullText) {
    // Les décisions sont souvent prises par le même acteur que l'activité qui précède
    const sentenceIndex = fullText.indexOf(sentence);
    const contextBefore = fullText.substring(Math.max(0, sentenceIndex - 200), sentenceIndex);
    
    // Chercher l'acteur mentionné le plus récemment dans le contexte
    const actorKeywords = {
        'Préposé aux comptes': ['préposé aux comptes', 'préposé', 'comptable'],
        'Gestionnaire': ['gestionnaire', 'manager', 'responsable'],
        'Système': ['système', 'application', 'logiciel']
    };
    
    for (const [actor, keywords] of Object.entries(actorKeywords)) {
        for (const keyword of keywords) {
            if (contextBefore.toLowerCase().includes(keyword.toLowerCase())) {
                return actor;
            }
        }
    }
    
    // Par défaut, les décisions relatives aux montants sont souvent prises par les gestionnaires
    if (sentence.toLowerCase().includes('montant') || 
        sentence.toLowerCase().includes('seuil') || 
        sentence.toLowerCase().includes('valeur')) {
        return 'Gestionnaire';
    }
    
    // Les décisions concernant les vérifications sont souvent prises par le préposé
    if (sentence.toLowerCase().includes('vérifie') || 
        sentence.toLowerCase().includes('existe')) {
        return 'Préposé aux comptes';
    }
    
    // Les décisions automatiques sont prises par le système
    if (sentence.toLowerCase().includes('automatiquement') || 
        sentence.toLowerCase().includes('système')) {
        return 'Système';
    }
    
    // Si aucun acteur spécifique n'est identifié, utiliser un acteur par défaut selon le contexte
    return 'Gestionnaire'; // Par défaut, les décisions sont souvent prises par les gestionnaires
}

/**
 * Extrait une condition à partir d'une phrase conditionnelle
 * @param {string} sentence - Phrase conditionnelle
 * @return {string} - Condition extraite
 */
function extractCondition(sentence) {
    const lowerSentence = sentence.toLowerCase();
    
    // Rechercher "si..." au début de la phrase
    if (lowerSentence.match(/^\s*si\s+/i)) {
        let condition = sentence.substring(sentence.toLowerCase().indexOf('si') + 2);
        // Couper à la virgule, point ou autre marqueur
        condition = condition.split(/[,.:;]|\s+alors\s+/)[0].trim();
        return condition;
    }
    
    // Rechercher "si..." en milieu de phrase
    const siIndex = lowerSentence.indexOf(' si ');
    if (siIndex !== -1) {
        let condition = sentence.substring(siIndex + 4);
        // Couper à la virgule, point ou autre marqueur
        condition = condition.split(/[,.:;]|\s+alors\s+/)[0].trim();
        return condition;
    }
    
    // Rechercher "lorsque..." ou "quand..."
    const lorsqueIndex = Math.max(
        lowerSentence.indexOf(' lorsque '), 
        lowerSentence.indexOf(' quand ')
    );
    
    if (lorsqueIndex !== -1) {
        const startIndex = lorsqueIndex + (lowerSentence.includes(' lorsque ') ? 9 : 7);
        let condition = sentence.substring(startIndex);
        // Couper à la virgule, point ou autre marqueur
        condition = condition.split(/[,.:;]|\s+alors\s+/)[0].trim();
        return condition;
    }
    
    return '';
}

/**
 * Convertit une condition en question pour le nom d'une passerelle
 * @param {string} condition - Condition à convertir
 * @return {string} - Question pour la passerelle
 */
function convertConditionToQuestion(condition) {
    if (!condition) return '?';
    
    const lowerCondition = condition.toLowerCase();
    
    // Cas spécifiques de conditions monétaires
    if (lowerCondition.match(/montant\s+(est\s+)?(de|égal à)?\s*\d+\$?\s*ou\s+moins/i)) {
        const montant = condition.match(/\d+/)[0];
        return `Montant ≤ ${montant}$ ?`;
    }
    
    if (lowerCondition.match(/montant\s+(est\s+)?(supérieur|plus grand|plus élevé)(\s+à|\s+que)?\s*\d+\$?/i)) {
        const montant = condition.match(/\d+/)[0];
        return `Montant > ${montant}$ ?`;
    }
    
    if (lowerCondition.match(/montant\s+(est\s+)?(\d+)\$?/i)) {
        const montant = condition.match(/\d+/)[0];
        return `Montant = ${montant}$ ?`;
    }
    
    // Cas d'existence
    if (lowerCondition.match(/employé\s+(existe|n['']existe\s+pas)/i)) {
        return `L'employé existe ?`;
    }
    
    if (lowerCondition.match(/client\s+(existe|n['']existe\s+pas)/i)) {
        return `Client existe ?`;
    }
    
    if (lowerCondition.match(/pharmacien\s+(existe|n['']existe\s+pas)/i)) {
        return `Pharmacien existe ?`;
    }
    
    // Cas d'approbation/validation
    if (lowerCondition.match(/rapport\s+(est\s+)?(approuvé|validé)/i)) {
        return `Rapport approuvé ?`;
    }
    
    if (lowerCondition.match(/crédit\s+(est\s+)?(acceptable|bon|valide|approuvé)/i)) {
        return `Crédit acceptable ?`;
    }
    
    // Cas de refus/rejet
    if (lowerCondition.match(/rapport\s+(est\s+)?(refusé|rejeté|non\s+approuvé)/i)) {
        return `Rapport refusé ?`;
    }
    
    // Cas général: reformulation en question
    if (lowerCondition.includes(' est ')) {
        const parts = lowerCondition.split(' est ');
        return `${capitalizeFirstLetter(parts[0])} est ${parts[1]} ?`;
    }
    
    if (lowerCondition.includes(' a ')) {
        const parts = lowerCondition.split(' a ');
        return `${capitalizeFirstLetter(parts[0])} a ${parts[1]} ?`;
    }
    
    if (lowerCondition.includes(' existe')) {
        return `${capitalizeFirstLetter(lowerCondition.split(' existe')[0])} existe ?`;
    }
    
    // Conditions complexes: garder la formulation originale avec un point d'interrogation
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
    const lowerSentence = sentence.toLowerCase();
    
    // 1. Si la phrase contient elle-même la conséquence positive après une virgule ou "alors"
    if (lowerSentence.includes(', alors ') || 
        lowerSentence.includes(', il ') || 
        lowerSentence.includes(', elle ') || 
        lowerSentence.includes(', celui-ci ')) {
        
        // Trouver l'index du séparateur
        const separatorIndex = Math.max(
            lowerSentence.indexOf(', alors '),
            lowerSentence.indexOf(', il '),
            lowerSentence.indexOf(', elle '),
            lowerSentence.indexOf(', celui-ci ')
        );
        
        if (separatorIndex !== -1) {
            const positiveOutcome = sentence.substring(separatorIndex + 2);
            return positiveOutcome.trim();
        }
    }
    
    // 2. Chercher la conséquence dans la phrase suivante
    if (position < sentences.length - 1) {
        const nextSentence = sentences[position + 1];
        const nextLower = nextSentence.toLowerCase();
        
        // Éviter les phrases qui contiennent "sinon", "dans le cas contraire" ou qui commencent par "si ... ne pas"
        if (!nextLower.includes('sinon') && 
            !nextLower.includes('dans le cas contraire') && 
            !nextLower.match(/^si.+ne\s+pas/i)) {
            
            return nextSentence.trim();
        }
    }
    
    // 3. Si la phrase suivante n'est pas pertinente, chercher plus loin
    if (position < sentences.length - 2) {
        const secondNextSentence = sentences[position + 2];
        const secondNextLower = secondNextSentence.toLowerCase();
        
        // Éviter les phrases qui contiennent "sinon" ou qui commencent par "si ... ne pas"
        if (!secondNextLower.includes('sinon') && 
            !secondNextLower.includes('dans le cas contraire') && 
            !secondNextLower.match(/^si.+ne\s+pas/i)) {
            
            return secondNextSentence.trim();
        }
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
    // 1. Chercher les clauses "sinon" explicites dans les phrases suivantes
    for (let i = position + 1; i < Math.min(position + 5, sentences.length); i++) {
        const nextSentence = sentences[i].toLowerCase();
        
        if (nextSentence.startsWith('sinon') || 
            nextSentence.startsWith('dans le cas contraire') || 
            nextSentence.includes('si ce n\'est pas le cas')) {
            
            return sentences[i].trim();
        }
    }
    
    // 2. Rechercher des phrases avec "si... ne... pas" ou négations similaires
    for (let i = position + 1; i < Math.min(position + 5, sentences.length); i++) {
        const nextLower = sentences[i].toLowerCase();
        
        if ((nextLower.includes('si') && 
             (nextLower.includes('n\'est pas') || 
              nextLower.includes('ne pas') || 
              nextLower.includes('non'))) || 
            (nextLower.includes('dans le cas où') && 
             (nextLower.includes('n\'est pas') || 
              nextLower.includes('ne pas')))) {
            
            return sentences[i].trim();
        }
    }
    
    // 3. Chercher des phrases avec des formulations négatives liées à la condition
    const condition = extractCondition(sentence);
    if (condition) {
        const conditionWords = condition.toLowerCase()
            .replace(/[.,;:!?]/g, '')
            .split(/\s+/)
            .filter(word => word.length > 3);
        
        for (let i = position + 1; i < Math.min(position + 5, sentences.length); i++) {
            const nextLower = sentences[i].toLowerCase();
            
            // Vérifier si la phrase contient des mots clés de la condition et une négation
            if (conditionWords.some(word => nextLower.includes(word)) && 
                (nextLower.includes('n\'est pas') || 
                 nextLower.includes('ne pas') || 
                 nextLower.includes('non'))) {
                
                return sentences[i].trim();
            }
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
    const lowerFullText = fullText.toLowerCase();
    
    // Mots-clés pour détecter les magasins de données
    const dataStoreKeywords = [
        'base de données', 'système', 'système d\'information', 
        'logiciel', 'application', 'dossier', 'filière', 'classeur',
        'répertoire', 'entrepôt de données', 'archive', 'registre',
        'pgi', 'erp', 'sgbd'
    ];
    
    // Mots-clés pour détecter les objets de données
    const dataObjectKeywords = [
        'document', 'rapport', 'formulaire', 'fichier', 'facture', 
        'bon de commande', 'bon de livraison', 'courriel', 'message', 
        'avis', 'notification', 'liste', 'reçu', 'confirmation',
        'contrat', 'lettre', 'mémo', 'bordereau', 'devis', 'requête'
    ];
    
    // Rechercher des mentions explicites de magasins de données
    for (const keyword of dataStoreKeywords) {
        if (lowerFullText.includes(keyword)) {
            // Essayer d'extraire le nom complet du magasin de données
            const name = extractDataStoreName(fullText, keyword);
            
            // Éviter les doublons
            if (!dataObjects.some(obj => obj.name.toLowerCase() === name.toLowerCase() && obj.type === 'magasin')) {
                dataObjects.push({
                    id: `d${dataObjects.length + 1}`,
                    name: name,
                    type: 'magasin',
                    accessMode: 'indéterminé',
                    associatedActivities: []
                });
            }
        }
    }
    
    // Rechercher des mentions explicites d'objets de données
    for (const keyword of dataObjectKeywords) {
        if (lowerFullText.includes(keyword)) {
            // Essayer d'extraire le nom complet de l'objet de données
            const name = extractDataObjectName(fullText, keyword);
            
            // Éviter les doublons
            if (!dataObjects.some(obj => obj.name.toLowerCase() === name.toLowerCase() && obj.type === 'objet')) {
                dataObjects.push({
                    id: `d${dataObjects.length + 1}`,
                    name: name,
                    type: 'objet',
                    accessMode: 'indéterminé',
                    associatedActivities: []
                });
            }
        }
    }
    
    // Traiter chaque phrase pour trouver les relations entre données et activités
    sentences.forEach((sentence, index) => {
        const lowerSentence = sentence.toLowerCase();
        
        // Pour chaque donnée identifiée, vérifier si la phrase la mentionne
        dataObjects.forEach(dataObject => {
            const dataNameLower = dataObject.name.toLowerCase();
            const keywordVariants = getDataKeywordVariants(dataObject.name, dataObject.type);
            
            // Vérifier si la phrase mentionne cette donnée
            if (keywordVariants.some(variant => lowerSentence.includes(variant.toLowerCase()))) {
                // Déterminer le mode d'accès (lecture/écriture/mise à jour)
                const accessMode = determineDataAccessMode(sentence, dataObject.name);
                
                // Si un mode d'accès est déterminé, associer cette donnée à l'activité correspondante
                if (accessMode !== 'indéterminé') {
                    // Mettre à jour le mode d'accès si nécessaire
                    if (dataObject.accessMode === 'indéterminé') {
                        dataObject.accessMode = accessMode;
                    }
                }
            }
        });
    });
    
    // Déductions spécifiques pour le cas "Remboursement de dépenses"
    if (lowerFullText.includes('remboursement') && lowerFullText.includes('dépense')) {
        // Assurer que les objets de données clés sont présents
        ensureDataObject(dataObjects, 'Rapport de dépenses', 'objet');
        ensureDataObject(dataObjects, 'Employés', 'magasin');
    }
    
    // Déductions spécifiques pour le cas "Bureau en folie"
    if (lowerFullText.includes('bureau en folie') || 
        (lowerFullText.includes('commande') && lowerFullText.includes('client'))) {
        ensureDataObject(dataObjects, 'Commandes', 'magasin');
        ensureDataObject(dataObjects, 'Clients', 'magasin');
    }
    
    return dataObjects;
}

/**
 * S'assure qu'un objet de données existe, en le créant si nécessaire
 * @param {Object[]} dataObjects - Liste des objets de données
 * @param {string} name - Nom de l'objet de données
 * @param {string} type - Type de l'objet (magasin ou objet)
 */
function ensureDataObject(dataObjects, name, type) {
    if (!dataObjects.some(d => d.name.toLowerCase() === name.toLowerCase() && d.type === type)) {
        dataObjects.push({
            id: `d${dataObjects.length + 1}`,
            name: name,
            type: type,
            accessMode: 'indéterminé',
            associatedActivities: []
        });
    }
}

/**
 * Génère des variantes de mots-clés pour un objet de données
 * @param {string} name - Nom de l'objet de données
 * @param {string} type - Type de l'objet (magasin ou objet)
 * @return {string[]} - Variantes de mots-clés
 */
function getDataKeywordVariants(name, type) {
    const baseName = name.toLowerCase();
    const variants = [baseName];
    
    // Variantes communes pour les magasins de données
    if (type === 'magasin') {
        if (baseName.includes('base de données')) {
            variants.push(baseName.replace('base de données', 'bd'));
            variants.push(baseName.replace('base de données', 'bdd'));
        }
        
        if (baseName.includes('système')) {
            variants.push(baseName.replace('système', 'système d\'information'));
            variants.push(baseName.replace('système', 'si'));
        }
    }
    
    // Variantes communes pour les objets de données
    if (type === 'objet') {
        if (baseName.includes('rapport')) {
            variants.push(baseName.replace('rapport', 'document'));
            variants.push(baseName.replace('rapport', 'formulaire'));
        }
        
        if (baseName.includes('bon de')) {
            variants.push(baseName.replace('bon de', 'formulaire de'));
        }
    }
    
    // Ajouter des variantes plurielles/singulières
    if (baseName.endsWith('s')) {
        variants.push(baseName.substring(0, baseName.length - 1));
    } else {
        variants.push(baseName + 's');
    }
    
    return variants;
}

/**
 * Détermine le mode d'accès à un objet de données
 * @param {string} sentence - Phrase mentionnant l'objet
 * @param {string} dataName - Nom de l'objet de données
 * @return {string} - Mode d'accès (lecture, création, mise à jour)
 */
function determineDataAccessMode(sentence, dataName) {
    const lowerSentence = sentence.toLowerCase();
    const lowerDataName = dataName.toLowerCase();
    
    // Mots-clés pour la création
    if (lowerSentence.includes('crée') || 
        lowerSentence.includes('génère') || 
        lowerSentence.includes('produit') || 
        lowerSentence.includes('rédige') ||
        lowerSentence.includes('élabore') ||
        lowerSentence.includes('établit') ||
        lowerSentence.includes('prépare') ||
        lowerSentence.includes('initialise')) {
        
        // Vérifier si l'objet de données est l'objet de l'action
        if (lowerSentence.indexOf(lowerDataName) > lowerSentence.indexOf('crée') ||
            lowerSentence.indexOf(lowerDataName) > lowerSentence.indexOf('génère') ||
            lowerSentence.indexOf(lowerDataName) > lowerSentence.indexOf('produit') ||
            lowerSentence.indexOf(lowerDataName) > lowerSentence.indexOf('rédige') ||
            lowerSentence.indexOf(lowerDataName) > lowerSentence.indexOf('élabore') ||
            lowerSentence.indexOf(lowerDataName) > lowerSentence.indexOf('établit') ||
            lowerSentence.indexOf(lowerDataName) > lowerSentence.indexOf('prépare') ||
            lowerSentence.indexOf(lowerDataName) > lowerSentence.indexOf('initialise')) {
            return 'création';
        }
    }
    
    // Mots-clés pour la mise à jour
    if (lowerSentence.includes('met à jour') || 
        lowerSentence.includes('modifie') || 
        lowerSentence.includes('actualise') ||
        lowerSentence.includes('complète') ||
        lowerSentence.includes('révise') ||
        lowerSentence.includes('édite')) {
        
        if (lowerSentence.indexOf(lowerDataName) > lowerSentence.indexOf('met à jour') ||
            lowerSentence.indexOf(lowerDataName) > lowerSentence.indexOf('modifie') ||
            lowerSentence.indexOf(lowerDataName) > lowerSentence.indexOf('actualise') ||
            lowerSentence.indexOf(lowerDataName) > lowerSentence.indexOf('complète') ||
            lowerSentence.indexOf(lowerDataName) > lowerSentence.indexOf('révise') ||
            lowerSentence.indexOf(lowerDataName) > lowerSentence.indexOf('édite')) {
            return 'mise à jour';
        }
    }
    
    // Mots-clés pour la lecture
    if (lowerSentence.includes('consulte') || 
        lowerSentence.includes('vérifie') || 
        lowerSentence.includes('lit') ||
        lowerSentence.includes('regarde') ||
        lowerSentence.includes('observe') ||
        lowerSentence.includes('recherche dans') ||
        lowerSentence.includes('identifie dans')) {
        
        if (lowerSentence.indexOf(lowerDataName) > lowerSentence.indexOf('consulte') ||
            lowerSentence.indexOf(lowerDataName) > lowerSentence.indexOf('vérifie') ||
            lowerSentence.indexOf(lowerDataName) > lowerSentence.indexOf('lit') ||
            lowerSentence.indexOf(lowerDataName) > lowerSentence.indexOf('regarde') ||
            lowerSentence.indexOf(lowerDataName) > lowerSentence.indexOf('observe') ||
            lowerSentence.indexOf(lowerDataName) > lowerSentence.indexOf('recherche dans') ||
            lowerSentence.indexOf(lowerDataName) > lowerSentence.indexOf('identifie dans')) {
            return 'lecture';
        }
    }
    
    // Inférence basée sur le contexte
    if (lowerSentence.includes('dans') && 
        lowerSentence.indexOf(lowerDataName) > lowerSentence.indexOf('dans')) {
        // La donnée est mentionnée après "dans", suggérant une recherche/lecture
        return 'lecture';
    }
    
    if (lowerSentence.includes('à partir de') && 
        lowerSentence.indexOf(lowerDataName) > lowerSentence.indexOf('à partir de')) {
        // La donnée est utilisée comme source, suggérant une lecture
        return 'lecture';
    }
    
    if (lowerSentence.includes('enregistre') && 
        lowerSentence.indexOf(lowerDataName) > lowerSentence.indexOf('enregistre')) {
        // La donnée est l'objet d'un enregistrement
        return 'création';
    }
    
    return 'indéterminé';
}

/**
 * Extrait le nom d'un magasin de données
 * @param {string} text - Texte contenant la mention du magasin
 * @param {string} keyword - Mot-clé ayant identifié le magasin
 * @return {string} - Nom du magasin
 */
function extractDataStoreName(text, keyword) {
    const lowerText = text.toLowerCase();
    const keywordIndex = lowerText.indexOf(keyword);
    
    if (keywordIndex !== -1) {
        const keywordContext = text.substring(Math.max(0, keywordIndex - 30), 
                                             Math.min(text.length, keywordIndex + keyword.length + 30));
        
        // Rechercher des descripteurs de type "base de données des X"
        const descriptorPattern = new RegExp(`(base de données|système|dossier|filière)\\s+(des?|du|de la|de l'|d')\\s+([a-zéèêàçùïëâîôû-]+)`, 'i');
        const descriptorMatch = keywordContext.match(descriptorPattern);
        
        if (descriptorMatch) {
            return capitalizeFirstLetter(descriptorMatch[1] + ' ' + 
                                       descriptorMatch[2] + ' ' + 
                                       descriptorMatch[3]);
        }
        
        // Rechercher des descripteurs après le mot-clé
        const afterPattern = new RegExp(`${keyword}\\s+(des?|du|de la|de l'|d')\\s+([a-zéèêàçùïëâîôû-]+)`, 'i');
        const afterMatch = keywordContext.match(afterPattern);
        
        if (afterMatch) {
            return capitalizeFirstLetter(keyword + ' ' + afterMatch[1] + ' ' + afterMatch[2]);
        }
        
        // Rechercher des adjectifs qualifiant le mot-clé
        const adjectivePattern = new RegExp(`(${keyword})\\s+([a-zéèêàçùïëâîôû-]+)`, 'i');
        const adjectiveMatch = keywordContext.match(adjectivePattern);
        
        if (adjectiveMatch) {
            return capitalizeFirstLetter(adjectiveMatch[1] + ' ' + adjectiveMatch[2]);
        }
    }
    
    // Cas spécifiques communs
    if (keyword === 'base de données' && lowerText.includes('employé')) {
        return 'Base de données des employés';
    }
    
    if (keyword === 'base de données' && lowerText.includes('client')) {
        return 'Base de données des clients';
    }
    
    if (keyword === 'système' && (lowerText.includes('information') || lowerText.includes('si'))) {
        return 'Système d\'information';
    }
    
    if (keyword === 'pgi' || keyword === 'erp') {
        return 'PGI';
    }
    
    if ((keyword === 'filière' || keyword === 'dossier') && lowerText.includes('commande')) {
        return capitalizeFirstLetter(keyword + ' des commandes');
    }
    
    if ((keyword === 'filière' || keyword === 'dossier') && lowerText.includes('livraison')) {
        return capitalizeFirstLetter(keyword + ' des livraisons');
    }
    
    // Par défaut
    return capitalizeFirstLetter(keyword);
}

/**
 * Extrait le nom d'un objet de données
 * @param {string} text - Texte contenant la mention de l'objet
 * @param {string} keyword - Mot-clé ayant identifié l'objet
 * @return {string} - Nom de l'objet
 */
function extractDataObjectName(text, keyword) {
    const lowerText = text.toLowerCase();
    const keywordIndex = lowerText.indexOf(keyword);
    
    if (keywordIndex !== -1) {
        const keywordContext = text.substring(Math.max(0, keywordIndex - 30), 
                                             Math.min(text.length, keywordIndex + keyword.length + 30));
        
        // Rechercher des descripteurs de type "rapport de X"
        const descriptorPattern = new RegExp(`(${keyword})\\s+(des?|du|de la|de l'|d')\\s+([a-zéèêàçùïëâîôû-]+)`, 'i');
        const descriptorMatch = keywordContext.match(descriptorPattern);
        
        if (descriptorMatch) {
            return capitalizeFirstLetter(descriptorMatch[1] + ' ' + 
                                       descriptorMatch[2] + ' ' + 
                                       descriptorMatch[3]);
        }
        
        // Rechercher des adjectifs qualifiant le mot-clé
        const adjectivePattern = new RegExp(`(${keyword})\\s+([a-zéèêàçùïëâîôû-]+)`, 'i');
        const adjectiveMatch = keywordContext.match(adjectivePattern);
        
        if (adjectiveMatch && 
            !['de', 'du', 'des', 'la', 'le', 'les', 'un', 'une'].includes(adjectiveMatch[2])) {
            return capitalizeFirstLetter(adjectiveMatch[1] + ' ' + adjectiveMatch[2]);
        }
    }
    
    // Cas spécifiques communs
    if (keyword === 'rapport' && lowerText.includes('dépense')) {
        return 'Rapport de dépenses';
    }
    
    if ((keyword === 'bon' || keyword === 'formulaire') && lowerText.includes('commande')) {
        return keyword === 'bon' ? 'Bon de commande' : 'Formulaire de commande';
    }
    
    if ((keyword === 'bon' || keyword === 'formulaire') && lowerText.includes('livraison')) {
        return keyword === 'bon' ? 'Bon de livraison' : 'Formulaire de livraison';
    }
    
    if ((keyword === 'formulaire' || keyword === 'document') && lowerText.includes('dépense')) {
        return capitalizeFirstLetter(keyword + ' de dépenses');
    }
    
    if (keyword === 'facture') {
        return 'Facture';
    }
    
    if (keyword === 'reçu') {
        return 'Reçu';
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
    const lowerFullText = fullText.toLowerCase();
    
    // Ajouter l'événement de début par défaut
    events.push({
        id: 'start',
        type: 'début',
        name: inferStartEventName(sentences[0], fullText),
        position: 0
    });
    
    // Rechercher les événements de fin
    sentences.forEach((sentence, index) => {
        if (sentence.toLowerCase().includes('met fin au processus') || 
            sentence.toLowerCase().includes('ce qui met fin') || 
            sentence.toLowerCase().includes('fin du processus') ||
            sentence.toLowerCase().includes('termine le processus') ||
            (index === sentences.length - 1 && !events.some(e => e.type === 'fin'))) {
            
            events.push({
                id: 'end' + (events.filter(e => e.type === 'fin').length + 1),
                type: 'fin',
                name: inferEndEventName(sentence, fullText),
                position: index
            });
        }
    });
    
    // Rechercher les événements intermédiaires (minuterie, message)
    sentences.forEach((sentence, index) => {
        const lowerSentence = sentence.toLowerCase();
        
        // Minuteries
        if (lowerSentence.includes('mardi matin') || 
            lowerSentence.includes('le lendemain') || 
            lowerSentence.includes('chaque matin') ||
            lowerSentence.includes('tous les matins') ||
            lowerSentence.includes('le matin') ||
            lowerSentence.match(/\ble\s+(?:lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\s+matin\b/i) ||
            lowerSentence.match(/\bvers\s+\d+h/i) ||
            lowerSentence.match(/\bà\s+\d+h/i)) {
            
            events.push({
                id: 'e' + (events.length + 1),
                type: 'intermédiaire-minuterie',
                name: extractTemporalEvent(sentence),
                position: index
            });
        }
        
        // Messages
        if ((lowerSentence.includes('envoie') || lowerSentence.includes('transmet')) && 
            (lowerSentence.includes('message') || lowerSentence.includes('courriel') || 
             lowerSentence.includes('notification') || lowerSentence.includes('communique'))) {
            
            events.push({
                id: 'e' + (events.length + 1),
                type: 'intermédiaire-message',
                name: 'Message ' + extractMessageEventName(sentence),
                position: index,
                isEmission: true
            });
        }
        
        if ((lowerSentence.includes('reçoit') || lowerSentence.includes('attend')) && 
            (lowerSentence.includes('message') || lowerSentence.includes('courriel') || 
             lowerSentence.includes('notification') || lowerSentence.includes('réponse'))) {
            
            events.push({
                id: 'e' + (events.length + 1),
                type: 'intermédiaire-message',
                name: 'Réception ' + extractMessageEventName(sentence),
                position: index,
                isEmission: false
            });
        }
    });
    
    // Événements de fin basés sur des cas spécifiques
    if (lowerFullText.includes('rapport') && lowerFullText.includes('approuvé')) {
        // Ajouter un événement de fin pour le rapport approuvé s'il n'existe pas déjà
        if (!events.some(e => e.type === 'fin' && e.name.toLowerCase().includes('approuvé'))) {
            events.push({
                id: 'end' + (events.filter(e => e.type === 'fin').length + 1),
                type: 'fin',
                name: 'Rapport approuvé',
                position: sentences.length
            });
        }
    }

if (lowerFullText.includes('rapport') && lowerFullText.includes('refusé')) {
        // Ajouter un événement de fin pour le rapport refusé s'il n'existe pas déjà
        if (!events.some(e => e.type === 'fin' && e.name.toLowerCase().includes('refusé'))) {
            events.push({
                id: 'end' + (events.filter(e => e.type === 'fin').length + 1),
                type: 'fin',
                name: 'Rapport refusé',
                position: sentences.length
            });
        }
    }
    
    if (lowerFullText.includes('command') && lowerFullText.includes('livr')) {
        // Ajouter un événement de fin pour la commande livrée s'il n'existe pas déjà
        if (!events.some(e => e.type === 'fin' && e.name.toLowerCase().includes('livré'))) {
            events.push({
                id: 'end' + (events.filter(e => e.type === 'fin').length + 1),
                type: 'fin',
                name: 'Commande livrée',
                position: sentences.length
            });
        }
    }
    
    if (lowerFullText.includes('command') && lowerFullText.includes('annul')) {
        // Ajouter un événement de fin pour la commande annulée s'il n'existe pas déjà
        if (!events.some(e => e.type === 'fin' && e.name.toLowerCase().includes('annulé'))) {
            events.push({
                id: 'end' + (events.filter(e => e.type === 'fin').length + 1),
                type: 'fin',
                name: 'Commande annulée',
                position: sentences.length
            });
        }
    }
    
    return events;
}

/**
 * Infère le nom d'un événement de début
 * @param {string} firstSentence - Première phrase du scénario
 * @param {string} fullText - Texte complet pour le contexte
 * @return {string} - Nom de l'événement de début
 */
function inferStartEventName(firstSentence, fullText) {
    const lowerFirstSentence = firstSentence.toLowerCase();
    const lowerFullText = fullText.toLowerCase();
    
    // Détecter les mentions explicites du démarrage du processus
    if (lowerFirstSentence.includes('commence') || 
        lowerFirstSentence.includes('débute') || 
        lowerFirstSentence.includes('initial')) {
        
        // Identifier ce qui déclenche le processus
        const triggers = [
            { keyword: 'réception d\'une', result: 'Réception commande' },
            { keyword: 'réception d\'un', result: 'Réception demande' },
            { keyword: 'récepti', result: 'Réception demande' },
            { keyword: 'commande', result: 'Réception commande' },
            { keyword: 'demande', result: 'Réception demande' },
            { keyword: 'rapport', result: 'Réception rapport' },
            { keyword: 'formulaire', result: 'Réception formulaire' },
            { keyword: 'message', result: 'Réception message' },
            { keyword: 'courriel', result: 'Réception courriel' },
            { keyword: 'téléphone', result: 'Appel téléphonique' }
        ];
        
        for (const trigger of triggers) {
            if (lowerFirstSentence.includes(trigger.keyword)) {
                return trigger.result;
            }
        }
    }
    
    // Cas spécifiques basés sur le contexte global
    if (lowerFullText.includes('remboursement') && lowerFullText.includes('dépense')) {
        return 'Réception rapport de dépenses';
    }
    
    if (lowerFullText.includes('commande') && lowerFullText.includes('client')) {
        return 'Réception commande';
    }
    
    if (lowerFullText.includes('facture') || lowerFullText.includes('paiement')) {
        return 'Réception facture';
    }
    
    if (lowerFullText.includes('validation') || lowerFullText.includes('approbation')) {
        return 'Demande de validation';
    }
    
    // Par défaut
    return 'Début du processus';
}

/**
 * Infère le nom d'un événement de fin
 * @param {string} sentence - Phrase mentionnant la fin du processus
 * @param {string} fullText - Texte complet pour le contexte
 * @return {string} - Nom de l'événement de fin
 */
function inferEndEventName(sentence, fullText) {
    const lowerSentence = sentence.toLowerCase();
    const lowerFullText = fullText.toLowerCase();
    
    // Extraire le nom de la fin du processus à partir de mentions explicites
    if (lowerSentence.includes('met fin au processus avec') || 
        lowerSentence.includes('se termine avec') ||
        lowerSentence.includes('ce qui met fin au processus avec')) {
        
        // Extraire la description après "avec"
        const withIndex = Math.max(
            lowerSentence.indexOf('avec'),
            lowerSentence.indexOf('ce qui met fin au processus avec')
        );
        
        if (withIndex !== -1) {
            let endName = sentence.substring(withIndex + 5).trim();
            endName = endName.replace(/\.$/, '').trim(); // Supprimer le point final
            return capitalizeFirstLetter(endName);
        }
    }
    
    // Rechercher des motifs spécifiques de fin de processus
    const endPatterns = [
        { pattern: /command.*annul/i, name: 'Commande annulée' },
        { pattern: /command.*livr/i, name: 'Commande livrée' },
        { pattern: /command.*complét/i, name: 'Commande complétée' },
        { pattern: /command.*termin/i, name: 'Commande terminée' },
        { pattern: /rapport.*approuv/i, name: 'Rapport approuvé' },
        { pattern: /rapport.*refus/i, name: 'Rapport refusé' },
        { pattern: /paiement.*effectu/i, name: 'Paiement effectué' },
        { pattern: /paiement.*complét/i, name: 'Paiement complété' },
        { pattern: /demande.*approuv/i, name: 'Demande approuvée' },
        { pattern: /demande.*refus/i, name: 'Demande refusée' }
    ];
    
    for (const pattern of endPatterns) {
        if (lowerSentence.match(pattern.pattern)) {
            return pattern.name;
        }
    }
    
    // Cas spécifiques basés sur le contexte global
    if (lowerFullText.includes('remboursement') && lowerFullText.includes('dépense')) {
        if (lowerSentence.includes('approuvé') || lowerSentence.includes('accepté')) {
            return 'Dépenses remboursées';
        } else if (lowerSentence.includes('refusé') || lowerSentence.includes('rejeté')) {
            return 'Dépenses refusées';
        }
    }
    
    // Par défaut
    return 'Fin du processus';
}

/**
 * Extrait un événement temporel à partir d'une phrase
 * @param {string} sentence - Phrase décrivant l'événement temporel
 * @return {string} - Description de l'événement temporel
 */
function extractTemporalEvent(sentence) {
    const lowerSentence = sentence.toLowerCase();
    
    // Extraire les mentions temporelles spécifiques
    if (lowerSentence.match(/\ble\s+(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\s+matin\b/i)) {
        const match = lowerSentence.match(/\ble\s+(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\s+matin\b/i);
        return capitalizeFirstLetter(match[0]);
    }
    
    if (lowerSentence.includes('le lendemain matin')) {
        return 'Le lendemain matin';
    }
    
    if (lowerSentence.includes('chaque matin') || lowerSentence.includes('tous les matins')) {
        return 'Chaque matin';
    }
    
    if (lowerSentence.includes('le matin')) {
        return 'Le matin';
    }
    
    // Heures spécifiques
    const timePattern = /\b(?:vers|à)\s+(\d+)h(?:(\d+))?\b/i;
    const timeMatch = lowerSentence.match(timePattern);
    if (timeMatch) {
        const hour = timeMatch[1];
        const minute = timeMatch[2] ? timeMatch[2] : '00';
        return `À ${hour}h${minute}`;
    }
    
    // Par défaut
    return 'Délai';
}

/**
 * Extrait le nom d'un événement de message
 * @param {string} sentence - Phrase décrivant l'événement de message
 * @return {string} - Description de l'événement de message
 */
function extractMessageEventName(sentence) {
    const lowerSentence = sentence.toLowerCase();
    
    // Extraire le contenu du message
    const messageTypes = [
        { keyword: 'facture', name: 'facture' },
        { keyword: 'paiement', name: 'paiement' },
        { keyword: 'confirmation', name: 'confirmation' },
        { keyword: 'commande', name: 'commande' },
        { keyword: 'rapport', name: 'rapport' },
        { keyword: 'autorisation', name: 'autorisation' },
        { keyword: 'notification', name: 'notification' },
        { keyword: 'avis', name: 'avis' },
        { keyword: 'demande', name: 'demande' }
    ];
    
    for (const type of messageTypes) {
        if (lowerSentence.includes(type.keyword)) {
            return type.name;
        }
    }
    
    // Par défaut
    return 'message';
}

/**
 * Analyse la structure du processus pour déterminer les relations entre les composants
 * @param {Object} components - Composants extraits du processus
 * @param {string} processedText - Texte prétraité du scénario
 * @return {Object} - Structure complète du processus
 */
function analyzeProcessStructure(components, processedText) {
    // Structure pour stocker l'organisation du processus
    const structure = {
        actors: components.actors,
        activities: components.activities,
        decisions: components.decisions,
        dataObjects: components.dataObjects,
        events: components.events,
        swimlanes: [],
        sequenceFlows: [],
        messageFlows: [],
        associations: []
    };
    
    // Identifier les couloirs de la piscine principale
    const internalActors = components.actors.filter(actor => actor.isInternal && actor.requiresLane);
    
    // Affiner les rôles pour créer des couloirs pour la piscine principale
    structure.swimlanes = internalActors.map(actor => ({
        id: `l${structure.swimlanes.length + 1}`,
        name: actor.name,
        actor: actor.name,
        activities: components.activities.filter(activity => activity.actor === actor.name),
        decisions: components.decisions.filter(decision => decision.actor === actor.name)
    }));
    
    // Ajouter les acteurs externes comme piscines séparées
    const externalActors = components.actors.filter(actor => !actor.isInternal);
    externalActors.forEach(actor => {
        structure.swimlanes.push({
            id: `p${structure.swimlanes.length + 1}`,
            name: actor.name,
            actor: actor.name,
            isExternalPool: true,
            activities: []
        });
    });
    
    // Déterminer les flux de séquence entre les activités et les décisions
    components.activities.forEach(activity => {
        if (activity.dependsOn) {
            // Flux depuis une activité dépendante d'une condition
            structure.sequenceFlows.push({
                id: `sf${structure.sequenceFlows.length + 1}`,
                source: activity.dependsOn,
                target: activity.id,
                condition: activity.isBranchActivity ? (activity.position % 2 === 0 ? 'Oui' : 'Non') : null
            });
        } else {
            // Tenter de trouver l'activité ou la décision précédente selon la position
            const previousElements = [...components.activities, ...components.decisions]
                .filter(elem => elem.position < activity.position)
                .sort((a, b) => b.position - a.position);
            
            if (previousElements.length > 0) {
                structure.sequenceFlows.push({
                    id: `sf${structure.sequenceFlows.length + 1}`,
                    source: previousElements[0].id,
                    target: activity.id,
                    condition: null
                });
            } else {
                // Si aucune activité ou décision précédente n'est trouvée, relier à l'événement de début
                structure.sequenceFlows.push({
                    id: `sf${structure.sequenceFlows.length + 1}`,
                    source: 'start',
                    target: activity.id,
                    condition: null
                });
            }
        }
    });
    
    // Déterminer les flux de séquence pour les décisions
    components.decisions.forEach(decision => {
        if (!decision.isConvergence) {
            // Trouver les activités précédentes
            const previousActivities = components.activities
                .filter(activity => activity.position < decision.position)
                .sort((a, b) => b.position - a.position);
            
            if (previousActivities.length > 0) {
                structure.sequenceFlows.push({
                    id: `sf${structure.sequenceFlows.length + 1}`,
                    source: previousActivities[0].id,
                    target: decision.id,
                    condition: null
                });
            } else {
                // Si aucune activité précédente n'est trouvée, relier à l'événement de début
                structure.sequenceFlows.push({
                    id: `sf${structure.sequenceFlows.length + 1}`,
                    source: 'start',
                    target: decision.id,
                    condition: null
                });
            }
            
            // Relier les branches "Oui" et "Non" de la décision
            if (decision.positiveOutcome) {
                // Trouver l'activité ou la décision qui correspond à la conséquence positive
                const positiveTarget = findTargetForOutcome(decision.positiveOutcome, components);
                
                if (positiveTarget) {
                    structure.sequenceFlows.push({
                        id: `sf${structure.sequenceFlows.length + 1}`,
                        source: decision.id,
                        target: positiveTarget.id,
                        condition: 'Oui'
                    });
                }
            }
            
            if (decision.negativeOutcome) {
                // Trouver l'activité ou la décision qui correspond à la conséquence négative
                const negativeTarget = findTargetForOutcome(decision.negativeOutcome, components);
                
                if (negativeTarget) {
                    structure.sequenceFlows.push({
                        id: `sf${structure.sequenceFlows.length + 1}`,
                        source: decision.id,
                        target: negativeTarget.id,
                        condition: 'Non'
                    });
                }
            }
        } else {
            // Passerelle de convergence
            const recentActivities = components.activities
                .filter(activity => activity.position < decision.position && decision.position - activity.position <= 3)
                .sort((a, b) => b.position - a.position);
            
            // Relier les activités récentes à la passerelle de convergence
            recentActivities.forEach(activity => {
                structure.sequenceFlows.push({
                    id: `sf${structure.sequenceFlows.length + 1}`,
                    source: activity.id,
                    target: decision.id,
                    condition: null
                });
            });
            
            // Relier la passerelle de convergence à l'activité suivante
            const nextActivities = components.activities
                .filter(activity => activity.position > decision.position)
                .sort((a, b) => a.position - b.position);
            
            if (nextActivities.length > 0) {
                structure.sequenceFlows.push({
                    id: `sf${structure.sequenceFlows.length + 1}`,
                    source: decision.id,
                    target: nextActivities[0].id,
                    condition: null
                });
            }
        }
    });
    
    // Relier les activités aux événements de fin
    components.activities.forEach(activity => {
        if (activity.isEndActivity) {
            // Trouver un événement de fin approprié
            const endEvent = components.events.find(event => 
                event.type === 'fin' && 
                (event.position === activity.position || 
                 Math.abs(event.position - activity.position) <= 2)
            );
            
            if (endEvent) {
                structure.sequenceFlows.push({
                    id: `sf${structure.sequenceFlows.length + 1}`,
                    source: activity.id,
                    target: endEvent.id,
                    condition: null
                });
            }
        }
    });
    
    // Identifier les flux de message entre les acteurs internes et externes
    const interactionVerbs = ['envoie', 'transmet', 'communique', 'notifie', 'informe'];
    
    components.activities.forEach(activity => {
        // Vérifier si l'activité implique une interaction avec un acteur externe
        const lowerActivityDesc = activity.description.toLowerCase();
        
        if (interactionVerbs.some(verb => lowerActivityDesc.includes(verb))) {
            // Identifier l'acteur externe concerné
            externalActors.forEach(actor => {
                if (lowerActivityDesc.includes(actor.name.toLowerCase())) {
                    // Créer un flux de message de l'activité vers l'acteur externe
                    structure.messageFlows.push({
                        id: `mf${structure.messageFlows.length + 1}`,
                        source: activity.id,
                        target: structure.swimlanes.find(s => s.actor === actor.name).id,
                        name: inferMessageName(activity.description, actor.name)
                    });
                }
            });
        }
    });
    
    // Identifier les associations entre les activités et les objets de données
    components.activities.forEach(activity => {
        if (activity.hasDataInteraction) {
            components.dataObjects.forEach(dataObject => {
                // Vérifier si l'activité mentionne l'objet de données
                const lowerActivityDesc = activity.description.toLowerCase();
                const lowerDataName = dataObject.name.toLowerCase();
                
                if (lowerActivityDesc.includes(lowerDataName)) {
                    // Déterminer le mode d'accès si indéterminé
                    let accessMode = dataObject.accessMode;
                    if (accessMode === 'indéterminé') {
                        accessMode = determineDataAccessMode(activity.description, dataObject.name);
                    }
                    
                    // Créer une association entre l'activité et l'objet de données
                    structure.associations.push({
                        id: `as${structure.associations.length + 1}`,
                        source: activity.id,
                        target: dataObject.id,
                        direction: inferAssociationDirection(accessMode)
                    });
                }
            });
        }
    });
    
    return structure;
}

/**
 * Trouve l'élément cible correspondant à une conséquence
 * @param {string} outcome - Description de la conséquence
 * @param {Object} components - Composants du processus
 * @return {Object} - Élément cible (activité ou décision)
 */
function findTargetForOutcome(outcome, components) {
    const lowerOutcome = outcome.toLowerCase();
    
    // Rechercher une activité dont la description correspond à la conséquence
    const matchingActivity = components.activities.find(activity => 
        areStringSimilar(activity.description, outcome) ||
        lowerOutcome.includes(activity.name.toLowerCase())
    );
    
    if (matchingActivity) {
        return matchingActivity;
    }
    
    // Rechercher une décision dont la description correspond à la conséquence
    const matchingDecision = components.decisions.find(decision => 
        areStringSimilar(decision.condition, outcome) ||
        lowerOutcome.includes(decision.question.toLowerCase())
    );
    
    if (matchingDecision) {
        return matchingDecision;
    }
    
    return null;
}

/**
 * Infère le nom d'un message à partir d'une description d'activité
 * @param {string} activityDesc - Description de l'activité
 * @param {string} targetActor - Nom de l'acteur cible
 * @return {string} - Nom du message
 */
function inferMessageName(activityDesc, targetActor) {
    const lowerDesc = activityDesc.toLowerCase();
    
    // Messages courants
    const commonMessages = [
        { keyword: 'facture', name: 'Facture' },
        { keyword: 'paiement', name: 'Paiement' },
        { keyword: 'confirmation', name: 'Confirmation' },
        { keyword: 'commande', name: 'Commande' },
        { keyword: 'rapport', name: 'Rapport' },
        { keyword: 'avis', name: 'Avis' },
        { keyword: 'notification', name: 'Notification' },
        { keyword: 'demande', name: 'Demande' },
        { keyword: 'information', name: 'Information' }
    ];
    
    for (const message of commonMessages) {
        if (lowerDesc.includes(message.keyword)) {
            return message.name;
        }
    }
    
    // Si aucun message courant n'est identifié, inférer à partir du contexte
    if (lowerDesc.includes('envoie')) {
        const afterEnvoie = lowerDesc.substring(lowerDesc.indexOf('envoie') + 6);
        const firstNoun = afterEnvoie.split(/[\s,;.]/)[0];
        
        if (firstNoun && firstNoun.length > 2) {
            return capitalizeFirstLetter(firstNoun);
        }
    }
    
    // Par défaut
    return 'Message';
}

/**
 * Infère la direction d'une association
 * @param {string} accessMode - Mode d'accès (lecture, création, mise à jour)
 * @return {string} - Direction de l'association
 */
function inferAssociationDirection(accessMode) {
    switch (accessMode) {
        case 'lecture':
            return 'to-source';
        case 'création':
            return 'to-target';
        case 'mise à jour':
            return 'both';
        default:
            return 'none';
    }
}

/**
 * Formate la description BPMN en texte
 * @param {Object} structure - Structure du processus
 * @return {string} - Description BPMN formatée
 */
function formatBPMNDescription(structure) {
    let description = '';
    
    // Décrire les piscines et couloirs
    description += "// Description des piscines et couloirs\n";
    
    // Compter le nombre de piscines externes
    const externalPools = structure.swimlanes.filter(lane => lane.isExternalPool);
    
    // Décrire les piscines externes
    externalPools.forEach(pool => {
        description += `Tracer une piscine pour l'acteur externe « ${pool.name} ».\n\n`;
    });
    
    // Décrire la piscine principale avec ses couloirs
    const internalLanes = structure.swimlanes.filter(lane => !lane.isExternalPool);
    if (internalLanes.length > 0) {
        description += `Tracer une piscine « Processus de ${inferProcessName(structure)} » dans laquelle on retrouve `;
        
        if (internalLanes.length === 1) {
            description += `un couloir pour l'acteur interne: « ${internalLanes[0].name} ».\n\n`;
        } else {
            description += `${internalLanes.length} couloirs pour les ${internalLanes.length} acteurs internes: `;
            const laneNames = internalLanes.map(lane => `« ${lane.name} »`).join(', ');
            description += `${laneNames}.\n\n`;
        }
    }
    
    // Décrire les événements de début
    const startEvents = structure.events.filter(event => event.type === 'début');
    if (startEvents.length > 0) {
        description += "// Description des événements de début\n";
        
        startEvents.forEach(event => {
            // Si c'est un événement de début message, le relier à l'acteur externe
            if (event.name.toLowerCase().includes('réception')) {
                // Identifier l'acteur externe probable
                const externalActorName = inferExternalActorForEvent(event, structure);
                
                if (externalActorName) {
                    // Tracer un événement de début dans la piscine externe
                    description += `Tracer un événement début générique à la frontière de la piscine « ${externalActorName} ».\n\n`;
                    
                    // Tracer un événement de début message dans la piscine principale
                    description += `Tracer un événement début message au début du couloir « ${internalLanes[0].name} » et relier l'événement de début générique à l'événement début message par le flux de message « ${event.name} ».\n\n`;
                } else {
                    // Si aucun acteur externe n'est identifié, simplement tracer un événement de début générique
                    description += `Tracer un événement début générique au début du couloir « ${internalLanes[0].name} ».\n\n`;
                }
            } else {
                // Événement de début générique
                description += `Tracer un événement début générique au début du couloir « ${internalLanes[0].name} ».\n\n`;
            }
        });
    }
    
    // Décrire les activités et leurs connexions
    description += "// Description des activités et flux de séquence\n";
    
    // Trier les activités par position
    const sortedActivities = [...structure.activities].sort((a, b) => a.position - b.position);
    
    sortedActivities.forEach(activity => {
        // Décrire l'activité dans son couloir
        const activityLane = internalLanes.find(lane => lane.actor === activity.actor);
        if (activityLane) {
            description += `Tracer l'activité ${activity.type} « ${activity.name} » dans le couloir « ${activityLane.name} ».\n\n`;
            
            // Décrire les connexions entrantes
            const incomingFlows = structure.sequenceFlows.filter(flow => flow.target === activity.id);
            incomingFlows.forEach(flow => {
                const sourceElement = getElementById(flow.source, structure);
                if (sourceElement) {
                    const sourceType = getElementType(sourceElement);
                    const sourceDescription = getElementDescription(sourceElement);
                    
                    description += `Relier ${sourceType} « ${sourceDescription} » à l'activité ${activity.type} « ${activity.name} » par un flux de séquence`;
                    
                    if (flow.condition) {
                        description += ` avec la condition « ${flow.condition} »`;
                    }
                    
                    description += `.\n\n`;
                }
            });
        }
    });
    
    // Décrire les passerelles
    description += "// Description des passerelles et décisions\n";
    
    structure.decisions.forEach(decision => {
        if (!decision.isConvergence) {
            // Décrire la passerelle de décision
            const decisionLane = internalLanes.find(lane => lane.actor === decision.actor);
            if (decisionLane) {
                description += `Tracer une passerelle « ${decision.question} » dans le couloir « ${decisionLane.name} ».\n\n`;
                
                // Décrire les connexions entrantes
                const incomingFlows = structure.sequenceFlows.filter(flow => flow.target === decision.id);
                incomingFlows.forEach(flow => {
                    const sourceElement = getElementById(flow.source, structure);
                    if (sourceElement) {
                        const sourceType = getElementType(sourceElement);
                        const sourceDescription = getElementDescription(sourceElement);
                        
                        description += `Relier ${sourceType} « ${sourceDescription} » à la passerelle « ${decision.question} » par un flux de séquence.\n\n`;
                    }
                });
                
                // Décrire les connexions sortantes
                const outgoingFlows = structure.sequenceFlows.filter(flow => flow.source === decision.id);
                outgoingFlows.forEach(flow => {
                    const targetElement = getElementById(flow.target, structure);
                    if (targetElement) {
                        const targetType = getElementType(targetElement);
                        const targetDescription = getElementDescription(targetElement);
                        
                        description += `Relier la passerelle « ${decision.question} » à ${targetType} « ${targetDescription} » par un flux de séquence`;
                        
                        if (flow.condition) {
                            description += ` avec la condition « ${flow.condition} »`;
                        }
                        
                        description += `.\n\n`;
                    }
                });
            }
        } else {
            // Décrire la passerelle de convergence
            const decisionLane = internalLanes.find(lane => lane.actor === decision.actor);
            if (decisionLane) {
                description += `Tracer une passerelle de convergence dans le couloir « ${decisionLane.name} ».\n\n`;
                
                // Décrire les connexions entrantes
                const incomingFlows = structure.sequenceFlows.filter(flow => flow.target === decision.id);
                incomingFlows.forEach(flow => {
                    const sourceElement = getElementById(flow.source, structure);
                    if (sourceElement) {
                        const sourceType = getElementType(sourceElement);
                        const sourceDescription = getElementDescription(sourceElement);
                        
                        description += `Relier ${sourceType} « ${sourceDescription} » à la passerelle de convergence par un flux de séquence.\n\n`;
                    }
                });
                
                // Décrire les connexions sortantes
                const outgoingFlows = structure.sequenceFlows.filter(flow => flow.source === decision.id);
                outgoingFlows.forEach(flow => {
                    const targetElement = getElementById(flow.target, structure);
                    if (targetElement) {
                        const targetType = getElementType(targetElement);
                        const targetDescription = getElementDescription(targetElement);
                        
                        description += `Relier la passerelle de convergence à ${targetType} « ${targetDescription} » par un flux de séquence.\n\n`;
                    }
                });
            }
        }
    });
    
    // Décrire les événements de fin
    description += "// Description des événements de fin\n";
    
    const endEvents = structure.events.filter(event => event.type === 'fin');
    if (endEvents.length > 0) {
        endEvents.forEach(event => {
            // Trouver l'activité précédant l'événement de fin
            const precedingActivity = sortedActivities.find(activity => 
                activity.isEndActivity && 
                (activity.position === event.position || 
                 Math.abs(activity.position - event.position) <= 2)
            );
            
            if (precedingActivity) {
                // Trouver le couloir contenant l'activité
                const activityLane = internalLanes.find(lane => lane.actor === precedingActivity.actor);
                if (activityLane) {
                    // Tracer l'événement de fin
                    description += `Tracer un événement de fin « ${event.name} » dans le couloir « ${activityLane.name} ».\n\n`;
                    
                    // Relier l'activité à l'événement de fin
                    description += `Relier l'activité ${precedingActivity.type} « ${precedingActivity.name} » à l'événement de fin « ${event.name} » par un flux de séquence.\n\n`;
                    
                    // S'il s'agit d'un événement de fin avec message, le relier à un acteur externe
                    if (event.name.toLowerCase().includes('livr')) {
                        // Probablement une livraison au client
                        const clientPool = externalPools.find(pool => pool.name.toLowerCase().includes('client'));
                        if (clientPool) {
                            description += `Tracer le flux de message « Marchandise », de l'événement de fin « ${event.name} » jusqu'à à la frontière de la piscine « ${clientPool.name} ».\n\n`;
                        }
                    } else if (event.name.toLowerCase().includes('avis') || 
                               event.name.toLowerCase().includes('annul')) {
                        // Probablement un avis au client
                        const clientPool = externalPools.find(pool => pool.name.toLowerCase().includes('client'));
                        if (clientPool) {
                            description += `Tracer le flux de message « Avis au client », de l'événement de fin « ${event.name} » jusqu'à à la frontière de la piscine « ${clientPool.name} ».\n\n`;
                        }
                    }
                }
            } else {
                // Si aucune activité précédente n'est identifiée, tracer simplement l'événement de fin
                if (internalLanes.length > 0) {
                    description += `Tracer un événement de fin « ${event.name} » dans le couloir « ${internalLanes[0].name} ».\n\n`;
                }
            }
        });
    }
    
    // Décrire les objets de données et leurs associations
    description += "// Description des objets et magasins de données\n";
    
    structure.dataObjects.forEach(dataObject => {
        // Décrire l'objet ou le magasin de données
        const objectType = dataObject.type === 'magasin' ? 'magasin de données' : 'objet de données';
        
        description += `Tracer un ${objectType} « ${dataObject.name} »`;
        
        // Trouver les activités associées à cet objet
        const associatedActivities = [];
        structure.associations.forEach(association => {
            if (association.target === dataObject.id) {
                const sourceElement = getElementById(association.source, structure);
                if (sourceElement && sourceElement.type) {
                    associatedActivities.push(sourceElement);
                }
            }
        });
        
        // Si des activités sont associées, positionner l'objet par rapport à elles
        if (associatedActivities.length > 0) {
            const primaryActivity = associatedActivities[0];
            description += ` à proximité de l'activité « ${primaryActivity.name} »`;
        }
        
        description += `.\n\n`;
        
        // Décrire les associations
        structure.associations.forEach(association => {
            if (association.target === dataObject.id) {
                const sourceElement = getElementById(association.source, structure);
                if (sourceElement && sourceElement.type) {
                    description += `Relier l'activité « ${sourceElement.name} » au ${objectType} « ${dataObject.name} » par une association`;
                    
                    if (association.direction) {
                        if (association.direction === 'to-source') {
                            description += ` orientée vers l'activité (lecture)`;
                        } else if (association.direction === 'to-target') {
                            description += ` orientée vers le ${objectType} (création)`;
                        } else if (association.direction === 'both') {
                            description += ` bidirectionnelle (mise à jour)`;
                        }
                    }
                    
                    description += `.\n\n`;
                }
            }
        });
    });
    
    // Décrire les flux de message
    description += "// Description des flux de message\n";
    
    structure.messageFlows.forEach(flow => {
        const sourceElement = getElementById(flow.source, structure);
        const targetElement = structure.swimlanes.find(lane => lane.id === flow.target);
        
        if (sourceElement && targetElement) {
            description += `Tracer un flux de message « ${flow.name} » de l'activité « ${sourceElement.name} » vers la piscine « ${targetElement.name} ».\n\n`;
        }
    });
    
    return description;
}

/**
 * Infère le nom du processus
 * @param {Object} structure - Structure du processus
 * @return {string} - Nom du processus
 */
function inferProcessName(structure) {
    // Essayer d'identifier le type de processus
    
    // Vérifier les activités clés
    const activityNames = structure.activities.map(a => a.name.toLowerCase());
    
    if (activityNames.some(name => name.includes('command') && name.includes('client'))) {
        return 'prise de commande';
    }
    
    if (activityNames.some(name => name.includes('livr')) && 
        activityNames.some(name => name.includes('prépar'))) {
        return 'livraison';
    }
    
    if (activityNames.some(name => name.includes('approu')) && 
        activityNames.some(name => name.includes('rapport'))) {
        return 'approbation des rapports';
    }
    
    if (activityNames.some(name => name.includes('remboursement')) || 
        activityNames.some(name => name.includes('dépense'))) {
        return 'remboursement des dépenses';
    }
    
    if (activityNames.some(name => name.includes('valid')) && 
        activityNames.some(name => name.includes('crédit'))) {
        return 'validation de crédit';
    }
    
    // Vérifier les événements de fin
    const endEventNames = structure.events
        .filter(e => e.type === 'fin')
        .map(e => e.name.toLowerCase());
    
    if (endEventNames.some(name => name.includes('livr'))) {
        return 'livraison';
    }
    
    if (endEventNames.some(name => name.includes('command'))) {
        return 'traitement des commandes';
    }
    
    // Par défaut
    return 'traitement';
}

/**
 * Infère l'acteur externe pour un événement
 * @param {Object} event - Événement
 * @param {Object} structure - Structure du processus
 * @return {string} - Nom de l'acteur externe
 */
function inferExternalActorForEvent(event, structure) {
    const lowerEventName = event.name.toLowerCase();
    
    // Rechercher par type d'événement
    if (lowerEventName.includes('command')) {
        const clientPool = structure.swimlanes.find(lane => 
            lane.isExternalPool && lane.name.toLowerCase().includes('client')
        );
        return clientPool ? clientPool.name : null;
    }
    
    if (lowerEventName.includes('facture') || lowerEventName.includes('paiement')) {
        const fournisseurPool = structure.swimlanes.find(lane => 
            lane.isExternalPool && lane.name.toLowerCase().includes('fournisseur')
        );
        return fournisseurPool ? fournisseurPool.name : null;
    }
    
    // Acteur externe par défaut
    const externalPools = structure.swimlanes.filter(lane => lane.isExternalPool);
    return externalPools.length > 0 ? externalPools[0].name : null;
}

/**
 * Récupère un élément par son ID
 * @param {string} id - ID de l'élément
 * @param {Object} structure - Structure du processus
 * @return {Object} - Élément trouvé
 */
function getElementById(id, structure) {
    if (id === 'start') {
        return structure.events.find(event => event.type === 'début');
    }
    
    if (id.startsWith('end')) {
        return structure.events.find(event => event.id === id);
    }
    
    if (id.startsWith('a')) {
        return structure.activities.find(activity => activity.id === id);
    }
    
    if (id.startsWith('g')) {
        return structure.decisions.find(decision => decision.id === id);
    }
    
    if (id.startsWith('d')) {
        return structure.dataObjects.find(dataObject => dataObject.id === id);
    }
    
    if (id.startsWith('e')) {
        return structure.events.find(event => event.id === id);
    }
    
    return null;
}

/**
 * Obtient le type d'un élément
 * @param {Object} element - Élément
 * @return {string} - Type de l'élément
 */
function getElementType(element) {
    if (!element) return '';
    
    if (element.type === 'début') {
        return 'l\'événement de début';
    }
    
    if (element.type === 'fin') {
        return 'l\'événement de fin';
    }
    
    if (element.type && ['générique', 'manuelle', 'utilisateur', 'service'].includes(element.type)) {
        return `l'activité ${element.type}`;
    }
    
    if (element.isConvergence) {
        return 'la passerelle de convergence';
    }
    
    if (element.condition) {
        return 'la passerelle';
    }
    
    return '';
}

/**
 * Obtient la description d'un élément
 * @param {Object} element - Élément
 * @return {string} - Description de l'élément
 */
function getElementDescription(element) {
    if (!element) return '';
    
    if (element.name) {
        return element.name;
    }
    
    if (element.question) {
        return element.question;
    }
    
    return '';
}

/**
 * Crée la liste des éléments pour l'interface utilisateur
 * @param {Object} structure - Structure du processus
 */
function populateElementList(structure) {
    const elementList = document.getElementById('element-list');
    elementList.innerHTML = '';
    
    // Ajouter les acteurs
    const actorsSection = document.createElement('div');
    actorsSection.className = 'element-section';
    actorsSection.innerHTML = '<h3>Acteurs</h3>';
    
    structure.actors.forEach(actor => {
        const actorItem = document.createElement('div');
        actorItem.className = 'element-item';
        
        const actorCheckbox = document.createElement('input');
        actorCheckbox.type = 'checkbox';
        actorCheckbox.id = `actor-${actor.name}`;
        actorCheckbox.checked = actor.isInternal;
        
        const actorLabel = document.createElement('label');
        actorLabel.htmlFor = `actor-${actor.name}`;
        actorLabel.textContent = `${actor.name} ${actor.isInternal ? '(interne)' : '(externe)'}`;
        
        actorItem.appendChild(actorCheckbox);
        actorItem.appendChild(actorLabel);
        actorsSection.appendChild(actorItem);
    });
    
    elementList.appendChild(actorsSection);
    
    // Ajouter les activités
    const activitiesSection = document.createElement('div');
    activitiesSection.className = 'element-section';
    activitiesSection.innerHTML = '<h3>Activités</h3>';
    
    structure.activities.forEach(activity => {
        const activityItem = document.createElement('div');
        activityItem.className = 'element-item';
        
        const activitySelect = document.createElement('select');
        activitySelect.id = `activity-type-${activity.id}`;
        
        const types = ['générique', 'manuelle', 'utilisateur', 'service'];
        types.forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            option.selected = activity.type === type;
            activitySelect.appendChild(option);
        });
        
        const activityLabel = document.createElement('label');
        activityLabel.htmlFor = `activity-type-${activity.id}`;
        activityLabel.textContent = activity.name;
        
        activityItem.appendChild(activitySelect);
        activityItem.appendChild(activityLabel);
        activitiesSection.appendChild(activityItem);
    });
    
    elementList.appendChild(activitiesSection);
    
    // Ajouter les décisions
    if (structure.decisions.length > 0) {
        const decisionsSection = document.createElement('div');
        decisionsSection.className = 'element-section';
        decisionsSection.innerHTML = '<h3>Décisions</h3>';
        
        structure.decisions.forEach(decision => {
            if (!decision.isConvergence) {
                const decisionItem = document.createElement('div');
                decisionItem.className = 'element-item';
                
                const decisionInput = document.createElement('input');
                decisionInput.type = 'text';
                decisionInput.id = `decision-${decision.id}`;
                decisionInput.value = decision.question;
                
                const decisionLabel = document.createElement('label');
                decisionLabel.htmlFor = `decision-${decision.id}`;
                decisionLabel.textContent = 'Question: ';
                
                decisionItem.appendChild(decisionLabel);
                decisionItem.appendChild(decisionInput);
                decisionsSection.appendChild(decisionItem);
            }
        });
        
        elementList.appendChild(decisionsSection);
    }
    
    // Ajouter les objets de données
    if (structure.dataObjects.length > 0) {
        const dataSection = document.createElement('div');
        dataSection.className = 'element-section';
        dataSection.innerHTML = '<h3>Données</h3>';
        
        structure.dataObjects.forEach(dataObject => {
            const dataItem = document.createElement('div');
            dataItem.className = 'element-item';
            
            const dataTypeSelect = document.createElement('select');
            dataTypeSelect.id = `data-type-${dataObject.id}`;
            
            const types = ['objet', 'magasin'];
            types.forEach(type => {
                const option = document.createElement('option');
                option.value = type;
                option.textContent = type === 'objet' ? 'Objet de données' : 'Magasin de données';
                option.selected = dataObject.type === type;
                dataTypeSelect.appendChild(option);
            });
            
            const dataLabel = document.createElement('label');
            dataLabel.htmlFor = `data-type-${dataObject.id}`;
            dataLabel.textContent = dataObject.name;
            
            dataItem.appendChild(dataTypeSelect);
            dataItem.appendChild(dataLabel);
            dataSection.appendChild(dataItem);
        });
        
        elementList.appendChild(dataSection);
    }
}

/**
 * Met à jour les positions des éléments
 * @param {Object} structure - Structure du processus
 */
function updateElementPositions(structure) {
    // Mettre à jour les types d'activités
    structure.activities.forEach(activity => {
        const typeSelect = document.getElementById(`activity-type-${activity.id}`);
        if (typeSelect) {
            activity.type = typeSelect.value;
        }
    });
    
    // Mettre à jour les questions des décisions
    structure.decisions.forEach(decision => {
        if (!decision.isConvergence) {
            const questionInput = document.getElementById(`decision-${decision.id}`);
            if (questionInput) {
                decision.question = questionInput.value;
            }
        }
    });
    
    // Mettre à jour les types d'objets de données
    structure.dataObjects.forEach(dataObject => {
        const typeSelect = document.getElementById(`data-type-${dataObject.id}`);
        if (typeSelect) {
            dataObject.type = typeSelect.value;
        }
    });
    
    // Mettre à jour les acteurs internes/externes
    structure.actors.forEach(actor => {
        const checkbox = document.getElementById(`actor-${actor.name}`);
        if (checkbox) {
            actor.isInternal = checkbox.checked;
            actor.requiresLane = actor.isInternal && (actor.hasActivities || actor.isPrimaryMention);
        }
    });
}

/**
 * Capitalise la première lettre d'une chaîne
 * @param {string} string - Chaîne à capitaliser
 * @return {string} - Chaîne avec la première lettre capitalisée
 */
function capitalizeFirstLetter(string) {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
}
