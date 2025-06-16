// src/pages/D2Form.jsx (ou le nom que vous utilisez)
import React, { useState } from 'react'; // Garder useState pour localErrors
import { Box, Button, Typography, Grid } from '@mui/material'; // TextField n'est plus directement utilisé ici
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import SaveIcon from '@mui/icons-material/Save';

// Importer le sous-composant pour la description
import Description2DInput from '../components/2D/Description2DInput'; // Assurez-vous que le chemin est correct

// Importer le hook du contexte
import { useForm8D } from '../contexts/Form8DContext'; // Assurez-vous que le chemin est correct

// L'ordre des étapes doit être cohérent
const stepsOrder = [
  'd0_initialisation',
  'd1_team',
  'd2_problem', // Notre étape actuelle
  'd3_containment',
  'd4_rootcause',
  'd5_correctiveactions',
  'd6_implementvalidate',
  'd7_preventrecurrence',
  'd8_congratulate'
];

function D2Form({ tabKeyLabel = "D2" }) { // tabKeyLabel est passé par App.jsx
  const {
    form8DData,
    updateFormField,
    setCurrentStepKey,
    currentStepKey,
  } = useForm8D();

  // Clé spécifique pour cette section dans le contexte
  const SECTION_KEY = 'd2_problem'; // IMPORTANT: Doit correspondre à Form8DContext et stepsOrder

  // sectionData est l'objet pour SECTION_KEY dans le contexte
  // Prévoir une structure par défaut robuste
  const sectionData = form8DData[SECTION_KEY] || {
    descriptionDetaillee: {
      qui: '', quoi: '', ou: '', quand: '', comment: '', combien: '', pourquoi: ''
    }
    // ... autres champs par défaut pour D2 si nécessaire ...
  };

  // descriptionValue est l'objet spécifique pour le composant Description2DInput
  const descriptionValue = sectionData.descriptionDetaillee || {
    qui: '', quoi: '', ou: '', quand: '', comment: '', combien: '', pourquoi: ''
  };

  // État local pour les erreurs de validation de cette page
  const [localErrors, setLocalErrors] = useState({});

  // Gestionnaire pour Description2DInput
  // newDescriptionObject est l'objet complet {qui, quoi, ou...} renvoyé par Description2DInput
  const handleDescriptionChange = (newDescriptionObject) => {
    console.log("D2Form - newDescriptionObject received:", newDescriptionObject); // LOG 2
    updateFormField(SECTION_KEY, 'descriptionDetaillee', newDescriptionObject);
    if (localErrors.descriptionDetaillee) {
      setLocalErrors(prev => ({ ...prev, descriptionDetaillee: undefined }));
    }
  };

  const validatePage = () => {
    let tempErrors = {};
    // Validation: vérifier si au moins un des champs de descriptionDetaillee est rempli,
    // ou si tous sont requis. Pour cet exemple, je vais juste vérifier 'quoi'.
    // Adaptez cette logique à vos besoins de validation réels pour D2.
    if (!descriptionValue || !descriptionValue.quoi?.trim()) { // Exemple: le champ 'quoi' est requis
      tempErrors.descriptionDetaillee = "La description du problème (champ 'Quoi') est requise.";
    }
    // Vous pourriez vouloir vérifier d'autres champs de descriptionDetaillee ici...
    // par exemple : if (!descriptionValue.qui?.trim()) tempErrors.descriptionDetailleeQui = "Le champ 'Qui' est requis.";

    setLocalErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSave = () => {
    if (validatePage()) {
      console.log(`Données ${tabKeyLabel} validées (issues du contexte):`, sectionData);
      alert(`Données ${tabKeyLabel} prêtes pour la sauvegarde (simulation) !`);
    } else {
      console.log(`Validation ${tabKeyLabel} échouée`, localErrors);
    }
  };

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
    <Box component="form" noValidate autoComplete="off" sx={{ p: 0 }}>
      <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3 }}>
        D2 - Description Détaillée du Problème
        {tabKeyLabel && <Typography variant="caption" sx={{ ml:1 }}>({tabKeyLabel})</Typography>}
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          {/* Utilisation du composant Description2DInput */}
          <Description2DInput
            // label="Description détaillée QQOQCCP" // Le label peut être dans Description2DInput
            value={descriptionValue}         // Passer l'objet descriptionDetaillee du contexte
            onChange={handleDescriptionChange} // Passer le gestionnaire
            error={!!localErrors.descriptionDetaillee} // Passer l'état d'erreur pour ce groupe/composant
            helperText={localErrors.descriptionDetaillee || ''} // Passer le message d'erreur
            // required // La prop 'required' sur le composant parent n'a pas d'effet direct
                       // sur les champs internes si Description2DInput ne la gère pas.
                       // La validation se fait via validatePage.
          />
        </Grid>

        {/* --- Zone des Boutons --- */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 4, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Button
              variant="outlined"
              startIcon={<NavigateBeforeIcon />}
              onClick={handlePrevious}
              disabled={currentIndex === 0}
            >
              Précédent
            </Button>
            <Box>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                sx={{ mr: 1 }}
              >
                Sauvegarder {tabKeyLabel}
              </Button>
              <Button
                variant="contained"
                color="secondary"
                endIcon={<NavigateNextIcon />}
                onClick={handleNext}
                disabled={currentIndex === stepsOrder.length - 1}
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

export default D2Form;