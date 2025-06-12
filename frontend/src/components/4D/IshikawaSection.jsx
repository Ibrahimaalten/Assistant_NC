// src/components/4D/IshikawaSection.jsx
import React from 'react';
import { Box, Checkbox, FormControlLabel, Typography, Paper, Grid } from '@mui/material';
// Importer le nouveau composant
import MultiCauseInput from './MultiCauseInput'; // Assure-toi que le chemin est correct

const IshikawaSection = ({ problemDescription, ishikawaData, onDataChange }) => {

    // Handler pour le MultiCauseInput
    const handleCausesChange = (categoryKey, newCausesArray) => {
        onDataChange(categoryKey, 'causes', newCausesArray); // Spécifie 'causes' comme champ
    };

    // Handler pour la checkbox (inchangé)
    const handleCheckboxChange = (categoryKey, event) => {
        onDataChange(categoryKey, 'measurable', event.target.checked);
    };

    return (
        <Box>
            <Typography variant="h5" gutterBottom component="h3">
                Analyse des Causes Potentielles (5M)
            </Typography>
            <Paper elevation={1} sx={{ p: 2, mb: 3, backgroundColor: '#eef' }}>
                <Typography variant="subtitle1" gutterBottom>
                    <strong>Problème Initial :</strong> {problemDescription}
                </Typography>
            </Paper>

            <Typography variant="body1" gutterBottom sx={{ mb: 2 }}>
                Listez les causes potentielles distinctes pour chaque catégorie ci-dessous.
            </Typography>

            <Grid container spacing={3}>
                {Object.entries(ishikawaData).map(([key, value]) => (
                    <Grid item xs={12} md={6} key={key}>
                        <Paper elevation={2} sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="h6" component="label" gutterBottom sx={{ display: 'block', mb: 1 }}>
                                {value.category}
                            </Typography>

                            {/* Utiliser MultiCauseInput */}
                            <MultiCauseInput
                                categoryKey={key}
                                categoryName={value.category}
                                causes={value.causes || []} // Assurer que c'est un tableau
                                onCausesChange={handleCausesChange} // Utiliser le nouveau handler
                            />

                            {/* Checkbox poussée en bas */}
                            <Box sx={{ mt: 'auto', pt: 1 }}>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            id={`measurable-${key}`}
                                            checked={value.measurable || false} // Assurer une valeur booléenne
                                            onChange={(e) => handleCheckboxChange(key, e)}
                                            name={`measurable-${key}`}
                                            size="small"
                                        />
                                    }
                                    label="Catégorie mesurable ?"
                                />
                            </Box>
                        </Paper>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default IshikawaSection;