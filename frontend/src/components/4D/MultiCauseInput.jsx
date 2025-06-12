// src/components/4D/MultiCauseInput.jsx
import React, { useState } from 'react';
import {
    Box, TextField, Button, List, ListItem, ListItemText, IconButton, Typography, Divider
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteIcon from '@mui/icons-material/Delete';

const MultiCauseInput = ({ categoryKey, categoryName, causes = [], onCausesChange }) => {
    const [newCauseText, setNewCauseText] = useState('');

    const handleInputChange = (event) => {
        setNewCauseText(event.target.value);
    };

    const handleAddCause = () => {
        const trimmedText = newCauseText.trim();
        if (trimmedText && !causes.includes(trimmedText)) { // N'ajoute pas si vide ou doublon
            const updatedCauses = [...causes, trimmedText];
            onCausesChange(categoryKey, updatedCauses); // Notifie le parent
            setNewCauseText(''); // Réinitialise le champ
        } else if (causes.includes(trimmedText)) {
            console.warn(`La cause "${trimmedText}" existe déjà pour ${categoryName}.`);
            setNewCauseText('');
        }
    };

    const handleDeleteCause = (indexToDelete) => {
        const updatedCauses = causes.filter((_, index) => index !== indexToDelete);
        onCausesChange(categoryKey, updatedCauses); // Notifie le parent
    };

    const handleKeyPress = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            handleAddCause();
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
             {/* Zone d'ajout */}
             <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1}}>
                <TextField
                    label={`Ajouter une cause pour "${categoryName}"`}
                    variant="outlined"
                    size="small"
                    fullWidth
                    value={newCauseText}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    placeholder="Nouvelle cause potentielle..."
                />
                <Button
                    variant="contained"
                    size="small"
                    onClick={handleAddCause}
                    disabled={!newCauseText.trim()}
                    startIcon={<AddCircleOutlineIcon />}
                    sx={{ flexShrink: 0 }}
                >
                    Ajouter
                </Button>
             </Box>

             <Divider />

            {/* Liste des causes existantes */}
            {causes.length > 0 ? (
                 <List dense sx={{ maxHeight: 150, overflow: 'auto', p: 0 }}>
                    {causes.map((cause, index) => (
                        <ListItem
                            key={index}
                            secondaryAction={
                                <IconButton
                                    edge="end"
                                    aria-label="delete cause"
                                    onClick={() => handleDeleteCause(index)}
                                    size="small"
                                    title="Supprimer cette cause"
                                >
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            }
                             sx={{ borderBottom: '1px solid #eee', py: 0.5, px: 1 }}
                             disablePadding
                        >
                            <ListItemText primary={cause} />
                        </ListItem>
                    ))}
                </List>
            ) : (
                <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic', textAlign: 'center', py: 1 }}>
                    Aucune cause listée.
                </Typography>
            )}
        </Box>
    );
};

export default MultiCauseInput;