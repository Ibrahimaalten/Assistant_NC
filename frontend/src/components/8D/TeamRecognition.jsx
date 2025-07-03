// src/components/8D/TeamRecognition.jsx
import React, { useState } from 'react';
import {
    Box, Typography, TextField, Button, List, ListItem, ListItemText,
    ListItemIcon, Avatar, CircularProgress, Alert, Grid
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import EmailIcon from '@mui/icons-material/Email'; // Pour l'avatar

// Helper pour générer des initiales ou utiliser une icône
const stringToColor = (string) => {
  let hash = 0;
  for (let i = 0; i < string.length; i += 1) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }
  return color;
};

const stringAvatar = (name) => {
  if (!name || typeof name !== 'string') return {
    sx: { bgcolor: '#888', width: 32, height: 32, fontSize: '0.8rem' },
    children: '?',
  };
  const nameParts = name.split(' ');
  return {
    sx: {
      bgcolor: stringToColor(name),
      width: 32,
      height: 32,
      fontSize: '0.8rem'
    },
    children: nameParts.length > 1 ? `${nameParts[0][0]}${nameParts[1][0]}` : name[0],
  };
};


const TeamRecognition = ({
    teamMembers = [], // Attendu : [{ name: 'Nom Prenom', email: '...' }, ...]
    onSendEmails, // Fonction pour déclencher l'envoi (simulation)
    emailStatus = '' // '', 'sending', 'sent', 'error'
}) => {
    const [message, setMessage] = useState(`Chère équipe,\n\nMerci pour votre engagement et votre excellent travail sur ce projet 8D concernant [rappeler brièvement le problème].\n\nGrâce à vos efforts collectifs, nous avons réussi à [mentionner 1-2 succès clés].\n\nCordialement,\n[Votre Nom/Service]`);

    const handleSendClick = () => {
        if (onSendEmails) {
            onSendEmails(message, teamMembers.map(m => m.email)); // Passe le message et les emails
        }
    };

    return (
        <Box>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium', mb: 2 }}>
                Remerciements à l'Équipe
            </Typography>

            <Grid container spacing={2}>
                {/* Liste des membres */}
                <Grid item xs={12} md={4}>
                     <Typography variant="body2" gutterBottom>Membres de l'équipe contributeurs :</Typography>
                     {teamMembers.length > 0 ? (
                        <List dense>
                            {teamMembers.map((member, index) => {
                              // Supporte string (nom/email) ou objet {name, email}
                              const displayName = typeof member === 'string' ? member : member.name || member.email || '?';
                              const displayEmail = typeof member === 'string' ? '' : member.email || '';
                              return (
                                <ListItem key={index} disablePadding sx={{mb: 0.5}}>
                                    <ListItemIcon sx={{minWidth: 'auto', mr: 1.5}}>
                                        <Avatar {...stringAvatar(displayName)} />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={displayName}
                                        secondary={displayEmail || 'Email non fourni'}
                                        primaryTypographyProps={{ variant: 'body2', fontWeight: '500' }}
                                        secondaryTypographyProps={{ variant: 'caption' }}
                                    />
                                </ListItem>
                              );
                            })}
                        </List>
                     ) : (
                         <Typography variant="caption" color="textSecondary">Aucun membre d'équipe fourni.</Typography>
                     )}
                </Grid>

                 {/* Zone de message et bouton d'envoi */}
                <Grid item xs={12} md={8}>
                     <TextField
                        id="recognitionMessage"
                        label="Message de remerciement (sera simulé par email)"
                        fullWidth
                        multiline
                        rows={6}
                        variant="outlined"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Rédigez votre message de reconnaissance ici..."
                        sx={{ mb: 1 }}
                     />
                     <Button
                        variant="contained"
                        color="secondary"
                        startIcon={emailStatus === 'sending' ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                        onClick={handleSendClick}
                        disabled={emailStatus === 'sending' || teamMembers.length === 0}
                     >
                        {emailStatus === 'sending' ? 'Envoi en cours...' : 'Envoyer Remerciements (Simulation)'}
                     </Button>

                     {/* Affichage du statut */}
                     {emailStatus === 'sent' && (
                         <Alert severity="success" sx={{ mt: 1 }}>Simulation d'envoi d'email réussie !</Alert>
                     )}
                     {emailStatus === 'error' && (
                         <Alert severity="error" sx={{ mt: 1 }}>Échec de la simulation d'envoi d'email.</Alert>
                     )}
                </Grid>
            </Grid>
        </Box>
    );
};

export default TeamRecognition;