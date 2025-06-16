// src/components/D5Form.jsx
import React, { useState, useMemo, useCallback } from 'react';
import { Box, Button, Typography, Grid, Paper, Snackbar, Alert } from '@mui/material';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import SaveIcon from '@mui/icons-material/Save';

// Importer les sous-composants D5 (vérifier les chemins)
import RootCauseSelector from '../components/5D/RootCauseSelector';
import ActionPlanner from '../components/5D/ActionPlanner';
import { useForm8D } from '../contexts/Form8DContext';

// --- Définition des Props Attendues ---
// activeTabIndex, totalTabs, onNavigate: Pour la navigation entre étapes
// tabKeyLabel: Libellé pour les boutons (ex: "D5")
// fiveWhysData: Données de l'étape D4 contenant les analyses 5P et les causes racines identifiées
// onSaveD5: Fonction callback pour sauvegarder les données spécifiques à D5
// ---------------------------------------
const stepsOrder = [
      'd0_initialisation',
      'd1_team',
      'd2_problem',
      'd3_containment',
      'd4_rootcause',
      'd5_correctiveactions',
      'd6_implementvalidate',
      'd7_preventrecurrence',
      'd8_congratulate'
    ];
function D5Form({
  tabKeyLabel,
  onSaveD5 // Callback pour sauvegarder spécifiquement D5
}) {
  const { form8DData, updateSectionData, setCurrentStepKey, currentStepKey } = useForm8D();
  const SECTION_KEY = 'd5_correctiveactions';

  // Lire les causes racines depuis le contexte D4
  const d4Section = form8DData['d4_rootcause'] || {};
  const identifiedRootCauses = React.useMemo(() => {
    return Object.values(d4Section.fiveWhysData || {})
      .map(entry => entry?.rootCause?.trim())
      .filter(Boolean);
  }, [d4Section]);

  // --- État pour les actions correctives, structuré par cause racine ---
  // Clé: Texte de la cause racine, Valeur: Array d'objets action
  const [correctiveActionsData, setCorrectiveActionsData] = useState(form8DData[SECTION_KEY]?.correctiveActionsData || {});

  // --- État pour la cause racine actuellement sélectionnée dans le sélecteur ---
  const [selectedRootCause, setSelectedRootCause] = useState('');

  // État pour le feedback de sauvegarde
  const [saveFeedback, setSaveFeedback] = useState({ open: false, message: '', severity: 'success' });

  // --- Effet pour synchroniser les actions correctives dans le contexte ---
  React.useEffect(() => {
    updateSectionData(SECTION_KEY, { correctiveActionsData });
  }, [correctiveActionsData]);

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
    // TODO: Ajoutez ici la logique de validation si besoin
    setSaveFeedback({ open: true, message: `Données ${tabKeyLabel} sauvegardées !`, severity: 'success' });
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

  const handleCloseSnackbar = () => setSaveFeedback(prev => ({ ...prev, open: false }));

  // --- Navigation ---
 
  const currentIndex = stepsOrder.indexOf(currentStepKey);

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentStepKey(stepsOrder[currentIndex - 1]);
      window.scrollTo(0, 0);
    }
  };
  const handleNext = () => {
    if (currentIndex < stepsOrder.length - 1) {
      setCurrentStepKey(stepsOrder[currentIndex + 1]);
      window.scrollTo(0, 0);
    }
  };

  // --- Rendu du Composant ---
  return (
    <Box component="div" sx={{ p: 2, maxWidth: 900, margin: '0 auto' }}>
      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
        D5 – Définition des Actions Correctives
      </Typography>
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Actions correctives à définir et planifier
        </Typography>
        {/* Gestion des Actions 5D (remplacement de GestionActions5D) */}
        <RootCauseSelector
          rootCauses={identifiedRootCauses}
          selectedRootCause={selectedRootCause || ''}
          onSelectRootCause={handleSelectRootCause}
        />
        <ActionPlanner
          rootCause={selectedRootCause || ''}
          actions={correctiveActionsData[selectedRootCause] || []}
          onActionsChange={handleActionsChange}
        />
      </Paper>
      {/* Zone de feedback utilisateur */}
      <Snackbar open={saveFeedback.open} autoHideDuration={3000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={handleCloseSnackbar} severity={saveFeedback.severity} sx={{ width: '100%' }}>
          {saveFeedback.message}
        </Alert>
      </Snackbar>
      {/* Barre de navigation et sauvegarde */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3 }}>
        <Button variant="outlined" startIcon={<NavigateBeforeIcon />} onClick={handlePrevious} disabled={currentIndex === 0}>
          Précédent
        </Button>
        <Box>
          <Button variant="contained" color="primary" startIcon={<SaveIcon />} onClick={handleSave} sx={{ mr: 1 }}>
            Sauvegarder {tabKeyLabel}
          </Button>
          <Button variant="contained" endIcon={<NavigateNextIcon />} onClick={handleNext} disabled={currentIndex === stepsOrder.length - 1}>
            Suivant
          </Button>
        </Box>
      </Box>
      {/* Préparation pour ChatAssistant (décommenter pour intégrer) */}
      {/* <Box sx={{ mt: 4 }}><ChatAssistant /></Box> */}
    </Box>
  );
}

export default D5Form;