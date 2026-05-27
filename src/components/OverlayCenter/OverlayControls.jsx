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
import TutorialTab from './tabs/TutorialTab';
import BonusHuntPage from './tabs/BonusHuntPage';
import SessionStatsWidget from './widgets/SessionStatsWidget/SessionStatsWidget';
import RecentWinsWidget from './widgets/RecentWinsWidget/RecentWinsWidget';
import TournamentsWidget from './widgets/TournamentsWidget/TournamentsWidget';
import CoinFlipWidget from './widgets/CoinFlipWidget/CoinFlipWidget';
import SlotmachineWidget from './widgets/SlotmachineWidget/SlotmachineWidget';
import RandomSlotPickerWidget from './widgets/RandomSlotPickerWidget/RandomSlotPickerWidget';
import WheelOfNamesWidget from './widgets/WheelOfNamesWidget/WheelOfNamesWidget';
import NavbarWidget from './widgets/NavbarWidget/NavbarWidget';
import ChatWidget from './widgets/ChatWidget/ChatWidget';
import CustomizationWidget from './widgets/CustomizationWidget/CustomizationWidget';
import './OverlayControls.css';

const PANEL_META = {
  tutorial: {
    label: 'Tutorial',
    icon: '🎓',
    description: 'Walk through the overlay workflow page by page, like the original control center.',
  },
  profile: {
    label: 'Profile',
    icon: '👤',
    description: 'Identity, channels, and widget-facing profile defaults.',
  },
  overview: {
    label: 'Overview',
    icon: '🏠',
    description: 'URLs, preview access, and workspace status.',
  },
  widgets: {
    label: 'Widgets',
    icon: '🧩',
    description: 'Manage each overlay widget and its live settings.',
  },
  bonusHunt: {
    label: 'Bonus Hunt',
    icon: '🎯',
    description: 'Run your hunt tracker from a dedicated page, not a popup.',
  },
  tournaments: {
    label: 'Tournament',
    icon: '🏆',
    description: 'Manage bracket setup, match results, and saved tournament state.',
  },
  sessionStats: {
    label: 'Session Stats',
    icon: '📊',
    description: 'Toggle and stage the session tracker from its own control page.',
  },
  recentWins: {
    label: 'Recent Wins',
    icon: '🎁',
    description: 'Control the recent wins surface from a dedicated panel.',
  },
  randomSlotPicker: {
    label: 'Random Slot Picker',
    icon: '🎲',
    description: 'Handle random slot selection from a separate tool page.',
  },
  wheelOfNames: {
    label: 'Wheel Of Names',
    icon: '🎡',
    description: 'Keep your viewer wheel controls on their own page.',
  },
  coinflip: {
    label: 'Coin Flip',
    icon: '🪙',
    description: 'Manage the coin flip widget from a dedicated community game page.',
  },
  slotmachine: {
    label: 'Slotmachine',
    icon: '🎰',
    description: 'Control the slotmachine widget as its own page.',
  },
  navbar: {
    label: 'Navbar',
    icon: '📊',
    description: 'Edit the stream identity bar from a full page instead of a popup.',
  },
  chat: {
    label: 'Twitch Chat',
    icon: '💬',
    description: 'Manage the live chat surface with an inline setup page.',
  },
  customization: {
    label: 'Customization',
    icon: '🎨',
    description: 'Keep custom widget content on its own dedicated page.',
  },
  layout: {
    label: 'Layouts',
    icon: '📐',
    description: 'Choose display modes for supported widgets.',
  },
  positioning: {
    label: 'Positioning',
    icon: '✦',
    description: 'Adjust widget placement with the live preview.',
  },
  styles: {
    label: 'Themes',
    icon: '🎨',
    description: 'Tune the saved theme colors for the overlay workspace.',
  },
};

const STREAMER_TOOL_PAGES = ['bonusHunt', 'tournaments', 'sessionStats', 'recentWins'];
const COMMUNITY_TOOL_PAGES = ['randomSlotPicker', 'wheelOfNames'];
const COMMUNITY_GAME_PAGES = ['coinflip', 'slotmachine'];
const BRAND_PAGE_PAGES = ['navbar', 'chat', 'customization'];
const MANAGEMENT_PAGES = ['styles', 'layout', 'positioning'];

const WIDGET_PAGE_META = {
  bonusHunt: {
    group: 'Streamer Tools',
    title: 'Bonus Hunt Tracker',
    description: 'This now behaves like the old center: you land on a full page and configure the hunt inline.',
    shellClassName: 'oc-detail-widget-shell--wide',
    compactMainHeader: true,
    hideDetailHero: true,
    hideDetailMetrics: true,
    Component: BonusHuntPage,
  },
  tournaments: {
    group: 'Streamer Tools',
    title: 'Tournament Manager',
    description: 'Manage the tournament setup and saved bracket state from its own page.',
    Component: TournamentsWidget,
  },
  sessionStats: {
    group: 'Streamer Tools',
    title: 'Session Stats',
    description: 'Keep the session tracker on a dedicated page so it behaves like a real tool, not a buried card.',
    Component: SessionStatsWidget,
  },
  recentWins: {
    group: 'Streamer Tools',
    title: 'Recent Wins',
    description: 'Control the recent wins widget from its own setup surface.',
    Component: RecentWinsWidget,
  },
  randomSlotPicker: {
    group: 'Community Tools',
    title: 'Random Slot Picker',
    description: 'Keep the random picker available as a standalone page like the old community tools flow.',
    Component: RandomSlotPickerWidget,
  },
  wheelOfNames: {
    group: 'Community Tools',
    title: 'Wheel Of Names',
    description: 'Handle the viewer wheel as its own page instead of burying it inside the full widget catalog.',
    Component: WheelOfNamesWidget,
  },
  coinflip: {
    group: 'Community Games',
    title: 'Coin Flip',
    description: 'Dedicated page for the coin flip game setup.',
    Component: CoinFlipWidget,
  },
  slotmachine: {
    group: 'Community Games',
    title: 'Slotmachine',
    description: 'Separate control page for the slotmachine widget.',
    Component: SlotmachineWidget,
  },
  navbar: {
    group: 'Brand And Community',
    title: 'Navbar',
    description: 'Full-page setup for the stream identity bar.',
    Component: NavbarWidget,
  },
  chat: {
    group: 'Brand And Community',
    title: 'Twitch Chat',
    description: 'Full-page setup for the chat widget and channel source.',
    Component: ChatWidget,
  },
  customization: {
    group: 'Brand And Community',
    title: 'Customization',
    description: 'Separate page for custom widget content and on-stream blocks.',
    Component: CustomizationWidget,
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
  const [activeTab, setActiveTab] = useState('widgets');
  const [focusedWidget, setFocusedWidget] = useState(null);
  const [streamerToolsOpen, setStreamerToolsOpen] = useState(true);
  const [communityToolsOpen, setCommunityToolsOpen] = useState(true);
  const [communityGamesOpen, setCommunityGamesOpen] = useState(true);
  const [brandPagesOpen, setBrandPagesOpen] = useState(true);
  const [managementOpen, setManagementOpen] = useState(true);

  const overlayUrl = overlay ? `${window.location.origin}/premium/overlay?id=${overlay.public_id}` : '';
  const previewUrl = overlay ? `${overlayUrl}&preview=true` : '';
  const activePanel = PANEL_META[activeTab] ?? PANEL_META.overview;
  const activeWidgetPage = WIDGET_PAGE_META[activeTab];
  const useCompactMainHeader = Boolean(activeWidgetPage?.compactMainHeader);
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

  useEffect(() => {
    if (STREAMER_TOOL_PAGES.includes(activeTab)) {
      setStreamerToolsOpen(true);
    }
    if (COMMUNITY_TOOL_PAGES.includes(activeTab)) {
      setCommunityToolsOpen(true);
    }
    if (COMMUNITY_GAME_PAGES.includes(activeTab)) {
      setCommunityGamesOpen(true);
    }
    if (BRAND_PAGE_PAGES.includes(activeTab)) {
      setBrandPagesOpen(true);
    }
    if (MANAGEMENT_PAGES.includes(activeTab)) {
      setManagementOpen(true);
    }
  }, [activeTab]);

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
        setActiveTab('overview');
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
        setActiveTab('widgets');
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

  useEffect(() => {
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

  const renderMainActions = () => {
    if (overlay) {
      return (
        <>
          <button className="oc-btn-secondary" onClick={copyToClipboard}>
            {copied ? 'URL copied' : 'Copy OBS URL'}
          </button>
          <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="oc-btn-primary">
            Open preview
          </a>
        </>
      );
    }

    return (
      <button className="oc-btn-primary" onClick={createOverlay} disabled={saving}>
        {saving ? 'Creating overlay...' : 'Create overlay'}
      </button>
    );
  };

  const openPanel = (panelId) => {
    setActiveTab(panelId);
    if (panelId !== 'widgets') {
      setFocusedWidget(null);
    }
  };

  const openWidgetSetup = (widgetId) => {
    if (WIDGET_PAGE_META[widgetId]) {
      openPanel(widgetId);
      return;
    }

    setFocusedWidget(widgetId);
    openPanel('widgets');
  };

  const renderWidgetPage = (panelId) => {
    const page = WIDGET_PAGE_META[panelId];

    if (!page || !overlay) {
      return null;
    }

    const Component = page.Component;
    const widgetSettings = overlay.settings.widgets?.[panelId] ?? {};
    const detailCards = [
      {
        label: 'Status',
        value: widgetSettings.enabled ? 'Enabled' : 'Disabled',
      },
      widgetSettings.layout
        ? {
            label: 'Layout',
            value: widgetSettings.layout,
          }
        : null,
      widgetSettings.position
        ? {
            label: 'Position',
            value: `${widgetSettings.position.x ?? 0}, ${widgetSettings.position.y ?? 0}`,
          }
        : null,
    ].filter(Boolean);
    const showDetailHero = !page.hideDetailHero;
    const showDetailMetrics = !page.hideDetailMetrics && detailCards.length > 0;

    return (
      <div className="oc-detail-page">
        {showDetailHero ? (
          <section className="oc-detail-hero">
            <span className="oc-panel-chip">{page.group}</span>
            <h2>{page.title}</h2>
            <p>{page.description}</p>
          </section>
        ) : null}

        {showDetailMetrics ? (
          <div className="oc-detail-metrics">
            {detailCards.map((card) => (
              <article key={card.label} className="oc-detail-metric">
                <span>{card.label}</span>
                <strong>{card.value}</strong>
              </article>
            ))}
          </div>
        ) : null}

        <div className={`oc-detail-widget-shell ${page.shellClassName || ''}`.trim()}>
          <Component
            overlay={overlay}
            updateSettings={updateSettings}
            slots={slots}
            refreshSlots={loadSlots}
            isFocused
          />
        </div>
      </div>
    );
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
    if (!overlay && !['overview', 'profile', 'tutorial'].includes(activeTab)) {
      return renderLockedPanel();
    }

    switch (activeTab) {
      case 'tutorial':
        return (
          <TutorialTab
            overlay={overlay}
            overlayUrl={overlayUrl}
            previewUrl={previewUrl}
            onNavigate={openPanel}
            onCreateOverlay={createOverlay}
            saving={saving}
          />
        );
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
      case 'bonusHunt':
      case 'tournaments':
      case 'sessionStats':
      case 'recentWins':
      case 'randomSlotPicker':
      case 'wheelOfNames':
      case 'coinflip':
      case 'slotmachine':
      case 'navbar':
      case 'chat':
      case 'customization':
        return renderWidgetPage(activeTab);
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
            {['overview', 'profile', 'tutorial', 'widgets'].map((panelId) => {
              const panel = PANEL_META[panelId];

              return (
                <button
                  key={panelId}
                  className={`oc-sidebar-btn ${activeTab === panelId ? 'oc-sidebar-btn--active' : ''}`}
                  onClick={() => openPanel(panelId)}
                >
                  <span className="oc-sidebar-btn-icon">{panel.icon}</span>
                  <span className="oc-sidebar-btn-text">
                    <span className="oc-sidebar-btn-label">{panel.label}</span>
                    <span className="oc-sidebar-btn-desc">{panel.description}</span>
                  </span>
                </button>
              );
            })}

            <div className="oc-sidebar-divider-label">Overlay</div>

            <button
              className={`oc-sidebar-btn ${streamerToolsOpen || STREAMER_TOOL_PAGES.includes(activeTab) ? 'oc-sidebar-btn--active' : ''}`}
              onClick={() => setStreamerToolsOpen((current) => !current)}
            >
              <span className="oc-sidebar-btn-icon">🛠️</span>
              <span className="oc-sidebar-btn-text">
                <span className="oc-sidebar-btn-label">Streamer Tools</span>
                <span className="oc-sidebar-btn-desc">Hunt tracking, tournaments, and stream stats.</span>
              </span>
              <span className={`oc-sidebar-btn-toggle ${streamerToolsOpen ? 'oc-sidebar-btn-toggle--open' : ''}`}>▼</span>
            </button>
            {streamerToolsOpen ? (
              <div className="oc-sidebar-group-items">
                {STREAMER_TOOL_PAGES.map((panelId) => {
                  const panel = PANEL_META[panelId];

                  return (
                    <button
                      key={panelId}
                      className={`oc-sidebar-btn oc-sidebar-btn--sub ${activeTab === panelId ? 'oc-sidebar-btn--active' : ''}`}
                      onClick={() => openPanel(panelId)}
                    >
                      <span className="oc-sidebar-btn-icon">{panel.icon}</span>
                      <span className="oc-sidebar-btn-text">
                        <span className="oc-sidebar-btn-label">{panel.label}</span>
                        <span className="oc-sidebar-btn-desc">{panel.description}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : null}

            <button
              className={`oc-sidebar-btn ${communityToolsOpen || COMMUNITY_TOOL_PAGES.includes(activeTab) ? 'oc-sidebar-btn--active' : ''}`}
              onClick={() => setCommunityToolsOpen((current) => !current)}
            >
              <span className="oc-sidebar-btn-icon">🧰</span>
              <span className="oc-sidebar-btn-text">
                <span className="oc-sidebar-btn-label">Community Tools</span>
                <span className="oc-sidebar-btn-desc">Pickers and audience-driven overlay tools.</span>
              </span>
              <span className={`oc-sidebar-btn-toggle ${communityToolsOpen ? 'oc-sidebar-btn-toggle--open' : ''}`}>▼</span>
            </button>
            {communityToolsOpen ? (
              <div className="oc-sidebar-group-items">
                {COMMUNITY_TOOL_PAGES.map((panelId) => {
                  const panel = PANEL_META[panelId];

                  return (
                    <button
                      key={panelId}
                      className={`oc-sidebar-btn oc-sidebar-btn--sub ${activeTab === panelId ? 'oc-sidebar-btn--active' : ''}`}
                      onClick={() => openPanel(panelId)}
                    >
                      <span className="oc-sidebar-btn-icon">{panel.icon}</span>
                      <span className="oc-sidebar-btn-text">
                        <span className="oc-sidebar-btn-label">{panel.label}</span>
                        <span className="oc-sidebar-btn-desc">{panel.description}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : null}

            <button
              className={`oc-sidebar-btn ${communityGamesOpen || COMMUNITY_GAME_PAGES.includes(activeTab) ? 'oc-sidebar-btn--active' : ''}`}
              onClick={() => setCommunityGamesOpen((current) => !current)}
            >
              <span className="oc-sidebar-btn-icon">🎮</span>
              <span className="oc-sidebar-btn-text">
                <span className="oc-sidebar-btn-label">Community Games</span>
                <span className="oc-sidebar-btn-desc">Standalone game pages for viewer interactions.</span>
              </span>
              <span className={`oc-sidebar-btn-toggle ${communityGamesOpen ? 'oc-sidebar-btn-toggle--open' : ''}`}>▼</span>
            </button>
            {communityGamesOpen ? (
              <div className="oc-sidebar-group-items">
                {COMMUNITY_GAME_PAGES.map((panelId) => {
                  const panel = PANEL_META[panelId];

                  return (
                    <button
                      key={panelId}
                      className={`oc-sidebar-btn oc-sidebar-btn--sub ${activeTab === panelId ? 'oc-sidebar-btn--active' : ''}`}
                      onClick={() => openPanel(panelId)}
                    >
                      <span className="oc-sidebar-btn-icon">{panel.icon}</span>
                      <span className="oc-sidebar-btn-text">
                        <span className="oc-sidebar-btn-label">{panel.label}</span>
                        <span className="oc-sidebar-btn-desc">{panel.description}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : null}

            <button
              className={`oc-sidebar-btn ${brandPagesOpen || BRAND_PAGE_PAGES.includes(activeTab) ? 'oc-sidebar-btn--active' : ''}`}
              onClick={() => setBrandPagesOpen((current) => !current)}
            >
              <span className="oc-sidebar-btn-icon">✨</span>
              <span className="oc-sidebar-btn-text">
                <span className="oc-sidebar-btn-label">Brand And Community</span>
                <span className="oc-sidebar-btn-desc">Navbar, chat, and custom surfaces on their own pages.</span>
              </span>
              <span className={`oc-sidebar-btn-toggle ${brandPagesOpen ? 'oc-sidebar-btn-toggle--open' : ''}`}>▼</span>
            </button>
            {brandPagesOpen ? (
              <div className="oc-sidebar-group-items">
                {BRAND_PAGE_PAGES.map((panelId) => {
                  const panel = PANEL_META[panelId];

                  return (
                    <button
                      key={panelId}
                      className={`oc-sidebar-btn oc-sidebar-btn--sub ${activeTab === panelId ? 'oc-sidebar-btn--active' : ''}`}
                      onClick={() => openPanel(panelId)}
                    >
                      <span className="oc-sidebar-btn-icon">{panel.icon}</span>
                      <span className="oc-sidebar-btn-text">
                        <span className="oc-sidebar-btn-label">{panel.label}</span>
                        <span className="oc-sidebar-btn-desc">{panel.description}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : null}

            <div className="oc-sidebar-divider-label">Management</div>

            <button
              className={`oc-sidebar-btn ${managementOpen || MANAGEMENT_PAGES.includes(activeTab) ? 'oc-sidebar-btn--active' : ''}`}
              onClick={() => setManagementOpen((current) => !current)}
            >
              <span className="oc-sidebar-btn-icon">📦</span>
              <span className="oc-sidebar-btn-text">
                <span className="oc-sidebar-btn-label">Workspace Tools</span>
                <span className="oc-sidebar-btn-desc">Themes, layouts, and positioning pages.</span>
              </span>
              <span className={`oc-sidebar-btn-toggle ${managementOpen ? 'oc-sidebar-btn-toggle--open' : ''}`}>▼</span>
            </button>
            {managementOpen ? (
              <div className="oc-sidebar-group-items">
                {MANAGEMENT_PAGES.map((panelId) => {
                  const panel = PANEL_META[panelId];

                  return (
                    <button
                      key={panelId}
                      className={`oc-sidebar-btn oc-sidebar-btn--sub ${activeTab === panelId ? 'oc-sidebar-btn--active' : ''}`}
                      onClick={() => openPanel(panelId)}
                    >
                      <span className="oc-sidebar-btn-icon">{panel.icon}</span>
                      <span className="oc-sidebar-btn-text">
                        <span className="oc-sidebar-btn-label">{panel.label}</span>
                        <span className="oc-sidebar-btn-desc">{panel.description}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </nav>

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

        <main className={`oc-main ${useCompactMainHeader ? 'oc-main--compact' : ''}`.trim()}>
          {useCompactMainHeader ? (
            <div className="oc-main-toolbar">{renderMainActions()}</div>
          ) : (
            <header className="oc-main-header">
              <div>
                <span className="oc-main-kicker">Control Center</span>
                <h1>{activePanel.label}</h1>
                <p>{activePanel.description}</p>
              </div>

              <div className="oc-main-header-actions">{renderMainActions()}</div>
            </header>
          )}

          <section className={`oc-panel-shell ${useCompactMainHeader ? 'oc-panel-shell--compact' : ''}`.trim()}>{renderPanelContent()}</section>
        </main>
      </div>
    </div>
  );
}
