// src/components/5D/ActionPlanner.jsx
import React, { useState, useCallback } from 'react';
import { Box, Button, List, ListItem, ListItemText, IconButton, Typography, Paper, Divider } from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

// Importer le formulaire d'ajout/édition
import ActionAddForm from './ActionAddForm'; // Assure-toi que le chemin est correct

const ActionPlanner = ({ rootCause, actions = [], onActionsChange }) => {
  const [isAddingOrEditing, setIsAddingOrEditing] = useState(false); // État unique pour afficher le formulaire
  const [editingAction, setEditingAction] = useState(null); // null (ajout) ou l'objet action (édition)

  // --- Afficher le formulaire pour un nouvel ajout ---
  const handleAddNewClick = () => {
    setEditingAction(null); // Mode ajout
    setIsAddingOrEditing(true);
  };

  // --- Afficher le formulaire pour l'édition ---
   const handleEditAction = useCallback((actionToEdit) => {
    setEditingAction(actionToEdit); // Mode édition
    setIsAddingOrEditing(true);
  }, []);

  // --- Sauvegarder l'action (ajout ou modification) ---
  const handleSaveAction = useCallback((actionDataFromForm) => {
    let updatedActions;
    if (editingAction) {
      // Mode Édition: Met à jour l'action existante
      updatedActions = actions.map(act =>
        act.id === editingAction.id ? { ...act, ...actionDataFromForm } : act // Utilise l'ID pour trouver et remplacer
      );
    } else {
      // Mode Ajout: Ajoute la nouvelle action avec un ID unique
      const newAction = {
        ...actionDataFromForm,
        id: Date.now().toString() + Math.random().toString(16).slice(2), // ID plus robuste
      };
      updatedActions = [...actions, newAction];
    }
    onActionsChange(rootCause, updatedActions); // Notifie D5Form
    setIsAddingOrEditing(false); // Cache le formulaire
    setEditingAction(null);      // Réinitialise le mode édition
  }, [actions, rootCause, onActionsChange, editingAction]);

  // --- Annuler l'ajout ou l'édition ---
  const handleCancel = useCallback(() => {
    setIsAddingOrEditing(false);
    setEditingAction(null);
  }, []);

  // --- Supprimer une action ---
  const handleDeleteAction = useCallback((actionIdToDelete) => {
    // Confirmation avant suppression
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette action corrective ?")) {
        const updatedActions = actions.filter(act => act.id !== actionIdToDelete);
        onActionsChange(rootCause, updatedActions); // Notifie D5Form
    }
  }, [actions, rootCause, onActionsChange]);

  // Détermine les données initiales pour le formulaire (vide pour ajout, pré-rempli pour édition)
  const initialActionDataForForm = editingAction ? editingAction : undefined; // Passe undefined pour l'ajout pour utiliser les défauts du formulaire

  return (
    <Box mt={2}>
      {/* Affichage de la liste des actions */}
      <Typography variant="subtitle1" gutterBottom>Actions correctives définies :</Typography>
      {actions.length === 0 && !isAddingOrEditing ? (
        <Typography color="textSecondary" sx={{ mb: 2, fontStyle: 'italic' }}>Aucune action définie pour cette cause racine.</Typography>
      ) : (
        <List dense sx={{ mb: 2 }}>
          {actions.map((action) => (
            <Paper key={action.id} elevation={1} sx={{ mb: 1, borderLeft: '4px solid', borderColor: action.etat === 'Terminée' ? 'success.main' : (action.etat === 'Annulée' || action.etat === 'Bloquée' ? 'error.main' : 'primary.main') }}>
              <ListItem
                secondaryAction={
                  <Box sx={{ display: 'flex', gap: 0.5 }}> {/* Contrôle l'espacement */}
                    <IconButton edge="end" aria-label="edit" size="small" onClick={() => handleEditAction(action)} title="Modifier l'action">
                        <EditIcon fontSize="inherit" /> {/* Taille héritée */}
                    </IconButton>
                    <IconButton edge="end" aria-label="delete" size="small" onClick={() => handleDeleteAction(action.id)} title="Supprimer l'action">
                      <DeleteIcon fontSize="inherit" /> {/* Taille héritée */}
                    </IconButton>
                  </Box>
                }
                sx={{ alignItems: 'flex-start' }} // Aligne les boutons avec le haut
              >
                <ListItemText
                  primary={action.description}
                  secondary={`Resp: ${action.responsable || 'N/A'} | Début: ${action.dateLancement || 'N/A'} | Prévu: ${action.dateCloturePrevue || 'N/A'} | État: ${action.etat || 'N/A'}`}
                  primaryTypographyProps={{ sx: { fontWeight: '500', mb: 0.5, whiteSpace: 'pre-wrap' } }} // Permet le retour à la ligne dans la description
                  secondaryTypographyProps={{ sx: { fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }} // Texte secondaire condensé
                />
              </ListItem>
            </Paper>
          ))}\
        </List>
      )}

      {/* Formulaire d'ajout/édition (conditionnel) */}
      {isAddingOrEditing && (
          <ActionAddForm
            key={editingAction ? editingAction.id : 'new'} // Force le re-rendu avec les bonnes données initiales lors du changement d'édition
            initialActionData={initialActionDataForForm} // Passe les données pour l'édition ou undefined pour l'ajout
            onSave={handleSaveAction}   // Appelle la sauvegarde
            onCancel={handleCancel}     // Appelle l'annulation
          />
      )}

      {/* Bouton "Ajouter" (conditionnel) */}
      {!isAddingOrEditing && (
        <Button
          variant="outlined"
          startIcon={<AddCircleOutlineIcon />}
          onClick={handleAddNewClick}
          size="small" // Bouton plus discret
        >
          Ajouter une action corrective
        </Button>
      )}
    </Box>
  );
};

export default ActionPlanner;