/**
 * ECHO — Discover View (Student 1 Module)
 * Editorial Hero, Personalised Recommendations, Featured Artists & New Releases.
 * Connected to MySQL Catalogue API with graceful offline fallback.
 */
const DiscoverView = (function () {
  // Graceful fallback demo data in case MySQL server is not yet running
  const fallbackHero = {
    id: 1,
    title: 'Neon Odyssey',
    artist_name: 'Astral Wave ft. Komorebi Sound',
    album_title: 'Midnight Reflections',
    genre_name: 'Synthwave',
    genre_slug: 'synthwave',
    release_date: '2026-04-12',
    cover_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
    description: 'An ethereal journey through analog synthesizers, punchy 80s drums, and haunting vocal textures. The definitive late-night soundscape.',
    preview_url: 'assets/audio/preview-synthwave.wav'
  };

  const fallbackPicks = [
    { id: 1, title: 'Neon Odyssey', artist_name: 'Astral Wave', album_title: 'Midnight Reflections', duration_seconds: 194, plays_count: 8940, cover_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80', preview_url: 'assets/audio/preview-synthwave.wav' },
    { id: 4, title: 'Velvet Horizon', artist_name: 'Komorebi Sound', album_title: 'Chasing Twilight', duration_seconds: 148, plays_count: 9450, cover_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80', preview_url: 'assets/audio/preview-lofi.wav' },
    { id: 7, title: 'Solar Flare', artist_name: 'Hyperion Drive', album_title: 'Quantum Drift', duration_seconds: 215, plays_count: 7840, cover_url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=400&q=80', preview_url: 'assets/audio/preview-synthwave.wav' },
    { id: 11, title: 'After Midnight Sax', artist_name: 'Miles & Blue Notes', album_title: 'Harlem Rain', duration_seconds: 232, plays_count: 8920, cover_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=400&q=80', preview_url: 'assets/audio/preview-ambient.wav' },
    { id: 9, title: 'Subtle Whispers', artist_name: 'Elena Rostova', album_title: 'Solitude in Paris', duration_seconds: 184, plays_count: 5940, cover_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80', preview_url: 'assets/audio/preview-ambient.wav' },
    { id: 13, title: 'Echoes of the Coast', artist_name: 'Pacific Pines', album_title: 'Northern Fog', duration_seconds: 176, plays_count: 6350, cover_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=400&q=80', preview_url: 'assets/audio/preview-lofi.wav' }
  ];

  const fallbackArtists = [
    { id: 1, name: 'Astral Wave', bio: 'Synthwave pioneer duo', image_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80', monthly_listeners: 142500 },
    { id: 2, name: 'Komorebi Sound', bio: 'Vinyl lo-fi beats', image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80', monthly_listeners: 98300 },
    { id: 3, name: 'Hyperion Drive', bio: 'Modular cyber electronics', image_url: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=300&q=80', monthly_listeners: 76200 },
    { id: 4, name: 'Elena Rostova', bio: 'Neo-classical grand piano', image_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80', monthly_listeners: 65400 },
    { id: 5, name: 'Miles & Blue Notes', bio: 'Harlem late night jazz', image_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80', monthly_listeners: 112000 },
    { id: 6, name: 'Pacific Pines', bio: 'Coastal indie guitar rock', image_url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=300&q=80', monthly_listeners: 84300 }
  ];

  async function render(container) {
    let hero = fallbackHero;
    let picks = fallbackPicks;
    let artists = fallbackArtists;
    let newReleases = [];
    let recommendations = null; // null = unavailable / not loaded

    // Fetch core discover data
    try {
      const res = await Api.get('catalogue.php?action=discover');
      if (res && res.success) {
        if (res.hero) hero = res.hero;
        if (Array.isArray(res.picks) && res.picks.length > 0) picks = res.picks;
        if (Array.isArray(res.artists) && res.artists.length > 0) artists = res.artists;
        if (Array.isArray(res.new_releases)) newReleases = res.new_releases;
      }
    } catch (err) {
      console.log('Catalogue API offline, utilizing rich client fallback dataset.');
    }

    // Fetch personalised recommendations (best-effort)
    try {
      const recRes = await Api.get('catalogue.php?action=recommendations');
      if (recRes && recRes.success && Array.isArray(recRes.tracks) && recRes.tracks.length > 0) {
        recommendations = recRes;
      }
    } catch (e) {
      // Not critical — silently ignore
    }

    const isAuthed = Api.isAuthenticated();
    const picksLabel = (recommendations && recommendations.personalised)
      ? 'Recommended For You'
      : 'ECHO Picks';
    const picksSubtitle = (recommendations && recommendations.personalised)
      ? 'Based on your liked tracks and genre preferences'
      : 'Curated highlights backed by genuine listener streams';
    const displayedPicks = (recommendations && recommendations.tracks.length > 0)
      ? recommendations.tracks
      : picks;

    container.innerHTML = `
      <div class="view-container">
        <!-- 1. Editorial Hero Section -->
        <section class="discover-hero" aria-labelledby="hero-title">
          <div class="hero-content">
            <span class="hero-tag badge badge-editorial">Featured Release</span>
            <h1 id="hero-title" class="hero-title">${escapeHtml(hero.title)}</h1>
            <p class="hero-description">${escapeHtml(hero.description || 'Ethereal soundscapes and atmospheric textures.')}</p>
            <div class="hero-actions">
              <button class="btn btn-primary hero-play-btn" id="hero-play-action">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
                <span>Listen Preview</span>
              </button>
              <button class="btn btn-secondary" onclick="window.location.hash='#/genres?genre=${encodeURIComponent(hero.genre_slug || 'synthwave')}'">
                Explore ${escapeHtml(hero.genre_name || 'Synthwave')}
              </button>
            </div>
          </div>
          <div class="hero-artwork-wrap">
            <img class="hero-artwork" src="${hero.cover_url || 'assets/images/default-cover.svg'}" alt="${escapeHtml(hero.title)} cover" loading="eager">
          </div>
        </section>

        <!-- 2. Picks / Recommendations Section -->
        <section class="view-section" aria-labelledby="picks-heading">
          <div class="section-header">
            <div>
              <h2 id="picks-heading" class="section-title">${picksLabel}</h2>
              <p class="section-subtitle">${picksSubtitle}</p>
            </div>
            <a href="#/genres" class="section-action">Explore all tracks &rarr;</a>
          </div>
          <div class="card-grid" id="picks-grid">
            ${displayedPicks.map(track => renderTrackCard(track)).join('')}
          </div>
        </section>

        <!-- 3. Featured Artists -->
        <section class="view-section" aria-labelledby="artists-heading">
          <div class="section-header">
            <div>
              <h2 id="artists-heading" class="section-title">Featured Artists</h2>
              <p class="section-subtitle">Pioneering creators shaping modern soundscapes</p>
            </div>
          </div>
          <div class="artists-scroll-row" id="artists-row">
            ${artists.map(artist => renderArtistCard(artist)).join('')}
          </div>
        </section>

        <!-- 4. Fresh Album Releases -->
        ${newReleases.length > 0 ? `
          <section class="view-section" aria-labelledby="releases-heading">
            <div class="section-header">
              <div>
                <h2 id="releases-heading" class="section-title">New Releases</h2>
                <p class="section-subtitle">Latest long-plays and singles added to the catalogue</p>
              </div>
            </div>
            <div class="card-grid">
              ${newReleases.map(rel => `
                <article class="music-card" tabindex="0" role="button" data-album-id="${rel.id}" aria-label="View album ${escapeHtml(rel.title)}">
                  <div class="music-card-image-wrap">
                    <img class="music-card-image" src="${rel.cover_url}" alt="${escapeHtml(rel.title)}" loading="lazy">
                    <button class="btn btn-primary btn-icon card-play-overlay" data-album-id="${rel.id}" aria-label="View ${escapeHtml(rel.title)}">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                    </button>
                  </div>
                  <h3 class="music-card-title">${escapeHtml(rel.title)}</h3>
                  <p class="music-card-subtitle">${escapeHtml(rel.artist_name)} &bull; ${rel.release_date.substring(0, 4)}</p>
                </article>
              `).join('')}
            </div>
          </section>
        ` : ''}
      </div>
    `;

    // Hero play
    container.querySelector('#hero-play-action')?.addEventListener('click', () => {
      Player.playTrack(hero, [hero, ...displayedPicks]);
    });

    // Track card play buttons
    container.querySelectorAll('.card-play-btn[data-id]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = parseInt(btn.dataset.id, 10);
        const t = displayedPicks.find(p => p.id === id);
        if (t) Player.playTrack(t, displayedPicks);
      });
    });

    container.querySelectorAll('.music-card[data-track-id]').forEach(card => {
      card.addEventListener('click', () => {
        const id = parseInt(card.dataset.trackId, 10);
        const t = displayedPicks.find(p => p.id === id);
        if (t) Player.playTrack(t, displayedPicks);
      });
    });

    // Artist card — open detail modal
    container.querySelectorAll('.artist-card[data-artist-id]').forEach(card => {
      card.addEventListener('click', () => openArtistDetail(parseInt(card.dataset.artistId, 10)));
    });

    // Album cards — open detail modal
    container.querySelectorAll('.music-card[data-album-id]').forEach(card => {
      card.addEventListener('click', () => openAlbumDetail(parseInt(card.dataset.albumId, 10)));
    });
    container.querySelectorAll('[data-album-id]').forEach(btn => {
      if (btn.tagName === 'BUTTON') {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          openAlbumDetail(parseInt(btn.dataset.albumId, 10));
        });
      }
    });
  }

  // ----------------------------------------------------------------
  // Artist Detail Modal
  // ----------------------------------------------------------------
  async function openArtistDetail(artistId) {
    const modal = document.getElementById('detail-modal');
    if (!modal) return;

    modal.innerHTML = `
      <div class="modal-header">
        <h2 id="detail-modal-title" class="modal-title">Loading artist…</h2>
        <button class="btn btn-icon btn-icon-sm" onclick="Modal.close('detail-modal')" aria-label="Close">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <div class="modal-body" style="text-align:center;padding:var(--space-8);">
        <p style="color:var(--text-muted);">Fetching artist details…</p>
      </div>
    `;
    Modal.open('detail-modal');

    try {
      const res = await Api.get(`catalogue.php?action=artist_detail&id=${artistId}`);
      if (!res || !res.success) throw new Error('Not found');
      const { artist, top_tracks, albums } = res;

      modal.innerHTML = `
        <div class="modal-header">
          <h2 id="detail-modal-title" class="modal-title">${escapeHtml(artist.name)}</h2>
          <button class="btn btn-icon btn-icon-sm" onclick="Modal.close('detail-modal')" aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="modal-body" style="overflow-y:auto;max-height:70vh;">
          <div style="display:flex;gap:var(--space-4);align-items:flex-start;margin-bottom:var(--space-5);flex-wrap:wrap;">
            <img src="${artist.image_url || 'assets/images/default-cover.svg'}" alt="${escapeHtml(artist.name)}"
              style="width:100px;height:100px;object-fit:cover;border-radius:var(--radius-full);flex-shrink:0;">
            <div style="flex:1;min-width:0;">
              <p style="color:var(--text-secondary);font-size:var(--text-sm);margin-bottom:var(--space-2);">${escapeHtml(artist.bio || 'No biography available.')}</p>
              <span style="color:var(--text-muted);font-size:var(--text-xs);">${(artist.monthly_listeners || 0).toLocaleString()} monthly listeners</span>
            </div>
          </div>

          ${top_tracks.length > 0 ? `
            <h3 style="font-size:var(--text-base);font-weight:700;margin-bottom:var(--space-3);">Top Tracks</h3>
            <div class="track-list" style="margin-bottom:var(--space-5);">
              ${top_tracks.map((t, i) => `
                <div class="track-row" data-track-id="${t.id}" style="cursor:pointer;">
                  <span class="track-index">${i + 1}</span>
                  <img class="track-thumb" src="${t.cover_url || 'assets/images/default-cover.svg'}" alt="">
                  <div class="track-info">
                    <span class="track-title">${escapeHtml(t.title)}</span>
                    <span class="track-artist">${escapeHtml(t.artist_name)}</span>
                  </div>
                  <span class="track-album">${escapeHtml(t.album_title)}</span>
                  <span class="track-duration">${formatTime(t.duration_seconds)}</span>
                  <button class="btn btn-icon btn-icon-sm artist-detail-play" data-idx="${i}" aria-label="Play">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                  </button>
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${albums.length > 0 ? `
            <h3 style="font-size:var(--text-base);font-weight:700;margin-bottom:var(--space-3);">Albums</h3>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:var(--space-3);">
              ${albums.map(al => `
                <div style="cursor:pointer;" class="artist-detail-album" data-album-id="${al.id}">
                  <img src="${al.cover_url || 'assets/images/default-cover.svg'}" alt="${escapeHtml(al.title)}"
                    style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:var(--radius-sm);margin-bottom:var(--space-1);">
                  <div style="font-size:var(--text-xs);font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(al.title)}</div>
                  <div style="color:var(--text-muted);font-size:11px;">${al.release_date ? al.release_date.substring(0, 4) : ''} · ${al.track_count} tracks</div>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      `;

      // Wire top track play buttons
      modal.querySelectorAll('.artist-detail-play').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const idx = parseInt(btn.dataset.idx, 10);
          Player.playTrack(top_tracks[idx], top_tracks);
        });
      });
      modal.querySelectorAll('.track-row[data-track-id]').forEach((row, i) => {
        row.addEventListener('click', () => Player.playTrack(top_tracks[i], top_tracks));
      });

      // Wire album clicks → open album detail
      modal.querySelectorAll('.artist-detail-album').forEach(el => {
        el.addEventListener('click', () => {
          Modal.close('detail-modal');
          openAlbumDetail(parseInt(el.dataset.albumId, 10));
        });
      });

    } catch (e) {
      modal.querySelector('.modal-body').innerHTML = `<p style="color:var(--text-muted);text-align:center;">Could not load artist details.</p>`;
    }
  }

  // ----------------------------------------------------------------
  // Album Detail Modal
  // ----------------------------------------------------------------
  async function openAlbumDetail(albumId) {
    const modal = document.getElementById('detail-modal');
    if (!modal) return;

    modal.innerHTML = `
      <div class="modal-header">
        <h2 id="detail-modal-title" class="modal-title">Loading album…</h2>
        <button class="btn btn-icon btn-icon-sm" onclick="Modal.close('detail-modal')" aria-label="Close">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <div class="modal-body" style="text-align:center;padding:var(--space-8);">
        <p style="color:var(--text-muted);">Fetching album details…</p>
      </div>
    `;
    Modal.open('detail-modal');

    try {
      const res = await Api.get(`catalogue.php?action=album_detail&id=${albumId}`);
      if (!res || !res.success) throw new Error('Not found');
      const { album, tracks } = res;

      const totalDuration = tracks.reduce((sum, t) => sum + (t.duration_seconds || 0), 0);

      modal.innerHTML = `
        <div class="modal-header">
          <h2 id="detail-modal-title" class="modal-title">${escapeHtml(album.title)}</h2>
          <button class="btn btn-icon btn-icon-sm" onclick="Modal.close('detail-modal')" aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="modal-body" style="overflow-y:auto;max-height:70vh;">
          <div style="display:flex;gap:var(--space-4);align-items:flex-end;margin-bottom:var(--space-5);flex-wrap:wrap;">
            <img src="${album.cover_url || 'assets/images/default-cover.svg'}" alt="${escapeHtml(album.title)}"
              style="width:120px;height:120px;object-fit:cover;border-radius:var(--radius-sm);flex-shrink:0;">
            <div>
              <p style="color:var(--text-muted);font-size:var(--text-xs);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">${album.album_type || 'Album'}</p>
              <h3 style="font-size:var(--text-xl);font-weight:800;margin-bottom:4px;">${escapeHtml(album.title)}</h3>
              <p style="color:var(--text-secondary);font-size:var(--text-sm);">
                ${escapeHtml(album.artist_name)} &bull; ${album.release_date ? album.release_date.substring(0, 4) : ''}
                &bull; ${tracks.length} songs &bull; ~${Math.round(totalDuration / 60)} min
              </p>
              <button class="btn btn-primary" id="album-play-all" style="margin-top:var(--space-3);">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                Play All
              </button>
            </div>
          </div>
          <div class="track-list">
            ${tracks.map((t, i) => `
              <div class="track-row album-track-row" data-idx="${i}" style="cursor:pointer;">
                <span class="track-index">${i + 1}</span>
                <img class="track-thumb" src="${t.cover_url || 'assets/images/default-cover.svg'}" alt="">
                <div class="track-info">
                  <span class="track-title">${escapeHtml(t.title)}</span>
                  <span class="track-artist">${escapeHtml(t.artist_name)}</span>
                </div>
                <span class="track-album" style="display:none;"></span>
                <span class="track-duration">${formatTime(t.duration_seconds)}</span>
                <button class="btn btn-icon btn-icon-sm album-track-play" data-idx="${i}" aria-label="Play ${escapeHtml(t.title)}">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                </button>
              </div>
            `).join('')}
          </div>
        </div>
      `;

      modal.querySelector('#album-play-all')?.addEventListener('click', () => {
        if (tracks.length > 0) Player.setQueue(tracks, 0);
      });
      modal.querySelectorAll('.album-track-play').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          Player.playTrack(tracks[parseInt(btn.dataset.idx, 10)], tracks);
        });
      });
      modal.querySelectorAll('.album-track-row').forEach(row => {
        row.addEventListener('click', () => {
          Player.playTrack(tracks[parseInt(row.dataset.idx, 10)], tracks);
        });
      });

    } catch (e) {
      modal.querySelector('.modal-body').innerHTML = `<p style="color:var(--text-muted);text-align:center;">Could not load album details.</p>`;
    }
  }

  function renderTrackCard(track) {
    return `
      <article class="music-card" data-track-id="${track.id}" tabindex="0" role="button" aria-label="Play ${escapeHtml(track.title)} by ${escapeHtml(track.artist_name)}">
        <div class="music-card-image-wrap">
          <img class="music-card-image" src="${track.cover_url}" alt="${escapeHtml(track.title)}" loading="lazy">
          <button class="btn btn-primary btn-icon card-play-overlay card-play-btn" data-id="${track.id}" aria-label="Play ${escapeHtml(track.title)}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          </button>
        </div>
        <h3 class="music-card-title">${escapeHtml(track.title)}</h3>
        <p class="music-card-subtitle">${escapeHtml(track.artist_name)}</p>
      </article>
    `;
  }

  function renderArtistCard(artist) {
    return `
      <article class="artist-card" data-artist-id="${artist.id}" tabindex="0" role="button" aria-label="View artist ${escapeHtml(artist.name)}">
        <div class="artist-avatar-wrap">
          <img class="artist-avatar" src="${artist.image_url}" alt="${escapeHtml(artist.name)}" loading="lazy">
        </div>
        <h3 class="artist-name">${escapeHtml(artist.name)}</h3>
        <span class="artist-meta">${(artist.monthly_listeners || 0).toLocaleString()} listeners</span>
      </article>
    `;
  }

  function formatTime(seconds) {
    if (!seconds) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  return { render, openArtistDetail, openAlbumDetail };
})();
