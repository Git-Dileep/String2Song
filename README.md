# String2Song

A web application that converts arbitrary text—stories, poems, notes, or structured lists—into tailored Spotify playlists using track-matching algorithms and direct Spotify Web API integration.

---

## Features

* **Text-to-Playlist Parsing**: Translates raw text inputs, phrases, and song titles into sequenced track matches.
* **Intelligent Track Resolution**: Queries the Spotify Web API to resolve contextual and exact title matches.
* **Curated Input Presets**: Built-in stylistic templates for rapid testing and generation.
* **Client-Side PKCE Authentication**: Secure Spotify OAuth 2.0 Authorization Code Flow with Proof Key for Code Exchange (PKCE)—no backend client secrets required.
* **Playlist Customization**: Preview audio clips, swap alternate track matches, reorder sequences, and remove unwanted entries before export.
* **Direct Export**: Write public or private playlists directly to authenticated Spotify accounts.
* **Minimalist Interface**: High-performance, dark-mode UI built on Next.js 15, React 19, and Tailwind CSS v4.

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| **Framework** | [Next.js 15+](https://nextjs.org/) (App Router) |
| **Runtime / Language** | [Node.js](https://nodejs.org/) / [TypeScript](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) |
| **Icons** | [Lucide React](https://lucide.react.dev/) |
| **Integration** | [Spotify Web API](https://developer.spotify.com/documentation/web-api) |

---

## Getting Started

### Prerequisites

* Node.js 18.x or later
* A Spotify account and a registered Spotify Developer application

---

### 1. Spotify App Configuration

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) and log in.
2. Click **Create app**.
3. Fill out the app details:
   - **App Name**: `String2Song` (or any name you prefer)
   - **App Description**: `Convert text into Spotify playlists`
   - **Redirect URIs**: 
     - For local development: `http://localhost:3000/callback` (or `http://127.0.0.1:3000/callback` if localhost doesn't work)
     - *(Ensure exact match, including protocol, port, and trailing path!)*
   - **Which API/SDKs are you planning to use?**: Select **Web API**.
4. Save the app and copy your **Client ID**.

> **Note on Developer Mode**:
> Applications in Development Mode can only authenticate users explicitly registered under **Settings > User Management** in the Spotify Dashboard. Add your personal account email before testing.

---

### 2. Local Installation

```bash
git clone https://github.com/Git-Dileep/String2Song.git
cd String2Song
npm install

```

Configure local environment variables:

```bash
cp .env.example .env.local

```

Update `.env.local` with your credentials:

```env
NEXT_PUBLIC_SPOTIFY_CLIENT_ID=your_spotify_client_id_here
NEXT_PUBLIC_REDIRECT_URI=http://localhost:3000/callback
# Note: If localhost doesn't work in your browser, change this to http://127.0.0.1:3000/callback 
# Make sure it exactly matches the Redirect URI in your Spotify Dashboard!
```

---

### 3. Development Server

```bash
npm run dev

```

Open [http://localhost:3000](http://localhost:3000) or [http://127.0.0.1:3000](http://127.0.0.1:3000) in your browser.

---

## OAuth Scopes

String2Song requests minimal viable scopes:

* `user-read-private`: Retrieves Spotify user ID for playlist ownership.
* `playlist-modify-public`: Enables creating and modifying public playlists.
* `playlist-modify-private`: Enables creating and modifying private playlists.

---

## Project Structure

```
String2Song/
├── src/
│   ├── app/
│   │   ├── callback/        # OAuth redirect and token exchange
│   │   ├── layout.tsx       # Root layout configuration
│   │   ├── page.tsx         # Core application interface
│   │   └── globals.css      # Base styling and design tokens
│   └── lib/
│       ├── presets.ts       # Text template definitions
│       ├── spotify-api.ts   # Spotify Web API client methods
│       └── spotify-auth.ts  # PKCE authorization flow utilities
├── public/                  # Static assets
├── .env.example             # Environment variable template
├── package.json
└── README.md

```

---

## Contributing

Open issues and pull requests via the [GitHub issue tracker](https://github.com/Git-Dileep/String2Song/issues).

---

## License

This project is licensed under the MIT License. See `LICENSE` for details.
