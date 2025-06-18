// src/pages/D0Form.jsx
import React, { useState } from 'react'; // Garder useState pour localErrors
import { Box, TextField, Button, Typography, Grid } from '@mui/material';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import SaveIcon from '@mui/icons-material/Save';
import { useForm8D } from '../contexts/Form8DContext'; // Assurez-vous que ce chemin est correct

// L'ordre des étapes doit être cohérent avec tabDefinitions dans App.jsx
// et les clés dans Form8DContext.js
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

// La prop tabKeyLabel est passée par App.jsx
function D0Form({ tabKeyLabel }) {
  // --- Utilisation du Contexte ---
  const {
    form8DData,         // L'objet complet contenant toutes les données 8D
    updateFormField,    // Fonction pour mettre à jour un champ dans le contexte
    setCurrentStepKey,  // Fonction pour changer d'étape/onglet
    currentStepKey      // La clé de l'étape actuellement active
  } = useForm8D();

  // --- DÉFINITION de la Clé de Section ---
  // MODIFIÉ/AJOUTÉ: Constante pour la clé de cette section dans le contexte.
  // Cela doit correspondre à la clé utilisée dans initialForm8DData et stepsOrder.
  const SECTION_KEY = 'd0_initialisation';

  // --- Lecture des Données du Formulaire depuis le Contexte ---
  // MODIFIÉ: Lire les données spécifiques à cette section depuis form8DData.
  // Prévoir des valeurs par défaut robustes au cas où la section ne serait pas
  // encore définie dans le contexte (bien qu'avec initialForm8DData, elle devrait l'être).
  const sectionData = form8DData[SECTION_KEY] || {
    referenceNC: '',
    dateDetection: new Date().toISOString().slice(0, 10),
    dateCreation: new Date().toISOString().slice(0, 10),
    produitRef: '',
    LieuDetection: '',
    detectePar: '',
    descriptionInitiale: '',
    Criticite: '',
    FonctionCrea: '',
  };

  // --- SUPPRIMÉ: État local pour formData ---
  // const [formData, setFormData] = useState({ ... }); // N'est plus nécessaire

  // --- Gestion des erreurs de validation (reste local à cette page) ---
  const [localErrors, setLocalErrors] = useState({});
  const [apiStatus, setApiStatus] = useState(null); // Pour feedback utilisateur

  // --- Gestionnaire de Changement pour les Champs ---
  // MODIFIÉ: Ce gestionnaire met maintenant à jour le contexte via updateFormField.
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    // Appel à updateFormField pour mettre à jour le contexte
    updateFormField(SECTION_KEY, name, value);

    // Effacer l'erreur locale quand l'utilisateur commence à corriger
    if (localErrors[name]) {
      setLocalErrors(prevErrors => ({
        ...prevErrors,
        [name]: undefined
      }));
    }
  };

  // --- Validation simple ---
  // MODIFIÉ: La validation utilise maintenant sectionData (du contexte) au lieu de formData local.
  const validatePage = () => {
    let tempErrors = {};
    if (!sectionData.referenceNC?.trim()) tempErrors.referenceNC = "La référence NC est requise.";
    if (!sectionData.dateDetection) tempErrors.dateDetection = "La date de détection est requise.";
    if (!sectionData.dateCreation) tempErrors.dateCreation = "La date de création est requise.";
    if (!sectionData.produitRef?.trim()) tempErrors.produitRef = "La référence produit/article est requise.";
    if (!sectionData.descriptionInitiale?.trim()) tempErrors.descriptionInitiale = "Une description initiale est requise.";
    if (!sectionData.LieuDetection?.trim()) tempErrors.LieuDetection = "Un lieu de détection de la NC est requis";
    if (!sectionData.FonctionCrea?.trim()) tempErrors.FonctionCrea = "La fonction du Créateur est requise";
    // if (!sectionData.Criticite?.trim()) tempErrors.Criticite = "La criticité est requise."; // Décommentez si la criticité est requise

    setLocalErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  // --- Gestionnaire de Sauvegarde ---
  // Envoie tous les champs D0 à l'API
  const handleSubmitToAPI = async () => {
    if (!validatePage()) {
      return;
    }
    setApiStatus(null);
    try {
      // On envoie tous les champs D0 attendus par l'API
      const payload = {
        referenceNC: sectionData.referenceNC,
        dateDetection: sectionData.dateDetection,
        dateCreation: sectionData.dateCreation,
        produitRef: sectionData.produitRef,
        LieuDetection: sectionData.LieuDetection,
        detectePar: sectionData.detectePar,
        descriptionInitiale: sectionData.descriptionInitiale,
        Criticite: sectionData.Criticite,
        FonctionCrea: sectionData.FonctionCrea,
        statut: 'En cours', // Statut initial
        date_creation: sectionData.dateCreation,
        date_resolution: null
      };
      const response = await fetch('/api/nonconformites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
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

  // --- Logique de Navigation (Précédent/Suivant) ---
  // MODIFIÉ: Utilise currentStepKey et setCurrentStepKey du contexte.
  // Les props activeTabIndex, totalTabs, onNavigate ne sont plus utilisées/reçues.
  const currentIndex = stepsOrder.indexOf(currentStepKey);

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentStepKey(stepsOrder[currentIndex - 1]);
      window.scrollTo(0,0); // Optionnel: remonter en haut de page
    }
  };

  const handleNext = () => {
    if (currentIndex < stepsOrder.length - 1) {
      setCurrentStepKey(stepsOrder[currentIndex + 1]);
      window.scrollTo(0,0);
    }
  };

  return (
    <Box component="form" noValidate autoComplete="off" sx={{ p: 0 }}>
      <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3 }}>
        {/* MODIFIÉ: Titre générique, tabKeyLabel est utilisé pour le bouton */}
        Initialisation de la Non-Conformité
      </Typography>
      <Grid container spacing={3}>
        {/* Chaque TextField lit sa valeur depuis sectionData et appelle handleInputChange */}
        <Grid item xs={12} sm={6}>
          <TextField
            required
            id="referenceNC-d0" // ID unique
            name="referenceNC" // Doit correspondre à la clé dans sectionData et initialForm8DData
            label="Référence Non-Conformité"
            placeholder="Ex: NC-2023-001"
            fullWidth
            variant="outlined"
            value={sectionData.referenceNC || ''} // Lire depuis sectionData
            onChange={handleInputChange}
            error={!!localErrors.referenceNC}
            helperText={localErrors.referenceNC || ''}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            required
            id="dateDetection-d0"
            name="dateDetection"
            label="Date de Détection"
            type="date"
            fullWidth
            variant="outlined"
            InputLabelProps={{ shrink: true }}
            value={sectionData.dateDetection || ''} // Lire depuis sectionData
            onChange={handleInputChange}
            error={!!localErrors.dateDetection}
            helperText={localErrors.dateDetection || ''}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            required
            id="dateCreation-d0"
            name="dateCreation"
            label="Date de Création (8D)"
            type="date"
            fullWidth
            variant="outlined"
            InputLabelProps={{ shrink: true }}
            value={sectionData.dateCreation || ''} // Lire depuis sectionData
            onChange={handleInputChange}
            error={!!localErrors.dateCreation}
            helperText={localErrors.dateCreation || ''}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            required
            id="produitRef-d0"
            name="produitRef"
            label="Produit / Article Impacté"
            fullWidth
            variant="outlined"
            value={sectionData.produitRef || ''} // Lire depuis sectionData
            onChange={handleInputChange}
            error={!!localErrors.produitRef}
            helperText={localErrors.produitRef || ''}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            required
            id="LieuDetection-d0"
            name="LieuDetection"
            label="Lieu de Détection"
            fullWidth
            variant="outlined"
            value={sectionData.LieuDetection || ''} // Lire depuis sectionData
            onChange={handleInputChange}
            error={!!localErrors.LieuDetection}
            helperText={localErrors.LieuDetection || ''}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            // required // Décommentez si requis
            id="Criticite-d0"
            name="Criticite"
            label="Criticité (ex: C=G*O*D)"
            placeholder="Calcul ou évaluation"
            fullWidth
            variant="outlined"
            value={sectionData.Criticite || ''} // Lire depuis sectionData
            onChange={handleInputChange}
            error={!!localErrors.Criticite}
            helperText={localErrors.Criticite || ''}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            id="detectePar-d0"
            name="detectePar"
            label="Détecté par (Nom ou Service)"
            fullWidth
            variant="outlined"
            value={sectionData.detectePar || ''} // Lire depuis sectionData
            onChange={handleInputChange}
            // Pas d'erreur gérée ici, ajoutez si nécessaire
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            required
            id="FonctionCrea-d0"
            name="FonctionCrea"
            label="Fonction du Créateur du 8D"
            fullWidth
            variant="outlined"
            value={sectionData.FonctionCrea || ''} // Lire depuis sectionData
            onChange={handleInputChange}
            error={!!localErrors.FonctionCrea}
            helperText={localErrors.FonctionCrea || ''}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            required
            id="descriptionInitiale-d0"
            name="descriptionInitiale"
            label="Description Initiale du Problème"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={sectionData.descriptionInitiale || ''} // Lire depuis sectionData
            onChange={handleInputChange}
            error={!!localErrors.descriptionInitiale}
            helperText={localErrors.descriptionInitiale || ''}
          />
        </Grid>

        {/* --- Zone des Boutons --- */}
        <Grid item xs={12}>
          {/* Feedback utilisateur API */}
          {apiStatus === 'success' && (
            <Typography color="success.main" sx={{ mb: 2 }}>Sauvegarde réussie !</Typography>
          )}
          {apiStatus === 'error' && (
            <Typography color="error.main" sx={{ mb: 2 }}>Erreur lors de la sauvegarde. Veuillez réessayer.</Typography>
          )}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 4, pt:2, borderTop: '1px solid', borderColor: 'divider' }}>
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
                {/* MODIFIÉ: Utilisation de tabKeyLabel pour le bouton */}
                Sauvegarder {tabKeyLabel || 'D0'}
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

export default D0Form;