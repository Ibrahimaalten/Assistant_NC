// src/components/D6Form.jsx
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Box, Button, Typography, Grid, Paper, TextField, Snackbar, Alert } from '@mui/material';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import SaveIcon from '@mui/icons-material/Save';
import { useForm8D } from '../contexts/Form8DContext';
import { useParams } from 'react-router-dom';
import { COLORS } from '../colors';
import MainButton from '../components/MainButton';

// Importer le composant pour la liste des actions
import ActionImplementationList from '../components/6D/ActionImplementationList';
// Placez la déclaration du tableau stepsOrder AVANT toute utilisation
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
function D6Form({
  tabKeyLabel,
  onSaveD6
}) {
  const { setCurrentStepKey, currentStepKey, form8DData } = useForm8D();
  const currentIndex = stepsOrder.indexOf(currentStepKey);
  const { id } = useParams();

  // --- Utilise les vraies actions D5 du contexte ---
  const d5ActionsData = form8DData?.d5_correctiveactions?.correctiveActionsData || {};
  const hasRealD5Data = d5ActionsData && Object.keys(d5ActionsData).length > 0;
  const initialDataForState = hasRealD5Data ? d5ActionsData : {};

  // --- État pour les actions initialisé UNE SEULE FOIS avec les données D5 ---
  const [implementedActions, setImplementedActions] = useState(() => initializeD6State(initialDataForState));

  // --- États pour les champs spécifiques à D6 (inchangés) ---
  const [validationResults, setValidationResults] = useState('');
  const [surveillancePlan, setSurveillancePlan] = useState('');
  const [errors, setErrors] = useState({});
  const [saveFeedback, setSaveFeedback] = useState({ open: false, message: '', severity: 'success' });

  // --- SUPPRIMER ou COMMENTER le useEffect qui causait la boucle ---
  // useEffect(() => {
  //   // Ce code est maintenant dans initializeD6State et exécuté une seule fois par useState
  //   const initialD6State = {};
  //   // ... logique de création de initialD6State ...
  //   setImplementedActions(initialD6State);
  // }, [d5ActionsData]);
  // -------------------------------------------------------------

  // --- Handlers (inchangés) ---
  const handleActionUpdate = useCallback((rootCause, actionId, updatedFields) => {
    setImplementedActions(prevData => {
        const updatedRootCauseActions = (prevData[rootCause] || []).map(action => {
            if (action.id === actionId) {
                return { ...action, ...updatedFields };
            }
            return action;
        });
        return { ...prevData, [rootCause]: updatedRootCauseActions };
    });
  }, []);

  const handleInputChange = (event) => {
      const { name, value } = event.target;
      if (name === 'validationResults') setValidationResults(value);
      if (name === 'surveillancePlan') setSurveillancePlan(value);
      if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const validateForm = () => { /* ... (inchangé) ... */
      let tempErrors = {};
      if (!validationResults.trim()) tempErrors.validationResults = "Les résultats de la validation sont requis.";
      setErrors(tempErrors);
      return Object.keys(tempErrors).length === 0;
  };

  // --- Ajout du handler pour fermer le Snackbar (manquant) ---
  const handleCloseSnackbar = () => setSaveFeedback(prev => ({ ...prev, open: false }));

  // --- Gestionnaire de Sauvegarde vers l'API ---
  const [apiStatus, setApiStatus] = useState(null); // Pour feedback utilisateur

  const handleSubmitToAPI = async () => {
    // Ajoutez ici la validation si besoin
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

  // --- Navigation ---
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

  // --- Rendu (inchangé) ---
  return (
    <Box component="div" sx={{ p: 2, maxWidth: 900, margin: '0 auto', background: COLORS.background, borderRadius: 4, boxShadow: '0 4px 24px 0 rgba(35,57,93,0.10)', border: `1.5px solid ${COLORS.primaryDark}20` }}>
      <Typography variant="h6" gutterBottom sx={{ mb: 2, color: COLORS.white, fontWeight: 700, letterSpacing: 1, background: COLORS.primaryDark, padding: '1rem 2rem', borderRadius: 2, boxShadow: '0 2px 8px rgba(35,57,93,0.08)', textAlign: 'center' }}>
        D6 – Vérification de l’Efficacité des Actions Correctives
      </Typography>
      <Paper elevation={2} sx={{ p: 2, mb: 3, background: COLORS.white, borderRadius: 3, boxShadow: '0 2px 8px #e3eafc' }}>
        <Typography variant="subtitle1" sx={{ mb: 1, color: COLORS.primaryDark, fontWeight: 600 }}>
          Vérification de l’efficacité des actions correctives
        </Typography>
        <ActionImplementationList actionsByRootCause={implementedActions} onActionUpdate={handleActionUpdate} />
      </Paper>
      {/* Zone de feedback utilisateur */}
      <Snackbar open={saveFeedback.open || !!apiStatus} autoHideDuration={3000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={handleCloseSnackbar} severity={apiStatus === 'success' ? 'success' : apiStatus === 'error' ? 'error' : saveFeedback.severity} sx={{ width: '100%' }}>
          {apiStatus === 'success' ? 'Sauvegarde réussie !' : apiStatus === 'error' ? 'Erreur lors de la sauvegarde. Veuillez réessayer.' : saveFeedback.message}
        </Alert>
      </Snackbar>
      {/* Barre de navigation et sauvegarde */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3 }}>
        <MainButton color="primary" onClick={handlePrevious} disabled={currentIndex === 0} startIcon={<NavigateBeforeIcon />} sx={{ minWidth: 120 }}>
          Précédent
        </MainButton>
        <Box>
          <MainButton color="primary" onClick={handleSave} startIcon={<SaveIcon />} sx={{ mr: 1, minWidth: 150 }}>
            Sauvegarder {tabKeyLabel}
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

// Initialise l'état D6 à partir des actions D5
function initializeD6State(initialD5Data) {
  const state = {};
  if (initialD5Data && typeof initialD5Data === 'object') {
    Object.entries(initialD5Data).forEach(([rootCause, actions]) => {
      if (Array.isArray(actions)) {
        state[rootCause] = actions.map(action => ({
          ...action,
          dateImplementationReelle: action.dateImplementationReelle || '',
          dateClotureReelle: action.dateClotureReelle || '',
          etatImplementation: action.etatImplementation || action.etat || 'A définir',
          preuvesLien: action.preuvesLien || '',
        }));
      } else {
        state[rootCause] = [];
      }
    });
  }
  return state;
}

export default D6Form;