// src/components/ActionAddForm.jsx
import React from 'react';
import { TextField, Button, Paper, Typography, Grid, Select, MenuItem, FormControl, InputLabel } from '@mui/material';

const ActionAddForm = ({ actionData, onChange, onSave, onCancel }) => {

  // Helper pour gérer la sauvegarde après validation simple
  const handleSaveClick = () => {
    if (!actionData.description || !actionData.dateLancement || !actionData.dateCloturePrevue || !actionData.responsable || !actionData.etat) {
      alert("Tous les champs sont requis pour enregistrer l'action.");
      return;
    }
    // Validation de date simple (optionnelle)
    if (actionData.dateLancement && actionData.dateCloturePrevue && actionData.dateCloturePrevue < actionData.dateLancement) {
        alert("La date de clôture prévue ne peut pas être antérieure à la date de lancement.");
        return;
    }
    onSave();
  };

  return (
    <Paper elevation={2} style={{ padding: 16, marginTop: 16 }}>
      <Typography variant="subtitle1" gutterBottom>Ajouter une action curative</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            label="Action *"
            name="description" // Important pour le onChange générique dans le container
            value={actionData.description}
            onChange={(e) => onChange('description', e.target.value)}
            fullWidth
            multiline
            rows={3}
            margin="dense"
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
           <TextField
            label="Date de Lancement *"
            name="dateLancement"
            type="date"
            value={actionData.dateLancement}
             onChange={(e) => onChange('dateLancement', e.target.value)}
            fullWidth
            margin="dense"
            required
            InputLabelProps={{ shrink: true }} // Important pour les champs date
          />
        </Grid>
        <Grid item xs={12} sm={6}>
           <TextField
            label="Date de Clôture Prévue *"
            name="dateCloturePrevue"
            type="date"
            value={actionData.dateCloturePrevue}
            onChange={(e) => onChange('dateCloturePrevue', e.target.value)}
            fullWidth
            margin="dense"
            required
            InputLabelProps={{ shrink: true }} // Important pour les champs date
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Responsable *"
            name="responsable"
            value={actionData.responsable}
            onChange={(e) => onChange('responsable', e.target.value)}
            fullWidth
            margin="dense"
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
           <FormControl fullWidth margin="dense" required>
            <InputLabel id="etat-avancement-label">État d'avancement *</InputLabel>
            <Select
              labelId="etat-avancement-label"
              id="etat-avancement"
              name="etat"
              value={actionData.etat}
              label="État d'avancement *" // Doit correspondre à InputLabel
               onChange={(e) => onChange('etat', e.target.value)}
            >
              <MenuItem value="En cours">En cours</MenuItem>
              <MenuItem value="Terminée">Terminée</MenuItem>
              {/* Tu peux ajouter d'autres états si besoin */}
              {/* <MenuItem value="En retard">En retard</MenuItem> */}
              {/* <MenuItem value="Annulée">Annulée</MenuItem> */}
            </Select>
          </FormControl>
        </Grid>

      </Grid>
      <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSaveClick}
        >
          Enregistrer l'action
        </Button>
        <Button
          variant="outlined"
          onClick={onCancel}
        >
          Annuler
        </Button>
      </div>
    </Paper>
  );
};

export default ActionAddForm;