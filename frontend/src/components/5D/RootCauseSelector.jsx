// src/components/5D/RootCauseSelector.jsx
import React from 'react';
import { Select, MenuItem, FormControl, InputLabel, Box } from '@mui/material';

const RootCauseSelector = ({ rootCauses = [], selectedCause, onSelectCause }) => {

  const handleChange = (event) => {
    onSelectCause(event.target.value);
  };

  // N'affiche rien s'il n'y a pas de causes racines à sélectionner
  if (rootCauses.length === 0) {
    return null;
  }

  return (
    <Box sx={{ minWidth: 240, mt: 1 }}>
      <FormControl fullWidth variant="outlined"> {/* Ajout variant */}
        <InputLabel id="root-cause-select-label">Cause Racine Identifiée</InputLabel>
        <Select
          labelId="root-cause-select-label"
          id="root-cause-select"
          value={selectedCause} // Important: doit correspondre à une valeur existante ou ''
          label="Cause Racine Identifiée" // Doit correspondre à InputLabel
          onChange={handleChange}
        >
          {/* Option pour désélectionner ou pour inviter à choisir */}
          {/* <MenuItem value="" disabled={!selectedCause}>-- Sélectionnez --</MenuItem> */}

          {rootCauses.map((cause) => (
            <MenuItem key={cause} value={cause} title={cause}>
              {/* Tronquer si trop long */}
              {cause.length > 100 ? cause.substring(0, 97) + '...' : cause}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default RootCauseSelector;