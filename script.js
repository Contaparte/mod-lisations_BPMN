function generateInstructions() {
    const scenarioText = document.getElementById('inputScenario').value.trim();
    if (!scenarioText) {
        document.getElementById('outputInstructions').innerText = 'Veuillez entrer une description de processus.';
        document.getElementById('outputConcepts').innerText = '';
        return;
    }

    // Prétraitement du texte
    const cleanedText = preprocessText(scenarioText);
    
    // Analyse du texte
    const processData = analyzeProcess(cleanedText);
    
    // Génération des instructions de modélisation
    const modelingInstructions = generateModelingSteps(processData);
    document.getElementById('outputInstructions').innerText = modelingInstructions;
    
    // Génération des concepts BPMN importants
    const conceptsOutput = generateBPMNConcepts(processData);
    document.getElementById('outputConcepts').innerText = conceptsOutput;
}

function preprocessText(text) {
    // Nettoyer le texte pour faciliter l'analyse
    return text
        .replace(/\s+/g, ' ')
        .replace(/\(\w+\)/g, '') // Enlever les parenthèses avec contenu alpha
        .trim();
}

function analyzeProcess(text) {
    // Structure pour stocker les informations analysées
    const processData = {
        organizations: [],
        roles: [],
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
    
    // Extraire les noms d'organisations et rôles explicitement mentionnés
    extractOrganizationsAndRoles(text, processData);
    
    // Analyser chaque phrase
    sentences.forEach(sentence => {
        // Identifier les activités
        findActivities(sentence, processData);
        
        // Identifier les décisions
        findDecisions(sentence, processData);
        
        // Identifier les objets de données et magasins de données
        findDataObjects(sentence, processData);
        
        // Identifier les messages
        findMessages(sentence, processData);
        
        // Identifier les minuteries
        findTimers(sentence, processData);
    });
    
    // Si aucune organisation n'a été détectée, ajouter une organisation principale
    if (processData.organizations.length === 0) {
        inferOrganizationsFromContext(processData);
    }
    
    return processData;
}

function extractOrganizationsAndRoles(text, processData) {
    // Liste de mots clés pour les organisations
    const organizationKeywords = [
        { name: "pharmacie", standardName: "Pharmacie" },
        { name: "club optique", standardName: "Club Optique" },
        { name: "service livraison", standardName: "Service livraison" },
        { name: "service client", standardName: "Service client" },
        { name: "entreprise", standardName: "Entreprise" },
        { name: "société", standardName: "Société" },
        { name: "fournisseur", standardName: "Fournisseur" },
        { name: "banque", standardName: "Banque" },
        { name: "hôpital", standardName: "Hôpital" },
        { name: "université", standardName: "Université" }
    ];
    
    // Liste de mots clés pour les rôles
    const roleKeywords = [
        { name: "pharmacien", standardName: "Pharmacien" },
        { name: "représentant", standardName: "Représentant" },
        { name: "préposé à la livraison", standardName: "Préposé à la livraison" },
        { name: "client", standardName: "Client" },
        { name: "chef d'équipe", standardName: "Chef d'équipe" },
        { name: "manager", standardName: "Manager" },
        { name: "responsable", standardName: "Responsable" },
        { name: "comptable", standardName: "Comptable" },
        { name: "superviseur", standardName: "Superviseur" },
        { name: "vendeur", standardName: "Vendeur" },
        { name: "préposé", standardName: "Préposé" }
    ];
    
    const lowerText = text.toLowerCase();
    
    // Chercher les organisations
    organizationKeywords.forEach(org => {
        if (lowerText.includes(org.name) && !processData.organizations.includes(org.standardName)) {
            processData.organizations.push(org.standardName);
        }
    });
    
    // Chercher les rôles
    roleKeywords.forEach(role => {
        if (lowerText.includes(role.name) && !processData.roles.includes(role.standardName)) {
            processData.roles.push(role.standardName);
        }
    });
}

function inferOrganizationsFromContext(processData) {
    // Déterminer le contexte principal à partir des rôles et du contenu
    let mainOrg = "Organisation";
    
    if (processData.roles.includes("Pharmacien")) {
        processData.organizations.push("Pharmacie");
    }
    
    if (processData.roles.some(role => 
        ["Représentant", "Préposé à la livraison", "Service livraison"].includes(role))) {
        processData.organizations.push("Club Optique");
    }
    
    // Ajouter une organisation par défaut si nécessaire
    if (processData.organizations.length === 0) {
        processData.organizations.push("Organisation principale");
    }
}

function findActivities(sentence, processData) {
    const activityVerbs = [
        "reçoit", "valide", "vérifie", "crée", "saisit", "note", "calcule", 
        "photocopie", "classe", "identifie", "crée", "récupère", "emballe", 
        "place", "envoie", "livre", "expédie", "avise", "consulte", "produit",
        "imprime", "remplit", "prépare", "contacte", "appelle", "traite",
        "génère", "échange", "examine", "analyse", "met à jour", "supprime"
    ];
    
    const lowerSentence = sentence.toLowerCase();
    
    // Déterminer si la phrase contient une activité
    let containsActivity = false;
    let verbFound = null;
    let verbIndex = -1;
    
    for (const verb of activityVerbs) {
        const index = lowerSentence.indexOf(verb);
        if (index !== -1) {
            containsActivity = true;
            verbFound = verb;
            verbIndex = index;
            break;
        }
    }
    
    if (containsActivity) {
        // Déterminer le type d'activité
        let activityType = determineActivityType(lowerSentence);
        
        // Extraire la description de l'activité
        let activityDescription = extractActivityDescription(lowerSentence, verbFound, verbIndex);
        
        // Déterminer l'acteur associé à l'activité
        let actor = determineActivityActor(lowerSentence, processData.roles);
        
        // Ajouter l'activité à la liste
        processData.activities.push({
            description: activityDescription,
            type: activityType,
            actor: actor,
            fullSentence: sentence
        });
    }
}

function determineActivityType(sentence) {
    // Détermine le type d'activité (manuelle, utilisateur, service)
    if (sentence.includes("système") && 
        (sentence.includes("automatiquement") || 
         sentence.includes("calcule automatiquement") || 
         sentence.includes("génère automatiquement"))) {
        return "service";
    } else if (sentence.includes("système") || 
              sentence.includes("base de données") || 
              sentence.includes("logiciel") || 
              sentence.includes("saisit dans") || 
              sentence.includes("ordinateur") ||
              sentence.includes("application")) {
        return "utilisateur";
    } else {
        return "manuelle";
    }
}

function extractActivityDescription(sentence, verb, verbIndex) {
    // Extraire la description complète de l'activité
    let start = verbIndex;
    
    // Reculer pour inclure le sujet si nécessaire
    let subjectStart = findSubjectStart(sentence, start);
    if (subjectStart > 0) {
        start = subjectStart;
    }
    
    // Trouver la fin de la description
    let end = sentence.indexOf(".", start);
    if (end === -1) end = sentence.indexOf(",", start);
    if (end === -1) end = sentence.length;
    
    // Extracting a meaningful description
    let description = sentence.substring(start, end).trim();
    
    // Limiter la longueur de la description
    if (description.length > 60) {
        description = description.substring(0, 57) + "...";
    }
    
    return description;
}

function findSubjectStart(sentence, verbIndex) {
    // Trouve le début du sujet avant le verbe
    let potentialSubjectStart = sentence.lastIndexOf(" ", verbIndex - 2);
    if (potentialSubjectStart === -1) return 0;
    
    // Vérifier si c'est un article ou une préposition
    const articlesEtPrepositions = [" le ", " la ", " les ", " un ", " une ", " des ", " à ", " de ", " par ", " pour "];
    for (const article of articlesEtPrepositions) {
        if (sentence.substring(potentialSubjectStart - article.length + 1, potentialSubjectStart + 1) === article) {
            return potentialSubjectStart - article.length + 1;
        }
    }
    
    return potentialSubjectStart + 1;
}

function determineActivityActor(sentence, roles) {
    // Déterminer l'acteur associé à l'activité
    for (const role of roles) {
        if (sentence.toLowerCase().includes(role.toLowerCase())) {
            return role;
        }
    }
    
    // Acteurs génériques basés sur le contenu
    if (sentence.includes("préposé") || sentence.includes("livraison")) {
        return "Préposé à la livraison";
    } else if (sentence.includes("représentant") || sentence.includes("service client")) {
        return "Représentant";
    } else if (sentence.includes("pharmacien") || sentence.includes("client")) {
        return "Pharmacien";
    }
    
    return "Non spécifié";
}

function findDecisions(sentence, processData) {
    const decisionKeywords = [
        "si", "sinon", "lorsque", "quand", "dans le cas où",
        "si le", "si la", "si les", "selon que", "condition",
        "est-ce que", "vérifier si"
    ];
    
    const lowerSentence = sentence.toLowerCase();
    
    // Vérifier si la phrase contient une décision
    let containsDecision = false;
    let keywordFound = null;
    let keywordIndex = -1;
    
    for (const keyword of decisionKeywords) {
        const index = lowerSentence.indexOf(keyword);
        if (index !== -1) {
            containsDecision = true;
            keywordFound = keyword;
            keywordIndex = index;
            break;
        }
    }
    
    if (containsDecision) {
        // Extraire la condition complète
        const condition = extractDecisionCondition(lowerSentence, keywordFound, keywordIndex);
        
        // Trouver les résultats possibles (oui/non, positif/négatif)
        const outcomes = inferDecisionOutcomes(lowerSentence, condition);
        
        // Déterminer l'acteur qui prend la décision
        const actor = determineDecisionActor(lowerSentence, processData.roles);
        
        // Ajouter la décision à la liste
        processData.decisions.push({
            condition: condition,
            outcomes: outcomes,
            actor: actor,
            fullSentence: sentence
        });
    }
}

function extractDecisionCondition(sentence, keyword, keywordIndex) {
    // Extraire la condition complète
    let endIndex = sentence.indexOf(",", keywordIndex);
    if (endIndex === -1) endIndex = sentence.indexOf(".", keywordIndex);
    if (endIndex === -1) endIndex = sentence.length;
    
    return sentence.substring(keywordIndex, endIndex).trim();
}

function inferDecisionOutcomes(sentence, condition) {
    // Inférer les résultats possibles de la décision
    const positiveOutcomes = ["oui", "vrai", "existe", "approuvé", "accepté", "valide", "trouvé", "présent"];
    const negativeOutcomes = ["non", "faux", "n'existe pas", "refusé", "rejeté", "invalide", "non trouvé", "absent"];
    
    let outcomes = {
        positive: "Oui",
        negative: "Non"
    };
    
    // Chercher des termes spécifiques dans la phrase qui indiqueraient des résultats personnalisés
    for (const outcome of positiveOutcomes) {
        if (sentence.includes(outcome)) {
            outcomes.positive = capitalizeFirstLetter(outcome);
            break;
        }
    }
    
    for (const outcome of negativeOutcomes) {
        if (sentence.includes(outcome)) {
            outcomes.negative = capitalizeFirstLetter(outcome);
            break;
        }
    }
    
    return outcomes;
}

function determineDecisionActor(sentence, roles) {
    // Déterminer qui prend la décision
    for (const role of roles) {
        if (sentence.toLowerCase().includes(role.toLowerCase())) {
            return role;
        }
    }
    
    // Acteur par défaut basé sur le contenu
    if (sentence.includes("préposé") || sentence.includes("livraison")) {
        return "Préposé à la livraison";
    } else if (sentence.includes("représentant") || sentence.includes("service client")) {
        return "Représentant";
    }
    
    return "Non spécifié";
}

function findDataObjects(sentence, processData) {
    const dataObjectKeywords = [
        { keyword: "commande", standardName: "Commande" },
        { keyword: "bon de commande", standardName: "Bon de commande" },
        { keyword: "liste des pharmaciens", standardName: "Liste des pharmaciens" },
        { keyword: "liste papier des pharmaciens", standardName: "Liste des pharmaciens" },
        { keyword: "formulaire", standardName: "Formulaire" },
        { keyword: "formulaire de livraison", standardName: "Formulaire de livraison" },
        { keyword: "document", standardName: "Document" },
        { keyword: "facture", standardName: "Facture" },
        { keyword: "produit", standardName: "Produit" },
        { keyword: "copie", standardName: "Copie" },
        { keyword: "dossier", standardName: "Dossier" }
    ];
    
    const dataStoreKeywords = [
        { keyword: "base de données", standardName: "Base de données" },
        { keyword: "filière", standardName: "Filière" },
        { keyword: "filière des commandes", standardName: "Filière des commandes" },
        { keyword: "dossier des livraisons", standardName: "Dossier des livraisons" },
        { keyword: "système", standardName: "Système" },
        { keyword: "système d'information", standardName: "Système d'information" },
        { keyword: "registre", standardName: "Registre" },
        { keyword: "archive", standardName: "Archives" }
    ];
    
    const lowerSentence = sentence.toLowerCase();
    
    // Rechercher les objets de données
    for (const dataObj of dataObjectKeywords) {
        if (lowerSentence.includes(dataObj.keyword)) {
            // Vérifier si cet objet de données existe déjà
            if (!processData.dataObjects.some(obj => obj.name === dataObj.standardName)) {
                // Déterminer les activités liées
                const relatedActivity = processData.activities.find(activity => 
                    activity.fullSentence.toLowerCase().includes(dataObj.keyword)
                );
                
                // Déterminer le type d'interaction (lecture, création, mise à jour)
                const interactionType = determineDataInteraction(lowerSentence, dataObj.keyword);
                
                processData.dataObjects.push({
                    name: dataObj.standardName,
                    interaction: interactionType,
                    relatedActivity: relatedActivity ? relatedActivity.description : null,
                    mentioned: sentence
                });
            }
        }
    }
    
    // Rechercher les magasins de données
    for (const dataStore of dataStoreKeywords) {
        if (lowerSentence.includes(dataStore.keyword)) {
            // Vérifier si ce magasin de données existe déjà
            if (!processData.dataSources.some(src => src.name === dataStore.standardName)) {
                // Déterminer les activités liées
                const relatedActivity = processData.activities.find(activity => 
                    activity.fullSentence.toLowerCase().includes(dataStore.keyword)
                );
                
                // Déterminer le type d'interaction (lecture, création, mise à jour)
                const interactionType = determineDataInteraction(lowerSentence, dataStore.keyword);
                
                processData.dataSources.push({
                    name: dataStore.standardName,
                    interaction: interactionType,
                    relatedActivity: relatedActivity ? relatedActivity.description : null,
                    mentioned: sentence
                });
            }
        }
    }
}

function determineDataInteraction(sentence, dataKeyword) {
    // Déterminer si l'interaction est une lecture, création ou mise à jour
    const creationVerbs = ["crée", "génère", "produit", "rédige", "établit", "prépare"];
    const readingVerbs = ["consulte", "vérifie", "lit", "examine", "regarde", "voit"];
    const updateVerbs = ["met à jour", "modifie", "change", "actualise", "édite", "complète"];
    
    for (const verb of creationVerbs) {
        if (sentence.includes(verb) && sentence.indexOf(verb) < sentence.indexOf(dataKeyword)) {
            return "création";
        }
    }
    
    for (const verb of readingVerbs) {
        if (sentence.includes(verb) && sentence.indexOf(verb) < sentence.indexOf(dataKeyword)) {
            return "lecture";
        }
    }
    
    for (const verb of updateVerbs) {
        if (sentence.includes(verb) && sentence.indexOf(verb) < sentence.indexOf(dataKeyword)) {
            return "mise à jour";
        }
    }
    
    // Inférer en fonction du contexte
    if (sentence.includes("classe") || sentence.includes("classement") || 
        sentence.includes("stocke") || sentence.includes("enregistre") ||
        sentence.includes("photocopie")) {
        return "création";
    }
    
    // Interaction par défaut
    return "lecture";
}

function findMessages(sentence, processData) {
    const messagingVerbs = ["envoie", "transmet", "expédie", "communique", "notifie", "informe", "contacte", "appelle"];
    
    const lowerSentence = sentence.toLowerCase();
    
    // Vérifier si la phrase contient un échange de message
    let containsMessage = false;
    let verbFound = null;
    let verbIndex = -1;
    
    for (const verb of messagingVerbs) {
        const index = lowerSentence.indexOf(verb);
        if (index !== -1) {
            containsMessage = true;
            verbFound = verb;
            verbIndex = index;
            break;
        }
    }
    
    if (containsMessage) {
        // Déterminer l'expéditeur et le destinataire
        const { sender, receiver } = determineMessageParticipants(lowerSentence, processData.roles);
        
        // Déterminer le contenu du message
        const content = determineMessageContent(lowerSentence, verbFound, verbIndex);
        
        // Ajouter le message à la liste
        processData.messages.push({
            sender: sender,
            receiver: receiver,
            content: content,
            fullSentence: sentence
        });
    }
}

function determineMessageParticipants(sentence, roles) {
    let sender = "Non spécifié";
    let receiver = "Non spécifié";
    
    // Chercher les participants parmi les rôles connus
    for (const role of roles) {
        if (sentence.includes(role.toLowerCase())) {
            if (sender === "Non spécifié") {
                sender = role;
            } else if (receiver === "Non spécifié" && sender !== role) {
                receiver = role;
            }
        }
    }
    
    // Inférer à partir du contexte si nécessaire
    if (sender === "Non spécifié" || receiver === "Non spécifié") {
        if (sentence.includes("représentant") && sentence.includes("pharmacien")) {
            sender = "Représentant";
            receiver = "Pharmacien";
        } else if (sentence.includes("préposé") && sentence.includes("service livraison")) {
            sender = "Préposé à la livraison";
            receiver = "Service livraison";
        } else if (sentence.includes("service livraison") && sentence.includes("pharmacien")) {
            sender = "Service livraison";
            receiver = "Pharmacien";
        }
    }
    
    // Si aucun destinataire n'est trouvé, inférer en fonction du contenu
    if (receiver === "Non spécifié") {
        if (sentence.includes("client") || sentence.includes("pharmacien")) {
            receiver = "Pharmacien";
        } else if (sentence.includes("livraison")) {
            receiver = "Service livraison";
        }
    }
    
    return { sender, receiver };
}

function determineMessageContent(sentence, verb, verbIndex) {
    // Trouver l'objet du message
    let objectIndex = sentence.indexOf(" ", verbIndex + verb.length);
    if (objectIndex === -1) objectIndex = verbIndex + verb.length;
    
    let endIndex = sentence.indexOf(".", objectIndex);
    if (endIndex === -1) endIndex = sentence.indexOf(",", objectIndex);
    if (endIndex === -1) endIndex = sentence.length;
    
    const messageObject = sentence.substring(objectIndex, endIndex).trim();
    
    // Identifier les types de message courants
    if (messageObject.includes("commande") || messageObject.includes("bon de commande")) {
        return "Bon de commande";
    } else if (messageObject.includes("formulaire de livraison") || messageObject.includes("bon de livraison")) {
        return "Formulaire de livraison";
    } else if (messageObject.includes("copie")) {
        return "Copie";
    } else if (messageObject.includes("produit")) {
        return "Produits";
    }
    
    return messageObject || "Message";
}

function findTimers(sentence, processData) {
    const timerKeywords = [
        "le matin", "chaque matin", "tous les matins", 
        "le lendemain", "dans la journée", "le jour suivant",
        "hebdomadaire", "mensuel", "quotidien", "périodique",
        "délai", "attente", "pause", "temps d'attente"
    ];
    
    const lowerSentence = sentence.toLowerCase();
    
    // Vérifier si la phrase contient une référence à un minuteur
    for (const keyword of timerKeywords) {
        if (lowerSentence.includes(keyword)) {
            // Ajouter le minuteur à la liste
            processData.timers.push({
                description: keyword,
                fullSentence: sentence
            });
            break;
        }
    }
}

function generateModelingSteps(processData) {
    let instructions = [];
    
    // En-tête
    instructions.push("# Instructions de modélisation BPMN\n");
    
    // Étape 1: Définir les piscines et couloirs
    instructions.push("## 1. Définir les piscines et couloirs\n");
    
    // Déterminer le nombre de piscines
    const externalOrgs = processData.organizations.filter(org => 
        org.includes("Pharmacie") || 
        org.includes("Fournisseur") || 
        org.includes("Client"));
    
    const internalOrgs = processData.organizations.filter(org => 
        !externalOrgs.includes(org));
    
    if (processData.organizations.length > 0 || processData.roles.length > 0) {
        if (externalOrgs.length > 0) {
            instructions.push("### Piscines (organisations)");
            externalOrgs.forEach(org => {
                instructions.push(`- Créez une piscine horizontale pour "${org}"`);
            });
            
            if (internalOrgs.length > 0) {
                instructions.push(`- Créez une piscine principale pour "${internalOrgs[0]}" qui contiendra les couloirs internes`);
            } else {
                instructions.push("- Créez une piscine principale pour l'organisation interne qui contiendra les couloirs");
            }
        } else if (internalOrgs.length > 0) {
            instructions.push("### Piscines (organisations)");
            instructions.push(`- Créez une piscine principale pour "${internalOrgs[0]}" qui contiendra tous les couloirs`);
        } else {
            instructions.push("### Piscines (organisations)");
            instructions.push("- Créez une piscine principale pour votre organisation qui contiendra tous les couloirs");
        }
        
        if (processData.roles.length > 0) {
            instructions.push("\n### Couloirs (rôles/fonctions)");
            processData.roles.forEach(role => {
                // Pour les rôles pharmacien ou client, indiquez qu'ils vont dans la piscine externe
                if (role.includes("Pharmacien") || role.includes("Client")) {
                    if (externalOrgs.some(org => org.includes("Pharmacie") || org.includes("Client"))) {
                        instructions.push(`- Dans la piscine "${externalOrgs.find(org => org.includes("Pharmacie") || org.includes("Client"))}", créez un couloir pour "${role}"`);
                    } else {
                        instructions.push(`- Créez un couloir pour "${role}" dans la piscine principale`);
                    }
                } else {
                    instructions.push(`- Dans la piscine principale, créez un couloir pour "${role}"`);
                }
            });
        } else {
            // Déduire les rôles en fonction des activités
            const inferredRoles = inferRolesFromActivities(processData.activities);
            if (inferredRoles.length > 0) {
                instructions.push("\n### Couloirs (rôles/fonctions)");
                inferredRoles.forEach(role => {
                    instructions.push(`- Dans la piscine principale, créez un couloir pour "${role}"`);
                });
            }
        }
    } else {
        instructions.push("- Créez une piscine principale pour votre organisation");
        instructions.push("- Dans la piscine, créez des couloirs pour chaque rôle ou fonction impliquée");
    }
    
    // Étape 2: Événements de début
    instructions.push("\n## 2. Placer les événements de début");
    
    // Déterminer si le processus commence par un message
    const startsWithMessage = processData.sentences.length > 0 && 
        (processData.sentences[0].toLowerCase().includes("reçoit") || 
         processData.sentences[0].toLowerCase().includes("appel") ||
         processData.sentences[0].toLowerCase().includes("demande"));
    
    // Déterminer si le processus commence par un timer
    const startsWithTimer = processData.timers.some(timer => 
        processData.sentences[0].toLowerCase().includes(timer.description));
    
    if (startsWithMessage) {
        const initiator = determineInitiator(processData.sentences[0], processData.roles);
        instructions.push(`- Placez un événement de début de type message (⭕ avec une enveloppe à l'intérieur) dans le couloir "${initiator}"`);
    } else if (startsWithTimer) {
        const timerDescription = processData.timers.find(timer => 
            processData.sentences[0].toLowerCase().includes(timer.description)).description;
        const initiator = determineInitiator(processData.sentences[0], processData.roles);
        instructions.push(`- Placez un événement de début de type minuterie (⭕ avec une horloge à l'intérieur) dans le couloir "${initiator}"`);
        instructions.push(`  - Étiquetez-le avec "${timerDescription}"`);
    } else {
        const initiator = determineInitiator(processData.sentences[0], processData.roles);
        instructions.push(`- Placez un événement de début générique (⭕) dans le couloir "${initiator}"`);
    }
    
    // Étape 3: Activités et flux de séquence
    instructions.push("\n## 3. Modéliser les activités et les flux de séquence");
    
    if (processData.activities.length > 0) {
        processData.activities.forEach((activity, index) => {
            const activitySymbol = getActivitySymbol(activity.type);
            instructions.push(`- Ajoutez une activité "${activity.description}" (${activitySymbol}) dans le couloir "${activity.actor}"`);
            
            if (index === 0) {
                instructions.push(`  - Reliez-la à l'événement de début par un flux de séquence (⏩)`);
            } else {
                instructions.push(`  - Reliez-la à l'élément précédent par un flux de séquence (⏩)`);
            }
        });
    } else {
        instructions.push("- Identifiez les principales activités du processus et ajoutez-les sous forme de tâches");
        instructions.push("- Reliez-les avec des flux de séquence pour montrer leur ordre d'exécution");
    }
    
    // Étape 4: Passerelles de décision
    if (processData.decisions.length > 0) {
        instructions.push("\n## 4. Ajouter les passerelles de décision");
        processData.decisions.forEach((decision, index) => {
            instructions.push(`- Ajoutez une passerelle exclusive (◇) dans le couloir "${decision.actor}" pour évaluer la condition "${decision.condition}"`);
            instructions.push(`  - Créez un flux de séquence sortant étiqueté "${decision.outcomes.positive}" pour le cas où la condition est vraie`);
            instructions.push(`  - Créez un flux de séquence sortant étiqueté "${decision.outcomes.negative}" pour le cas où la condition est fausse`);
        });
    }
    
    // Étape 5: Objets et magasins de données
    const hasDataObjects = processData.dataObjects.length > 0;
    const hasDataSources = processData.dataSources.length > 0;
    
    if (hasDataObjects || hasDataSources) {
        instructions.push("\n## 5. Intégrer les objets et magasins de données");
        
        if (hasDataObjects) {
            instructions.push("\n### Objets de données");
            processData.dataObjects.forEach(dataObject => {
                instructions.push(`- Ajoutez un objet de données (📄) nommé "${dataObject.name}"`);
                
                if (dataObject.relatedActivity) {
                    if (dataObject.interaction === "lecture") {
                        instructions.push(`  - Reliez-le à l'activité "${dataObject.relatedActivity}" avec une association indiquant une lecture (flèche vers l'activité)`);
                    } else if (dataObject.interaction === "création") {
                        instructions.push(`  - Reliez-le à l'activité "${dataObject.relatedActivity}" avec une association indiquant une création (flèche vers l'objet)`);
                    } else if (dataObject.interaction === "mise à jour") {
                        instructions.push(`  - Reliez-le à l'activité "${dataObject.relatedActivity}" avec une association indiquant une mise à jour (flèche bidirectionnelle)`);
                    }
                }
            });
        }
        
        if (hasDataSources) {
            instructions.push("\n### Magasins de données");
            processData.dataSources.forEach(dataSource => {
                instructions.push(`- Ajoutez un magasin de données (🗄️) nommé "${dataSource.name}"`);
                
                if (dataSource.relatedActivity) {
                    if (dataSource.interaction === "lecture") {
                        instructions.push(`  - Reliez-le à l'activité "${dataSource.relatedActivity}" avec une association indiquant une lecture (flèche vers l'activité)`);
                    } else if (dataSource.interaction === "création") {
                        instructions.push(`  - Reliez-le à l'activité "${dataSource.relatedActivity}" avec une association indiquant une création (flèche vers le magasin)`);
                    } else if (dataSource.interaction === "mise à jour") {
                        instructions.push(`  - Reliez-le à l'activité "${dataSource.relatedActivity}" avec une association indiquant une mise à jour (flèche bidirectionnelle)`);
                    }
                }
            });
        }
    }
    
    // Étape 6: Flux de message
    if (processData.messages.length > 0) {
        instructions.push("\n## 6. Intégrer les flux de message");
        processData.messages.forEach(message => {
            instructions.push(`- Tracez un flux de message (〰️) pour "${message.content}" du couloir "${message.sender}" vers "${message.receiver}"`);
        });
    }
    
    // Étape 7: Événements temporels
    const intermediateTimers = processData.timers.filter(timer => 
        !processData.sentences[0].toLowerCase().includes(timer.description));
    
    if (intermediateTimers.length > 0) {
        instructions.push("\n## 7. Ajouter les événements temporels");
        intermediateTimers.forEach(timer => {
            const relatedActivity = processData.activities.find(activity => 
                activity.fullSentence.toLowerCase().includes(timer.description));
            
            const actorRole = relatedActivity ? relatedActivity.actor : processData.roles[0];
            
            instructions.push(`- Ajoutez un événement intermédiaire de type minuterie (⌛) dans le couloir "${actorRole}"`);
            instructions.push(`  - Étiquetez-le avec "${timer.description}"`);
            instructions.push(`  - Placez-le entre les activités appropriées et reliez-le avec des flux de séquence`);
        });
    }
    
    // Étape 8: Événements de fin
    instructions.push("\n## 8. Finaliser avec les événements de fin");
    
    // Déterminer si le processus se termine par un message
    const endsWithMessage = processData.sentences.length > 0 && 
        processData.sentences[processData.sentences.length - 1].toLowerCase().includes("envoie") ||
        processData.sentences[processData.sentences.length - 1].toLowerCase().includes("notifie") ||
        processData.sentences[processData.sentences.length - 1].toLowerCase().includes("informe");
    
    if (endsWithMessage) {
        const finalActor = determineFinisher(processData.sentences[processData.sentences.length - 1], processData.roles);
        instructions.push(`- Placez un événement de fin de type message (⚫ avec une enveloppe à l'intérieur) dans le couloir "${finalActor}"`);
        instructions.push(`  - Reliez-le à la dernière activité par un flux de séquence (⏩)`);
        instructions.push("  - Étiquetez-le avec un nom descriptif comme \"Commande complétée\"");
    } else {
        // Identifier les chemins terminaux
        const finalActor = determineFinisher(processData.sentences[processData.sentences.length - 1], processData.roles);
        instructions.push(`- Placez un événement de fin générique (⚫) dans le couloir "${finalActor}"`);
        instructions.push(`  - Reliez-le à la dernière activité par un flux de séquence (⏩)`);
        
        // Si des passerelles de décision ont été identifiées, suggérer d'ajouter des événements de fin pour chaque chemin
        if (processData.decisions.length > 0) {
            instructions.push("- Ajoutez des événements de fin supplémentaires pour chaque chemin alternatif issu des passerelles");
        }
    }
    
    // Étape 9: Vérifications finales
    instructions.push("\n## 9. Vérifications finales");
    instructions.push("- Assurez-vous que chaque flux de séquence a un début et une fin");
    instructions.push("- Vérifiez que chaque chemin du processus mène à un événement de fin");
    instructions.push("- Confirmez que les flux de message traversent bien les frontières des piscines");
    instructions.push("- Vérifiez que les associations avec les objets et magasins de données ont le bon sens");
    
    return instructions.join('\n');
}

function inferRolesFromActivities(activities) {
    const roles = new Set();
    
    activities.forEach(activity => {
        if (activity.actor && activity.actor !== "Non spécifié") {
            roles.add(activity.actor);
        }
    });
    
    return Array.from(roles);
}

function determineInitiator(firstSentence, roles) {
    // Déterminer qui initie le processus
    const lowerSentence = firstSentence.toLowerCase();
    
    for (const role of roles) {
        if (lowerSentence.includes(role.toLowerCase())) {
            return role;
        }
    }
    
    // Inférer en fonction du contenu
    if (lowerSentence.includes("pharmacien") || lowerSentence.includes("client")) {
        return "Pharmacien";
    } else if (lowerSentence.includes("représentant") || lowerSentence.includes("service client")) {
        return "Représentant";
    } else if (lowerSentence.includes("préposé") || lowerSentence.includes("livraison")) {
        return "Préposé à la livraison";
    }
    
    // Par défaut, retourner le premier rôle ou un rôle générique
    return roles.length > 0 ? roles[0] : "Rôle principal";
}

function determineFinisher(lastSentence, roles) {
    // Déterminer qui termine le processus
    const lowerSentence = lastSentence.toLowerCase();
    
    for (const role of roles) {
        if (lowerSentence.includes(role.toLowerCase())) {
            return role;
        }
    }
    
    // Inférer en fonction du contenu
    if (lowerSentence.includes("livraison") || lowerSentence.includes("livrer")) {
        return "Service livraison";
    } else if (lowerSentence.includes("préposé")) {
        return "Préposé à la livraison";
    } else if (lowerSentence.includes("pharmacien") || lowerSentence.includes("client")) {
        return "Pharmacien";
    }
    
    // Par défaut, retourner le dernier rôle ou un rôle générique
    return roles.length > 0 ? roles[roles.length - 1] : "Rôle principal";
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
    concepts.push("## Structure du modèle");
    
    if (processData.organizations.length > 1 || processData.roles.length > 1) {
        concepts.push("- Les **piscines** représentent des organisations ou des entités participantes distinctes");
        concepts.push("- Les **couloirs** représentent des rôles ou des fonctions au sein d'une organisation");
        concepts.push("- Les flux de séquence ne peuvent pas traverser les frontières d'une piscine");
        concepts.push("- Utilisez des flux de message pour communiquer entre différentes piscines");
    }
    
    // Concept 2: Types d'activités
    concepts.push("\n## Types d'activités");
    
    if (processData.activities.some(a => a.type === 'manuelle')) {
        concepts.push("- **Tâche manuelle** (👋) : Réalisée par une personne sans l'aide d'un système d'information");
    }
    
    if (processData.activities.some(a => a.type === 'utilisateur')) {
        concepts.push("- **Tâche utilisateur** (👤) : Réalisée par une personne à l'aide d'un système d'information");
    }
    
    if (processData.activities.some(a => a.type === 'service')) {
        concepts.push("- **Tâche service** (⚙️) : Exécutée automatiquement par un système sans intervention humaine");
    }
    
    // Concept 3: Passerelles et décisions
    if (processData.decisions.length > 0) {
        concepts.push("\n## Passerelles de décision");
        concepts.push("- La **passerelle exclusive** (◇) représente un point de décision où une seule condition sera vraie");
        concepts.push("- Chaque flux sortant doit être étiqueté avec sa condition (Oui/Non ou autre)");
        concepts.push("- Une passerelle peut également être utilisée pour fusionner des flux alternatifs");
    }
    
    // Concept 4: Événements
    concepts.push("\n## Types d'événements");
    concepts.push("- **Événement de début** (⭕) : Déclenche le processus");
    concepts.push("- **Événement de fin** (⚫) : Termine un chemin du processus");
    
    if (processData.messages.length > 0) {
        concepts.push("- **Événement de message** (✉️) : Représente la réception ou l'envoi d'un message");
    }
    
    if (processData.timers.length > 0) {
        concepts.push("- **Événement de minuterie** (⌛) : Représente un délai ou un moment précis");
    }
    
    // Concept 5: Données
    if (processData.dataObjects.length > 0 || processData.dataSources.length > 0) {
        concepts.push("\n## Gestion des données");
        
        if (processData.dataObjects.length > 0) {
            concepts.push("- **Objet de données** (📄) : Information temporaire utilisée pendant l'exécution du processus");
        }
        
        if (processData.dataSources.length > 0) {
            concepts.push("- **Magasin de données** (🗄️) : Stockage persistant qui survit à l'exécution du processus");
        }
        
        concepts.push("- Les associations indiquent comment les activités interagissent avec les données :");
        concepts.push("  - **Lecture** : L'activité consulte les données (flèche vers l'activité)");
        concepts.push("  - **Création** : L'activité génère de nouvelles données (flèche vers l'objet de données)");
        concepts.push("  - **Mise à jour** : L'activité modifie des données existantes (flèche bidirectionnelle)");
    }
    
    // Ajouter des conseils spécifiques au contexte
    const hasRetailContext = processData.sentences.some(s => 
        s.toLowerCase().includes("commande") || 
        s.toLowerCase().includes("produit") || 
        s.toLowerCase().includes("client") ||
        s.toLowerCase().includes("livraison"));
    
    if (hasRetailContext) {
        concepts.push("\n## Conseils spécifiques pour ce contexte");
        concepts.push("- Assurez-vous que les flux de la commande du client jusqu'à la livraison sont clairement modélisés");
        concepts.push("- Identifiez clairement les points de décision qui peuvent affecter le traitement de la commande");
        concepts.push("- Représentez correctement les échanges de documents et d'informations entre les parties prenantes");
    }
    
    return concepts.join('\n');
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
