/**
 * ECHO — Explore Genres & Search View (Student 1 Module)
 * Dynamic genre pills, multi-entity search, sorting, and track list
 * Connected to MySQL Catalogue API.
 */
const GenresView = (function () {
  let selectedGenre = 'all';
  let searchQuery = '';
  let currentSort = 'popular';
  let activeTab = 'all'; // 'all', 'artists', 'albums'

  let loadedGenres = [];
  let loadedTracks = [];
  let searchResults = null;

  async function render(container, routeParams = {}) {
    if (routeParams.q !== undefined) {
      searchQuery = routeParams.q;
    }
    if (routeParams.genre !== undefined) {
      selectedGenre = routeParams.genre;
    }

    // 1. Fetch dynamic genres from API
    try {
      const gRes = await Api.get('catalogue.php?action=genres');
      if (gRes && gRes.success && Array.isArray(gRes.genres)) {
        loadedGenres = [{ id: 0, name: 'All Genres', slug: 'all' }, ...gRes.genres];
      }
    } catch (e) {
      // Fallback
      loadedGenres = [
        { id: 0, name: 'All Genres', slug: 'all' },
        { id: 1, name: 'Synthwave', slug: 'synthwave' },
        { id: 2, name: 'Lo-Fi Chill', slug: 'lo-fi' },
        { id: 3, name: 'Electronic', slug: 'electronic' },
        { id: 4, name: 'Indie Rock', slug: 'indie-rock' },
        { id: 5, name: 'Jazz & Soul', slug: 'jazz' },
        { id: 6, name: 'Classical & Ambient', slug: 'classical' }
      ];
    }

    container.innerHTML = `
      <div class="view-container">
        <!-- Section Header -->
        <div class="section-header">
          <div>
            <h1 class="section-title">Explore Genres & Catalogue</h1>
            <p class="section-subtitle">Browse through acoustic textures, synth atmospheres, and indie discoveries</p>
          </div>
        </div>

        <!-- Genre Pill Filter Row -->
        <div class="genres-pill-row" role="tablist" aria-label="Genre Filters">
          ${loadedGenres.map(g => `
            <button class="genre-pill ${selectedGenre.toLowerCase() === g.slug.toLowerCase() ? 'active' : ''}" 
                    data-slug="${g.slug}" 
                    role="tab" 
                    aria-selected="${selectedGenre.toLowerCase() === g.slug.toLowerCase()}">
              ${escapeHtml(g.name)}
            </button>
          `).join('')}
        </div>

        <!-- Filter & Search Controls Bar -->
        <div class="search-filter-bar">
          <div class="filter-group">
            <label for="sort-select" class="form-label" style="margin: 0;">Sort By</label>
            <select id="sort-select" class="filter-select">
              <option value="popular" ${currentSort === 'popular' ? 'selected' : ''}>Most Popular</option>
              <option value="title" ${currentSort === 'title' ? 'selected' : ''}>Track Title (A-Z)</option>
              <option value="newest" ${currentSort === 'newest' ? 'selected' : ''}>Newest First</option>
            </select>
          </div>

          <div class="results-meta" id="results-count-text">
            Filtering catalogue...
          </div>
        </div>

        <!-- Multi-Entity Search Section (Visible when searching) -->
        <div id="search-entities-container" style="display: none; margin-bottom: var(--space-6);"></div>

        <!-- Track List Container -->
        <div id="genres-tracks-container" aria-live="polite">
          <div style="padding: var(--space-8); text-align: center; color: var(--text-muted);">
            Loading tracks from catalogue...
          </div>
        </div>
      </div>
    `;

    // Pill click listeners
    const pillButtons = container.querySelectorAll('.genre-pill');
    pillButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        pillButtons.forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        selectedGenre = btn.dataset.slug;
        fetchAndRenderTracks(container);
      });
    });

    // Sort select listener
    const sortSelect = container.querySelector('#sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        fetchAndRenderTracks(container);
      });
    }

    // Initial track fetch
    await fetchAndRenderTracks(container);
  }

  async function fetchAndRenderTracks(container) {
    const listWrapper = container.querySelector('#genres-tracks-container');
    const countMeta = container.querySelector('#results-count-text');
    const entitiesWrapper = container.querySelector('#search-entities-container');
    if (!listWrapper) return;

    listWrapper.innerHTML = `
      <div style="padding: var(--space-8); text-align: center; color: var(--text-muted);">
        Loading tracks...
      </div>
    `;

    // Check if we should perform multi-entity search
    if (searchQuery && searchQuery.trim() !== '') {
      try {
        const sRes = await Api.get('catalogue.php?action=search', { q: searchQuery });
        if (sRes && sRes.success && entitiesWrapper) {
          renderSearchEntities(entitiesWrapper, sRes);
        }
      } catch (e) {
        if (entitiesWrapper) entitiesWrapper.style.display = 'none';
      }
    } else if (entitiesWrapper) {
      entitiesWrapper.style.display = 'none';
    }

    // Fetch tracks
    try {
      const res = await Api.get('catalogue.php?action=tracks', {
        genre: selectedGenre,
        q: searchQuery,
        sort: currentSort
      });

      if (res && res.success && Array.isArray(res.tracks)) {
        loadedTracks = res.tracks;
      } else {
        loadedTracks = [];
      }
    } catch (err) {
      console.warn('API error fetching tracks, using local filter fallback:', err);
      // Fallback in case of server offline
      loadedTracks = [];
    }

    if (countMeta) {
      countMeta.textContent = `Showing ${loadedTracks.length} track${loadedTracks.length === 1 ? '' : 's'}${searchQuery ? ` matching "${searchQuery}"` : ''}`;
    }

    if (loadedTracks.length === 0) {
      listWrapper.innerHTML = `
        <div class="state-container">
          <svg class="state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <h3 class="state-title">No matching tracks found</h3>
          <p class="state-description">Try adjusting your search query or reset your filters to explore more music.</p>
          <button class="btn btn-secondary" id="clear-filters-btn">Clear All Filters</button>
        </div>
      `;

      const clearBtn = listWrapper.querySelector('#clear-filters-btn');
      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          selectedGenre = 'all';
          searchQuery = '';
          const globalInput = document.getElementById('global-search-input');
          if (globalInput) globalInput.value = '';
          const pills = container.querySelectorAll('.genre-pill');
          pills.forEach(p => p.classList.toggle('active', p.dataset.slug === 'all'));
          fetchAndRenderTracks(container);
        });
      }
      return;
    }

    listWrapper.innerHTML = `
      <div class="track-list" role="list">
        ${loadedTracks.map((track, idx) => `
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
              <button class="btn btn-icon btn-icon-sm track-play-action" data-id="${track.id}" aria-label="Play ${escapeHtml(track.title)}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
              </button>
              <button class="btn btn-icon btn-icon-sm track-info-action" data-id="${track.id}" title="Credits & Details">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    // Play action
    listWrapper.querySelectorAll('.track-play-action').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = parseInt(btn.dataset.id, 10);
        const track = loadedTracks.find(t => t.id === id);
        if (track) {
          Player.playTrack(track, loadedTracks);
        }
      });
    });

    // Row click
    listWrapper.querySelectorAll('.track-row').forEach(row => {
      row.addEventListener('click', () => {
        const id = parseInt(row.dataset.id, 10);
        const track = loadedTracks.find(t => t.id === id);
        if (track) {
          Player.playTrack(track, loadedTracks);
        }
      });
    });

    // Info action: Open track details modal
    listWrapper.querySelectorAll('.track-info-action').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = parseInt(btn.dataset.id, 10);
        openTrackDetails(id);
      });
    });
  }

  function renderSearchEntities(wrapper, data) {
    const hasArtists = Array.isArray(data.artists) && data.artists.length > 0;
    const hasAlbums = Array.isArray(data.albums) && data.albums.length > 0;

    if (!hasArtists && !hasAlbums) {
      wrapper.style.display = 'none';
      return;
    }

    wrapper.style.display = 'block';
    wrapper.innerHTML = `
      <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: var(--space-4);">
        <h3 style="font-size: var(--text-sm); font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--accent-primary); margin-bottom: var(--space-3);">
          Matching Artists & Albums
        </h3>
        <div style="display: flex; gap: var(--space-4); flex-wrap: wrap;">
          ${hasArtists ? data.artists.map(ar => `
            <div style="display: flex; align-items: center; gap: var(--space-2); background: var(--bg-surface-raised); padding: 6px 14px; border-radius: var(--radius-full); cursor: pointer; transition: background var(--transition-fast);" 
                 class="search-entity-chip search-artist-chip" data-id="${ar.id}" role="button" tabindex="0" title="View artist profile">
              <img src="${ar.image_url}" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover;" alt="${escapeHtml(ar.name)}">
              <span style="font-size: var(--text-xs); font-weight: 600;">${escapeHtml(ar.name)} <span style="color: var(--accent-primary);">&bull; Artist</span></span>
            </div>
          `).join('') : ''}
          ${hasAlbums ? data.albums.map(al => `
            <div style="display: flex; align-items: center; gap: var(--space-2); background: var(--bg-surface-raised); padding: 6px 14px; border-radius: var(--radius-full); cursor: pointer; transition: background var(--transition-fast);"
                 class="search-entity-chip search-album-chip" data-id="${al.id}" role="button" tabindex="0" title="View album details">
              <img src="${al.cover_url}" style="width: 24px; height: 24px; border-radius: 4px; object-fit: cover;" alt="${escapeHtml(al.title)}">
              <span style="font-size: var(--text-xs); font-weight: 600;">${escapeHtml(al.title)} <span style="color: var(--accent-primary);">&bull; Album</span></span>
            </div>
          `).join('') : ''}
        </div>
      </div>
    `;

    wrapper.querySelectorAll('.search-artist-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const id = parseInt(chip.dataset.id, 10);
        if (typeof DiscoverView !== 'undefined' && DiscoverView.openArtistDetail) {
          DiscoverView.openArtistDetail(id);
        }
      });
    });

    wrapper.querySelectorAll('.search-album-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const id = parseInt(chip.dataset.id, 10);
        if (typeof DiscoverView !== 'undefined' && DiscoverView.openAlbumDetail) {
          DiscoverView.openAlbumDetail(id);
        }
      });
    });
  }

  async function openTrackDetails(trackId) {
    try {
      const res = await Api.get('catalogue.php?action=track_detail', { id: trackId });
      if (res && res.success && res.track) {
        const t = res.track;
        const dialog = document.getElementById('track-modal');
        if (!dialog) return;

        dialog.innerHTML = `
          <div class="modal-header">
            <h2 class="modal-title" id="track-modal-title">Track Details & Credits</h2>
            <button class="btn btn-icon btn-icon-sm" onclick="Modal.close('track-modal')" aria-label="Close modal">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div class="modal-body" style="display: flex; gap: var(--space-4); align-items: flex-start;">
            <img src="${t.cover_url}" style="width: 140px; height: 140px; border-radius: var(--radius-md); object-fit: cover; box-shadow: var(--shadow-md);" alt="${escapeHtml(t.title)}">
            <div style="display: flex; flex-direction: column; gap: var(--space-1); flex: 1;">
              <span class="badge badge-preview" style="align-self: flex-start;">30s Audio Preview</span>
              <h3 style="font-size: var(--text-xl); font-weight: 700; margin-top: 4px;">${escapeHtml(t.title)}</h3>
              <p style="font-size: var(--text-sm); color: var(--text-primary); font-weight: 500;">
                By ${t.artists ? t.artists.map(a => escapeHtml(a.name) + (a.role === 'featured' ? ' (ft.)' : '')).join(', ') : escapeHtml(t.primary_artist_name)}
              </p>
              <p style="font-size: var(--text-xs); color: var(--text-muted);">
                Album: <strong>${escapeHtml(t.album_title)}</strong> &bull; Released: ${t.release_date}
              </p>
              <div style="display: flex; gap: var(--space-1); margin-top: var(--space-2); flex-wrap: wrap;">
                ${t.genres ? t.genres.map(g => `<span class="badge" style="background: var(--bg-surface-raised); border: 1px solid var(--border-strong);">${escapeHtml(g.name)}</span>`).join('') : ''}
              </div>
            </div>
          </div>
          <div class="modal-footer" style="justify-content: space-between;">
            <span style="font-size: var(--text-xs); color: var(--text-muted);">${(t.plays_count || 0).toLocaleString()} total streams</span>
            <div style="display: flex; gap: var(--space-2);">
              <button class="btn btn-primary" id="modal-play-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
                <span>Play Now</span>
              </button>
            </div>
          </div>
        `;

        const playBtn = dialog.querySelector('#modal-play-btn');
        if (playBtn) {
          playBtn.addEventListener('click', () => {
            Player.playTrack(t);
            Modal.close('track-modal');
          });
        }

        Modal.open('track-modal');
      }
    } catch (e) {
      Toast.error('Could not load track details.');
    }
  }

  function setSearch(query) {
    searchQuery = query;
    const container = document.getElementById('view-container');
    if (container && window.location.hash.startsWith('#/genres')) {
      fetchAndRenderTracks(container);
    }
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
    render,
    setSearch,
    openTrackDetails
  };
})();
