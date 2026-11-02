/**
 * ECHO — Central Application Router & Coordinator
 * Client-side hash routing, session state sync, global search, and shell bindings.
 */
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Core Subsystems
  Player.init();
  Modal.setupBackdropClicks();

  // DOM Elements
  const viewContainer = document.getElementById('view-container');
  const globalSearchInput = document.getElementById('global-search-input');
  const userProfileArea = document.getElementById('user-profile-area');
  const authModal = document.getElementById('auth-modal');

  // Route Mapping Table
  const routes = {
    '#/discover': DiscoverView,
    '#/genres': GenresView,
    '#/playlists': PlaylistsView,
    '#/library': LibraryView
  };

  /**
   * Router: Parse window.location.hash and mount active view
   */
  async function handleRoute() {
    let hash = window.location.hash || '#/discover';
    let [path, queryString] = hash.split('?');
    
    // Parse query params if present
    const params = {};
    if (queryString) {
      const searchParams = new URLSearchParams(queryString);
      for (const [key, val] of searchParams.entries()) {
        params[key] = val;
      }
    }

    // Default fallback
    if (!routes[path]) {
      path = '#/discover';
    }

    // Update active nav links in sidebar and mobile bottom nav
    updateNavActiveState(path);

    // Announce route change to screen readers
    const sr = document.getElementById('sr-announcements');
    if (sr) {
      const pageTitle = path.replace('#/', '').toUpperCase();
      sr.textContent = `Navigated to ${pageTitle}`;
    }

    // Render corresponding view
    const view = routes[path];
    if (view && typeof view.render === 'function') {
      try {
        await view.render(viewContainer, params);
      } catch (err) {
        console.error('View render error:', err);
        viewContainer.innerHTML = `
          <div class="state-container">
            <h3 class="state-title">Unable to load view</h3>
            <p class="state-description">${escapeHtml(err.message || 'An unexpected error occurred.')}</p>
            <button class="btn btn-secondary" onclick="window.location.hash='#/discover'">Return to Discover</button>
          </div>
        `;
      }
    }

    // Sync search input value if navigating to genres with query
    if (globalSearchInput) {
      if (path === '#/genres' && params.q) {
        globalSearchInput.value = params.q;
      } else if (path !== '#/genres') {
        globalSearchInput.value = '';
      }
    }

    // Scroll to top of content smoothly
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function updateNavActiveState(activePath) {
    document.querySelectorAll('.nav-link, .mobile-nav-item').forEach(link => {
      const href = link.getAttribute('href');
      const isMatch = href && href.startsWith(activePath);
      link.classList.toggle('active', isMatch);
      link.setAttribute('aria-current', isMatch ? 'page' : 'false');
    });
  }

  // Window hashchange listener for instant forward/back navigation
  window.addEventListener('hashchange', handleRoute);

  /**
   * Global Search Input Handling
   */
  if (globalSearchInput) {
    let debounceTimer = null;

    globalSearchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      const query = e.target.value.trim();

      debounceTimer = setTimeout(() => {
        if (query.length > 0) {
          if (!window.location.hash.startsWith('#/genres')) {
            window.location.hash = `#/genres?q=${encodeURIComponent(query)}`;
          } else {
            GenresView.setSearch(query);
          }
        }
      }, 300);
    });

    globalSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const query = globalSearchInput.value.trim();
        window.location.hash = `#/genres?q=${encodeURIComponent(query)}`;
      }
    });
  }

  /**
   * Authentication State & User Menu
   */
  function renderUserArea(user) {
    if (!userProfileArea) return;

    if (user) {
      userProfileArea.innerHTML = `
        <div style="display: flex; align-items: center; gap: var(--space-3);">
          <span class="user-profile-name">
            ${escapeHtml(user.username)}
          </span>
          <button class="btn btn-secondary btn-icon-sm" id="btn-user-avatar" title="Account (${escapeHtml(user.username)})" style="background: var(--accent-subtle); color: var(--accent-primary); font-weight: 700;">
            ${escapeHtml(user.username.charAt(0).toUpperCase())}
          </button>
          <button class="btn btn-ghost btn-icon-sm" id="btn-logout" title="Sign Out">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        </div>
      `;

      const logoutBtn = userProfileArea.querySelector('#btn-logout');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
          await Api.logout();
          Toast.info('Signed out successfully.');
          handleRoute();
        });
      }
    } else {
      userProfileArea.innerHTML = `
        <button class="btn btn-primary" id="btn-open-auth">
          <span>Sign In</span>
        </button>
      `;

      const authBtn = userProfileArea.querySelector('#btn-open-auth');
      if (authBtn) {
        authBtn.addEventListener('click', () => {
          Modal.open('auth-modal');
        });
      }
    }
  }

  Api.onAuthStateChange(renderUserArea);

  // Check initial session
  Api.checkSession().then(renderUserArea);

  /**
   * Auth Dialog Tab & Submission Handlers
   */
  setupAuthModalHandlers();

  function setupAuthModalHandlers() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const tabLogin = document.getElementById('tab-auth-login');
    const tabRegister = document.getElementById('tab-auth-register');

    if (tabLogin && tabRegister) {
      tabLogin.addEventListener('click', () => {
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
        if (loginForm) loginForm.style.display = 'block';
        if (registerForm) registerForm.style.display = 'none';
      });

      tabRegister.addEventListener('click', () => {
        tabRegister.classList.add('active');
        tabLogin.classList.remove('active');
        if (loginForm) loginForm.style.display = 'none';
        if (registerForm) registerForm.style.display = 'block';
      });
    }

    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const usernameInput = loginForm.querySelector('#login-username');
        const passwordInput = loginForm.querySelector('#login-password');
        const errorEl = loginForm.querySelector('#login-error');

        try {
          await Api.login(usernameInput.value, passwordInput.value);
          Toast.success('Welcome back to ECHO!');
          Modal.close('auth-modal');
          loginForm.reset();
          if (errorEl) errorEl.textContent = '';
          handleRoute();
        } catch (err) {
          if (errorEl) errorEl.textContent = err.message || 'Login failed. Please check your credentials.';
        }
      });
    }

    if (registerForm) {
      registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = registerForm.querySelector('#reg-username').value;
        const email = registerForm.querySelector('#reg-email').value;
        const password = registerForm.querySelector('#reg-password').value;
        const errorEl = registerForm.querySelector('#reg-error');

        try {
          await Api.register(username, email, password);
          Toast.success('Account created! Welcome to ECHO.');
          Modal.close('auth-modal');
          registerForm.reset();
          if (errorEl) errorEl.textContent = '';
          handleRoute();
        } catch (err) {
          if (errorEl) errorEl.textContent = err.message || 'Registration failed.';
        }
      });
    }
  }

  // Initial Route Launch
  handleRoute();

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
});

