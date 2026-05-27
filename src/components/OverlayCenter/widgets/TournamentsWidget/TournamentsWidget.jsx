import { useState, useEffect } from 'react';
import { getAllSlots } from '../../../../utils/slotUtils';
import TournamentModal from './TournamentModal';

export default function TournamentsWidget({ overlay, updateSettings, isFocused = false }) {
  const [showConfig, setShowConfig] = useState(false);
  const [slots, setSlots] = useState([]);

  useEffect(() => {
    if (isFocused) {
      setShowConfig(true);
    }
  }, [isFocused]);

  useEffect(() => {
    const loadSlots = async () => {
      try {
        const data = await getAllSlots();
        setSlots(data || []);
      } catch (error) {
        console.error('Error loading slots:', error);
        setSlots([]);
      }
    };
    if (showConfig) {
      loadSlots();
    }
  }, [showConfig]);

  return (
    <div className={`widget-card ${showConfig ? 'widget-card--expanded' : ''}`}>
      <div className="widget-card-header">
        <h3>🏆 Tournaments</h3>
        <label className="toggle-switch">
          <input 
            type="checkbox" 
            checked={overlay.settings.widgets?.tournaments?.enabled ?? false}
            onChange={(e) => {
              const newSettings = {
                ...overlay.settings,
                widgets: {
                  ...overlay.settings.widgets,
                  tournaments: {
                    ...overlay.settings.widgets.tournaments,
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
      <p className="widget-description">Run slot tournaments with bracket system</p>
      <button className="widget-configure-btn" onClick={() => setShowConfig((current) => !current)} type="button">
        {showConfig ? 'Hide Setup' : 'Open Setup'}
      </button>

      {showConfig && (
        <TournamentModal
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
