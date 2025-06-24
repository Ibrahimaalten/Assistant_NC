// src/components/D7Form.jsx
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Box, Button, Typography, Grid, Paper, TextField, Snackbar, Alert } from '@mui/material';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import SaveIcon from '@mui/icons-material/Save';
import { useForm8D } from '../contexts/Form8DContext';
import { useParams } from 'react-router-dom';

// Importer les sous-composants 7D
import RootCausePreventSelector from '../components/7D/RootCausePreventSelector';
import PreventiveActionPlanner from '../components/7D/PreventiveActionPlanner';
import MainButton from '../components/MainButton';

// --- Props Attendues ---
// activeTabIndex, totalTabs, onNavigate, tabKeyLabel: Navigation
// identifiedRootCauses: Tableau de strings des causes racines de D5
// onSaveD7: Callback pour sauvegarder les données D7
// ----------------------
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
function D7Form({
  tabKeyLabel,
  identifiedRootCauses: rootCausesFromProps = [],
  onSaveD7
}) {
  const { setCurrentStepKey, currentStepKey } = useForm8D();
  const { id } = useParams();

  // --- DONNÉES D'EXEMPLE POUR TEST ---
  const sampleRootCausesForTesting = [
    "Roulement X usé sur arbre principal",
    "Procédure pas à jour (rév B manquante)",
    "Poste de travail non ergonomique",
    "Joint porte section C défectueux"
  ];
  // Utilise les props si disponibles, sinon l'exemple
  const availableRootCauses = rootCausesFromProps.length > 0 ? rootCausesFromProps : sampleRootCausesForTesting;
  // -----------------------------------

  // État pour les causes racines sélectionnées pour la prévention (tableau de strings)
  const [selectedPreventiveCauses, setSelectedPreventiveCauses] = useState([]);

  // État pour les actions préventives { "Cause Racine": [actionObj1, actionObj2], ... }
  const [preventiveActions, setPreventiveActions] = useState({});

  // (Optionnel) État pour d'autres champs D7 (ex: mise à jour documentation)
  const [documentationUpdates, setDocumentationUpdates] = useState('');
  const [systemicChanges, setSystemicChanges] = useState('');

  // État pour le feedback de sauvegarde
  const [saveFeedback, setSaveFeedback] = useState({ open: false, message: '', severity: 'success' });

  // --- Initialiser/Tester avec une sélection et une action ---
  useEffect(() => {
    if (availableRootCauses.length > 0 && selectedPreventiveCauses.length === 0) {
        const firstCause = availableRootCauses[0];
        setSelectedPreventiveCauses([firstCause]);
        setPreventiveActions({
            [firstCause]: [
                {
                    id: 'prev-act-sample-001',
                    description: 'Exemple: Mettre à jour la spécification matériau XYZ',
                    responsable: 'Ingénierie',
                    dateLancement: '2024-08-01',
                    dateCloturePrevue: '2024-08-15',
                    etat: 'A définir' // <-- AJOUT de l'état à l'exemple
                }
            ]
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Le tableau vide assure l'exécution unique au montage

  // --- Handler pour la sélection/désélection des causes racines ---
  const handleCauseSelectionChange = useCallback((cause, isSelected) => {
    setSelectedPreventiveCauses(prevSelected => {
      if (isSelected) {
        // Ajoute la cause si elle n'y est pas déjà
        return prevSelected.includes(cause) ? prevSelected : [...prevSelected, cause];
      } else {
        // Retire la cause
        return prevSelected.filter(c => c !== cause);
        // Optionnel : Faut-il supprimer les actions préventives associées si on désélectionne ?
        // Pour l'instant, on les garde en mémoire au cas où l'utilisateur reclique.
      }
    });
  }, []);

  // --- Handler pour ajouter une action préventive ---
  const handleAddPreventiveAction = useCallback((rootCause, actionData) => {
      const newAction = {
          ...actionData,
          id: `prev-${Date.now()}-${Math.random().toString(16).slice(2)}` // ID unique
      };
      setPreventiveActions(prevActions => ({
          ...prevActions,
          [rootCause]: [...(prevActions[rootCause] || []), newAction] // Ajoute au tableau existant ou crée le tableau
      }));
  }, []);

  // --- Handler pour supprimer une action préventive ---
  const handleDeletePreventiveAction = useCallback((rootCause, actionId) => {
       setPreventiveActions(prevActions => {
           const currentActions = prevActions[rootCause] || [];
           const updatedActions = currentActions.filter(act => act.id !== actionId);
            // Si le tableau devient vide, on peut choisir de supprimer la clé rootCause de l'objet
           if (updatedActions.length === 0) {
               const { [rootCause]: _, ...rest } = prevActions; // Supprime la clé
               return rest;
           } else {
                return { ...prevActions, [rootCause]: updatedActions }; // Met à jour le tableau
           }
       });
  }, []);

  // --- Handlers pour les champs texte optionnels D7 ---
   const handleOtherInputChange = (event) => {
    const { name, value } = event.target;
    if (name === 'documentationUpdates') setDocumentationUpdates(value);
    if (name === 'systemicChanges') setSystemicChanges(value);
  };

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

  // --- Rendu ---
  return (
    <Box component="div" sx={{ p: 2, maxWidth: 900, margin: '0 auto' }}>
      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
        D7 – Prévention de la Récurrence
      </Typography>
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Actions de prévention à mettre en place
        </Typography>
        <RootCausePreventSelector
          allRootCauses={availableRootCauses} // Utilise les props ou l'exemple
          selectedCauses={selectedPreventiveCauses}
          onSelectionChange={handleCauseSelectionChange}
        />
      </Paper>

      {/* Section 2: Planification des Actions Préventives (une section par cause sélectionnée) */}
      <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium', mb: 1 }}>
            2. Définition des Actions Préventives Systémiques
          </Typography>
          {selectedPreventiveCauses.length === 0 ? (
               <Typography color="textSecondary" sx={{ fontStyle: 'italic' }}>
                  Sélectionnez une ou plusieurs causes racines ci-dessus pour définir les actions préventives associées.
               </Typography>
          ) : (
              selectedPreventiveCauses.map(cause => (
                  <PreventiveActionPlanner
                      key={cause}
                      rootCauseText={cause}
                      actions={preventiveActions[cause] || []}
                      onActionAdd={handleAddPreventiveAction}
                      onActionDelete={handleDeletePreventiveAction}
                  />
              ))
          )}
      </Grid>

       {/* Section 3: (Optionnel) Modifications Systémiques / Documentation */}
       <Grid item xs={12} md={6}>
            <Paper elevation={1} sx={{ p: 2, height: '100%' }}>
               <Typography variant="subtitle2" gutterBottom>Mise à jour Documentation / Procédures</Typography>
               <TextField
                  name="documentationUpdates"
                  label="Ex: Procédures, modes opératoires, FMECA, plans..."
                  multiline rows={4} fullWidth variant="outlined"
                  value={documentationUpdates} onChange={handleOtherInputChange}
               />
            </Paper>
       </Grid>
       <Grid item xs={12} md={6}>
           <Paper elevation={1} sx={{ p: 2, height: '100%' }}>
               <Typography variant="subtitle2" gutterBottom>Autres Changements Systémiques</Typography>
               <TextField
                  name="systemicChanges"
                  label="Ex: Standards, formations, systèmes d'information..."
                  multiline rows={4} fullWidth variant="outlined"
                   value={systemicChanges} onChange={handleOtherInputChange}
              />
           </Paper>
       </Grid>

      {/* --- Zone des Boutons --- */}
      <Grid item xs={12}>
         <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 4 }}>
            <MainButton color="primary" onClick={handlePrevious} disabled={currentIndex === 0} startIcon={<NavigateBeforeIcon />} sx={{ minWidth: 120 }}>
              Précédent
            </MainButton>
            <Box>
              <MainButton color="primary" onClick={handleSave} startIcon={<SaveIcon />} sx={{ mr: 1, minWidth: 150 }}>
                Sauvegarder {tabKeyLabel || 'D7'}
              </MainButton>
              <MainButton color="primary" onClick={handleNext} disabled={currentIndex === stepsOrder.length - 1} endIcon={<NavigateNextIcon />} sx={{ minWidth: 120 }}>
                Suivant
              </MainButton>
            </Box>
         </Box>
      </Grid>

      {/* Zone de feedback utilisateur */}
      <Snackbar open={saveFeedback.open || !!apiStatus} autoHideDuration={3000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={handleCloseSnackbar} severity={apiStatus === 'success' ? 'success' : apiStatus === 'error' ? 'error' : saveFeedback.severity} sx={{ width: '100%' }}>
          {apiStatus === 'success' ? 'Sauvegarde réussie !' : apiStatus === 'error' ? 'Erreur lors de la sauvegarde. Veuillez réessayer.' : saveFeedback.message}
        </Alert>
      </Snackbar>

      {/* Préparation pour ChatAssistant (décommenter pour intégrer) */}
      {/* <Box sx={{ mt: 4 }}><ChatAssistant /></Box> */}
    </Box>
  );
}

export default D7Form;