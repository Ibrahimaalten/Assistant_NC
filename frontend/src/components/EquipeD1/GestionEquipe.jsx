// src/components/EquipeD1/GestionEquipe.jsx
import React, { useState } from 'react';
import { Grid, Typography, Button, FormHelperText } from '@mui/material';
import { Add } from '@mui/icons-material';
import EquipeDisplayList from './EquipeDisplayList'; // Assurez-vous que le chemin est correct
import EquipeAddForm from './EquipeAddForm';       // Assurez-vous que le chemin est correct

const GestionEquipe = ({ membresEquipe = [], onMembresChange, error = false, helperText = '' }) => {
  // `membresEquipe` est le tableau actuel des membres
  // `onMembresChange` est la fonction passée par D1Form (ex: handleMembresEquipeArrayChange)
  // qui attend le NOUVEAU tableau de membres mis à jour.

  const [newMember, setNewMember] = useState({ prenom: '', nom: '', fonction: '' });
  const [isAddingMember, setIsAddingMember] = useState(false);

  const handleNewMemberChangeInForm = (field, value) => { // Renommé pour clarté
    setNewMember(prev => ({ ...prev, [field]: value }));
  };

  // CETTE FONCTION EST DANS GestionEquipe.jsx
  const handleSaveNewMemberToList = () => { // Renommé pour clarté
    // Validation (peut être faite ici ou dans EquipeAddForm comme vous avez)
    // if (!newMember.prenom || !newMember.nom) { /* gérer l'erreur */ return; }

    const updatedMembresEquipe = [...membresEquipe, { ...newMember }];
    onMembresChange(updatedMembresEquipe); // Appelle le onMembresChange du parent (D1Form)

    setNewMember({ prenom: '', nom: '', fonction: '' }); // Reset form
    setIsAddingMember(false); // Hide form
  };

  const handleCancelAdd = () => {
    setNewMember({ prenom: '', nom: '', fonction: '' });
    setIsAddingMember(false);
  };

  const handleRemoveMemberFromList = (indexToRemove) => { // Renommé pour clarté
    const updatedMembresEquipe = membresEquipe.filter((_, index) => index !== indexToRemove);
    onMembresChange(updatedMembresEquipe); // Appelle le onMembresChange du parent (D1Form)
  };

  return (
    <Grid container spacing={2} style={{ border: error ? '1px solid red' : 'none', padding: error ? '15px' : '0', borderRadius: error ? '4px' : '0' }}>
      <Grid item xs={12}>
        <Typography variant="subtitle1" component="legend">
          Membres de l'équipe {error && <span style={{ color: 'red' }}>*</span>}
        </Typography>
        <EquipeDisplayList
          membres={membresEquipe}
          onRemove={handleRemoveMemberFromList} // Passe la bonne fonction de suppression
        />
        {error && helperText && (
          <FormHelperText error style={{ marginLeft: '0px', marginTop: '4px' }}>
            {helperText}
          </FormHelperText>
        )}
      </Grid>

      <Grid item xs={12}>
        {isAddingMember ? (
          <EquipeAddForm
            memberData={newMember}
            onChange={handleNewMemberChangeInForm} // Passe la fonction pour mettre à jour newMember
            onSave={handleSaveNewMemberToList}   // Passe la fonction pour sauvegarder DANS LA LISTE
            onCancel={handleCancelAdd}
          />
        ) : (
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={() => setIsAddingMember(true)}
            style={{ marginTop: 8 }}
          >
            Ajouter un membre
          </Button>
        )}
      </Grid>
    </Grid>
  );
};

export default GestionEquipe;

// GestionEquipe.jsx : gestion de la liste des membres (hors chef d'équipe)
// PAS DE MODIF : ce composant est déjà correct, il gère un tableau membresEquipe et onMembresChange