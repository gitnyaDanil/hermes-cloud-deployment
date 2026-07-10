import React, { useState, useEffect } from 'react';

// Simple markdown formatter helper to render SOUL.md without external libraries
const formatMarkdown = (text) => {
  if (!text) return '';
  // Basic replacements for headings, lists, bold text, and code
  let html = text
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^\* (.*$)/gim, '<li>$1</li>')
    .replace(/^\- (.*$)/gim, '<li>$1</li>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br />');
  return html;
};

function App() {
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [soul, setSoul] = useState('');
  const [status, setStatus] = useState({
    database_connected: false,
    total_sessions: 0,
    total_messages: 0,
    total_cost: 0,
    config: null
  });
  
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'soul' | 'config'
  const [loadingChat, setLoadingChat] = useState(false);

  // Fetch initial data
  useEffect(() => {
    fetchStatus();
    fetchConversations();
    fetchSoul();
  }, []);

  const fetchStatus = () => {
    fetch('http://localhost:3001/api/status')
      .then(res => res.json())
      .then(data => setStatus(data))
      .catch(err => console.error('Error fetching status:', err));
  };

  const fetchConversations = () => {
    fetch('http://localhost:3001/api/conversations')
      .then(res => res.json())
      .then(data => {
        setConversations(data);
        if (data.length > 0) {
          selectConversation(data[0].id);
        }
      })
      .catch(err => console.error('Error fetching conversations:', err));
  };

  const fetchSoul = () => {
    fetch('http://localhost:3001/api/soul')
      .then(res => res.json())
      .then(data => setSoul(data.soul))
      .catch(err => console.error('Error fetching SOUL:', err));
  };

  const selectConversation = (id) => {
    setSelectedId(id);
    setLoadingChat(true);
    fetch(`http://localhost:3001/api/conversations/${id}`)
      .then(res => res.json())
      .then(data => {
        setMessages(data);
        setLoadingChat(false);
      })
      .catch(err => {
        console.error('Error fetching messages:', err);
        setLoadingChat(false);
      });
  };

  const formatDate = (timestamp) => {
    // If SQLite stored timestamp as seconds since epoch instead of ms
    const date = new Date(timestamp * (timestamp < 10000000000 ? 1000 : 1));
    return date.toLocaleString();
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar - Conversation History */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-title">
            <div className="pulse-node"></div>
            Hermes Portfolio
          </div>
        </div>
        <div className="conversation-list">
          {conversations.map(conv => (
            <div 
              key={conv.id} 
              className={`conversation-item ${selectedId === conv.id ? 'active' : ''}`}
              onClick={() => selectConversation(conv.id)}
            >
              <div className="conv-title">{conv.title || 'Untitled Session'}</div>
              <div className="conv-meta">
                <span>{conv.message_count} msgs</span>
                <span>${conv.estimated_cost_usd ? conv.estimated_cost_usd.toFixed(4) : '0.00'}</span>
              </div>
            </div>
          ))}
          {conversations.length === 0 && (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
              No history found.
            </div>
          )}
        </div>
      </div>

      {/* Main Content Pane */}
      <div className="main-content">
        {/* Status Bar Header */}
        <div className="status-header">
          <div className="system-status">
            <div className="status-card">
              <span className="status-label">LLM Proxy:</span>
              <span className="status-val" style={{ color: status.database_connected ? 'var(--accent-teal)' : 'red' }}>
                {status.database_connected ? 'Online' : 'Offline'}
              </span>
            </div>
            <div className="status-card">
              <span className="status-label">Active Model:</span>
              <span className="status-val">{status.config?.target_model || 'Loading...'}</span>
            </div>
            <div className="status-card">
              <span className="status-label">Total Cost:</span>
              <span className="status-val">${status.total_cost} USD</span>
            </div>
            <div className="status-card">
              <span className="status-label">Database Sessions:</span>
              <span className="status-val">{status.total_sessions}</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button 
            className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            Chat History
          </button>
          <button 
            className={`tab-btn ${activeTab === 'soul' ? 'active' : ''}`}
            onClick={() => setActiveTab('soul')}
          >
            Agent Persona (SOUL)
          </button>
          <button 
            className={`tab-btn ${activeTab === 'config' ? 'active' : ''}`}
            onClick={() => setActiveTab('config')}
          >
            LiteLLM Router Config
          </button>
        </div>

        {/* Panel Content Display */}
        <div className="panel-body">
          {activeTab === 'chat' && (
            <div className="chat-window">
              <div className="chat-header">
                <span style={{ fontWeight: 600 }}>
                  {conversations.find(c => c.id === selectedId)?.title || 'Select a session'}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  ID: {selectedId}
                </span>
              </div>
              
              <div className="chat-messages">
                {loadingChat ? (
                  <div style={{ margin: 'auto', color: 'var(--accent-cyan)' }}>Loading conversations...</div>
                ) : messages.length > 0 ? (
                  messages.map((msg, i) => (
                    <div key={i} className={`message-bubble ${msg.role}`}>
                      {msg.reasoning_content && (
                        <div className="reasoning-block">
                          <strong>Thinking Process:</strong>
                          <p style={{ margin: '8px 0 0 0', whiteSpace: 'pre-wrap' }}>{msg.reasoning_content}</p>
                        </div>
                      )}
                      <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                      <div className="message-meta">
                        {formatDate(msg.timestamp)} {msg.token_count ? `(${msg.token_count} tokens)` : ''}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ margin: 'auto', color: 'var(--text-muted)' }}>
                    No messages in this conversation.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'soul' && (
            <div className="soul-card">
              <h2 style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px', marginTop: 0 }}>
                System Prompt (SOUL.md)
              </h2>
              <div 
                dangerouslySetInnerHTML={{ __html: formatMarkdown(soul) }}
                style={{ whiteSpace: 'pre-wrap' }}
              />
            </div>
          )}

          {activeTab === 'config' && (
            <div className="config-container">
              <div className="config-card">
                <div className="config-title">Active Settings</div>
                <div className="config-item">
                  <span className="status-label">Model Endpoint:</span>
                  <span className="status-val">http://localhost:4000</span>
                </div>
                <div className="config-item">
                  <span className="status-label">Model Routing Alias:</span>
                  <span className="status-val">{status.config?.model_alias || 'default-model'}</span>
                </div>
                <div className="config-item">
                  <span className="status-label">Target Model:</span>
                  <span className="status-val">{status.config?.target_model || 'loading'}</span>
                </div>
                <div className="config-item">
                  <span className="status-label">LiteLLM Version:</span>
                  <span className="status-val">{status.config?.litellm_version || 'unknown'}</span>
                </div>
                <div className="config-item">
                  <span className="status-label">Failovers Enabled:</span>
                  <span className="status-val" style={{ color: status.config?.fallbacks_enabled ? 'var(--accent-teal)' : 'red' }}>
                    {status.config?.fallbacks_enabled ? 'Yes (Google Gemini)' : 'No'}
                  </span>
                </div>
              </div>

              <div className="config-card">
                <div className="config-title">System Paths</div>
                <div className="config-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '6px' }}>
                  <span className="status-label">Database Path:</span>
                  <span className="status-val" style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>{status.database_connected ? 'C:/Users/Daniel/.gemini/.../state.db' : 'N/A'}</span>
                </div>
                <div className="config-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '6px' }}>
                  <span className="status-label">SOUL Path:</span>
                  <span className="status-val" style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>{soul ? 'C:/Users/Daniel/.gemini/.../SOUL.md' : 'N/A'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
