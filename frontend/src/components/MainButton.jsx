// Bouton centralisé pour l'app (couleurs cohérentes, texte blanc, hover)
import React from 'react';
import { Button } from '@mui/material';
import { COLORS } from '../colors';

const MainButton = ({ children, color = 'primary', sx = {}, ...props }) => {
  let bg, hoverBg;
  if (color === 'primary') {
    bg = COLORS.primaryDark;
    hoverBg = COLORS.accentBlue;
  } else if (color === 'success') {
    bg = COLORS.accentGreen;
    hoverBg = '#27ae60';
  } else if (color === 'danger') {
    bg = COLORS.error;
    hoverBg = '#b71c1c';
  } else {
    bg = COLORS.primaryDark;
    hoverBg = COLORS.accentBlue;
  }
  return (
    <Button
      variant="contained"
      sx={{
        background: bg,
        color: COLORS.white,
        fontWeight: 600,
        borderRadius: 2,
        boxShadow: '0 2px 8px #e3eafc',
        '&:hover': { background: hoverBg },
        ...sx
      }}
      {...props}
    >
      {children}
    </Button>
  );
};

export default MainButton;
