// src/components/D4Form.jsx
import React, { useState, useMemo, useCallback } from 'react';
import { Box, Button, Typography, Grid, Tabs, Tab, Paper, TextField } from '@mui/material';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import SaveIcon from '@mui/icons-material/Save';

// Importer les composants de section (vérifie les chemins)
import IshikawaSection from '../components/4D/IshikawaSection';
import FiveWhysSection from '../components/4D/FiveWhysSection';

function D4Form({ activeTabIndex, totalTabs, onNavigate, tabKeyLabel, problemDescription = "Description du problème non fournie." }) {

    const [activeSubTab, setActiveSubTab] = useState(0);

    // --- État Ishikawa avec 'causes' comme tableau (inchangé depuis la version précédente) ---
    const initialIshikawaState = useMemo(() => ({
        Manpower: { causes: [], measurable: false, category: 'Main d\'œuvre' },
        Machine: { causes: [], measurable: false, category: 'Machine' },
        Method: { causes: [], measurable: false, category: 'Méthode' },
        Material: { causes: [], measurable: false, category: 'Matière' },
        Milieu: { causes: [], measurable: false, category: 'Milieu' },
    }), []);
    const [ishikawaData, setIshikawaData] = useState(initialIshikawaState);

    // --- État 5P avec la nouvelle structure { whys: [], rootCause: '' } ---
    const [fiveWhysData, setFiveWhysData] = useState({});

    // États pour autres champs et erreurs (si tu les utilises)
    const [otherFormData, setOtherFormData] = useState({ causesRacinesIdentifiees: '', verificationCauses: '' });
    const [errors, setErrors] = useState({});

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
            const currentEntry = prevData[cause] || { whys: Array(5).fill(''), rootCause: '' }; // Initialise si besoin
            const newWhys = [...currentEntry.whys];
            newWhys[whyIndex] = value;

            return {
                ...prevData,
                [cause]: { ...currentEntry, whys: newWhys } // Met à jour l'objet avec le nouveau tableau whys
            };
        });
    }, []);

    // --- NOUVEAU : Handler pour le champ 'Cause Racine' (met à jour 'rootCause') ---
    const handleFiveWhysRootCauseChange = useCallback((cause, rootCauseValue) => {
        setFiveWhysData(prevData => {
            const currentEntry = prevData[cause] || { whys: Array(5).fill(''), rootCause: '' }; // Initialise si besoin

            return {
                ...prevData,
                [cause]: { ...currentEntry, rootCause: rootCauseValue } // Met à jour l'objet avec la nouvelle rootCause
            };
        });
    }, []);

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
        // if (validateForm()) {
            const saveData = {
                ishikawaAnalysis: ishikawaData,
                fiveWhysAnalysis: fiveWhysData, // Sauvegarde la structure avec { whys: [], rootCause: '' }
                // rootCausesSummary: otherFormData.causesRacinesIdentifiees, // Si utilisé
                // verificationMethod: otherFormData.verificationCauses,   // Si utilisé
            };
            console.log('Données D4 à sauvegarder:', saveData);
            alert('Données D4 (simulées) sauvegardées !');
        // } else {
        //    console.log("Validation D4 échouée", errors);
        // }
    };
    const handlePrevious = () => onNavigate(activeTabIndex - 1);
    const handleNext = () => onNavigate(activeTabIndex + 1);

    // --- Rendu ---
    return (
        <Box component="div" sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
                D4 - Identification et Vérification des Causes Racines
            </Typography>

            {/* Onglets 5M / 5P */}
            <Box display="flex" justifyContent="center" sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={activeSubTab} onChange={handleSubTabChange} aria-label="Sections Analyse Causes">
                    <Tab label="Analyse 5M (Ishikawa)" id="tab-5m" aria-controls="tabpanel-5m" />
                    <Tab label="Analyse 5P (5 Pourquoi)" id="tab-5p" aria-controls="tabpanel-5p" />
                </Tabs>
            </Box>

            {/* Contenu Onglet 5M */}
            <Box role="tabpanel" hidden={activeSubTab !== 0} id="tabpanel-5m" aria-labelledby="tab-5m">
                {activeSubTab === 0 && (
                    <IshikawaSection
                        problemDescription={problemDescription}
                        ishikawaData={ishikawaData}
                        onDataChange={handleIshikawaChange} // Handler Ishikawa inchangé
                    />
                )}
            </Box>

            {/* Contenu Onglet 5P */}
            <Box role="tabpanel" hidden={activeSubTab !== 1} id="tabpanel-5p" aria-labelledby="tab-5p">
                {activeSubTab === 1 && (
                    <FiveWhysSection
                        potentialCauses={potentialCauses}
                        fiveWhysData={fiveWhysData} // Passe la nouvelle structure
                        onWhyChange={handleFiveWhysChange} // Passe le handler pour les 'Pourquoi'
                        onRootCauseChange={handleFiveWhysRootCauseChange} // Passe le handler pour la 'Cause Racine'
                        onDeleteWhy={handleDeleteFiveWhys} // Passe le handler pour la suppression
                    />
                )}
            </Box>

            {/* Remettre ici la section Paper avec les TextField pour Synthèse/Vérification si besoin */}

            {/* Boutons de Navigation/Sauvegarde */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3 }}>
                <Button variant="outlined" startIcon={<NavigateBeforeIcon />} onClick={handlePrevious} disabled={activeTabIndex === 0}>
                    Précédent
                </Button>
                <Box>
                    <Button variant="contained" color="primary" startIcon={<SaveIcon />} onClick={handleSave} sx={{ mr: 1 }}>
                        Sauvegarder {tabKeyLabel}
                    </Button>
                    <Button variant="contained" endIcon={<NavigateNextIcon />} onClick={handleNext} disabled={activeTabIndex === totalTabs - 1}>
                        Suivant
                    </Button>
                </Box>
            </Box>
        </Box>
    );
}

export default D4Form;