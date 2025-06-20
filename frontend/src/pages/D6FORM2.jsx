// src/components/D6Form.jsx
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Box, Button, Typography, Grid, Paper, TextField, Snackbar, Alert } from '@mui/material';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import SaveIcon from '@mui/icons-material/Save';
import { useForm8D } from '../contexts/Form8DContext';
 
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
  d5ActionsData = {},
  onSaveD6
}) {
  const { setCurrentStepKey, currentStepKey } = useForm8D();
  const currentIndex = stepsOrder.indexOf(currentStepKey);
 
  // --- DONNÉES D'EXEMPLE POUR LES ACTIONS D5 (utilisées si d5ActionsData est vide) ---
  const sampleD5ActionsData = {
    "Roulement X usé sur arbre principal": [ // Doit correspondre à une cause racine d'exemple de D5
        { id: 'd5act-001', description: "Remplacer le roulement référence ABC-123", responsable: "Jean Dupont (Méca)", dateLancement: "2024-07-15", dateCloturePrevue: "2024-07-19", etat: "Terminée" },
        { id: 'd5act-002', description: "Vérifier l'alignement de l'arbre après remplacement", responsable: "Jean Dupont (Méca)", dateLancement: "2024-07-19", dateCloturePrevue: "2024-07-19", etat: "Terminée" },
        { id: 'd5act-003', description: "Mettre à jour plan de maintenance préventive (graissage)", responsable: "Service Méthodes", dateLancement: "2024-07-16", dateCloturePrevue: "2024-07-30", etat: "En cours" }
    ],
    "Procédure pas à jour (rév B manquante)": [ // Autre cause racine d'exemple
        { id: 'd5act-004', description: "Rédiger la procédure rév B incluant étape pré-chauffe", responsable: "Alice Martin (Qualité)", dateLancement: "2024-07-20", dateCloturePrevue: "2024-08-05", etat: "A définir" },
        { id: 'd5act-005', description: "Former les opérateurs à la nouvelle procédure rév B", responsable: "Chef d'équipe Prod", dateLancement: "2024-08-06", dateCloturePrevue: "2024-08-15", etat: "A définir" }
    ],
    "Poste de travail non ergonomique": [ // Autre cause racine d'exemple
        { id: 'd5act-006', description: "Réaliser audit ergonomique flash", responsable: "Ergonome Conseil", dateLancement: "2024-07-25", dateCloturePrevue: "2024-07-28", etat: "En cours" }
    ]
    // "Joint porte section C défectueux": [] // Cause racine sans actions définies
};
  // --- Fonction d'initialisation pour l'état ---
  // Sera exécutée une seule fois par React lors du montage initial
  const initializeD6State = (initialD5Data) => {
    console.log("Initializing D6 state from D5 data..."); // Pour débugger
    const state = {};
    // Vérifie si initialD5Data est bien un objet avant d'itérer
    if (initialD5Data && typeof initialD5Data === 'object') {
      Object.entries(initialD5Data).forEach(([rootCause, actions]) => {
        // Vérifie si actions est bien un tableau
        if (Array.isArray(actions)) {
            state[rootCause] = actions.map(action => ({
                ...action, // Garde les infos de D5
                // Ajoute/initialise les champs spécifiques à D6
                dateImplementationReelle: action.dateImplementationReelle || '',
                dateClotureReelle: action.dateClotureReelle || '',
                // Important: Utilise un état initial clair pour D6
                etatImplementation: action.etatImplementation || action.etat || 'A définir',
                preuvesLien: action.preuvesLien || '',
            }));
        } else {
            console.warn(`Actions for root cause "${rootCause}" is not an array:`, actions);
            state[rootCause] = []; // Initialise avec un tableau vide si les données sont incorrectes
        }
      });
    }
    return state;
  };
   // --- MODIFIÉ : Déterminer la source de données avant d'initialiser l'état ---
   const hasRealD5Data = d5ActionsData && Object.keys(d5ActionsData).length > 0;
   const initialDataForState = hasRealD5Data ? d5ActionsData : sampleD5ActionsData;
   if (!hasRealD5Data) {
       console.log("D6Form using SAMPLE D5 actions data for initialization."); // Log pour débug
   }
 
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
 
  // Supprimez toute référence à stepsOrder2 et gardez uniquement stepsOrder
  // const stepsOrder = [
  //   'd0_initialisation',
  //   'd1_team',
  //   'd2_problem',
  //   'd3_containment',
  //   'd4_rootcause',
  //   'd5_correctiveactions',
  //   'd6_implementvalidate',
  //   'd7_preventrecurrence',
  //   'd8_congratulate'
  // ];
  // Vérifiez que partout dans le fichier, seule la variable stepsOrder est utilisée pour la navigation
  // const currentIndex = stepsOrder.indexOf(currentStepKey);
 
  // --- Sauvegarde D6 ---
      const handleSave = () => {
        // TODO: Ajoutez ici la logique de validation si besoin
        setSaveFeedback({ open: true, message: `Données ${tabKeyLabel} sauvegardées !`, severity: 'success' });
        // ...sauvegarde réelle à implémenter...
    };
 
 
  // --- Ajout du handler pour fermer le Snackbar (manquant) ---
  const handleCloseSnackbar = () => setSaveFeedback(prev => ({ ...prev, open: false }));
 
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
    <Box component="div" sx={{ p: 2, maxWidth: 900, margin: '0 auto' }}>
      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
        D6 – Vérification de l’Efficacité des Actions Correctives
      </Typography>
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Vérification de l’efficacité des actions correctives
        </Typography>
        <ActionImplementationList actionsByRootCause={implementedActions} onActionUpdate={handleActionUpdate} />
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
 
export default D6Form;
 