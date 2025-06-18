// src/components/ChatAssistant.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useForm8D } from '../contexts/Form8DContext';
import { Box, Paper, Avatar, Typography, TextField, IconButton, CircularProgress, Snackbar } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import StopIcon from '@mui/icons-material/Stop';
import { v4 as uuidv4 } from 'uuid'; // Pour des IDs uniques

function ChatAssistant() {
  const [messages, setMessages] = useState([
    { id: uuidv4(), text: 'Bonjour ! Comment puis-je vous aider avec votre 8D ?', sender: 'bot', isLoading: false }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isOverallLoading, setIsOverallLoading] = useState(false); // Pour le spinner global de l'input
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const chatMessagesRef = useRef(null);
  const streamReaderRef = useRef(null); // Pour garder le reader courant

  const { getAllFormData, currentStepKey, form8DData, updateFormField } = useForm8D();

  const scrollToBottom = () => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  };

  useEffect(scrollToBottom, [messages]);

  const handleInputChange = (e) => setUserInput(e.target.value);

  const handleSendMessage = async (event) => {
    if (event) event.preventDefault(); // Permet d'appeler sans événement (ex: action automatique)
    const text = userInput.trim();
    if (text === '' && event) return; // Si appelé par un événement et que l'input est vide

    const userMsg = { id: uuidv4(), text, sender: 'user', isLoading: false };
    setMessages(prev => [...prev, userMsg]);
    setUserInput('');
    setIsOverallLoading(true);
    setError(null);

    const all8DData = getAllFormData();
    const currentSectionData = form8DData[currentStepKey] || {};
    
    let botMessageId = uuidv4(); // ID pour la bulle de réponse du bot

    try {
      const payload = {
        query: text,
        form_data: all8DData,
        current_section_data: currentSectionData,
        current_section_name: currentStepKey
      };

      // Ajoute une bulle de bot en attente
      setMessages(prev => [...prev, { id: botMessageId, text: '', sender: 'bot', isLoading: true }]);

      const response = await fetch('http://localhost:8000/query_with_context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: `Erreur HTTP ${response.status}` }));
        throw new Error(errorData.detail || `Erreur serveur ${response.status}`);
      }
      if (!response.body) throw new Error('Pas de flux de réponse du serveur.');
      
      const reader = response.body.getReader();
      streamReaderRef.current = reader; // <-- Stocke le reader pour pouvoir l'annuler
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let doneReadingStream = false;

      while (!doneReadingStream) {
        const { value, done } = await reader.read();
        doneReadingStream = done;

        if (value) {
          buffer += decoder.decode(value, { stream: true });
        }
        
        // Traiter les lignes complètes dans le buffer
        // La dernière ligne est gardée dans le buffer sauf si le stream est fini
        let lastNewlineIndex = buffer.lastIndexOf('\n');
        let processBufferUpTo = buffer.length;
        if (!doneReadingStream && lastNewlineIndex !== -1) {
            processBufferUpTo = lastNewlineIndex + 1;
        }

        const linesToProcess = buffer.substring(0, processBufferUpTo);
        buffer = buffer.substring(processBufferUpTo);
        
        const lines = linesToProcess.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          const lineWithoutThink = line.replace(/<think>.*?<\/think>/g, '');
          console.log('[CHAT ASSISTANT] Ligne brute à parser:', lineWithoutThink);
          let dataChunk;
          try { 
            dataChunk = JSON.parse(lineWithoutThink); 
          } catch (e) {
            console.error('ERREUR PARSING JSON sur la ligne:', lineWithoutThink, 'Erreur:', e);
            // Si une ligne est invalide, on peut l'ignorer ou afficher une erreur spécifique
            // setMessages(prev => [...prev, { id: uuidv4(), text: `Erreur de format de données reçues: ${line}`, sender: 'error' }]);
            continue; 
          }
          console.log('[CHAT ASSISTANT] Donnée parsée reçue:', dataChunk);

          // Mettre à jour la bulle de réponse du bot existante
          if (dataChunk.response !== undefined) {
            setMessages(prev => 
              prev.map(m => 
                m.id === botMessageId ? { ...m, text: dataChunk.response, isLoading: !dataChunk.done } : m
              )
            );
          }

          // Gérer le chunk final avec "done"
          if (dataChunk.done) {
            console.log('[CHAT ASSISTANT] Chunk final "done" reçu:', dataChunk);
            // S'assurer que la bulle de réponse principale est finalisée
            setMessages(prev => prev.map(m => m.id === botMessageId ? { ...m, isLoading: false } : m));

            // Ajouter la bulle des sources si des sources existent
            if (dataChunk.sources && Array.isArray(dataChunk.sources) && dataChunk.sources.length > 0) {
              console.log('[CHAT ASSISTANT] Préparation de la bulle des sources avec:', dataChunk.sources);
              const sourceHtmlContent = "<strong>Sources Pertinentes :</strong><ul>" +
                dataChunk.sources.map(s => 
                  `<li>` +
                  `  <strong>NC ID:</strong> ${s.nc_id || 'N/A'}<br/>` +
                  `  <strong>Fichier:</strong> ${s.source_file || 'N/A'}<br/>` +
                  `  <strong>Aperçu:</strong> <small>${s.preview || 'Aucun aperçu disponible'}</small>` +
                  `</li>`
                ).join('') + "</ul>";

              const sourcesMessageObject = {
                id: uuidv4(),
                htmlText: sourceHtmlContent,
                sender: 'system', // Style différent pour les infos système/sources
                isSourceBubble: true 
              };
              setMessages(prev => [...prev, sourcesMessageObject]); 
            } else {
              console.log('[CHAT ASSISTANT] Aucune source à afficher (data.sources vide, absente, ou non-tableau dans le chunk "done")');
            }

            // Ajouter la bulle de suggestion de champ si elle existe
            if (dataChunk.suggested_field_update) {
              const { section, field, value } = dataChunk.suggested_field_update;
              const suggestionText = `Je suggère pour la section '${section}', champ '${field}' : \"${value}\".`;
              const suggestionMessageObject = {
                id: uuidv4(),
                text: suggestionText,
                sender: 'bot', // Ou 'system'
                isSuggestion: true,
                suggestionDetails: dataChunk.suggested_field_update
              };
              setMessages(prev => [...prev, suggestionMessageObject]);
            }
          } 
        } 
      } 
    } catch (error) {
      console.error("Erreur dans handleSendMessage:", error);
      // Mettre à jour la bulle de chargement avec le message d'erreur ou ajouter une nouvelle
      setMessages(prev => {
        const errorMsgText = `Erreur: ${error.message || 'Une erreur inconnue est survenue.'}`;
        const existingBotMsgIndex = prev.findIndex(m => m.id === botMessageId && m.isLoading);
        if (existingBotMsgIndex !== -1) {
          const updatedMessages = [...prev];
          updatedMessages[existingBotMsgIndex] = { ...updatedMessages[existingBotMsgIndex], text: errorMsgText, isLoading: false, sender: 'error' };
          return updatedMessages;
        } else {
          return [...prev, { id: uuidv4(), text: errorMsgText, sender: 'error', isLoading: false }];
        }
      });
      setError(error.message || 'Une erreur inconnue est survenue.');
    } finally {
      setIsOverallLoading(false);
      streamReaderRef.current = null; // Nettoie le reader
      // Assurer qu'aucun message individuel ne reste en mode chargement si le flux s'est terminé (même par erreur)
      setMessages(prev => prev.map(m => m.isLoading ? { ...m, isLoading: false } : m));
    }
  };

  const applyFieldSuggestion = (section, field, value) => {
     updateFormField(section, field, value);
     const confirmationText = `Champ '${field}' de la section '${section}' mis à jour.`;
     setMessages(prev => [...prev, {id: uuidv4(), text: confirmationText, sender: 'system', isLoading: false }]);
  };

  // Bouton STOP : annule le stream
  const handleStopGeneration = () => {
    if (streamReaderRef.current) {
      try { streamReaderRef.current.cancel(); } catch (e) { /* ignore */ }
      streamReaderRef.current = null;
    }
    setIsOverallLoading(false);
    setMessages(prev => prev.map(m => m.isLoading ? { ...m, isLoading: false } : m));
  };

  return (
    <Paper elevation={3} sx={{
      p: 2, bgcolor: 'background.paper', borderRadius: 3, height: '100%',
      display: 'flex', flexDirection: 'column', boxShadow: 3
    }}>
      <Box sx={{ flex: 1, overflowY: 'auto', mb: 2, p:1 }} ref={chatMessagesRef}>
        {messages.map((msg) => (
          <Box 
            key={msg.id} 
            sx={{ 
              display: 'flex', 
              mb: 1.5, 
              flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row', 
              alignItems: 'flex-end' // Aligner en bas pour un look plus "chat"
            }}
          >
            <Avatar 
              sx={{ 
                bgcolor: msg.sender === 'user' ? 'primary.main' : 
                         (msg.sender === 'error' ? 'error.main' : 
                         (msg.sender === 'system' ? 'info.main' : 'secondary.main')), 
                color: 'white',
                ml: msg.sender === 'user' ? 1 : 0, 
                mr: msg.sender === 'user' ? 0 : 1,
                width: 32, height: 32, fontSize: '0.8rem' // Plus petit avatar
              }}
            >
              {msg.sender === 'user' ? 'U' : (msg.sender === 'error' ? 'E' : (msg.sender === 'system' ? 'S' : 'A'))}
            </Avatar>
            <Box 
              sx={{
                bgcolor: msg.sender === 'user' ? 'primary.light' : 
                         (msg.sender === 'error' ? 'error.light' : 
                         (msg.sender === 'system' ? 'info.light' : 'grey.100')),
                color: msg.sender === 'user' ? 'primary.contrastText' : 'text.primary',
                p: 1.5, 
                borderRadius: msg.sender === 'user' ? '15px 15px 0 15px' : '15px 15px 15px 0', // Bulles de chat classiques
                maxWidth: '75%', 
                boxShadow: 1, 
                position: 'relative',
                wordBreak: 'break-word' // Pour les longs mots/urls
              }}
            >
              {msg.isLoading && msg.sender === 'bot' && (
                <CircularProgress 
                  size={16} 
                  sx={{ 
                    position: 'absolute', 
                    top: '50%', 
                    left: '50%', 
                    marginTop: '-8px', 
                    marginLeft: '-8px',
                    color: msg.sender === 'user' ? 'primary.contrastText' : 'text.secondary'
                  }} 
                />
              )}
              
              {msg.htmlText ? 
                <div dangerouslySetInnerHTML={{ __html: msg.htmlText }} /> 
                : 
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{msg.text}</Typography>
              }

              {msg.isSuggestion && msg.suggestionDetails && (
                <button
                  onClick={() => applyFieldSuggestion(msg.suggestionDetails.section, msg.suggestionDetails.field, msg.suggestionDetails.value)}
                  style={{ 
                    display: 'block', 
                    marginTop: '10px', 
                    padding: '6px 12px', 
                    fontSize: '0.875rem', 
                    cursor: 'pointer', 
                    backgroundColor: '#4CAF50', // Vert
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '4px',
                    boxShadow: '0 2px 2px 0 rgba(0,0,0,0.14), 0 3px 1px -2px rgba(0,0,0,0.12), 0 1px 5px 0 rgba(0,0,0,0.20)'
                  }}
                >
                  Appliquer la Suggestion
                </button>
              )}
            </Box>
          </Box>
        ))}
        <div ref={messagesEndRef} />
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pt:1, borderTop: '1px solid', borderColor: 'divider' }}>
        <TextField
          fullWidth
          placeholder="Posez votre question..."
          value={userInput}
          onChange={handleInputChange}
          onKeyDown={e => {if (e.key === 'Enter' && !e.shiftKey) { handleSendMessage(e); e.preventDefault();}}} // Envoyer avec Entrée (pas Shift+Entrée)
          disabled={isOverallLoading}
          size="small"
          variant="outlined"
        />
        <IconButton color="primary" onClick={handleSendMessage} disabled={isOverallLoading || !userInput.trim()}>
          {isOverallLoading ? <CircularProgress size={24} /> : <SendIcon />}
        </IconButton>
        {isOverallLoading && (
          <IconButton color="error" onClick={handleStopGeneration} title="Arrêter la génération" sx={{ bgcolor: '#fff', border: '1px solid #d32f2f', ml: 1 }}>
            <StopIcon />
          </IconButton>
        )}
      </Box>
      <Snackbar 
        open={!!error} 
        message={error} 
        autoHideDuration={6000} 
        onClose={() => setError(null)} 
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Paper>
  );
}
export default ChatAssistant;