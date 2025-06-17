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

  // --- Gestionnaire de Sauvegarde vers l'API ---
  const [apiStatus, setApiStatus] = useState(null); // Pour feedback utilisateur

  const handleSubmitToAPI = async () => {
    // Ajoutez ici la validation si besoin
    setApiStatus(null);
    try {
      const response = await fetch('/api/nonconformites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form8DData),
      });
      if (response.ok) {
        setApiStatus('success');
      } else {
        setApiStatus('error');
      }
    } catch (error) {
      setApiStatus('error');
    }
  };

  const handleSave = () => {
    handleSubmitToAPI();
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
      <Snackbar open={saveFeedback.open || !!apiStatus} autoHideDuration={3000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={handleCloseSnackbar} severity={apiStatus === 'success' ? 'success' : apiStatus === 'error' ? 'error' : saveFeedback.severity} sx={{ width: '100%' }}>
          {apiStatus === 'success' ? 'Sauvegarde réussie !' : apiStatus === 'error' ? 'Erreur lors de la sauvegarde. Veuillez réessayer.' : saveFeedback.message}
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