function generateInstructions() {
    const scenarioText = document.getElementById('inputScenario').value.trim();
    if (!scenarioText) {
        document.getElementById('outputInstructions').innerText = 'Veuillez entrer une mise en situation.';
        return;
    }

    let instructions = [];
    instructions.push("Voici les étapes détaillées pour tracer votre modèle BPMN à partir de votre mise en situation :\n");

    // Instructions générales
    instructions.push("1. **Définir les frontières du processus**\n   - Piscines (🟦) pour chaque organisation.\n   - Couloirs (🟩) pour chaque département ou rôle interne.");

    instructions.push("2. **Lister les acteurs, objets et systèmes**\n   - Acteurs, objets échangés (📄), et systèmes impliqués.");

    instructions.push("3. **Détailler les activités**\n   - Actions réalisées dans les couloirs (▭).\n");

    instructions.push("4. **Positionner les événements**\n   - Début (⚪), intermédiaire (⚪⚪), et fin (⚫).");

    instructions.push("5. **Tracer les flux**\n   - Séquences (➡️) et messages inter-piscines (➖).");

    instructions.push("6. **Ajouter les passerelles de décision**\n   - Décisions Oui/Non (🔷).");

    instructions.push("7. **Inclure les objets et magasins de données**\n   - 📄 Objets de données et 🗄️ Magasins de données.");

    instructions.push("\n---\nAnalyse spécifique de votre mise en situation :\n");

    const sentences = scenarioText.split(/\n|\.|!|\?/).filter(s => s.trim().length > 0);

    sentences.forEach((sentence, index) => {
        let action = `- Étape ${index + 1} : ${sentence.trim()}`;

        if (index === 0) {
            action += "\n  👉 Action : Tracez un événement en début générique (⚪) à la frontière de la piscine 'Client'. Reliez-le avec un flux de message (➖) vers un événement début message (⚪) au début du couloir correspondant.";
        } else {
            let lowerSentence = sentence.toLowerCase();

            if (lowerSentence.includes("vérifie") || lowerSentence.includes("contrôle")) {
                action += "\n  👉 Action : Tracez une activité de type tâche (▭) pour la vérification, suivie d'un flux de séquence (➡️).";
            } else if (lowerSentence.includes("consulte") || lowerSentence.includes("accède")) {
                action += "\n  👉 Action : Tracez un objet de données (📄) relié par une association (ligne sans flèche) à l'activité correspondante.";
            } else if (lowerSentence.includes("saisit") || lowerSentence.includes("entre")) {
                action += "\n  👉 Action : Tracez une activité de saisie de données (▭) dans le couloir concerné, reliée par un flux de séquence (➡️).";
            } else if (lowerSentence.includes("envoie") || lowerSentence.includes("communique")) {
                action += "\n  👉 Action : Tracez un flux de message (➖) entre le couloir émetteur et le destinataire.";
            } else if (lowerSentence.includes("attend") || lowerSentence.includes("patiente")) {
                action += "\n  👉 Action : Tracez un événement intermédiaire minuterie (⏲️) pour indiquer une attente.";
            } else if (lowerSentence.includes("reçoit") || lowerSentence.includes("réceptionne")) {
                action += "\n  👉 Action : Tracez un événement intermédiaire de réception (⚪⚪) et reliez-le par un flux de message (➖) à l'expéditeur.";
            } else if (lowerSentence.includes("décide") || lowerSentence.includes("choisit") || lowerSentence.includes("sélectionne")) {
                action += "\n  👉 Action : Tracez une passerelle exclusive (🔷) avec des flux de séquence (➡️) pour chaque option.";
            } else if (lowerSentence.includes("stocke") || lowerSentence.includes("enregistre") || lowerSentence.includes("archive")) {
                action += "\n  👉 Action : Tracez un magasin de données (🗄️) sous l'activité et reliez-le par une association.";
            } else if (lowerSentence.includes("livre") || lowerSentence.includes("fournit")) {
                action += "\n  👉 Action : Tracez une activité de livraison (▭) et un flux de séquence (➡️) vers un événement de fin (⚫).";
            } else if (lowerSentence.includes("termine") || lowerSentence.includes("met fin") || lowerSentence.includes("fin du processus")) {
                action += "\n  👉 Action : Tracez un événement de fin (⚫) relié par un flux de séquence (➡️) à l'activité précédente.";
            } else {
                action += "\n  👉 Action : Tracez une activité (▭) dans le couloir concerné, reliée par un flux de séquence (➡️).";
            }
        }

        instructions.push(action);
    });

    document.getElementById('outputInstructions').innerText = instructions.join('\n\n');
}
