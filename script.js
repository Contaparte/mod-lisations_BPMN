function generateInstructions() {
    const scenarioText = document.getElementById('inputScenario').value.trim();
    if (!scenarioText) {
        document.getElementById('outputInstructions').innerText = 'Veuillez entrer une description de processus.';
        document.getElementById('outputConcepts').innerText = '';
        return;
    }

    // Analyse approfondie du texte
    const processData = analyzeProcessComprehensively(scenarioText);
    
    // Génération des instructions de modélisation
    const modelingInstructions = generatePreciseModelingSteps(processData);
    document.getElementById('outputInstructions').innerText = modelingInstructions;
    
    // Génération des concepts BPMN importants
    const conceptsOutput = generateRelevantBPMNConcepts(processData);
    document.getElementById('outputConcepts').innerText = conceptsOutput;
}

function analyzeProcessComprehensively(text) {
    // Structure pour stocker les informations du processus
    const processData = {
        organizations: [],
        roles: [],
        activities: [],
        decisions: [],
        dataObjects: [],
        dataStores: [],
        messages: [],
        timers: [],
        eventStarts: [],
        eventEnds: [],
        sentences: []
    };

    // Prétraitement du texte
    const cleanedText = text.replace(/\s+/g, ' ').trim();
    
    // Découper le texte en phrases
    const sentences = splitIntoSentences(cleanedText);
    processData.sentences = sentences;
    
    // Identifier les organisations et les rôles
    identifyOrganizationsAndRoles(cleanedText, processData);
    
    // Extraire les activités avec leur séquence
    extractActivitiesWithSequence(sentences, processData);
    
    // Identifier les points de décision
    identifyDecisionPoints(sentences, processData);
    
    // Extraire les objets et magasins de données
    extractDataObjectsAndStores(sentences, processData);
    
    // Identifier les flux de message
    identifyMessageFlows(sentences, processData);
    
    // Identifier les événements temporels
    identifyTimeEvents(sentences, processData);
    
    // Identifier les événements de début et de fin
    identifyStartAndEndEvents(sentences, processData);

    // Effectuer des corrections contextuelles basées sur les cas typiques
    applyContextualCorrections(processData);

    return processData;
}

function splitIntoSentences(text) {
    // Diviser le texte en phrases tout en gérant les cas particuliers
    return text.split(/(?<=[.!?])\s+/)
        .map(s => s.trim())
        .filter(s => s.length > 0);
}

function identifyOrganizationsAndRoles(text, processData) {
    // Définir des règles spécifiques pour identifier les organisations
    const organizationPatterns = [
        { pattern: /club\s*optique/i, name: "Club Optique" },
        { pattern: /pharmacie/i, name: "Pharmacie" },
        { pattern: /service\s*(?:de\s*)?livraison/i, name: "Service livraison" },
        { pattern: /entreprise/i, name: "Entreprise" },
        { pattern: /société/i, name: "Société" },
        { pattern: /fournisseur/i, name: "Fournisseur" },
        { pattern: /client/i, name: "Client" }
    ];
    
    // Définir des règles spécifiques pour identifier les rôles
    const rolePatterns = [
        { pattern: /pharmacien/i, name: "Pharmacien", org: "Pharmacie" },
        { pattern: /représentant/i, name: "Représentant", org: "Club Optique" },
        { pattern: /préposé\s*(?:à\s*la\s*)?livraison/i, name: "Préposé à la livraison", org: "Club Optique" },
        { pattern: /service\s*(?:de\s*)?livraison/i, name: "Service livraison", org: "Club Optique" },
        { pattern: /vendeur/i, name: "Vendeur", org: "Club Optique" },
        { pattern: /chef\s*d['']équipe/i, name: "Chef d'équipe", org: "Club Optique" },
        { pattern: /responsable/i, name: "Responsable", org: "Club Optique" },
        { pattern: /client/i, name: "Client", org: "Client" }
    ];
    
    // Identifier les organisations
    for (const orgPattern of organizationPatterns) {
        if (orgPattern.pattern.test(text) && !processData.organizations.includes(orgPattern.name)) {
            processData.organizations.push(orgPattern.name);
        }
    }
    
    // Identifier les rôles
    for (const rolePattern of rolePatterns) {
        if (rolePattern.pattern.test(text) && !processData.roles.some(role => role.name === rolePattern.name)) {
            processData.roles.push({
                name: rolePattern.name,
                organization: rolePattern.org
            });
            
            // S'assurer que l'organisation associée est ajoutée
            if (!processData.organizations.includes(rolePattern.org) && 
                rolePattern.org !== "Club Optique" && rolePattern.org !== "Client") {
                processData.organizations.push(rolePattern.org);
            }
        }
    }
    
    // Consolidation des organisations
    if (processData.roles.some(role => role.organization === "Club Optique") && 
        !processData.organizations.includes("Club Optique")) {
        processData.organizations.push("Club Optique");
    }
    
    // Cas particulier pour Club Optique
    if (text.includes("Club Optique") || 
        text.includes("club optique") || 
        processData.roles.some(role => role.organization === "Club Optique")) {
        
        if (!processData.organizations.includes("Club Optique")) {
            processData.organizations.push("Club Optique");
        }
        
        // Ajouter automatiquement le Service livraison si non détecté
        const hasServiceLivraison = processData.roles.some(role => role.name === "Service livraison");
        if (!hasServiceLivraison && text.includes("livraison")) {
            processData.roles.push({
                name: "Service livraison",
                organization: "Club Optique"
            });
        }
    }
    
    // Si aucune organisation n'est détectée, ajouter une par défaut
    if (processData.organizations.length === 0) {
        processData.organizations.push("Organisation");
    }
}

function extractActivitiesWithSequence(sentences, processData) {
    // Extraire les activités et leur séquence
    const activityWords = [
        "reçoit", "valide", "vérifie", "consulte", "saisit", "note", "calcule",
        "photocopie", "classe", "identifie", "crée", "récupère", "emballe",
        "place", "envoie", "livre", "prépare", "contacte", "appelle", "traite"
    ];
    
    let activityNumber = 1;
    
    sentences.forEach((sentence, sentenceIndex) => {
        let sentenceLower = sentence.toLowerCase();
        
        // Vérifier si la phrase contient une activité
        const containsActivity = activityWords.some(word => sentenceLower.includes(word));
        
        if (containsActivity) {
            // Déterminer le type d'activité
            let activityType = determineActivityType(sentenceLower);
            
            // Déterminer le rôle responsable
            let responsibleRole = determineResponsibleRole(sentenceLower, processData.roles);
            
            // Extraction du verbe principal et de la description
            let activityDescription = extractActivityDescription(sentence, activityWords);
            
            // Corriger la description si nécessaire
            if (activityDescription.length > 60) {
                activityDescription = activityDescription.substring(0, 57) + "...";
            }
            
            // Ajouter l'activité à la liste
            processData.activities.push({
                id: activityNumber++,
                description: activityDescription,
                type: activityType,
                role: responsibleRole,
                sentenceIndex: sentenceIndex,
                fullSentence: sentence
            });
        }
    });
    
    // Établir la séquence des activités
    establishActivitySequence(processData);
}

function determineActivityType(sentenceLower) {
    // Déterminer le type d'activité (manuelle, utilisateur, service)
    if (sentenceLower.includes("système") && 
        (sentenceLower.includes("automatiquement") || 
         sentenceLower.includes("génère") || 
         sentenceLower.includes("envoie automatiquement"))) {
        return "service";
    } else if (sentenceLower.includes("système") || 
              sentenceLower.includes("base de données") || 
              sentenceLower.includes("saisit dans le système") || 
              sentenceLower.includes("application") ||
              sentenceLower.includes("logiciel")) {
        return "utilisateur";
    } else {
        return "manuelle";
    }
}

function determineResponsibleRole(sentenceLower, roles) {
    // Déterminer le rôle responsable de l'activité
    for (const role of roles) {
        if (sentenceLower.includes(role.name.toLowerCase())) {
            return role.name;
        }
    }
    
    // Inférence basée sur le contexte
    if (sentenceLower.includes("livraison") && !sentenceLower.includes("service de livraison")) {
        return "Préposé à la livraison";
    } else if (sentenceLower.includes("représentant") || sentenceLower.includes("service client")) {
        return "Représentant";
    } else if (sentenceLower.includes("service de livraison")) {
        return "Service livraison";
    }
    
    // Valeur par défaut
    return roles.length > 0 ? roles[0].name : "Non spécifié";
}

function extractActivityDescription(sentence, activityWords) {
    // Extraire une description significative de l'activité
    const lowerSentence = sentence.toLowerCase();
    
    // Trouver le mot d'activité dans la phrase
    let activityWord = null;
    let activityIndex = -1;
    
    for (const word of activityWords) {
        const index = lowerSentence.indexOf(word);
        if (index !== -1) {
            activityWord = word;
            activityIndex = index;
            break;
        }
    }
    
    if (activityIndex === -1) {
        // Si aucun mot d'activité n'est trouvé, utiliser la phrase entière
        return sentence;
    }
    
    // Déterminer les points de délimitation
    let startIndex = lowerSentence.lastIndexOf(".", activityIndex);
    startIndex = startIndex === -1 ? 0 : startIndex + 1;
    
    let endIndex = lowerSentence.indexOf(".", activityIndex);
    endIndex = endIndex === -1 ? lowerSentence.length : endIndex;
    
    // Extraire et nettoyer la description
    return sentence.substring(startIndex, endIndex).trim();
}

function establishActivitySequence(processData) {
    // Établir la séquence des activités
    processData.activities.forEach((activity, index) => {
        if (index < processData.activities.length - 1) {
            activity.nextActivity = processData.activities[index + 1].id;
        }
    });
}

function identifyDecisionPoints(sentences, processData) {
    // Identifier les points de décision dans le processus
    const decisionKeywords = ["si", "sinon", "lorsque", "quand", "dans le cas où", "condition"];
    
    sentences.forEach((sentence, index) => {
        const sentenceLower = sentence.toLowerCase();
        
        // Vérifier si la phrase contient un point de décision
        let containsDecisionPoint = false;
        let matchedKeyword = "";
        
        for (const keyword of decisionKeywords) {
            if (sentenceLower.includes(keyword)) {
                containsDecisionPoint = true;
                matchedKeyword = keyword;
                break;
            }
        }
        
        if (containsDecisionPoint) {
            // Extraire la condition de décision
            const condition = extractDecisionCondition(sentence, matchedKeyword);
            
            // Identifier les activités associées
            const nearbyActivities = findNearbyActivities(index, processData.activities);
            
            // Ajouter la décision à la liste
            processData.decisions.push({
                condition: condition,
                sentenceIndex: index,
                fullSentence: sentence,
                relatedActivities: nearbyActivities,
                outcomes: extractDecisionOutcomes(sentenceLower)
            });
        }
    });
    
    // Optimisations spécifiques pour les types communs de décisions
    optimizeDecisions(processData);
}

function extractDecisionCondition(sentence, keyword) {
    // Extraire la condition de décision
    const sentenceLower = sentence.toLowerCase();
    const keywordIndex = sentenceLower.indexOf(keyword);
    
    // Trouver la fin de la condition
    let endIndex = sentence.indexOf("?", keywordIndex);
    if (endIndex === -1) endIndex = sentence.indexOf(".", keywordIndex);
    if (endIndex === -1) endIndex = sentence.indexOf(",", keywordIndex);
    if (endIndex === -1) endIndex = sentence.length;
    
    // Extraire la condition complète
    return sentence.substring(keywordIndex, endIndex).trim();
}

function findNearbyActivities(sentenceIndex, activities) {
    // Trouver les activités proches d'une phrase
    return activities
        .filter(activity => Math.abs(activity.sentenceIndex - sentenceIndex) <= 2)
        .map(activity => activity.id);
}

function extractDecisionOutcomes(sentenceLower) {
    // Extraire les résultats possibles d'une décision
    let positiveOutcome = "Oui";
    let negativeOutcome = "Non";
    
    // Chercher des résultats spécifiques
    if (sentenceLower.includes("existe")) {
        positiveOutcome = "Existe";
        negativeOutcome = "N'existe pas";
    } else if (sentenceLower.includes("valide")) {
        positiveOutcome = "Valide";
        negativeOutcome = "Invalide";
    } else if (sentenceLower.includes("autorisé")) {
        positiveOutcome = "Autorisé";
        negativeOutcome = "Non autorisé";
    } else if (sentenceLower.includes("approuv")) {
        positiveOutcome = "Approuvé";
        negativeOutcome = "Refusé";
    }
    
    return { positive: positiveOutcome, negative: negativeOutcome };
}

function optimizeDecisions(processData) {
    // Optimisations pour les types courants de décisions
    
    // Cas particulier: Validation du pharmacien
    const pharmacienValidationIndex = processData.decisions.findIndex(
        decision => decision.condition.toLowerCase().includes("pharmacien") && 
                  decision.condition.toLowerCase().includes("autorisé")
    );
    
    if (pharmacienValidationIndex !== -1) {
        processData.decisions[pharmacienValidationIndex].condition = "Pharmacien sur la liste?";
        processData.decisions[pharmacienValidationIndex].outcomes = { positive: "Oui", negative: "Non" };
    }
    
    // Cas particulier: Montant de commande
    const montantCommandeIndex = processData.decisions.findIndex(
        decision => decision.condition.toLowerCase().includes("montant") &&
                   decision.condition.toLowerCase().includes("commande")
    );
    
    if (montantCommandeIndex !== -1) {
        const condition = processData.decisions[montantCommandeIndex].condition.toLowerCase();
        if (condition.includes("500") || condition.includes("cinq cents")) {
            processData.decisions[montantCommandeIndex].condition = "Montant > 500€?";
            processData.decisions[montantCommandeIndex].outcomes = { positive: "Oui", negative: "Non" };
        }
    }
}

function extractDataObjectsAndStores(sentences, processData) {
    // Extraire les objets et magasins de données
    const dataObjectKeywords = [
        { pattern: /(?:bon de|formulaire de) commande/i, name: "Bon de commande" },
        { pattern: /commande/i, name: "Commande" },
        { pattern: /formulaire de livraison/i, name: "Formulaire de livraison" },
        { pattern: /liste (?:des|de) pharmaciens/i, name: "Liste des pharmaciens" },
        { pattern: /copie/i, name: "Copie" },
        { pattern: /produit/i, name: "Produit" },
        { pattern: /facture/i, name: "Facture" }
    ];
    
    const dataStoreKeywords = [
        { pattern: /filière des commandes/i, name: "Filière des commandes" },
        { pattern: /dossier des livraisons/i, name: "Dossier des livraisons" },
        { pattern: /base de données/i, name: "Base de données" },
        { pattern: /système/i, name: "Système" }
    ];
    
    sentences.forEach((sentence, index) => {
        // Chercher les objets de données
        for (const dataKeyword of dataObjectKeywords) {
            if (dataKeyword.pattern.test(sentence) && 
                !processData.dataObjects.some(obj => obj.name === dataKeyword.name)) {
                
                // Déterminer le type d'interaction
                const interaction = determineDataInteraction(sentence.toLowerCase());
                
                // Trouver l'activité liée
                const relatedActivity = findRelatedActivity(index, processData.activities);
                
                processData.dataObjects.push({
                    name: dataKeyword.name,
                    interaction: interaction,
                    sentenceIndex: index,
                    relatedActivity: relatedActivity
                });
            }
        }
        
        // Chercher les magasins de données
        for (const storeKeyword of dataStoreKeywords) {
            if (storeKeyword.pattern.test(sentence) && 
                !processData.dataStores.some(store => store.name === storeKeyword.name)) {
                
                // Déterminer le type d'interaction
                const interaction = determineDataInteraction(sentence.toLowerCase());
                
                // Trouver l'activité liée
                const relatedActivity = findRelatedActivity(index, processData.activities);
                
                processData.dataStores.push({
                    name: storeKeyword.name,
                    interaction: interaction,
                    sentenceIndex: index,
                    relatedActivity: relatedActivity
                });
            }
        }
    });
    
    // Cas particulier pour Club Optique: ajout implicite de la liste des pharmaciens
    if (!processData.dataObjects.some(obj => obj.name === "Liste des pharmaciens") && 
        sentences.some(s => s.toLowerCase().includes("pharmacien") && 
                        (s.toLowerCase().includes("liste") || 
                         s.toLowerCase().includes("autorisé") || 
                         s.toLowerCase().includes("vérifie")))) {
        
        // Trouver l'activité de vérification
        const verificationActivity = processData.activities.find(a => 
            a.description.toLowerCase().includes("valide") || 
            a.description.toLowerCase().includes("vérifie") || 
            a.description.toLowerCase().includes("consulte"));
        
        if (verificationActivity) {
            processData.dataObjects.push({
                name: "Liste des pharmaciens",
                interaction: "lecture",
                sentenceIndex: verificationActivity.sentenceIndex,
                relatedActivity: verificationActivity.id
            });
        }
    }
}

function determineDataInteraction(sentenceLower) {
    // Déterminer le type d'interaction avec les données
    if (sentenceLower.includes("crée") || 
        sentenceLower.includes("génère") || 
        sentenceLower.includes("produit") || 
        sentenceLower.includes("rédige")) {
        return "création";
    } else if (sentenceLower.includes("met à jour") || 
              sentenceLower.includes("modifie") || 
              sentenceLower.includes("change")) {
        return "mise à jour";
    } else {
        return "lecture";
    }
}

function findRelatedActivity(sentenceIndex, activities) {
    // Trouver l'activité la plus proche d'une phrase
    const closestActivity = activities
        .reduce((closest, current) => {
            const currentDiff = Math.abs(current.sentenceIndex - sentenceIndex);
            const closestDiff = closest ? Math.abs(closest.sentenceIndex - sentenceIndex) : Infinity;
            return currentDiff < closestDiff ? current : closest;
        }, null);
    
    return closestActivity ? closestActivity.id : null;
}

function identifyMessageFlows(sentences, processData) {
    // Identifier les flux de message dans le processus
    const messageKeywords = ["envoie", "transmet", "communique", "notifie", "informe", "contacte", "appelle"];
    
    sentences.forEach((sentence, index) => {
        const sentenceLower = sentence.toLowerCase();
        
        // Vérifier si la phrase contient un échange de message
        const hasMessageFlow = messageKeywords.some(keyword => sentenceLower.includes(keyword));
        
        if (hasMessageFlow) {
            // Déterminer les participants de la communication
            const { sender, receiver } = determineMessageParticipants(sentenceLower, processData.roles);
            
            // Déterminer le contenu du message
            const content = determineMessageContent(sentence);
            
            // Trouver l'activité liée
            const relatedActivity = findRelatedActivity(index, processData.activities);
            
            // Ajouter le flux de message
            processData.messages.push({
                sender: sender,
                receiver: receiver,
                content: content,
                sentenceIndex: index,
                relatedActivity: relatedActivity
            });
        }
    });
    
    // Cas particulier pour Club Optique
    if (processData.organizations.includes("Club Optique") && 
        processData.organizations.includes("Pharmacie") && 
        !processData.messages.some(msg => 
            (msg.sender === "Pharmacien" && msg.receiver === "Représentant") || 
            (msg.sender === "Représentant" && msg.receiver === "Pharmacien"))) {
        
        // Ajouter un flux de message implicite
        const pharmacienActivity = processData.activities.find(a => 
            a.description.toLowerCase().includes("contact") || 
            a.description.toLowerCase().includes("téléphone") || 
            a.description.toLowerCase().includes("appelle"));
        
        if (pharmacienActivity) {
            processData.messages.push({
                sender: "Pharmacien",
                receiver: "Représentant",
                content: "Commande",
                sentenceIndex: pharmacienActivity.sentenceIndex,
                relatedActivity: pharmacienActivity.id
            });
        }
    }
}

function determineMessageParticipants(sentenceLower, roles) {
    // Déterminer les participants d'un échange de message
    let sender = "Non spécifié";
    let receiver = "Non spécifié";
    
    // Chercher les participants potentiels
    for (const role of roles) {
        const roleLower = role.name.toLowerCase();
        if (sentenceLower.includes(roleLower)) {
            if (sender === "Non spécifié") {
                sender = role.name;
            } else if (receiver === "Non spécifié" && role.name !== sender) {
                receiver = role.name;
            }
        }
    }
    
    // Inférence contextuelle
    if (sender === "Non spécifié" || receiver === "Non spécifié") {
        if (sentenceLower.includes("pharmacien") && sentenceLower.includes("représentant")) {
            if (sentenceLower.indexOf("pharmacien") < sentenceLower.indexOf("représentant")) {
                return { sender: "Pharmacien", receiver: "Représentant" };
            } else {
                return { sender: "Représentant", receiver: "Pharmacien" };
            }
        } else if (sentenceLower.includes("préposé") && sentenceLower.includes("service de livraison")) {
            return { sender: "Préposé à la livraison", receiver: "Service livraison" };
        }
    }
    
    return { sender, receiver };
}

function determineMessageContent(sentence) {
    // Déterminer le contenu d'un message
    const sentenceLower = sentence.toLowerCase();
    
    if (sentenceLower.includes("commande") || sentenceLower.includes("bon de commande")) {
        return "Bon de commande";
    } else if (sentenceLower.includes("livraison") || sentenceLower.includes("formulaire de livraison")) {
        return "Formulaire de livraison";
    } else if (sentenceLower.includes("télépho")) {
        return "Commande téléphonique";
    } else if (sentenceLower.includes("copie")) {
        return "Copie";
    } else if (sentenceLower.includes("produit")) {
        return "Produits";
    } else {
        return "Message";
    }
}

function identifyTimeEvents(sentences, processData) {
    // Identifier les événements temporels
    const timeKeywords = [
        { pattern: /le matin/i, description: "Le matin" },
        { pattern: /chaque matin/i, description: "Chaque matin" },
        { pattern: /tous les matins/i, description: "Tous les matins" },
        { pattern: /le lendemain/i, description: "Le lendemain" },
        { pattern: /le jour suivant/i, description: "Le jour suivant" }
    ];
    
    sentences.forEach((sentence, index) => {
        // Vérifier si la phrase contient un événement temporel
        for (const timeKeyword of timeKeywords) {
            if (timeKeyword.pattern.test(sentence)) {
                // Trouver l'activité liée
                const relatedActivity = findRelatedActivity(index, processData.activities);
                
                // Ajouter l'événement temporel
                processData.timers.push({
                    description: timeKeyword.description,
                    sentenceIndex: index,
                    relatedActivity: relatedActivity
                });
                
                break;
            }
        }
    });
    
    // Cas particulier pour Club Optique
    if (processData.organizations.includes("Club Optique") && 
        !processData.timers.some(timer => 
            timer.description.includes("matin") || 
            timer.description.includes("lendemain"))) {
        
        // Vérifier s'il y a une mention implicite d'un délai
        const morningActivity = processData.activities.find(a => 
            a.description.toLowerCase().includes("identifie") || 
            a.description.toLowerCase().includes("commandes à livrer"));
        
        if (morningActivity) {
            processData.timers.push({
                description: "Le matin",
                sentenceIndex: morningActivity.sentenceIndex,
                relatedActivity: morningActivity.id
            });
        }
    }
}

function identifyStartAndEndEvents(sentences, processData) {
    // Identifier les événements de début et de fin
    
    // Événement de début (généralement associé à la première activité)
    if (processData.activities.length > 0) {
        const firstActivity = processData.activities[0];
        
        let startEventType = "générique";
        if (firstActivity.description.toLowerCase().includes("reçoit") || 
            firstActivity.description.toLowerCase().includes("réceptionne")) {
            startEventType = "message";
        } else if (processData.timers.some(timer => 
            timer.sentenceIndex === firstActivity.sentenceIndex || 
            timer.relatedActivity === firstActivity.id)) {
            startEventType = "minuterie";
        }
        
        processData.eventStarts.push({
            type: startEventType,
            role: firstActivity.role,
            relatedActivity: firstActivity.id
        });
    }
    
    // Événements de fin (généralement associés aux dernières activités ou aux fins explicites)
    const endSentences = sentences.filter(s => 
        s.toLowerCase().includes("fin") || 
        s.toLowerCase().includes("termine") || 
        s.toLowerCase().includes("complété"));
    
    if (endSentences.length > 0) {
        endSentences.forEach(sentence => {
            const sentenceIndex = sentences.indexOf(sentence);
            const relatedActivity = findRelatedActivity(sentenceIndex, processData.activities);
            
            let endEventType = "générique";
            if (sentence.toLowerCase().includes("envoie") || 
                sentence.toLowerCase().includes("notifie")) {
                endEventType = "message";
            }
            
            const relatedActivityObj = processData.activities.find(a => a.id === relatedActivity);
            
            processData.eventEnds.push({
                type: endEventType,
                role: relatedActivityObj ? relatedActivityObj.role : "Non spécifié",
                relatedActivity: relatedActivity,
                description: "Fin du processus"
            });
        });
    } else if (processData.activities.length > 0) {
        // Par défaut, associer un événement de fin à la dernière activité
        const lastActivity = processData.activities[processData.activities.length - 1];
        
        let endEventType = "générique";
        if (lastActivity.description.toLowerCase().includes("envoie") || 
            lastActivity.description.toLowerCase().includes("notifie") || 
            lastActivity.description.toLowerCase().includes("livre")) {
            endEventType = "message";
        }
        
        processData.eventEnds.push({
            type: endEventType,
            role: lastActivity.role,
            relatedActivity: lastActivity.id,
            description: "Commande complétée"
        });
    }
    
    // Ajouter des événements de fin pour chaque chemin alternatif des décisions
    processData.decisions.forEach(decision => {
        const negativeOutcomeActivity = findActivityAfterNegativeOutcome(decision, processData);
        
        if (negativeOutcomeActivity && 
            !processData.eventEnds.some(end => end.relatedActivity === negativeOutcomeActivity.id)) {
            
            processData.eventEnds.push({
                type: "générique",
                role: negativeOutcomeActivity.role,
                relatedActivity: negativeOutcomeActivity.id,
                description: `${decision.outcomes.negative}`
            });
        }
    });
}

function findActivityAfterNegativeOutcome(decision, processData) {
    // Trouver l'activité après un résultat négatif d'une décision
    const decisionIndex = decision.sentenceIndex;
    
    // Chercher une activité qui suit immédiatement la décision négative
    const potentialActivities = processData.activities.filter(a => 
        a.sentenceIndex > decisionIndex && 
        a.sentenceIndex <= decisionIndex + 3);
    
    if (potentialActivities.length > 0) {
        return potentialActivities[0];
    }
    
    return null;
}

function applyContextualCorrections(processData) {
    // Appliquer des corrections contextuelles spécifiques aux cas courants
    
    // Correction pour Club Optique
    if (processData.organizations.includes("Club Optique")) {
        // S'assurer que les bons rôles sont présents
        const expectedRoles = ["Pharmacien", "Représentant", "Préposé à la livraison", "Service livraison"];
        
        expectedRoles.forEach(role => {
            if (!processData.roles.some(r => r.name === role)) {
                let organization = "Club Optique";
                if (role === "Pharmacien") organization = "Pharmacie";
                
                processData.roles.push({
                    name: role,
                    organization: organization
                });
            }
        });
        
        // S'assurer que les organisations clés sont présentes
        if (!processData.organizations.includes("Pharmacie")) {
            processData.organizations.push("Pharmacie");
        }
        
        // Corriger le service livraison
        const serviceLivraisonRole = processData.roles.find(r => r.name === "Service livraison");
        if (serviceLivraisonRole) {
            serviceLivraisonRole.organization = "Club Optique";
        }
    }
    
    // Corriger les rôles pour les activités
    processData.activities.forEach(activity => {
        // Corriger les rôles pour les activités spécifiques
        if (activity.description.toLowerCase().includes("préposé") || 
            activity.description.toLowerCase().includes("livraison")) {
            activity.role = "Préposé à la livraison";
        } else if (activity.description.toLowerCase().includes("représentant")) {
            activity.role = "Représentant";
        } else if (activity.description.toLowerCase().includes("pharmacien")) {
            activity.role = "Pharmacien";
        }
    });
    
    // Corriger et optimiser les objets de données
    if (processData.dataObjects.some(obj => obj.name === "Commande") && 
        !processData.dataObjects.some(obj => obj.name === "Bon de commande")) {
        
        const commandeObj = processData.dataObjects.find(obj => obj.name === "Commande");
        
        processData.dataObjects.push({
            name: "Bon de commande",
            interaction: "création",
            sentenceIndex: commandeObj.sentenceIndex,
            relatedActivity: commandeObj.relatedActivity
        });
    }
    
    // Corriger les flux de message pour Club Optique
    if (processData.organizations.includes("Club Optique") && processData.organizations.includes("Pharmacie")) {
        const hasCommandeFlow = processData.messages.some(msg => 
            msg.sender === "Pharmacien" && 
            msg.receiver === "Représentant" && 
            msg.content === "Commande");
        
        if (!hasCommandeFlow) {
            // Trouver une activité pertinente pour le flux de commande
            const commandeActivity = processData.activities.find(a => 
                a.description.toLowerCase().includes("commande") && 
                a.role === "Représentant");
            
            if (commandeActivity) {
                processData.messages.push({
                    sender: "Pharmacien",
                    receiver: "Représentant",
                    content: "Commande",
                    sentenceIndex: commandeActivity.sentenceIndex,
                    relatedActivity: commandeActivity.id
                });
            }
        }
        
        const hasLivraisonFlow = processData.messages.some(msg => 
            msg.sender === "Préposé à la livraison" && 
            msg.receiver === "Service livraison");
        
        if (!hasLivraisonFlow) {
            // Trouver une activité pertinente pour le flux de livraison
            const livraisonActivity = processData.activities.find(a => 
                a.description.toLowerCase().includes("envoie") && 
                a.description.toLowerCase().includes("copie") && 
                a.role === "Préposé à la livraison");
            
            if (livraisonActivity) {
                processData.messages.push({
                    sender: "Préposé à la livraison",
                    receiver: "Service livraison",
                    content: "Formulaire de livraison",
                    sentenceIndex: livraisonActivity.sentenceIndex,
                    relatedActivity: livraisonActivity.id
                });
            }
        }
    }
}

function generatePreciseModelingSteps(processData) {
    let instructions = [];
    
    // En-tête
    instructions.push("# Instructions de modélisation BPMN\n");
    
    // Étape 1: Définir les piscines et couloirs
    instructions.push("## 1. Définir les piscines et couloirs\n");
    
    // Organiser les organisations et rôles
    const clubOptique = processData.organizations.includes("Club Optique");
    const hasExternalOrg = processData.organizations.some(org => 
        org !== "Club Optique" && 
        org !== "Organisation" && 
        org !== "Organisation principale");
    
    instructions.push("### Piscines (organisations)");
    
    if (clubOptique) {
        // Cas Club Optique
        if (processData.organizations.includes("Pharmacie")) {
            instructions.push(`- Créez une piscine horizontale pour "Pharmacie"`);
        }
        instructions.push(`- Créez une piscine principale pour "Club Optique" qui contiendra les couloirs internes`);
    } else if (hasExternalOrg) {
        // Cas avec organisations externes
        const externalOrgs = processData.organizations.filter(org => 
            org !== "Organisation" && 
            org !== "Organisation principale");
        
        const mainOrg = processData.organizations.find(org => 
            org !== "Pharmacie" && 
            org !== "Client" && 
            org !== "Fournisseur");
        
        externalOrgs.forEach(org => {
            if (org === "Pharmacie" || org === "Client" || org === "Fournisseur") {
                instructions.push(`- Créez une piscine horizontale pour "${org}"`);
            }
        });
        
        if (mainOrg) {
            instructions.push(`- Créez une piscine principale pour "${mainOrg}" qui contiendra les couloirs internes`);
        } else {
            instructions.push(`- Créez une piscine principale pour l'organisation interne qui contiendra les couloirs`);
        }
    } else {
        // Cas par défaut
        instructions.push(`- Créez une piscine principale pour l'organisation qui contiendra tous les couloirs`);
    }
    
    // Couloirs
    if (processData.roles.length > 0) {
        instructions.push("\n### Couloirs (rôles/fonctions)");
        
        // Trier les rôles par organisation
        const internalRoles = processData.roles.filter(role => 
            role.organization === "Club Optique" || 
            role.organization === "Organisation" || 
            role.organization === undefined);
        
        const externalRoles = processData.roles.filter(role => 
            role.organization === "Pharmacie" || 
            role.organization === "Client" || 
            role.organization === "Fournisseur");
        
        // Ajouter les couloirs externes
        externalRoles.forEach(role => {
            instructions.push(`- Dans la piscine "${role.organization}", créez un couloir pour "${role.name}"`);
        });
        
        // Ajouter les couloirs internes
        internalRoles.forEach(role => {
            instructions.push(`- Dans la piscine principale, créez un couloir pour "${role.name}"`);
        });
    } else {
        instructions.push("\n- Créez les couloirs nécessaires dans la piscine principale pour chaque rôle identifié");
    }
    
    // Étape 2: Placer les événements de début
    instructions.push("\n## 2. Placer les événements de début");
    
    if (processData.eventStarts.length > 0) {
        processData.eventStarts.forEach(eventStart => {
            if (eventStart.type === "message") {
                instructions.push(`- Placez un événement de début de type message (⭕ avec une enveloppe à l'intérieur) dans le couloir "${eventStart.role}"`);
            } else if (eventStart.type === "minuterie") {
                const timer = processData.timers.find(t => t.relatedActivity === eventStart.relatedActivity);
                const timerDesc = timer ? timer.description : "Timer";
                instructions.push(`- Placez un événement de début de type minuterie (⭕ avec une horloge à l'intérieur) dans le couloir "${eventStart.role}"`);
                instructions.push(`  - Étiquetez-le avec "${timerDesc}"`);
            } else {
                instructions.push(`- Placez un événement de début générique (⭕) dans le couloir "${eventStart.role}"`);
            }
        });
    } else if (processData.activities.length > 0) {
        const firstActivity = processData.activities[0];
        instructions.push(`- Placez un événement de début générique (⭕) dans le couloir "${firstActivity.role}"`);
    } else {
        instructions.push(`- Placez un événement de début générique (⭕) dans le couloir principal`);
    }
    
    // Étape 3: Modéliser les activités et les flux de séquence
    instructions.push("\n## 3. Modéliser les activités et les flux de séquence");
    
    processData.activities.forEach((activity, index) => {
        const activitySymbol = getActivitySymbol(activity.type);
        instructions.push(`- Ajoutez une activité "${activity.description}" (${activitySymbol}) dans le couloir "${activity.role}"`);
        
        if (index === 0) {
            instructions.push(`  - Reliez-la à l'événement de début par un flux de séquence (⏩)`);
        } else {
            instructions.push(`  - Reliez-la à l'élément précédent par un flux de séquence (⏩)`);
        }
    });
    
    // Étape 4: Ajouter les passerelles de décision
    if (processData.decisions.length > 0) {
        instructions.push("\n## 4. Ajouter les passerelles de décision");
        
        processData.decisions.forEach(decision => {
            const activityId = decision.relatedActivities.length > 0 ? decision.relatedActivities[0] : null;
            const activity = activityId ? processData.activities.find(a => a.id === activityId) : null;
            const role = activity ? activity.role : "Non spécifié";
            
            instructions.push(`- Ajoutez une passerelle exclusive (◇) dans le couloir "${role}" pour évaluer la condition "${decision.condition}"`);
            instructions.push(`  - Créez un flux de séquence sortant étiqueté "${decision.outcomes.positive}" pour le cas où la condition est vraie`);
            instructions.push(`  - Créez un flux de séquence sortant étiqueté "${decision.outcomes.negative}" pour le cas où la condition est fausse`);
        });
    }
    
    // Étape 5: Intégrer les objets et magasins de données
    if (processData.dataObjects.length > 0 || processData.dataStores.length > 0) {
        instructions.push("\n## 5. Intégrer les objets et magasins de données");
        
        if (processData.dataObjects.length > 0) {
            instructions.push("\n### Objets de données");
            
            processData.dataObjects.forEach(dataObject => {
                instructions.push(`- Ajoutez un objet de données (📄) nommé "${dataObject.name}"`);
                
                if (dataObject.relatedActivity) {
                    const activity = processData.activities.find(a => a.id === dataObject.relatedActivity);
                    
                    if (activity) {
                        const interactionDirection = getInteractionDirection(dataObject.interaction);
                        instructions.push(`  - Reliez-le à l'activité "${activity.description}" avec une association ${interactionDirection}`);
                    }
                }
            });
        }
        
        if (processData.dataStores.length > 0) {
            instructions.push("\n### Magasins de données");
            
            processData.dataStores.forEach(dataStore => {
                instructions.push(`- Ajoutez un magasin de données (🗄️) nommé "${dataStore.name}"`);
                
                if (dataStore.relatedActivity) {
                    const activity = processData.activities.find(a => a.id === dataStore.relatedActivity);
                    
                    if (activity) {
                        const interactionDirection = getInteractionDirection(dataStore.interaction);
                        instructions.push(`  - Reliez-le à l'activité "${activity.description}" avec une association ${interactionDirection}`);
                    }
                }
            });
        }
    }
    
    // Étape 6: Intégrer les flux de message
    if (processData.messages.length > 0) {
        instructions.push("\n## 6. Intégrer les flux de message");
        
        processData.messages.forEach(message => {
            instructions.push(`- Tracez un flux de message (〰️) pour "${message.content}" du couloir "${message.sender}" vers "${message.receiver}"`);
        });
    }
    
    // Étape 7: Ajouter les événements temporels
    if (processData.timers.length > 0) {
        instructions.push("\n## 7. Ajouter les événements temporels");
        
        processData.timers.forEach(timer => {
            if (timer.relatedActivity) {
                const activity = processData.activities.find(a => a.id === timer.relatedActivity);
                
                if (activity) {
                    instructions.push(`- Ajoutez un événement intermédiaire de type minuterie (⌛) dans le couloir "${activity.role}"`);
                    instructions.push(`  - Étiquetez-le avec "${timer.description}"`);
                    instructions.push(`  - Placez-le entre les activités appropriées et reliez-le avec des flux de séquence`);
                }
            }
        });
    }
    
    // Étape 8: Finaliser avec les événements de fin
    instructions.push("\n## 8. Finaliser avec les événements de fin");
    
    if (processData.eventEnds.length > 0) {
        processData.eventEnds.forEach(eventEnd => {
            if (eventEnd.type === "message") {
                instructions.push(`- Placez un événement de fin de type message (⚫ avec une enveloppe à l'intérieur) dans le couloir "${eventEnd.role}"`);
                instructions.push(`  - Reliez-le à la dernière activité par un flux de séquence (⏩)`);
                instructions.push(`  - Étiquetez-le avec "${eventEnd.description}"`);
            } else {
                instructions.push(`- Placez un événement de fin générique (⚫) dans le couloir "${eventEnd.role}"`);
                instructions.push(`  - Reliez-le à la dernière activité par un flux de séquence (⏩)`);
                
                if (eventEnd.description) {
                    instructions.push(`  - Étiquetez-le avec "${eventEnd.description}"`);
                }
            }
        });
    } else if (processData.activities.length > 0) {
        const lastActivity = processData.activities[processData.activities.length - 1];
        instructions.push(`- Placez un événement de fin générique (⚫) dans le couloir "${lastActivity.role}"`);
        instructions.push(`  - Reliez-le à la dernière activité par un flux de séquence (⏩)`);
    }
    
    if (processData.decisions.length > 0) {
        instructions.push("- Ajoutez des événements de fin supplémentaires pour chaque chemin alternatif issu des passerelles");
    }
    
    // Étape 9: Vérifications finales
    instructions.push("\n## 9. Vérifications finales");
    instructions.push("- Assurez-vous que chaque flux de séquence a un début et une fin");
    instructions.push("- Vérifiez que chaque chemin du processus mène à un événement de fin");
    instructions.push("- Confirmez que les flux de message traversent bien les frontières des piscines");
    instructions.push("- Vérifiez que les associations avec les objets et magasins de données ont le bon sens");
    
    return instructions.join('\n');
}

function getActivitySymbol(activityType) {
    // Retourner le symbole approprié pour le type d'activité
    switch (activityType) {
        case "manuelle":
            return "👋 (tâche manuelle)";
        case "utilisateur":
            return "👤 (tâche utilisateur)";
        case "service":
            return "⚙️ (tâche service)";
        default:
            return "⬜ (tâche générique)";
    }
}

function getInteractionDirection(interaction) {
    // Déterminer la direction de l'association en fonction du type d'interaction
    switch (interaction) {
        case "lecture":
            return "indiquant une lecture (flèche vers l'activité)";
        case "création":
            return "indiquant une création (flèche vers l'objet)";
        case "mise à jour":
            return "indiquant une mise à jour (flèche bidirectionnelle)";
        default:
            return "indiquant une lecture (flèche vers l'activité)";
    }
}

function generateRelevantBPMNConcepts(processData) {
    let concepts = [];
    
    // En-tête
    concepts.push("# Concepts BPMN importants pour votre modèle\n");
    
    // Concept 1: Structure du modèle
    concepts.push("## Structure organisationnelle");
    concepts.push("- Les **piscines** représentent des organisations ou entités distinctes participant au processus");
    concepts.push("- Les **couloirs** représentent des rôles ou fonctions au sein d'une même organisation");
    concepts.push("- Les flux de séquence ne peuvent pas traverser les frontières d'une piscine");
    concepts.push("- Pour communiquer entre différentes piscines, utilisez des flux de message");
    
    // Concept 2: Événements et flux
    concepts.push("\n## Événements et flux");
    concepts.push("- Les **événements de début** (⭕) marquent le déclenchement du processus");
    concepts.push("- Les **événements de fin** (⚫) marquent la fin d'un chemin du processus");
    
    if (processData.messages.length > 0) {
        concepts.push("- Les **flux de message** (〰️) représentent les échanges d'information entre différents participants");
    }
    
    if (processData.timers.length > 0) {
        concepts.push("- Les **événements minuterie** (⌛) représentent des délais ou des moments précis");
    }
    
    // Concept 3: Types d'activités
    concepts.push("\n## Types d'activités");
    
    const hasManualActivities = processData.activities.some(a => a.type === "manuelle");
    const hasUserActivities = processData.activities.some(a => a.type === "utilisateur");
    const hasServiceActivities = processData.activities.some(a => a.type === "service");
    
    if (hasManualActivities) {
        concepts.push("- Les **tâches manuelles** (👋) sont exécutées par une personne sans l'aide d'un système d'information");
    }
    
    if (hasUserActivities) {
        concepts.push("- Les **tâches utilisateur** (👤) sont exécutées par une personne à l'aide d'un système d'information");
    }
    
    if (hasServiceActivities) {
        concepts.push("- Les **tâches service** (⚙️) sont exécutées automatiquement par un système sans intervention humaine");
    }
    
    // Concept 4: Passerelles et décisions
    if (processData.decisions.length > 0) {
        concepts.push("\n## Passerelles et décisions");
        concepts.push("- Les **passerelles exclusives** (◇) représentent des points de décision où une seule condition peut être vraie");
        concepts.push("- Chaque flux sortant doit être étiqueté avec sa condition (Oui/Non ou autre)");
        concepts.push("- Une passerelle peut servir à diviser le flux (prise de décision) ou à le fusionner (jonction de chemins alternatifs)");
    }
    
    // Concept 5: Données
    if (processData.dataObjects.length > 0 || processData.dataStores.length > 0) {
        concepts.push("\n## Gestion des données");
        
        if (processData.dataObjects.length > 0) {
            concepts.push("- Les **objets de données** (📄) représentent les informations utilisées pendant l'exécution du processus");
            concepts.push("  - Ils ont un cycle de vie limité à l'instance du processus");
        }
        
        if (processData.dataStores.length > 0) {
            concepts.push("- Les **magasins de données** (🗄️) représentent des emplacements où les données sont stockées de façon persistante");
            concepts.push("  - Ils survivent à l'exécution d'une instance du processus");
        }
        
        concepts.push("- Les **associations** montrent comment les activités interagissent avec les données :");
        concepts.push("  - **Lecture** : Flèche pointant vers l'activité");
        concepts.push("  - **Création** : Flèche pointant vers l'objet ou le magasin");
        concepts.push("  - **Mise à jour** : Flèche bidirectionnelle");
    }
    
    // Ajout de conseils spécifiques au contexte
    if (processData.organizations.includes("Club Optique")) {
        concepts.push("\n## Conseils pour ce processus de commande et livraison");
        concepts.push("- Assurez-vous que le flux de commande entre le pharmacien et le représentant est clairement modélisé");
        concepts.push("- Représentez correctement la validation du pharmacien avec une passerelle exclusive");
        concepts.push("- Modélisez le délai entre la prise de commande et le traitement par le préposé à la livraison");
        concepts.push("- Assurez-vous que le flux du formulaire de livraison vers le service de livraison est bien représenté");
    }
    
    return concepts.join('\n');
}
