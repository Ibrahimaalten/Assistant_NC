// src/components/EquipeAddForm.jsx
import React from 'react';
import { TextField, Button, Paper, Typography } from '@mui/material';

const EquipeAddForm = ({ memberData, onChange, onSave, onCancel }) => {
  // Petite fonction helper pour gérer la sauvegarde uniquement si les champs requis sont remplis
  const handleSaveClick = () => {
    if (!memberData.prenom || !memberData.nom) {
      alert("Le prénom et le nom sont requis.");
      return;
    }
    onSave(); // Appelle la fonction onSave passée en prop
  };

  return (
    <Paper elevation={2} style={{ padding: 16, marginTop: 16 }}>
      <Typography variant="subtitle1" gutterBottom>Ajouter un membre</Typography>
      <TextField
        label="Prénom *"
        value={memberData.prenom}
        onChange={e => onChange('prenom', e.target.value)}
        fullWidth
        margin="dense"
        required
      />
      <TextField
        label="Nom *"
        value={memberData.nom}
        onChange={e => onChange('nom', e.target.value)}
        fullWidth
        margin="dense"
        required
      />
      <TextField
        label="Fonction"
        value={memberData.fonction}
        onChange={e => onChange('fonction', e.target.value)}
        fullWidth
        margin="dense"
      />
      <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSaveClick} // Utilise notre helper
        >
          Enregistrer le membre
        </Button>
        <Button
          variant="outlined"
          onClick={onCancel} // Appelle la fonction onCancel passée en prop
        >
          Annuler
        </Button>
      </div>
    </Paper>
  );
};

export default EquipeAddForm;