function generateInstructions() {
    const scenarioText = document.getElementById('inputScenario').value.trim();
    if (!scenarioText) {
        document.getElementById('outputInstructions').innerText = 'Veuillez entrer une mise en situation.';
        return;
    }

    let instructions = [];
    instructions.push("Analyser la mise en situation pour identifier les éléments suivants :");

    // Étape 1 : Frontières du processus
    instructions.push("- Définir les piscines (organisations) et les couloirs (rôles ou départements). (Symbole: 🟦 et 🟩)");

    // Étape 2 : Acteurs, objets et systèmes
    instructions.push("- Identifier les acteurs, les objets manipulés et les systèmes utilisés.");

    // Étape 3 : Activités
    instructions.push("- Décrire les activités réalisées dans chaque couloir. (Symbole: ▭)");

    // Étape 4 : Événements
    instructions.push("- Positionner les événements de début, intermédiaires et de fin. (Symboles: ⚪ et ⚫)");

    // Étape 5 : Flux
    instructions.push("- Tracer les flux de séquence (➡️) et les flux de message (➖).");

    // Étape 6 : Passerelles
    instructions.push("- Ajouter les passerelles de décision (Symbole: 🔷).");

    // Étape 7 : Objets et magasins de données
    instructions.push("- Ajouter les objets de données (Symbole: 📄) et les magasins de données (Symbole: 🗄️).");

    // Étape 8 : Cas multiples et exceptions
    instructions.push("- Décrire les issues possibles : réussite, échec, exception.");

    // Étape 9 : Points inter-organisationnels
    instructions.push("- Identifier les échanges entre organisations (flux de message).");

    // Étape 10 : Validation
    instructions.push("- Vérifier la complétude, la logique et la lisibilité du modèle.");

    // Générer l'affichage
    document.getElementById('outputInstructions').innerText = instructions.join('\n');
}
