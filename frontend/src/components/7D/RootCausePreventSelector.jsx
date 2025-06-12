// src/components/7D/RootCausePreventSelector.jsx
import React from 'react';
import { Box, FormGroup, FormControlLabel, Checkbox, Typography } from '@mui/material';

const RootCausePreventSelector = ({
  allRootCauses = [], // Tableau des causes racines identifiées en D5
  selectedCauses = [], // Tableau des causes sélectionnées pour D7
  onSelectionChange // Callback (cause: string, isSelected: boolean) => void
}) => {

  const handleCheckboxChange = (event) => {
    const { name, checked } = event.target;
    onSelectionChange(name, checked); // Notifie le parent du changement
  };

  if (allRootCauses.length === 0) {
    return (
      <Typography color="textSecondary" sx={{ fontStyle: 'italic' }}>
        Aucune cause racine identifiée dans les étapes précédentes à sélectionner pour la prévention.
      </Typography>
    );
  }

  return (
    <Box>
      <Typography variant="body2" gutterBottom>
        Cochez les causes racines pour lesquelles des actions préventives systémiques seront mises en place :
      </Typography>
      <FormGroup>
        {allRootCauses.map((cause) => (
          <FormControlLabel
            key={cause}
            control={
              <Checkbox
                checked={selectedCauses.includes(cause)} // Vérifie si la cause est dans le tableau des sélections
                onChange={handleCheckboxChange}
                name={cause} // Utilise le texte de la cause comme identifiant unique
              />
            }
            label={cause}
            sx={{ borderBottom: '1px solid #eee', pb: 0.5 }} // Style léger pour séparer
          />
        ))}
      </FormGroup>
    </Box>
  );
};

export default RootCausePreventSelector;