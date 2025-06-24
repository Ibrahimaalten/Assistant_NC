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
    const { setCurrentStepKey, currentStepKey } = useForm8D();
    const { id } = useParams();

    // --- DONNÉES D'EXEMPLE POUR L'ÉQUIPE (si teamData n'est pas fourni) ---
    const sampleTeamData = [
        { name: 'Alice Dubois', email: 'alice.d@example.com' },
        { name: 'Bob Martin', email: 'bob.m@example.com' },
        { name: 'Charlie Girard', email: 'charlie.g@example.com' },
        { name: 'Diane Petit', email: 'diane.p@example.com' }
    ];
    const currentTeam = teamData && teamData.length > 0 ? teamData : sampleTeamData;
    // ------------------------------------------------------------------

    // --- État pour les champs standards de D8 ---
    const [formData, setFormData] = useState({
        resumeResultats: '',
        leconsApprises: '',
        // La reconnaissance "écrite" est maintenant gérée via le message dans TeamRecognition
        // mais on peut garder un champ si besoin d'une note interne. Laissons-le vide pour l'instant.
        // reconnaissanceEquipeInterne: '',
        dateCloture: new Date().toISOString().slice(0, 10),
    });

    // --- État pour la simulation d'email ---
    const [emailStatus, setEmailStatus] = useState(''); // '', 'sending', 'sent', 'error'
    const [recognitionMessageForSave, setRecognitionMessageForSave] = useState(''); // Pour sauvegarder le dernier message envoyé

    const [errors, setErrors] = useState({});

    // --- Handlers ---
    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setFormData(prevData => ({ ...prevData, [name]: value }));
        if (errors[name]) {
            setErrors(prevErrors => ({ ...prevErrors, [name]: undefined }));
        }
    };

    // --- Simulation d'envoi d'email (appelée par TeamRecognition) ---
    const handleSendEmails = useCallback((message, recipients) => {
        console.log("Simulation d'envoi d'email déclenchée...");
        console.log("Destinataires:", recipients);
        console.log("Message:", message);
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
    if (!formData.resumeResultats.trim()) tempErrors.resumeResultats = "Un résumé des résultats est requis.";
    if (!formData.leconsApprises.trim()) tempErrors.leconsApprises = "Les leçons apprises doivent être documentées.";
    // Ajouter validation date si nécessaire
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
          const response = await fetch(url, {
              method,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(form8DData),
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
                 <TextField required fullWidth id="resumeResultats" name="resumeResultats" label="Résumé des résultats et succès" multiline rows={4} variant="outlined" value={formData.resumeResultats} onChange={handleInputChange} error={!!errors.resumeResultats} helperText={errors.resumeResultats || "Succès clés du projet 8D."} sx={{ mb: 2 }} />
                 <TextField required fullWidth id="leconsApprises" name="leconsApprises" label="Leçons Apprises" multiline rows={4} variant="outlined" value={formData.leconsApprises} onChange={handleInputChange} error={!!errors.leconsApprises} helperText={errors.leconsApprises || "Points clés retenus pour l'avenir."}/>
            </Paper>
        </Grid>

        {/* Section Reconnaissance Équipe */}
        <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
                <TeamRecognition
                    teamMembers={currentTeam} // Passe les données (réelles ou exemple)
                    onSendEmails={handleSendEmails} // Passe la fonction de simulation
                    emailStatus={emailStatus} // Passe l'état de l'envoi
                />
            </Paper>
        </Grid>

        {/* Section Clôture */}
         <Grid item xs={12}>
             <Paper elevation={0} variant="outlined" sx={{ p: 2, mt: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                 <TextField
                    id="dateCloture" name="dateCloture" label="Date de clôture du 8D" type="date"
                    variant="outlined" size="small" InputLabelProps={{ shrink: true }}
                    value={formData.dateCloture} onChange={handleInputChange}
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
                <MainButton color="success" onClick={handleSaveAndClose} startIcon={<CheckCircleOutlineIcon />} sx={{ minWidth: 150 }}>
                  Clôturer
                </MainButton>
           </Box>
        </Grid>
      </Grid>
    </Box>
  );
}

export default D8Form;