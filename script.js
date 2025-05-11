function generateInstructions() {
    const scenarioText = document.getElementById('inputScenario').value.trim();
    if (!scenarioText) {
        document.getElementById('outputInstructions').innerText = 'Veuillez entrer une description de processus.';
        document.getElementById('outputConcepts').innerText = '';
        return;
    }

    // Analyse du texte
    const processData = analyzeProcess(scenarioText);
    
    // Génération des instructions de modélisation
    const modelingInstructions = generateModelingSteps(processData);
    document.getElementById('outputInstructions').innerText = modelingInstructions;
    
    // Génération des concepts BPMN importants
    const conceptsOutput = generateBPMNConcepts(processData);
    document.getElementById('outputConcepts').innerText = conceptsOutput;
}

function analyzeProcess(text) {
    // Structure pour stocker les informations analysées
    const processData = {
        actors: [],
        activities: [],
        decisions: [],
        dataObjects: [],
        dataSources: [],
        messages: [],
        timers: [],
        sentences: []
    };
    
    // Découper le texte en phrases
    const sentences = text.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(s => s.length > 0);
    processData.sentences = sentences;
    
    // Analyser chaque phrase
    sentences.forEach(sentence => {
        // Identifier les acteurs
        findActors(sentence, processData);
        
        // Identifier les activités
        findActivities(sentence, processData);
        
        // Identifier les décisions
        findDecisions(sentence, processData);
        
        // Identifier les objets de données
        findDataObjects(sentence, processData);
        
        // Identifier les messages
        findMessages(sentence, processData);
        
        // Identifier les minuteries
        findTimers(sentence, processData);
    });
    
    return processData;
}

function findActors(sentence, processData) {
    const actorKeywords = [
        'client', 'représentant', 'service', 'département', 'équipe', 
        'responsable', 'manager', 'employé', 'système', 'application',
        'fournisseur', 'vendeur', 'acheteur', 'utilisateur', 'superviseur',
        'directeur', 'chef', 'technicien', 'opérateur', 'analyste',
        'comptable', 'financier', 'ressources humaines', 'RH', 'logistique',
        'expédition', 'livraison', 'production', 'qualité', 'marketing'
    ];
    
    actorKeywords.forEach(keyword => {
        if (sentence.toLowerCase().includes(keyword)) {
            const actor = keyword.charAt(0).toUpperCase() + keyword.slice(1);
            if (!processData.actors.includes(actor)) {
                processData.actors.push(actor);
            }
        }
    });
}

function findActivities(sentence, processData) {
    const activityVerbs = [
        'vérifie', 'valide', 'crée', 'saisit', 'entre', 'examine', 'envoie',
        'reçoit', 'traite', 'approuve', 'refuse', 'génère', 'imprime', 'prépare',
        'consulte', 'remplit', 'soumet', 'recherche', 'analyse', 'évalue',
        'notifie', 'informe', 'contacte', 'appelle', 'transmet', 'livre',
        'emballe', 'récupère', 'calcule', 'met à jour', 'confirme', 'annule',
        'enregistre', 'stocke', 'archive', 'supprime', 'modifie', 'corrige'
    ];
    
    const lowerSentence = sentence.toLowerCase();
    
    // Déterminer le type d'activité (manuelle, utilisateur, service)
    let activityType = 'générique';
    
    if (lowerSentence.includes('système') && (
        lowerSentence.includes('automatiquement') || 
        lowerSentence.includes('génère') || 
        lowerSentence.includes('calcule') ||
        lowerSentence.includes('envoie automatiquement'))) {
        activityType = 'service';
    } else if (lowerSentence.includes('base de données') || 
               lowerSentence.includes('système') || 
               lowerSentence.includes('logiciel') || 
               lowerSentence.includes('application') ||
               lowerSentence.includes('portail') ||
               lowerSentence.includes('saisit')) {
        activityType = 'utilisateur';
    } else {
        activityType = 'manuelle';
    }
    
    activityVerbs.forEach(verb => {
        if (lowerSentence.includes(verb)) {
            // Extraire l'activité complète (verbe + complément)
            const verbIndex = lowerSentence.indexOf(verb);
            if (verbIndex >= 0) {
                // Prendre une portion de la phrase autour du verbe
                let endIndex = lowerSentence.indexOf(',', verbIndex);
                if (endIndex === -1) endIndex = lowerSentence.indexOf('.', verbIndex);
                if (endIndex === -1) endIndex = lowerSentence.length;
                
                const activity = lowerSentence.substring(verbIndex, endIndex).trim();
                
                // Ajouter l'activité avec son type
                processData.activities.push({
                    description: activity,
                    type: activityType,
                    fullSentence: sentence
                });
            }
        }
    });
}

function findDecisions(sentence, processData) {
    const decisionKeywords = [
        'si', 'sinon', 'lorsque', 'quand', 'condition', 'cas où',
        'dépasse', 'supérieur', 'inférieur', 'égal', 'différent',
        'plus', 'moins', 'approuvé', 'refusé', 'validé', 'rejeté'
    ];
    
    const lowerSentence = sentence.toLowerCase();
    
    decisionKeywords.forEach(keyword => {
        if (lowerSentence.includes(keyword)) {
            // Chercher les conditions spécifiques
            let condition = '';
            
            if (keyword === 'si' || keyword === 'lorsque' || keyword === 'quand') {
                const keywordIndex = lowerSentence.indexOf(keyword);
                if (keywordIndex >= 0) {
                    let endIndex = lowerSentence.indexOf(',', keywordIndex);
                    if (endIndex === -1) endIndex = lowerSentence.indexOf('.', keywordIndex);
                    if (endIndex === -1) endIndex = lowerSentence.length;
                    
                    condition = lowerSentence.substring(keywordIndex, endIndex).trim();
                }
            } else {
                condition = sentence; // Utiliser la phrase entière si le mot-clé de décision est moins spécifique
            }
            
            if (condition && !processData.decisions.some(d => d.condition === condition)) {
                processData.decisions.push({
                    condition: condition,
                    fullSentence: sentence
                });
            }
        }
    });
}

function findDataObjects(sentence, processData) {
    const dataObjectKeywords = [
        'formulaire', 'document', 'fichier', 'rapport', 'facture',
        'commande', 'bon de livraison', 'reçu', 'contrat', 'demande',
        'email', 'message', 'notification', 'données', 'information',
        'dossier', 'fiche', 'catalogue', 'liste', 'inventaire'
    ];
    
    const dataSourceKeywords = [
        'base de données', 'système', 'registre', 'archive', 'répertoire',
        'entrepôt de données', 'stockage', 'serveur', 'cloud', 'plateforme',
        'application', 'logiciel', 'ERP', 'CRM', 'portail'
    ];
    
    const lowerSentence = sentence.toLowerCase();
    
    // Trouver les objets de données
    dataObjectKeywords.forEach(keyword => {
        if (lowerSentence.includes(keyword)) {
            if (!processData.dataObjects.some(obj => obj.includes(keyword))) {
                processData.dataObjects.push(keyword);
            }
        }
    });
    
    // Trouver les magasins de données
    dataSourceKeywords.forEach(keyword => {
        if (lowerSentence.includes(keyword)) {
            if (!processData.dataSources.some(src => src.includes(keyword))) {
                processData.dataSources.push(keyword);
            }
        }
    });
}

function findMessages(sentence, processData) {
    const messageKeywords = [
        'envoie', 'transmet', 'communique', 'notifie', 'informe',
        'répond', 'contacte', 'avise', 'alerte', 'signale',
        'email', 'courriel', 'message', 'notification', 'avis',
        'appelle', 'téléphone', 'fax', 'sms', 'lettre'
    ];
    
    const lowerSentence = sentence.toLowerCase();
    
    messageKeywords.forEach(keyword => {
        if (lowerSentence.includes(keyword)) {
            // Chercher l'expéditeur et le destinataire
            let sender = '';
            let receiver = '';
            
            // Chercher les acteurs dans la phrase
            for (const actor of processData.actors) {
                if (lowerSentence.includes(actor.toLowerCase())) {
                    if (!sender) {
                        sender = actor;
                    } else if (!receiver) {
                        receiver = actor;
                    }
                }
            }
            
            // Si on a trouvé un expéditeur et un destinataire
            if (sender && receiver && sender !== receiver) {
                processData.messages.push({
                    sender: sender,
                    receiver: receiver,
                    content: keyword,
                    fullSentence: sentence
                });
            }
        }
    });
}

function findTimers(sentence, processData) {
    const timerKeywords = [
        'délai', 'attente', 'temporisation', 'durée', 'période',
        'heure', 'jour', 'semaine', 'mois', 'année',
        'minute', 'seconde', 'temps', 'date', 'échéance',
        'planifié', 'programmé', 'quotidien', 'hebdomadaire', 'mensuel',
        'périodique', 'récurrent', 'régulier', 'immédiat', 'instant'
    ];
    
    const lowerSentence = sentence.toLowerCase();
    
    timerKeywords.forEach(keyword => {
        if (lowerSentence.includes(keyword)) {
            processData.timers.push({
                timerType: keyword,
                fullSentence: sentence
            });
        }
    });
}

function generateModelingSteps(processData) {
    let instructions = [];
    
    // En-tête
    instructions.push("# Instructions de modélisation BPMN\n");
    
    // Étape 1: Définir les piscines et couloirs
    instructions.push("## 1. Définir les piscines et couloirs");
    if (processData.actors.length > 0) {
        // Identifier les organisations et les départements/rôles
        const organizations = processData.actors.filter(actor => 
            actor.includes('Service') || actor.includes('Département') || 
            actor.includes('Entreprise') || actor.includes('Société') ||
            actor.toLowerCase() === 'client' || actor.toLowerCase() === 'fournisseur'
        );
        
        const roles = processData.actors.filter(actor => !organizations.includes(actor));
        
        // Instructions pour les piscines
        if (organizations.length > 0) {
            instructions.push("\n### Piscines (organisations)");
            organizations.forEach(org => {
                instructions.push(`- Dessinez une piscine horizontale pour "${org}"`);
            });
        } else {
            instructions.push("\n### Piscines (organisations)");
            instructions.push("- Dessinez une piscine principale pour votre organisation");
        }
        
        // Instructions pour les couloirs
        if (roles.length > 0) {
            instructions.push("\n### Couloirs (rôles/fonctions)");
            roles.forEach(role => {
                instructions.push(`- Dans la piscine principale, créez un couloir pour "${role}"`);
            });
        }
    } else {
        instructions.push("\n- Créez une piscine principale pour votre organisation");
        instructions.push("- Identifiez les principaux rôles et créez un couloir pour chacun");
    }
    
    // Étape 2: Ajouter les événements de début
    instructions.push("\n## 2. Placer les événements de début");
    if (processData.sentences.length > 0) {
        const firstSentence = processData.sentences[0].toLowerCase();
        
        if (firstSentence.includes('reçoit') || firstSentence.includes('réceptionne')) {
            instructions.push("- Placez un événement de début de type message (⭕ avec une enveloppe à l'intérieur) dans le couloir concerné");
        } else if (firstSentence.includes('tous les') || firstSentence.includes('chaque') || 
                 firstSentence.includes('périodiquement') || firstSentence.includes('journalier')) {
            instructions.push("- Placez un événement de début de type minuterie (⭕ avec une horloge à l'intérieur) dans le couloir concerné");
        } else {
            instructions.push("- Placez un événement de début générique (⭕) dans le couloir qui initie le processus");
        }
    } else {
        instructions.push("- Placez un événement de début générique (⭕) dans le couloir qui initie le processus");
    }
    
    // Étape 3: Modéliser les activités et flux de séquence
    instructions.push("\n## 3. Tracer les activités et les flux de séquence");
    if (processData.activities.length > 0) {
        processData.activities.forEach((activity, index) => {
            const activitySymbol = getActivitySymbol(activity.type);
            instructions.push(`- Ajoutez une activité "${activity.description}" (${activitySymbol}) dans le couloir approprié`);
            
            if (index > 0) {
                instructions.push(`  - Reliez-la à l'élément précédent avec un flux de séquence (⏩)`);
            } else {
                instructions.push(`  - Reliez-la à l'événement de début avec un flux de séquence (⏩)`);
            }
        });
    } else {
        instructions.push("- Identifiez les principales activités du processus et ajoutez-les comme des tâches (⬜)");
        instructions.push("- Reliez-les avec des flux de séquence (⏩) pour montrer l'ordre d'exécution");
    }
    
    // Étape 4: Ajouter les passerelles de décision
    if (processData.decisions.length > 0) {
        instructions.push("\n## 4. Ajouter les passerelles de décision");
        processData.decisions.forEach(decision => {
            instructions.push(`- Pour la condition "${decision.condition}", ajoutez une passerelle exclusive (◇)`);
            instructions.push("  - Créez deux flux de séquence sortants pour les cas positif et négatif");
            instructions.push("  - Étiquetez chaque flux (ex: 'Oui'/'Non' ou 'Approuvé'/'Refusé')");
        });
    }
    
    // Étape 5: Intégrer les objets de données et magasins de données
    const hasDataObjects = processData.dataObjects.length > 0;
    const hasDataSources = processData.dataSources.length > 0;
    
    if (hasDataObjects || hasDataSources) {
        instructions.push("\n## 5. Intégrer les objets et magasins de données");
        
        if (hasDataObjects) {
            instructions.push("\n### Objets de données");
            processData.dataObjects.forEach(dataObject => {
                instructions.push(`- Ajoutez un objet de données (📄) pour "${dataObject}"`);
                instructions.push("  - Reliez-le aux activités concernées avec une association (➖)");
                instructions.push("  - Indiquez la direction de l'association selon que l'activité lit, crée ou met à jour l'objet");
            });
        }
        
        if (hasDataSources) {
            instructions.push("\n### Magasins de données");
            processData.dataSources.forEach(dataSource => {
                instructions.push(`- Ajoutez un magasin de données (🗄️) pour "${dataSource}"`);
                instructions.push("  - Reliez-le aux activités concernées avec une association (➖)");
                instructions.push("  - Indiquez la direction de l'association selon que l'activité lit, crée ou met à jour les données");
            });
        }
    }
    
    // Étape 6: Ajouter les flux de message
    if (processData.messages.length > 0) {
        instructions.push("\n## 6. Ajouter les flux de message");
        processData.messages.forEach(message => {
            instructions.push(`- Tracez un flux de message (〰️) entre "${message.sender}" et "${message.receiver}"`);
            instructions.push(`  - Le message concerne: "${message.content}"`);
        });
    }
    
    // Étape 7: Intégrer les minuteries
    if (processData.timers.length > 0) {
        instructions.push("\n## 7. Intégrer les événements temporels");
        processData.timers.forEach(timer => {
            instructions.push(`- Ajoutez un événement intermédiaire de type minuterie (⌛) pour "${timer.timerType}"`);
            instructions.push("  - Placez-le entre les activités concernées par ce délai");
        });
    }
    
    // Étape 8: Finaliser avec les événements de fin
    instructions.push("\n## 8. Finaliser avec les événements de fin");
    instructions.push("- Placez un événement de fin générique (⚫) pour chaque chemin terminal du processus");
    instructions.push("- Si le processus se termine par l'envoi d'un message, utilisez un événement de fin de type message (⚫ avec une enveloppe)");
    
    // Étape 9: Vérifications finales
    instructions.push("\n## 9. Vérifications finales");
    instructions.push("- Assurez-vous que chaque flux de séquence a un début et une fin");
    instructions.push("- Vérifiez que chaque chemin du processus mène à un événement de fin");
    instructions.push("- Confirmez que chaque flux de message relie correctement deux participants différents");
    instructions.push("- Vérifiez que les associations avec les objets et magasins de données ont le bon sens");
    
    return instructions.join('\n');
}

function getActivitySymbol(activityType) {
    switch (activityType) {
        case 'manuelle':
            return '👋 (tâche manuelle)';
        case 'utilisateur':
            return '👤 (tâche utilisateur)';
        case 'service':
            return '⚙️ (tâche service)';
        default:
            return '⬜ (tâche générique)';
    }
}

function generateBPMNConcepts(processData) {
    let concepts = [];
    
    // En-tête
    concepts.push("# Concepts BPMN importants pour votre modèle\n");
    
    // Concept 1: Piscines et couloirs
    concepts.push("## Organisation du modèle");
    if (processData.actors.length > 1) {
        concepts.push("- Utilisez des **piscines distinctes** pour représenter différentes organisations");
        concepts.push("- Utilisez des **couloirs** pour représenter les différents rôles ou fonctions au sein d'une organisation");
        concepts.push("- Les flux de séquence ne peuvent pas traverser les frontières d'une piscine");
    }
    
    // Concept 2: Flux de message vs. Flux de séquence
    if (processData.messages.length > 0) {
        concepts.push("\n## Flux de message vs. Flux de séquence");
        concepts.push("- Les **flux de séquence** (➡️) représentent l'ordre d'exécution des activités au sein d'un même participant");
        concepts.push("- Les **flux de message** (〰️) représentent les échanges d'information entre différents participants");
        concepts.push("- Les flux de message ne transportent pas le jeton du processus, ils indiquent seulement un échange d'information");
    }
    
    // Concept 3: Types d'activités
    let hasUserTasks = processData.activities.some(a => a.type === 'utilisateur');
    let hasManualTasks = processData.activities.some(a => a.type === 'manuelle');
    let hasServiceTasks = processData.activities.some(a => a.type === 'service');
    
    if (hasUserTasks || hasManualTasks || hasServiceTasks) {
        concepts.push("\n## Types d'activités");
        if (hasUserTasks) {
            concepts.push("- Les **tâches utilisateur** (👤) sont exécutées par une personne à l'aide d'un système d'information");
        }
        if (hasManualTasks) {
            concepts.push("- Les **tâches manuelles** (👋) sont exécutées par une personne sans l'aide d'un système d'information");
        }
        if (hasServiceTasks) {
            concepts.push("- Les **tâches service** (⚙️) sont exécutées automatiquement par un système sans intervention humaine");
        }
    }
    
    // Concept 4: Passerelles de décision
    if (processData.decisions.length > 0) {
        concepts.push("\n## Passerelles de décision");
        concepts.push("- Les **passerelles exclusives** (◇) représentent des points de décision où un seul chemin est suivi");
        concepts.push("- Chaque flux sortant d'une passerelle exclusive doit avoir une condition clairement identifiée");
        concepts.push("- Les passerelles peuvent aussi être utilisées pour la convergence de chemins alternatifs");
    }
    
    // Concept 5: Objets de données et magasins de données
    if (processData.dataObjects.length > 0 || processData.dataSources.length > 0) {
        concepts.push("\n## Données dans le processus");
        if (processData.dataObjects.length > 0) {
            concepts.push("- Les **objets de données** (📄) représentent les informations utilisées ou produites par les activités");
            concepts.push("- Un objet de données a un cycle de vie limité à l'instance du processus");
        }
        if (processData.dataSources.length > 0) {
            concepts.push("- Les **magasins de données** (🗄️) représentent des emplacements où les données sont stockées de façon persistante");
            concepts.push("- Un magasin de données persiste au-delà de l'instance du processus et peut être accédé par plusieurs instances");
        }
        concepts.push("- Les associations (➖) avec les données peuvent indiquer trois types d'interactions :");
        concepts.push("  1. **Lecture** : l'activité consulte les données");
        concepts.push("  2. **Création** : l'activité génère de nouvelles données");
        concepts.push("  3. **Mise à jour** : l'activité modifie des données existantes");
    }
    
    // Concept 6: Événements temporels
    if (processData.timers.length > 0) {
        concepts.push("\n## Événements temporels");
        concepts.push("- Les **événements minuterie** (⌛) représentent des délais ou des moments précis");
        concepts.push("- Un événement de début minuterie déclenche le processus à un moment précis ou périodiquement");
        concepts.push("- Un événement intermédiaire minuterie introduit une pause dans le processus jusqu'à ce que le délai soit écoulé");
    }
    
    // Concept 7: Notion de jeton
    concepts.push("\n## Notion de jeton dans BPMN");
    concepts.push("- Le **jeton** est un concept théorique qui illustre la progression d'une instance du processus");
    concepts.push("- Le jeton se déplace le long des flux de séquence et traverse les activités et événements");
    concepts.push("- Les passerelles contrôlent le routage du jeton selon les conditions spécifiées");
    
    return concepts.join('\n');
}
