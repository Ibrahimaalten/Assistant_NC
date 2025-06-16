// src/components/EquipeDisplayList.jsx
import React from 'react';
import { List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, Typography, Paper, Avatar, Chip, Box } from '@mui/material';
import { Delete } from '@mui/icons-material';

const EquipeDisplayList = ({ membres, onRemove }) => {
  if (!membres || membres.length === 0) {
    return (
      <Typography variant="body2" color="textSecondary" sx={{ mt: 1, fontStyle: 'italic' }}>
        Aucun membre ajouté pour le moment.
      </Typography>
    );
  }

  return (
    <Paper elevation={2} sx={{ mt: 1, mb: 2, p: 1, bgcolor: '#f8f9fa', borderRadius: 2 }}>
      <List dense>
        {membres.map((membre, index) => (
          <ListItem key={index} divider secondaryAction={
            <IconButton
              edge="end"
              aria-label="delete"
              onClick={() => onRemove(index)}
              color="error"
              size="medium"
              sx={{ ml: 1 }}
            >
              <Delete fontSize="small" />
            </IconButton>
          }>
            <Avatar sx={{ bgcolor: '#1976d2', mr: 2 }}>
              {membre.prenom?.[0]?.toUpperCase()}{membre.nom?.[0]?.toUpperCase()}
            </Avatar>
            <ListItemText
              primary={<Typography variant="subtitle1">{membre.prenom} {membre.nom}</Typography>}
              secondary={
                membre.fonction ? (
                  <Box component="span"><Chip label={membre.fonction} size="small" color="primary" sx={{ mt: 0.5 }} /></Box>
                ) : (
                  <Typography variant="caption" color="text.secondary">Fonction non spécifiée</Typography>
                )
              }
              sx={{ ml: 1 }}
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

export default EquipeDisplayList;