document.addEventListener('DOMContentLoaded', function() {
    // Gestion des onglets
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            
            // Désactiver tous les onglets et contenus
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Activer l'onglet et le contenu sélectionnés
            tab.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });

    // Gestionnaire pour le bouton d'analyse
    const analyzeBtn = document.getElementById('analyze-btn');
    analyzeBtn.addEventListener('click', analyzeProcess);

    function analyzeProcess() {
        const processDescription = document.getElementById('process-description').value.trim();
        const loadingElement = document.getElementById('loading');
        const errorElement = document.getElementById('error');
        const instructionsElement = document.getElementById('modeling-instructions');
        
        // Réinitialiser les messages d'erreur
        errorElement.style.display = 'none';
        errorElement.textContent = '';
        
        // Vérifier si la description est vide
        if (!processDescription) {
            errorElement.textContent = 'Veuillez entrer une description du processus.';
            errorElement.style.display = 'block';
            return;
        }
        
        // Afficher l'indicateur de chargement
        loadingElement.style.display = 'block';
        
        // Simuler un délai pour l'analyse (à remplacer par le vrai traitement)
        setTimeout(() => {
            // Cacher l'indicateur de chargement
            loadingElement.style.display = 'none';
            
            // Générer les instructions de modélisation
            const modelingInstructions = generateModelingInstructions(processDescription);
            
            // Afficher les instructions
            instructionsElement.innerHTML = modelingInstructions;
        }, 1000);
    }

    function generateModelingInstructions(processDescription) {
        // Analyser la description du processus
        const analysis = analyzeProcessDescription(processDescription);
        
        // Générer les instructions de modélisation à partir de l'analyse
        let instructions = `<h3>Instructions pour la modélisation BPMN</h3>`;
        
        // 1. Instructions pour le contexte (piscines et couloirs)
        instructions += `<h4>1. Définir le contexte</h4>`;
        instructions += `<p>Créez une piscine pour le processus principal avec le nom: <strong>${analysis.processName}</strong></p>`;
        
        if (analysis.actors.length > 0) {
            instructions += `<p>Ajoutez les couloirs suivants pour représenter les acteurs internes:</p>`;
            instructions += `<ul>`;
            analysis.actors.forEach(actor => {
                instructions += `<li>${actor}</li>`;
            });
            instructions += `</ul>`;
        }
        
        if (analysis.externalActors.length > 0) {
            instructions += `<p>Ajoutez les piscines suivantes pour représenter les acteurs externes:</p>`;
            instructions += `<ul>`;
            analysis.externalActors.forEach(actor => {
                instructions += `<li>${actor}</li>`;
            });
            instructions += `</ul>`;
        }
        
        // 2. Instructions pour les événements
        instructions += `<h4>2. Placer les événements</h4>`;
        instructions += `<p>Événement de début:</p>`;
        instructions += `<ul>`;
        instructions += `<li>Placez un événement de début ${analysis.startEventType} dans le couloir de ${analysis.startActor}</li>`;
        instructions += `</ul>`;
        
        if (analysis.endEvents.length > 0) {
            instructions += `<p>Événements de fin:</p>`;
            instructions += `<ul>`;
            analysis.endEvents.forEach(event => {
                instructions += `<li>Placez un événement de fin ${event.type} dans le couloir de ${event.actor} ${event.description ? `(${event.description})` : ''}</li>`;
            });
            instructions += `</ul>`;
        }
        
        if (analysis.intermediateEvents.length > 0) {
            instructions += `<p>Événements intermédiaires:</p>`;
            instructions += `<ul>`;
            analysis.intermediateEvents.forEach(event => {
                instructions += `<li>Placez un événement intermédiaire ${event.type} dans le couloir de ${event.actor} ${event.description ? `(${event.description})` : ''}</li>`;
            });
            instructions += `</ul>`;
        }
        
        // 3. Instructions pour les activités
        instructions += `<h4>3. Ajouter les activités</h4>`;
        
        if (analysis.activities.length > 0) {
            instructions += `<ul>`;
            analysis.activities.forEach((activity, index) => {
                instructions += `<li>Activité ${index + 1}: "${activity.name}" (${activity.type}) dans le couloir de ${activity.actor}</li>`;
            });
            instructions += `</ul>`;
        }
        
        // 4. Instructions pour les passerelles
        if (analysis.gateways.length > 0) {
            instructions += `<h4>4. Ajouter les passerelles</h4>`;
            instructions += `<ul>`;
            analysis.gateways.forEach((gateway, index) => {
                instructions += `<li>Passerelle ${index + 1}: "${gateway.name}" (${gateway.type}) dans le couloir de ${gateway.actor}</li>`;
            });
            instructions += `</ul>`;
        }
        
        // 5. Instructions pour les objets et magasins de données
        if (analysis.dataObjects.length > 0 || analysis.dataSources.length > 0) {
            instructions += `<h4>5. Ajouter les éléments de données</h4>`;
            
            if (analysis.dataObjects.length > 0) {
                instructions += `<p>Objets de données:</p>`;
                instructions += `<ul>`;
                analysis.dataObjects.forEach(dataObject => {
                    instructions += `<li>${dataObject.name}</li>`;
                });
                instructions += `</ul>`;
            }
            
            if (analysis.dataSources.length > 0) {
                instructions += `<p>Magasins de données:</p>`;
                instructions += `<ul>`;
                analysis.dataSources.forEach(dataSource => {
                    instructions += `<li>${dataSource.name}</li>`;
                });
                instructions += `</ul>`;
            }
        }
        
        // 6. Instructions pour les flux
        instructions += `<h4>6. Connecter les éléments</h4>`;
        instructions += `<p>Flux de séquence:</p>`;
        instructions += `<ul>`;
        instructions += `<li>Connectez l'événement de début à la première activité</li>`;
        
        // Générer des suggestions de flux de séquence basées sur l'ordre des activités
        if (analysis.activities.length > 1) {
            for (let i = 0; i < analysis.activities.length - 1; i++) {
                if (analysis.gateways.length > 0 && i < analysis.gateways.length) {
                    instructions += `<li>Connectez l'activité "${analysis.activities[i].name}" à la passerelle "${analysis.gateways[i].name}"</li>`;
                    instructions += `<li>Connectez la passerelle "${analysis.gateways[i].name}" aux activités suivantes selon les conditions</li>`;
                    i++; // Skip one activity as we've already connected through the gateway
                } else {
                    instructions += `<li>Connectez l'activité "${analysis.activities[i].name}" à l'activité "${analysis.activities[i+1].name}"</li>`;
                }
            }
        }
        
        // Suggérer la connexion à l'événement de fin
        if (analysis.activities.length > 0 && analysis.endEvents.length > 0) {
            instructions += `<li>Connectez la dernière activité "${analysis.activities[analysis.activities.length-1].name}" à l'événement de fin</li>`;
        }
        
        instructions += `</ul>`;
        
        if (analysis.externalActors.length > 0) {
            instructions += `<p>Flux de message:</p>`;
            instructions += `<ul>`;
            // Générer des suggestions pour les flux de message
            analysis.messageFlows.forEach(flow => {
                instructions += `<li>Connectez ${flow.from} à ${flow.to} avec un flux de message (${flow.description})</li>`;
            });
            instructions += `</ul>`;
        }
        
        if (analysis.dataObjects.length > 0 || analysis.dataSources.length > 0) {
            instructions += `<p>Associations de données:</p>`;
            instructions += `<ul>`;
            // Générer des suggestions pour les associations
            analysis.dataAssociations.forEach(assoc => {
                instructions += `<li>Connectez l'activité "${assoc.activity}" à ${assoc.dataElement} avec une association de type ${assoc.type}</li>`;
            });
            instructions += `</ul>`;
        }
        
        // Conseils supplémentaires
        instructions += `<h4>Conseils supplémentaires</h4>`;
        instructions += `<ul>`;
        instructions += `<li>Assurez-vous que chaque élément est correctement placé dans le couloir de l'acteur responsable</li>`;
        instructions += `<li>Vérifiez que tous les chemins du processus aboutissent à un événement de fin</li>`;
        instructions += `<li>Nommez clairement chaque activité avec un verbe d'action</li>`;
        if (analysis.gateways.length > 0) {
            instructions += `<li>Identifiez clairement les conditions sur les flux sortants des passerelles</li>`;
        }
        instructions += `</ul>`;
        
        return instructions;
    }

    function analyzeProcessDescription(description) {
        // Cette fonction analyse le texte de description du processus
        // et extrait les informations pertinentes pour la modélisation BPMN
        
        // Initialiser l'objet d'analyse
        const analysis = {
            processName: "Processus d'affaires", // Par défaut
            actors: [],
            externalActors: [],
            activities: [],
            gateways: [],
            startEventType: "générique",
            startActor: "Premier acteur",
            endEvents: [],
            intermediateEvents: [],
            dataObjects: [],
            dataSources: [],
            messageFlows: [],
            dataAssociations: []
        };
        
        // Extraire le nom du processus (première phrase ou titre si disponible)
        const lines = description.split('\n');
        if (lines.length > 0 && lines[0].trim()) {
            // Utiliser la première ligne comme nom du processus si elle semble être un titre
            if (lines[0].length < 100 && !lines[0].endsWith('.')) {
                analysis.processName = lines[0].trim();
            } else {
                // Sinon, extraire la première phrase si elle est courte
                const firstSentence = description.split('.')[0];
                if (firstSentence.length < 100) {
                    analysis.processName = firstSentence.trim();
                }
            }
        }
        
        // Mots clés pour identifier les différents éléments
        const actorKeywords = ['acteur', 'acteurs', 'participant', 'participants', 'responsable', 'client', 'utilisateur', 'employé', 'service', 'département', 'équipe', 'fournisseur'];
        const activityKeywords = ['activité', 'tâche', 'action', 'étape', 'traite', 'effectue', 'exécute', 'réalise', 'analyse', 'crée', 'vérifie', 'valide', 'envoie', 'reçoit', 'génère', 'consulte', 'examine', 'modifie'];
        const decisionKeywords = ['décision', 'condition', 'si', 'choix', 'option', 'alternative', 'cas', 'vérifier si', 'déterminer si', 'évaluer si', 'sinon'];
        const systemKeywords = ['système', 'application', 'logiciel', 'base de données', 'outil', 'plateforme', 'automatiquement', 'automatisé'];
        const documentKeywords = ['document', 'formulaire', 'rapport', 'fichier', 'email', 'courriel', 'lettre', 'facture', 'commande', 'contrat', 'dossier'];
        const databaseKeywords = ['base de données', 'stockage', 'référentiel', 'entrepôt de données', 'système d\'information', 'registre', 'catalogue', 'annuaire'];
        const eventStartKeywords = ['commence', 'débute', 'démarre', 'initié', 'déclenché'];
        const eventEndKeywords = ['termine', 'finit', 'clôture', 'finalise', 'fin du processus', 'processus terminé', 'met fin', 'conclut'];
        const eventTimeKeywords = ['attend', 'délai', 'pause', 'temporisation', 'plus tard', 'après', 'périodique', 'chaque jour', 'chaque matin', 'chaque semaine', 'mensuel'];
        const eventMessageKeywords = ['reçoit', 'message', 'notification', 'alerte', 'signal', 'informé', 'communiqué', 'envoyé', 'transmis'];
        
        // Analyser chaque phrase pour extraire les informations
        const sentences = description.replace(/\n/g, ' ').split(/\.\s+|\?\s+|\!\s+/);
        
        sentences.forEach(sentence => {
            sentence = sentence.trim();
            if (!sentence) return;
            
            // Identifier les acteurs
            actorKeywords.forEach(keyword => {
                const regex = new RegExp(`(?:le|la|les|un|une|des|l'|d'|du) (\\w+\\s+${keyword}|${keyword}\\s+\\w+)`, 'gi');
                const matches = sentence.matchAll(regex);
                
                for (const match of matches) {
                    if (match[1]) {
                        const actor = match[1].trim();
                        
                        // Déterminer si c'est un acteur interne ou externe
                        const isExternal = /client|fournisseur|externe|partenaire/.test(actor.toLowerCase());
                        
                        if (isExternal && !analysis.externalActors.includes(actor)) {
                            analysis.externalActors.push(actor);
                        } else if (!isExternal && !analysis.actors.includes(actor)) {
                            analysis.actors.push(actor);
                        }
                    }
                }
            });
            
            // Extraire les noms d'acteurs simples qui peuvent apparaître en début de phrase
            const simpleActorRegex = /^([A-Z][a-zÀ-ÿ''-]+(?:\s[a-zÀ-ÿ''-]+)?)\s+(?:vérifie|effectue|traite|analyse|envoie|reçoit|crée|examine|valide)/i;
            const simpleActorMatch = sentence.match(simpleActorRegex);
            
            if (simpleActorMatch && simpleActorMatch[1]) {
                const actor = simpleActorMatch[1].trim();
                if (!analysis.actors.includes(actor) && !analysis.externalActors.includes(actor)) {
                    analysis.actors.push(actor);
                }
            }
            
            // Identifier les activités et leur type
            activityKeywords.forEach(keyword => {
                if (sentence.toLowerCase().includes(keyword)) {
                    // Détecter le type d'activité
                    let activityType = 'générique';
                    
                    if (systemKeywords.some(sk => sentence.toLowerCase().includes(sk))) {
                        // Déterminer si c'est une activité utilisateur ou service
                        if (sentence.toLowerCase().includes('automatique') || 
                            sentence.toLowerCase().includes('automatisé') ||
                            sentence.toLowerCase().includes('sans intervention')) {
                            activityType = 'service';
                        } else {
                            activityType = 'utilisateur';
                        }
                    } else {
                        activityType = 'manuelle';
                    }
                    
                    // Trouver l'acteur responsable
                    let activityActor = analysis.actors.length > 0 ? analysis.actors[0] : "Acteur non spécifié";
                    
                    for (const actor of [...analysis.actors, ...analysis.externalActors]) {
                        if (sentence.includes(actor)) {
                            activityActor = actor;
                            break;
                        }
                    }
                    
                    // Extraire le nom de l'activité
                    let activityName = "";
                    const verbMatch = sentence.match(new RegExp(`(\\w+\\s+)?${keyword}\\s+([^,\\.]+)`, 'i'));
                    
                    if (verbMatch && verbMatch[2]) {
                        activityName = `${keyword} ${verbMatch[2].trim()}`;
                    } else {
                        activityName = sentence;
                    }
                    
                    // Limiter la longueur du nom
                    activityName = activityName.length > 60 ? activityName.substring(0, 57) + '...' : activityName;
                    
                    // Ajouter l'activité à l'analyse
                    analysis.activities.push({
                        name: activityName,
                        type: activityType,
                        actor: activityActor
                    });
                    
                    // Vérifier si l'activité implique un document ou une base de données
                    documentKeywords.forEach(docKeyword => {
                        if (sentence.toLowerCase().includes(docKeyword)) {
                            const docName = docKeyword.charAt(0).toUpperCase() + docKeyword.slice(1);
                            
                            if (!analysis.dataObjects.some(d => d.name === docName)) {
                                analysis.dataObjects.push({ name: docName });
                                
                                // Ajouter l'association
                                const associationType = sentence.toLowerCase().includes('crée') || 
                                                        sentence.toLowerCase().includes('génère') ? 
                                                        'création' : (
                                                            sentence.toLowerCase().includes('modifie') || 
                                                            sentence.toLowerCase().includes('met à jour') ? 
                                                            'mise à jour' : 'lecture'
                                                        );
                                
                                analysis.dataAssociations.push({
                                    activity: activityName,
                                    dataElement: `l'objet de données "${docName}"`,
                                    type: associationType
                                });
                            }
                        }
                    });
                    
                    databaseKeywords.forEach(dbKeyword => {
                        if (sentence.toLowerCase().includes(dbKeyword)) {
                            const dbName = dbKeyword.charAt(0).toUpperCase() + dbKeyword.slice(1);
                            
                            if (!analysis.dataSources.some(d => d.name === dbName)) {
                                analysis.dataSources.push({ name: dbName });
                                
                                // Ajouter l'association
                                const associationType = sentence.toLowerCase().includes('stocke') || 
                                                        sentence.toLowerCase().includes('enregistre') ? 
                                                        'création' : (
                                                            sentence.toLowerCase().includes('modifie') || 
                                                            sentence.toLowerCase().includes('met à jour') ? 
                                                            'mise à jour' : 'lecture'
                                                        );
                                
                                analysis.dataAssociations.push({
                                    activity: activityName,
                                    dataElement: `le magasin de données "${dbName}"`,
                                    type: associationType
                                });
                            }
                        }
                    });
                }
            });
            
            // Identifier les décisions (passerelles)
            decisionKeywords.forEach(keyword => {
                if (sentence.toLowerCase().includes(keyword)) {
                    // Extraire le nom de la décision
                    let gatewayName = sentence;
                    
                    // Trouver l'acteur responsable
                    let gatewayActor = analysis.actors.length > 0 ? analysis.actors[0] : "Acteur non spécifié";
                    
                    for (const actor of analysis.actors) {
                        if (sentence.includes(actor)) {
                            gatewayActor = actor;
                            break;
                        }
                    }
                    
                    // Limiter la longueur du nom
                    gatewayName = gatewayName.length > 60 ? gatewayName.substring(0, 57) + '...' : gatewayName;
                    
                    // Ajouter la passerelle à l'analyse
                    analysis.gateways.push({
                        name: gatewayName,
                        type: 'exclusive',
                        actor: gatewayActor
                    });
                }
            });
            
            // Identifier les événements
            // Événement de début
            eventStartKeywords.forEach(keyword => {
                if (sentence.toLowerCase().includes(keyword)) {
                    if (sentence.toLowerCase().includes('message') || 
                        sentence.toLowerCase().includes('demande') || 
                        sentence.toLowerCase().includes('réception')) {
                        analysis.startEventType = "message";
                    }
                    
                    // Trouver l'acteur qui démarre le processus
                    for (const actor of [...analysis.actors, ...analysis.externalActors]) {
                        if (sentence.includes(actor)) {
                            analysis.startActor = actor;
                            break;
                        }
                    }
                }
            });
            
            // Événements intermédiaires
            let isIntermediateEvent = false;
            
            eventTimeKeywords.forEach(keyword => {
                if (sentence.toLowerCase().includes(keyword)) {
                    isIntermediateEvent = true;
                    
                    // Trouver l'acteur concerné
                    let eventActor = analysis.actors.length > 0 ? analysis.actors[0] : "Acteur non spécifié";
                    
                    for (const actor of analysis.actors) {
                        if (sentence.includes(actor)) {
                            eventActor = actor;
                            break;
                        }
                    }
                    
                    analysis.intermediateEvents.push({
                        type: "minuterie",
                        actor: eventActor,
                        description: sentence
                    });
                }
            });
            
            eventMessageKeywords.forEach(keyword => {
                if (!isIntermediateEvent && sentence.toLowerCase().includes(keyword)) {
                    // Trouver l'acteur concerné
                    let eventActor = analysis.actors.length > 0 ? analysis.actors[0] : "Acteur non spécifié";
                    let eventType = sentence.toLowerCase().includes('reçoit') ? "réception message" : "émission message";
                    
                    for (const actor of analysis.actors) {
                        if (sentence.includes(actor)) {
                            eventActor = actor;
                            break;
                        }
                    }
                    
                    analysis.intermediateEvents.push({
                        type: eventType,
                        actor: eventActor,
                        description: sentence
                    });
                    
                    // Identifier les flux de message potentiels
                    if (analysis.externalActors.length > 0) {
                        for (const externalActor of analysis.externalActors) {
                            if (sentence.includes(externalActor)) {
                                if (eventType === "réception message") {
                                    analysis.messageFlows.push({
                                        from: externalActor,
                                        to: eventActor,
                                        description: sentence
                                    });
                                } else {
                                    analysis.messageFlows.push({
                                        from: eventActor,
                                        to: externalActor,
                                        description: sentence
                                    });
                                }
                                break;
                            }
                        }
                    }
                }
            });
            
            // Événements de fin
            eventEndKeywords.forEach(keyword => {
                if (sentence.toLowerCase().includes(keyword)) {
                    let eventType = "générique";
                    
                    if (sentence.toLowerCase().includes('message') || 
                        sentence.toLowerCase().includes('notifie') || 
                        sentence.toLowerCase().includes('informe')) {
                        eventType = "message";
                    }
                    
                    // Trouver l'acteur qui termine le processus
                    let eventActor = analysis.actors.length > 0 ? analysis.actors[0] : "Acteur non spécifié";
                    
                    for (const actor of analysis.actors) {
                        if (sentence.includes(actor)) {
                            eventActor = actor;
                            break;
                        }
                    }
                    
                    analysis.endEvents.push({
                        type: eventType,
                        actor: eventActor,
                        description: sentence
                    });
                }
            });
        });
        
        // Si aucun acteur n'est identifié, ajouter un acteur par défaut
        if (analysis.actors.length === 0) {
            analysis.actors.push("Utilisateur");
        }
        
        // Si aucun événement de fin n'est identifié, en ajouter un par défaut
        if (analysis.endEvents.length === 0) {
            analysis.endEvents.push({
                type: "générique",
                actor: analysis.actors[analysis.actors.length - 1],
                description: "Fin du processus"
            });
        }
        
        // Ajouter des flux de message si des acteurs externes sont identifiés mais aucun flux n'est défini
        if (analysis.externalActors.length > 0 && analysis.messageFlows.length === 0) {
            // Ajouter un flux par défaut du premier acteur externe vers le premier acteur interne
            analysis.messageFlows.push({
                from: analysis.externalActors[0],
                to: analysis.actors[0],
                description: "Communication entre acteurs"
            });
        }
        
        return analysis;
    }
});
