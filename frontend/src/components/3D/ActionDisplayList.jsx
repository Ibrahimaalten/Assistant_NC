// src/components/ActionDisplayList.jsx
import React from 'react';
import {
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Paper,
  Chip,
  Box // Import Box for better layout control in secondary text
} from '@mui/material';
import { Delete } from '@mui/icons-material'; // Keep Edit commented if not needed now: import { Delete, Edit } from '@mui/icons-material';

/**
 * Helper function to format date strings into a readable French format.
 * Handles null, undefined, or invalid dates gracefully.
 * @param {string | Date} dateString - The date string or Date object to format.
 * @returns {string} - Formatted date or 'N/A'.
 */
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    // Create a date object. If it's already a Date object, this won't hurt.
    const date = new Date(dateString);
    // Check if the date is valid after conversion
    if (isNaN(date.getTime())) {
        return 'Date invalide';
    }
    // Format to jj/mm/aaaa
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch (e) {
    console.error("Erreur de formatage de date:", e);
    return 'Date invalide'; // Return specific error message or fallback
  }
};

/**
 * Helper function to determine the MUI Chip color based on the action status.
 * @param {string} status - The status string ('En cours', 'Terminée', etc.).
 * @returns {string} - MUI color prop value ('warning', 'success', 'default', etc.).
 */
const getStatusChipColor = (status) => {
  switch (status?.toLowerCase()) { // Use optional chaining and lowercase for robustness
    case 'terminée':
      return 'success';
    case 'en cours':
      return 'warning';
    // Add other statuses if needed
    // case 'en retard':
    //   return 'error';
    // case 'annulée':
    //   return 'secondary';
    default:
      return 'default'; // Default color for undefined or unknown status
  }
};

/**
 * Component to display a list of corrective actions.
 * @param {object} props - Component props.
 * @param {Array<object>} props.actions - Array of action objects.
 * @param {Function} props.onRemove - Function to call when removing an action (passes index).
 * @param {Function} [props.onEdit] - Optional function to call when editing an action (passes index).
 */
const ActionDisplayList = ({ actions, onRemove, onEdit }) => {

  // Display message if the list is empty or not provided
  if (!actions || actions.length === 0) {
    return (
      <Typography
        variant="body2"
        color="textSecondary"
        style={{ marginTop: 8, marginBottom: 16, fontStyle: 'italic' }} // Added marginBottom for spacing
      >
        Aucune action corrective immédiate ajoutée pour le moment.
      </Typography>
    );
  }

  return (
    // Use Paper for visual grouping and elevation
    <Paper elevation={1} style={{ marginTop: 8, marginBottom: 16 }}>
      <List dense> {/* 'dense' makes the list items more compact */}
        {actions.map((action, index) => (
          <ListItem key={index} divider> {/* 'divider' adds a line between items */}
            <ListItemText
              primary={action.description || "Action non décrite"} // Main action text
              secondary={
                // Use Box for better structure and potential future styling of secondary info
                <Box component="span" sx={{ display: 'block', fontSize: '0.85rem', marginTop: '4px' }}>
                  <span>Resp: <strong>{action.responsable || 'N/A'}</strong></span>
                  <br /> {/* Line break for clarity */}
                  <span>Lancée le: {formatDate(action.dateLancement)}</span>
                  <span style={{ margin: '0 8px' }}>|</span> {/* Separator */}
                  <span>Clôture prévue le: {formatDate(action.dateCloturePrevue)}</span>
                </Box>
              }
            />

            {/* Status Chip - Placed before secondary actions for better flow */}
            <Chip
              label={action.etat || 'Non défini'}
              color={getStatusChipColor(action.etat)}
              size="small"
              sx={{ marginRight: '55px', verticalAlign: 'middle' }} // Adjust margin to prevent overlap with buttons
            />

            {/* Secondary actions (Edit/Delete) */}
            <ListItemSecondaryAction>
              {/* Optional Edit Button - Uncomment if needed */}
              {/* {onEdit && (
                <IconButton
                  edge="end" // Positions nicely with another button
                  aria-label="edit"
                  onClick={() => onEdit(index)}
                  size="small"
                  sx={{ marginRight: 0.5 }} // Space between edit and delete
                >
                  <Edit fontSize="small" />
                </IconButton>
              )} */}
              <IconButton
                edge="end"
                aria-label="delete"
                onClick={() => onRemove(index)}
                color="error" // Red color for delete
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

export default ActionDisplayList;