import React from 'react';

const THEME_PRESETS = [
  {
    id: 'classic-gold',
    name: 'Classic Gold',
    description: 'Warm premium tones close to the original overlay baseline.',
    theme: {
      primaryColor: '#d4af37',
      accentColor: '#38bdf8',
      backgroundColor: '#020617',
      textColor: '#e2e8f0',
    },
  },
  {
    id: 'midnight-neon',
    name: 'Midnight Neon',
    description: 'Cold neon contrast for a sharper late-night stream look.',
    theme: {
      primaryColor: '#8b5cf6',
      accentColor: '#38bdf8',
      backgroundColor: '#020617',
      textColor: '#f8fafc',
    },
  },
  {
    id: 'emerald-live',
    name: 'Emerald Live',
    description: 'Green-led palette that keeps metrics and wins feeling active.',
    theme: {
      primaryColor: '#22c55e',
      accentColor: '#14b8a6',
      backgroundColor: '#03130f',
      textColor: '#ecfdf5',
    },
  },
  {
    id: 'sunset-heat',
    name: 'Sunset Heat',
    description: 'Orange-magenta blend for a louder entertainment-heavy setup.',
    theme: {
      primaryColor: '#f97316',
      accentColor: '#ec4899',
      backgroundColor: '#190b05',
      textColor: '#fff7ed',
    },
  },
];

const WIDGET_STYLE_KEYS = [
  'bonusHunt',
  'sessionStats',
  'recentWins',
  'tournaments',
  'coinflip',
  'slotmachine',
  'randomSlotPicker',
  'wheelOfNames',
  'navbar',
  'chat',
  'customization',
];

export default function StylesTab({ overlay, updateSettings }) {
  const applyThemePreset = (preset) => {
    const nextWidgetStyles = WIDGET_STYLE_KEYS.reduce((accumulator, widgetKey) => {
      accumulator[widgetKey] = {
        ...overlay.settings.widgetStyles?.[widgetKey],
        backgroundColor: preset.theme.backgroundColor,
        accentColor: preset.theme.accentColor,
        borderColor: preset.theme.primaryColor,
      };
      return accumulator;
    }, {});

    const newSettings = {
      ...overlay.settings,
      theme: {
        ...overlay.settings.theme,
        ...preset.theme,
      },
      widgetStyles: {
        ...overlay.settings.widgetStyles,
        ...nextWidgetStyles,
      },
    };

    updateSettings(newSettings);
  };

  return (
    <div className="tab-content">
      <div className="styles-content">
        <div className="style-section style-section--hero">
          <div className="style-section-copy">
            <h3>🎨 Themes</h3>
            <p className="section-description">
              Apply a full overlay palette first, then fine-tune individual widget colors underneath.
            </p>
          </div>

          <div className="theme-preset-grid">
            {THEME_PRESETS.map((preset) => (
              <button
                key={preset.id}
                className="theme-preset-card"
                onClick={() => applyThemePreset(preset)}
                type="button"
              >
                <span className="theme-preset-swatch" style={{ background: preset.theme.backgroundColor }}>
                  <span style={{ background: preset.theme.primaryColor }} />
                  <span style={{ background: preset.theme.accentColor }} />
                  <span style={{ background: preset.theme.textColor }} />
                </span>
                <strong>{preset.name}</strong>
                <span>{preset.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Global Theme Settings */}
        <div className="style-section">
          <h3>🌍 Global Theme</h3>
          <p className="section-description">Apply colors across all widgets</p>
          <div className="theme-controls theme-controls--expanded">
            <div className="color-picker">
              <label>Primary Color</label>
              <input 
                type="color" 
                value={overlay.settings.theme?.primaryColor ?? '#d4af37'}
                onChange={(e) => {
                  const newSettings = {
                    ...overlay.settings,
                    theme: {
                      ...overlay.settings.theme,
                      primaryColor: e.target.value
                    }
                  };
                  updateSettings(newSettings);
                }}
              />
            </div>
            <div className="color-picker">
              <label>Accent Color</label>
              <input 
                type="color" 
                value={overlay.settings.theme?.accentColor ?? '#38bdf8'}
                onChange={(e) => {
                  const newSettings = {
                    ...overlay.settings,
                    theme: {
                      ...overlay.settings.theme,
                      accentColor: e.target.value
                    }
                  };
                  updateSettings(newSettings);
                }}
              />
            </div>
            <div className="color-picker">
              <label>Background Color</label>
              <input 
                type="color" 
                value={overlay.settings.theme?.backgroundColor ?? '#020617'}
                onChange={(e) => {
                  const newSettings = {
                    ...overlay.settings,
                    theme: {
                      ...overlay.settings.theme,
                      backgroundColor: e.target.value
                    }
                  };
                  updateSettings(newSettings);
                }}
              />
            </div>
            <div className="color-picker">
              <label>Text Color</label>
              <input 
                type="color" 
                value={overlay.settings.theme?.textColor ?? '#e2e8f0'}
                onChange={(e) => {
                  const newSettings = {
                    ...overlay.settings,
                    theme: {
                      ...overlay.settings.theme,
                      textColor: e.target.value
                    }
                  };
                  updateSettings(newSettings);
                }}
              />
            </div>
          </div>
        </div>

        {/* Widget Style Presets */}
        <div className="style-section">
          <h3>🎯 Bonus Hunt Tracker</h3>
          <p className="section-description">Customize bonus hunt colors and appearance</p>
          <div className="widget-style-grid">
            <div className="color-picker">
              <label>Background Color</label>
              <input 
                type="color" 
                value={overlay.settings.widgetStyles?.bonusHunt?.backgroundColor ?? '#0f172a'}
                onChange={(e) => {
                  const newSettings = {
                    ...overlay.settings,
                    widgetStyles: {
                      ...overlay.settings.widgetStyles,
                      bonusHunt: {
                        ...overlay.settings.widgetStyles?.bonusHunt,
                        backgroundColor: e.target.value
                      }
                    }
                  };
                  updateSettings(newSettings);
                }}
              />
            </div>
            <div className="color-picker">
              <label>Accent Color</label>
              <input 
                type="color" 
                value={overlay.settings.widgetStyles?.bonusHunt?.accentColor ?? '#3b82f6'}
                onChange={(e) => {
                  const newSettings = {
                    ...overlay.settings,
                    widgetStyles: {
                      ...overlay.settings.widgetStyles,
                      bonusHunt: {
                        ...overlay.settings.widgetStyles?.bonusHunt,
                        accentColor: e.target.value
                      }
                    }
                  };
                  updateSettings(newSettings);
                }}
              />
            </div>
            <div className="color-picker">
              <label>Border Color</label>
              <input 
                type="color" 
                value={overlay.settings.widgetStyles?.bonusHunt?.borderColor ?? '#3b82f6'}
                onChange={(e) => {
                  const newSettings = {
                    ...overlay.settings,
                    widgetStyles: {
                      ...overlay.settings.widgetStyles,
                      bonusHunt: {
                        ...overlay.settings.widgetStyles?.bonusHunt,
                        borderColor: e.target.value
                      }
                    }
                  };
                  updateSettings(newSettings);
                }}
              />
            </div>
          </div>
        </div>

        <div className="style-section">
          <h3>📊 Session Stats</h3>
          <p className="section-description">Customize session stats appearance</p>
          <div className="widget-style-grid">
            <div className="color-picker">
              <label>Background Color</label>
              <input 
                type="color" 
                value={overlay.settings.widgetStyles?.sessionStats?.backgroundColor ?? '#1a1d23'}
                onChange={(e) => {
                  const newSettings = {
                    ...overlay.settings,
                    widgetStyles: {
                      ...overlay.settings.widgetStyles,
                      sessionStats: {
                        ...overlay.settings.widgetStyles?.sessionStats,
                        backgroundColor: e.target.value
                      }
                    }
                  };
                  updateSettings(newSettings);
                }}
              />
            </div>
            <div className="color-picker">
              <label>Text Color</label>
              <input 
                type="color" 
                value={overlay.settings.widgetStyles?.sessionStats?.textColor ?? '#ffffff'}
                onChange={(e) => {
                  const newSettings = {
                    ...overlay.settings,
                    widgetStyles: {
                      ...overlay.settings.widgetStyles,
                      sessionStats: {
                        ...overlay.settings.widgetStyles?.sessionStats,
                        textColor: e.target.value
                      }
                    }
                  };
                  updateSettings(newSettings);
                }}
              />
            </div>
            <div className="color-picker">
              <label>Highlight Color</label>
              <input 
                type="color" 
                value={overlay.settings.widgetStyles?.sessionStats?.highlightColor ?? '#d4af37'}
                onChange={(e) => {
                  const newSettings = {
                    ...overlay.settings,
                    widgetStyles: {
                      ...overlay.settings.widgetStyles,
                      sessionStats: {
                        ...overlay.settings.widgetStyles?.sessionStats,
                        highlightColor: e.target.value
                      }
                    }
                  };
                  updateSettings(newSettings);
                }}
              />
            </div>
          </div>
        </div>

        <div className="style-section">
          <h3>🎁 Recent Wins</h3>
          <p className="section-description">Customize recent wins widget colors</p>
          <div className="widget-style-grid">
            <div className="color-picker">
              <label>Background Color</label>
              <input 
                type="color" 
                value={overlay.settings.widgetStyles?.recentWins?.backgroundColor ?? '#1a1d23'}
                onChange={(e) => {
                  const newSettings = {
                    ...overlay.settings,
                    widgetStyles: {
                      ...overlay.settings.widgetStyles,
                      recentWins: {
                        ...overlay.settings.widgetStyles?.recentWins,
                        backgroundColor: e.target.value
                      }
                    }
                  };
                  updateSettings(newSettings);
                }}
              />
            </div>
            <div className="color-picker">
              <label>Win Color</label>
              <input 
                type="color" 
                value={overlay.settings.widgetStyles?.recentWins?.winColor ?? '#4ade80'}
                onChange={(e) => {
                  const newSettings = {
                    ...overlay.settings,
                    widgetStyles: {
                      ...overlay.settings.widgetStyles,
                      recentWins: {
                        ...overlay.settings.widgetStyles?.recentWins,
                        winColor: e.target.value
                      }
                    }
                  };
                  updateSettings(newSettings);
                }}
              />
            </div>
            <div className="color-picker">
              <label>Border Color</label>
              <input 
                type="color" 
                value={overlay.settings.widgetStyles?.recentWins?.borderColor ?? '#d4af37'}
                onChange={(e) => {
                  const newSettings = {
                    ...overlay.settings,
                    widgetStyles: {
                      ...overlay.settings.widgetStyles,
                      recentWins: {
                        ...overlay.settings.widgetStyles?.recentWins,
                        borderColor: e.target.value
                      }
                    }
                  };
                  updateSettings(newSettings);
                }}
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
