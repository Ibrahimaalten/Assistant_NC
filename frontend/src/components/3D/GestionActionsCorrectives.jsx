// src/components/GestionActions3D.jsx
import React, { useState } from 'react';
import { Grid, Typography, Button } from '@mui/material';
import { Add } from '@mui/icons-material';
import ActionDisplayList from './ActionDisplayList'; // Component to display the list
import ActionAddForm from './ActionAddForm';       // Component for the add form

/**
 * Component to manage the list of immediate corrective actions (3D).
 * It handles displaying the list, adding new actions, and removing actions.
 * It orchestrates the interaction between ActionDisplayList and ActionAddForm.
 *
 * @param {object} props - Component props.
 * @param {Array<object>} props.actions3D - The current array of action objects from the parent's state (e.g., formData.actions3D).
 * @param {Function} props.setFormData - The state setter function from the parent component to update the entire formData object.
 */
const GestionActions3D = ({ actions = [], onActionsChange }) => { // Remplace setFormData par onActionsChange (callback)

  // Define the initial state for a new action form
  const initialNewActionState = {
    description: '',
    dateLancement: '',        // Store dates as strings in 'YYYY-MM-DD' format if using <input type="date">
    dateCloturePrevue: '',    // Or as null/Date objects if using MUI X Date Pickers
    responsable: '',
    etat: 'En cours' // Default state when adding a new action
  };

  // State for the action currently being added/edited
  const [newAction, setNewAction] = useState(initialNewActionState);
  // State to control the visibility of the add form
  const [isAddingAction, setIsAddingAction] = useState(false);

  /**
   * Handles changes in the input fields of the ActionAddForm.
   * Updates the corresponding field in the local 'newAction' state.
   * @param {string} field - The name of the field being changed (e.g., 'description', 'responsable').
   * @param {string | Date | null} value - The new value of the field.
   */
  const handleNewActionChange = (field, value) => {
    setNewAction(prevAction => ({
      ...prevAction,
      [field]: value
    }));
  };

  /**
   * Saves the new action (from local state 'newAction') into the parent's formData state.
   * Performs basic validation before saving.
   * Resets the form and hides it after successful save.
   */
  const handleSaveNewAction = () => {
    // --- Basic Validation (can be enhanced) ---
    if (!newAction.description?.trim() || !newAction.responsable?.trim() || !newAction.dateLancement || !newAction.dateCloturePrevue || !newAction.etat) {
      alert("Veuillez remplir tous les champs requis pour l'action.");
      return;
    }
     // Simple date validation: clôture >= lancement
     if (newAction.dateLancement && newAction.dateCloturePrevue) {
        try {
            const startDate = new Date(newAction.dateLancement);
            const endDate = new Date(newAction.dateCloturePrevue);
             // Check if dates are valid before comparing
            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                 alert("Une des dates saisies est invalide.");
                 return;
             }
             if (endDate < startDate) {
                alert("La date de clôture prévue ne peut pas être antérieure à la date de lancement.");
                return;
            }
        } catch (e) {
             alert("Erreur lors de la validation des dates.");
             return;
        }
     }
    // --- End Validation ---


    // Ajoute la nouvelle action à la liste et notifie le parent
    onActionsChange([...actions, { ...newAction }]);

    // Reset the form to initial state and hide it
    setNewAction(initialNewActionState);
    setIsAddingAction(false);
  };

  /**
   * Cancels the addition of a new action.
   * Resets the form and hides it.
   */
  const handleCancelAdd = () => {
    setNewAction(initialNewActionState); // Reset fields
    setIsAddingAction(false);          // Hide form
  };

  /**
   * Removes an action from the list in the parent's formData state.
   * @param {number} indexToRemove - The index of the action to remove.
   */
  const handleRemoveAction = (indexToRemove) => {
    const updatedActions = actions.filter((_, idx) => idx !== indexToRemove);
    onActionsChange(updatedActions);
  };

  // --- Optional: Add Edit Functionality ---
  // const handleEditAction = (indexToEdit) => {
  //   // 1. Set the 'newAction' state with the data of the action to edit
  //   setNewAction({ ...(actions3D[indexToEdit] || initialNewActionState) });
  //   // 2. Set a flag or store the index being edited (e.g., in another state variable)
  //   // setEditingIndex(indexToEdit);
  //   // 3. Show the form
  //   setIsAddingAction(true); // Reuse the same form/state, maybe change button text later
  //   // 4. Adapt handleSaveNewAction to UPDATE the item at editingIndex instead of adding
  // };
  // --- End Optional Edit ---

  return (
    <Grid container spacing={2}> {/* Container for the whole section */}
      {/* Title and List Display */}
      <Grid item xs={12}>
        <ActionDisplayList
          actions={actions}
          onRemove={handleRemoveAction}
        />
      </Grid>

      {/* Add Form or Add Button */}
      <Grid item xs={12}>
        {isAddingAction ? (
          // Display the form if 'isAddingAction' is true
          <ActionAddForm
            actionData={newAction}        // Current data for the form fields
            onChange={handleNewActionChange} // Function to update form data
            onSave={handleSaveNewAction}     // Function to save the action
            onCancel={handleCancelAdd}       // Function to cancel adding
          />
        ) : (
          // Display the button to open the form if 'isAddingAction' is false
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={() => setIsAddingAction(true)} // Show the form on click
            style={{ marginTop: 8 }} // Add some space above the button
          >
            Ajouter une action immédiate
          </Button>
        )}
      </Grid>
    </Grid>
  );
};

export default GestionActions3D;