/**
 * ECHO — My Playlists View (Student 2 Module)
 * Playlist Creation, Display, Rename, Delete, and Track Management
 * Fully integrated with MySQL backend API.
 */
const PlaylistsView = (function () {
  let userPlaylists = [];
  let fetchError = false;

  async function render(container, routeParams = {}) {
    const isAuthed = Api.isAuthenticated();

    if (routeParams.id) {
      await renderPlaylistDetail(container, parseInt(routeParams.id, 10));
      return;
    }

    // Always reset state before loading — prevents stale data after account switch
    userPlaylists = [];
    fetchError = false;

    if (isAuthed) {
      try {
        const res = await Api.get('playlists.php?action=list');
        if (res && res.success && Array.isArray(res.playlists)) {
          userPlaylists = res.playlists;
        } else {
          fetchError = true;
        }
      } catch (err) {
        console.warn('Could not fetch user playlists from backend:', err);
        fetchError = true;
        userPlaylists = []; // ensure array is clean
      }
    }

    container.innerHTML = `
      <div class="view-container">
        <div class="section-header">
          <div>
            <h1 class="section-title">My Playlists</h1>
            <p class="section-subtitle">Organize your discoveries into personalized sets</p>
          </div>
          <button class="btn btn-primary" id="btn-create-playlist">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>New Playlist</span>
          </button>
        </div>

        ${!isAuthed ? `
          <div class="state-container" style="margin-bottom: var(--space-6); background: var(--bg-surface-raised);">
            <svg class="state-icon" style="color: var(--accent-primary);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="8.5" cy="7" r="4"></circle>
              <line x1="20" y1="8" x2="20" y2="14"></line>
              <line x1="23" y1="11" x2="17" y2="11"></line>
            </svg>
            <h3 class="state-title">Sign In to Save Playlists</h3>
            <p class="state-description">Your custom sets and track collections are securely stored in MySQL and tied to your account.</p>
            <button class="btn btn-primary" onclick="Modal.open('auth-modal')">Sign In / Register</button>
          </div>
        ` : ''}

        ${isAuthed && fetchError ? `
          <div class="state-container" style="background: var(--bg-surface-raised); border: 1px solid var(--color-error-subtle, rgba(239,68,68,0.15));">
            <svg class="state-icon" style="color: var(--color-error, #ef4444);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <h3 class="state-title">Could not load playlists</h3>
            <p class="state-description">There was a problem connecting to the server. Please check your connection and try again.</p>
            <button class="btn btn-secondary" onclick="window.location.reload()">Retry</button>
          </div>
        ` : ''}

        ${isAuthed && !fetchError && userPlaylists.length === 0 ? `
          <div class="state-container">
            <svg class="state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <line x1="8" y1="6" x2="21" y2="6"></line>
              <line x1="8" y1="12" x2="21" y2="12"></line>
              <line x1="8" y1="18" x2="21" y2="18"></line>
              <line x1="3" y1="6" x2="3.01" y2="6"></line>
              <line x1="3" y1="12" x2="3.01" y2="12"></line>
              <line x1="3" y1="18" x2="3.01" y2="18"></line>
            </svg>
            <h3 class="state-title">No playlists created yet</h3>
            <p class="state-description">Create your first playlist and start collecting songs from the catalogue.</p>
            <button class="btn btn-primary" id="btn-create-first">Create a Playlist</button>
          </div>
        ` : ''}

        <div class="card-grid" id="playlists-grid">
          ${userPlaylists.map(pl => `
            <article class="music-card" data-playlist-id="${pl.id}" tabindex="0" role="button" aria-label="Open playlist ${escapeHtml(pl.title)}">
              <div class="music-card-image-wrap">
                <img class="music-card-image" src="${pl.cover_url || 'assets/images/default-cover.svg'}" alt="${escapeHtml(pl.title)}" loading="lazy">
                <button class="btn btn-primary btn-icon card-play-overlay" aria-label="Play playlist">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                </button>
              </div>
              <h3 class="music-card-title">${escapeHtml(pl.title)}</h3>
              <p class="music-card-subtitle">${pl.track_count || 0} tracks &bull; Playlist</p>
            </article>
          `).join('')}
        </div>
      </div>
    `;

    // Creation triggers
    const createBtn = container.querySelector('#btn-create-playlist');
    const createFirst = container.querySelector('#btn-create-first');
    const openCreate = () => {
      if (!Api.isAuthenticated()) {
        Toast.info('Please sign in to create a new playlist.');
        Modal.open('auth-modal');
      } else {
        Modal.open('playlist-modal');
      }
    };

    if (createBtn) createBtn.addEventListener('click', openCreate);
    if (createFirst) createFirst.addEventListener('click', openCreate);

    // Open detail
    container.querySelectorAll('[data-playlist-id]').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.playlistId;
        window.location.hash = `#/playlists?id=${id}`;
      });
    });

    // Wire global playlist creation form submission
    setupPlaylistForm();
  }

  function setupPlaylistForm() {
    const form = document.getElementById('playlist-form');
    if (!form || form.dataset.bound === 'true') return;
    form.dataset.bound = 'true';

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const titleInput = form.querySelector('#playlist-title-input');
      const descInput = form.querySelector('#playlist-desc-input');

      try {
        const res = await Api.post('playlists.php?action=create', {
          title: titleInput.value.trim(),
          description: descInput.value.trim()
        });

        if (res && res.success) {
          Toast.success(res.message || 'Playlist created!');
          Modal.close('playlist-modal');
          form.reset();
          if (res.playlist_id) {
            window.location.hash = `#/playlists?id=${res.playlist_id}`;
          } else {
            render(document.getElementById('view-container'));
          }
        }
      } catch (err) {
        Toast.error(err.message || 'Could not create playlist.');
      }
    });
  }

  async function renderPlaylistDetail(container, playlistId) {
    let pl = null;

    try {
      const res = await Api.get('playlists.php?action=get', { id: playlistId });
      if (res && res.success && res.playlist) {
        pl = res.playlist;
      }
    } catch (e) {
      console.warn('Could not load playlist detail:', e);
    }

    if (!pl) {
      container.innerHTML = `
        <div class="view-container">
          <div class="state-container">
            <h3 class="state-title">Playlist not found</h3>
            <p class="state-description">This playlist may have been deleted or is private.</p>
            <a href="#/playlists" class="btn btn-secondary">Back to My Playlists</a>
          </div>
        </div>
      `;
      return;
    }

    const tracks = Array.isArray(pl.tracks) ? pl.tracks : [];

    container.innerHTML = `
      <div class="view-container">
        <a href="#/playlists" class="btn btn-ghost" style="margin-bottom: var(--space-4); display: inline-flex;">
          &larr; Back to all playlists
        </a>

        <div class="playlist-header-banner">
          <img class="playlist-cover-large" src="${pl.cover_url || 'assets/images/default-cover.svg'}" alt="${escapeHtml(pl.title)}">
          <div class="playlist-details">
            <span class="playlist-type">Curated Playlist</span>
            <h1 class="playlist-title-display">${escapeHtml(pl.title)}</h1>
            <p style="color: var(--text-secondary); max-width: 500px;">${escapeHtml(pl.description || 'No description provided.')}</p>
            <div class="playlist-meta-info">
              <span>Created by <strong>${escapeHtml(pl.owner_name || 'You')}</strong></span> &bull; 
              <span>${tracks.length} songs</span> &bull; 
              <span>~${Math.round((pl.total_duration_seconds || 0) / 60)} minutes</span>
            </div>
            <div class="playlist-actions-row">
              <button class="btn btn-primary" id="btn-play-all">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
                <span>Play All</span>
              </button>
              ${pl.is_owner ? `
                <button class="btn btn-secondary btn-icon" id="btn-rename-playlist" title="Rename Playlist">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                  </svg>
                </button>
                <button class="btn btn-danger btn-icon" id="btn-delete-playlist" title="Delete Playlist">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              ` : ''}
            </div>
          </div>
        </div>

        <div class="track-list-section">
          <div class="section-header">
            <h2 class="section-title" style="font-size: var(--text-xl);">Playlist Tracks</h2>
            <button class="btn btn-secondary btn-icon-sm" id="btn-quick-add" style="width: auto; padding: 4px 12px; font-size: var(--text-xs);" title="Add Track">
              + Add Song
            </button>
          </div>

          ${tracks.length === 0 ? `
            <div class="state-container" style="padding: var(--space-8);">
              <p class="state-description">This playlist has no songs yet. Use "+ Add Song" or browse the catalogue to add tracks.</p>
            </div>
          ` : `
            <div class="track-list" id="playlist-tracks">
              ${tracks.map((track, idx) => `
                <div class="track-row" data-id="${track.id}">
                  <span class="track-index">${idx + 1}</span>
                  <img class="track-thumb" src="${track.cover_url || 'assets/images/default-cover.svg'}" alt="${escapeHtml(track.title)}">
                  <div class="track-info">
                    <span class="track-title">${escapeHtml(track.title)}</span>
                    <span class="track-artist">${escapeHtml(track.artist_name)}</span>
                  </div>
                  <span class="track-album">${escapeHtml(track.album_title)}</span>
                  <span class="track-duration">${formatTime(track.duration_seconds)}</span>
                  <div style="display: flex; gap: var(--space-1);">
                    <button class="btn btn-icon btn-icon-sm track-play-btn" data-id="${track.id}" aria-label="Play">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                      </svg>
                    </button>
                    ${pl.is_owner ? `
                      <button class="btn btn-icon btn-icon-sm track-remove-btn" data-id="${track.id}" title="Remove track">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                    ` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>
      </div>
    `;

    // Play all
    const playAllBtn = container.querySelector('#btn-play-all');
    if (playAllBtn && tracks.length > 0) {
      playAllBtn.addEventListener('click', () => {
        Player.setQueue(tracks, 0);
      });
    }

    // Play individual track
    container.querySelectorAll('.track-play-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = parseInt(btn.dataset.id, 10);
        const t = tracks.find(item => item.id === id);
        if (t) {
          Player.playTrack(t, tracks);
        }
      });
    });

    // Remove track
    container.querySelectorAll('.track-remove-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const trackId = parseInt(btn.dataset.id, 10);
        try {
          const res = await Api.post('playlists.php?action=remove_track', {
            playlist_id: playlistId,
            track_id: trackId
          });
          if (res && res.success) {
            Toast.info(res.message || 'Track removed.');
            renderPlaylistDetail(container, playlistId);
          }
        } catch (err) {
          Toast.error(err.message || 'Could not remove track.');
        }
      });
    });

    // Rename playlist
    const renameBtn = container.querySelector('#btn-rename-playlist');
    if (renameBtn) {
      renameBtn.addEventListener('click', async () => {
        const newTitle = prompt('Enter new playlist name:', pl.title);
        if (newTitle && newTitle.trim() !== '' && newTitle !== pl.title) {
          try {
            const res = await Api.post('playlists.php?action=update', {
              id: playlistId,
              title: newTitle.trim(),
              description: pl.description || ''
            });
            if (res && res.success) {
              Toast.success('Playlist renamed.');
              renderPlaylistDetail(container, playlistId);
            }
          } catch (err) {
            Toast.error(err.message || 'Could not rename playlist.');
          }
        }
      });
    }

    // Delete playlist
    const deleteBtn = container.querySelector('#btn-delete-playlist');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', async () => {
        if (confirm(`Are you sure you want to delete "${pl.title}"? Note: Catalogue songs will not be deleted.`)) {
          try {
            const res = await Api.post('playlists.php?action=delete', { id: playlistId });
            if (res && res.success) {
              Toast.success(res.message || 'Playlist deleted.');
              window.location.hash = '#/playlists';
            }
          } catch (err) {
            Toast.error(err.message || 'Could not delete playlist.');
          }
        }
      });
    }

    // Quick add song — open searchable modal instead of prompt()
    const quickAddBtn = container.querySelector('#btn-quick-add');
    if (quickAddBtn && pl.is_owner) {
      quickAddBtn.addEventListener('click', () => {
        openAddTrackModal(playlistId, tracks, (addedTrack) => {
          renderPlaylistDetail(container, playlistId);
        });
      });
    }

    // Drag-and-drop track reordering
    if (pl.is_owner) {
      setupDragAndDrop(container, playlistId);
    }
  }

  /**
   * Open the searchable "Add Song" modal.
   * @param {number} playlistId  - ID of the target playlist
   * @param {Array}  currentTracks - tracks already in the playlist (to exclude)
   * @param {Function} onAdd    - callback after a track is successfully added
   */
  function openAddTrackModal(playlistId, currentTracks, onAdd) {
    const modal = document.getElementById('add-track-modal');
    const searchInput = document.getElementById('add-track-search-input');
    const resultsEl = document.getElementById('add-track-results');
    if (!modal || !searchInput || !resultsEl) {
      Toast.error('Add-song modal not found. Please reload the page.');
      return;
    }

    // Reset modal state
    searchInput.value = '';
    resultsEl.innerHTML = `<p style="color:var(--text-muted);font-size:var(--text-sm);text-align:center;padding:var(--space-6) 0;">Start typing to search songs…</p>`;
    Modal.open('add-track-modal');
    searchInput.focus();

    let debounceTimer = null;

    function renderResults(tracks) {
      if (!tracks || tracks.length === 0) {
        resultsEl.innerHTML = `<p style="color:var(--text-muted);font-size:var(--text-sm);text-align:center;padding:var(--space-6) 0;">No songs found matching your search.</p>`;
        return;
      }

      const excluded = new Set(currentTracks.map(t => t.id));
      const available = tracks.filter(t => !excluded.has(t.id));

      if (available.length === 0) {
        resultsEl.innerHTML = `<p style="color:var(--text-muted);font-size:var(--text-sm);text-align:center;padding:var(--space-6) 0;">All matching songs are already in this playlist.</p>`;
        return;
      }

      resultsEl.innerHTML = available.map(t => `
        <button
          class="add-track-result-row"
          data-track-id="${t.id}"
          role="option"
          aria-label="Add ${escapeHtml(t.title)} by ${escapeHtml(t.artist_name)}"
          style="display:flex;align-items:center;gap:var(--space-3);padding:var(--space-3);border-radius:var(--radius-sm);width:100%;text-align:left;background:transparent;border:none;color:var(--text-primary);cursor:pointer;transition:background var(--transition-fast);"
        >
          <img
            src="${t.cover_url || 'assets/images/default-cover.svg'}"
            alt=""
            style="width:40px;height:40px;object-fit:cover;border-radius:var(--radius-xs);flex-shrink:0;"
            loading="lazy"
          >
          <div style="flex:1;min-width:0;">
            <div style="font-weight:600;font-size:var(--text-sm);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(t.title)}</div>
            <div style="color:var(--text-secondary);font-size:var(--text-xs);">${escapeHtml(t.artist_name)} · ${escapeHtml(t.album_title)}</div>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" stroke-width="2" style="flex-shrink:0;" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
      `).join('');

      // Wire click handlers
      resultsEl.querySelectorAll('.add-track-result-row').forEach(btn => {
        btn.addEventListener('mouseenter', () => { btn.style.background = 'var(--bg-surface-hover)'; });
        btn.addEventListener('mouseleave', () => { btn.style.background = 'transparent'; });
        btn.addEventListener('click', async () => {
          const trackId = parseInt(btn.dataset.trackId, 10);
          btn.disabled = true;
          btn.style.opacity = '0.5';
          try {
            const res = await Api.post('playlists.php?action=add_track', {
              playlist_id: playlistId,
              track_id: trackId
            });
            if (res && res.success) {
              Toast.success(res.message || 'Track added!');
              Modal.close('add-track-modal');
              if (typeof onAdd === 'function') onAdd(trackId);
            } else {
              btn.disabled = false;
              btn.style.opacity = '';
              Toast.error(res.error || 'Could not add track.');
            }
          } catch (err) {
            btn.disabled = false;
            btn.style.opacity = '';
            Toast.error(err.message || 'Failed to add song.');
          }
        });
      });
    }

    async function doSearch(query) {
      if (query.length === 0) {
        // Show all available catalogue tracks
        try {
          const res = await Api.get('catalogue.php?action=tracks');
          if (res && res.success) renderResults(res.tracks);
        } catch (e) {
          resultsEl.innerHTML = `<p style="color:var(--text-muted);font-size:var(--text-sm);text-align:center;padding:var(--space-6) 0;">Start typing to search songs…</p>`;
        }
        return;
      }
      resultsEl.innerHTML = `<p style="color:var(--text-muted);font-size:var(--text-sm);text-align:center;padding:var(--space-4) 0;">Searching…</p>`;
      try {
        const res = await Api.get(`catalogue.php?action=tracks&q=${encodeURIComponent(query)}`);
        if (res && res.success) renderResults(res.tracks);
      } catch (e) {
        resultsEl.innerHTML = `<p style="color:var(--text-muted);font-size:var(--text-sm);text-align:center;padding:var(--space-6) 0;">Could not search catalogue.</p>`;
      }
    }

    // Debounce search input
    function onInput() {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => doSearch(searchInput.value.trim()), 280);
    }

    // Clean up old listener on each open, then re-attach
    const newInput = searchInput.cloneNode(true);
    searchInput.parentNode.replaceChild(newInput, searchInput);
    newInput.addEventListener('input', onInput);
    newInput.focus();

    // Pre-load all songs when modal opens so the list is ready
    doSearch('');
  }

  /**
   * Set up HTML5 native drag-and-drop for track reordering.
   */
  function setupDragAndDrop(container, playlistId) {
    const trackList = container.querySelector('#playlist-tracks');
    if (!trackList) return;

    let dragSrc = null;

    trackList.querySelectorAll('.track-row').forEach(row => {
      row.setAttribute('draggable', 'true');
      row.style.cursor = 'grab';

      row.addEventListener('dragstart', (e) => {
        dragSrc = row;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', row.dataset.id);
        row.classList.add('dragging');
      });

      row.addEventListener('dragend', () => {
        row.classList.remove('dragging');
        trackList.querySelectorAll('.track-row').forEach(r => r.classList.remove('drag-over'));
      });

      row.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (row !== dragSrc) {
          trackList.querySelectorAll('.track-row').forEach(r => r.classList.remove('drag-over'));
          row.classList.add('drag-over');
        }
      });

      row.addEventListener('drop', async (e) => {
        e.preventDefault();
        if (!dragSrc || dragSrc === row) return;

        // Compute new order from current DOM state
        const rows = [...trackList.querySelectorAll('.track-row')];
        const fromIdx = rows.indexOf(dragSrc);
        const toIdx = rows.indexOf(row);

        // Move node in DOM for instant visual feedback
        if (fromIdx < toIdx) {
          trackList.insertBefore(dragSrc, row.nextSibling);
        } else {
          trackList.insertBefore(dragSrc, row);
        }

        // Update position numbers
        trackList.querySelectorAll('.track-row').forEach((r, i) => {
          const idx = r.querySelector('.track-index');
          if (idx) idx.textContent = i + 1;
          r.classList.remove('drag-over');
        });

        // Persist new order via API
        const orderedIds = [...trackList.querySelectorAll('.track-row')].map(r => parseInt(r.dataset.id, 10));
        try {
          const res = await Api.post('playlists.php?action=reorder', {
            playlist_id: playlistId,
            track_ids: orderedIds
          });
          if (!res || !res.success) {
            Toast.error('Could not save track order.');
          }
        } catch (err) {
          Toast.error('Failed to save order: ' + (err.message || ''));
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
