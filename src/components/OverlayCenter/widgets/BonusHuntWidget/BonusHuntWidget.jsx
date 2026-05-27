import { useEffect, useState } from 'react';
import BonusHuntModal from './BonusHuntModal';
import './BonusHuntWidget.css';

export default function BonusHuntWidget({ overlay, updateSettings, slots, isFocused = false }) {
  const [showConfig, setShowConfig] = useState(false);

  useEffect(() => {
    if (isFocused) {
      setShowConfig(true);
    }
  }, [isFocused]);

  return (
    <div className={`widget-card ${showConfig ? 'widget-card--expanded' : ''}`}>
      <div className="widget-card-header">
        <h3>🎯 Bonus Hunt Tracker</h3>
        <label className="toggle-switch">
          <input 
            type="checkbox" 
            checked={overlay.settings.widgets?.bonusHunt?.enabled ?? true}
            onChange={(e) => {
              const newSettings = {
                ...overlay.settings,
                widgets: {
                  ...overlay.settings.widgets,
                  bonusHunt: {
                    ...overlay.settings.widgets.bonusHunt,
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
      <p className="widget-description">Display your current bonus hunt progress and statistics</p>
      <button 
        className="configure-btn"
        onClick={() => setShowConfig((current) => !current)}
        type="button"
      >
        {showConfig ? 'Hide Setup' : 'Open Setup'}
      </button>

      {showConfig && (
        <BonusHuntModal 
          overlay={overlay} 
          onClose={() => setShowConfig(false)} 
          slots={slots} 
          updateSettings={updateSettings}
          embedded
        />
      )}
    </div>
  );
}
