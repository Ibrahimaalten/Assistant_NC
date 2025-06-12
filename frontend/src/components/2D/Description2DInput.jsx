// src/components/Description2DInput.jsx
import React from 'react';
import { Grid, TextField, Typography, Box, Paper } from '@mui/material';

// Props:
// - value: objet { qui: '', quoi: '', ou: '', quand: '', comment: '', combien: '', pourquoi: '' }
// - onChange: function(fieldName, fieldValue) => void
// - errors: objet { qui: 'msg', quoi: 'msg', ... } (optionnel)
// - requiredFields: array ['quoi', 'ou', ...] (optionnel, pour afficher *)

const Description2DInput = ({
  value = {}, // Valeur par défaut
  onChange,
  errors = {}, // Erreurs par défaut
  requiredFields = ['quoi', 'ou', 'quand'] // Exemple: Rendre certains champs requis par défaut
}) => {

  // Gestionnaire de changement générique pour les champs internes
  const handleInternalFieldChange = (fieldName, fieldValue) => {
    // LOG DÉTAILLÉ ICI
    console.log(`Description2DInput: fieldName='${fieldName}', typeof fieldName='${typeof fieldName}'`);
    console.log(`Description2DInput: fieldValue='${fieldValue}', typeof fieldValue='${typeof fieldValue}'`);

    const updatedValue = {
      ...value,
      [fieldName]: fieldValue
    };
    console.log("Description2DInput - updatedValue:", updatedValue);
    onChange(updatedValue);
  };
  // Fonction helper pour vérifier si un champ est requis
  const isRequired = (fieldName) => requiredFields.includes(fieldName);

  // Définition des champs pour faciliter la boucle ou la maintenance
  const fields = [
    { name: 'qui', label: 'Qui est concerné ?', multiline: true, rows: 1 },
    { name: 'quoi', label: 'Quoi ? (Quel est le problème/défaut observé ?)', multiline: true, rows: 3 },
    { name: 'ou', label: 'Où le problème apparaît-il ? (Lieu, machine, zone)', multiline: true, rows: 2 },
    { name: 'quand', label: 'Quand le problème survient-il ? (Date, fréquence, étape du processus)', multiline: true, rows: 2 },
    { name: 'comment', label: 'Comment le problème se manifeste-t-il ? (Description des symptômes)', multiline: true, rows: 3 },
    { name: 'combien', label: 'Combien ? (Quantité, % de défauts, impact)', multiline: true, rows: 2 },
    { name: 'pourquoi', label: 'Pourquoi est-ce un problème ? (Conséquences, importance)', multiline: true, rows: 3 }
  ];

  return (
    // Utiliser Paper pour un regroupement visuel
    <Paper variant="outlined" style={{ padding: '16px' }}>
       <Typography variant="h6" gutterBottom>
         Description Détaillée du Problème (QQOQCCP)
       </Typography>
      <Grid container spacing={3}> {/* Espacement entre les champs */}
      {fields.map(field => ( // 'field' est l'objet { name: 'qui', label: 'Qui ...' }
  <Grid item xs={12} sm={6} key={field.name}>
    <TextField
      label={field.label}
      fullWidth
      variant="outlined"
      margin="dense"
      multiline
      minRows={2}
      name={field.name} // Bon à avoir pour les formulaires HTML standard
      value={value[field.name] || ''} // value est la prop, field.name est la clé string 'qui', 'quoi', etc.
      // CETTE LIGNE EST CRUCIALE :
      onChange={(e) => handleInternalFieldChange(field.name, e.target.value)}
      //                                          ^^^^^^^^^^   ^^^^^^^^^^^^^^
      //                                          Passe la     Passe la valeur
      //                                          chaîne       du champ (string)
      //                                          (ex: 'qui')
    />
  </Grid>
))}
      </Grid>
    </Paper>
  );
};

export default Description2DInput;