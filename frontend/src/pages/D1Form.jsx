// src/pages/D1TeamPage.jsx (ou le nom que vous utilisez, ex: D1Form.jsx)
import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Grid } from '@mui/material';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import SaveIcon from '@mui/icons-material/Save';
import Avatar from '@mui/material/Avatar';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useParams } from 'react-router-dom';

// Assurez-vous que les chemins d'importation sont corrects
import ChefEquipe from '../components/EquipeD1/ChefEquipe'; // Renommé pour correspondre au nom du fichier
import GestionEquipe from '../components/EquipeD1/GestionEquipe';
import { useForm8D } from '../contexts/Form8DContext'; // Ajustez le chemin si nécessaire
import MainButton from '../components/MainButton';

// L'ordre des étapes doit être cohérent avec tabDefinitions dans App.jsx
// Il est préférable de le définir une seule fois et de l'importer si possible,
// ou de s'assurer qu'il est identique ici et dans App.jsx (ou tout autre DxForm).
const stepsOrder = [
  'd0_initialisation', // Si vous avez une étape D0
  'd1_team',
  'd2_problem',
  'd3_containment',
  'd4_rootcause',
  'd5_correctiveactions',
  'd6_implementvalidate',
  'd7_preventrecurrence',
  'd8_congratulate'
]; // Assurez-vous que ces clés correspondent à celles dans Form8DContext et App.jsx

function D1Form({ tabKeyLabel = "D1" }) {
  const {
    form8DData,
    updateFormField,
    setCurrentStepKey,
    currentStepKey,
  } = useForm8D();
  const { id } = useParams();

  const SECTION_KEY = 'd1_team';
  const sectionData = form8DData[SECTION_KEY] || {
    chefEquipe: { prenom: '', nom: '', support: '' },
    membresEquipe: [],
    Sponsor: ''
  };
  const chefEquipeValue = sectionData.chefEquipe || { prenom: '', nom: '', support: '' };
  const membresEquipeValue = sectionData.membresEquipe || [];
  const [localErrors, setLocalErrors] = useState({});
  const [editChef, setEditChef] = useState(!chefEquipeValue.prenom && !chefEquipeValue.nom);
  const [editSponsor, setEditSponsor] = useState(!sectionData.Sponsor);
  // --- Gestionnaire de Sauvegarde vers l'API ---
  const [apiStatus, setApiStatus] = useState(null); // Pour feedback utilisateur

  // Gestionnaire pour ChefEquipe
  const handleChefEquipeChange = (newChefEquipeObject) => {
    updateFormField(SECTION_KEY, 'chefEquipe', newChefEquipeObject);
    if (localErrors.chefEquipe) {
      setLocalErrors(prev => ({ ...prev, chefEquipe: undefined }));
    }
  };

  // Suppression du chef d'équipe
  const handleDeleteChef = () => {
    updateFormField(SECTION_KEY, 'chefEquipe', { prenom: '', nom: '', support: '' });
    setEditChef(true);
  };

  // Gestionnaire pour le champ Sponsor
  const handleSponsorChange = (event) => {
    const { value } = event.target; // name n'est pas nécessaire si on hardcode 'Sponsor'
    updateFormField(SECTION_KEY, 'Sponsor', value); // Utiliser directement 'Sponsor'
    if (localErrors.Sponsor) { // Utiliser la clé exacte 'Sponsor'
      setLocalErrors(prev => ({ ...prev, Sponsor: undefined }));
    }
  };

  // Gestionnaire pour GestionEquipe
  const handleMembresEquipeArrayChange = (newMembresArray) => {
    updateFormField(SECTION_KEY, 'membresEquipe', newMembresArray);
    if (localErrors.membresEquipe) {
      setLocalErrors(prev => ({ ...prev, membresEquipe: undefined }));
    }
  };

  const validatePage = () => {
    let tempErrors = {};
    if (!chefEquipeValue || !chefEquipeValue.prenom?.trim() || !chefEquipeValue.nom?.trim()) {
      tempErrors.chefEquipe = "Le prénom et le nom du chef d'équipe sont requis.";
    }
    if (!sectionData.Sponsor?.trim()) {
      tempErrors.Sponsor = "Le sponsor est requis.";
    }
    if (!membresEquipeValue || membresEquipeValue.length === 0) {
      tempErrors.membresEquipe = "Au moins un membre d'équipe est requis.";
    }
    setLocalErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  // --- Soumission des données à l'API ---
  const handleSubmitToAPI = async () => {
    if (!validatePage()) return;
    setApiStatus(null);
    const cleanedForm8DData = {
      ...form8DData,
      d1_team: {
        chefEquipe: {
          prenom: sectionData.chefEquipe?.prenom || '',
          nom: sectionData.chefEquipe?.nom || '',
          support: sectionData.chefEquipe?.support || ''
        },
        membresEquipe: (sectionData.membresEquipe || []).map(m => ({
          prenom: m.prenom || '',
          nom: m.nom || '',
          fonction: m.fonction || ''
        })),
        Sponsor: sectionData.Sponsor || ''
      }
    };
    try {
      const method = id ? 'PUT' : 'POST';
      const url = id ? `/api/nonconformites/${id}` : '/api/nonconformites';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanedForm8DData),
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

  const currentIndex = stepsOrder.indexOf(currentStepKey);

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentStepKey(stepsOrder[currentIndex - 1]);
      window.scrollTo(0, 0); // Remonter en haut de la page
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
        D1 - Constitution de l'Équipe
        {tabKeyLabel && <Typography variant="caption" sx={{ ml:1 }}>({tabKeyLabel})</Typography>}
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          {/* Affichage élégant du chef d'équipe */}
          {(!editChef && chefEquipeValue.prenom && chefEquipeValue.nom) ? (
            <Card elevation={2} sx={{ display: 'flex', alignItems: 'center', p: 2, mb: 2 }}>
              <Avatar sx={{ width: 56, height: 56, mr: 2 }}>
                {chefEquipeValue.prenom?.[0]?.toUpperCase()}{chefEquipeValue.nom?.[0]?.toUpperCase()}
              </Avatar>
              <CardContent sx={{ flex: 1 }}>
                <Typography variant="h6">
                  {chefEquipeValue.prenom} {chefEquipeValue.nom}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {chefEquipeValue.support || 'Fonction non renseignée'}
                </Typography>
              </CardContent>
              <CardActions>
                <IconButton aria-label="Modifier" onClick={() => setEditChef(true)}>
                  <EditIcon />
                </IconButton>
                <IconButton aria-label="Supprimer" onClick={handleDeleteChef} color="error">
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
          ) : (
            <Box>
              <ChefEquipe
                value={chefEquipeValue}
                onChange={handleChefEquipeChange}
                error={!!localErrors.chefEquipe}
                helperText={localErrors.chefEquipe || ''}
              />
              <Button
                variant="contained"
                color="success"
                sx={{ mt: 1 }}
                onClick={() => {
                  if (chefEquipeValue.prenom?.trim() && chefEquipeValue.nom?.trim()) {
                    setEditChef(false);
                    setLocalErrors(prev => ({ ...prev, chefEquipe: undefined }));
                  } else {
                    setLocalErrors(prev => ({ ...prev, chefEquipe: "Le prénom et le nom du chef d'équipe sont requis." }));
                  }
                }}
              >
                Valider
              </Button>
            </Box>
          )}
        </Grid>
        <Grid item xs={12} md={6}>
          {/* Affichage/édition du Sponsor */}
          {(!editSponsor && sectionData.Sponsor) ? (
            <Card elevation={2} sx={{ display: 'flex', alignItems: 'center', p: 2, mb: 2 }}>
              <CardContent sx={{ flex: 1 }}>
                <Typography variant="subtitle2" color="text.secondary">Sponsor</Typography>
                <Typography variant="h6">{sectionData.Sponsor}</Typography>
              </CardContent>
              <CardActions>
                <IconButton aria-label="Modifier" onClick={() => setEditSponsor(true)}>
                  <EditIcon />
                </IconButton>
                <IconButton aria-label="Supprimer" onClick={() => { updateFormField(SECTION_KEY, 'Sponsor', ''); setEditSponsor(true); }} color="error">
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
          ) : (
            <Box>
              <TextField
                required
                id="sponsor-d1"
                name="Sponsor"
                label="Sponsor"
                fullWidth
                variant="outlined"
                value={sectionData.Sponsor || ''}
                onChange={handleSponsorChange}
                error={!!localErrors.Sponsor}
                helperText={localErrors.Sponsor || ''}
              />
              <Button
                variant="contained"
                color="success"
                sx={{ mt: 1 }}
                onClick={() => {
                  if (sectionData.Sponsor?.trim()) {
                    setEditSponsor(false);
                    setLocalErrors(prev => ({ ...prev, Sponsor: undefined }));
                  } else {
                    setLocalErrors(prev => ({ ...prev, Sponsor: "Le sponsor est requis." }));
                  }
                }}
              >
                Valider
              </Button>
            </Box>
          )}
        </Grid>
        <Grid item xs={12}>
          <GestionEquipe
            membresEquipe={membresEquipeValue}
            onMembresChange={handleMembresEquipeArrayChange}
            error={!!localErrors.membresEquipe}
            helperText={localErrors.membresEquipe || ''}
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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 4 }}>
            <MainButton color="primary" onClick={handlePrevious} disabled={currentIndex === 0} startIcon={<NavigateBeforeIcon />} sx={{ minWidth: 120 }}>
              Précédent
            </MainButton>
            <Box>
              <MainButton color="primary" onClick={handleSave} startIcon={<SaveIcon />} sx={{ mr: 1, minWidth: 150 }}>
                Sauvegarder {tabKeyLabel || 'D1'}
              </MainButton>
              <MainButton color="primary" onClick={handleNext} disabled={currentIndex === stepsOrder.length - 1} endIcon={<NavigateNextIcon />} sx={{ minWidth: 120 }}>
                Suivant
              </MainButton>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}

export default D1Form; // Ou D1Form, selon votre convention de nommage