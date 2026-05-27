import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { usePremium } from '../../hooks/usePremium';
import { useNavigate } from 'react-router-dom';
import supabase from '../../config/supabaseClient';
import { getAllSlots } from '../../utils/slotUtils';
import WidgetSettingsTab from './tabs/WidgetSettingsTab';
import PositioningTab from './tabs/PositioningTab';
import LayoutTab from './tabs/LayoutTab';
import StylesTab from './tabs/StylesTab';
import ProfileTab from './tabs/ProfileTab';
import './OverlayControls.css';

const WIDGET_SHORTCUT_GROUPS = [
  {
    label: 'Streamer Tools',
    items: [
      { id: 'bonusHunt', icon: '🎯', label: 'Bonus Hunt', description: 'Tracker, bankroll, bonus list.' },
      { id: 'tournaments', icon: '🏆', label: 'Tournaments', description: 'Bracket setup and results.' },
      { id: 'sessionStats', icon: '📊', label: 'Session Stats', description: 'Session metrics and totals.' },
      { id: 'recentWins', icon: '🎁', label: 'Recent Wins', description: 'Latest hits and multipliers.' },
    ],
  },
  {
    label: 'Games And Picks',
    items: [
      { id: 'coinflip', icon: '🪙', label: 'Coin Flip', description: 'Viewer game setup.' },
      { id: 'slotmachine', icon: '🎰', label: 'Slotmachine', description: 'Slot machine widget.' },
      { id: 'randomSlotPicker', icon: '🎲', label: 'Random Picker', description: 'Random slot selection.' },
      { id: 'wheelOfNames', icon: '🎡', label: 'Wheel Of Names', description: 'Viewer and prize wheel.' },
    ],
  },
  {
    label: 'Brand And Community',
    items: [
      { id: 'navbar', icon: '📊', label: 'Navbar', description: 'Name, motto, mode.' },
      { id: 'chat', icon: '💬', label: 'Twitch Chat', description: 'Chat source and limits.' },
      { id: 'customization', icon: '🎨', label: 'Customization', description: 'Custom widget content.' },
    ],
  },
];

const PANEL_META = {
  profile: {
    label: 'Profile',
    icon: '◉',
    description: 'Identity, channels, and widget-facing profile defaults.',
  },
  overview: {
    label: 'Overview',
    icon: '◈',
    description: 'URLs, preview access, and workspace status.',
  },
  widgets: {
    label: 'Widgets',
    icon: '⚙',
    description: 'Manage each overlay widget and its live settings.',
  },
  layout: {
    label: 'Layouts',
    icon: '◫',
    description: 'Choose display modes for supported widgets.',
  },
  positioning: {
    label: 'Positioning',
    icon: '✦',
    description: 'Adjust widget placement with the live preview.',
  },
  styles: {
    label: 'Styles',
    icon: '✺',
    description: 'Tune the saved theme colors for the overlay.',
  },
};

export default function OverlayControls() {
  const { user, signOut } = useAuth();
  const { isPremium, loading: premiumLoading } = usePremium();
  const navigate = useNavigate();
  
  const [overlay, setOverlay] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [slots, setSlots] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [focusedWidget, setFocusedWidget] = useState(null);

  const overlayUrl = overlay ? `${window.location.origin}/premium/overlay?id=${overlay.public_id}` : '';
  const previewUrl = overlay ? `${overlayUrl}&preview=true` : '';
  const activePanel = PANEL_META[activeTab] ?? PANEL_META.overview;
  const accountLabel = user?.email || user?.user_metadata?.full_name || user?.id;

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    if (!premiumLoading && !isPremium) {
      setLoading(false);
      return;
    }

    if (isPremium) {
      loadOverlay();
    }
  }, [user, isPremium, premiumLoading, navigate]);

  const loadOverlay = async () => {
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const response = await fetch('/api/overlay/get', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 404) {
        // No overlay exists yet
        setOverlay(null);
      } else if (response.ok) {
        const data = await response.json();
        setOverlay(data);
      } else {
        console.error('Failed to load overlay');
      }
    } catch (error) {
      console.error('Error loading overlay:', error);
    } finally {
      setLoading(false);
    }
  };

  const createOverlay = async () => {
    setSaving(true);

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const response = await fetch('/api/overlay/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setOverlay(data);
        setActiveTab('overview');
      } else {
        console.error('Failed to create overlay');
      }
    } catch (error) {
      console.error('Error creating overlay:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateSettings = async (newSettings) => {
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const response = await fetch('/api/overlay/update', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ settings: newSettings })
      });

      if (response.ok) {
        const data = await response.json();
        setOverlay(data);
        return true;
      }
    } catch (error) {
      console.error('Error updating settings:', error);
    }

    return false;
  };

  useEffect(() => {
    const loadSlots = async () => {
      console.log('Loading slots from database...');
      try {
        const data = await getAllSlots();
        console.log('Slots loaded successfully:', data?.length, 'slots');
        console.log('First few slots:', data?.slice(0, 3));
        setSlots(data || []);
      } catch (error) {
        console.error('Error loading slots:', error);
        setSlots([]);
      }
    };
    loadSlots();
  }, []);

  const copyToClipboard = () => {
    if (!overlayUrl) {
      return;
    }

    navigator.clipboard.writeText(overlayUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  const openWidgetSetup = (widgetId) => {
    setActiveTab('widgets');
    setFocusedWidget(widgetId);
  };

  const renderOverviewPanel = () => {
    if (!overlay) {
      return (
        <div className="oc-empty-panel">
          <span className="oc-panel-chip">New workspace</span>
          <h2>Create your overlay workspace</h2>
          <p>
            Generate the dedicated overlay record first. Once it exists, the OBS URL, live preview,
            layout controls, and widget configuration panels unlock automatically.
          </p>
          <button className="oc-btn-primary" onClick={createOverlay} disabled={saving}>
            {saving ? 'Creating overlay...' : 'Create overlay'}
          </button>
        </div>
      );
    }

    return (
      <div className="oc-overview-grid">
        <section className="oc-url-card">
          <span className="oc-panel-chip">OBS Browser Source</span>
          <h2>Overlay URL</h2>
          <p>Use this URL as your Browser Source in OBS or Streamlabs.</p>
          <div className="oc-url-box">
            <input type="text" value={overlayUrl} readOnly className="oc-url-input" />
            <button className="oc-btn-primary" onClick={copyToClipboard}>
              {copied ? 'Copied' : 'Copy URL'}
            </button>
          </div>
          <div className="oc-card-actions">
            <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="oc-btn-secondary">
              Open live preview
            </a>
          </div>
        </section>

        <div className="oc-summary-grid">
          <article className="oc-summary-card">
            <span className="oc-summary-label">Overlay</span>
            <strong>{overlay.public_id}</strong>
            <p>Public identifier used by the premium overlay route.</p>
          </article>
          <article className="oc-summary-card">
            <span className="oc-summary-label">Catalog</span>
            <strong>{slots.length.toLocaleString()} slots</strong>
            <p>Slot data is ready for widgets that depend on the shared library.</p>
          </article>
          <article className="oc-summary-card">
            <span className="oc-summary-label">Access</span>
            <strong>Premium active</strong>
            <p>Your current account can use the extracted overlay APIs and UI.</p>
          </article>
          <article className="oc-summary-card">
            <span className="oc-summary-label">Saving</span>
            <strong>Automatic</strong>
            <p>Widget, positioning, and style changes are persisted as you update them.</p>
          </article>
        </div>
      </div>
    );
  };

  const renderLockedPanel = () => (
    <div className="oc-empty-panel">
      <span className="oc-panel-chip">Overlay required</span>
      <h2>Create the overlay first</h2>
      <p>
        This section becomes available as soon as the overlay record exists. Start from the overview panel,
        generate the workspace, then come back here to configure the active widgets.
      </p>
      <button className="oc-btn-primary" onClick={createOverlay} disabled={saving}>
        {saving ? 'Creating overlay...' : 'Create overlay'}
      </button>
    </div>
  );

  const renderPanelContent = () => {
    if (!overlay && !['overview', 'profile'].includes(activeTab)) {
      return renderLockedPanel();
    }

    switch (activeTab) {
      case 'profile':
        return <ProfileTab overlay={overlay} updateSettings={updateSettings} user={user} />;
      case 'widgets':
        return (
          <WidgetSettingsTab
            overlay={overlay}
            updateSettings={updateSettings}
            slots={slots}
            focusedWidget={focusedWidget}
            onRequestFocus={setFocusedWidget}
          />
        );
      case 'layout':
        return <LayoutTab overlay={overlay} updateSettings={updateSettings} />;
      case 'positioning':
        return <PositioningTab overlay={overlay} updateSettings={updateSettings} />;
      case 'styles':
        return <StylesTab overlay={overlay} updateSettings={updateSettings} />;
      case 'overview':
      default:
        return renderOverviewPanel();
    }
  };

  if (loading || premiumLoading) {
    return (
      <div className="oc-page">
        <div className="oc-loading">
          <div className="oc-spinner" />
          <p>Loading your overlay workspace...</p>
        </div>
      </div>
    );
  }

  if (!isPremium) {
    return (
      <div className="oc-page">
        <div className="oc-auth-wall">
          <h2>Premium access required</h2>
          <p>The extracted overlay system is only available for premium members.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="oc-page">
      <div className="oc-layout">
        <aside className="oc-sidebar">
          <div className="oc-sidebar-brand">
            <div className="oc-sidebar-brand-mark">OC</div>
            <div>
              <p className="oc-sidebar-eyebrow">Premium Workspace</p>
              <h2 className="oc-sidebar-title">Overlay Center</h2>
            </div>
          </div>

          <nav className="oc-sidebar-nav">
            {Object.entries(PANEL_META).map(([panelId, panel]) => (
              <button
                key={panelId}
                className={`oc-sidebar-btn ${activeTab === panelId ? 'oc-sidebar-btn--active' : ''}`}
                onClick={() => {
                  setActiveTab(panelId);
                  if (panelId !== 'widgets') {
                    setFocusedWidget(null);
                  }
                }}
              >
                <span className="oc-sidebar-btn-icon">{panel.icon}</span>
                <span className="oc-sidebar-btn-text">
                  <span className="oc-sidebar-btn-label">{panel.label}</span>
                  <span className="oc-sidebar-btn-desc">{panel.description}</span>
                </span>
              </button>
            ))}
          </nav>

          <div className="oc-sidebar-shortcuts-shell">
            <span className="oc-sidebar-shortcuts-kicker">Widget Setup</span>
            {WIDGET_SHORTCUT_GROUPS.map((group) => (
              <div key={group.label} className="oc-sidebar-shortcuts-group">
                <span className="oc-sidebar-shortcuts-label">{group.label}</span>
                <div className="oc-sidebar-shortcuts-list">
                  {group.items.map((item) => (
                    <button
                      key={item.id}
                      className={`oc-sidebar-shortcut ${activeTab === 'widgets' && focusedWidget === item.id ? 'oc-sidebar-shortcut--active' : ''}`}
                      onClick={() => openWidgetSetup(item.id)}
                    >
                      <span className="oc-sidebar-shortcut-icon">{item.icon}</span>
                      <span className="oc-sidebar-shortcut-copy">
                        <span className="oc-sidebar-shortcut-title">{item.label}</span>
                        <span className="oc-sidebar-shortcut-desc">{item.description}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="oc-sidebar-footer">
            <div className="oc-user-card">
              <span className="oc-user-label">Signed in as</span>
              <strong>{accountLabel}</strong>
            </div>
            <button className="oc-sidebar-utility oc-sidebar-utility--danger" onClick={handleSignOut}>
              Sign out
            </button>
          </div>
        </aside>

        <main className="oc-main">
          <header className="oc-main-header">
            <div>
              <span className="oc-main-kicker">Control Center</span>
              <h1>{activePanel.label}</h1>
              <p>{activePanel.description}</p>
            </div>

            <div className="oc-main-header-actions">
              {overlay ? (
                <>
                  <button className="oc-btn-secondary" onClick={copyToClipboard}>
                    {copied ? 'URL copied' : 'Copy OBS URL'}
                  </button>
                  <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="oc-btn-primary">
                    Open preview
                  </a>
                </>
              ) : (
                <button className="oc-btn-primary" onClick={createOverlay} disabled={saving}>
                  {saving ? 'Creating overlay...' : 'Create overlay'}
                </button>
              )}
            </div>
          </header>

          <section className="oc-panel-shell">{renderPanelContent()}</section>
        </main>
      </div>
    </div>
  );
}
