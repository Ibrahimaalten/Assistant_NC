// src/components/ChatAssistant.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useForm8D } from '../contexts/Form8DContext';
import {
  Box, Paper, Avatar, Typography, TextField,
  IconButton, CircularProgress, Snackbar, Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import StopIcon from '@mui/icons-material/Stop';
import { v4 as uuidv4 } from 'uuid'; // Pour des IDs uniques
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import parse from 'html-react-parser';

function ChatAssistant() {
  const [messages, setMessages] = useState([
    { id: uuidv4(), text: 'Bonjour ! Comment puis-je vous aider avec votre 8D ?', sender: 'bot', isLoading: false, isQuestion: true }

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

    const exchangeId = uuidv4(); // identifiant unique pour cet échange

    const userMsg = { id: uuidv4(), text, sender: 'user', isLoading: false, exchangeId };
    setMessages(prev => [...prev, userMsg]);
    setUserInput('');
    setIsOverallLoading(true);
    setError(null);

    const all8DData = getAllFormData();
    const currentSectionData = form8DData[currentStepKey] || {};

    const botMessageId = uuidv4(); // ID pour la bulle de réponse du bot

    let reasoningBuffer = '';
    let reasoningAlreadyAdded = false;
    // Pour éviter les doublons de raisonnement
    const seenReasoningChunks = new Set();


    try {
      const payload = {
        query: text,
        form_data: all8DData,
        current_section_data: currentSectionData,
        current_section_name: currentStepKey
      };

      // Ajoute une bulle de chargement pour le bot
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
          console.log('[CHAT ASSISTANT] Ligne brute à parser :', lineWithoutThink);
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

          // Vérifier si le chunk contient un raisonnement
          const thinkMatches = line.match(/<think>([\s\S]*?)<\/think>/);
          if (thinkMatches && thinkMatches[1]) {
            const currentReasoning = thinkMatches[1].trim();
            if (!seenReasoningChunks.has(currentReasoning)) {
              reasoningBuffer += currentReasoning + '\n\n';
              seenReasoningChunks.add(currentReasoning);
            }
          }

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
            // Ajout du raisonnement si existant et non déjà affiché
            if (!reasoningAlreadyAdded && reasoningBuffer.trim() !== '') {
              reasoningAlreadyAdded = true; // Empêche les futurs doublons
              const reasoningMessage = {
                id: uuidv4(),
                text: reasoningBuffer.trim(),
                sender: 'reasoning',
                isReasoning: true,
                exchangeId
              };
              setMessages(prev => [...prev, reasoningMessage]);
            }

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
                isSourceBubble: true,
                exchangeId
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
    setMessages(prev => [...prev, { id: uuidv4(), text: confirmationText, sender: 'system', isLoading: false }]);
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

  // Styles pour les bulles de messages
  const bubbleStyles = {
    user: {
      backgroundColor: '#e3f2fd',
      borderLeft: '5px solid #1976d2'
    },
    bot: {
      backgroundColor: '#fff8e1',
      borderLeft: '5px solid #ffb300'
    },
    reasoning: {
      backgroundColor: '#f3e5f5',
      borderLeft: '5px solid #ab47bc'
    },
    system: {
      backgroundColor: '#ede7f6',
      borderLeft: '5px solid #5c6bc0'
    },
    error: {
      backgroundColor: '#ffebee',
      borderLeft: '5px solid #d32f2f'
    }
  };
  
  return (
    <Paper elevation={3} sx={{ p: 2, borderRadius: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ flex: 1, overflowY: 'auto', mb: 2 }} ref={chatMessagesRef}>
        {(() => {
          // 1. Grouper tous les messages par échange (exchangeId)
          const groupedByExchange = messages.reduce((acc, msg) => {
            const id = msg.exchangeId || 'default';  // Ou tout autre clé unique par échange
            if (!acc[id]) acc[id] = [];
            acc[id].push(msg);
            return acc;
          }, {});

          // 2. Récupérer les groupes dans l'ordre (par ex. ordre d'apparition)
          const exchangesOrder = Object.keys(groupedByExchange);

          // 3. Rendu : un bloc Paper/Card par échange contenant les messages triés dans l'ordre souhaité
          return exchangesOrder.map(exchangeId => {
            const exchangeMessages = groupedByExchange[exchangeId];

            // Trier et organiser les messages dans l'ordre voulu : question bot, utilisateur, raisonnement, réponse, sources
            const questionMsg = exchangeMessages.find(m => m.isQuestion || (m.sender === 'bot' && m.text.startsWith('Bonjour')));
            const userMsg = exchangeMessages.find(m => m.sender === 'user');
            const reasoningMsg = exchangeMessages.find(m => m.sender === 'reasoning');
            const responseMsg = exchangeMessages.find(m => m.sender === 'bot' && !m.isQuestion);
            const sourcesMsg = exchangeMessages.find(m => m.isSourceBubble);

            return (
              <Paper key={exchangeId} sx={{ mb: 2, p: 2 }}>
                {[questionMsg, userMsg, reasoningMsg, responseMsg, sourcesMsg].map((msg, idx) =>
                  msg ? (
                    <Accordion
                      key={msg.id || idx}
                      className="fade-in"
                      sx={{
                        mb: 1,
                        borderRadius: 2,
                        boxShadow: 3,
                        ...bubbleStyles[msg.sender] || {},
                        '&::before': { display: 'none' },
                        transition: 'transform 0.3s ease-in-out, background-color 0.3s',
                        '&:hover': {
                          transform: 'scale(1.01)'
                        }
                      }}
                    >

                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {msg.sender === 'user' && <Avatar sx={{ width: 24, height: 24 }}>U</Avatar>}
                          {msg.sender === 'bot' && <Avatar sx={{ width: 24, height: 24 }}>🤖</Avatar>}
                          {msg.sender === 'reasoning' && <Avatar sx={{ width: 24, height: 24 }}>🧠</Avatar>}
                          {msg.sender === 'system' && <Avatar sx={{ width: 24, height: 24 }}>ℹ️</Avatar>}
                          <Typography fontWeight="bold" sx={{ fontFamily: 'Roboto, sans-serif', fontSize: '1rem' }}>
                            {msg.sender === 'user' ? 'Message utilisateur' :
                              msg.sender === 'reasoning' ? 'Raisonnement du bot' :
                                msg.sender === 'bot' ? (msg.isQuestion ? 'Question du bot' : 'Réponse du bot') :
                                  msg.isSourceBubble ? 'Sources pertinentes' :
                                    'Message'}
                          </Typography>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails sx={{ position: 'relative', paddingTop: '36px' /* espace pour bouton */ }}>
                        <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 10 }}>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(msg.htmlText ? htmlToPlainText(msg.htmlText) : msg.text)
                              .then(() => {
                                alert('Texte copié !');
                              }).catch(err => {
                                alert('Erreur lors de la copie : ', err);
                              });
                            }}
                            style={{
                              fontSize: '0.75rem',
                              padding: '4px 8px',
                              background: '#1976d2',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                            aria-label="Copier le contenu"
                          >
                            Copier
                          </button>
                        </Box>
                        {msg.sender === 'reasoning' ? (
                          <div
                            style={{
                              whiteSpace: 'normal',
                              backgroundColor: '#f3e5f5', 
                              overflowX: 'auto',        // autoriser scroll horizontal si nécessaire
                              maxWidth: '100%',         // ne pas dépasser la largeur de la bulle
                              boxSizing: 'border-box',  // prendre en compte le padding et bordures
                            }}
                            dangerouslySetInnerHTML={{ __html: convertNewlinesToHtml(msg.text) }}
                          />
                        ) : (
                            <div
                              style={{
                                whiteSpace: 'pre-wrap',
                                overflowX: 'auto',        // autoriser scroll horizontal si nécessaire
                                maxWidth: '100%',         // ne pas dépasser la largeur de la bulle
                                boxSizing: 'border-box',  // prendre en compte le padding et bordures
                              }}>
                              {msg.htmlText
                                ? parse(msg.htmlText)
                                : parse(markdownToHtml(msg.text))
                              }
                            </div>
                        )}

                      </AccordionDetails>
                    </Accordion>
                  ) : null
                )}
              </Paper>
            );
          });
        })()}

        <div ref={messagesEndRef} />
      </Box>
      <Box component="form" onSubmit={handleSendMessage} sx={{ display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          value={userInput}
          onChange={handleInputChange}
          placeholder="Posez votre question..."
          disabled={isOverallLoading}
          size="small"
        />
        <IconButton type="submit" color="primary" disabled={!userInput.trim() || isOverallLoading}>
          {isOverallLoading ? <CircularProgress size={24} /> : <SendIcon />}
        </IconButton>
        {isOverallLoading && (
          <IconButton color="error" onClick={handleStopGeneration}>
            <StopIcon />
          </IconButton>
        )}
      </Box>
      <Snackbar
        open={!!error}
        message={error}
        onClose={() => setError(null)}
        autoHideDuration={6000}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Paper>
  );
}


// Fonction utilitaire pour convertir le texte Markdown en HTML
function markdownToHtml(mdn) {
  let html = mdn;

  // 1. Échappement des balises HTML
  html = html.replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // 2. Bloc de code multiligne ```code```
  html = html.replace(/```([\s\S]*?)```/g, (_, code) =>
    `<pre><code>${code}</code></pre>`
  );

  // 3. Blockquotes > texte
  html = html.replace(/^> (.+)$/gm, (_, line) =>
    `<blockquote>${line}</blockquote>`
  );

  // 4. Tableaux Markdown robustes
  html = html.replace(
    /^((?:\|.*\|\s*\n)+)(?=\n|$)/gm,
    tableBlock => {
      const lines = tableBlock.trim().split('\n').map(line => line.trim());
      if (lines.length < 2) return tableBlock;

      const headerLine = lines[0];
      const alignLine = lines[1];

      const isAlignLine = /^\|? *:?-+:? *(?:\| *:?-+:? *)+\|?$/.test(alignLine);
      if (!isAlignLine) return tableBlock;

      const headers = headerLine.replace(/^\||\|$/g, '').split('|').map(c => c.trim());
      const aligns = alignLine.replace(/^\||\|$/g, '').split('|').map(c => {
        c = c.trim();
        return c.startsWith(':') && c.endsWith(':') ? 'center' :
          c.endsWith(':') ? 'right' :
            c.startsWith(':') ? 'left' : 'left';
      });

      const thead = `<thead><tr>${headers.map((h, i) =>
        `<th style="text-align:${aligns[i] || 'left'}">${h}</th>`).join('')}</tr></thead>`;

      const rows = lines.slice(2).map(row => {
        const cells = row.replace(/^\||\|$/g, '').split('|').map(c => c.trim());
        return `<tr>${cells.map((c, i) =>
          `<td style="text-align:${aligns[i] || 'left'}">${c}</td>`).join('')}</tr>`;
      });

      return `<table>${thead}<tbody>${rows.join('')}</tbody></table>`;
    }
  );

  // 5. Titres h1 à h6
  for (let level = 6; level >= 1; level--) {
    const re = new RegExp(`^#{${level}}[ \\t]+(.+)$`, 'gm');
    html = html.replace(re, `<h${level}>$1</h${level}>`);
  }

  // 6. Listes numérotées
  html = html.replace(/^(\d+\.[ \t].+(?:\n\d+\.[ \t].+)*)/gm, block => {
    const items = block.split('\n').map(line =>
      line.replace(/^\d+\.[ \t]+(.+)/, '<li>$1</li>')).join('');
    return `<ol>${items}</ol>`;
  });

  // 7. Listes à puces
  html = html.replace(/^([-*][ \t].+(?:\n[-*][ \t].+)*)/gm, block => {
    const items = block.split('\n').map(line =>
      line.replace(/^[-*][ \t]+(.+)/, '<li>$1</li>')).join('');
    return `<ul>${items}</ul>`;
  });

  // 8. Images et liens
  html = html
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

  // 9. Gras et italique
  html = html
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');

  // 10. Paragraphes bien gérés (pas dans les blocs HTML)
  const blockTags = ['<h', '<ul', '<ol', '<li', '<blockquote', '<pre', '<table', '<img', '<p', '<code', '<th', '<td', '<tr'];
  html = html
    .split(/\n{2,}/)
    .map(block => {
      const trimmed = block.trim();
      if (trimmed === '') return '';
      const isHtmlBlock = blockTags.some(tag => trimmed.startsWith(tag));
      return isHtmlBlock ? trimmed : `<p>${trimmed}</p>`;
    })
    .join('\n');

  // Nettoyage final des sauts de ligne
  html = html
    .replace(/[\r\n]+/g, '\n')                 // Uniformise en LF
    .replace(/\n{3,}/g, '\n\n')                // Pas plus de 2 lignes vides
    .replace(/>\s*\n\s*</g, '><')              // Supprime les \n entre balises HTML
    .replace(/^\s+|\s+$/g, '');                // Trim global

  // Ajout de la classe CSS pour les tableaux 
  html = html.replace(/<table>/g, '<table class="markdown-table">');

  return html.trim();
}

// Fonction pour convertir HTML en texte brut
function htmlToPlainText(html) {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  return tempDiv.textContent || tempDiv.innerText || '';
}

// Fonction pour convertir les sauts de ligne en <br />
function convertNewlinesToHtml(text) {
  if (typeof text !== 'string') return '';
  return text.replace(/\n/g, '<br />');
}



export default ChatAssistant;