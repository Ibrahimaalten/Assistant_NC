// src/App.jsx
import React, { useState } from 'react'; // Ajout de useState pour gérer les messages, loading et error
import { Tabs, Tab, Box, Container, Typography, AppBar, Paper, Grid } from '@mui/material';
import { Routes, Route, Link } from 'react-router-dom';

// Importer le hook du contexte
import { useForm8D } from './contexts/Form8DContext'; // Assurez-vous que le chemin est correct

// Importer les composants de formulaire (pages D0 à D8)
// Assurez-vous que les chemins sont corrects
import D0Form from './pages/D0Form';
import D1Form from './pages/D1Form';
import D2Form from './pages/D2Form';
import D3Form from './pages/D3Form';
import D4Form from './pages/D4Form';
import D5Form from './pages/D5Form';
import D6Form from './pages/D6Form';
import D7Form from './pages/D7Form';
import D8Form from './pages/D8Form';

// Importer le ChatAssistant
import ChatAssistant from './components/ChatAssistant';
import Dashboard from './components/Dashboard';
import ListeNonConformites from './components/ListeNonConformites';

// Définitions des onglets AVEC les clés de contexte
// Ces clés DOIVENT correspondre à celles utilisées dans Form8DContext.js
// et dans la constante stepsOrder de vos DxForm pour la navigation Précédent/Suivant.
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

// Le composant TabPanel (peut rester tel quel ou être simplifié si le Paper est géré autrement)
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`} // Utiliser l'index pour l'ID est OK ici
      aria-labelledby={`tab-${tabDefinitions[index].key}`} // Utiliser la clé unique pour aria-labelledby
      {...other}
    >
      {value === index && (
        // Le Paper externe pour le contenu de l'onglet peut être retiré si la structure globale le gère
        // ou le garder si vous voulez un style spécifique par onglet.
        // Pour une structure plus simple, on pourrait mettre le Paper autour du Switch de contenu.
        <Box sx={{ p: 3 }}> {/* Ajout d'un padding simple */}
          {children}
        </Box>
      )}
    </div>
  );
}

function App() {
  // Utiliser le contexte pour l'onglet actif et la fonction pour le changer
  const { currentStepKey, setCurrentStepKey } = useForm8D();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Trouver l'index de l'onglet actif basé sur currentStepKey
  // Si currentStepKey n'est pas encore défini ou ne correspond à aucune clé, on met 0 par défaut.
  const activeTabIndex = Math.max(0, tabDefinitions.findIndex(tab => tab.key === currentStepKey));

  const handleTabChange = (event, newTabIndex) => {
    // Mettre à jour le contexte avec la CLÉ du nouvel onglet sélectionné
    if (tabDefinitions[newTabIndex]) {
      setCurrentStepKey(tabDefinitions[newTabIndex].key);
    }
  };

  const handleSend = async (text) => {
    setLoading(true);
    setError('');
    try {
      // Appelle ton backend ici (fetch/axios)
      // const response = await ...
      // setMessages([...messages, { role: 'user', content: text }, { role: 'assistant', content: response.answer, sources: response.sources }]);
    } catch (e) {
      setError("Erreur lors de la communication avec l'assistant.");
    }
    setLoading(false);
  };

  return (
    // Container principal pour la mise en page globale avec Grid
    <Container
      maxWidth={false}
      sx={{
        display: 'flex',
        height: '100vh', // Pleine hauteur de la fenêtre
        p: 0, // Pas de padding sur le container externe
        m: 0, // Pas de marge
        overflow: 'hidden' // Empêcher le défilement du container principal
      }}
    >
      <Grid container sx={{ height: '100%' }}>
        {/* Colonne pour le contenu 8D (AppBar, Onglets, Contenu de l'onglet) */}
        <Grid
          item
          xs={12}
          md={8}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
          }}
        >
          <AppBar position="sticky" color="primary" sx={{ borderRadius: 0 }}>
            <Typography variant="h5" component="h1" sx={{ p: 2, textAlign: 'center' }}>
              Gestion des Non-Conformités - Méthode 8D
            </Typography>
            <Box sx={{ position: 'absolute', top: 16, right: 24 }}>
              <Link to="/dashboard" style={{ color: '#fff', textDecoration: 'none', fontWeight: 'bold', background: '#008BBD', padding: '8px 16px', borderRadius: '4px' }}>
                Accéder au Dashboard
              </Link>
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
                {tabDefinitions.map((tab, index) => (
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
            {tabDefinitions.map((tab, index) => {
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
        {/* Colonne pour le ChatAssistant */}
        <Grid
          item
          xs={12}
          md={4}
          sx={{
            height: { xs: '50vh', md: '100%' },
            borderLeft: { md: '1px solid #ccc' },
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#f8f9fa',
            overflow: 'hidden'
          }}
        >
          <ChatAssistant onSend={handleSend} messages={messages} loading={loading} error={error} />
        </Grid>
      </Grid>
    </Container>
  );
}

export default App;