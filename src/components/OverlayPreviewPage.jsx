import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { normalizeOverlaySettings } from '../utils/overlayDefaults';

const widgetTitles = {
  bonusHunt: 'Bonus Hunt Tracker',
  sessionStats: 'Session Stats',
  recentWins: 'Recent Wins',
  tournaments: 'Tournament Bracket',
  coinflip: 'Coin Flip',
  slotmachine: 'Slot Machine',
  randomSlotPicker: 'Random Slot Picker',
  wheelOfNames: 'Wheel of Names',
  navbar: 'Navbar',
  chat: 'Chat Widget',
  customization: 'Customization Panel',
};

function widgetStyle(widgetSettings, theme, widgetStyles) {
  const x = widgetSettings?.position?.x ?? 50;
  const y = widgetSettings?.position?.y ?? 50;

  return {
    left: `${(x / 2560) * 100}%`,
    top: `${(y / 1440) * 100}%`,
    borderColor: widgetStyles?.borderColor || theme?.primaryColor || '#38bdf8',
    background: widgetStyles?.backgroundColor
      ? `${widgetStyles.backgroundColor}dd`
      : 'rgba(15, 23, 42, 0.78)',
  };
}

function BonusHuntPreview({ settings, theme }) {
  const progress = Math.min(
    100,
    settings.targetMoney > 0 ? (settings.startMoney / settings.targetMoney) * 100 : 12
  );

  return (
    <>
      <div className="preview-rows">
        <span><strong>Start</strong> {settings.startMoney}</span>
        <span><strong>Target</strong> {settings.targetMoney}</span>
        <span><strong>Stop loss</strong> {settings.stopLoss}</span>
      </div>
      <div className="preview-meter">
        <div className="preview-meter-fill" style={{ width: `${progress}%`, background: theme.primaryColor }} />
      </div>
      <small>{settings.bonusList?.length || 0} configured bonus entries</small>
    </>
  );
}

function SessionStatsPreview() {
  return (
    <div className="preview-rows">
      <span><strong>Balance</strong> 2,450</span>
      <span><strong>Wager</strong> 6,140</span>
      <span><strong>Profit</strong> +815</span>
    </div>
  );
}

function RecentWinsPreview() {
  return (
    <div className="preview-pill-list">
      <span>Wanted Dead or a Wild • 420x</span>
      <span>Sweet Bonanza • 165x</span>
      <span>Chaos Crew 2 • 312x</span>
    </div>
  );
}

function TournamentPreview({ settings }) {
  const players = settings.data?.players?.length || 0;
  const slots = settings.data?.slots?.length || 0;

  return (
    <div className="preview-rows">
      <span><strong>Format</strong> {settings.data?.matchFormat || 'single'}</span>
      <span><strong>Players</strong> {players}</span>
      <span><strong>Slots</strong> {slots}</span>
    </div>
  );
}

function CoinFlipPreview() {
  return (
    <div className="preview-inline-list">
      <span>Heads</span>
      <span>Tails</span>
      <span>Best of three</span>
    </div>
  );
}

function SlotMachinePreview() {
  return (
    <div className="preview-inline-list">
      <span>7</span>
      <span>BAR</span>
      <span>Cherry</span>
    </div>
  );
}

function RandomSlotPreview() {
  return (
    <div className="preview-pill-list">
      <span>Pragmatic Play</span>
      <span>Hacksaw</span>
      <span>NoLimit City</span>
    </div>
  );
}

function WheelPreview() {
  return (
    <div className="preview-pill-list">
      <span>Viewer 1</span>
      <span>Viewer 2</span>
      <span>Viewer 3</span>
    </div>
  );
}

function NavbarPreview({ settings }) {
  return (
    <div className="preview-navbar">
      <div>
        <strong>{settings.streamerName || 'Streamer Name'}</strong>
        <small>{settings.motto || 'Overlay mode ready'}</small>
      </div>
      <span>{settings.mode || 'Raw'}</span>
    </div>
  );
}

function ChatPreview({ settings }) {
  const maxMessages = Math.max(3, Math.min(5, settings.maxMessages || 5));

  return (
    <div className="preview-chat-list">
      {Array.from({ length: maxMessages }).map((_, index) => (
        <span key={index}>viewer{index + 1}: clean extraction preview</span>
      ))}
    </div>
  );
}

function CustomizationPreview({ theme }) {
  return (
    <div className="preview-rows">
      <span><strong>Primary</strong> {theme.primaryColor}</span>
      <span><strong>Accent</strong> {theme.accentColor}</span>
      <span><strong>Text</strong> {theme.textColor}</span>
    </div>
  );
}

function renderWidgetPreview(widgetKey, widgetSettings, theme) {
  switch (widgetKey) {
    case 'bonusHunt':
      return <BonusHuntPreview settings={widgetSettings} theme={theme} />;
    case 'sessionStats':
      return <SessionStatsPreview />;
    case 'recentWins':
      return <RecentWinsPreview />;
    case 'tournaments':
      return <TournamentPreview settings={widgetSettings} />;
    case 'coinflip':
      return <CoinFlipPreview />;
    case 'slotmachine':
      return <SlotMachinePreview />;
    case 'randomSlotPicker':
      return <RandomSlotPreview />;
    case 'wheelOfNames':
      return <WheelPreview />;
    case 'navbar':
      return <NavbarPreview settings={widgetSettings} />;
    case 'chat':
      return <ChatPreview settings={widgetSettings} />;
    case 'customization':
      return <CustomizationPreview theme={theme} />;
    default:
      return <small>Preview unavailable</small>;
  }
}

export default function OverlayPreviewPage() {
  const [searchParams] = useSearchParams();
  const publicId = searchParams.get('id');
  const previewMode = searchParams.get('preview') === 'true';
  const [overlay, setOverlay] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!publicId) {
      setError('Missing public overlay id.');
      setLoading(false);
      return undefined;
    }

    let active = true;

    const loadOverlay = async () => {
      try {
        const response = await fetch(`/api/overlay/public?id=${encodeURIComponent(publicId)}`);

        if (!response.ok) {
          throw new Error(response.status === 404 ? 'Overlay not found.' : 'Failed to load overlay.');
        }

        const data = await response.json();
        if (active) {
          setOverlay(data);
          setError('');
          setLoading(false);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError.message || 'Failed to load overlay.');
          setLoading(false);
        }
      }
    };

    loadOverlay();
    const intervalId = window.setInterval(loadOverlay, 3000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [publicId]);

  const settings = useMemo(() => normalizeOverlaySettings(overlay?.settings), [overlay?.settings]);
  const widgets = settings.widgets || {};
  const theme = settings.theme || {};

  if (loading) {
    return (
      <div className="preview-loading">
        <div className="preview-status-card">Loading overlay preview...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="preview-error">
        <div className="preview-status-card">{error}</div>
      </div>
    );
  }

  return (
    <div className="preview-shell">
      <div className={`preview-stage ${previewMode ? 'preview-mode' : ''}`}>
        {Object.entries(widgets)
          .filter(([, widgetSettings]) => widgetSettings?.enabled)
          .map(([widgetKey, widgetSettings]) => {
            const stylePreset = settings.widgetStyles?.[widgetKey] || {};

            return (
              <section
                key={widgetKey}
                className="preview-widget"
                style={widgetStyle(widgetSettings, theme, stylePreset)}
              >
                <h3>{widgetTitles[widgetKey] || widgetKey}</h3>
                {renderWidgetPreview(widgetKey, widgetSettings, theme)}
              </section>
            );
          })}
      </div>
    </div>
  );
}