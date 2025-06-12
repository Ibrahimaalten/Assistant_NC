// src/components/D7Form.jsx
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Box, Button, Typography, Grid, Paper, TextField } from '@mui/material';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import SaveIcon from '@mui/icons-material/Save';

// Importer les sous-composants 7D
import RootCausePreventSelector from '../components/7D/RootCausePreventSelector';
import PreventiveActionPlanner from '../components/7D/PreventiveActionPlanner';

// --- Props Attendues ---
// activeTabIndex, totalTabs, onNavigate, tabKeyLabel: Navigation
// identifiedRootCauses: Tableau de strings des causes racines de D5
// onSaveD7: Callback pour sauvegarder les données D7
// ----------------------

function D7Form({
  activeTabIndex,
  totalTabs,
  onNavigate,
  tabKeyLabel,
  identifiedRootCauses: rootCausesFromProps = [], // Renommé pour clarté, défaut tableau vide
  onSaveD7
}) {

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

  // --- Sauvegarde D7 ---
  const handleSave = () => {
    // Validation : Au moins une cause sélectionnée ? Au moins une action pour chaque cause sélectionnée ?
    if (selectedPreventiveCauses.length === 0 && availableRootCauses.length > 0) {
        alert("Veuillez sélectionner au moins une cause racine pour la prévention.");
        return;
    }
     let actionsMissing = false;
     selectedPreventiveCauses.forEach(cause => {
         if (!preventiveActions[cause] || preventiveActions[cause].length === 0) {
             actionsMissing = true;
         }
     });
     if (actionsMissing) {
         alert("Veuillez définir au moins une action préventive pour chaque cause racine sélectionnée.");
         return;
     }

    const saveData = {
        preventedRootCauses: selectedPreventiveCauses, // Causes cochées
        preventiveActions: preventiveActions,       // Actions définies
        documentationUpdates: documentationUpdates, // Champ texte optionnel
        systemicChanges: systemicChanges            // Champ texte optionnel
    };
    console.log('Données D7 à sauvegarder:', saveData);
    if (onSaveD7) {
        onSaveD7(saveData);
        alert(`Données ${tabKeyLabel} (simulées) sauvegardées !`);
    } else {
        console.error(`Callback onSaveD7 non fourni à D7Form.`);
        alert(`Erreur: La fonction de sauvegarde pour ${tabKeyLabel} n'est pas configurée.`);
    }
  };

  // --- Navigation ---
  const handlePrevious = () => onNavigate(activeTabIndex - 1);
  const handleNext = () => onNavigate(activeTabIndex + 1);

  // --- Rendu ---
  return (
    <Box component="div" sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        D7 - Prévenir la Récurrence
      </Typography>
      <Grid container spacing={3}>

        {/* Section 1: Sélection des Causes Racines à Prévenir */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
              1. Sélection des Causes Racines à traiter pour prévenir la récurrence
            </Typography>
            <RootCausePreventSelector
              allRootCauses={availableRootCauses} // Utilise les props ou l'exemple
              selectedCauses={selectedPreventiveCauses}
              onSelectionChange={handleCauseSelectionChange}
            />
          </Paper>
        </Grid>

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
                        key={cause} // Important pour React
                        rootCauseText={cause}
                        actions={preventiveActions[cause] || []} // Passe les actions pour cette cause
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
           <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3 }}>
              <Button variant="outlined" startIcon={<NavigateBeforeIcon />} onClick={handlePrevious} disabled={activeTabIndex === 0}>
                Précédent
              </Button>
               <Box>
                  <Button variant="contained" color="primary" startIcon={<SaveIcon />} onClick={handleSave} sx={{ mr: 1 }}>
                    Sauvegarder {tabKeyLabel}
                  </Button>
                  <Button variant="contained" endIcon={<NavigateNextIcon />} onClick={handleNext} disabled={activeTabIndex === totalTabs - 1}>
                     Suivant
                  </Button>
              </Box>
           </Box>
        </Grid>
      </Grid>
    </Box>
  );
}

export default D7Form;