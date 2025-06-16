// src/App.jsx
import React, { useState } from 'react'; // Ajout de useState pour gérer les messages, loading et error
import { Tabs, Tab, Box, Container, Typography, AppBar, Paper, Grid } from '@mui/material';

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

  // La fonction handleNavigate n'est plus passée aux enfants.
  // Les composants DxForm géreront leur propre navigation "Précédent"/"Suivant"
  // en utilisant setCurrentStepKey du contexte.

  return (
    // Container principal pour la mise en page globale avec Grid
    <Container
      maxWidth={false} // Utiliser toute la largeur disponible
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
          xs={12} // Pleine largeur sur mobile
          md={8}  // 2/3 de la largeur sur les écrans moyens et plus
          sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            // borderRight: { md: '1px solid #ccc' } // Bordure entre les sections sur md+
          }}
        >
          <AppBar position="sticky" color="primary" sx={{ borderRadius: 0 /* Pas de coins arrondis si pleine largeur */ }}>
            <Typography variant="h5" component="h1" sx={{ p: 2, textAlign: 'center' }}>
              Gestion des Non-Conformités - Méthode 8D
            </Typography>
          </AppBar>

          {/* Barre d'onglets */}
          <Paper elevation={2} sx={{ position: 'sticky', top: 0, zIndex: 10 /* Assurer que les onglets sont au-dessus */ }}> {/* Paper pour les onglets */}
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
                    id={`tab-${tab.key}`} // Utiliser la clé unique pour l'ID
                    aria-controls={`tabpanel-${tab.key}`}
                    key={tab.key} // Utiliser la clé unique pour la prop key de React
                  />
                ))}
              </Tabs>
            </Box>
          </Paper>

          {/* Contenu de l'onglet actif */}
          <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 0 /* Le padding sera dans TabPanel ou DxForm */ }}>
            {/* Le Paper autour de chaque contenu d'onglet est maintenant dans TabPanel */}
            {tabDefinitions.map((tab, index) => {
              const FormComponent = tab.component;
              // tabKeyLabel est toujours utile pour l'affichage dans le DxForm
              const tabKeyDisplayLabel = tab.label.split(' - ')[0] || tab.key; // Ex: "D1" ou "Initialisation"

              return (
                <TabPanel value={activeTabIndex} index={index} key={tab.key}>
                  <FormComponent
                    tabKeyLabel={tabKeyDisplayLabel}
                  />
                </TabPanel>
              );
            })}
          </Box>
        </Grid>

        {/* Colonne pour le ChatAssistant */}
        <Grid
          item
          xs={12} // Prendra toute la largeur sous la section 8D sur mobile
          md={4}  // 1/3 de la largeur sur les écrans moyens et plus
          sx={{
            height: { xs: '50vh', md: '100%' }, // Hauteur différente sur mobile vs desktop
            borderLeft: { md: '1px solid #ccc' }, // Bordure visible uniquement sur desktop
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#f8f9fa', // Une couleur de fond légèrement différente
            overflow: 'hidden' // Pour s'assurer que le chat ne déborde pas
          }}
        >
          <ChatAssistant onSend={handleSend} messages={messages} loading={loading} error={error} /> {/* ChatAssistant intégré avec gestion des messages, loading et erreurs */}
        </Grid>
      </Grid>
    </Container>
  );
}

export default App;