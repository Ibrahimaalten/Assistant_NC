// src/components/4D/FiveWhysSection.jsx
import React, { useState, useEffect } from 'react';
import {
    Box, TextField, Select, MenuItem, FormControl, InputLabel,
    Typography, Paper, Grid, List, ListItem, ListItemText, Divider,
    IconButton, ListItemSecondaryAction, Button,
    Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, ListItemButton, Chip // Ajout Chip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'; // Icône pour cause racine

// Accepter onWhyChange, onRootCauseChange, et onDeleteWhy
const FiveWhysSection = ({
    potentialCauses,
    fiveWhysData,
    onFiveWhysChange, // <- nom attendu
    onFiveWhysRootCauseChange, // <- nom attendu
    onDeleteFiveWhys // <- nom attendu
}) => {
    const [selectedCause, setSelectedCause] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [causeToDelete, setCauseToDelete] = useState(null);

    // Gère la sélection initiale/changement de cause
    useEffect(() => {
        const firstAvailableCause = potentialCauses.length > 0 ? potentialCauses[0] : '';
        if (!selectedCause && firstAvailableCause) {
            setSelectedCause(firstAvailableCause);
        } else if (selectedCause && !potentialCauses.includes(selectedCause)) {
            setSelectedCause(firstAvailableCause); // Réinitialise si la cause sélectionnée disparaît
        }
    }, [potentialCauses, selectedCause]);

    // Handler LOCAL qui appelle la prop onFiveWhysChange
    const handleWhyChange = (whyIndex, event) => {
        if (selectedCause && onFiveWhysChange) {
            onFiveWhysChange(selectedCause, whyIndex, event.target.value);
        }
    };

    // Handler LOCAL qui appelle la prop onFiveWhysRootCauseChange
    const handleRootCauseInputChange = (event) => {
        if (selectedCause && onFiveWhysRootCauseChange) {
            onFiveWhysRootCauseChange(selectedCause, event.target.value);
        }
    };

    // Autres handlers (sélection, dialogue suppression)
    const handleSelectCause = (event) => setSelectedCause(event.target.value);
    const handleSelectCauseFromRecap = (cause) => setSelectedCause(cause);
    const openDeleteConfirmDialog = (cause) => {
        setCauseToDelete(cause);
        setDialogOpen(true);
    };
    const handleCloseDialog = () => {
        setDialogOpen(false);
        setCauseToDelete(null);
    };
    const handleConfirmDelete = () => {
        if (causeToDelete && onDeleteFiveWhys) {
            onDeleteFiveWhys(causeToDelete);
        }
        handleCloseDialog();
    };

    // Extraction des données pour la cause sélectionnée, avec structure par défaut
    const currentEntry = fiveWhysData[selectedCause] || { whys: Array(5).fill(''), rootCause: '' };
    const currentWhys = currentEntry.whys;
    const currentRootCause = currentEntry.rootCause;

    // Helper pour filtrer le récapitulatif
    const hasContent = (entry) => {
        return (entry.whys && entry.whys.some(w => w?.trim())) || (entry.rootCause && entry.rootCause.trim());
    };

    return (
        <Box>
            <Typography variant="h5" gutterBottom component="h3">
                Analyse Approfondie (5 Pourquoi)
            </Typography>

            {potentialCauses.length === 0 ? (
                <Typography color="textSecondary">
                    Veuillez renseigner des causes dans la section 5M.
                </Typography>
            ) : (
                <Grid container spacing={3}>
                    {/* Colonne Formulaire (Gauche) */}
                    <Grid item xs={12} md={6}>
                        <Paper elevation={2} sx={{ p: 2 }}>
                            {/* Selecteur de cause */}
                            <FormControl fullWidth sx={{ mb: 3 }}>
                                <InputLabel id="cause-select-label">Cause potentielle à analyser</InputLabel>
                                <Select
                                    labelId="cause-select-label"
                                    id="cause-select"
                                    value={selectedCause}
                                    label="Cause potentielle à analyser"
                                    onChange={handleSelectCause}
                                >
                                    {potentialCauses.map(cause => (
                                        <MenuItem key={cause} value={cause} title={cause}> {/* Ajout title */}
                                            {cause.length > 80 ? cause.substring(0, 77) + '...' : cause}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {/* Affichage si une cause est sélectionnée */}
                            {selectedCause && (
                                <Box>
                                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                                        Analyse pour : "{selectedCause}"
                                    </Typography>
                                    {/* Champs Pourquoi */}
                                    {Array(5).fill(0).map((_, index) => (
                                        <TextField
                                            key={index} id={`why-${index}`} label={`Pourquoi ${index + 1} ?`}
                                            fullWidth variant="outlined" value={currentWhys[index]}
                                            onChange={(e) => handleWhyChange(index, e)}
                                            sx={{ mb: 2 }}
                                            placeholder={`Réponse au ${index + 1}ème pourquoi...`}
                                        />
                                    ))}

                                    <Divider sx={{ my: 2 }} />

                                    {/* Champ Cause Racine */}
                                    <TextField
                                        id="rootCause"
                                        label="Cause Racine Identifiée"
                                        placeholder="Conclusion finale de l'analyse des 'Pourquoi'..."
                                        fullWidth
                                        multiline
                                        rows={2}
                                        variant="outlined"
                                        value={currentRootCause}
                                        onChange={handleRootCauseInputChange}
                                        sx={{ mt: 1, backgroundColor: '#f0f4f8' }}
                                    />
                                </Box>
                            )}
                            {/* Message si aucune cause n'est sélectionnée */}
                            {!selectedCause && potentialCauses.length > 0 && (
                                <Typography color="textSecondary">Sélectionnez une cause ci-dessus ou dans le récapitulatif.</Typography>
                             )}
                        </Paper>
                    </Grid>

                    {/* Colonne Récapitulatif (Droite) */}
                    <Grid item xs={12} md={6}>
                        <Paper elevation={1} sx={{ p: 2, backgroundColor: '#f9f9f9', height: '100%' }}>
                            <Typography variant="h6" gutterBottom>
                                Récapitulatif des Analyses 5P
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                            {Object.keys(fiveWhysData).filter(key => hasContent(fiveWhysData[key])).length === 0 && ( // Vérifie s'il y a du contenu à afficher
                                <Typography color="textSecondary">Aucune analyse avec contenu.</Typography>
                            )}
                            <List dense>
                                {Object.entries(fiveWhysData)
                                    .filter(([_, entry]) => hasContent(entry)) // Filtre basé sur le contenu
                                    .map(([cause, entry]) => ( // entry = { whys: [], rootCause: '' }
                                        <ListItem
                                            key={cause}
                                            disablePadding
                                            secondaryAction={onDeleteFiveWhys &&
                                                <IconButton edge="end" aria-label="delete" onClick={() => openDeleteConfirmDialog(cause)} title={`Supprimer "${cause}"`}>
                                                    <DeleteIcon />
                                                </IconButton>
                                            }
                                            sx={{ mb: 1, border: '1px dashed #ccc', bgcolor: selectedCause === cause ? '#e3f2fd' : 'transparent', '&:hover': { bgcolor: selectedCause !== cause ? '#eee' : '#e3f2fd' } }}
                                        >
                                            <ListItemButton onClick={() => handleSelectCauseFromRecap(cause)} sx={{ alignItems: 'flex-start', flexDirection: 'column', pr: 6 /* Espace pour bouton */ }}>
                                                {/* Titre de la cause */}
                                                <ListItemText primaryTypographyProps={{ fontWeight: 'bold', noWrap: true }} primary={cause} title={cause} />
                                                {/* Liste des Pourquoi remplis */}
                                                <List dense disablePadding sx={{ pl: 0, width: '100%' }}>
                                                    {entry.whys.map((why, index) => (
                                                        why?.trim() ? ( // Vérifie si 'why' existe et n'est pas vide
                                                            <ListItem key={`why-${index}`} disableGutters sx={{ p:0 }}>
                                                                <ListItemText secondary={`P${index + 1}: ${why.trim()}`} secondaryTypographyProps={{ noWrap: true, variant: 'body2', color: 'textSecondary' }} title={why.trim()} />
                                                            </ListItem>
                                                        ) : null
                                                    ))}
                                                </List>
                                                {/* Affichage de la Cause Racine si elle existe */}
                                                {entry.rootCause?.trim() && (
                                                     <Chip
                                                         icon={<CheckCircleOutlineIcon fontSize="small"/>}
                                                         label={`Racine: ${entry.rootCause.trim()}`}
                                                         size="small"
                                                         color="success"
                                                         variant="outlined"
                                                         sx={{ mt: 1, maxWidth: '100%', height: 'auto', '& .MuiChip-label': { display: 'block', whiteSpace: 'normal', overflowWrap: 'break-word' } }} // Permet au chip de s'étendre sur plusieurs lignes si nécessaire
                                                         title={entry.rootCause.trim()}
                                                     />
                                                )}
                                            </ListItemButton>
                                        </ListItem>
                                    ))}
                            </List>
                        </Paper>
                    </Grid>
                </Grid>
            )}

            {/* Dialogue de Confirmation */}
            <Dialog open={dialogOpen} onClose={handleCloseDialog}>
                <DialogTitle>Confirmer la suppression</DialogTitle>
                <DialogContent><DialogContentText>Supprimer l'analyse 5P pour : "{causeToDelete}" ?</DialogContentText></DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Annuler</Button>
                    <Button onClick={handleConfirmDelete} color="error" autoFocus>Supprimer</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default FiveWhysSection;