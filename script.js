// Données pour le traitement
const bpmnElements = {
    piscines: [],
    couloirs: [],
    activites: [],
    evenements: [],
    passerelles: [],
    donnees: [],
    flux: []
};

// Éléments de référence pour les types BPMN
const elementTypes = {
    piscine: "piscine",
    couloir: "couloir",
    activiteUtilisateur: "activité utilisateur",
    activiteManuelle: "activité manuelle",
    activiteService: "activité service",
    activiteGenerique: "activité générique",
    evenementDebut: "événement de début générique",
    evenementDebutMessage: "événement de début message",
    evenementFin: "événement de fin",
    evenementFinMessage: "événement de fin message",
    evenementInterReception: "événement intermédiaire réception message",
    evenementInterEmission: "événement intermédiaire émission message",
    evenementInterMinuterie: "événement intermédiaire minuterie",
    passerelleExclusive: "passerelle exclusive",
    objetDonnees: "objet de données",
    magasinDonnees: "magasin de données",
    fluxSequence: "flux de séquence",
    fluxMessage: "flux de message",
    association: "association"
};

// Positions relatives
const positions = ["à droite", "à gauche", "au-dessus", "au-dessous", "en haut à droite", "en haut à gauche", "en bas à droite", "en bas à gauche"];

// Mots-clés pour extraire les informations
const keywords = {
    acteurs: ["acteur", "client", "fournisseur", "utilisateur", "personne", "système", "application"],
    activites: ["vérifie", "consulte", "saisit", "envoie", "reçoit", "traite", "analyse", "crée"],
    donnees: ["document", "fichier", "formulaire", "base de données", "système", "magasin"],
    decisions: ["si", "sinon", "condition", "décision", "choix"]
};

// Initialisation des événements DOM
document.addEventListener('DOMContentLoaded', function() {
    const generateBtn = document.getElementById('generate-btn');
    const refineBtn = document.getElementById('refine-btn');
    const updateBtn = document.getElementById('update-description-btn');
    const scenario = document.getElementById('scenario');
    const output = document.getElementById('output');
    const elementSection = document.getElementById('element-section');
    const elementList = document.getElementById('element-list');
    
    // Génération de la description initiale
    generateBtn.addEventListener('click', function() {
        const scenarioText = scenario.value.trim();
        if (!scenarioText) {
            alert("Veuillez entrer une description du processus d'affaires.");
            return;
        }
        
        // Analyser le texte et générer la description
        const description = generateBPMNDescription(scenarioText);
        output.textContent = description;
        
        // Extraire les éléments pour la révision
        extractBPMNElements(description);
        populateElementList();
        
        // Afficher la section de révision
        elementSection.style.display = 'block';
        refineBtn.disabled = false;
    });
    
    // Affiner la description avec des vérifications de positions
    refineBtn.addEventListener('click', function() {
        const refinedDescription = refinePositions(output.textContent);
        output.textContent = refinedDescription;
    });
    
    // Mettre à jour la description après modification des positions
    updateBtn.addEventListener('click', function() {
        updateElementPositions();
        const updatedDescription = regenerateDescription();
        output.textContent = updatedDescription;
    });
});

/**
 * Génère une description BPMN à partir du texte du scénario
 * @param {string} scenarioText - Texte du scénario
 * @return {string} - Description BPMN générée
 */
function generateBPMNDescription(scenarioText) {
    // Réinitialiser les éléments BPMN
    bpmnElements.piscines = [];
    bpmnElements.couloirs = [];
    bpmnElements.activites = [];
    bpmnElements.evenements = [];
    bpmnElements.passerelles = [];
    bpmnElements.donnees = [];
    bpmnElements.flux = [];
    
    // Diviser le texte en phrases pour l'analyse
    const sentences = scenarioText.split(/\.|\n/).filter(s => s.trim().length > 0);
    
    // Extraire les acteurs pour les piscines et couloirs
    extractActors(sentences);
    
    // Extraire les activités, événements et flux
    extractProcessFlow(sentences);
    
    // Générer la description textuelle
    return formatBPMNDescription();
}

/**
 * Extrait les acteurs pour créer les piscines et couloirs
 * @param {string[]} sentences - Phrases du scénario
 */
function extractActors(sentences) {
    const actorRegex = /(client|fournisseur|agent|superviseur|technicien|système)/gi;
    const roles = new Set();
    
    sentences.forEach(sentence => {
        const matches = sentence.match(actorRegex);
        if (matches) {
            matches.forEach(match => {
                const role = match.toLowerCase();
                roles.add(role);
                
                // Détecter si c'est un acteur externe ou interne
                const isExternal = role.includes('client') || role.includes('fournisseur');
                
                if (isExternal) {
                    if (!bpmnElements.piscines.some(p => p.nom.toLowerCase() === role)) {
                        bpmnElements.piscines.push({
                            type: elementTypes.piscine,
                            nom: capitalizeFirstLetter(role),
                            externe: true
                        });
                    }
                } else {
                    if (!bpmnElements.couloirs.some(c => c.nom.toLowerCase() === role)) {
                        bpmnElements.couloirs.push({
                            type: elementTypes.couloir,
                            nom: capitalizeFirstLetter(role)
                        });
                    }
                }
            });
        }
    });
    
    // Ajouter une piscine principale si des couloirs ont été trouvés
    if (bpmnElements.couloirs.length > 0 && !bpmnElements.piscines.some(p => !p.externe)) {
        bpmnElements.piscines.push({
            type: elementTypes.piscine,
            nom: "Processus principal",
            externe: false
        });
    }
}

/**
 * Extrait le flux du processus: activités, événements, passerelles
 * @param {string[]} sentences - Phrases du scénario
 */
function extractProcessFlow(sentences) {
    // Créer les événements de début et de fin par défaut
    bpmnElements.evenements.push({
        type: elementTypes.evenementDebut,
        nom: "Début du processus",
        position: "à gauche"
    });
    
    bpmnElements.evenements.push({
        type: elementTypes.evenementFin,
        nom: "Fin du processus",
        position: "à droite"
    });
    
    sentences.forEach((sentence, index) => {
        const lowerSentence = sentence.toLowerCase();
        
        // Détecter les activités
        if (containsAny(lowerSentence, keywords.activites)) {
            const activityType = determineActivityType(lowerSentence);
            const activityName = extractActivityName(sentence);
            
            bpmnElements.activites.push({
                type: activityType,
                nom: activityName,
                position: "à droite", // Position par défaut
                reference: index
            });
            
            // Ajouter un flux de séquence implicite
            if (bpmnElements.activites.length > 1) {
                const prevActivity = bpmnElements.activites[bpmnElements.activites.length - 2];
                bpmnElements.flux.push({
                    type: elementTypes.fluxSequence,
                    source: prevActivity.nom,
                    destination: activityName,
                    condition: ""
                });
            }
        }
        
        // Détecter les données
        if (containsAny(lowerSentence, keywords.donnees)) {
            const dataType = lowerSentence.includes("base de données") || lowerSentence.includes("système") 
                ? elementTypes.magasinDonnees 
                : elementTypes.objetDonnees;
            const dataName = extractDataName(sentence);
            
            if (dataName) {
                bpmnElements.donnees.push({
                    type: dataType,
                    nom: dataName,
                    position: "au-dessus", // Position par défaut
                    reference: index
                });
                
                // Associer aux activités proches
                if (bpmnElements.activites.length > 0) {
                    const recentActivity = bpmnElements.activites[bpmnElements.activites.length - 1];
                    bpmnElements.flux.push({
                        type: elementTypes.association,
                        source: recentActivity.nom,
                        destination: dataName
                    });
                }
            }
        }
        
        // Détecter les décisions (passerelles)
        if (containsAny(lowerSentence, keywords.decisions)) {
            const gatewayName = extractGatewayName(sentence);
            
            if (gatewayName) {
                bpmnElements.passerelles.push({
                    type: elementTypes.passerelleExclusive,
                    nom: gatewayName,
                    position: "à droite", // Position par défaut
                    reference: index
                });
                
                // Connecter à l'activité précédente
                if (bpmnElements.activites.length > 0) {
                    const recentActivity = bpmnElements.activites[bpmnElements.activites.length - 1];
                    bpmnElements.flux.push({
                        type: elementTypes.fluxSequence,
                        source: recentActivity.nom,
                        destination: gatewayName
                    });
                }
            }
        }
    });
}

/**
 * Formate la description BPMN complète
 * @return {string} - Description formatée
 */
function formatBPMNDescription() {
    let description = "";
    
    // Décrire les piscines
    bpmnElements.piscines.forEach(piscine => {
        if (piscine.externe) {
            description += `Tracer une piscine pour l'acteur externe « ${piscine.nom} ».\n\n`;
        } else {
            const couloirsText = bpmnElements.couloirs.length > 0 
                ? ` dans laquelle on retrouve ${bpmnElements.couloirs.length} couloir${bpmnElements.couloirs.length > 1 ? 's' : ''} pour les acteurs internes: ${bpmnElements.couloirs.map(c => `« ${c.nom} »`).join(', ')}`
                : '';
            description += `Tracer une piscine « ${piscine.nom} »${couloirsText}.\n\n`;
        }
    });
    
    // Décrire les événements de début
    const startEvent = bpmnElements.evenements.find(e => e.type === elementTypes.evenementDebut);
    if (startEvent) {
        description += `Tracer un événement début générique à gauche de la piscine « ${bpmnElements.piscines[0].nom} ».\n\n`;
    }
    
    // Décrire les activités avec les flux de séquence
    bpmnElements.activites.forEach((activite, index) => {
        if (index === 0) {
            description += `Tracer l'activité ${activite.type} « ${activite.nom} » à droite de l'événement début générique et relier ces deux éléments par un flux de séquence.\n\n`;
        } else {
            const previousElement = bpmnElements.activites[index - 1];
            description += `Tracer l'activité ${activite.type} « ${activite.nom} » à droite de l'activité ${previousElement.type} « ${previousElement.nom} » et relier ces deux éléments par un flux de séquence.\n\n`;
        }
    });
    
    // Décrire les passerelles
    bpmnElements.passerelles.forEach(passerelle => {
        const recentActivity = bpmnElements.activites[bpmnElements.activites.length - 1];
        description += `Tracer une passerelle ${passerelle.type} « ${passerelle.nom} » à droite de l'activité ${recentActivity.type} « ${recentActivity.nom} » et relier ces deux éléments par un flux de séquence.\n\n`;
        
        // Ajouter des branches pour la passerelle
        description += `Tracer un flux de séquence de la passerelle vers une nouvelle activité avec la condition « Oui ».\n`;
        description += `Tracer un flux de séquence de la passerelle vers une autre activité avec la condition « Non ».\n\n`;
    });
    
    // Décrire les objets et magasins de données
    bpmnElements.donnees.forEach(donnee => {
        const relatedActivity = bpmnElements.activites.find(a => a.reference === donnee.reference) || bpmnElements.activites[bpmnElements.activites.length - 1];
        description += `Tracer un ${donnee.type} « ${donnee.nom} » au-dessus de l'activité ${relatedActivity.type} « ${relatedActivity.nom} » et relier ce ${donnee.type} à l'activité par une association.\n\n`;
    });
    
    // Décrire l'événement de fin
    const endEvent = bpmnElements.evenements.find(e => e.type === elementTypes.evenementFin);
    if (endEvent) {
        const lastActivity = bpmnElements.activites[bpmnElements.activites.length - 1];
        description += `Tracer un événement de fin « ${endEvent.nom} » à droite de l'activité ${lastActivity.type} « ${lastActivity.nom} » et relier ces deux éléments par un flux de séquence.\n\n`;
    }
    
    return description;
}

/**
 * Extrait les éléments BPMN d'une description existante
 * @param {string} description - Description BPMN
 */
function extractBPMNElements(description) {
    // Réinitialiser les éléments BPMN
    bpmnElements.piscines = [];
    bpmnElements.couloirs = [];
    bpmnElements.activites = [];
    bpmnElements.evenements = [];
    bpmnElements.passerelles = [];
    bpmnElements.donnees = [];
    bpmnElements.flux = [];
    
    // Découper en lignes
    const lines = description.split('\n').filter(l => l.trim().length > 0);
    
    lines.forEach(line => {
        // Extraire les piscines
        const piscineMatch = line.match(/Tracer une piscine(?: pour l'acteur externe)? « ([^»]+) »/);
        if (piscineMatch) {
            bpmnElements.piscines.push({
                type: elementTypes.piscine,
                nom: piscineMatch[1],
                externe: line.includes('acteur externe')
            });
        }
        
        // Extraire les couloirs
        const couloirMatch = line.match(/couloirs? pour les acteurs internes: (.*)/);
        if (couloirMatch) {
            const couloirNames = couloirMatch[1].match(/« ([^»]+) »/g);
            if (couloirNames) {
                couloirNames.forEach(name => {
                    const cleanName = name.replace(/« /, '').replace(/ »/, '');
                    bpmnElements.couloirs.push({
                        type: elementTypes.couloir,
                        nom: cleanName
                    });
                });
            }
        }
        
        // Extraire les activités
        const activiteMatch = line.match(/Tracer l'activité (.*?) « ([^»]+) »/);
        if (activiteMatch) {
            const positionMatch = line.match(/(à droite|à gauche|au-dessus|au-dessous|en haut à droite|en haut à gauche|en bas à droite|en bas à gauche) de/);
            bpmnElements.activites.push({
                type: activiteMatch[1],
                nom: activiteMatch[2],
                position: positionMatch ? positionMatch[1] : "à droite"
            });
        }
        
        // Extraire les événements
        const evenementMatch = line.match(/Tracer un (événement.*?) « ([^»]+) »/);
        if (evenementMatch) {
            const positionMatch = line.match(/(à droite|à gauche|au-dessus|au-dessous|en haut à droite|en haut à gauche|en bas à droite|en bas à gauche) de/);
            bpmnElements.evenements.push({
                type: evenementMatch[1],
                nom: evenementMatch[2],
                position: positionMatch ? positionMatch[1] : "à droite"
            });
        }
        
        // Extraire les passerelles
        const passerelleMatch = line.match(/Tracer une passerelle (.*?) « ([^»]+) »/);
        if (passerelleMatch) {
            const positionMatch = line.match(/(à droite|à gauche|au-dessus|au-dessous|en haut à droite|en haut à gauche|en bas à droite|en bas à gauche) de/);
            bpmnElements.passerelles.push({
                type: passerelleMatch[1],
                nom: passerelleMatch[2],
                position: positionMatch ? positionMatch[1] : "à droite"
            });
        }
        
        // Extraire les données
        const donneeMatch = line.match(/Tracer un ((?:objet|magasin) de données) « ([^»]+) »/);
        if (donneeMatch) {
            const positionMatch = line.match(/(à droite|à gauche|au-dessus|au-dessous|en haut à droite|en haut à gauche|en bas à droite|en bas à gauche) de/);
            bpmnElements.donnees.push({
                type: donneeMatch[1],
                nom: donneeMatch[2],
                position: positionMatch ? positionMatch[1] : "au-dessus"
            });
        }
        
        // Extraire les flux
        const fluxMatch = line.match(/relier .* par un (flux de séquence|flux de message|association)/);
        if (fluxMatch) {
            const sourceMatch = line.match(/relier « ([^»]+) »/);
            const destinationMatch = line.match(/« ([^»]+) » par un/);
            const conditionMatch = line.match(/condition « ([^»]+) »/);
            
            if (sourceMatch && destinationMatch) {
                bpmnElements.flux.push({
                    type: fluxMatch[1],
                    source: sourceMatch[1],
                    destination: destinationMatch[1],
                    condition: conditionMatch ? conditionMatch[1] : ""
                });
            }
        }
    });
}

/**
 * Affiche la liste des éléments pour modification des positions
 */
function populateElementList() {
    const elementList = document.getElementById('element-list');
    elementList.innerHTML = '';
    
    // Construire les options de position
    const positionOptions = positions.map(pos => `<option value="${pos}">${pos}</option>`).join('');
    
    // Ajouter les activités
    if (bpmnElements.activites.length > 0) {
        const activitesDiv = document.createElement('div');
        activitesDiv.innerHTML = `<h3>Activités</h3>`;
        
        bpmnElements.activites.forEach((activite, index) => {
            const elementDiv = document.createElement('div');
            elementDiv.className = 'element-item';
            elementDiv.innerHTML = `
                <div>${activite.type} « ${activite.nom} »</div>
                <div class="position-selector">
                    Position: 
                    <select data-type="activite" data-index="${index}">
                        ${positionOptions}
                    </select>
                </div>
            `;
            
            // Sélectionner la position actuelle
            setTimeout(() => {
                const select = elementDiv.querySelector('select');
                select.value = activite.position;
            }, 0);
            
            activitesDiv.appendChild(elementDiv);
        });
        
        elementList.appendChild(activitesDiv);
    }
    
    // Ajouter les données
    if (bpmnElements.donnees.length > 0) {
        const donneesDiv = document.createElement('div');
        donneesDiv.innerHTML = `<h3>Données</h3>`;
        
        bpmnElements.donnees.forEach((donnee, index) => {
            const elementDiv = document.createElement('div');
            elementDiv.className = 'element-item';
            elementDiv.innerHTML = `
                <div>${donnee.type} « ${donnee.nom} »</div>
                <div class="position-selector">
                    Position: 
                    <select data-type="donnee" data-index="${index}">
                        ${positionOptions}
                    </select>
                </div>
            `;
            
            // Sélectionner la position actuelle
            setTimeout(() => {
                const select = elementDiv.querySelector('select');
                select.value = donnee.position;
            }, 0);
            
            donneesDiv.appendChild(elementDiv);
        });
        
        elementList.appendChild(donneesDiv);
    }
    
    // Ajouter les passerelles
    if (bpmnElements.passerelles.length > 0) {
        const passerellesDiv = document.createElement('div');
        passerellesDiv.innerHTML = `<h3>Passerelles</h3>`;
        
        bpmnElements.passerelles.forEach((passerelle, index) => {
            const elementDiv = document.createElement('div');
            elementDiv.className = 'element-item';
            elementDiv.innerHTML = `
                <div>${passerelle.type} « ${passerelle.nom} »</div>
                <div class="position-selector">
                    Position: 
                    <select data-type="passerelle" data-index="${index}">
                        ${positionOptions}
                    </select>
                </div>
            `;
            
            // Sélectionner la position actuelle
            setTimeout(() => {
                const select = elementDiv.querySelector('select');
                select.value = passerelle.position;
            }, 0);
            
            passerellesDiv.appendChild(elementDiv);
        });
        
        elementList.appendChild(passerellesDiv);
    }
}

/**
 * Met à jour les positions des éléments
 */
function updateElementPositions() {
    // Récupérer tous les sélecteurs de position
    const selectors = document.querySelectorAll('.position-selector select');
    
    selectors.forEach(selector => {
        const type = selector.getAttribute('data-type');
        const index = parseInt(selector.getAttribute('data-index'));
        const newPosition = selector.value;
        
        // Mettre à jour la position dans l'objet correspondant
        if (type === 'activite' && bpmnElements.activites[index]) {
            bpmnElements.activites[index].position = newPosition;
        } else if (type === 'donnee' && bpmnElements.donnees[index]) {
            bpmnElements.donnees[index].position = newPosition;
        } else if (type === 'passerelle' && bpmnElements.passerelles[index]) {
            bpmnElements.passerelles[index].position = newPosition;
        }
    });
}

/**
 * Régénère la description avec les positions mises à jour
 * @return {string} - Description mise à jour
 */
function regenerateDescription() {
    let description = "";
    
    // Décrire les piscines
    bpmnElements.piscines.forEach(piscine => {
        if (piscine.externe) {
            description += `Tracer une piscine pour l'acteur externe « ${piscine.nom} ».\n\n`;
        } else {
            const couloirsText = bpmnElements.couloirs.length > 0 
                ? ` dans laquelle on retrouve ${bpmnElements.couloirs.length} couloir${bpmnElements.couloirs.length > 1 ? 's' : ''} pour les acteurs internes: ${bpmnElements.couloirs.map(c => `« ${c.nom} »`).join(', ')}`
                : '';
            description += `Tracer une piscine « ${piscine.nom} »${couloirsText}.\n\n`;
        }
    });
    
    // Décrire les événements de début
    const startEvents = bpmnElements.evenements.filter(e => e.type.includes('début'));
    startEvents.forEach(startEvent => {
        if (startEvent.type === elementTypes.evenementDebut) {
            description += `Tracer un événement début générique à gauche de la piscine « ${bpmnElements.piscines[0].nom} ».\n\n`;
        } else {
            description += `Tracer un ${startEvent.type} « ${startEvent.nom} » ${startEvent.position} de la piscine « ${bpmnElements.piscines[0].nom} ».\n\n`;
        }
    });
    
    // Décrire les activités avec les flux de séquence et leurs positions
    bpmnElements.activites.forEach((activite, index) => {
        if (index === 0 && startEvents.length > 0) {
            description += `Tracer l'activité ${activite.type} « ${activite.nom} » ${activite.position} de l'événement début et relier ces deux éléments par un flux de séquence.\n\n`;
        } else if (index > 0) {
            const previousElement = bpmnElements.activites[index - 1];
            description += `Tracer l'activité ${activite.type} « ${activite.nom} » ${activite.position} de l'activité ${previousElement.type} « ${previousElement.nom} » et relier ces deux éléments par un flux de séquence.\n\n`;
        } else {
            description += `Tracer l'activité ${activite.type} « ${activite.nom} ».\n\n`;
        }
    });
    
    // Décrire les passerelles avec leurs positions
    bpmnElements.passerelles.forEach(passerelle => {
        let referenceElement = null;
        
        if (bpmnElements.activites.length > 0) {
            referenceElement = bpmnElements.activites[bpmnElements.activites.length - 1];
            description += `Tracer une passerelle ${passerelle.type} « ${passerelle.nom} » ${passerelle.position} de l'activité ${referenceElement.type} « ${referenceElement.nom} » et relier ces deux éléments par un flux de séquence.\n\n`;
        } else {
            description += `Tracer une passerelle ${passerelle.type} « ${passerelle.nom} ».\n\n`;
        }
        
        // Ajouter des branches pour la passerelle
        description += `Tracer un flux de séquence de la passerelle vers une nouvelle activité avec la condition « Oui ».\n`;
        description += `Tracer un flux de séquence de la passerelle vers une autre activité avec la condition « Non ».\n\n`;
    });
    
    // Décrire les objets et magasins de données
    bpmnElements.donnees.forEach((donnee, index) => {
        let referenceElement = null;
        
        if (index < bpmnElements.activites.length) {
            referenceElement = bpmnElements.activites[index];
        } else if (bpmnElements.activites.length > 0) {
            referenceElement = bpmnElements.activites[bpmnElements.activites.length - 1];
        }
        
        if (referenceElement) {
            description += `Tracer un ${donnee.type} « ${donnee.nom} » ${donnee.position} de l'activité ${referenceElement.type} « ${referenceElement.nom} » et relier ce ${donnee.type} à l'activité par une association.\n\n`;
        } else {
            description += `Tracer un ${donnee.type} « ${donnee.nom} ».\n\n`;
        }
    });
    
    // Décrire les événements de fin
    const endEvents = bpmnElements.evenements.filter(e => e.type.includes('fin'));
    endEvents.forEach(endEvent => {
        let referenceElement = null;
        
        if (bpmnElements.activites.length > 0) {
            referenceElement = bpmnElements.activites[bpmnElements.activites.length - 1];
            description += `Tracer un ${endEvent.type} « ${endEvent.nom} » ${endEvent.position} de l'activité ${referenceElement.type} « ${referenceElement.nom} » et relier ces deux éléments par un flux de séquence.\n\n`;
        } else {
            description += `Tracer un ${endEvent.type} « ${endEvent.nom} ».\n\n`;
        }
    });
    
    return description;
}

/**
 * Affine les positions dans une description existante
 * @param {string} description - Description à affiner
 * @return {string} - Description affinée
 */
function refinePositions(description) {
    // Extraire les éléments de la description
    extractBPMNElements(description);
    
    // Vérifier et corriger les positions
    correctPositions();
    
    // Régénérer la description
    return regenerateDescription();
}

/**
 * Corrige les positions incohérentes
 */
function correctPositions() {
    // Vérifier les activités
    bpmnElements.activites.forEach((activite, index) => {
        // Les activités doivent généralement être à droite les unes des autres
        if (index > 0 && activite.position !== "à droite") {
            console.log(`Correction: activité ${activite.nom} devrait être à droite de l'activité précédente.`);
            activite.position = "à droite";
        }
    });
    
    // Vérifier les données
    bpmnElements.donnees.forEach(donnee => {
        // Les magasins de données sont généralement au-dessus des activités
        if (donnee.type === elementTypes.magasinDonnees && !donnee.position.includes("au-dessus")) {
            console.log(`Correction: magasin de données ${donnee.nom} devrait être au-dessus d'une activité.`);
            donnee.position = "au-dessus";
        }
        
        // Les objets de données sont généralement en dessous des activités
        if (donnee.type === elementTypes.objetDonnees && !donnee.position.includes("au-dessous")) {
            console.log(`Correction: objet de données ${donnee.nom} devrait être au-dessous d'une activité.`);
            donnee.position = "au-dessous";
        }
    });
}

/**
 * Détermine le type d'activité en fonction du contenu de la phrase
 * @param {string} sentence - Phrase à analyser
 * @return {string} - Type d'activité
 */
function determineActivityType(sentence) {
    if (sentence.includes("saisit") || sentence.includes("vérifie") || sentence.includes("consulte")) {
        return elementTypes.activiteUtilisateur;
    } else if (sentence.includes("manuelle") || sentence.includes("manuellement")) {
        return elementTypes.activiteManuelle;
    } else if (sentence.includes("automatique") || sentence.includes("système")) {
        return elementTypes.activiteService;
    } else {
        return elementTypes.activiteGenerique;
    }
}

/**
 * Extrait le nom d'une activité à partir d'une phrase
 * @param {string} sentence - Phrase à analyser
 * @return {string} - Nom de l'activité
 */
function extractActivityName(sentence) {
    // Simplement utiliser la phrase avec la première lettre majuscule
    let name = sentence.trim();
    if (name.length > 60) {
        name = name.substring(0, 57) + "...";
    }
    return capitalizeFirstLetter(name);
}

/**
 * Extrait le nom d'une donnée à partir d'une phrase
 * @param {string} sentence - Phrase à analyser
 * @return {string} - Nom de la donnée
 */
function extractDataName(sentence) {
    const dataTerms = ["fichier", "document", "formulaire", "base de données", "système"];
    
    for (const term of dataTerms) {
        const index = sentence.toLowerCase().indexOf(term);
        if (index !== -1) {
            // Essayer d'extraire le nom qui suit le terme
            const afterTerm = sentence.substring(index + term.length).trim();
            const words = afterTerm.split(/\s+/);
            if (words.length > 0) {
                return capitalizeFirstLetter(term + " " + words.slice(0, Math.min(3, words.length)).join(" "));
            } else {
                return capitalizeFirstLetter(term);
            }
        }
    }
    
    // Si aucun terme spécifique n'est trouvé, utiliser un nom générique
    return "Données";
}

/**
 * Extrait le nom d'une passerelle à partir d'une phrase
 * @param {string} sentence - Phrase à analyser
 * @return {string} - Nom de la passerelle
 */
function extractGatewayName(sentence) {
    // Chercher des phrases conditionnelles
    if (sentence.includes("si ")) {
        const parts = sentence.split("si ");
        if (parts.length > 1) {
            const condition = parts[1].split("?")[0].split(",")[0].trim();
            return capitalizeFirstLetter(condition) + " ?";
        }
    }
    
    // Rechercher d'autres formes de conditions
    const conditionKeywords = ["existe", "valide", "approuvé", "accepté", "conforme"];
    for (const keyword of conditionKeywords) {
        if (sentence.includes(keyword)) {
            return capitalizeFirstLetter(keyword) + " ?";
        }
    }
    
    return "Condition ?";
}

/**
 * Vérifie si une chaîne contient l'un des mots-clés donnés
 * @param {string} str - Chaîne à vérifier
 * @param {string[]} keywords - Mots-clés à rechercher
 * @return {boolean} - Vrai si au moins un mot-clé est trouvé
 */
function containsAny(str, keywords) {
    return keywords.some(keyword => str.includes(keyword));
}

/**
 * Met en majuscule la première lettre d'une chaîne
 * @param {string} str - Chaîne à modifier
 * @return {string} - Chaîne avec la première lettre en majuscule
 */
function capitalizeFirstLetter(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
