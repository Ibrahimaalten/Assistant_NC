// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css'; // Styles globaux de base

import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Form8DProvider } from './contexts/Form8DContext.jsx';
import { BrowserRouter } from 'react-router-dom';

// Créer un thème clair par défaut
const brandColors = {
  black: '#000000',
  blue: '#008BBD', // Bleu entreprise
  red: '#E30513',  // Rouge entreprise
  yellow: '#FFED00', // Jaune entreprise (Attention contraste!)
};

const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: brandColors.blue, // Le bleu comme couleur principale
      contrastText: '#ffffff', // Texte blanc contraste bien avec ce bleu
    },
    secondary: {
      main: brandColors.yellow, // Le jaune comme couleur secondaire/accent
      contrastText: 'rgba(0, 0, 0, 0.87)', // Texte NOIR/foncé pour contraster avec le jaune!
    },
    error: {
      main: brandColors.red, // Le rouge pour les erreurs
      contrastText: '#ffffff', // Texte blanc sur ce rouge
    },
    warning: {
      // On peut aussi utiliser le jaune pour les avertissements
      main: brandColors.yellow,
      contrastText: 'rgba(0, 0, 0, 0.87)', // Texte noir requis
      // Alternative : utiliser une couleur orange standard si le jaune est trop vif pour les warnings
      // main: '#ed6c02', // Orange MUI par défaut
      // contrastText: '#ffffff',
    },
    info: {
      // On peut réutiliser le bleu principal pour l'info
      main: brandColors.blue,
      contrastText: '#ffffff',
    },
    success: {
      main: '#2e7d32', // Vert succès standard (vous pouvez le personnaliser si vous avez un vert de marque)
      contrastText: '#ffffff',
    },
    background: {
      default: '#f8f9fa', // Un fond très légèrement grisé (plus doux que blanc pur)
      paper: '#ffffff',    // Fond blanc pour les composants Paper (onglets, formulaires)
    },
  },

  text: {
    primary: brandColors.black, // Texte principal en noir
    secondary: 'rgba(0, 0, 0, 0.6)', // Texte secondaire en gris foncé
    disabled: 'rgba(0, 0, 0, 0.38)',
 },
  // Optionnel : on peut définir une couleur spécifique pour l'AppBar si on ne veut pas primary
    // appBar: {
    //   main: brandColors.black,
    //   contrastText: '#ffffff',
    // }
  
   // Autres options de thème (typographie, espacement, etc.)
   typography: {
    // Conserver ou ajuster les réglages de typographie
    fontFamily: 'Roboto, Helvetica, Arial, sans-serif', // Police standard
     h5: {
       fontWeight: 600, // Rendre le titre principal un peu plus gras
     },
     h6: {
      fontWeight: 500,
      color: brandColors.blue, // Mettre les titres de section (D0, D1...) en bleu
      borderBottom: `1px solid ${brandColors.blue}33`, // léger soulignement bleu transparent
      paddingBottom: '4px',
      marginBottom: '1.5em' // Ajouter un peu d'espace après le titre de section
     }
  },
  components: {
    // Optionnel : Personnaliser l'apparence de composants spécifiques
    MuiAppBar: {
      styleOverrides: {
        // Si vous voulez spécifiquement l'AppBar en noir par ex:
        // colorPrimary: {
        //   backgroundColor: brandColors.black,
        //   color: '#ffffff',
        // },
      }
    },
    MuiTab: {
       styleOverrides: {
         root: {
           // Style pour les onglets inactifs
           '&:not(.Mui-selected)': {
              color: 'rgba(0, 0, 0, 0.7)', // texte légèrement moins noir pour inactif
           },
           // Style pour l'onglet actif (utilisera primary.main par défaut)
           // '&.Mui-selected': {
           //    fontWeight: 'bold',
           // }
         }
       }
    },
     MuiButton: {
        styleOverrides: {
          // Attention à la lisibilité du bouton secondaire jaune
          containedSecondary: {
            color: 'rgba(0, 0, 0, 0.87)', // Forcer le texte noir sur fond jaune
            '&:hover': {
               backgroundColor: '#fdd835', // Un jaune légèrement plus foncé au survol
            }
          },
           outlinedSecondary: {
            // Le contour jaune peut être peu visible sur fond blanc.
            // A utiliser avec précaution ou à éviter.
            borderColor: brandColors.yellow,
            color: brandColors.yellow,
             '&:hover': {
                 borderColor: '#fdd835',
                 backgroundColor: 'rgba(255, 237, 0, 0.08)', // Léger fond jaune au survol
            }
          },
          // Style pour le bouton de clôture (D8) qu'on avait mis en success
          containedSuccess: {
             backgroundColor: '#2e7d32',
             color: '#ffffff',
             '&:hover': {
                backgroundColor: '#1b5e20',
             }
          }
        }
     }
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Appliquer le thème et les styles de base */}
    <Form8DProvider>
    <ThemeProvider theme={lightTheme}>
      <CssBaseline /> {/* Normalise les styles et applique la couleur de fond du thème */}
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>
    </Form8DProvider>
  </React.StrictMode>,
);