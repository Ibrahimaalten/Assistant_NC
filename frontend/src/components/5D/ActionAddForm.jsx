// src/components/5D/ActionAddForm.jsx
// Gère son propre état interne basé sur initialActionData
import React, { useState, useEffect } from 'react';
import { TextField, Button, Paper, Typography, Grid, Select, MenuItem, FormControl, InputLabel, Box } from '@mui/material';

// Accepte initialActionData pour pré-remplir (édition) ou undefined (ajout)
const ActionAddForm = ({ initialActionData, onSave, onCancel }) => {

  // État interne pour gérer les données du formulaire
  const [actionData, setActionData] = useState({});

  // Met à jour l'état interne quand initialActionData change (pour l'édition)
  // ou réinitialise pour l'ajout (si initialActionData devient undefined)
  useEffect(() => {
    setActionData({
        // Valeurs par défaut pour un nouvel ajout
        description: '',
        dateLancement: '',
        dateCloturePrevue: '',
        responsable: '',
        etat: 'A définir', // État initial plus logique
        // Écrase les défauts si initialActionData est fourni (mode édition)
        ...(initialActionData || {}) // Utilise {} si initialActionData est undefined/null
    });
  }, [initialActionData]); // Se déclenche quand on clique sur Edit ou Add New

  // Handler générique pour mettre à jour l'état interne
  const handleChange = (event) => {
    const { name, value } = event.target;
    setActionData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  // Validation et appel de onSave
  const handleSaveClick = () => {
    // Validation simple (ajuster si nécessaire)
    if (!actionData.description?.trim() || !actionData.responsable?.trim() || !actionData.etat) {
      alert("Les champs Action, Responsable et État sont requis.");
      return;
    }
    if (actionData.dateLancement && actionData.dateCloturePrevue && actionData.dateCloturePrevue < actionData.dateLancement) {
        alert("La date de clôture prévue ne peut pas être antérieure à la date de lancement.");
        return;
    }

    // Appelle onSave du parent avec les données actuelles du formulaire
    onSave(actionData);
  };

  // Détermine si on est en mode édition pour le titre/bouton
  const isEditing = !!initialActionData?.id; // Ou simplement !!initialActionData s'il n'y a pas d'ID

  return (
    // Ajout d'un style pour distinguer le formulaire
    <Paper elevation={3} sx={{ padding: 2, marginTop: 2, border: '1px solid', borderColor: 'primary.main', borderRadius: 1 }}>
      <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
        {isEditing ? 'Modifier l\'action corrective' : 'Ajouter une nouvelle action corrective'}
      </Typography>
      <Grid container spacing={2}>
        {/* --- Champs du formulaire --- */}
        <Grid item xs={12}>
          <TextField label="Action *" name="description" value={actionData.description || ''} onChange={handleChange} fullWidth multiline rows={3} margin="dense" required autoFocus />
        </Grid>
        <Grid item xs={12} sm={6}>
           <TextField label="Date de Lancement" name="dateLancement" type="date" value={actionData.dateLancement || ''} onChange={handleChange} fullWidth margin="dense" InputLabelProps={{ shrink: true }} />
        </Grid>
        <Grid item xs={12} sm={6}>
           <TextField label="Date de Clôture Prévue" name="dateCloturePrevue" type="date" value={actionData.dateCloturePrevue || ''} onChange={handleChange} fullWidth margin="dense" InputLabelProps={{ shrink: true }} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField label="Responsable *" name="responsable" value={actionData.responsable || ''} onChange={handleChange} fullWidth margin="dense" required />
        </Grid>
        <Grid item xs={12} sm={6}>
           <FormControl fullWidth margin="dense" required>
            <InputLabel id="etat-avancement-label">État *</InputLabel>
            <Select labelId="etat-avancement-label" id="etat-avancement" name="etat" value={actionData.etat || 'A définir'} label="État *" onChange={handleChange} >
              <MenuItem value="A définir">A définir</MenuItem>
              <MenuItem value="En cours">En cours</MenuItem>
              <MenuItem value="Terminée">Terminée</MenuItem>
              <MenuItem value="Bloquée">Bloquée</MenuItem>
              <MenuItem value="Annulée">Annulée</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
      {/* --- Boutons du formulaire --- */}
      <Box sx={{ marginTop: 2, display: 'flex', gap: 1 }}>
        <Button variant="contained" color="primary" onClick={handleSaveClick}>
          {isEditing ? 'Enregistrer les modifications' : 'Enregistrer l\'action'}
        </Button>
        <Button variant="outlined" onClick={onCancel}>
          Annuler
        </Button>
      </Box>
    </Paper>
  );
};

export default ActionAddForm;