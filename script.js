function generateInstructions() {
    const scenarioText = document.getElementById('inputScenario').value.trim();
    if (!scenarioText) {
        document.getElementById('outputInstructions').innerText = 'Veuillez entrer une mise en situation.';
        return;
    }

    let instructions = [];
    instructions.push("Voici les étapes détaillées pour tracer votre modèle BPMN à partir de votre mise en situation :\n");

    instructions.push("1. **Définir les frontières du processus**\n   - Identifiez qui déclenche le processus (événement de début ⚪).\n   - Déterminez ce qui marque la fin du processus (événement de fin ⚫).\n   - Délimitez les acteurs :\n     - Piscine (🟦) pour chaque organisation impliquée.\n     - Couloir (🟩) pour chaque département ou rôle interne.");

    instructions.push("2. **Lister les acteurs, objets et systèmes**\n   - Notez les acteurs qui réalisent les actions.\n   - Listez les objets échangés (📄) comme formulaires, commandes, avis.\n   - Décrivez les systèmes utilisés (PGI, Système comptable, Site Web, etc.).");

    instructions.push("3. **Détailler les activités**\n   - Décrivez chaque action réalisée dans les couloirs (▭), comme \"Vérifier le client\" ou \"Saisir la commande\".");

    instructions.push("4. **Positionner les événements**\n   - Début (⚪) : Exemple \"Réception d’un appel du client\".\n   - Intermédiaire (⚪⚪) : Exemple \"Validation du crédit\".\n   - Fin (⚫) : Exemple \"Commande livrée\" ou \"Commande annulée\".");

    instructions.push("5. **Tracer les flux**\n   - Flèches pleines (➡️) pour les séquences d’activités.\n   - Flèches en pointillés (➖) pour les échanges de messages entre piscines.");

    instructions.push("6. **Ajouter les passerelles de décision**\n   - Représentez les décisions Oui/Non avec une passerelle (🔷), par exemple : \"Crédit valide ?\".");

    instructions.push("7. **Inclure les objets et magasins de données**\n   - 📄 Objets de données : Formulaires, rapports, etc.\n   - 🗄️ Magasins de données : Bases de données, listes officielles, etc.");

    instructions.push("8. **Traiter les cas multiples**\n   - Décrivez les différentes issues possibles du processus : réussite, échec, attente, exception.");

    instructions.push("9. **Identifier les points inter-organisationnels**\n   - Tracez les flux de messages entre les piscines pour montrer les échanges entre organisations.");

    instructions.push("10. **Valider votre modèle**\n   - Vérifiez que toutes les étapes, acteurs, décisions et flux sont représentés de façon claire et complète.\n");

    // Analyse spécifique du texte fourni par l'utilisateur
    instructions.push("\n---\nAnalyse spécifique de votre mise en situation :\n");
    const sentences = scenarioText.split(/\n|\.|!|\?/).filter(s => s.trim().length > 0);

    sentences.forEach((sentence, index) => {
        let action = `- Étape ${index + 1} : ${sentence.trim()}`;

        if (index === 0) {
            action += "\n  👉 Action : Tracez un événement de début (⚪) à la frontière de la piscine représentant l'acteur qui déclenche cette action.";
        } else if (sentence.toLowerCase().includes("vérifie") || sentence.toLowerCase().includes("contrôle")) {
            action += "\n  👉 Action : Tracez une activité (▭) dans le couloir approprié représentant cette vérification.";
        } else if (sentence.toLowerCase().includes("confirme") || sentence.toLowerCase().includes("approuve")) {
            action += "\n  👉 Action : Tracez une activité (▭) dans le couloir approprié représentant cette confirmation.";
        } else if (sentence.toLowerCase().includes("envoie") || sentence.toLowerCase().includes("communique")) {
            action += "\n  👉 Action : Tracez un flux de message (➖) entre les piscines concernées.";
        } else if (sentence.toLowerCase().includes("commande terminée") || sentence.toLowerCase().includes("processus se termine")) {
            action += "\n  👉 Action : Tracez un événement de fin (⚫) dans le couloir approprié.";
        } else {
            action += "\n  👉 Action : Tracez une activité (▭) dans le couloir approprié pour cette action.";
        }

        instructions.push(action);
    });

    document.getElementById('outputInstructions').innerText = instructions.join('\n\n');
}
