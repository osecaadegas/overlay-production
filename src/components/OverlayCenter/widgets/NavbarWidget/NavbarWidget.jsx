import { useEffect, useState } from 'react';

export default function NavbarWidget({ overlay, updateSettings, isFocused = false }) {
  const [showConfig, setShowConfig] = useState(false);
  const [streamerName, setStreamerName] = useState(overlay.settings.widgets?.navbar?.streamerName || '');
  const [motto, setMotto] = useState(overlay.settings.widgets?.navbar?.motto || '');
  const [selectedMode, setSelectedMode] = useState(overlay.settings.widgets?.navbar?.mode || 'Raw');

  useEffect(() => {
    if (isFocused) {
      setShowConfig(true);
    }
  }, [isFocused]);

  useEffect(() => {
    setStreamerName(overlay.settings.widgets?.navbar?.streamerName || '');
    setMotto(overlay.settings.widgets?.navbar?.motto || '');
    setSelectedMode(overlay.settings.widgets?.navbar?.mode || 'Raw');
  }, [
    overlay.settings.widgets?.navbar?.streamerName,
    overlay.settings.widgets?.navbar?.motto,
    overlay.settings.widgets?.navbar?.mode,
  ]);

  const saveSettings = () => {
    const newSettings = {
      ...overlay.settings,
      widgets: {
        ...overlay.settings.widgets,
        navbar: {
          ...overlay.settings.widgets.navbar,
          streamerName,
          motto,
          mode: selectedMode
        }
      }
    };
    updateSettings(newSettings);
  };

  return (
    <div className={`widget-card ${showConfig ? 'widget-card--expanded' : ''}`}>
      <div className="widget-card-header">
        <h3>📊 Navbar</h3>
        <label className="toggle-switch">
          <input 
            type="checkbox" 
            checked={overlay.settings.widgets?.navbar?.enabled ?? false}
            onChange={(e) => {
              const newSettings = {
                ...overlay.settings,
                widgets: {
                  ...overlay.settings.widgets,
                  navbar: {
                    ...overlay.settings.widgets.navbar,
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
      <p className="widget-description">Navigation bar with stream information and links</p>
      <button className="widget-configure-btn" onClick={() => setShowConfig((current) => !current)} type="button">
        {showConfig ? 'Hide Setup' : 'Open Setup'}
      </button>

      {showConfig && (
        <div className="widget-inline-panel">
          <div className="modal-content modal-content--embedded">
            <div className="modal-header">
              <h2>📊 Configure Navbar</h2>
              <button className="modal-close" onClick={() => setShowConfig(false)}>✕</button>
            </div>

            <div className="modal-body">
              <div className="form-section">
                <h3>Streamer Name</h3>
                <input 
                  type="text"
                  className="text-input"
                  value={streamerName}
                  onChange={(e) => setStreamerName(e.target.value)}
                  placeholder="Enter your Twitch username"
                />
              </div>

              <div className="form-section">
                <h3>Motto / Tagline</h3>
                <input 
                  type="text"
                  className="text-input"
                  value={motto}
                  onChange={(e) => setMotto(e.target.value)}
                  placeholder="Enter your motto or tagline"
                />
              </div>

              <div className="form-section">
                <h3>Display Mode</h3>
                <div className="mode-options">
                  {['Raw', 'Wager', 'Balance', 'Tournament'].map((mode) => (
                    <label key={mode} className="mode-option">
                      <input 
                        type="radio"
                        name="navbar-mode"
                        value={mode}
                        checked={selectedMode === mode}
                        onChange={(e) => setSelectedMode(e.target.value)}
                      />
                      <span className="mode-label">{mode}</span>
                    </label>
                  ))}
                </div>
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
