// src/components/EquipeD1/ChefEquipe.jsx
import React from 'react';
import { Grid, TextField, Button, Typography, Paper } from '@mui/material';

const ChefEquipe = ({ value = { prenom: '', nom: '', support: '' }, onChange, error = false, helperText = '' }) => {
  // value : objet { prenom, nom, support }
  // onChange : fonction (nouvelObjet) => void

  const handleFieldChange = (field, val) => {
    onChange({ ...value, [field]: val });
  };

  return (
    <Paper elevation={1} style={{ padding: 16, marginBottom: 16, border: error ? '1px solid red' : 'none' }}>
      <Typography variant="subtitle1" component="legend">
        Chef d'équipe / Pilote 8D {error && <span style={{ color: 'red' }}>*</span>}
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <TextField
            label="Prénom *"
            value={value.prenom}
            onChange={e => handleFieldChange('prenom', e.target.value)}
            required
            fullWidth
            error={error && !value.prenom}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            label="Nom *"
            value={value.nom}
            onChange={e => handleFieldChange('nom', e.target.value)}
            required
            fullWidth
            error={error && !value.nom}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            label="Support / Fonction"
            value={value.support || ''}
            onChange={e => handleFieldChange('support', e.target.value)}
            fullWidth
          />
        </Grid>
        {error && helperText && (
          <Grid item xs={12}>
            <Typography variant="caption" color="error">{helperText}</Typography>
          </Grid>
        )}
      </Grid>
    </Paper>
  );
};

export default ChefEquipe;