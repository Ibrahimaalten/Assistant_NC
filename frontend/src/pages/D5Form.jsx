// src/components/D5Form.jsx
import React, { useState, useMemo, useCallback } from 'react';
import { Box, Button, Typography, Grid, Paper } from '@mui/material';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import SaveIcon from '@mui/icons-material/Save';

// Importer les sous-composants D5 (vérifier les chemins)
import RootCauseSelector from '../components/5D/RootCauseSelector';
import ActionPlanner from '../components/5D/ActionPlanner';

// --- Définition des Props Attendues ---
// activeTabIndex, totalTabs, onNavigate: Pour la navigation entre étapes
// tabKeyLabel: Libellé pour les boutons (ex: "D5")
// fiveWhysData: Données de l'étape D4 contenant les analyses 5P et les causes racines identifiées
// onSaveD5: Fonction callback pour sauvegarder les données spécifiques à D5
// ---------------------------------------

function D5Form({
  activeTabIndex,
  totalTabs,
  onNavigate,
  tabKeyLabel,
  fiveWhysData = {}, // Fournir un objet vide par défaut
  onSaveD5 // Callback pour sauvegarder spécifiquement D5
}) {
// --- DONNÉES D'EXEMPLE POUR TEST (sera ignoré si fiveWhysData est fourni) ---
const sampleFiveWhysData = {
  "Machine: Vibration excessive": {
    whys: ["Cause 1", "Cause 2", "Cause 3"],
    rootCause: "Roulement X usé sur arbre principal" // Cause racine identifiée
  },
  "Méthode: Procédure de démarrage incorrecte": {
    whys: ["Manque étape A", "Formation incomplète"],
    rootCause: "Procédure pas à jour (rév B manquante)" // Cause racine identifiée
  },
  "Matière: Lot non conforme ABC": {
    whys: ["Fournisseur Y", "Contrôle réception Z"],
    rootCause: "" // Cause racine NON identifiée pour cet exemple
  },
   "Main d'oeuvre: Erreur manipulation": {
      whys: ["Distraction", "Fatigue", "Manque outil adapté"],
      rootCause: "Poste de travail non ergonomique" // Cause racine identifiée
   },
   "Milieu: Humidité excessive": {
       whys: ["Fuite toit", "Pas de déshumidificateur"],
       rootCause: "Joint porte section C défectueux" // Cause racine identifiée
   }
};
  // --- État pour les actions correctives, structuré par cause racine ---
  // Clé: Texte de la cause racine, Valeur: Array d'objets action
  const [correctiveActionsData, setCorrectiveActionsData] = useState({});

  // --- État pour la cause racine actuellement sélectionnée dans le sélecteur ---
  const [selectedRootCause, setSelectedRootCause] = useState('');

  // --- Dériver les causes racines identifiées depuis les données D4 (fiveWhysData) ---
  const identifiedRootCauses = useMemo(() => {
    // Vérifie si des données valides sont passées en props
    const hasRealData = fiveWhysData && Object.keys(fiveWhysData).length > 0;
    // Choisit la source de données
    const dataToProcess = hasRealData ? fiveWhysData : sampleFiveWhysData;

    console.log("Processing root causes from:", hasRealData ? "Props Data" : "Sample Data"); // Pour débugger

    // Extrait les causes racines non vides de la source choisie
    return Object.values(dataToProcess)
      .map(entry => entry?.rootCause?.trim())
      .filter(Boolean); // Garde seulement les chaînes non vides
  }, [fiveWhysData])

  // --- Effet pour sélectionner la première cause racine par défaut ---
  // Gère aussi le cas où la liste des causes change ou si la sélection devient invalide
  React.useEffect(() => {
      const firstValidCause = identifiedRootCauses.length > 0 ? identifiedRootCauses[0] : '';
      if (!selectedRootCause || (identifiedRootCauses.length > 0 && !identifiedRootCauses.includes(selectedRootCause))) {
          setSelectedRootCause(firstValidCause);
      } else if (identifiedRootCauses.length === 0) { // S'il n'y a plus de causes
          setSelectedRootCause('');
      }
  }, [identifiedRootCauses, selectedRootCause]);

  // --- Handler pour la sélection d'une cause racine via RootCauseSelector ---
  const handleSelectRootCause = useCallback((cause) => {
    setSelectedRootCause(cause);
  }, []);

  // --- Handler pour mettre à jour les actions pour une cause racine donnée (appelé par ActionPlanner) ---
  const handleActionsChange = useCallback((rootCause, updatedActions) => {
    setCorrectiveActionsData(prevData => ({
      ...prevData,
      [rootCause]: updatedActions // Met à jour le tableau d'actions pour cette clé
    }));
  }, []);

  // --- Sauvegarde spécifique à D5 ---
  const handleSave = () => {
    // Validation (Exemple simple : vérifier si au moins une action a été définie)
    const hasAnyAction = Object.values(correctiveActionsData).some(actions => actions && actions.length > 0);
    if (!hasAnyAction && identifiedRootCauses.length > 0) {
        alert("Veuillez définir au moins une action corrective pour l'une des causes racines.");
        // On pourrait choisir de sauvegarder quand même ou d'arrêter ici
        // return;
    }

    const saveData = {
      permanentCorrectiveActions: correctiveActionsData,
      // Ajouter ici d'autres données spécifiques à D5 si nécessaire
    };

    console.log('Données D5 à sauvegarder:', saveData);

    // Appeler la fonction de sauvegarde passée en prop
    if (onSaveD5) {
        onSaveD5(saveData); // Transmet les données D5 au parent pour sauvegarde globale
        alert(`Données ${tabKeyLabel} (simulées) sauvegardées !`);
    } else {
        console.error(`Callback onSaveD5 non fourni à D5Form.`);
        alert(`Erreur: La fonction de sauvegarde pour ${tabKeyLabel} n'est pas configurée.`);
    }
  };

  // --- Navigation ---
  const handlePrevious = () => onNavigate(activeTabIndex - 1);
  const handleNext = () => {
      // Optionnel : Ajouter une validation avant de passer à l'étape suivante
      // if (!validationOk) { alert("..."); return; }
      onNavigate(activeTabIndex + 1);
  };

  // --- Rendu du Composant ---
  return (
    <Box component="div" sx={{ p: 2 }}> {/* Utiliser div, pas form ici */}
      <Typography variant="h6" gutterBottom>
        D5 - Choix et Vérification des Actions Correctives Permanentes (PCA)
      </Typography>
      <Grid container spacing={3}>

        {/* Section 1: Sélection de la Cause Racine */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
              1. Sélectionner la Cause Racine à traiter
            </Typography>
            {identifiedRootCauses.length > 0 ? (
                <RootCauseSelector
                  rootCauses={identifiedRootCauses}
                  selectedCause={selectedRootCause}
                  onSelectCause={handleSelectRootCause}
                />
            ) : (
                <Typography color="textSecondary" sx={{ mt: 1, fontStyle: 'italic' }}>
                    Aucune cause racine finale n'a été identifiée à l'étape précédente (D4 - 5P).
                </Typography>
            )}
          </Paper>
        </Grid>

        {/* Section 2: Planification des Actions pour la cause sélectionnée */}
        <Grid item xs={12}>
           {/* Affiche le planificateur seulement si une cause est sélectionnée */}
           {selectedRootCause ? (
            <Paper elevation={2} sx={{ p: 2, mt: 1 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
                2. Définir les Actions Correctives pour: "{selectedRootCause}"
              </Typography>
              <ActionPlanner
                rootCause={selectedRootCause}
                actions={correctiveActionsData[selectedRootCause] || []} // Fournit les actions existantes ou un tableau vide
                onActionsChange={handleActionsChange} // Callback pour mettre à jour D5Form
              />
            </Paper>
            ) : (
               // Affiche un message si des causes existent mais aucune n'est sélectionnée
               identifiedRootCauses.length > 0 && (
                <Paper elevation={1} sx={{ p: 2, backgroundColor: '#f5f5f5', mt: 1 }}>
                    <Typography color="textSecondary" sx={{ fontStyle: 'italic' }}>
                        Veuillez sélectionner une cause racine ci-dessus pour définir ou voir ses actions correctives.
                    </Typography>
                </Paper>
               )
            )}
        </Grid>

        {/* Zone des Boutons de Navigation/Sauvegarde */}
        <Grid item xs={12}>
           <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3 }}>
              {/* Bouton Précédent */}
              <Button
                variant="outlined"
                startIcon={<NavigateBeforeIcon />}
                onClick={handlePrevious}
                disabled={activeTabIndex === 0}
              >
                Précédent
              </Button>
              {/* Boutons Sauvegarder et Suivant */}
               <Box>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<SaveIcon />}
                    onClick={handleSave} // Appelle la sauvegarde D5
                    sx={{ mr: 1 }}
                  >
                    Sauvegarder {tabKeyLabel}
                  </Button>
                  <Button
                    variant="contained"
                    endIcon={<NavigateNextIcon />}
                    onClick={handleNext}
                    disabled={activeTabIndex === totalTabs - 1}
                  >
                     Suivant
                  </Button>
              </Box>
           </Box>
        </Grid>

      </Grid>
    </Box>
  );
}

export default D5Form;