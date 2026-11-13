import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, User, RefreshCw } from 'lucide-react';
import aiService from '../../services/aiService';

const AIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: "Hello! I am your AI Drone Fleet Assistant. Ask me anything about drone health, battery levels, maintenance schedules, or mission planning suggestions.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (messageToSend) => {
    const text = (messageToSend || inputMessage).trim();
    if (!text || loading) return;

    const userMsg = {
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const response = await aiService.sendMessage(text);
      const aiReply = {
        sender: 'ai',
        text: response.response || 'No response received from AI model.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiReply]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: '⚠️ Unable to connect to Drone AI Assistant. Please ensure backend services are reachable.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const samplePrompts = [
    'Which drones have low battery?',
    'What drones are in flight right now?',
    'Any maintenance due this week?',
    'Give me a fleet readiness summary',
  ];

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 999 }}>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            width: '58px',
            height: '58px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #00d4ff 0%, #3b82f6 100%)',
            border: 'none',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(0, 212, 255, 0.4), 0 0 20px rgba(59, 130, 246, 0.3)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
          title="Open AI Fleet Assistant"
        >
          <Bot size={28} />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          style={{
            width: '380px',
            height: '540px',
            backgroundColor: '#0a0f24',
            border: '1px solid rgba(0, 212, 255, 0.3)',
            borderRadius: '18px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 30px rgba(0, 212, 255, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'chatSlideUp 0.25s ease-out',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 18px',
              background: 'linear-gradient(90deg, #0d1536 0%, #111b47 100%)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #00d4ff, #8b5cf6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                }}
              >
                <Bot size={20} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#ffffff', fontWeight: 600 }}>
                  Drone AI Assistant
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: '#10b981',
                    }}
                  />
                  <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 500 }}>
                    Powered by Gemini & Telemetry
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '4px',
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages List */}
          <div
            style={{
              flex: 1,
              padding: '16px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {messages.map((m, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: m.sender === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: '82%',
                    padding: '10px 14px',
                    borderRadius:
                      m.sender === 'user'
                        ? '14px 14px 2px 14px'
                        : '14px 14px 14px 2px',
                    backgroundColor:
                      m.sender === 'user' ? '#0284c7' : 'rgba(30, 41, 59, 0.8)',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    lineHeight: '1.45',
                    wordBreak: 'break-word',
                    border:
                      m.sender === 'ai'
                        ? '1px solid rgba(255, 255, 255, 0.08)'
                        : 'none',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {m.text}
                </div>
                <span
                  style={{
                    fontSize: '0.65rem',
                    color: '#64748b',
                    marginTop: '3px',
                    padding: '0 4px',
                  }}
                >
                  {m.timestamp}
                </span>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00d4ff' }}>
                <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  Analyzing fleet telemetry...
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions */}
          <div
            style={{
              padding: '6px 12px',
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              borderTop: '1px solid rgba(255, 255, 255, 0.05)',
              scrollbarWidth: 'none',
            }}
          >
            {samplePrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSend(prompt)}
                style={{
                  whiteSpace: 'nowrap',
                  fontSize: '0.72rem',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  border: '1px solid rgba(0, 212, 255, 0.25)',
                  backgroundColor: 'rgba(0, 212, 255, 0.06)',
                  color: '#38bdf8',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            style={{
              padding: '12px 14px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              gap: '8px',
              backgroundColor: '#070b1a',
            }}
          >
            <input
              type="text"
              placeholder="Ask fleet AI anything..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              style={{
                flex: 1,
                padding: '9px 14px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                color: '#ffffff',
                fontSize: '0.85rem',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={loading || !inputMessage.trim()}
              style={{
                padding: '0 14px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #00d4ff, #3b82f6)',
                color: '#ffffff',
                cursor: loading || !inputMessage.trim() ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: loading || !inputMessage.trim() ? 0.6 : 1,
              }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}

      <style>{`
        @keyframes chatSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
};

export default AIChatbot;
