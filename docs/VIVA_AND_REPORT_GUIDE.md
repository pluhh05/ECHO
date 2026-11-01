# ECHO — Term Project Report Notes & Viva Examination Guide

**Project Title:** ECHO — Curated Music Discovery Platform  
**Tagline:** *"Find your next favorite sound."*  
**Course Name:** Web Technology (5th Semester BTech)  
**Course Code:** ICT3131 / FLEXICORE-3131  
**Institution:** Department of Information and Communication Technology, Manipal Institute of Technology, Manipal  

---

## 1. Project Identification & Team Division of Work

| Student | Assigned Modules | Specific Responsibilities |
| :--- | :--- | :--- |
| **Student 1** | **Discover & Explore Genres** | - Editorial Hero banner & featured releases.<br>- Genuine curation algorithm ("ECHO Picks" combining staff picks and playback stream counts).<br>- Featured artists & new releases chronologically sorted.<br>- Dynamic genre pills filtering (Synthwave, Lo-Fi Chill, Electronic, Indie Rock, Jazz, Classical).<br>- Multi-entity catalogue search across tracks, artists, and albums.<br>- Track and artist credits detail dialog.<br>- Backend: `public/api/catalogue.php`. |
| **Student 2** | **My Playlists & My Library** | - User playlists CRUD (Create, Read, Rename, Delete).<br>- Playlist track membership sequencing and duplicate prevention.<br>- Relational deletion cascade safety (deleting playlist drops membership, **never drops catalogue tracks**).<br>- Liked songs toggle & persistent collection.<br>- Saved / followed artists management.<br>- Recently explored listening history logger (triggered strictly upon playback or detail inspection).<br>- Session-based authentication & CSRF validation.<br>- Backend: `public/api/playlists.php` & `public/api/library.php`. |

---

## 2. Project Purpose & Objectives

### Purpose
To design, implement, and evaluate an accessible, responsive, full-stack music discovery platform that solves the common UX flaw found in traditional web projects: **abrupt audio interruption during page navigation**. By mounting a single persistent HTML5 `<audio>` engine across a client-side hash router, ECHO delivers continuous playback while maintaining clean academic architecture (pure vanilla HTML5/CSS3/JS, PHP PDO, and MySQL).

### Objectives
1. **Uninterrupted Audio Streaming:** Keep audio playback alive across all view transitions without full-page HTTP reloads.
2. **Authentic Legal Discovery:** Provide genuine catalogue curation and Creative Commons CC-BY/CC0 audio previews without fabricating stream links or breaking copyright.
3. **Robust Relational Data Integrity:** Prevent duplicate playlist entries, prevent duplicate user likes/follows, and safeguard catalogue songs from cascade deletions.
4. **Hardened Web Security:** Implement bcrypt password hashing, HTTP-only session cookies, session fixation mitigation, and token-based CSRF protection.
5. **Universal Accessibility (WCAG 2.1 AAA):** Ensure high color contrast (15.4:1 on canvas, 8.4:1 on filled buttons), keyboard navigation with visible focus rings, native dialog focus traps, and screen reader announcements.

---

## 3. Target Users & Accessibility Compliance

### Target Users
- Music enthusiasts seeking niche genres (Synthwave, Lo-Fi, Ambient, Indie Rock).
- Students and deep-focus professionals requiring continuous background audio.
- Visitors exploring music before creating a personal account.

### Accessibility Design (WCAG 2.1 AAA)
- **Contrast Ratios:**
  - Canvas `#101014` to Primary Text `#F5F3FA`: **15.4:1** (AAA standard &ge; 7:1).
  - Surface `#19191F` to Secondary Text `#B4AFBF`: **7.8:1** (AAA standard).
  - Lavender Accent `#B49AFF` to Inverse Dark Text `#101014`: **8.4:1** (AAA standard).
- **Keyboard Navigation:** Native skip-to-content link (`.skip-link`), visible 2px lavender focus outlines (`:focus-visible`), and keyboard operability on all interactive cards.
- **Accessible Modals (`<dialog>`):** Native top-layer dialogs that trap focus inside the modal, dismiss on `Escape`, and return focus to the triggering element upon close.
- **Assistive Technology:** Live ARIA region (`#sr-announcements` with `aria-live="polite"`) announcing route changes and audio feedback.
- **Motion Sensitivity:** Respects `prefers-reduced-motion: reduce` by disabling transitions and instant-scrolling.

---

## 4. Architectural Sitemap & Ownership

```
                            [ ECHO Application Root ]
                                        |
           +----------------------------+----------------------------+
           |                                                         |
 [ Student 1: Discovery ]                                 [ Student 2: Collections ]
           |                                                         |
  +--------+--------+                                       +--------+--------+
  |                 |                                       |                 |
#/discover       #/genres                                #/playlists       #/library
  |                 |                                       |                 |
  |- Hero Banner    |- Genre Filter Pills                   |- List Sets      |- Liked Songs
  |- ECHO Picks     |- Multi-Entity Search                  |- New Playlist   |- Saved Artists
  |- Top Artists    |- Sort By (Plays/A-Z/Date)             |- Rename Set     |- Playback History
  |- New Releases   |- Track Credits Dialog                 |- Delete Set     |- Sign In/Register
  |                 |- Preview Trigger                      |- Add/Del Songs  |- Session Auth
```

---

## 5. Technology Stack & Justification

| Technology | Selection Justification | Viva Defense Point |
| :--- | :--- | :--- |
| **Semantic HTML5** | Semantic landmarks (`<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>`, `<dialog>`) provide built-in screen reader support. | Avoids `<div>` soup; standards-compliant. |
| **Custom CSS3** | Custom properties (CSS variables), 8px spacing grid, flexbox, and CSS grid without bloated UI frameworks (Bootstrap/Tailwind). | Demonstrates fundamental CSS mastery and clean design token architecture. |
| **Vanilla JavaScript** | Modular ES6 patterns without React, Next.js, or npm bundlers. | Keeps execution overhead negligible (~40KB total) and eliminates build step fragility during viva evaluation. |
| **Client Hash Router** | Hash routing (`#/*`) decouples content views from the DOM root. | **Crucial:** Keeps the `<audio>` element mounted continuously so songs do not stop when navigating. |
| **PHP 8.0+ (PDO)** | PDO prepared statements with parameter binding and exception handling. | Eliminates SQL injection vulnerabilities; clean REST-like JSON API. |
| **MySQL 8.0+** | InnoDB engine with foreign key constraints, composite primary keys, and indices. | Enforces relational integrity directly at the storage engine level. |

---

## 6. Input-Processing-Output (IPO) Analysis

### Student 1: Discover & Explore Genres

#### 1. Discovery Feed (`#/discover`)
- **Input:** HTTP GET request to `api/catalogue.php?action=discover`.
- **Processing:** Server executes parameterized queries joining `tracks`, `albums`, `artists`, and `genres`. Filters staff picks (`is_staff_pick = 1`) and sorts by play counts and release dates.
- **Output:** JSON object containing `hero`, `picks` array, `artists` array, and `new_releases` array. Rendered as interactive cards in `discoverView.js`.

#### 2. Multi-Criteria Catalogue Search & Filter (`#/genres`)
- **Input:** User query string `q`, genre slug `genre`, and sort order `sort`.
- **Processing:** Server constructs parameterized query (`LIKE :search`) across track titles, artist names, and album titles. Filters by `track_genres` junction. Applies `ORDER BY plays_count` or `ORDER BY release_date`.
- **Output:** Filtered JSON track list, search entity matches (artists and albums), and updated result counts.

---

### Student 2: My Playlists & My Library

#### 1. Create Playlist
- **Input:** User ID (from session), CSRF token header, title (3-100 chars), and optional description.
- **Processing:** Server checks session authentication, validates CSRF token using `hash_equals()`, sanitizes inputs, and executes `INSERT INTO playlists`.
- **Output:** HTTP 201 Created with new playlist ID; UI mounts new playlist detail view.

#### 2. Add Track to Playlist (Duplicate Prevention)
- **Input:** `playlist_id` and `track_id`.
- **Processing:** Verifies user ownership of playlist. Queries `SELECT 1 FROM playlist_tracks WHERE playlist_id = :p AND track_id = :t`. If row exists, emits HTTP 409 Conflict. If clean, calculates `MAX(position) + 1` and inserts row.
- **Output:** HTTP 200 with success toast; playlist track list refreshes.

#### 3. Liked Songs & History Logger
- **Input:** Track ID passed on heart click or upon audio start (`play` event).
- **Processing:**
  - *Like:* Toggles row in `liked_tracks` (insert if missing, delete if present).
  - *Recent:* Inserts `(user_id, track_id, CURRENT_TIMESTAMP)` into `recent_tracks` and increments `tracks.plays_count`.
- **Output:** Dynamic heart button state update and synchronized "My Library" tabs.

---

## 7. Security Architecture & Viva Defense Points

### 1. SQL Injection Prevention
All database queries use PDO prepared statements with parameterized inputs:
```php
$stmt = $db->prepare("
    SELECT t.id, t.title FROM tracks t
    WHERE t.title LIKE :q OR ar.name LIKE :q
");
$stmt->execute([':q' => "%{$query}%"]);
```
*Emulation is explicitly disabled (`PDO::ATTR_EMULATE_PREPARES => false`) to enforce native engine-level escaping.*

### 2. Password Security
Passwords are never stored in plaintext. They are hashed using bcrypt:
```php
$passwordHash = password_hash($password, PASSWORD_DEFAULT);
// Verified via:
password_verify($password, $user['password_hash']);
```

### 3. Cross-Site Request Forgery (CSRF)
All state-changing endpoints (POST) require a cryptographically secure 32-byte token:
```php
function getCsrfToken(): string {
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}
// Checked on incoming requests using timing-safe comparison:
hash_equals($_SESSION['csrf_token'], $_SERVER['HTTP_X_CSRF_TOKEN']);
```

### 4. Session Hijacking & Fixation Protection
- `session_regenerate_id(true)` is executed immediately upon successful login and registration.
- Cookie flags are set to `httponly = true` (blocks JavaScript `document.cookie` access) and `samesite = 'Lax'`.

---

## 8. Anticipated Viva Examination Questions & Model Answers

### Q1: Why did you choose a Single-Page Shell with hash routing instead of 4 separate PHP pages?
> **Model Answer:**  
> "A music discovery application's core value proposition is continuous audio listening. In a traditional multi-page architecture with four separate PHP files, clicking between 'Discover' and 'My Playlists' triggers a full HTTP reload, which destroys the browser's DOM context and terminates the `<audio>` stream. Furthermore, modern browsers block automatic playback on reloads under strict autoplay policies. By implementing a lightweight client router in vanilla JavaScript (~60 lines) hosted inside a single `index.php` shell, the HTML5 audio element stays mounted permanently while views swap dynamically via Fetch API calls. Browser back/forward navigation and direct bookmarking are fully supported via the `hashchange` event."

### Q2: What happens to catalogue tracks when a user deletes a playlist?
> **Model Answer:**  
> "Our schema implements strict relational integrity. In `database/schema.sql`, the `playlist_tracks` junction table has a foreign key constraint referencing `playlists(id) ON DELETE CASCADE`, but its reference to `tracks(id)` uses `ON DELETE RESTRICT`. When a user deletes a playlist, the cascade only drops the association rows from `playlist_tracks`. The catalogue tracks themselves in the `tracks` table remain completely untouched."

### Q3: How do you prevent duplicate songs inside a playlist?
> **Model Answer:**  
> "Duplicate prevention is enforced at both the database level and the application level. In `database/schema.sql`, `playlist_tracks` uses a compound primary key: `PRIMARY KEY (playlist_id, track_id)`. At the API level in `playlists.php`, we explicitly query the junction table before insertion; if a matching record exists, the server returns an HTTP 409 Conflict status with the message 'This track is already in the playlist.'"

### Q4: How is audio playback tracked in the user's history? Does viewing a page trigger a play count?
> **Model Answer:**  
> "No. To avoid inflating play counts or logging unlistened tracks, listening history is never recorded when a track card is merely rendered on screen. History is recorded in `recent_tracks` strictly when an explicit user action occurs: either when the native HTML5 audio `play` event fires or when the user inspects track credits in the details dialog."

### Q5: How did you ensure compliance with copyright and royalty laws for audio streams?
> **Model Answer:**  
> "We did not scrape or rehost copyrighted commercial tracks. As documented in `docs/ATTRIBUTION.md`, all audio previews are 30-second educational excerpts sourced from verified Creative Commons (CC0 and CC-BY 4.0) creators on FreeSound and Wikimedia Commons. Album artwork is licensed under the permissive Unsplash License for free use. Every asset has full legal provenance tracked in our attribution table."

---

## 9. Conclusion & Future Enhancements

### Conclusion
ECHO successfully demonstrates that a rich, modern, responsive music platform can be constructed using pure foundational web standards (HTML5, CSS3, Vanilla JS, PHP PDO, MySQL) without reliance on bloated JavaScript frameworks or external build tools. The platform achieves WCAG AAA accessibility, bulletproof session security, and continuous audio playback.

### Future Scope
1. **Interactive Waveform Scrubbing:** Visualizing audio amplitudes using Web Audio API (`AudioContext` and `AnalyserNode`).
2. **Collaborative Shared Playlists:** Permitting multiple authenticated users to contribute to a shared set.
3. **Web Audio Equalizer:** Adding client-side bass boost and treble controls.
4. **Offline PWA Caching:** Implementing a Service Worker to cache preview MP3 files for offline listening.

