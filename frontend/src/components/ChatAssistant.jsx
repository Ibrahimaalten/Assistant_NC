import React, { useState, useEffect, useRef } from 'react';
import { useForm8D } from '../contexts/Form8DContext';
import { COLORS } from '../colors'; // Assurez-vous que ce chemin est correct

import {
  Box,
  Paper,
  Avatar,
  Typography,
  TextField,
  IconButton,
  CircularProgress,
  Snackbar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import StopIcon from '@mui/icons-material/Stop';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { v4 as uuidv4 } from 'uuid';
import parse from 'html-react-parser';

// --- FONCTIONS UTILITAIRES ---
function markdownToHtml(mdn) {
  if (typeof mdn !== 'string') return '';
  let html = mdn.replace(/</g, '<').replace(/>/g, '>');
  html = html.replace(/\n/g, '<br />');
  // Vous pouvez ajouter ici le reste de votre parseur Markdown si nécessaire
  return html;
}

// --- COMPOSANT PRINCIPAL ---
function ChatAssistant() {
  const [messages, setMessages] = useState([
    { id: uuidv4(), text: 'Bonjour ! Comment puis-je vous aider avec votre 8D ?', sender: 'bot', isLoading: false, isQuestion: true, exchangeId: 'initial' }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isOverallLoading, setIsOverallLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chatMode, setChatMode] = useState('CHAT'); // 'CHAT' ou 'REQ'
  
  const messagesEndRef = useRef(null);
  const chatMessagesRef = useRef(null);
  const streamReaderRef = useRef(null);

  const { getAllFormData, currentStepKey, form8DData, updateFormField } = useForm8D();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    setMessages([
      { id: uuidv4(), text: 'Bonjour ! Comment puis-je vous aider ?', sender: 'bot', isLoading: false, isQuestion: true, exchangeId: 'initial' }
    ]);
    setUserInput('');
  }, [chatMode]);

  const handleInputChange = (e) => setUserInput(e.target.value);

  // La logique de handleSendMessage est déjà parfaite et n'a pas besoin d'être modifiée.
  // Elle assigne déjà correctement les exchangeId.
  const handleSendMessage = async (event) => {
    if (event) event.preventDefault();
    let text = userInput.trim();
    if (chatMode === 'REQ') text = '';
    if (text === '' && event && chatMode !== 'REQ') return;

    const exchangeId = uuidv4();

    const userMsg = { id: uuidv4(), text, sender: 'user', isLoading: false, exchangeId };
    setMessages(prev => [...prev, userMsg]);
    setUserInput('');
    setIsOverallLoading(true);
    setError(null);

    const all8DData = getAllFormData();
    const currentSectionData = form8DData[currentStepKey] || {};
    const botMessageId = uuidv4();
    let reasoningBuffer = '';
    let reasoningAlreadyAdded = false;
    const seenReasoningChunks = new Set();
    
    try {
      const payload = {
        query: text,
        form_data: all8DData,
        current_section_data: currentSectionData,
        current_section_name: currentStepKey,
        mode: chatMode,
        model_key: "dengcao_qwen3_4b"
      };

      setMessages(prev => [...prev, { id: botMessageId, text: '', sender: 'bot', isLoading: true, exchangeId }]);

      const response = await fetch('http://localhost:8000/query_with_context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: `Erreur HTTP ${response.status}` }));
        throw new Error(errorData.detail || `Erreur serveur ${response.status}`);
      }
      
      // La logique de streaming reste la même...
      // ...
       if (chatMode === 'REQ') {
        const data = await response.json();
        setMessages(prev => prev.map(m => m.id === botMessageId ? { ...m, isLoading: false } : m));
        if (data.sources && Array.isArray(data.sources) && data.sources.length > 0) {
          const sourceHtmlContent = "<strong>Sources Pertinentes :</strong><ul>" +
            data.sources.map(s =>
              `<li>` +
              `  <strong>NC ID:</strong> ${s.nc_id || 'N/A'}<br/>` +
              `  <strong>Aperçu:</strong> <small>${ s.content || 'Aucun aperçu disponible'}</small>` +
              `</li>`
            ).join('') + "</ul>";
          const sourcesMessageObject = {
            id: uuidv4(),
            htmlText: sourceHtmlContent,
            sender: 'system',
            isSourceBubble: true
          };
          setMessages(prev => [...prev, sourcesMessageObject]);
        } else {
          setMessages(prev => prev.map(m => m.id === botMessageId ? { ...m, text: 'Aucune source similaire trouvée.', isLoading: false } : m));
        }
        setIsOverallLoading(false);
        streamReaderRef.current = null;
        return;
      }
      
      if (!response.body) throw new Error('Pas de flux de réponse du serveur.');

      const reader = response.body.getReader();
      streamReaderRef.current = reader;
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let doneReadingStream = false;

      while (!doneReadingStream) {
        const { value, done } = await reader.read();
        doneReadingStream = done;

        if (value) {
          buffer += decoder.decode(value, { stream: true });
        }

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
          let dataChunk;
          try {
            dataChunk = JSON.parse(lineWithoutThink);
          } catch (e) {
            console.error('ERREUR PARSING JSON sur la ligne:', lineWithoutThink, 'Erreur:', e);
            continue;
          }

          const thinkMatches = line.match(/<think>([\s\S]*?)<\/think>/);
          if (thinkMatches && thinkMatches[1]) {
            const currentReasoning = thinkMatches[1].trim();
            if (!seenReasoningChunks.has(currentReasoning)) {
              reasoningBuffer += currentReasoning + '\n\n';
              seenReasoningChunks.add(currentReasoning);
            }
          }

          if (dataChunk.response !== undefined) {
            setMessages(prev =>
              prev.map(m =>
                m.id === botMessageId ? { ...m, text: dataChunk.response, isLoading: !dataChunk.done } : m
              )
            );
          }

          if (dataChunk.done) {
            if (!reasoningAlreadyAdded && reasoningBuffer.trim() !== '') {
              reasoningAlreadyAdded = true;
              const reasoningMessage = {
                id: uuidv4(),
                text: reasoningBuffer.trim(),
                sender: 'reasoning',
                isReasoning: true,
                exchangeId
              };
              setMessages(prev => [...prev, reasoningMessage]);
            }

            setMessages(prev => prev.map(m => m.id === botMessageId ? { ...m, isLoading: false } : m));

            if (dataChunk.sources && Array.isArray(dataChunk.sources) && dataChunk.sources.length > 0) {
              const sourceHtmlContent = "<strong>Sources Pertinentes :</strong><ul>" +
                dataChunk.sources.map(s =>
                  `<li>` +
                  `  <strong>NC ID:</strong> ${s.nc_id || 'N/A'}<br/>` +
                  `  <strong>Aperçu:</strong> <small>${ s.content || 'Aucun aperçu disponible'}</small>` +
                  `</li>`
                ).join('') + "</ul>";

              const sourcesMessageObject = {
                id: uuidv4(),
                htmlText: sourceHtmlContent,
                sender: 'system',
                isSourceBubble: true,
                exchangeId
              };
              setMessages(prev => [...prev, sourcesMessageObject]);
            }

            if (dataChunk.suggested_field_update) {
              const { section, field, value } = dataChunk.suggested_field_update;
              const suggestionText = `Je suggère pour la section '${section}', champ '${field}' : \"${value}\".`;
              const suggestionMessageObject = {
                id: uuidv4(),
                text: suggestionText,
                sender: 'bot',
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
      streamReaderRef.current = null;
      setMessages(prev => prev.map(m => m.isLoading ? { ...m, isLoading: false } : m));
    }

  };

  const applyFieldSuggestion = (section, field, value) => {
    updateFormField(section, field, value);
    const confirmationText = `Champ '${field}' de la section '${section}' mis à jour.`;
    setMessages(prev => [...prev, { id: uuidv4(), text: confirmationText, sender: 'system', isLoading: false }]);
  };

  const handleStopGeneration = () => {
    if (streamReaderRef.current) {
      try { streamReaderRef.current.cancel(); } catch (e) { /* ignore */ }
      streamReaderRef.current = null;
    }
    setIsOverallLoading(false);
    setMessages(prev => prev.map(m => m.isLoading ? { ...m, isLoading: false } : m));
  };


  // ##################################################################
  // # NOUVELLE LOGIQUE DE RENDU JSX
  // ##################################################################
  const renderMessageBubble = (msg) => (
    <Box 
      key={msg.id} 
      sx={{ 
        display: 'flex', 
        mb: 1.5, 
        flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row', 
        alignItems: 'flex-end'
      }}
    >
      <Avatar 
        sx={{ 
          bgcolor: msg.sender === 'user' ? COLORS.primaryDark : 
                   msg.sender === 'bot' ? COLORS.accentBlue :
                   msg.sender === 'reasoning' ? '#ab47bc' :
                   msg.sender === 'error' ? COLORS.error : 
                   COLORS.accentGreen,
          color: COLORS.white,
          ml: msg.sender === 'user' ? 1 : 0, 
          mr: msg.sender === 'user' ? 0 : 1,
          width: 32, height: 32, fontSize: '0.8rem',
          boxShadow: '0 1px 4px #e3eafc'
        }}
      >
        {msg.sender === 'user' ? 'U' :
         msg.sender === 'bot' ? 'A' :
         msg.sender === 'reasoning' ? '🧠' :
         msg.sender === 'error' ? 'E' : 'S'}
      </Avatar>
      <Box 
        sx={{
          bgcolor: msg.sender === 'user' ? COLORS.primaryDark : 
                   msg.sender === 'bot' ? '#eaf1fb' :
                   msg.sender === 'reasoning' ? '#f3e5f5' :
                   msg.sender === 'error' ? '#ffeaea' : 
                   '#e6f7ef',
          color: msg.sender === 'user' ? COLORS.white : (msg.sender === 'error' ? COLORS.error : (msg.sender === 'system' ? '#218c5a' : COLORS.primaryDark)),
          p: 1.5, 
          borderRadius: msg.sender === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          maxWidth: '85%', 
          boxShadow: '0 2px 8px #e3eafc',
          position: 'relative',
          wordBreak: 'break-word',
          border: msg.sender === 'user' ? 'none' : '1px solid #e3eafc',
          fontSize: '0.95rem',
        }}
      >
        {msg.isLoading && <CircularProgress size={16} sx={{ position: 'absolute', top: '50%', left: '50%', marginTop: '-8px', marginLeft: '-8px', color: COLORS.primaryDark }} />}
        {msg.htmlText ? <div dangerouslySetInnerHTML={{ __html: msg.htmlText }} /> : <Typography variant="body2" component="div" sx={{ whiteSpace: 'pre-wrap', color: 'inherit' }}>{parse(markdownToHtml(msg.text))}</Typography>}
        {msg.isSuggestion && msg.suggestionDetails && (
          <button onClick={() => applyFieldSuggestion(msg.suggestionDetails.section, msg.suggestionDetails.field, msg.suggestionDetails.value)} style={{ display: 'block', marginTop: '10px', padding: '6px 12px', fontSize: '0.875rem', cursor: 'pointer', backgroundColor: COLORS.accentGreen, color: COLORS.white, border: 'none', borderRadius: '4px', boxShadow: '0 2px 2px 0 rgba(0,0,0,0.10)' }}>
            Appliquer la Suggestion
          </button>
        )}
      </Box>
    </Box>
  );

  return (
    <Paper elevation={3} sx={{
      p: { xs: 1, sm: 2 },
      bgcolor: COLORS.background,
      borderRadius: 4,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 4px 24px 0 rgba(35,57,93,0.10)',
      border: `1.5px solid ${COLORS.primaryDark}20`
    }}>
      <FormControl size="small" sx={{ mb: 1, minWidth: 120, bgcolor: COLORS.white, borderRadius: 2, boxShadow: '0 1px 4px #e3eafc' }}>
        <InputLabel id="chat-mode-label" sx={{ color: COLORS.primaryDark, fontWeight: 600 }}>Mode</InputLabel>
        <Select labelId="chat-mode-label" id="chat-mode-select" value={chatMode} label="Mode" onChange={e => setChatMode(e.target.value)} sx={{ color: COLORS.primaryDark, bgcolor: COLORS.white, '& .MuiSelect-icon': { color: COLORS.primaryDark } }}>
          <MenuItem value="CHAT" sx={{ color: COLORS.primaryDark }}>Chat (Accordéon)</MenuItem>
          <MenuItem value="REQ" sx={{ color: COLORS.accentGreen }}>Requête (Linéaire)</MenuItem>
        </Select>
      </FormControl>
      
      <Box sx={{ flex: 1, overflowY: 'auto', mb: 2, p:1, background: '#f7fafd', borderRadius: 2 }} ref={chatMessagesRef}>
        {/* // -- Début du rendu conditionnel -- */}

        {chatMode === 'CHAT' ? (
          // Branche pour le mode 'CHAT' (Accordéons)
          (() => {
            const groupedByExchange = messages.reduce((acc, msg) => {
              const id = msg.exchangeId || 'unknown';
              if (!acc[id]) acc[id] = [];
              acc[id].push(msg);
              return acc;
            }, {});

            const exchangeOrder = messages
              .map(m => m.exchangeId)
              .filter((id, index, self) => id && self.indexOf(id) === index);
            
            return exchangeOrder.map((exchangeId, index) => {
              const exchangeMessages = groupedByExchange[exchangeId];
              const userMsg = exchangeMessages.find(m => m.sender === 'user');
              const summaryText = userMsg ? userMsg.text : "Début de la conversation";

              return (
                <Accordion key={exchangeId} defaultExpanded={index === exchangeOrder.length - 1} sx={{ mb: 2, '&:before': { display: 'none' }, borderRadius: 2, boxShadow: 3 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Avatar sx={{ bgcolor: COLORS.primaryDark, color: COLORS.white, width: 28, height: 28, mr: 1.5 }}>
                      {userMsg ? 'U' : 'A'}
                    </Avatar>
                    <Typography fontWeight="bold" noWrap>
                      {summaryText}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 1, display: 'flex', flexDirection: 'column' }}>
                    {exchangeMessages.map(msg => renderMessageBubble(msg))}
                  </AccordionDetails>
                </Accordion>
              );
            });
          })()
        ) : (
          // Branche pour le mode 'REQ' (Affichage linéaire classique)
          messages.map(msg => renderMessageBubble(msg))
        )}

        {/* // -- Fin du rendu conditionnel -- */}
        <div ref={messagesEndRef} />
      </Box>

      {/* La zone de saisie reste identique et s'adapte au mode */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pt:1, borderTop: '1px solid', borderColor: '#e3eafc', background: COLORS.white, borderRadius: 2, p: 1, boxShadow: '0 1px 4px #e3eafc' }}>
        {chatMode === 'CHAT' ? (
          <>
            <TextField fullWidth placeholder="Posez votre question..." value={userInput} onChange={handleInputChange} onKeyDown={e => {if (e.key === 'Enter' && !e.shiftKey) { handleSendMessage(e); e.preventDefault();}}} disabled={isOverallLoading} size="small" variant="outlined" sx={{ bgcolor: COLORS.white, borderRadius: 2 }} multiline maxRows={4}/>
            <IconButton sx={{ bgcolor: COLORS.primaryDark, color: COLORS.white, '&:hover': { bgcolor: COLORS.accentBlue }, boxShadow: '0 1px 4px #e3eafc' }} onClick={handleSendMessage} disabled={isOverallLoading || !userInput.trim()}>
              {isOverallLoading ? <CircularProgress size={24} sx={{color: 'white'}} /> : <SendIcon />}
            </IconButton>
          </>
        ) : (
          <>
            <button style={{ background: COLORS.accentBlue, color: COLORS.white, border: 'none', borderRadius: 8, padding: '0.7rem 1.5rem', fontWeight: 600, fontSize: '1rem', cursor: 'pointer', boxShadow: '0 2px 8px #e3eafc', width: '100%' }} disabled={isOverallLoading} onClick={() => handleSendMessage({ preventDefault: () => {} })}>
              {isOverallLoading ? 'Recherche...' : 'Rechercher des NC similaires'}
            </button>
          </>
        )}
        {isOverallLoading && (
          <IconButton sx={{ bgcolor: COLORS.white, color: COLORS.error, border: '1px solid', borderColor: COLORS.error, ml: 1, boxShadow: '0 1px 4px #e3eafc' }} onClick={handleStopGeneration} title="Arrêter la génération">
            <StopIcon />
          </IconButton>
        )}
      </Box>
      <Snackbar open={!!error} message={error} onClose={() => setError(null)} autoHideDuration={6000} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}/>
    </Paper>
  );
}

export default ChatAssistant;