// src/components/D4Form.jsx
import React, { useState, useMemo, useCallback } from 'react';
import { Box, Button, Typography, Grid, Tabs, Tab, Paper, TextField, Snackbar, Alert } from '@mui/material';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import SaveIcon from '@mui/icons-material/Save';

// Importer les composants de section (vérifie les chemins)
import IshikawaSection from '../components/4D/IshikawaSection';
import FiveWhysSection from '../components/4D/FiveWhysSection';
import { useForm8D } from '../contexts/Form8DContext';

function D4Form({ tabKeyLabel='D4', problemDescription = "Description du problème non fournie." }) {
    const { form8DData, updateFormField,
    setCurrentStepKey,
    currentStepKey,updateSectionData } = useForm8D();
    const SECTION_KEY = 'd4_rootcause';

    // Lecture des données du contexte ou valeurs par défaut
    const sectionData = form8DData[SECTION_KEY] || {};

    const [activeSubTab, setActiveSubTab] = useState(0);

    // --- État Ishikawa avec 'causes' comme tableau (inchangé depuis la version précédente) ---
    const initialIshikawaState = useMemo(() => ({
        Manpower: { causes: [], measurable: false, category: 'Main d\'œuvre' },
        Machine: { causes: [], measurable: false, category: 'Machine' },
        Method: { causes: [], measurable: false, category: 'Méthode' },
        Material: { causes: [], measurable: false, category: 'Matière' },
        Milieu: { causes: [], measurable: false, category: 'Milieu' },
    }), []);
    const [ishikawaData, setIshikawaData] = useState(sectionData.ishikawaData || initialIshikawaState);

    // --- État 5P avec la nouvelle structure { whys: [], rootCause: '' } ---
    const [fiveWhysData, setFiveWhysData] = useState(sectionData.fiveWhysData || {});

    // États pour autres champs et erreurs (si tu les utilises)
    const [otherFormData, setOtherFormData] = useState({ causesRacinesIdentifiees: '', verificationCauses: '' });
    const [errors, setErrors] = useState({});

    // État pour le feedback de sauvegarde
    const [saveFeedback, setSaveFeedback] = useState({ open: false, message: '', severity: 'success' });

    // --- Dériver potentialCauses depuis les listes Ishikawa (inchangé depuis la version précédente) ---
    const potentialCauses = useMemo(() => {
        return Object.values(ishikawaData).flatMap(categoryData =>
            (categoryData.causes || []).map(causeText =>
                `${categoryData.category}: ${causeText.trim()}`
            )
        ).filter(causeKey => causeKey.split(':')[1]?.trim());
    }, [ishikawaData]);

    // --- Gestionnaires d'événements ---
    const handleSubTabChange = (event, newValue) => setActiveSubTab(newValue);

    // --- Handler Ishikawa (inchangé - gère la synchro des suppressions) ---
    const handleIshikawaChange = useCallback((categoryKey, field, value) => {
        const currentCategoryData = ishikawaData[categoryKey];
        const oldCauses = field === 'causes' ? (currentCategoryData?.causes || []) : null;
        const categoryName = currentCategoryData?.category;

        setIshikawaData(prevData => ({
            ...prevData,
            [categoryKey]: { ...prevData[categoryKey], [field]: value }
        }));

        if (field === 'causes' && categoryName && oldCauses !== null) {
            const newCauses = value || [];
            const oldCauseKeys = oldCauses.map(cause => `${categoryName}: ${cause.trim()}`);
            const newCauseKeys = newCauses.map(cause => `${categoryName}: ${cause.trim()}`);
            const deletedCauseKeys = oldCauseKeys.filter(key => !newCauseKeys.includes(key));

            if (deletedCauseKeys.length > 0) {
                setFiveWhysData(prevWhys => {
                    const updatedWhys = { ...prevWhys };
                    let changed = false;
                    deletedCauseKeys.forEach(keyToDelete => {
                        if (updatedWhys.hasOwnProperty(keyToDelete)) {
                            delete updatedWhys[keyToDelete];
                            changed = true;
                        }
                    });
                    return changed ? updatedWhys : prevWhys;
                });
            }
        }
    }, [ishikawaData]);

    // --- MODIFIÉ : Handler pour les champs 'Pourquoi' (met à jour le tableau 'whys') ---
    const handleFiveWhysChange = useCallback((cause, whyIndex, value) => {
        setFiveWhysData(prevData => {
            const currentEntry = prevData[cause] || { whys: Array(5).fill(''), rootCause: '' };
            const newWhys = [...currentEntry.whys];
            newWhys[whyIndex] = value;
            console.log('[FiveWhys] handleFiveWhysChange', { cause, whyIndex, value, prevData, newWhys });
            return {
                ...prevData,
                [cause]: { ...currentEntry, whys: newWhys }
            };
        });
    }, []);

    // --- Handler pour le champ 'Cause Racine' (met à jour 'rootCause') ---
    const handleFiveWhysRootCauseChange = useCallback((cause, rootCauseValue) => {
        setFiveWhysData(prevData => {
            const currentEntry = prevData[cause] || { whys: Array(5).fill(''), rootCause: '' };
            console.log('[FiveWhys] handleFiveWhysRootCauseChange', { cause, rootCauseValue, prevData });
            return {
                ...prevData,
                [cause]: { ...currentEntry, rootCause: rootCauseValue }
            };
        });
    }, []);

    // --- Effet pour initialiser fiveWhysData pour chaque cause potentielle ---
    React.useEffect(() => {
        // Pour chaque cause potentielle, s'assurer qu'il y a une entrée dans fiveWhysData
        setFiveWhysData(prevData => {
            let changed = false;
            const newData = { ...prevData };
            potentialCauses.forEach(cause => {
                if (!newData[cause]) {
                    newData[cause] = { whys: Array(5).fill(''), rootCause: '' };
                    changed = true;
                }
            });
            // Nettoyer les causes qui n'existent plus
            Object.keys(newData).forEach(cause => {
                if (!potentialCauses.includes(cause)) {
                    delete newData[cause];
                    changed = true;
                }
            });
            return changed ? newData : prevData;
        });
        // eslint-disable-next-line
    }, [potentialCauses]);

    // --- Correction : synchronisation immédiate du champ modifié dans le contexte (pour éviter le délai du useEffect) ---
    const handleFiveWhysChangeAndSync = useCallback((cause, whyIndex, value) => {
        setFiveWhysData(prevData => {
            const currentEntry = prevData[cause] || { whys: Array(5).fill(''), rootCause: '' };
            const newWhys = [...currentEntry.whys];
            newWhys[whyIndex] = value;
            const updatedData = {
                ...prevData,
                [cause]: { ...currentEntry, whys: newWhys }
            };
            // Synchroniser immédiatement dans le contexte
            updateFormField(SECTION_KEY, 'fiveWhysData', updatedData);
            return updatedData;
        });
    }, [updateFormField]);

    const handleFiveWhysRootCauseChangeAndSync = useCallback((cause, rootCauseValue) => {
        setFiveWhysData(prevData => {
            const currentEntry = prevData[cause] || { whys: Array(5).fill(''), rootCause: '' };
            const updatedData = {
                ...prevData,
                [cause]: { ...currentEntry, rootCause: rootCauseValue }
            };
            updateFormField(SECTION_KEY, 'fiveWhysData', updatedData);
            return updatedData;
        }, [updateFormField]);
    });

    // --- Handler pour supprimer une analyse 5P complète (inchangé) ---
    const handleDeleteFiveWhys = useCallback((causeToDelete) => {
        setFiveWhysData(prevWhys => {
            const { [causeToDelete]: _, ...remainingWhys } = prevWhys;
            return remainingWhys;
        });
    }, []);

    // --- Autres handlers (inchangés, à adapter si tu utilises otherFormData) ---
    const handleOtherInputChange = (event) => {
        const { name, value } = event.target;
        setOtherFormData(prevData => ({ ...prevData, [name]: value }));
        // Gérer les erreurs si nécessaire
    };
    const validateForm = () => {
        // Ajouter la logique de validation si besoin
        return true; // Simplifié
    };
    const handleSave = () => {
        // TODO: Ajoutez ici la logique de validation si besoin
        setSaveFeedback({ open: true, message: `Données ${tabKeyLabel} sauvegardées !`, severity: 'success' });
        // ...sauvegarde réelle à implémenter...
    };

    const handleCloseSnackbar = () => setSaveFeedback(prev => ({ ...prev, open: false }));

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

    // Les boutons doivent toujours être cliquables (pas de condition sur le remplissage des champs)
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

    // --- Synchronisation vers le contexte à chaque modification ---
    React.useEffect(() => {
        // On merge l'état local avec l'état du contexte pour ne rien écraser
        updateFormField(SECTION_KEY, 'ishikawaData', ishikawaData);
        updateFormField(SECTION_KEY, 'fiveWhysData', fiveWhysData);
        Object.entries(otherFormData).forEach(([key, value]) => {
            updateFormField(SECTION_KEY, key, value);
        });
    }, [ishikawaData, fiveWhysData, otherFormData]);

    // --- Rendu ---
    return (
        <Box component="div" sx={{ p: 2, maxWidth: 900, margin: '0 auto' }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                D4 – Recherche des Causes Racines
            </Typography>
            <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                    Analyse des causes racines (méthodes, outils, etc.)
                </Typography>
                {/* Remplacement de GestionCauses4D par les sections Ishikawa et 5P */}
                <IshikawaSection
                    ishikawaData={ishikawaData}
                    onDataChange={handleIshikawaChange}
                    problemDescription={problemDescription}
                />
                <FiveWhysSection
                    potentialCauses={potentialCauses}
                    fiveWhysData={fiveWhysData}
                    onFiveWhysChange={handleFiveWhysChangeAndSync}
                    onFiveWhysRootCauseChange={handleFiveWhysRootCauseChangeAndSync}
                    onDeleteFiveWhys={handleDeleteFiveWhys}
                />
            </Paper>
            {/* Zone de feedback utilisateur */}
            <Snackbar open={saveFeedback.open} autoHideDuration={3000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert onClose={handleCloseSnackbar} severity={saveFeedback.severity} sx={{ width: '100%' }}>
                    {saveFeedback.message}
                </Alert>
            </Snackbar>
            {/* Barre de navigation et sauvegarde */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3 }}>
                <Button
                    variant="outlined"
                    startIcon={<NavigateBeforeIcon />}
                    onClick={handlePrevious}
                    disabled={currentIndex === 0}
                >
                    Précédent
                </Button>
                <Box>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<SaveIcon />}
                        onClick={handleSave}
                        sx={{ mr: 1 }}
                    >
                        Sauvegarder {tabKeyLabel}
                    </Button>
                    <Button
                        variant="contained"
                        endIcon={<NavigateNextIcon />}
                        onClick={handleNext}
                        disabled={currentIndex === stepsOrder.length - 1}
                    >
                        Suivant
                    </Button>
                </Box>
            </Box>
            {/* Préparation pour ChatAssistant (décommenter pour intégrer) */}
            {/* <Box sx={{ mt: 4 }}><ChatAssistant /></Box> */}
        </Box>
    );
}

export default D4Form;