// src/components/D8Form.jsx
import React, { useState, useMemo, useCallback } from 'react';
import { Box, TextField, Button, Typography, Grid, Paper, Divider } from '@mui/material';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import SaveIcon from '@mui/icons-material/Save';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { useParams } from 'react-router-dom';

// Importer le nouveau composant
import TeamRecognition from '../components/8D/TeamRecognition'; // Ajuster le chemin si nécessaire
import { useForm8D } from "../contexts/Form8DContext";
import MainButton from '../components/MainButton';

// --- Props Attendues ---
// activeTabIndex, totalTabs, onNavigate, tabKeyLabel: Navigation
// teamData: Données sur l'équipe (ex: [{ name: '...', email: '...' }, ...]) venant de D1 ou d'un état global
// onSaveD8: Callback pour sauvegarder les données finales D8
// ----------------------

function D8Form({
    tabKeyLabel,
    teamData = [],
    onSaveD8
}) {
    const { setCurrentStepKey, currentStepKey, form8DData, updateFormField, updateSectionData } = useForm8D();
    const { id } = useParams();

    // --- DONNÉES D'ÉQUIPE VIDES PAR DÉFAUT ---
    const currentTeam = teamData && teamData.length > 0 ? teamData : [];
    // ------------------------------------------------------------------

    // --- Champs du contexte D8 ---
    const d8Section = form8DData.d8_congratulate || {};
    const [emailStatus, setEmailStatus] = useState(''); // '', 'sending', 'sent', 'error'
    const [recognitionMessageForSave, setRecognitionMessageForSave] = useState(''); // Pour sauvegarder le dernier message envoyé
    const [errors, setErrors] = useState({});

    // --- Gestion dynamique des membres d'équipe (contexte) ---
    const teamMembers = d8Section.teamAcknowledged || [];
    const [newMember, setNewMember] = useState({ name: '', email: '' });

    // --- Handlers synchronisés avec le contexte ---
    const handleInputChange = (event) => {
        const { name, value } = event.target;
        updateFormField('d8_congratulate', name, value);
        if (errors[name]) {
            setErrors(prevErrors => ({ ...prevErrors, [name]: undefined }));
        }
    };

    // Ajout d'un membre
    const handleAddMember = () => {
      if (!newMember.name.trim() || !newMember.email.trim()) return;
      const updatedMembers = [...teamMembers, { ...newMember }];
      updateFormField('d8_congratulate', 'teamAcknowledged', updatedMembers);
      setNewMember({ name: '', email: '' });
    };
    // Suppression d'un membre
    const handleDeleteMember = (index) => {
      const updatedMembers = teamMembers.filter((_, i) => i !== index);
      updateFormField('d8_congratulate', 'teamAcknowledged', updatedMembers);
    };

    // --- Simulation d'envoi d'email (appelée par TeamRecognition) ---
    const handleSendEmails = useCallback((message, recipients) => {
        setEmailStatus('sending'); // Affiche le spinner
        setRecognitionMessageForSave(message); // Sauvegarde le message qui va être "envoyé"

        // Simule un délai réseau
        setTimeout(() => {
            // Simule un succès ou un échec aléatoire (pour l'exemple)
            const success = Math.random() > 0.1; // 90% de succès
            if (success) {
                console.log("Simulation d'envoi réussie !");
                setEmailStatus('sent');
            } else {
                console.error("Simulation d'envoi échouée !");
                setEmailStatus('error');
            }
            // Réinitialise le statut après quelques secondes pour pouvoir renvoyer
            setTimeout(() => setEmailStatus(''), 3000);
        }, 1500); // Délai de 1.5 secondes
    }, []); // Pas de dépendances nécessaires ici


   // --- Validation D8 ---
   const validateForm = () => {
    let tempErrors = {};
    if (!d8Section.resumeResultats || !d8Section.resumeResultats.trim()) tempErrors.resumeResultats = "Un résumé des résultats est requis.";
    if (!d8Section.leconsApprises || !d8Section.leconsApprises.trim()) tempErrors.leconsApprises = "Les leçons apprises doivent être documentées.";
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  // --- Gestionnaire de Sauvegarde vers l'API ---
  const [apiStatus, setApiStatus] = useState(null); // Pour feedback utilisateur

  const handleSubmitToAPI = async () => {
      if (!validateForm()) return;
      setApiStatus(null);
      try {
          const method = id ? 'PUT' : 'POST';
          const url = id ? `/api/nonconformites/${id}` : '/api/nonconformites';
          // Correction : transformer teamAcknowledged en liste de chaînes (ex: noms)
          const { currentStepKey, ...dataToSave } = form8DData;
          if (dataToSave.d8_congratulate && Array.isArray(dataToSave.d8_congratulate.teamAcknowledged)) {
            dataToSave.d8_congratulate = {
              ...dataToSave.d8_congratulate,
              teamAcknowledged: dataToSave.d8_congratulate.teamAcknowledged.map(m => typeof m === 'string' ? m : (m.name || m.email || JSON.stringify(m)))
            };
          }
          const response = await fetch(url, {
              method,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(dataToSave),
          });
          if (response.ok) {
              setApiStatus('success');
          } else {
              setApiStatus('error');
          }
      } catch (error) {
          setApiStatus('error');
      }
  };

  // Handler pour clôturer la non-conformité
  const handleCloseAndResolve = async () => {
      if (!validateForm()) return;
      setApiStatus(null);
      try {
          const method = id ? 'PUT' : 'POST';
          const url = id ? `/api/nonconformites/${id}` : '/api/nonconformites';
          const { currentStepKey, ...dataToSave } = form8DData;
          // Correction teamAcknowledged : liste de chaînes (nom ou email)
          if (dataToSave.d8_congratulate && Array.isArray(dataToSave.d8_congratulate.teamAcknowledged)) {
            dataToSave.d8_congratulate = {
              ...dataToSave.d8_congratulate,
              teamAcknowledged: dataToSave.d8_congratulate.teamAcknowledged.map(m => typeof m === 'string' ? m : (m.name || m.email || JSON.stringify(m)))
            };
          }
          // Met à jour le statut
          dataToSave.statut = 'Résolue';
          const response = await fetch(url, {
              method,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(dataToSave),
          });
          if (response.ok) {
              setApiStatus('success');
          } else {
              setApiStatus('error');
          }
      } catch (error) {
          setApiStatus('error');
      }
  };

    const handleSaveAndClose = () => {
        handleSubmitToAPI();
    };

    const stepsOrder = [
      'd0_initialisation',
      'd1_team',
      'd2_problem',
      'd3_containment',
      'd4_rootcause',
      'd5_correctiveactions',
      'd6_implementvalidate',
      'd7_preventrecurrence',
      'd8_congratulate'
    ];
    const currentIndex = stepsOrder.indexOf(currentStepKey);

    const handlePrevious = () => {
      if (currentIndex > 0) {
        setCurrentStepKey(stepsOrder[currentIndex - 1]);
        window.scrollTo(0, 0);
      }
    };

    const handleNext = () => {
      if (currentIndex < stepsOrder.length - 1) {
        setCurrentStepKey(stepsOrder[currentIndex + 1]);
        window.scrollTo(0, 0);
      }
    };

  // --- Rendu ---
  return (
    <Box component="div" sx={{ p: 2 }}> {/* Pas de <form> */}
      <Typography variant="h6" gutterBottom>
        D8 - Félicitations de l'Équipe et Clôture du 8D
      </Typography>
      <Grid container spacing={3}>

        {/* Section Résumé et Leçons */}
        <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>Synthèse Finale</Typography>
                 <TextField required fullWidth id="resumeResultats" name="resumeResultats" label="Résumé des résultats et succès" multiline rows={4} variant="outlined" value={d8Section.resumeResultats || ''} onChange={handleInputChange} error={!!errors.resumeResultats} helperText={errors.resumeResultats || "Succès clés du projet 8D."} sx={{ mb: 2 }} />
                 <TextField required fullWidth id="leconsApprises" name="leconsApprises" label="Leçons Apprises" multiline rows={4} variant="outlined" value={d8Section.leconsApprises || ''} onChange={handleInputChange} error={!!errors.leconsApprises} helperText={errors.leconsApprises || "Points clés retenus pour l'avenir."}/>
            </Paper>
        </Grid>

        {/* Section Reconnaissance Équipe */}
        <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
                <TeamRecognition
                    teamMembers={teamMembers}
                    onSendEmails={handleSendEmails}
                    emailStatus={emailStatus}
                    onDeleteMember={handleDeleteMember}
                />
                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <TextField
                    label="Nom du membre"
                    value={newMember.name}
                    onChange={e => setNewMember(m => ({ ...m, name: e.target.value }))}
                    size="small"
                  />
                  <TextField
                    label="Email"
                    value={newMember.email}
                    onChange={e => setNewMember(m => ({ ...m, email: e.target.value }))}
                    size="small"
                  />
                  <Button variant="contained" color="primary" onClick={handleAddMember} disabled={!newMember.name.trim() || !newMember.email.trim()}>
                    Ajouter
                  </Button>
                </Box>
            </Paper>
        </Grid>

        {/* Section Clôture */}
         <Grid item xs={12}>
             <Paper elevation={0} variant="outlined" sx={{ p: 2, mt: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                 <TextField
                    id="dateCloture" name="dateCloture" label="Date de clôture du 8D" type="date"
                    variant="outlined" size="small" InputLabelProps={{ shrink: true }}
                    value={d8Section.dateCloture || ''} onChange={handleInputChange}
                 />
             </Paper>
         </Grid>

        {/* --- Zone des Boutons --- */}
        <Grid item xs={12}>
           {apiStatus === 'success' && (
              <Typography color="success.main" sx={{ mb: 2 }}>Sauvegarde réussie !</Typography>
           )}
           {apiStatus === 'error' && (
              <Typography color="error.main" sx={{ mb: 2 }}>Erreur lors de la sauvegarde. Veuillez réessayer.</Typography>
           )}
           <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 4, gap: 2 }}>
                <MainButton color="primary" onClick={handlePrevious} startIcon={<NavigateBeforeIcon />} sx={{ minWidth: 120 }}>
                  Précédent
                </MainButton>
                <MainButton color="primary" onClick={handleSaveAndClose} startIcon={<SaveIcon />} sx={{ minWidth: 150 }}>
                  Sauvegarder {tabKeyLabel || 'D8'}
                </MainButton>
                <MainButton color="success" onClick={handleCloseAndResolve} startIcon={<CheckCircleOutlineIcon />} sx={{ minWidth: 150 }}>
                  Clôturer
                </MainButton>
           </Box>
        </Grid>
      </Grid>
    </Box>
  );
}

export default D8Form;