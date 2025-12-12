# Top 2000 naar Spotify Afspeellijst

Zet je NPO Radio 2 Top 2000 stemlijst om in een Spotify afspeellijst met één klik!

🌐 **Live Demo:** [https://hiddes03.github.io/Top-2000-stemlijst-naar-Spotify-playlist/](https://hiddes03.github.io/Top-2000-stemlijst-naar-Spotify-playlist/)

## Functies

- 🎵 Verwerk NPO Radio 2 Top 2000 inzending links
- 🔍 Zoek automatisch naar nummers op Spotify
- 📝 Maak een afspeellijst direct in je Spotify account
- 🚀 Volledig statische HTML/CSS/JavaScript website gehost op GitHub Pages
- ⚡ Geen build proces nodig - werkt direct in de browser

## Hoe te gebruiken

1. Bezoek de live applicatie: **[https://hiddes03.github.io/Top-2000-stemlijst-naar-Spotify-playlist/](https://hiddes03.github.io/Top-2000-stemlijst-naar-Spotify-playlist/)**
2. Klik op "Verbind en Maak Afspeellijst" om eerst met Spotify te verbinden
3. Na authenticatie, ga naar de [NPO Radio 2 Top 2000 stem-site](https://www.nporadio2.nl/nieuws/top2000/506d8c59-55fd-4950-a4aa-14ad2250c273/stem-nu-voor-de-npo-radio-2-top-2000) en maak je lijst
4. Als je klaar bent met stemmen, ga naar de plek waar je je lijst hebt gedeeld en kopieer de link van je inzending (ziet eruit als: `https://npo.nl/luister/stem/npo-radio-2-top-2000-2025/inzending/019ae423-5404-729d-818e-b85e011a546f`)
5. Plak de URL in het invoerveld op de website
6. Klik opnieuw op "Verbind en Maak Afspeellijst"
7. Je afspeellijst wordt aangemaakt en automatisch geopend!

## Spotify API Configuratie

Om deze applicatie te gebruiken, moet je je Spotify Client ID configureren:

1. Ga naar het [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Maak een nieuwe app aan
3. Voeg `https://hiddes03.github.io/Top-2000-stemlijst-naar-Spotify-playlist/` toe aan de Redirect URIs
4. Kopieer je Client ID
5. Bewerk `app.js` en vervang de lege `SPOTIFY_CLIENT_ID` variabele met je Client ID:
   ```javascript
   const SPOTIFY_CLIENT_ID = "your_client_id_here";
   ```

## Deployment naar GitHub Pages

### Optie 1: Directe Deployment (Aanbevolen)

Omdat dit een statische website is zonder build proces, kun je het direct deployen:

1. Push alle bestanden (`index.html`, `styles.css`, `app.js`) naar je repository
2. Ga naar je repository instellingen op GitHub
3. Navigeer naar de Pages sectie
4. Zet Source op "Deploy from a branch"
5. Selecteer de `main` branch en `/ (root)` folder
6. Klik op Save
7. Je site zal beschikbaar zijn op `https://hiddes03.github.io/Top-2000-stemlijst-naar-Spotify-playlist/`

### Optie 2: GitHub Actions gebruiken

Als je liever geautomatiseerde deployments wilt, maak dan `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: "."

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

## Lokale Ontwikkeling

Geen build tools of dependencies nodig! Simpelweg:

1. Clone de repository
2. Bewerk `app.js` om je Spotify Client ID toe te voegen
3. Open `index.html` in je browser of gebruik een lokale server:

   ```bash
   # Met Python
   python -m http.server 8000

   # Met Node.js
   npx serve .
   ```

## Gebruikte Technologieën

- Vanilla JavaScript (ES6+)
- HTML5
- CSS3
- Spotify Web API (met PKCE authenticatie flow)
- NPO Radio 2 API
- GitHub Pages

## Licentie

MIT

---

# Top 2000 to Spotify Playlist Converter

Convert your NPO Radio 2 Top 2000 voting list to a Spotify playlist with just one click!

🌐 **Live Demo:** [https://hiddes03.github.io/Top-2000-stemlijst-naar-Spotify-playlist/](https://hiddes03.github.io/Top-2000-stemlijst-naar-Spotify-playlist/)

## Features

- 🎵 Parse NPO Radio 2 Top 2000 submission links
- 🔍 Automatically search for songs on Spotify
- 📝 Create a playlist directly in your Spotify account
- 🚀 Fully static HTML/CSS/JavaScript website hosted on GitHub Pages
- ⚡ No build process required - runs directly in the browser

## How to Use

1. Visit the live application: **[https://hiddes03.github.io/Top-2000-stemlijst-naar-Spotify-playlist/](https://hiddes03.github.io/Top-2000-stemlijst-naar-Spotify-playlist/)**
2. Click "Connect and Create Playlist" to first connect to Spotify
3. After authentication, go to the [NPO Radio 2 Top 2000 voting site](https://www.nporadio2.nl/nieuws/top2000/506d8c59-55fd-4950-a4aa-14ad2250c273/stem-nu-voor-de-npo-radio-2-top-2000) and create your list
4. When you're done voting, go to the place where you shared your list and copy the link of your submission (looks like: `https://npo.nl/luister/stem/npo-radio-2-top-2000-2025/inzending/019ae423-5404-729d-818e-b85e011a546f`)
5. Paste the URL into the input field on the website
6. Click "Connect and Create Playlist" again
7. Your playlist will be created and opened automatically!

## Spotify API Configuration

To use this application, you need to configure your Spotify Client ID:

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Add `https://hiddes03.github.io/Top-2000-stemlijst-naar-Spotify-playlist/` to the Redirect URIs
4. Copy your Client ID
5. Edit `app.js` and replace the empty `SPOTIFY_CLIENT_ID` variable with your Client ID:
   ```javascript
   const SPOTIFY_CLIENT_ID = "your_client_id_here";
   ```

## Deployment to GitHub Pages

### Option 1: Direct Deployment (Recommended)

Since this is a static website with no build process, you can deploy it directly:

1. Push all files (`index.html`, `styles.css`, `app.js`) to your repository
2. Go to your repository settings on GitHub
3. Navigate to Pages section
4. Set Source to "Deploy from a branch"
5. Select the `main` branch and `/ (root)` folder
6. Click Save
7. Your site will be available at `https://hiddes03.github.io/Top-2000-stemlijst-naar-Spotify-playlist/`

### Option 2: Using GitHub Actions

If you prefer automated deployments, create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: "."

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

## Local Development

No build tools or dependencies required! Simply:

1. Clone the repository
2. Edit `app.js` to add your Spotify Client ID
3. Open `index.html` in your browser or use a local server:

   ```bash
   # Using Python
   python -m http.server 8000

   # Using Node.js
   npx serve .
   ```

## Technologies Used

- Vanilla JavaScript (ES6+)
- HTML5
- CSS3
- Spotify Web API (with PKCE authentication flow)
- NPO Radio 2 API
- GitHub Pages

## License

MIT
