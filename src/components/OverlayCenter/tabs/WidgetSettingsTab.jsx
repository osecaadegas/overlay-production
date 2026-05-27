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

export default function WidgetSettingsTab({ overlay, updateSettings, slots }) {
  const widgets = overlay.settings.widgets ?? {};
  const enabledCount = Object.values(widgets).filter((widget) => widget?.enabled).length;

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

        <section className="widget-section">
          <div className="widget-section-header">
            <div>
              <span className="widget-section-kicker">Streamer Core</span>
              <h3>Primary live widgets</h3>
            </div>
            <p>Start with the widgets that define the overlay during the stream.</p>
          </div>

          <div className="widget-controls widget-controls--section">
            <BonusHuntWidget overlay={overlay} updateSettings={updateSettings} slots={slots} />
            <SessionStatsWidget overlay={overlay} updateSettings={updateSettings} />
            <RecentWinsWidget overlay={overlay} updateSettings={updateSettings} />
            <TournamentsWidget overlay={overlay} updateSettings={updateSettings} />
          </div>
        </section>

        <section className="widget-section">
          <div className="widget-section-header">
            <div>
              <span className="widget-section-kicker">Games And Picks</span>
              <h3>Interactive overlay moments</h3>
            </div>
            <p>Utility widgets for audience interaction, randomizers, and extra motion on stream.</p>
          </div>

          <div className="widget-controls widget-controls--section">
            <CoinFlipWidget overlay={overlay} updateSettings={updateSettings} />
            <SlotmachineWidget overlay={overlay} updateSettings={updateSettings} />
            <RandomSlotPickerWidget overlay={overlay} updateSettings={updateSettings} />
            <WheelOfNamesWidget overlay={overlay} updateSettings={updateSettings} />
          </div>
        </section>

        <section className="widget-section">
          <div className="widget-section-header">
            <div>
              <span className="widget-section-kicker">Brand And Community</span>
              <h3>Identity and audience surfaces</h3>
            </div>
            <p>Handle navigation, chat, and custom content blocks that frame the overlay visually.</p>
          </div>

          <div className="widget-controls widget-controls--section">
            <NavbarWidget overlay={overlay} updateSettings={updateSettings} />
            <ChatWidget overlay={overlay} updateSettings={updateSettings} />
            <CustomizationWidget overlay={overlay} updateSettings={updateSettings} />
          </div>
        </section>
      </div>
    </div>
  );
}
