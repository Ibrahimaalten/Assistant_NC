// src/components/D6Form.jsx
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Box, Button, Typography, Grid, Paper, TextField } from '@mui/material';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import SaveIcon from '@mui/icons-material/Save';

// Importer le composant pour la liste des actions
import ActionImplementationList from '../components/6D/ActionImplementationList';
function D6Form({
  activeTabIndex,
  totalTabs,
  onNavigate,
  tabKeyLabel,
  d5ActionsData = {}, // Données venant de l'étape D5
  onSaveD6
}) {
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

  const handleSave = () => { /* ... (inchangé - appelle onSaveD6) ... */
      if (validateForm()) {
          const saveData = { implementedActions, validationResults, surveillancePlan };
          console.log('Données D6 à sauvegarder:', saveData);
          if (onSaveD6) { onSaveD6(saveData); alert(`Données ${tabKeyLabel} (simulées) sauvegardées !`); }
          else { alert(`Erreur: La fonction de sauvegarde pour ${tabKeyLabel} n'est pas configurée.`); }
      } else { alert("Veuillez corriger les erreurs indiquées."); }
  };

  const handlePrevious = () => onNavigate(activeTabIndex - 1);
  const handleNext = () => onNavigate(activeTabIndex + 1);

  const hasActionsToImplement = useMemo(() =>
      Object.values(implementedActions || {}).some(actions => Array.isArray(actions) && actions.length > 0),
      [implementedActions]
  );

  // --- Rendu (inchangé) ---
  return (
    <Box component="div" sx={{ p: 2 }}>
       {/* ... (Typography, Grid, Paper, ActionImplementationList, TextFields, Buttons) ... */}
       {/* Le JSX reste identique à la version précédente */}
        <Typography variant="h6" gutterBottom>D6 - Implémentation et Validation des Actions Correctives Permanentes</Typography>
        <Grid container spacing={3}>
            {/* Section 1: Liste Actions */}
            <Grid item xs={12}>
                <Paper elevation={2} sx={{ p: 2 }}>
                    <Typography variant="subtitle1" /* ... */>1. Suivi de l'implémentation...</Typography>
                    {hasActionsToImplement ? (
                        <ActionImplementationList actionsByRootCause={implementedActions} onActionUpdate={handleActionUpdate} />
                    ) : (
                        <Typography /* ... */>Aucune action corrective...</Typography>
                    )}
                </Paper>
            </Grid>
            {/* Section 2: Validation */}
            <Grid item xs={12}>
                <Paper elevation={2} sx={{ p: 2 }}>
                    <Typography variant="subtitle1" /* ... */>2. Résultats de la Validation</Typography>
                    <TextField required fullWidth id="validationResults" name="validationResults" /* ...props... */ value={validationResults} onChange={handleInputChange} error={!!errors.validationResults} helperText={errors.validationResults || "Décrivez..."} />
                </Paper>
            </Grid>
            {/* Section 3: Surveillance */}
            <Grid item xs={12}>
                <Paper elevation={2} sx={{ p: 2 }}>
                    <Typography variant="subtitle1" /* ... */>3. Plan de Surveillance/AMDEC...</Typography>
                    <TextField fullWidth id="surveillancePlan" name="surveillancePlan" /* ...props... */ value={surveillancePlan} onChange={handleInputChange} />
                    <Box /* ...Box pour upload... */>
                        <Button variant="outlined" component="label" size="small">Charger un fichier...</Button>
                        <Typography variant="caption" /* ... */>(Optionnel...)</Typography>
                    </Box>
                </Paper>
            </Grid>
            {/* Zone Boutons */}
            <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3 }}>
                    <Button variant="outlined" startIcon={<NavigateBeforeIcon />} onClick={handlePrevious} disabled={activeTabIndex === 0}>Précédent</Button>
                    <Box>
                        <Button variant="contained" color="primary" startIcon={<SaveIcon />} onClick={handleSave} sx={{ mr: 1 }}>Sauvegarder {tabKeyLabel}</Button>
                        <Button variant="contained" endIcon={<NavigateNextIcon />} onClick={handleNext} disabled={activeTabIndex === totalTabs - 1}>Suivant</Button>
                    </Box>
                </Box>
            </Grid>
        </Grid>
    </Box>
  );
}

export default D6Form;