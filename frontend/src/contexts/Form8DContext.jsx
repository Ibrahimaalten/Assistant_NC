// src/contexts/Form8DContext.js
import React, { createContext, useState, useContext, useCallback } from 'react';

const Form8DContext = createContext();
export const useForm8D = () => useContext(Form8DContext);

const initialForm8DData = {
  d0_initialisation :{referenceNC: '',
  dateDetection: new Date().toISOString().slice(0, 10),
  dateCreation: new Date().toISOString().slice(0, 10), // Date du jour par défaut
  produitRef: '',
  LieuDetection: '',
  detectePar: '',
  descriptionInitiale: '',
  Criticite: '',
  FonctionCrea:'',  },
  d1_team: { membresEquipe: [], chefEquipe: { prenom: '', nom: '', support: '' }, Sponsor: '' },
  d2_problem: { descriptionDetaillee: {
    qui: '', quoi: '', ou: '', quand: '', comment: '', combien: '', pourquoi: ''
  } },
  d3_containment: { actions3D: [] },
  d4_rootcause: {
    ishikawaData: {
      Manpower: { causes: [], measurable: false, category: "Main d'œuvre" },
      Machine: { causes: [], measurable: false, category: 'Machine' },
      Method: { causes: [], measurable: false, category: 'Méthode' },
      Material: { causes: [], measurable: false, category: 'Matière' },
      Milieu: { causes: [], measurable: false, category: 'Milieu' },
    },
    fiveWhysData: {},
  },
  d5_correctiveactions: {
    correctiveActionsData: {},
  },
  d6_implementvalidate: {
    implementedActions: {},
    validationResults: '',
    surveillancePlan: '',
  },
  d7_preventrecurrence: {
    selectedPreventiveCauses: [],
    preventiveActions: {},
    documentationUpdates: '',
    systemicChanges: '',
  },
  d8_congratulate: {
    team_recognition: '',
    resumeResultats: '',
    leconsApprises: '',
    dateCloture: new Date().toISOString().slice(0, 10),
    teamAcknowledged: [],
  },
  currentStepKey: 'd0_initialisation', // Clé pour identifier la section/page active
};

export const Form8DProvider = ({ children }) => {
  const [form8DData, setForm8DData] = useState(initialForm8DData);

  const updateFormField = useCallback((sectionKey, fieldName, fieldValue) => {
    console.log("Form8DContext - updateFormField called:", sectionKey, fieldName, fieldValue); // LOG 3
    setForm8DData(prevData => {
      const newData = {
        ...prevData,
        [sectionKey]: {
          ...prevData[sectionKey],
          [fieldName]: fieldValue,
        },
      };
      console.log("Form8DContext - new form8DData state:", newData); // LOG 4
      return newData;
    });
  }, []);

  // Si vous voulez mettre à jour toute une section d'un coup
  const updateSectionData = useCallback((sectionKey, data) => {
     setForm8DData(prevData => ({
         ...prevData,
         [sectionKey]: data
     }));
   }, []);


  const getAllFormData = useCallback(() => {
    const { currentStepKey, ...data } = form8DData; // Exclure les méta-données du contexte
    return data;
  }, [form8DData]);

  const getCurrentStepData = useCallback(() => {
     return form8DData[form8DData.currentStepKey] || {};
  }, [form8DData]);

  const setCurrentStepKey = useCallback((key) => {
    setForm8DData(prevData => ({ ...prevData, currentStepKey: key }));
  }, []);

  const value = {
    form8DData,
    updateFormField,
    updateSectionData,
    getAllFormData,
    getCurrentStepData,
    currentStepKey: form8DData.currentStepKey,
    setCurrentStepKey,
  };

  return <Form8DContext.Provider value={value}>{children}</Form8DContext.Provider>;
};