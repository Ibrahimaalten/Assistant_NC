// src/components/7D/PreventiveActionPlanner.jsx
import React, { useState, useCallback } from 'react';
import { Box, Button, List, ListItem, ListItemText, IconButton, Typography, Paper, Divider } from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteIcon from '@mui/icons-material/Delete';
// Importer le formulaire d'action préventive
import PreventiveActionInput from './PreventiveActionInput';

const PreventiveActionPlanner = ({
  rootCauseText, // La cause racine pour laquelle planifier
  actions = [], // Tableau des actions préventives existantes pour cette cause
  onActionAdd, // Callback (rootCause: string, actionData: object) => void
  onActionDelete // Callback (rootCause: string, actionId: string) => void
  // onActionEdit pourrait être ajouté plus tard
}) => {

  const [showAddForm, setShowAddForm] = useState(false);

  // Gérer l'ajout d'une nouvelle action
  const handleSaveNewAction = useCallback((actionDataFromForm) => {
    onActionAdd(rootCauseText, actionDataFromForm); // Notifie D7Form
    setShowAddForm(false); // Cache le formulaire après ajout
  }, [rootCauseText, onActionAdd]);

  // Annuler l'ajout
  const handleCancelAdd = useCallback(() => {
    setShowAddForm(false);
  }, []);

  // Gérer la suppression
  const handleDeleteClick = useCallback((actionId) => {
     if (window.confirm("Supprimer cette action préventive ?")) {
        onActionDelete(rootCauseText, actionId); // Notifie D7Form
     }
  }, [rootCauseText, onActionDelete]);

  return (
    <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
        <Typography /* ... */ >Actions Préventives pour: "{rootCauseText}"</Typography>
        <Divider sx={{ mb: 1 }}/>

        {/* Liste des actions */}
        {actions.length > 0 ? (
            <List dense>
                {actions.map(action => (
                    <Paper key={action.id} elevation={1} sx={{ mb: 1, p: 1, borderLeft: '3px solid', borderColor: action.etat === 'Terminée' ? 'success.light' : 'secondary.light' }}> {/* Style basé sur état */}
                         <ListItem /* ... */
                            secondaryAction={ <IconButton /* ... */ onClick={() => handleDeleteClick(action.id)}><DeleteIcon/></IconButton> }
                         >
                            <ListItemText
                                primary={action.description}
                                // --- MODIFIÉ ICI ---
                                secondary={`Resp: ${action.responsable || 'N/A'} | Prévu: ${action.dateCloturePrevue || 'N/A'} | État: ${action.etat || 'N/A'}`}
                                // --- FIN MODIFICATION ---
                                primaryTypographyProps={{ sx: { fontWeight: '500', whiteSpace: 'pre-wrap' } }}
                                secondaryTypographyProps={{ sx: { fontSize: '0.8rem' } }}
                            />
                        </ListItem>
                    </Paper>
                ))}
            </List>
        ) : (
             !showAddForm && <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic', mb: 1 }}>Aucune action préventive définie.</Typography>
        )}

        {/* Formulaire d'ajout (conditionnel) */}
        {showAddForm && (
            <PreventiveActionInput
                onSave={handleSaveNewAction}
                onCancel={handleCancelAdd}
                // initialActionData={undefined} // Mode ajout explicite
            />
        )}

        {/* Bouton pour afficher le formulaire */}
        {!showAddForm && (
             <Button
                variant="outlined"
                color="secondary"
                startIcon={<AddCircleOutlineIcon />}
                onClick={() => setShowAddForm(true)}
                size="small"
                sx={{ mt: 1 }}
             >
                Ajouter une Action Préventive
             </Button>
        )}
    </Paper>
  );
};

export default PreventiveActionPlanner;