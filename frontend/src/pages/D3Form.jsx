// src/pages/D3Form.jsx (ou le nom que vous utilisez)
import React, { useState } from 'react'; // Garder useState pour localErrors
import { Box, Button, Typography, Grid, FormHelperText, Paper, Snackbar, Alert } from '@mui/material';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import SaveIcon from '@mui/icons-material/Save';
import { useParams } from 'react-router-dom';

// Importer le composant pour gérer les actions
import GestionActions3D from '../components/3D/GestionActionsCorrectives'; // Assurez-vous que le chemin est correct
import MainButton from '../components/MainButton';

// Importer le hook du contexte
import { useForm8D } from '../contexts/Form8DContext'; // Assurez-vous que le chemin est correct

function D3Form({ tabKeyLabel = "D3" }) { // tabKeyLabel est passé par App.jsx
  const {
    form8DData,
    updateFormField,
    setCurrentStepKey,
    currentStepKey,
  } = useForm8D();
  const { id } = useParams();

  // Clé spécifique pour cette section dans le contexte
  const SECTION_KEY = 'd3_containment'; // IMPORTANT: Doit correspondre à Form8DContext et stepsOrder

  // sectionData est l'objet pour SECTION_KEY dans le contexte
  // Prévoir une structure par défaut robuste
  const sectionData = form8DData[SECTION_KEY] || {
    actions3D: [],
    // dateVerificationEfficacite: '', // Exemple d'autre champ pour D3
  };

  // actionsListValue est le tableau spécifique pour le composant GestionActions3D
  const actionsListValue = sectionData.actions3D || [];

  // État local pour les erreurs de validation de cette page
  const [localErrors, setLocalErrors] = useState({});

  // État pour le feedback de sauvegarde
  const [saveFeedback, setSaveFeedback] = useState({ open: false, message: '', severity: 'success' });

  // --- Gestionnaire de Sauvegarde vers l'API ---
  const [apiStatus, setApiStatus] = useState(null); // Pour feedback utilisateur

  // Gestionnaire pour GestionActions3D
  // newActionsArray est le tableau complet des actions renvoyé par GestionActions3D
  const handleActionsChange = (newActionsArray) => {
    updateFormField(SECTION_KEY, 'actions3D', newActionsArray);
    if (localErrors.actions3D) { // Effacer l'erreur si elle existait
      setLocalErrors(prev => ({ ...prev, actions3D: undefined }));
    }
  };

  const validatePage = () => {
    let tempErrors = {};
    if (!actionsListValue || actionsListValue.length === 0) {
      tempErrors.actions3D = "Au moins une action immédiate de confinement doit être ajoutée.";
    } else {
      // Optionnel: Valider chaque action dans la liste si nécessaire
      // Par exemple, s'assurer que chaque action a une description
      const incompleteAction = actionsListValue.find(action => !action.description?.trim()); // Supposant que chaque action a un champ 'description'
      if (incompleteAction) {
        tempErrors.actions3D = "Toutes les actions ajoutées doivent avoir une description.";
      }
    }
    // if (!sectionData.dateVerificationEfficacite) { // Exemple de validation pour un autre champ D3
    //   tempErrors.dateVerificationEfficacite = "La date de vérification de l'efficacité est requise.";
    // }
    setLocalErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmitToAPI = async () => {
    if (!validatePage()) return;
    setApiStatus(null);
    try {
      const method = id ? 'PUT' : 'POST';
      const url = id ? `/api/nonconformites/${id}` : '/api/nonconformites';
      const response = await fetch(url, {
        method,
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

  return (
    <Box component="div" sx={{ p: 2, maxWidth: 900, margin: '0 auto' }}>
      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
        D3 – Définition et Application des Actions de Contention
      </Typography>
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Actions de Contention à mettre en place immédiatement
        </Typography>
        <GestionActions3D
          actions={actionsListValue}         // Passer le tableau d'actions du contexte
          onActionsChange={handleActionsChange} // Passer le gestionnaire pour mettre à jour ce tableau
          error={!!localErrors.actions3D}     // Passer l'état d'erreur pour ce groupe/composant
          helperText={localErrors.actions3D || ''} // Passer le message d'erreur
        />
      </Paper>
      {/* Zone de feedback utilisateur */}
      <Snackbar open={saveFeedback.open || !!apiStatus} autoHideDuration={3000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={handleCloseSnackbar} severity={apiStatus === 'success' ? 'success' : apiStatus === 'error' ? 'error' : saveFeedback.severity} sx={{ width: '100%' }}>
          {apiStatus === 'success' ? 'Sauvegarde réussie !' : apiStatus === 'error' ? 'Erreur lors de la sauvegarde. Veuillez réessayer.' : saveFeedback.message}
        </Alert>
      </Snackbar>
      {/* Barre de navigation et sauvegarde */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 4 }}>
        <MainButton color="primary" onClick={handlePrevious} disabled={currentIndex === 0} startIcon={<NavigateBeforeIcon />} sx={{ minWidth: 120 }}>
          Précédent
        </MainButton>
        <Box>
          <MainButton color="primary" onClick={handleSave} startIcon={<SaveIcon />} sx={{ mr: 1, minWidth: 150 }}>
            Sauvegarder {tabKeyLabel || 'D3'}
          </MainButton>
          <MainButton color="primary" onClick={handleNext} disabled={currentIndex === stepsOrder.length - 1} endIcon={<NavigateNextIcon />} sx={{ minWidth: 120 }}>
            Suivant
          </MainButton>
        </Box>
      </Box>
      {/* Préparation pour ChatAssistant (décommenter pour intégrer) */}
      {/* <Box sx={{ mt: 4 }}><ChatAssistant /></Box> */}
    </Box>
  );
}

export default D3Form;