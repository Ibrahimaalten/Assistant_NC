// src/components/6D/ActionImplementationList.jsx
import React from 'react';
import { Box, Typography, Grid, TextField, Select, MenuItem, FormControl, InputLabel, Paper, Divider } from '@mui/material';

const ActionImplementationList = ({ actionsByRootCause = {}, onActionUpdate }) => {

    // Handler générique pour les changements dans les champs d'une action
    const handleFieldChange = (rootCause, actionId, fieldName, value) => {
        onActionUpdate(rootCause, actionId, { [fieldName]: value });
    };

    // Convertir l'objet en tableau pour pouvoir mapper et vérifier s'il est vide
    const rootCauseEntries = Object.entries(actionsByRootCause);

    if (rootCauseEntries.length === 0) {
        return <Typography color="textSecondary">Aucune action à suivre.</Typography>;
    }

    return (
        <Box sx={{ mt: 1 }}>
            {rootCauseEntries.map(([rootCause, actions = []]) => (
                <Box key={rootCause} sx={{ mb: 3 }}>
                    {/* Afficher la cause racine comme titre de section */}
                    <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
                        Cause Racine: <span style={{ fontStyle: 'italic' }}>{rootCause}</span>
                    </Typography>
                    <Divider sx={{ mb: 1 }} />
                    {actions.length === 0 ? (
                        <Typography variant="caption" color="textSecondary">Aucune action définie pour cette cause.</Typography>
                    ) : (
                        actions.map((action) => (
                            <Paper key={action.id} variant="outlined" sx={{ p: 1.5, mb: 1.5 }}>
                                <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                                    {action.description || "Action non décrite"}
                                </Typography>
                                <Grid container spacing={2} alignItems="center">
                                    {/* Colonne Infos D5 (rappel) */}
                                    <Grid item xs={12} sm={4}>
                                        <Typography variant="caption" display="block">Responsable: {action.responsable || 'N/A'}</Typography>
                                        <Typography variant="caption" display="block">Clôture Prévue: {action.dateCloturePrevue || 'N/A'}</Typography>
                                    </Grid>

                                    {/* Colonne Statut & Dates D6 (éditable) */}
                                    <Grid item xs={12} sm={8}>
                                        <Grid container spacing={1} alignItems="center">
                                            <Grid item xs={12} md={4}>
                                                <FormControl fullWidth size="small" margin="dense">
                                                    <InputLabel id={`etat-impl-${action.id}-label`}>État Impl.</InputLabel>
                                                    <Select
                                                        labelId={`etat-impl-${action.id}-label`}
                                                        id={`etat-impl-${action.id}`}
                                                        name="etatImplementation"
                                                        value={action.etatImplementation || 'A définir'}
                                                        label="État Impl."
                                                        onChange={(e) => handleFieldChange(rootCause, action.id, 'etatImplementation', e.target.value)}
                                                    >
                                                        <MenuItem value="A définir">A définir</MenuItem>
                                                        <MenuItem value="En cours">En cours</MenuItem>
                                                        <MenuItem value="Terminée">Terminée</MenuItem>
                                                        <MenuItem value="Bloquée">Bloquée</MenuItem>
                                                        <MenuItem value="Annulée">Annulée</MenuItem>
                                                    </Select>
                                                </FormControl>
                                            </Grid>
                                            <Grid item xs={6} md={4}>
                                                 <TextField
                                                    label="Date Impl. Réelle"
                                                    name="dateImplementationReelle"
                                                    type="date"
                                                    size="small"
                                                    margin="dense"
                                                    value={action.dateImplementationReelle || ''}
                                                    onChange={(e) => handleFieldChange(rootCause, action.id, 'dateImplementationReelle', e.target.value)}
                                                    fullWidth
                                                    InputLabelProps={{ shrink: true }}
                                                />
                                            </Grid>
                                             <Grid item xs={6} md={4}>
                                                 <TextField
                                                    label="Date Clôture Réelle"
                                                    name="dateClotureReelle"
                                                    type="date"
                                                    size="small"
                                                    margin="dense"
                                                    value={action.dateClotureReelle || ''}
                                                    onChange={(e) => handleFieldChange(rootCause, action.id, 'dateClotureReelle', e.target.value)}
                                                    fullWidth
                                                    InputLabelProps={{ shrink: true }}
                                                     // Optionnel: désactiver si l'état n'est pas 'Terminée'
                                                    // disabled={action.etatImplementation !== 'Terminée'}
                                                />
                                            </Grid>
                                            {/* Optionnel: Champ pour preuves */}
                                            {/* <Grid item xs={12}>
                                                <TextField label="Preuves (lien/réf.)" name="preuvesLien" size="small" margin="dense" value={action.preuvesLien || ''} onChange={(e) => handleFieldChange(rootCause, action.id, 'preuvesLien', e.target.value)} fullWidth />
                                            </Grid> */}
                                        </Grid>
                                    </Grid>
                                </Grid>
                            </Paper>
                        ))
                    )}
                </Box>
            ))}
        </Box>
    );
};

export default ActionImplementationList;