/**
 * ECHO — My Library View (Student 2 Module)
 * Tabs: Liked Songs, Saved Artists, Recently Explored History
 * Integrated with MySQL backend API.
 */
const LibraryView = (function () {
  let activeTab = 'liked'; // 'liked', 'artists', 'recent'

  let likedSongs = [];
  let savedArtists = [];
  let recentTracks = [];

  async function render(container, routeParams = {}) {
    if (routeParams.tab) {
      activeTab = routeParams.tab;
    }

    const isAuthed = Api.isAuthenticated();

    if (isAuthed) {
      try {
        if (activeTab === 'liked') {
          const res = await Api.get('library.php?action=liked');
          if (res && res.success) likedSongs = res.tracks || [];
        } else if (activeTab === 'artists') {
          const res = await Api.get('library.php?action=artists');
          if (res && res.success) savedArtists = res.artists || [];
        } else if (activeTab === 'recent') {
          const res = await Api.get('library.php?action=recent');
          if (res && res.success) recentTracks = res.tracks || [];
        }
      } catch (err) {
        console.warn('Could not load library data:', err);
      }
    }

    container.innerHTML = `
      <div class="view-container">
        <div class="section-header">
          <div>
            <h1 class="section-title">My Library</h1>
            <p class="section-subtitle">Your saved favorites, followed artists, and playback history</p>
          </div>
        </div>

        ${!isAuthed ? `
          <div class="state-container" style="margin-bottom: var(--space-6); background: var(--bg-surface-raised);">
            <svg class="state-icon" style="color: var(--accent-primary);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            </svg>
            <h3 class="state-title">Personalized Library</h3>
            <p class="state-description">Sign in to sync your liked tracks, followed artists, and listening history with your account.</p>
            <button class="btn btn-primary" onclick="Modal.open('auth-modal')">Sign In / Register</button>
          </div>
        ` : ''}

        <!-- Tab Navigation -->
        <div class="library-tabs" role="tablist" aria-label="Library Sections">
          <button class="library-tab ${activeTab === 'liked' ? 'active' : ''}" data-tab="liked" role="tab" aria-selected="${activeTab === 'liked'}">
            Liked Songs ${isAuthed ? `(${likedSongs.length})` : ''}
          </button>
          <button class="library-tab ${activeTab === 'artists' ? 'active' : ''}" data-tab="artists" role="tab" aria-selected="${activeTab === 'artists'}">
            Saved Artists ${isAuthed ? `(${savedArtists.length})` : ''}
          </button>
          <button class="library-tab ${activeTab === 'recent' ? 'active' : ''}" data-tab="recent" role="tab" aria-selected="${activeTab === 'recent'}">
            Recently Explored
          </button>
        </div>

        <!-- Dynamic Content Section -->
        <div id="library-tab-content">
          ${renderTabContent(isAuthed)}
        </div>
      </div>
    `;

    // Tab click listeners
    container.querySelectorAll('.library-tab').forEach(tabBtn => {
      tabBtn.addEventListener('click', async () => {
        container.querySelectorAll('.library-tab').forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        tabBtn.classList.add('active');
        tabBtn.setAttribute('aria-selected', 'true');
        activeTab = tabBtn.dataset.tab;

        // Re-render tab content
        await render(container);
      });
    });

    attachActionListeners(container);
  }

  function renderTabContent(isAuthed) {
    if (!isAuthed) {
      return `
        <div class="state-container">
          <h3 class="state-title">Sign In Required</h3>
          <p class="state-description">Please log in with your ECHO account to view your personal collection.</p>
        </div>
      `;
    }

    if (activeTab === 'liked') {
      if (likedSongs.length === 0) {
        return `
          <div class="state-container">
            <svg class="state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            <h3 class="state-title">No liked songs yet</h3>
            <p class="state-description">Explore tracks and click the heart icon on any song or in the player bar to save it here.</p>
            <a href="#/genres" class="btn btn-secondary">Explore Catalogue</a>
          </div>
        `;
      }

      return `
        <div class="track-list" role="list">
          ${likedSongs.map((track, idx) => `
            <div class="track-row" data-id="${track.id}" role="listitem">
              <span class="track-index">${idx + 1}</span>
              <img class="track-thumb" src="${track.cover_url || 'assets/images/default-cover.svg'}" alt="${escapeHtml(track.title)}" loading="lazy">
              <div class="track-info">
                <span class="track-title">${escapeHtml(track.title)}</span>
                <span class="track-artist">${escapeHtml(track.artist_name)}</span>
              </div>
              <span class="track-album">${escapeHtml(track.album_title)}</span>
              <span class="track-duration">${formatTime(track.duration_seconds)}</span>
              <div style="display: flex; gap: var(--space-1); align-items: center;">
                <button class="btn btn-icon btn-icon-sm track-play-btn" data-id="${track.id}" aria-label="Play">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                </button>
                <button class="btn btn-icon btn-icon-sm btn-unlike" data-id="${track.id}" title="Remove from liked">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--accent-primary)" stroke="var(--accent-primary)" stroke-width="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    } else if (activeTab === 'artists') {
      if (savedArtists.length === 0) {
        return `
          <div class="state-container">
            <h3 class="state-title">No followed artists</h3>
            <p class="state-description">Follow musicians you discover to stay updated with their new releases.</p>
            <a href="#/discover" class="btn btn-secondary">Discover Artists</a>
          </div>
        `;
      }

      return `
        <div class="card-grid">
          ${savedArtists.map(artist => `
            <article class="artist-card" tabindex="0" role="button" onclick="window.location.hash='#/genres?q=${encodeURIComponent(artist.name)}'">
              <div class="artist-avatar-wrap">
                <img class="artist-avatar" src="${artist.image_url}" alt="${escapeHtml(artist.name)}" loading="lazy">
              </div>
              <h3 class="artist-name">${escapeHtml(artist.name)}</h3>
              <span class="artist-meta">${(artist.monthly_listeners || 0).toLocaleString()} listeners</span>
              <button class="btn btn-secondary btn-icon-sm btn-unfollow" data-id="${artist.id}" style="margin-top: var(--space-2); font-size: 11px; width: auto; padding: 2px 10px;" title="Unfollow">
                Following
              </button>
            </article>
          `).join('')}
        </div>
      `;
    } else if (activeTab === 'recent') {
      if (recentTracks.length === 0) {
        return `
          <div class="state-container">
            <h3 class="state-title">No recent history</h3>
            <p class="state-description">Tracks you play or inspect will be recorded here automatically.</p>
          </div>
        `;
      }

      return `
        <div class="track-list" role="list">
          ${recentTracks.map((track, idx) => `
            <div class="track-row" data-id="${track.id}" role="listitem">
              <span class="track-index">${idx + 1}</span>
              <img class="track-thumb" src="${track.cover_url || 'assets/images/default-cover.svg'}" alt="${escapeHtml(track.title)}" loading="lazy">
              <div class="track-info">
                <span class="track-title">${escapeHtml(track.title)}</span>
                <span class="track-artist">${escapeHtml(track.artist_name)} &bull; <small style="color: var(--text-muted);">${track.listened_at}</small></span>
              </div>
              <span class="track-album">${escapeHtml(track.album_title)}</span>
              <span class="track-duration">${formatTime(track.duration_seconds)}</span>
              <button class="btn btn-icon btn-icon-sm track-play-btn" data-id="${track.id}" aria-label="Play">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
              </button>
            </div>
          `).join('')}
        </div>
      `;
    }
  }

  function attachActionListeners(root) {
    // Unlike button
    root.querySelectorAll('.btn-unlike').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = parseInt(btn.dataset.id, 10);
        try {
          const res = await Api.post('library.php?action=toggle_like', { track_id: id });
          if (res && res.success) {
            Toast.info(res.message || 'Removed from Liked Songs.');
            likedSongs = likedSongs.filter(t => t.id !== id);
            const content = root.querySelector('#library-tab-content');
            if (content) content.innerHTML = renderTabContent(true);
            attachActionListeners(root);
          }
        } catch (err) {
          Toast.error(err.message || 'Could not update liked song.');
        }
      });
    });

    // Unfollow artist button
    root.querySelectorAll('.btn-unfollow').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = parseInt(btn.dataset.id, 10);
        try {
          const res = await Api.post('library.php?action=toggle_artist', { artist_id: id });
          if (res && res.success) {
            Toast.info(res.message || 'Unfollowed artist.');
            savedArtists = savedArtists.filter(a => a.id !== id);
            const content = root.querySelector('#library-tab-content');
            if (content) content.innerHTML = renderTabContent(true);
            attachActionListeners(root);
          }
        } catch (err) {
          Toast.error(err.message || 'Could not unfollow artist.');
        }
      });
    });

    // Play action
    root.querySelectorAll('.track-play-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = parseInt(btn.dataset.id, 10);
        const t = (activeTab === 'liked' ? likedSongs : recentTracks).find(item => item.id === id);
        if (t) {
          Player.playTrack(t);
        }
      });
    });
  }

  function formatTime(seconds) {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  return {
    render
  };
})();

// Global Library Controller interface for player bar and history recording
window.LibraryController = {
  async toggleLike(trackId) {
    if (!Api.isAuthenticated()) {
      Toast.info('Please sign in to save songs to your Library.');
      Modal.open('auth-modal');
      return;
    }
    try {
      const res = await Api.post('library.php?action=toggle_like', { track_id: trackId });
      if (res && res.success) {
        Toast.success(res.message || 'Updated Liked Songs.');
        const heartBtn = document.getElementById('player-like-btn');
        if (heartBtn) {
          heartBtn.classList.toggle('is-liked', res.is_liked);
          const svg = heartBtn.querySelector('svg');
          if (svg) {
            svg.setAttribute('fill', res.is_liked ? 'var(--accent-primary)' : 'none');
          }
        }
      }
    } catch (e) {
      Toast.error(e.message || 'Could not update liked song.');
    }
  },

  async recordRecent(trackId) {
    // Only records if user is logged in (backend handles guest gracefully)
    try {
      await Api.post('library.php?action=record_recent', { track_id: trackId });
    } catch (e) {
      // Non-blocking history record
    }
  }
};
