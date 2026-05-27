import { useEffect, useMemo, useState } from 'react';

function buildProfileState(overlay, user) {
  const savedProfile = overlay?.settings?.profile ?? {};
  const navbar = overlay?.settings?.widgets?.navbar ?? {};
  const chat = overlay?.settings?.widgets?.chat ?? {};
  const meta = user?.user_metadata ?? {};

  return {
    displayName:
      savedProfile.displayName ??
      navbar.streamerName ??
      meta.full_name ??
      meta.preferred_username ??
      '',
    motto: savedProfile.motto ?? navbar.motto ?? '',
    avatarUrl: savedProfile.avatarUrl ?? meta.avatar_url ?? '',
    twitchChannel:
      savedProfile.twitchChannel ??
      chat.channelName ??
      meta.preferred_username ??
      meta.user_name ??
      '',
  };
}

function providerLabel(user) {
  const provider = user?.app_metadata?.provider;

  switch (provider) {
    case 'google':
      return 'Google';
    case 'twitch':
      return 'Twitch';
    default:
      return 'Email';
  }
}

export default function ProfileTab({ overlay, updateSettings, user }) {
  const [profile, setProfile] = useState(() => buildProfileState(overlay, user));
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    setProfile(buildProfileState(overlay, user));
  }, [overlay, user]);

  const accountLabel = user?.email || user?.user_metadata?.full_name || user?.id || 'Signed out';
  const provider = providerLabel(user);
  const displayHeading = profile.displayName || accountLabel;
  const syncTargets = useMemo(
    () => [
      {
        label: 'Navbar',
        enabled: overlay?.settings?.widgets?.navbar?.enabled ?? false,
        description: 'Receives the display name and motto shown on stream.',
      },
      {
        label: 'Twitch Chat',
        enabled: overlay?.settings?.widgets?.chat?.enabled ?? false,
        description: 'Receives the Twitch channel name for the live chat panel.',
      },
    ],
    [overlay]
  );

  const updateProfileField = (key, value) => {
    setProfile((current) => ({
      ...current,
      [key]: value,
    }));
    setSaveMessage('');
  };

  const saveProfile = async () => {
    if (!overlay) {
      return;
    }

    setSaving(true);
    setSaveMessage('');

    const nextProfile = {
      displayName: profile.displayName.trim(),
      motto: profile.motto.trim(),
      avatarUrl: profile.avatarUrl.trim(),
      twitchChannel: profile.twitchChannel.trim(),
    };

    const nextSettings = {
      ...overlay.settings,
      profile: {
        ...(overlay.settings.profile ?? {}),
        ...nextProfile,
      },
      widgets: {
        ...overlay.settings.widgets,
        navbar: {
          ...overlay.settings.widgets.navbar,
          streamerName: nextProfile.displayName,
          motto: nextProfile.motto,
        },
        chat: {
          ...overlay.settings.widgets.chat,
          channelName: nextProfile.twitchChannel,
        },
      },
    };

    const ok = await updateSettings(nextSettings);

    setSaving(false);
    setSaveMessage(ok ? 'Profile saved and synced to supported widgets.' : 'Profile save failed. Try again.');
  };

  return (
    <div className="profile-panel">
      <section className="profile-identity-strip">
        {profile.avatarUrl ? (
          <img src={profile.avatarUrl} alt="Profile avatar" className="profile-avatar" />
        ) : (
          <div className="profile-avatar-placeholder">{displayHeading.slice(0, 1).toUpperCase()}</div>
        )}

        <div className="profile-identity-copy">
          <span className="profile-kicker">Profile Hub</span>
          <h2>{displayHeading}</h2>
          <p>Manage the identity and channel details that the overlay reuses across widgets.</p>
        </div>

        <div className="profile-provider-badge">{provider}</div>
      </section>

      <div className="profile-grid">
        <section className="profile-card">
          <div className="profile-card-header">
            <span className="profile-card-kicker">Identity</span>
            <h3>Streamer profile</h3>
            <p>These values become the default identity layer for the extracted overlay workspace.</p>
          </div>

          <div className="profile-form-grid">
            <label className="profile-field profile-field--wide">
              <span>Display name</span>
              <input
                type="text"
                value={profile.displayName}
                onChange={(event) => updateProfileField('displayName', event.target.value)}
                placeholder="Your streamer name"
              />
            </label>

            <label className="profile-field profile-field--wide">
              <span>Motto / tagline</span>
              <input
                type="text"
                value={profile.motto}
                onChange={(event) => updateProfileField('motto', event.target.value)}
                placeholder="A short line for the navbar"
              />
            </label>

            <label className="profile-field profile-field--wide">
              <span>Avatar URL</span>
              <input
                type="text"
                value={profile.avatarUrl}
                onChange={(event) => updateProfileField('avatarUrl', event.target.value)}
                placeholder="https://example.com/avatar.jpg"
              />
            </label>

            <label className="profile-field profile-field--wide">
              <span>Twitch channel</span>
              <input
                type="text"
                value={profile.twitchChannel}
                onChange={(event) => updateProfileField('twitchChannel', event.target.value)}
                placeholder="osecaadegas95"
              />
            </label>
          </div>
        </section>

        <section className="profile-card">
          <div className="profile-card-header">
            <span className="profile-card-kicker">Account</span>
            <h3>Connected session</h3>
            <p>This matches the identity currently signed into the extracted overlay center.</p>
          </div>

          <div className="profile-meta-list">
            <div className="profile-meta-item">
              <span className="profile-meta-label">Signed in as</span>
              <strong>{accountLabel}</strong>
            </div>
            <div className="profile-meta-item">
              <span className="profile-meta-label">Provider</span>
              <strong>{provider}</strong>
            </div>
            <div className="profile-meta-item">
              <span className="profile-meta-label">Overlay workspace</span>
              <strong>{overlay?.public_id || 'Create overlay first'}</strong>
            </div>
            <div className="profile-meta-item">
              <span className="profile-meta-label">Chat target</span>
              <strong>{profile.twitchChannel || 'Not set yet'}</strong>
            </div>
          </div>

          <div className="profile-preview-card">
            <span className="profile-preview-label">Navbar preview</span>
            <strong>{profile.displayName || 'Streamer Name'}</strong>
            <p>{profile.motto || 'Overlay mode ready'}</p>
          </div>
        </section>
      </div>

      <section className="profile-card profile-card--sync">
        <div className="profile-card-header">
          <span className="profile-card-kicker">Sync</span>
          <h3>Widget targets</h3>
          <p>The profile hub writes to the widgets that currently support identity and channel data.</p>
        </div>

        <div className="profile-sync-grid">
          {syncTargets.map((target) => (
            <article key={target.label} className="profile-sync-item">
              <div className="profile-sync-item-header">
                <strong>{target.label}</strong>
                <span className={`profile-sync-badge ${target.enabled ? 'profile-sync-badge--live' : ''}`}>
                  {target.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <p>{target.description}</p>
            </article>
          ))}
        </div>

        <div className="profile-action-row">
          <div>
            <strong className="profile-action-title">Save to overlay settings</strong>
            <p className="profile-action-copy">
              Your profile details are stored on the overlay and mirrored into the Navbar and Twitch Chat widget configs.
            </p>
          </div>

          <button className="oc-btn-primary" onClick={saveProfile} disabled={saving || !overlay}>
            {saving ? 'Saving profile...' : overlay ? 'Save profile' : 'Create overlay first'}
          </button>
        </div>

        {saveMessage ? (
          <div className={`profile-save-notice ${saveMessage.startsWith('Profile saved') ? 'profile-save-notice--success' : 'profile-save-notice--error'}`}>
            {saveMessage}
          </div>
        ) : null}
      </section>
    </div>
  );
}