# ECHO — Music Discovery Platform

> *"Find your next favorite sound."*

**Course:** BTech 5th Semester Web Technology (MIT Manipal)  
**Course Code:** ICT3131 / FLEXICORE-3131  
**Project Architecture:** Full-Stack Vanilla Web Application (Semantic HTML5, Custom CSS3, Vanilla JavaScript, PHP, MySQL, Fetch API)  
**Team Structure:** Two-Student Collaboration with clear separation of ownership.

---

## 1. Project Overview & Student Work Split

ECHO is a curated music discovery and playlist management web platform designed with an editorial "Midnight Purple" aesthetic. It emphasizes continuous audio playback, genuine catalogue curation, accessible navigation, and persistent personal libraries.

### Student 1 Module: Discover & Explore Genres
- **Editorial Hero Section:** Showcases current featured album release with direct preview trigger.
- **ECHO Picks:** Curated discovery collection backed by genuine listener streams and curator staff picks.
- **Featured Artists & New Releases:** Emerging musician profiles and latest album releases sorted by authentic release dates.
- **Explore Genres & Catalogue:** Genre pill filters (Synthwave, Lo-Fi Chill, Electronic, Indie Rock, Jazz & Soul, Classical & Ambient), sorting (popularity, title, newest), and debounced search.
- **Multi-Entity Search:** Real-time search across tracks, artists, and albums.
- **Track & Artist Details Modal:** Inspects album metadata, collaborator credits, release dates, and stream counts.

### Student 2 Module: My Playlists & My Library
- **Playlist Management (CRUD):** Create, rename, view, and delete playlists with destructive action confirmation.
- **Track Membership & Sequencing:** Add catalogue songs to playlists, remove tracks, and prevent duplicate track entries.
- **Data Integrity:** Cascade rules ensure deleting a playlist removes track memberships but **never deletes catalogue tracks**.
- **Liked Songs:** Toggle like/unlike with instant UI feedback and persistence in MySQL.
- **Saved Artists:** Follow/unfollow artists with follower count metadata.
- **Recently Explored:** Records listening history strictly upon playback or detailed inspection (not on simple page display).
- **Authentication & Sessions:** Secure registration, login, logout, and guest-to-member intent preservation.

---

## 2. Technology Stack & Design Decisions

| Layer | Technology | Decision Rationale |
| :--- | :--- | :--- |
| **Frontend** | Semantic HTML5 & Custom CSS3 | Avoids heavy frameworks (Bootstrap/Tailwind) in favor of lightweight, custom CSS variables, strict 8px spacing, and WCAG AAA contrast ratios. |
| **Client Scripting** | Vanilla JavaScript (ES6 Modules/IIFE) | Clean component separation, native HTML5 audio event handling, zero npm build step, easy to explain during Viva. |
| **Routing** | Hash Routing (`#/*`) | Single persistent DOM shell keeping the `<audio>` element mounted across view changes for **uninterrupted music playback**. |
| **Backend** | PHP 8.0+ (PDO) | Secure REST-like endpoints with prepared statements, bcrypt hashing, session cookies, and CSRF protection. |
| **Database** | MySQL 8.0+ / MariaDB 10.4+ | Normalized relational schema (12 tables) with foreign key cascades, compound primary keys, and indexing. |

---

## 3. Directory Structure

```
echo/
|-- public/                            # Web root (Configure Apache / Server here)
|   |-- index.php                      # Application entry point & persistent audio host
|   |-- index.html                     # Static mirror for direct browser inspection
|   |-- assets/
|   |   |-- css/
|   |   |   |-- variables.css          # Design tokens (Midnight Purple, 8px grid)
|   |   |   |-- base.css               # Reset, focus visible rings, reduced motion
|   |   |   |-- layout.css             # 224px sidebar, top bar, mobile bottom nav
|   |   |   |-- components.css         # Buttons, cards, pills, modals, toasts
|   |   |   |-- player.css             # 80px persistent player, seek scrubber, volume
|   |   |   |-- views.css              # Editorial hero, card grids, playlist banner
|   |   |   |-- style.css              # Master stylesheet bundle
|   |   |-- js/
|   |   |   |-- components/
|   |   |   |   |-- toast.js           # Accessible notification toasts
|   |   |   |   |-- modal.js           # Native <dialog> focus-trapping controller
|   |   |   |-- views/
|   |   |   |   |-- discoverView.js    # Student 1: Discover view
|   |   |   |   |-- genresView.js      # Student 1: Genres & Search view
|   |   |   |   |-- playlistsView.js   # Student 2: Playlists CRUD view
|   |   |   |   |-- libraryView.js     # Student 2: Liked, Artists, History view
|   |   |   |-- player.js              # Persistent audio player controller
|   |   |   |-- api.js                 # Unified Fetch API service with CSRF handling
|   |   |   |-- app.js                 # Central router & session coordinator
|   |   |-- images/                    # SVGs and fallback cover artwork
|   |-- api/
|       |-- auth.php                   # Authentication endpoint (Login, Register, Logout, Me)
|       |-- catalogue.php              # Student 1 Catalogue & Search endpoint
|       |-- playlists.php              # Student 2 Playlists CRUD endpoint
|       |-- library.php                # Student 2 Library & History endpoint
|-- app/                               # Server-side business logic (Outside web root)
|   |-- config/
|   |   |-- database.php               # PDO database singleton connection
|   |   |-- database.example.php       # Template database configuration
|   |-- includes/
|   |   |-- auth_helper.php            # Session security, CSRF token handling, JSON responses
|-- database/
|   |-- schema.sql                     # 12 normalized relational MySQL tables
|   |-- seed.sql                       # Realistic seed data (Tracks, Albums, Artists, Demo Users)
|-- docs/
|   |-- ATTRIBUTION.md                 # Complete licensing & source attribution
|   |-- VIVA_AND_REPORT_GUIDE.md       # MIT Manipal report notes and viva question bank
|-- README.md                          # This documentation file
```

---

## 4. Local Setup Guide (Windows / XAMPP)

### Prerequisites
- Windows 10/11
- [XAMPP for Windows](https://www.apachefriends.org/) (with Apache and MySQL enabled) or standalone PHP 8.0+ and MySQL 8.0+.

### Step 1: Database Setup
1. Start **Apache** and **MySQL** from the XAMPP Control Panel.
2. Open your browser and navigate to `http://localhost/phpmyadmin/`.
3. Click **New** in the left sidebar and create a database named:
   ```sql
   echo_db
   ```
   (Collation: `utf8mb4_unicode_ci`).
4. Click on `echo_db`, select the **Import** tab at the top.
5. Choose file `database/schema.sql` from this repository and click **Import**.
6. Once completed, select the **Import** tab again, choose file `database/seed.sql`, and click **Import**.

### Step 2: Configure Web Server
You can run ECHO through XAMPP Apache or PHP's built-in development server:

#### Option A: PHP Built-in Server (Fastest)
1. Open PowerShell or Command Prompt.
2. Navigate to the project root:
   ```powershell
   cd d:\Downloads\echo
   ```
3. Start the server targeting the `public/` directory:
   ```powershell
   php -S localhost:8000 -t public
   ```
4. Open your browser and visit: **`http://localhost:8000`**

#### Option B: XAMPP Apache VirtualHost or Symlink
1. Create a directory junction in your XAMPP `htdocs` directory pointing to the `public` folder:
   ```powershell
   cmd /c mklink /J "C:\xampp\htdocs\echo" "d:\Downloads\echo\public"
   ```
2. Open your browser and visit: **`http://localhost/echo/`**

---

## 5. Demo Accounts

The database comes pre-seeded with test accounts for viva demonstration:

| Username | Email | Password | Role / Pre-loaded Content |
| :--- | :--- | :--- | :--- |
| **`aryan_mit`** | `aryan@learner.manipal.edu` | `Password@123` | Student 1 & 2 demo account with 2 playlists, 3 liked songs, and listening history. |
| **`sneha_mit`** | `sneha@learner.manipal.edu` | `Password@123` | Student 2 demo account with 1 playlist, 2 liked songs, and 2 followed artists. |
| **`demo_listener`** | `listener@echo.audio` | `Password@123` | Clean listener account for test registration and empty states. |

*You can also click **"Create Account"** in the top-right modal to register a new user at any time.*

---

## 6. Comprehensive Manual Test Checklist

Use this checklist during laboratory evaluation:

| # | Test Scenario | Steps to Execute | Expected Result | Pass/Fail |
| :--- | :--- | :--- | :--- | :--- |
| **1** | **Continuous Playback** | 1. Navigate to `#/discover`.<br>2. Click "Listen Preview" on Hero or any ECHO Pick.<br>3. Click through "Explore Genres", "My Playlists", and "My Library". | Audio continues playing seamlessly without pausing or restarting across view changes. | **PASS** |
| **2** | **Audio Scrubber & Volume** | 1. Play any track.<br>2. Drag progress slider.<br>3. Adjust volume slider. | Progress updates in real-time derived from native `audio` events; seeking jumps accurately. | **PASS** |
| **3** | **Genre Filtering** | 1. Navigate to `#/genres`.<br>2. Click genre pills (e.g. "Synthwave", "Lo-Fi Chill", "Jazz & Soul"). | Track table filters instantly; result count meta updates; active pill highlighted. | **PASS** |
| **4** | **Debounced Global Search** | 1. Type "Astral" into the top search bar from any view.<br>2. Press Enter or wait 300ms. | App navigates to `#/genres?q=Astral`; displays matching tracks and "Matching Artists/Albums" pill. | **PASS** |
| **5** | **Empty Search State** | 1. Search for a non-existent query (e.g. "xyz1234"). | Empty state displayed with informative message and a "Clear All Filters" button that resets the view. | **PASS** |
| **6** | **Track Credits Modal** | 1. In `#/genres`, click the info icon (i) on any track row. | Accessible modal opens displaying cover, album, release date, and collaboration artists (primary & featured). | **PASS** |
| **7** | **User Registration & Validation**| 1. Click "Sign In" -> "Create Account".<br>2. Test invalid input (e.g. short password, duplicate username).<br>3. Submit valid form. | Server validates length and uniqueness; password hashed via bcrypt; session started automatically. | **PASS** |
| **8** | **Session & CSRF Protection** | 1. Sign in as `aryan_mit` with `Password@123`.<br>2. Inspect network tab on state-changing requests. | `X-CSRF-Token` header sent and verified server-side; session cookie is HTTP-only with `SameSite=Lax`. | **PASS** |
| **9** | **Playlist CRUD** | 1. Go to `#/playlists`.<br>2. Click "New Playlist" -> Enter Title.<br>3. Rename playlist.<br>4. Delete playlist. | Playlist created and listed; rename updates title; delete requests confirmation and removes record. | **PASS** |
| **10**| **Playlist Track Management** | 1. Open a playlist.<br>2. Click "+ Add Song" -> Enter Track ID.<br>3. Attempt to add the same track again. | Track added with position order; duplicate attempt rejected with 409 error message. | **PASS** |
| **11**| **Catalogue Integrity** | 1. Delete a playlist containing tracks. | Playlist removed from MySQL; **catalogue tracks in `tracks` table remain completely intact**. | **PASS** |
| **12**| **Liked Songs & Saved Artists**| 1. Click heart icon in player bar or track list.<br>2. Navigate to `#/library`.<br>3. Click "Liked Songs". | Track appears in Liked Songs list; heart icon turns filled lavender; un-liking removes item. | **PASS** |
| **13**| **Listening History Tracking** | 1. Play a track not in recent history.<br>2. Navigate to `#/library` -> "Recently Explored". | Track recorded in user history with timestamp; recorded strictly on play/inspect, not on simple view. | **PASS** |
| **14**| **Two-User Data Isolation** | 1. Sign in as `aryan_mit`, create playlist "Aryan Set".<br>2. Log out, sign in as `sneha_mit`. | Sneha cannot see or delete Aryan's personal playlists in "My Playlists"; user data is strictly isolated. | **PASS** |
| **15**| **Accessibility & Keyboard Focus**| 1. Use `Tab`, `Shift+Tab`, and `Enter` without a mouse.<br>2. Open modal and press `Escape`. | Focus indicators visible on all controls; skip link jumps to content; Escape closes modal. | **PASS** |

---

## 7. Known Limitations

1. **30-Second Audio Previews:** ECHO is intentionally engineered as an audio discovery and exploration platform. Previews are legally sourced CC-BY / CC0 audio excerpts (30 seconds) rather than full commercial streaming, adhering strictly to copyright laws.
2. **Browser Autoplay Restrictions:** Modern browsers require an initial user gesture (click/tap) before allowing audio playback. ECHO respects this standard: audio begins only when the user clicks Play on a track, hero banner, or playlist.
3. **Local Offline Assets:** External album artwork from Unsplash requires internet access; however, local fallback SVGs (`default-cover.svg` and `default-avatar.svg`) are bundled to ensure complete visual resilience if offline.

