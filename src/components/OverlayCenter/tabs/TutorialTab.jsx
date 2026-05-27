const WORKFLOW_SECTIONS = [
  {
    title: 'Start With Identity',
    copy: 'The old overlay center expected you to set profile details first so widgets had something real to render.',
    steps: [
      'Open Profile and set display name, motto, avatar, and Twitch channel.',
      'Save the profile so Navbar and Twitch Chat inherit the same identity data.',
      'Return to Widgets only after the base profile is set.',
    ],
  },
  {
    title: 'Build The Overlay Stack',
    copy: 'Use the main widget library for the full catalog, then jump into dedicated pages for the tools you actively manage during stream.',
    steps: [
      'Enable the widgets you need in the Widgets page.',
      'Use Bonus Hunt, Tournament, Chat, or Navbar pages when you want their full setup surface.',
      'Keep the OBS preview open while you tune the stack.',
    ],
  },
  {
    title: 'Finish In Management',
    copy: 'Once the widgets are set, use the management pages like the old control center workflow: first theme, then layout, then final positioning.',
    steps: [
      'Adjust global colors in Themes.',
      'Pick supported layout modes in Layouts.',
      'Use Positioning last so the final live arrangement matches the active theme and layout.',
    ],
  },
];

const PAGE_JUMPS = [
  { id: 'profile', label: 'Profile', description: 'Identity, avatar, and Twitch channel defaults.' },
  { id: 'widgets', label: 'Widgets', description: 'Full widget catalog and grouped setup overview.' },
  { id: 'bonusHunt', label: 'Bonus Hunt', description: 'Dedicated hunt page with inline controls.' },
  { id: 'tournaments', label: 'Tournament', description: 'Dedicated tournament manager page.' },
  { id: 'chat', label: 'Twitch Chat', description: 'Inline chat setup without popouts.' },
  { id: 'navbar', label: 'Navbar', description: 'Full-page stream identity bar setup.' },
  { id: 'styles', label: 'Themes', description: 'Global overlay color controls.' },
  { id: 'layout', label: 'Layouts', description: 'Display mode switches for supported widgets.' },
  { id: 'positioning', label: 'Positioning', description: 'Final placement pass using the live preview.' },
];

export default function TutorialTab({ overlay, overlayUrl, previewUrl, onNavigate, onCreateOverlay, saving }) {
  return (
    <div className="tab-content">
      <div className="tutorial-page">
        <section className="tutorial-hero">
          <span className="oc-panel-chip">Walkthrough</span>
          <h2>Follow the old control-center flow, page by page.</h2>
          <p>
            This extracted build now mirrors the old navigation model more closely: dedicated pages for the core
            tools, a full widget catalog, and separate management pages for themes, layouts, and positioning.
          </p>
        </section>

        <div className="tutorial-grid">
          {WORKFLOW_SECTIONS.map((section) => (
            <section key={section.title} className="tutorial-section">
              <div className="tutorial-section-header">
                <h3>{section.title}</h3>
                <p>{section.copy}</p>
              </div>
              <div className="tutorial-step-list">
                {section.steps.map((step) => (
                  <article key={step} className="tutorial-step">
                    <strong>Step</strong>
                    <p>{step}</p>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>

        <section className="tutorial-section tutorial-section--links">
          <div className="tutorial-section-header">
            <h3>Jump To Any Page</h3>
            <p>Use these shortcuts to walk the center the same way you used to in the original version.</p>
          </div>

          <div className="tutorial-jump-grid">
            {PAGE_JUMPS.map((page) => (
              <button key={page.id} className="tutorial-jump" onClick={() => onNavigate(page.id)} type="button">
                <strong>{page.label}</strong>
                <span>{page.description}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="tutorial-obs-card">
          <div className="tutorial-section-header">
            <h3>OBS Setup</h3>
            <p>The old workspace always ended with the browser source. That stays true here.</p>
          </div>

          {overlay ? (
            <div className="tutorial-obs-grid">
              <div className="tutorial-obs-block">
                <span className="tutorial-obs-label">Overlay URL</span>
                <div className="tutorial-url">{overlayUrl}</div>
              </div>

              <div className="tutorial-obs-actions">
                <a className="oc-btn-primary" href={previewUrl} target="_blank" rel="noopener noreferrer">
                  Open live preview
                </a>
                <button className="oc-btn-secondary" onClick={() => onNavigate('widgets')} type="button">
                  Back to widgets
                </button>
              </div>
            </div>
          ) : (
            <div className="tutorial-empty-state">
              <p>Create the overlay workspace first so the OBS URL, preview, and widget pages become live.</p>
              <button className="oc-btn-primary" onClick={onCreateOverlay} disabled={saving} type="button">
                {saving ? 'Creating overlay...' : 'Create overlay'}
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}