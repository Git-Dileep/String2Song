# 🎵 String2Song — Text to Spotify Playlist Converter

Transform any text, poem, story, mood description, or word list into a curated Spotify playlist! **String2Song** parses your input, matches words and phrases to songs on Spotify, and exports a customized playlist directly to your Spotify account with a single click.

![String2Song Banner](https://raw.githubusercontent.com/Git-Dileep/String2Song/main/public/banner.png)

---

## ✨ Features

- 📝 **Text-to-Playlist Generation**: Paste lyrics, book passages, shower thoughts, or lists of song titles.
- ⚡ **Instant Spotify Search & Matching**: Performs intelligent track matching using Spotify's web API.
- 🎨 **Custom Preset Themes**: Choose from pre-configured text presets (Chill Vibes, Workout Hype, Retro Synth, Lofi Study, etc.).
- 🔒 **Secure PKCE Authentication**: Uses Spotify OAuth 2.0 Authorization Code Flow with PKCE — no client secrets exposed.
- 🎧 **Interactive Track List**: Reorder tracks, preview audio clips, swap alternative matches, or remove unwanted songs.
- 🚀 **Direct Spotify Export**: Create public or private playlists directly on your Spotify account.
- 💻 **Modern Glassmorphism Design**: Sleek dark mode visual aesthetics built with Next.js 15+, React 19, and Tailwind CSS v4.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.react.dev/)
- **API**: [Spotify Web API](https://developer.spotify.com/documentation/web-api)

---

## 🚀 Quick Start Guide

### 1. Prerequisites

- [Node.js](https://nodejs.org/) v18.x or higher
- A Spotify account & a Spotify Developer App

---

### 2. Set Up Your Spotify Developer App

To connect String2Song to Spotify:

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) and log in.
2. Click **Create app**.
3. Fill out the app details:
   - **App Name**: `String2Song` (or any name you prefer)
   - **App Description**: `Convert text into Spotify playlists`
   - **Redirect URIs**: 
     - For local development: `http://localhost:3000/callback`
     - *(Ensure exact match, including protocol, port, and trailing path!)*
   - **Which API/SDKs are you planning to use?**: Select **Web API**.
4. Save the app and copy your **Client ID**.

> 💡 **Important Note for Development Mode**:
> Spotify Developer Apps default to **Development Mode**. Only accounts added under **Settings -> User Management** in your Spotify Dashboard can create playlists until your app is requested for extension. Make sure your Spotify email is listed under User Management!

---

### 3. Installation & Setup

Clone the repository and install dependencies:

```bash
# Clone the repository
git clone https://github.com/Git-Dileep/String2Song.git
cd String2Song

# Install dependencies
npm install
```

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Open `.env.local` and add your Spotify Client ID:

```env
NEXT_PUBLIC_SPOTIFY_CLIENT_ID=your_spotify_client_id_here
NEXT_PUBLIC_REDIRECT_URI=http://localhost:3000/callback
```

---

### 4. Run the Application

Start the local development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Permissions & Scopes Required

String2Song requests the following Spotify permission scopes:
- `user-read-private`: Fetch user profile information (User ID & display name)
- `playlist-modify-public`: Create public playlists on user's behalf
- `playlist-modify-private`: Create private playlists on user's behalf

---

## 📂 Project Structure

```
String2Song/
├── src/
│   ├── app/
│   │   ├── callback/      # OAuth callback handler
│   │   ├── layout.tsx     # Root layout & font setup
│   │   ├── page.tsx       # Main app interface
│   │   └── globals.css    # Global CSS & theme setup
│   └── lib/
│       ├── presets.ts     # Preset text templates
│       ├── spotify-api.ts # Spotify API wrappers & endpoints
│       └── spotify-auth.ts# PKCE Auth helper functions
├── public/                # Static assets & icons
├── .env.example           # Example environment variables
├── package.json
└── README.md
```

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!  
Feel free to check the [issues page](https://github.com/Git-Dileep/String2Song/issues).

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more details.
