/**
 * ECHO — Discover View (Student 1 Module)
 * Editorial Hero, Curated ECHO Picks, Featured Artists & New Releases
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

    // Fetch live data from backend API
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

        <!-- 2. ECHO Picks Section (Staff Picks + Highest Plays) -->
        <section class="view-section" aria-labelledby="picks-heading">
          <div class="section-header">
            <div>
              <h2 id="picks-heading" class="section-title">ECHO Picks</h2>
              <p class="section-subtitle">Curated highlights backed by genuine listener streams</p>
            </div>
            <a href="#/genres" class="section-action">Explore all tracks &rarr;</a>
          </div>

          <div class="card-grid" id="picks-grid">
            ${picks.map(track => renderTrackCard(track)).join('')}
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

          <div class="artists-scroll-row">
            ${artists.map(artist => renderArtistCard(artist)).join('')}
          </div>
        </section>

        <!-- 4. Fresh Album Releases (if available) -->
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
                <article class="music-card" tabindex="0" role="button" onclick="window.location.hash='#/genres?q=${encodeURIComponent(rel.title)}'">
                  <div class="music-card-image-wrap">
                    <img class="music-card-image" src="${rel.cover_url}" alt="${escapeHtml(rel.title)}">
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

    // Attach Hero action
    const heroBtn = container.querySelector('#hero-play-action');
    if (heroBtn) {
      heroBtn.addEventListener('click', () => {
        Player.playTrack(hero, [hero, ...picks]);
      });
    }

    // Attach card clicks & play buttons
    container.querySelectorAll('.card-play-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const trackId = parseInt(btn.dataset.id, 10);
        const selected = picks.find(p => p.id === trackId);
        if (selected) {
          Player.playTrack(selected, picks);
        }
      });
    });

    container.querySelectorAll('.music-card[data-track-id]').forEach(card => {
      card.addEventListener('click', () => {
        const trackId = parseInt(card.dataset.trackId, 10);
        const selected = picks.find(p => p.id === trackId);
        if (selected) {
          Player.playTrack(selected, picks);
        }
      });
    });
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
      <article class="artist-card" tabindex="0" role="button" onclick="window.location.hash='#/genres?q=${encodeURIComponent(artist.name)}'" aria-label="Explore ${escapeHtml(artist.name)}">
        <div class="artist-avatar-wrap">
          <img class="artist-avatar" src="${artist.image_url}" alt="${escapeHtml(artist.name)}" loading="lazy">
        </div>
        <h3 class="artist-name">${escapeHtml(artist.name)}</h3>
        <span class="artist-meta">${(artist.monthly_listeners || 0).toLocaleString()} listeners</span>
      </article>
    `;
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
