// src/components/ChatAssistant.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useForm8D } from '../contexts/Form8DContext'; // Importer le hook
// import './ChatAssistant.css'; // Si vous avez des styles spécifiques

function ChatAssistant() {
  const [messages, setMessages] = useState([
     { id: 'initial', text: 'Bonjour ! Comment puis-je vous aider avec votre 8D ?', sender: 'bot' }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null); // Pour le scroll
  const chatMessagesRef = useRef(null);

  // Utiliser le contexte pour les données du formulaire et la section actuelle
  const { getAllFormData, currentStepKey, form8DData, updateFormField } = useForm8D();

  const scrollToBottom = () => {
     if (chatMessagesRef.current) {
         chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
     }
  };

  useEffect(scrollToBottom, [messages]);

  const handleInputChange = (e) => setUserInput(e.target.value);

  const handleSendMessage = async (event) => {
    event.preventDefault();
    const text = userInput.trim();
    if (text === '') return;

    const userMsg = { id: Date.now(), text, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setUserInput('');
    setIsLoading(true);

    const all8DData = getAllFormData(); // Toutes les données du formulaire
    const currentSectionData = form8DData[currentStepKey] || {}; // Données de la section active

    try {
      const payload = {
        query: text,
        form_data: all8DData,
        current_section_data: currentSectionData,
        current_section_name: currentStepKey
      };

      const response = await fetch('http://localhost:8000/query_with_context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`);
      const data = await response.json();

      const botRes = { id: Date.now() + 1, text: data.response, sender: 'bot' };
      setMessages(prev => [...prev, botRes]);

      if (data.sources && data.sources.length > 0) {
         const sourceText = "<strong>Sources :</strong><ul>" +
             data.sources.map(s => `<li>${s.nc_id}</li>`).join('') + "</ul>";
         const sourcesMsg = { id: Date.now() + 2, htmlText: sourceText, sender: 'bot', isSource: true };
         setMessages(prev => [...prev, sourcesMsg]);
      }

      if (data.suggested_field_update) {
        const { section, field, value } = data.suggested_field_update;
        const suggestionMsgText = `Je suggère : ${section} -> ${field} = "${value}".`;
        const suggestionMsg = {
            id: Date.now() + 3,
            text: suggestionMsgText,
            sender: 'bot',
            isSuggestion: true,
            suggestionDetails: { section, field, value }
        };
        setMessages(prev => [...prev, suggestionMsg]);
      }

    } catch (error) {
      console.error("Erreur chat:", error);
      setMessages(prev => [...prev, { id: Date.now(), text: `Erreur: ${error.message}`, sender: 'bot' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFieldSuggestion = (section, field, value) => {
     updateFormField(section, field, value); // Mettre à jour le formulaire via le contexte
     const confirmationText = `Champ ${field} de ${section} mis à jour.`;
     setMessages(prev => [...prev, {id: Date.now(), text: confirmationText, sender: 'system'}]);
  };

  return (
    <div className="chat-container" style={{ height: '100%', display: 'flex', flexDirection: 'column', border: '1px solid #ccc', borderRadius: '8px' }}>
      <div className="chat-header" style={{ padding: '10px', background: '#007bff', color: 'white', textAlign: 'center' }}>Assistant 8D</div>
      <div className="chat-messages" ref={chatMessagesRef} style={{ flex: 1, padding: '10px', overflowY: 'auto' }}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`message ${msg.sender === 'user' ? 'user-message' : (msg.sender === 'system' ? 'system-message' : 'bot-message')}`}
            style={{ marginBottom: '10px', padding: '8px', borderRadius: '5px', maxWidth: '80%', alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', background: msg.sender === 'user' ? '#dc3545' : (msg.sender === 'system' ? '#6c757d' : '#e9ecef'), color: msg.sender === 'user' || msg.sender === 'system' ? 'white' : 'black' }}
          >
            {msg.htmlText ? <div dangerouslySetInnerHTML={{ __html: msg.htmlText }} /> : msg.text}
            {msg.isSuggestion && msg.suggestionDetails && (
              <button
                onClick={() => applyFieldSuggestion(msg.suggestionDetails.section, msg.suggestionDetails.field, msg.suggestionDetails.value)}
                style={{ marginLeft: '10px', fontSize: '0.8em', padding: '3px 6px', cursor: 'pointer' }}
              >
                Appliquer
              </button>
            )}
          </div>
        ))}
        {isLoading && <div className="message bot-message" style={{fontStyle: 'italic'}}>Recherche en cours...</div>}
        <div ref={messagesEndRef} />
      </div>
      <form className="chat-input" onSubmit={handleSendMessage} style={{ display: 'flex', borderTop: '1px solid #ccc' }}>
        <input
          type="text"
          value={userInput}
          onChange={handleInputChange}
          placeholder="Posez votre question..."
          style={{ flex: 1, padding: '10px', border: 'none' }}
          disabled={isLoading}
        />
        <button type="submit" style={{ padding: '10px', background: '#28a745', color: 'white', border: 'none', cursor: 'pointer' }} disabled={isLoading}>
          {isLoading ? '...' : 'Envoyer'}
        </button>
      </form>
    </div>
  );
}
export default ChatAssistant;