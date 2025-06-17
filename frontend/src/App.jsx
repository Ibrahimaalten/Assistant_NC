import React, { useState } from 'react';
import { Tabs, Tab, Box, Container, Typography, AppBar, Paper, Grid } from '@mui/material';
// MODIFICATION : Importer les composants de React Router
import { BrowserRouter as Router, Routes, Route, Link as RouterLink } from 'react-router-dom';

// Importer le hook du contexte
import { useForm8D } from './contexts/Form8DContext'; 

// Importer les composants de formulaire (pages D0 à D8)
import D0Form from './pages/D0Form';
import D1Form from './pages/D1Form';
import D2Form from './pages/D2Form';
import D3Form from './pages/D3Form';
import D4Form from './pages/D4Form';
import D5Form from './pages/D5Form';
import D6Form from './pages/D6Form';
import D7Form from './pages/D7Form';
import D8Form from './pages/D8Form';

// Importer le ChatAssistant et le Dashboard
import ChatAssistant from './components/ChatAssistant';
import Dashboard from './components/Dashboard'; 
import ListeNonConformites from './components/ListeNonConformites';

// Assure-toi que ce chemin est correct
// import ListeNonConformites from './components/ListeNonConformites'; // Si tu l'as

const tabDefinitions = [
  { key: 'd0_initialisation', label: 'Initialisation', component: D0Form },
  { key: 'd1_team', label: 'D1 - Équipe', component: D1Form },
  { key: 'd2_problem', label: 'D2 - Description Problème', component: D2Form },
  { key: 'd3_containment', label: 'D3 - Actions Immédiates', component: D3Form },
  { key: 'd4_rootcause', label: 'D4 - Causes Racines', component: D4Form },
  { key: 'd5_correctiveactions', label: 'D5 - Actions Correctives', component: D5Form },
  { key: 'd6_implementvalidate', label: 'D6 - Implémentation Actions', component: D6Form },
  { key: 'd7_preventrecurrence', label: 'D7 - Prévention Récurrence', component: D7Form },
  { key: 'd8_congratulate', label: 'D8 - Félicitations Équipe', component: D8Form },
];

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${tabDefinitions[index]?.key || index}`} // Robuste au cas où tabDefinitions[index] serait undefined
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>{children}</Box>
      )}
    </div>
  );
}

// MODIFICATION : Création d'un composant pour l'interface 8D et Chat
const Form8DAndChatInterface = () => {
  const { currentStepKey, setCurrentStepKey } = useForm8D();
  // Les états messages, loading, error pour ChatAssistant doivent être gérés dans ChatAssistant lui-même
  // ou via un contexte si partagés plus largement. Si ChatAssistant les prend en props, il faudra
  // les remonter ou utiliser un contexte. Pour simplifier, on assume que ChatAssistant les gère.
  // Si tu gardes les états `messages`, `loading`, `error` dans App, il faudra les passer ici en props à ChatAssistant.
  // Pour l'instant, je retire les props passées à ChatAssistant en supposant qu'il est autonome.

  const activeTabIndex = Math.max(0, tabDefinitions.findIndex(tab => tab.key === currentStepKey));

  const handleTabChange = (event, newTabIndex) => {
    if (tabDefinitions[newTabIndex]) {
      setCurrentStepKey(tabDefinitions[newTabIndex].key);
    }
  };

  return (
    <Container
      maxWidth={false}
      sx={{
        display: 'flex',
        height: '100%', // Prendra la hauteur du parent (qui sera le Box dans App)
        p: 0, 
        m: 0, 
        overflow: 'hidden'
      }}
    >
      <Grid container sx={{ height: '100%' }}>
        <Grid item xs={12} md={8} sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <AppBar position="sticky" color="primary" sx={{ borderRadius: 0 }}>
            <Typography variant="h5" component="h1" sx={{ p: 2, textAlign: 'center' }}>
              Gestion des Non-Conformités - Méthode 8D
            </Typography>
            <Box sx={{ position: 'absolute', top: 16, right: 24 }}>
              {/* MODIFICATION : Utiliser RouterLink */}
              <RouterLink to="/dashboard" style={{ color: '#fff', textDecoration: 'none', fontWeight: 'bold', background: '#008BBD', padding: '8px 16px', borderRadius: '4px' }}>
                Accéder au Dashboard
              </RouterLink>
            </Box>
          </AppBar>
          <Paper elevation={2} sx={{ position: 'sticky', top: 0, zIndex: 10 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs
                value={activeTabIndex}
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
                aria-label="Onglets du processus 8D"
              >
                {tabDefinitions.map((tab) => ( // index non nécessaire si key est unique
                  <Tab
                    label={tab.label}
                    id={`tab-${tab.key}`}
                    aria-controls={`tabpanel-${tab.key}`}
                    key={tab.key}
                  />
                ))}
              </Tabs>
            </Box>
          </Paper>
          <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 0 }}>
            {tabDefinitions.map((tab, index) => { // index est nécessaire pour TabPanel
              const FormComponent = tab.component;
              const tabKeyDisplayLabel = tab.label.split(' - ')[0] || tab.key;
              return (
                <TabPanel value={activeTabIndex} index={index} key={tab.key}>
                  <FormComponent tabKeyLabel={tabKeyDisplayLabel} />
                </TabPanel>
              );
            })}
          </Box>
        </Grid>
        <Grid item xs={12} md={4} sx={{ height: { xs: '50vh', md: '100%' }, borderLeft: { md: '1px solid #ccc' }, display: 'flex', flexDirection: 'column', backgroundColor: '#f8f9fa', overflow: 'hidden' }}>
          {/* MODIFICATION: Supposons que ChatAssistant gère ses propres états messages/loading/error */}
          <ChatAssistant />
        </Grid>
      </Grid>
    </Container>
  );
};


function App() {
  // Les états `messages`, `loading`, `error` qui étaient ici pour le ChatAssistant
  // ont été retirés. ChatAssistant.jsx doit maintenant gérer ces états lui-même,
  // ou si tu veux absolument les garder ici, tu devras les passer en props à <Form8DAndChatInterface />
  // puis à <ChatAssistant /> à l'intérieur de ce composant.
  // Pour la simplicité de cette modification, j'assume que ChatAssistant est autonome pour son état interne.
  // Le contexte `Form8DContext` est toujours utilisé par `Form8DAndChatInterface` via le hook `useForm8D`.

  return (
    // MODIFICATION : Envelopper avec Router
      <Box sx={{height: '100vh', display: 'flex', flexDirection: 'column'}}>
        {/* MODIFICATION : Définition des Routes */}
        <Routes>
          {/* La route par défaut affiche l'interface 8D et Chat */}
          <Route path="/" element={<Form8DAndChatInterface />} />
          <Route path="/liste-nonconformites" element={<ListeNonConformites />} /> 

          {/* La route pour le Dashboard */}
          <Route path="/dashboard" element={<Dashboard />} />
          
          {/* Optionnel: une route pour les URL non trouvées */}
          <Route path="*" element={
            <Container sx={{pt: 5, textAlign: 'center'}}>
              <Typography variant="h4">404 - Page Non Trouvée</Typography>
              <RouterLink to="/">Retour à l'accueil</RouterLink>
            </Container>
          }/>
        </Routes>
      </Box>
  );
}

export default App;