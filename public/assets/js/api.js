/**
 * ECHO Unified API Service Layer
 * Wraps Fetch API with JSON headers, CSRF token propagation,
 * error handling, and session state tracking.
 */
const Api = (function () {
  const BASE_URL = 'api';
  let currentUser = null;
  let csrfToken = null;
  const authStateListeners = [];

  async function request(endpoint, options = {}) {
    const url = `${BASE_URL}/${endpoint}`;
    const headers = {
      'Accept': 'application/json',
      ...options.headers
    };

    if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(options.body);
    }

    if (csrfToken && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method)) {
      headers['X-CSRF-Token'] = csrfToken;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      // Extract new CSRF token if present in headers
      const newCsrf = response.headers.get('X-CSRF-Token');
      if (newCsrf) {
        csrfToken = newCsrf;
      }

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const error = new Error((data && data.message) || `HTTP Error ${response.status}`);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (err) {
      if (!err.status) {
        // Network failure
        console.warn('Network or server unreachable:', err);
      }
      throw err;
    }
  }

  function get(endpoint, params = null) {
    let url = endpoint;
    if (params) {
      const query = new URLSearchParams(params).toString();
      url += (url.includes('?') ? '&' : '?') + query;
    }
    return request(url, { method: 'GET' });
  }

  function post(endpoint, data) {
    return request(endpoint, {
      method: 'POST',
      body: data
    });
  }

  function del(endpoint, data = null) {
    return request(endpoint, {
      method: 'DELETE',
      body: data
    });
  }

  // Session & Authentication
  async function checkSession() {
    try {
      const res = await get('auth.php?action=me');
      if (res && res.success && res.user) {
        currentUser = res.user;
        csrfToken = res.csrf_token || null;
      } else {
        currentUser = null;
      }
    } catch (e) {
      currentUser = null;
    }
    notifyAuthChange();
    return currentUser;
  }

  async function login(usernameOrEmail, password) {
    const res = await post('auth.php?action=login', {
      username: usernameOrEmail,
      password: password
    });
    if (res && res.success) {
      currentUser = res.user;
      csrfToken = res.csrf_token || null;
      notifyAuthChange();
    }
    return res;
  }

  async function register(username, email, password) {
    const res = await post('auth.php?action=register', {
      username,
      email,
      password
    });
    if (res && res.success) {
      currentUser = res.user;
      csrfToken = res.csrf_token || null;
      notifyAuthChange();
    }
    return res;
  }

  async function logout() {
    try {
      await post('auth.php?action=logout', {});
    } catch (e) {
      // Ignore network errors on logout
    }
    currentUser = null;
    csrfToken = null;
    notifyAuthChange();
  }

  function onAuthStateChange(cb) {
    if (typeof cb === 'function') {
      authStateListeners.push(cb);
    }
  }

  function notifyAuthChange() {
    authStateListeners.forEach(cb => {
      try { cb(currentUser); } catch (e) { console.error(e); }
    });
  }

  return {
    get,
    post,
    delete: del,
    checkSession,
    login,
    register,
    logout,
    getUser: () => currentUser,
    isAuthenticated: () => !!currentUser,
    onAuthStateChange,
    setCsrfToken: (t) => { csrfToken = t; }
  };
})();

