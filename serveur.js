const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
// Sert les fichiers statiques (HTML, CSS, JS client) depuis le dossier 'public'
app.use(express.static(path.join(__dirname, 'public')));

// État initial de l'application
let state = {
    initialList: [],      // Liste de base fournie
    remainingList: [],    // Personnes restantes à piocher
    drawnPeople: [],      // Personnes déjà piochées
    currentSelection: null // Dernière personne piochée
};

// Fonction pour mélanger un tableau (Algorithme de Fisher-Yates)
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Récupérer l'état actuel de l'application
app.get('/api/state', (req, res) => {
    res.json({
        hasList: state.initialList.length > 0,
        remainingCount: state.remainingList.length,
        drawnPeople: state.drawnPeople,
        currentSelection: state.currentSelection,
        isFinished: state.initialList.length > 0 && state.remainingList.length === 0
    });
});

// Initialiser une nouvelle liste de personnes
app.post('/api/init', (req, res) => {
    // SÉCURITÉ : On empêche de charger une nouvelle liste si l'actuelle n'est pas terminée
    if (state.initialList.length > 0 && state.remainingList.length > 0) {
        return res.status(403).json({ error: "Impossible de réinitialiser : la liste actuelle n'est pas terminée !" });
    }

    const { names } = req.body;
    if (!names || !Array.isArray(names) || names.length === 0) {
        return res.status(400).json({ error: "La liste de noms est invalide ou vide." });
    }

    // Nettoyage et mélange de la liste
    const cleanNames = names.map(n => n.trim()).filter(n => n !== "");
    state.initialList = [...cleanNames];
    state.remainingList = shuffle([...cleanNames]);
    state.drawnPeople = [];
    state.currentSelection = null;

    res.json({ success: true, message: "Nouvelle liste initialisée avec succès." });
});

// Piocher la personne suivante
app.post('/api/draw', (req, res) => {
    if (state.initialList.length === 0) {
        return res.status(400).json({ error: "Aucune liste n'a été initialisée." });
    }
    if (state.remainingList.length === 0) {
        return res.status(400).json({ error: "Tous les participants ont déjà été piochés. Vous pouvez réinitialiser." });
    }

    // On retire le premier élément de la liste mélangée
    const selected = state.remainingList.shift();
    state.currentSelection = selected;
    state.drawnPeople.push(selected);

    res.json({
        selected: selected,
        remainingCount: state.remainingList.length,
        isFinished: state.remainingList.length === 0
    });
});

// Forcer la remise à zéro (uniquement si terminée)
app.post('/api/reset', (req, res) => {
    if (state.remainingList.length > 0) {
        return res.status(403).json({ error: "Action interdite : la liste en cours doit être finie." });
    }
    state.initialList = [];
    state.remainingList = [];
    state.drawnPeople = [];
    state.currentSelection = null;
    res.json({ success: true, message: "Application remise à zéro." });
});

app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});