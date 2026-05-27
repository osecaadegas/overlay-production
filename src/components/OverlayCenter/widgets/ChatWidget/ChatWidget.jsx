import { useEffect, useState } from 'react';

export default function ChatWidget({ overlay, updateSettings, isFocused = false }) {
  const [showConfig, setShowConfig] = useState(false);
  const [channelName, setChannelName] = useState(overlay.settings.widgets?.chat?.channelName || '');
  const [maxMessages, setMaxMessages] = useState(overlay.settings.widgets?.chat?.maxMessages || 10);

  useEffect(() => {
    if (isFocused) {
      setShowConfig(true);
    }
  }, [isFocused]);

  useEffect(() => {
    setChannelName(overlay.settings.widgets?.chat?.channelName || '');
    setMaxMessages(overlay.settings.widgets?.chat?.maxMessages || 10);
  }, [overlay.settings.widgets?.chat?.channelName, overlay.settings.widgets?.chat?.maxMessages]);

  const saveSettings = () => {
    const newSettings = {
      ...overlay.settings,
      widgets: {
        ...overlay.settings.widgets,
        chat: {
          ...overlay.settings.widgets.chat,
          channelName,
          maxMessages
        }
      }
    };
    updateSettings(newSettings);
  };

  return (
    <div className={`widget-card ${showConfig ? 'widget-card--expanded' : ''}`}>
      <div className="widget-card-header">
        <h3>💬 Twitch Chat</h3>
        <label className="toggle-switch">
          <input 
            type="checkbox" 
            checked={overlay.settings.widgets?.chat?.enabled ?? false}
            onChange={(e) => {
              const newSettings = {
                ...overlay.settings,
                widgets: {
                  ...overlay.settings.widgets,
                  chat: {
                    ...overlay.settings.widgets.chat,
                    enabled: e.target.checked
                  }
                }
              };
              updateSettings(newSettings);
            }}
          />
          <span className="slider"></span>
        </label>
      </div>
      <p className="widget-description">Display live Twitch chat messages</p>
      <button className="widget-configure-btn" onClick={() => setShowConfig((current) => !current)} type="button">
        {showConfig ? 'Hide Setup' : 'Open Setup'}
      </button>

      {showConfig && (
        <div className="widget-inline-panel">
          <div className="modal-content modal-content--embedded">
            <div className="modal-header">
              <h2>💬 Configure Twitch Chat</h2>
              <button className="modal-close" onClick={() => setShowConfig(false)}>✕</button>
            </div>

            <div className="modal-body">
              <div className="form-section">
                <h3>Twitch Channel Name</h3>
                <input 
                  type="text"
                  className="text-input"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  placeholder="Enter your Twitch channel name"
                />
              </div>

              <div className="form-section">
                <h3>Max Messages to Display</h3>
                <input 
                  type="number"
                  className="text-input"
                  value={maxMessages}
                  onChange={(e) => setMaxMessages(parseInt(e.target.value) || 10)}
                  min="5"
                  max="50"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="modal-save-btn" onClick={saveSettings}>Save Settings</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
