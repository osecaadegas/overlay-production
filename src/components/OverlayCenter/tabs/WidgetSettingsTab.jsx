import { useEffect } from 'react';
import BonusHuntWidget from '../widgets/BonusHuntWidget/BonusHuntWidget';
import SessionStatsWidget from '../widgets/SessionStatsWidget/SessionStatsWidget';
import RecentWinsWidget from '../widgets/RecentWinsWidget/RecentWinsWidget';
import TournamentsWidget from '../widgets/TournamentsWidget/TournamentsWidget';
import CoinFlipWidget from '../widgets/CoinFlipWidget/CoinFlipWidget';
import SlotmachineWidget from '../widgets/SlotmachineWidget/SlotmachineWidget';
import RandomSlotPickerWidget from '../widgets/RandomSlotPickerWidget/RandomSlotPickerWidget';
import WheelOfNamesWidget from '../widgets/WheelOfNamesWidget/WheelOfNamesWidget';
import NavbarWidget from '../widgets/NavbarWidget/NavbarWidget';
import ChatWidget from '../widgets/ChatWidget/ChatWidget';
import CustomizationWidget from '../widgets/CustomizationWidget/CustomizationWidget';

const WIDGET_GROUPS = [
  {
    id: 'streamer-core',
    kicker: 'Streamer Core',
    title: 'Primary live widgets',
    description: 'Start with the widgets that define the overlay during the stream.',
    widgets: [
      { id: 'bonusHunt', label: 'Bonus Hunt', Component: BonusHuntWidget },
      { id: 'sessionStats', label: 'Session Stats', Component: SessionStatsWidget },
      { id: 'recentWins', label: 'Recent Wins', Component: RecentWinsWidget },
      { id: 'tournaments', label: 'Tournaments', Component: TournamentsWidget },
    ],
  },
  {
    id: 'games-picks',
    kicker: 'Games And Picks',
    title: 'Interactive overlay moments',
    description: 'Utility widgets for audience interaction, randomizers, and extra motion on stream.',
    widgets: [
      { id: 'coinflip', label: 'Coin Flip', Component: CoinFlipWidget },
      { id: 'slotmachine', label: 'Slotmachine', Component: SlotmachineWidget },
      { id: 'randomSlotPicker', label: 'Random Slot Picker', Component: RandomSlotPickerWidget },
      { id: 'wheelOfNames', label: 'Wheel Of Names', Component: WheelOfNamesWidget },
    ],
  },
  {
    id: 'brand-community',
    kicker: 'Brand And Community',
    title: 'Identity and audience surfaces',
    description: 'Handle navigation, chat, and custom content blocks that frame the overlay visually.',
    widgets: [
      { id: 'navbar', label: 'Navbar', Component: NavbarWidget },
      { id: 'chat', label: 'Twitch Chat', Component: ChatWidget },
      { id: 'customization', label: 'Customization', Component: CustomizationWidget },
    ],
  },
];

export default function WidgetSettingsTab({ overlay, updateSettings, slots, focusedWidget, onRequestFocus }) {
  const widgets = overlay.settings.widgets ?? {};
  const enabledCount = Object.values(widgets).filter((widget) => widget?.enabled).length;
  const priorityWidgets = [
    { id: 'bonusHunt', label: 'Bonus Hunt', description: 'Tracker, bankroll goals, bonus list.' },
    { id: 'tournaments', label: 'Tournaments', description: 'Bracket and match results.' },
    { id: 'navbar', label: 'Navbar', description: 'Display name, tagline and mode.' },
    { id: 'chat', label: 'Twitch Chat', description: 'Channel target and live feed.' },
  ];

  useEffect(() => {
    if (!focusedWidget) {
      return;
    }

    const element = document.getElementById(`widget-slot-${focusedWidget}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [focusedWidget]);

  return (
    <div className="tab-content">
      <div className="widget-dashboard">
        <section className="widget-dashboard-hero">
          <div className="widget-dashboard-copy">
            <span className="widget-dashboard-kicker">Widget Library</span>
            <h2>Build the live stack for this overlay.</h2>
            <p>
              Turn core widgets on and off, open each configuration modal, and keep everything saved to the
              current overlay workspace as you tune the experience.
            </p>
          </div>

          <div className="widget-dashboard-stats">
            <article className="widget-stat-card">
              <span className="widget-stat-label">Enabled</span>
              <strong>{enabledCount}</strong>
              <p>Widgets currently active on the overlay.</p>
            </article>
            <article className="widget-stat-card">
              <span className="widget-stat-label">Library</span>
              <strong>11 tools</strong>
              <p>Tracking, community, branding, and game widgets.</p>
            </article>
            <article className="widget-stat-card">
              <span className="widget-stat-label">Catalog</span>
              <strong>{slots.length.toLocaleString()}</strong>
              <p>Slots available for hunt, picker, and tournament flows.</p>
            </article>
          </div>
        </section>

        <section className="widget-setup-strip">
          {priorityWidgets.map((widget) => {
            const isEnabled = widgets[widget.id]?.enabled ?? false;
            return (
              <button
                key={widget.id}
                className={`widget-setup-pill ${focusedWidget === widget.id ? 'widget-setup-pill--active' : ''}`}
                onClick={() => onRequestFocus?.(widget.id)}
                type="button"
              >
                <span className="widget-setup-pill-top">
                  <strong>{widget.label}</strong>
                  <span className={`widget-setup-pill-status ${isEnabled ? 'widget-setup-pill-status--live' : ''}`}>
                    {isEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </span>
                <span className="widget-setup-pill-copy">{widget.description}</span>
              </button>
            );
          })}
        </section>

        {WIDGET_GROUPS.map((group) => {
          const activeCount = group.widgets.filter((widget) => widgets[widget.id]?.enabled).length;

          return (
            <section key={group.id} className="widget-section">
              <div className="widget-section-header">
                <div>
                  <span className="widget-section-kicker">{group.kicker}</span>
                  <h3>{group.title}</h3>
                </div>
                <div className="widget-section-summary">
                  <span className="widget-section-count">{activeCount}/{group.widgets.length} active</span>
                  <p>{group.description}</p>
                </div>
              </div>

              <div className="widget-controls widget-controls--section">
                {group.widgets.map(({ id, Component }) => (
                  <div
                    key={id}
                    id={`widget-slot-${id}`}
                    className={`widget-slot ${focusedWidget === id ? 'widget-slot--focused' : ''}`}
                  >
                    <Component overlay={overlay} updateSettings={updateSettings} slots={slots} />
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
