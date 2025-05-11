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
 * @param {string} fullText - Texte complet du scénario
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
    
    if (lowerFullText.includes('rapport') && 
        (lowerFullText.includes('refusé') || lowerFullText.includes('rejeté'))) {
        // Ajouter un événement de fin pour le rapport refusé s'il n'existe pas déjà
        if (!events.some(e => e.type === 'fin' && 
                         (e.name.toLowerCase().includes('refusé') || 
                          e.name.toLowerCase().includes('rejeté')))) {
            events.push({
                id: 'end' + (events.filter(e => e.type === 'fin').length + 1),
                type: 'fin',
                name: 'Rapport refusé',
                position: sentences.length
            });
        }
    }
    
    // Si aucun événement de fin n'a été identifié, en ajouter un par défaut
    if (!events.some(e => e.type === 'fin')) {
        events.push({
            id: 'end1',
            type: 'fin',
            name: 'Fin du processus',
            position: sentences.length - 1
        });
    }
    
    return events;
}

/**
 * Infère le nom d’un événement de fin à partir du contexte
 * @param {string} sentence - Phrase qui indique la fin
 * @param {string} fullText - Texte complet du scénario
 * @return {string} - Nom de l’événement de fin
 */
function inferEndEventName(sentence, fullText) {
    const lowerSentence = sentence.toLowerCase();
    if (lowerSentence.includes('livraison')) {
        return 'Commande livrée';
    }
    if (lowerSentence.includes('annulée') || lowerSentence.includes('refusée')) {
        return 'Commande annulée';
    }
    return 'Fin du processus';
}

/**
 * Extrait la description d’un événement temporel
 * @param {string} sentence - Phrase contenant une référence temporelle
 * @return {string} - Description de l’événement temporel
 */
function extractTemporalEvent(sentence) {
    const match = sentence.match(/(tous? les? matins?|chaque? matin|le lendemain|vers \d+h|à \d+h)/i);
    return match ? match[0] : 'Événement temporel';
}

/**
 * Extrait le nom d’un événement de message à partir d’une phrase
 * @param {string} sentence - Phrase décrivant l’envoi ou la réception d’un message
 * @return {string} - Nom du message extrait
 */
function extractMessageEventName(sentence) {
    const match = sentence.match(/(courriel|message|notification|réponse|avis)/i);
    return match ? match[0] : 'Message';
}

/**
 * Analyse les relations entre les composants du processus
 * @param {Object} components - Composants extraits du processus
 * @param {string} processedText - Texte prétraité du scénario
 * @return {Object} - Structure analysée du processus
 */
function analyzeProcessStructure(components, processedText) {
    const { actors, activities, decisions, dataObjects, events } = components;
    
    // Déterminer les relations entre activités (flux de séquence)
    const activitySequences = determineActivitySequences(activities, processedText);
    
    // Associer les décisions aux activités appropriées
    const decisionRelations = associateDecisionsWithActivities(decisions, activities, processedText);
    
    // Associer les données aux activités appropriées
    const dataRelations = associateDataWithActivities(dataObjects, activities, processedText);
    
    // Créer une structure intégrée du processus
    return {
        actors,
        activities,
        decisions,
        dataObjects,
        events,
        activitySequences,
        decisionRelations,
        dataRelations
    };
}

/**
 * Détermine les séquences entre activités
 * @param {Object[]} activities - Activités du processus
 * @param {string} processedText - Texte prétraité du scénario
 * @return {Object[]} - Séquences d'activités identifiées
 */
function determineActivitySequences(activities, processedText) {
    const sequences = [];
    
    // Ordonner les activités par position dans le texte
    const orderedActivities = [...activities].sort((a, b) => a.position - b.position);
    
    // Créer des séquences basées sur l'ordre des activités
    for (let i = 0; i < orderedActivities.length - 1; i++) {
        sequences.push({
            from: orderedActivities[i].id,
            to: orderedActivities[i + 1].id,
            condition: null
        });
    }
    
    return sequences;
}

/**
 * Associe les décisions aux activités appropriées
 * @param {Object[]} decisions - Décisions du processus
 * @param {Object[]} activities - Activités du processus
 * @param {string} processedText - Texte prétraité du scénario
 * @return {Object[]} - Relations décision-activité
 */
function associateDecisionsWithActivities(decisions, activities, processedText) {
    const relations = [];
    
    decisions.forEach(decision => {
        const nearestPriorActivity = findNearestActivityBeforePosition(activities, decision.position);
        const positiveOutcomeActivity = findActivityByDescription(activities, decision.positiveOutcome);
        const negativeOutcomeActivity = findActivityByDescription(activities, decision.negativeOutcome);
        
        if (nearestPriorActivity) {
            relations.push({
                decisionId: decision.id,
                priorActivityId: nearestPriorActivity.id
            });
        }
        
        if (positiveOutcomeActivity) {
            relations.push({
                decisionId: decision.id,
                outcomeActivityId: positiveOutcomeActivity.id,
                isPositive: true
            });
        }
        
        if (negativeOutcomeActivity) {
            relations.push({
                decisionId: decision.id,
                outcomeActivityId: negativeOutcomeActivity.id,
                isPositive: false
            });
        }
    });
    
    return relations;
}

/**
 * Trouve l'activité la plus proche avant une position donnée
 * @param {Object[]} activities - Activités du processus
 * @param {number} position - Position de référence
 * @return {Object} - Activité trouvée ou null
 */
function findNearestActivityBeforePosition(activities, position) {
    let nearestActivity = null;
    let smallestDistance = Number.MAX_SAFE_INTEGER;
    
    activities.forEach(activity => {
        if (activity.position < position) {
            const distance = position - activity.position;
            if (distance < smallestDistance) {
                smallestDistance = distance;
                nearestActivity = activity;
            }
        }
    });
    
    return nearestActivity;
}

/**
 * Trouve une activité par sa description
 * @param {Object[]} activities - Activités du processus
 * @param {string} description - Description à rechercher
 * @return {Object} - Activité trouvée ou null
 */
function findActivityByDescription(activities, description) {
    if (!description) return null;
    
    return activities.find(activity => 
        areStringSimilar(activity.description, description) || 
        areStringSimilar(activity.name, description)
    );
}

/**
 * Associe les données aux activités appropriées
 * @param {Object[]} dataObjects - Objets de données du processus
 * @param {Object[]} activities - Activités du processus
 * @param {string} processedText - Texte prétraité du scénario
 * @return {Object[]} - Relations donnée-activité
 */
function associateDataWithActivities(dataObjects, activities, processedText) {
    const relations = [];
    
    dataObjects.forEach(dataObject => {
        activities.forEach(activity => {
            const lowerActivityDesc = activity.description.toLowerCase();
            const dataNameLower = dataObject.name.toLowerCase();
            
            if (lowerActivityDesc.includes(dataNameLower)) {
                const accessMode = determineDataAccessMode(activity.description, dataObject.name);
                
                if (accessMode !== 'indéterminé') {
                    relations.push({
                        dataId: dataObject.id,
                        activityId: activity.id,
                        accessMode: accessMode
                    });
                }
            }
        });
    });
    
    return relations;
}

/**
 * Remplit la liste des éléments pour la révision
 * @param {Object} structure - Structure du processus
 */
function populateElementList(structure) {
    const elementList = document.getElementById('element-list');
    elementList.innerHTML = '';
    
    // Ajouter les activités à la liste
    structure.activities.forEach(activity => {
        const elementItem = document.createElement('div');
        elementItem.classList.add('element-item');
        elementItem.innerHTML = `
            <strong>${activity.name}</strong> (${activity.type})
            <div class="position-selector">
                <label>Position: 
                    <select id="position-${activity.id}">
                        <option value="top">En haut</option>
                        <option value="right" selected>À droite</option>
                        <option value="bottom">En bas</option>
                        <option value="left">À gauche</option>
                    </select>
                </label>
            </div>
        `;
        elementList.appendChild(elementItem);
    });
    
    // Ajouter les passerelles à la liste
    structure.decisions.forEach(decision => {
        const elementItem = document.createElement('div');
        elementItem.classList.add('element-item');
        elementItem.innerHTML = `
            <strong>Passerelle: ${decision.question}</strong>
            <div class="position-selector">
                <label>Position: 
                    <select id="position-${decision.id}">
                        <option value="top">En haut</option>
                        <option value="right" selected>À droite</option>
                        <option value="bottom">En bas</option>
                        <option value="left">À gauche</option>
                    </select>
                </label>
            </div>
        `;
        elementList.appendChild(elementItem);
    });
    
    // Ajouter les objets de données à la liste
    structure.dataObjects.forEach(dataObject => {
        const elementItem = document.createElement('div');
        elementItem.classList.add('element-item');
        elementItem.innerHTML = `
            <strong>${dataObject.type === 'magasin' ? 'Magasin de données' : 'Objet de données'}: ${dataObject.name}</strong>
            <div class="position-selector">
                <label>Position: 
                    <select id="position-${dataObject.id}">
                        <option value="top">En haut</option>
                        <option value="right">À droite</option>
                        <option value="bottom" selected>En bas</option>
                        <option value="left">À gauche</option>
                    </select>
                </label>
            </div>
        `;
        elementList.appendChild(elementItem);
    });
}

/**
 * Met à jour les positions des éléments
 * @param {Object} structure - Structure du processus
 */
function updateElementPositions(structure) {
    // Mettre à jour les positions des activités
    structure.activities.forEach(activity => {
        const positionSelect = document.getElementById(`position-${activity.id}`);
        if (positionSelect) {
            activity.position = positionSelect.value;
        }
    });
    
    // Mettre à jour les positions des passerelles
    structure.decisions.forEach(decision => {
        const positionSelect = document.getElementById(`position-${decision.id}`);
        if (positionSelect) {
            decision.position = positionSelect.value;
        }
    });
    
    // Mettre à jour les positions des objets de données
    structure.dataObjects.forEach(dataObject => {
        const positionSelect = document.getElementById(`position-${dataObject.id}`);
        if (positionSelect) {
            dataObject.position = positionSelect.value;
        }
    });
}

/**
 * Met la première lettre d'une chaîne en majuscule
 * @param {string} string - Chaîne à capitaliser
 * @return {string} - Chaîne avec première lettre en majuscule
 */
function capitalizeFirstLetter(string) {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Formate la description BPMN à partir de la structure du processus
 * @param {Object} processStructure - Structure analysée du processus
 * @return {string} - Description BPMN formatée
 */
function formatBPMNDescription(processStructure) {
    const { actors, activities, decisions, dataObjects, events } = processStructure;

    let description = '';

    // 1. Piscines et couloirs
    const externalActors = actors.filter(a => !a.isInternal);
    const internalActors = actors.filter(a => a.isInternal && a.requiresLane);

    externalActors.forEach(actor => {
        description += `Tracer une piscine pour l'acteur externe "${actor.name}".\n`;
    });

    if (internalActors.length > 0) {
        description += `Tracer une piscine "Processus principal" dans laquelle on retrouve les couloirs suivants : ${internalActors.map(a => `"${a.name}"`).join(', ')}.\n`;
    }

    // 2. Événement de début
    const startEvent = events.find(e => e.type === 'début');
    if (startEvent) {
        description += `Tracer un événement de début générique nommé "${startEvent.name}".\n`;
    }

    // 3. Activités et flux principaux
    activities.forEach(activity => {
        description += `Tracer une activité ${activity.type} "${activity.name}" dans le couloir "${activity.actor}".\n`;
    });

    // 4. Passerelles (décisions)
    decisions.forEach(decision => {
        description += `Tracer une passerelle exclusive avec la question "${decision.question}" dans le couloir "${decision.actor}".\n`;
        if (decision.positiveOutcome) {
            description += `Tracer un flux sortant nommé "Oui" menant à "${decision.positiveOutcome}".\n`;
        }
        if (decision.negativeOutcome) {
            description += `Tracer un flux sortant nommé "Non" menant à "${decision.negativeOutcome}".\n`;
        }
    });

    // 5. Données
    dataObjects.forEach(data => {
        const type = data.type === 'magasin' ? 'magasin de données' : 'objet de données';
        description += `Tracer un ${type} nommé "${data.name}".\n`;
    });

    // 6. Événements intermédiaires
    events.filter(e => e.type.startsWith('intermédiaire')).forEach(event => {
        const eventType = event.type.includes('minuterie') ? 'de minuterie' : 'de message';
        description += `Tracer un événement intermédiaire ${eventType} nommé "${event.name}".\n`;
    });

    // 7. Événements de fin
    events.filter(e => e.type === 'fin').forEach(event => {
        description += `Tracer un événement de fin nommé "${event.name}".\n`;
    });

    return description.trim();
}
