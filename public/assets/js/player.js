/**
 * ECHO Persistent Preview Player Controller
 * Drives persistent HTML5 audio element with native event bindings,
 * real track duration synchronization, queue management, and error resilience.
 */
const Player = (function () {
  let audio = null;
  let currentTrack = null;
  let queue = [];
  let currentIndex = -1;
  let isSeeking = false;
  let onTrackChangeListeners = [];

  // Track virtual playback progress (respecting song length in database)
  let trackPlaybackSeconds = 0;
  let lastTickTimestamp = null;
  let clockInterval = null;

  // DOM Elements
  let els = {};

  function init() {
    audio = document.getElementById('audio-engine');
    if (!audio) {
      audio = document.createElement('audio');
      audio.id = 'audio-engine';
      audio.preload = 'none';
      document.body.appendChild(audio);
    }

    // Cache player DOM controls
    els = {
      container: document.getElementById('playback-bar'),
      artwork: document.getElementById('player-artwork'),
      title: document.getElementById('player-track-title'),
      artist: document.getElementById('player-track-artist'),
      playBtn: document.getElementById('player-play-btn'),
      playIcon: document.getElementById('player-play-icon'),
      prevBtn: document.getElementById('player-prev-btn'),
      nextBtn: document.getElementById('player-next-btn'),
      scrubber: document.getElementById('player-scrubber'),
      currentTime: document.getElementById('player-current-time'),
      durationTime: document.getElementById('player-duration-time'),
      volumeSlider: document.getElementById('player-volume-slider'),
      volumeIcon: document.getElementById('player-volume-icon'),
      likeBtn: document.getElementById('player-like-btn')
    };

    bindAudioEvents();
    bindUiEvents();
    updateControlsState();
  }

  function getTrackDuration() {
    if (currentTrack && currentTrack.duration_seconds) {
      const d = parseInt(currentTrack.duration_seconds, 10);
      if (!isNaN(d) && d > 0) return d;
    }
    if (audio && audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
      return Math.round(audio.duration);
    }
    return 180;
  }

  function startClock() {
    stopClock();
    lastTickTimestamp = Date.now();
    clockInterval = setInterval(() => {
      if (isSeeking) return;
      const now = Date.now();
      const deltaSec = (now - lastTickTimestamp) / 1000;
      lastTickTimestamp = now;

      const total = getTrackDuration();
      trackPlaybackSeconds += deltaSec;

      if (trackPlaybackSeconds >= total) {
        // Track finished playing its full duration
        trackPlaybackSeconds = 0;
        stopClock();
        audio.pause();
        audio.currentTime = 0;
        setPlayButtonIcon(false);
        syncRowPlayStates(false);
        if (hasNext()) {
          playNext();
        } else {
          updateProgressUI(total, total);
          Toast.info('Playback finished.');
        }
        return;
      }

      updateProgressUI(trackPlaybackSeconds, total);
    }, 200);
  }

  function stopClock() {
    if (clockInterval) {
      clearInterval(clockInterval);
      clockInterval = null;
    }
    lastTickTimestamp = null;
  }

  function updateProgressUI(currentSec, totalSec) {
    const safeTotal = totalSec > 0 ? totalSec : 180;
    const clampedCurrent = Math.min(Math.max(currentSec, 0), safeTotal);
    const percent = (clampedCurrent / safeTotal) * 100;

    if (els.scrubber && !isSeeking) {
      els.scrubber.value = percent;
      els.scrubber.style.background = `linear-gradient(to right, var(--accent-primary) ${percent}%, var(--border-strong) ${percent}%)`;
    }
    if (els.currentTime) {
      els.currentTime.textContent = formatTime(clampedCurrent);
    }
    if (els.durationTime) {
      els.durationTime.textContent = formatTime(safeTotal);
    }
  }

  function bindAudioEvents() {
    // 1. Play event
    audio.addEventListener('play', () => {
      setPlayButtonIcon(true);
      syncRowPlayStates(true);
      startClock();
      notifyStateChange('playing');
    });

    // 2. Pause event
    audio.addEventListener('pause', () => {
      setPlayButtonIcon(false);
      syncRowPlayStates(false);
      stopClock();
      notifyStateChange('paused');
    });

    // 3. Audio ended (loops underlying audio file while full song duration progresses)
    audio.addEventListener('ended', () => {
      const total = getTrackDuration();
      if (trackPlaybackSeconds < total) {
        // Restart loop seamlessly
        audio.currentTime = 0;
        audio.play().catch(e => console.warn('Loop restart error:', e));
      } else {
        stopClock();
        setPlayButtonIcon(false);
        syncRowPlayStates(false);
        if (hasNext()) {
          playNext();
        }
      }
    });

    // 4. Metadata loaded (duration display always reflects track's official duration)
    audio.addEventListener('loadedmetadata', () => {
      const total = getTrackDuration();
      if (els.durationTime) {
        els.durationTime.textContent = formatTime(total);
      }
      if (els.scrubber) {
        els.scrubber.disabled = false;
      }
    });

    // 5. Error handling with fallback to local synthesized loop
    audio.addEventListener('error', () => {
      console.warn('Audio playback error:', audio.error);
      const currentSrc = audio.currentSrc || audio.src || '';
      const localFiles = ['preview-synthwave.wav', 'preview-lofi.wav', 'preview-ambient.wav'];
      const isAlreadyLocal = localFiles.some(f => currentSrc.includes(f));

      if (!isAlreadyLocal) {
        console.info('Switching to local offline audio preview fallback...');
        audio.src = 'assets/audio/preview-synthwave.wav';
        audio.load();
        audio.play().catch(err => console.warn('Autoplay prevented:', err));
        return;
      }

      setPlayButtonIcon(false);
      syncRowPlayStates(false);
      stopClock();
      if (els.scrubber) { els.scrubber.value = 0; els.scrubber.disabled = true; }
      if (els.currentTime) els.currentTime.textContent = '0:00';
      Toast.error('Audio preview is currently unavailable for this track.');
    });
  }

  function bindUiEvents() {
    // Play/Pause button
    if (els.playBtn) {
      els.playBtn.addEventListener('click', togglePlayPause);
    }

    // Previous / Next buttons
    if (els.prevBtn) {
      els.prevBtn.addEventListener('click', () => {
        if (trackPlaybackSeconds > 3) {
          trackPlaybackSeconds = 0;
          audio.currentTime = 0;
          updateProgressUI(0, getTrackDuration());
        } else {
          playPrevious();
        }
      });
    }

    if (els.nextBtn) {
      els.nextBtn.addEventListener('click', playNext);
    }

    // Seek scrubber interactions
    if (els.scrubber) {
      els.scrubber.addEventListener('input', (e) => {
        isSeeking = true;
        const total = getTrackDuration();
        const seekPercent = parseFloat(e.target.value);
        const previewCurrent = (seekPercent / 100) * total;
        if (els.currentTime) {
          els.currentTime.textContent = formatTime(previewCurrent);
        }
        els.scrubber.style.background = `linear-gradient(to right, var(--accent-primary) ${seekPercent}%, var(--border-strong) ${seekPercent}%)`;
      });

      els.scrubber.addEventListener('change', (e) => {
        const total = getTrackDuration();
        const seekPercent = parseFloat(e.target.value);
        const newTime = Math.min((seekPercent / 100) * total, total);
        trackPlaybackSeconds = newTime;
        isSeeking = false;

        if (audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
          audio.currentTime = newTime % audio.duration;
        }

        updateProgressUI(trackPlaybackSeconds, total);
      });
    }

    // Volume slider
    if (els.volumeSlider) {
      els.volumeSlider.addEventListener('input', (e) => {
        const vol = parseFloat(e.target.value);
        audio.volume = vol;
        updateVolumeIcon(vol);
      });
    }

    // Player Like button
    if (els.likeBtn) {
      els.likeBtn.addEventListener('click', () => {
        if (!currentTrack) return;
        if (window.LibraryController && typeof window.LibraryController.toggleLike === 'function') {
          window.LibraryController.toggleLike(currentTrack.id);
        } else {
          Toast.info('Sign in to save this song to your Library.');
        }
      });
    }
  }

  /**
   * Always wraps icons with proper <svg> tag so the play/pause icon NEVER disappears.
   */
  function setPlayButtonIcon(isPlaying) {
    if (!els.playIcon) return;
    if (isPlaying) {
      els.playIcon.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <rect x="6" y="4" width="4" height="16" rx="1"></rect>
          <rect x="14" y="4" width="4" height="16" rx="1"></rect>
        </svg>
      `;
      if (els.playBtn) els.playBtn.setAttribute('aria-label', 'Pause');
    } else {
      els.playIcon.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
      `;
      if (els.playBtn) els.playBtn.setAttribute('aria-label', 'Play');
    }
  }

  /**
   * Synchronizes play/pause icons on track rows and cards across the active view.
   */
  function syncRowPlayStates(isPlaying) {
    const id = currentTrack ? currentTrack.id : null;
    document.querySelectorAll('.track-row, .music-card').forEach(el => {
      const trackId = parseInt(el.dataset.id || el.dataset.trackId, 10);
      const isCurrent = id && trackId === id;
      el.classList.toggle('is-current-track', isCurrent);
      el.classList.toggle('is-playing', isCurrent && isPlaying);

      const btn = el.querySelector('.track-play-btn, .track-play-action, .card-play-overlay, .card-play-btn');
      if (btn) {
        if (isCurrent && isPlaying) {
          btn.setAttribute('aria-label', 'Pause');
          btn.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <rect x="6" y="4" width="4" height="16" rx="1"></rect>
              <rect x="14" y="4" width="4" height="16" rx="1"></rect>
            </svg>
          `;
        } else {
          btn.setAttribute('aria-label', 'Play');
          btn.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          `;
        }
      }
    });
  }

  function updateVolumeIcon(vol) {
    if (!els.volumeIcon) return;
    if (vol === 0) {
      els.volumeIcon.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path></svg>`;
    } else {
      els.volumeIcon.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>`;
    }
  }

  function loadAndPlay(track) {
    if (!track) {
      Toast.error('Track preview is not available.');
      return;
    }

    // Resolve audio URL to local synthesized loops
    let audioUrl = track.preview_url || 'assets/audio/preview-synthwave.wav';
    if (audioUrl.includes('freesound.org') || !audioUrl.startsWith('assets/audio/')) {
      const g = (track.genre || track.genre_name || track.genres || '').toLowerCase();
      if (g.includes('lo-fi') || g.includes('chill')) {
        audioUrl = 'assets/audio/preview-lofi.wav';
      } else if (g.includes('ambient') || g.includes('jazz') || g.includes('classical')) {
        audioUrl = 'assets/audio/preview-ambient.wav';
      } else {
        audioUrl = 'assets/audio/preview-synthwave.wav';
      }
    }

    currentTrack = track;
    trackPlaybackSeconds = 0;

    // Update track metadata UI
    if (els.title) {
      els.title.textContent = track.title || 'Unknown Title';
      els.title.title = track.title;
    }
    if (els.artist) {
      els.artist.textContent = track.artist_name || 'Unknown Artist';
    }
    if (els.artwork) {
      els.artwork.src = track.cover_url || 'assets/images/default-cover.svg';
      els.artwork.alt = `${track.title} artwork`;
    }

    const totalDuration = getTrackDuration();
    updateProgressUI(0, totalDuration);

    // Set audio source & enable looping for seamless musical continuation
    audio.loop = true;
    audio.src = audioUrl;
    audio.load();

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setPlayButtonIcon(true);
          syncRowPlayStates(true);
          startClock();
          notifyTrackChange(track);
          if (window.LibraryController && typeof window.LibraryController.recordRecent === 'function') {
            window.LibraryController.recordRecent(track.id);
          }
        })
        .catch((err) => {
          console.warn('Playback blocked or failed:', err);
          setPlayButtonIcon(false);
          syncRowPlayStates(false);
          stopClock();
          if (err.name === 'NotAllowedError') {
            Toast.info('Click Play to start listening.');
          }
        });
    }

    updateControlsState();
  }

  function togglePlayPause() {
    if (!currentTrack) {
      if (queue.length > 0) {
        playTrackAt(0);
      } else {
        Toast.info('Select a song to play.');
      }
      return;
    }

    if (audio.paused) {
      audio.play().catch(e => console.warn('Play error:', e));
    } else {
      audio.pause();
    }
  }

  function setQueue(tracks, startIndex = 0) {
    if (!Array.isArray(tracks) || tracks.length === 0) return;
    queue = tracks;
    currentIndex = startIndex;
    loadAndPlay(queue[currentIndex]);
  }

  function playTrack(track, surroundingQueue = null) {
    // If clicking on the currently playing track, toggle play/pause
    if (currentTrack && currentTrack.id === track.id) {
      togglePlayPause();
      return;
    }

    if (surroundingQueue && Array.isArray(surroundingQueue)) {
      queue = surroundingQueue;
      currentIndex = queue.findIndex(t => t.id === track.id);
      if (currentIndex === -1) {
        queue.unshift(track);
        currentIndex = 0;
      }
    } else {
      const existingIdx = queue.findIndex(t => t.id === track.id);
      if (existingIdx !== -1) {
        currentIndex = existingIdx;
      } else {
        queue.push(track);
        currentIndex = queue.length - 1;
      }
    }
    loadAndPlay(track);
  }

  function playTrackAt(index) {
    if (index >= 0 && index < queue.length) {
      currentIndex = index;
      loadAndPlay(queue[currentIndex]);
    }
  }

  function playNext() {
    if (hasNext()) {
      currentIndex++;
      loadAndPlay(queue[currentIndex]);
    } else {
      Toast.info('End of playlist.');
    }
  }

  function playPrevious() {
    if (hasPrevious()) {
      currentIndex--;
      loadAndPlay(queue[currentIndex]);
    }
  }

  function hasNext() {
    return currentIndex >= 0 && currentIndex < queue.length - 1;
  }

  function hasPrevious() {
    return currentIndex > 0;
  }

  function updateControlsState() {
    if (els.prevBtn) els.prevBtn.disabled = !hasPrevious();
    if (els.nextBtn) els.nextBtn.disabled = !hasNext();
  }

  function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  function onTrackChange(callback) {
    if (typeof callback === 'function') {
      onTrackChangeListeners.push(callback);
    }
  }

  function notifyTrackChange(track) {
    onTrackChangeListeners.forEach(cb => {
      try { cb(track, 'play'); } catch (e) { console.error(e); }
    });
  }

  function notifyStateChange(state) {
    onTrackChangeListeners.forEach(cb => {
      try { cb(currentTrack, state); } catch (e) { console.error(e); }
    });
  }

  return {
    init,
    playTrack,
    setQueue,
    togglePlayPause,
    playNext,
    playPrevious,
    getCurrentTrack: () => currentTrack,
    isPlaying: () => audio && !audio.paused,
    onTrackChange,
    syncRowPlayStates
  };
})();
