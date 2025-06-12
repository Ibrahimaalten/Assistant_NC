// src/components/EquipeDisplayList.jsx
import React from 'react';
import { List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, Typography, Paper } from '@mui/material';
import { Delete } from '@mui/icons-material';

const EquipeDisplayList = ({ membres, onRemove }) => {
  if (!membres || membres.length === 0) {
    return (
      <Typography variant="body2" color="textSecondary" style={{ marginTop: 8, fontStyle: 'italic' }}>
        Aucun membre ajouté pour le moment.
      </Typography>
    );
  }

  return (
    <Paper elevation={1} style={{ marginTop: 8, marginBottom: 16 }}>
      <List dense>
        {membres.map((membre, index) => (
          <ListItem key={index} divider>
            <ListItemText
              primary={`${membre.prenom} ${membre.nom}`}
              secondary={membre.fonction || 'Fonction non spécifiée'}
            />
            <ListItemSecondaryAction>
              <IconButton
                edge="end"
                aria-label="delete"
                onClick={() => onRemove(index)}
                color="error"
                size="small"
              >
                <Delete fontSize="small" />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

export default EquipeDisplayList;