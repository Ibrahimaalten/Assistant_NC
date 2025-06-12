// src/components/7D/PreventiveActionInput.jsx
import React, { useState, useEffect } from 'react';
// --- AJOUT: Select, MenuItem, FormControl, InputLabel ---
import { TextField, Button, Paper, Typography, Grid, Box, Select, MenuItem, FormControl, InputLabel } from '@mui/material';

const PreventiveActionInput = ({ initialActionData, onSave, onCancel }) => {

  const [actionData, setActionData] = useState({
    description: '',
    responsable: '',
    dateLancement: '',
    dateCloturePrevue: '',
    etat: 'A définir' // <-- AJOUT: État par défaut
  });

  useEffect(() => {
    if (initialActionData) {
      setActionData({
          description: initialActionData.description || '',
          responsable: initialActionData.responsable || '',
          dateLancement: initialActionData.dateLancement || '',
          dateCloturePrevue: initialActionData.dateCloturePrevue || '',
          etat: initialActionData.etat || 'A définir' // <-- AJOUT: Charger état existant ou défaut
      });
    } else {
       setActionData({ description: '', responsable: '', dateLancement: '', dateCloturePrevue: '', etat: 'A définir' }); // <-- AJOUT
    }
  }, [initialActionData]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setActionData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveClick = () => {
    // AJOUT: Validation de l'état si nécessaire (ici, le défaut est OK)
    if (!actionData.description?.trim() || !actionData.responsable?.trim() || !actionData.etat) {
      alert("La description, le responsable et l'état sont requis.");
      return;
    }
    // ... (validation date inchangée) ...
    if (actionData.dateLancement && actionData.dateCloturePrevue && actionData.dateCloturePrevue < actionData.dateLancement) {
        alert("La date de clôture prévue ne peut pas être antérieure à la date de lancement.");
        return;
    }
    onSave(actionData); // Sauvegarde l'objet complet, incluant l'état
  };

  const isEditing = !!initialActionData?.id;

  return (
    <Paper elevation={3} sx={{ padding: 2, marginTop: 2, border: '1px solid', borderColor: 'secondary.main', borderRadius: 1 }}>
      <Typography variant="subtitle2" /* ... */ >
        {isEditing ? 'Modifier...' : 'Ajouter...'}
      </Typography>
      <Grid container spacing={2}>
        {/* --- Description --- */}
        <Grid item xs={12}>
          <TextField label="Description *" name="description" value={actionData.description} onChange={handleChange} fullWidth multiline rows={3} margin="dense" required autoFocus />
        </Grid>
        {/* --- Responsable --- */}
        <Grid item xs={12} sm={6}>
          <TextField label="Responsable *" name="responsable" value={actionData.responsable} onChange={handleChange} fullWidth margin="dense" required />
        </Grid>
        {/* --- État d'avancement (NOUVEAU) --- */}
        <Grid item xs={12} sm={6}>
           <FormControl fullWidth margin="dense" required>
            <InputLabel id={`etat-preventive-label-${initialActionData?.id || 'new'}`}>État *</InputLabel>
            <Select
              labelId={`etat-preventive-label-${initialActionData?.id || 'new'}`}
              id={`etat-preventive-${initialActionData?.id || 'new'}`}
              name="etat" // Important: doit correspondre à la clé dans l'état actionData
              value={actionData.etat} // Lie au state
              label="État *" // Pour l'accessibilité et l'affichage
              onChange={handleChange} // Utilise le handler générique
            >
              {/* Lister les états possibles */}
              <MenuItem value="A définir">A définir</MenuItem>
              <MenuItem value="En cours">En cours</MenuItem>
              <MenuItem value="Terminée">Terminée</MenuItem>
              <MenuItem value="Bloquée">Bloquée</MenuItem>
              <MenuItem value="Annulée">Annulée</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        {/* --- Dates --- */}
        <Grid item xs={12} sm={6}>
           <TextField label="Date Lancement Prévue" name="dateLancement" type="date" value={actionData.dateLancement} onChange={handleChange} fullWidth margin="dense" InputLabelProps={{ shrink: true }} />
        </Grid>
        <Grid item xs={12} sm={6}>
           <TextField label="Date Clôture Prévue" name="dateCloturePrevue" type="date" value={actionData.dateCloturePrevue} onChange={handleChange} fullWidth margin="dense" InputLabelProps={{ shrink: true }} />
        </Grid>
      </Grid>
      {/* --- Boutons --- */}
      <Box sx={{ marginTop: 2, display: 'flex', gap: 1 }}>
        <Button variant="contained" color="secondary" onClick={handleSaveClick}>
          {isEditing ? 'Enregistrer Modifications' : 'Enregistrer Action'}
        </Button>
        <Button variant="outlined" onClick={onCancel}>
          Annuler
        </Button>
      </Box>
    </Paper>
  );
};

export default PreventiveActionInput;