// Configuration - Replace with your Spotify Client ID
const SPOTIFY_CLIENT_ID = '85433013fad94ad6815d46f523e92768'; // Add your Spotify Client ID here
const SPOTIFY_REDIRECT_URI = window.location.origin + window.location.pathname;
const SPOTIFY_AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
const SPOTIFY_SCOPES = 'playlist-modify-public playlist-modify-private';

// State
let npoLink = '';
let loading = false;
let error = '';
let success = '';
let songs = [];
let accessToken = '';

// DOM Elements
const npoLinkInput = document.getElementById('npo-link-input');
const startButton = document.getElementById('start-button');
const inputForm = document.getElementById('input-form');
const errorMessageDiv = document.getElementById('error-message');
const successMessageDiv = document.getElementById('success-message');
const songsSection = document.getElementById('songs-section');
const songsList = document.getElementById('songs-list');
const songsCount = document.getElementById('songs-count');
const configWarning = document.getElementById('config-warning');
const spotifyConnected = document.getElementById('spotify-connected');
const loadingOverlay = document.getElementById('loading-overlay');
const loadingText = document.getElementById('loading-text');
const loadingProgress = document.getElementById('loading-progress');

// Utility Functions
function generateRandomString(length) {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const values = crypto.getRandomValues(new Uint8Array(length));
    return values.reduce((acc, x) => acc + possible[x % possible.length], '');
}

async function sha256(plain) {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    return window.crypto.subtle.digest('SHA-256', data);
}

function base64encode(input) {
    return btoa(String.fromCharCode(...new Uint8Array(input)))
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
}

function setLoading(isLoading, text = 'Bezig...', progress = '') {
    loading = isLoading;
    startButton.disabled = isLoading;
    npoLinkInput.disabled = isLoading;
    loadingOverlay.style.display = isLoading ? 'flex' : 'none';
    loadingText.textContent = text;
    loadingProgress.textContent = progress;
}

function showError(message) {
    error = message;
    errorMessageDiv.innerHTML = `<strong>Fout:</strong> ${message}`;
    errorMessageDiv.style.display = 'block';
    successMessageDiv.style.display = 'none';
}

function showSuccess(message) {
    success = message;
    successMessageDiv.innerHTML = `<strong>Gelukt:</strong> ${message}`;
    successMessageDiv.style.display = 'block';
    errorMessageDiv.style.display = 'none';
}

function hideMessages() {
    errorMessageDiv.style.display = 'none';
    successMessageDiv.style.display = 'none';
}

function updateSpotifyConnectionStatus() {
    if (accessToken) {
        spotifyConnected.style.display = 'block';
    } else {
        spotifyConnected.style.display = 'none';
    }
}

// Authentication Functions
async function exchangeCodeForToken(code, codeVerifier) {
    const params = new URLSearchParams({
        client_id: SPOTIFY_CLIENT_ID,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: SPOTIFY_REDIRECT_URI,
        code_verifier: codeVerifier,
    });

    try {
        console.log('🔄 Exchanging authorization code for access token...');
        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('❌ Token exchange failed:', errorData);
            throw new Error(`Failed to exchange code for token: ${errorData.error_description || errorData.error}`);
        }

        const data = await response.json();
        console.log('✅ Successfully obtained access token');
        accessToken = data.access_token;
        localStorage.removeItem('code_verifier');
        
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
        updateSpotifyConnectionStatus();
        
        // Check if we have a pending link to process
        const pendingLink = localStorage.getItem('pending_npo_link');
        if (pendingLink) {
            localStorage.removeItem('pending_npo_link');
            npoLinkInput.value = pendingLink;
            // Start the process automatically
            setTimeout(() => startFullProcess(), 500);
        } else {
            showSuccess('Succesvol verbonden met Spotify! Je kunt nu je afspeellijst maken.');
        }
    } catch (err) {
        showError(`Failed to authenticate with Spotify: ${err.message}`);
        console.error('Token exchange error:', err);
        localStorage.removeItem('code_verifier');
    }
}

async function authenticateSpotify(pendingLink = null) {
    if (!SPOTIFY_CLIENT_ID) {
        showError('Spotify Client ID is niet geconfigureerd. Bekijk de setup-instructies in de README.');
        return;
    }

    // Save the link for after authentication
    if (pendingLink) {
        localStorage.setItem('pending_npo_link', pendingLink);
    }

    const codeVerifier = generateRandomString(64);
    const hashed = await sha256(codeVerifier);
    const codeChallenge = base64encode(hashed);

    localStorage.setItem('code_verifier', codeVerifier);

    const authUrl = `${SPOTIFY_AUTH_ENDPOINT}?client_id=${SPOTIFY_CLIENT_ID}&redirect_uri=${encodeURIComponent(SPOTIFY_REDIRECT_URI)}&scope=${encodeURIComponent(SPOTIFY_SCOPES)}&response_type=code&code_challenge_method=S256&code_challenge=${codeChallenge}&show_dialog=true`;
    window.location.href = authUrl;
}

// NPO Fetching Functions
async function fetchSongsFromNPO(url) {
    setLoading(true, 'Nummers ophalen van NPO...');
    hideMessages();
    songs = [];
    songsSection.style.display = 'none';

    try {
        console.log('🔍 Fetching submission page:', url);

        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
        console.log('🔄 Using CORS proxy:', proxyUrl);

        const response = await fetch(proxyUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        if (!response.ok) {
            console.error('❌ HTTP Error:', response.status, response.statusText);
            throw new Error(`Kon de inzending niet ophalen (${response.status}). De link is mogelijk ongeldig of verlopen.`);
        }

        const html = await response.text();
        console.log('📄 HTML length:', html.length);
        console.log('📄 First 500 chars:', html.substring(0, 500));

        // Look for __NEXT_DATA__ script tag
        const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s);
        if (nextDataMatch) {
            console.log('✅ Found __NEXT_DATA__ script tag');
            try {
                const nextData = JSON.parse(nextDataMatch[1]);
                console.log('📦 __NEXT_DATA__ structure:', JSON.stringify(nextData, null, 2));
            } catch (e) {
                console.error('❌ Failed to parse __NEXT_DATA__:', e);
            }
        } else {
            console.log('⚠️ No __NEXT_DATA__ script tag found');
        }

        // Look for self.__next_f.push blocks
        const pushBlocks = html.match(/self\.__next_f\.push\(\[.*?\]\)/g);
        if (!pushBlocks) {
            throw new Error('Kon geen Next.js data vinden op de pagina. De paginastructuur is mogelijk gewijzigd.');
        }

        console.log(`✅ Found ${pushBlocks.length} self.__next_f.push blocks`);
        
        let blocksWithSongs = [];
        for (let i = 0; i < pushBlocks.length; i++) {
            const block = pushBlocks[i];
            const hasArtist = block.includes('artist');
            const hasTitle = block.includes('title');
            const hasTracks = block.includes('tracks');
            
            if (hasArtist && hasTitle) {
                console.log(`📋 Block ${i}: length=${block.length}, hasArtist=${hasArtist}, hasTitle=${hasTitle}, hasTracks=${hasTracks}`);
                blocksWithSongs.push(i);
            }
        }
        
        console.log(`🎵 Blocks with song data: ${blocksWithSongs.join(', ')}`);
        
        let extractedSongs = [];
        for (let i = 0; i < pushBlocks.length; i++) {
            const block = pushBlocks[i];
            
            if (!block.includes('artist') || !block.includes('title')) {
                continue;
            }
            
            console.log(`🎵 Processing block ${i} for song extraction`);
            console.log('🎵 Block length:', block.length);
            console.log('🎵 Block preview (first 1000):', block.substring(0, 1000));
            
            try {
                const trackPattern = /\{[^}]*?"artist"[^}]*?"title"[^}]*?\}/g;
                const trackMatches = block.match(trackPattern);
                
                if (!trackMatches) {
                    console.log('⚠️ No track objects found with simple pattern, trying alternative...');
                    
                    const escapedPattern = /\{\\"artist\\":\\"([^"]+)\\",.*?\\"title\\":\\"([^"]+)\\"/g;
                    let match;
                    const tracks = [];
                    while ((match = escapedPattern.exec(block)) !== null) {
                        tracks.push({
                            artist: match[1],
                            title: match[2]
                        });
                    }
                    
                    if (tracks.length > 0) {
                        console.log(`✅ Extracted ${tracks.length} songs using escaped pattern`);
                        extractedSongs = tracks;
                        break;
                    }
                    continue;
                }
                
                console.log(`🔍 Found ${trackMatches.length} potential track objects`);
                
                const tracks = [];
                for (const trackStr of trackMatches) {
                    try {
                        let cleaned = trackStr.replace(/\\\\/g, '\\').replace(/\\"/g, '"');
                        const track = JSON.parse(cleaned);
                        
                        if (track.artist && track.title) {
                            tracks.push({
                                artist: track.artist,
                                title: track.title
                            });
                        }
                    } catch (e) {
                        const artistMatch = trackStr.match(/"artist"\s*:\s*"([^"]+)"/);
                        const titleMatch = trackStr.match(/"title"\s*:\s*"([^"]+)"/);
                        
                        if (artistMatch && titleMatch) {
                            tracks.push({
                                artist: artistMatch[1],
                                title: titleMatch[1]
                            });
                        }
                    }
                }
                
                if (tracks.length > 0) {
                    console.log(`✅ Extracted ${tracks.length} songs from track objects`);
                    extractedSongs = tracks;
                    break;
                }
            } catch (e) {
                console.error('❌ Error parsing tracks:', e);
            }
        }
        
        if (extractedSongs.length === 0) {
            throw new Error('Kon geen nummers vinden in de inzending. De pagina bevat mogelijk geen geldige inzending.');
        }

        console.log('🎵 Final extracted songs:', extractedSongs);
        songs = extractedSongs;
        displaySongs();
        return true;
    } catch (err) {
        showError(err.message || 'Er is een fout opgetreden bij het ophalen van de nummers.');
        console.error('❌ Error:', err);
        setLoading(false);
        throw err;
    }
}

// Spotify Functions
async function searchSpotifyTrack(title, artist, token) {
    const query = encodeURIComponent(`${title} ${artist}`);
    const response = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=track&limit=1`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error('Zoeken op Spotify mislukt');
    }

    const data = await response.json();
    if (data.tracks && data.tracks.items.length > 0) {
        return data.tracks.items[0].uri;
    }
    return null;
}

async function findExistingPlaylist(userId, playlistName) {
    let offset = 0;
    const limit = 50;
    
    while (true) {
        const response = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists?limit=${limit}&offset=${offset}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        const existingPlaylist = data.items.find(p => p.name === playlistName);
        
        if (existingPlaylist) {
            return existingPlaylist;
        }
        
        if (data.items.length < limit) {
            break;
        }
        
        offset += limit;
    }
    
    return null;
}

async function getExistingPlaylistTracks(playlistId) {
    const trackUris = [];
    let offset = 0;
    const limit = 100;
    
    while (true) {
        const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=${limit}&offset=${offset}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            return trackUris;
        }

        const data = await response.json();
        trackUris.push(...data.items.map(item => item.track.uri));
        
        if (data.items.length < limit) {
            break;
        }
        
        offset += limit;
    }
    
    return trackUris;
}

async function createOrUpdateSpotifyPlaylist() {
    if (songs.length === 0) {
        showError('Haal eerst nummers op van NPO.');
        return;
    }

    setLoading(true, 'Spotify profiel ophalen...');
    hideMessages();

    try {
        // Get user profile
        const profileResponse = await fetch('https://api.spotify.com/v1/me', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!profileResponse.ok) {
            throw new Error('Kon Spotify gebruikersprofiel niet ophalen. Log opnieuw in.');
        }

        const profile = await profileResponse.json();
        const playlistName = `NPO Radio 2 Top 2000 - ${new Date().getFullYear()}`;

        // Check if playlist already exists
        setLoading(true, 'Bestaande afspeellijst zoeken...');
        let playlist = await findExistingPlaylist(profile.id, playlistName);
        let existingTrackUris = [];
        
        if (playlist) {
            console.log('✅ Found existing playlist:', playlist.name);
            setLoading(true, 'Bestaande nummers ophalen...');
            existingTrackUris = await getExistingPlaylistTracks(playlist.id);
            console.log(`📋 Playlist has ${existingTrackUris.length} existing tracks`);
        } else {
            // Create new playlist
            setLoading(true, 'Nieuwe afspeellijst aanmaken...');
            const playlistResponse = await fetch(`https://api.spotify.com/v1/users/${profile.id}/playlists`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: playlistName,
                    description: 'Gegenereerd van NPO Radio 2 Top 2000 stem-inzending',
                    public: false
                })
            });

            if (!playlistResponse.ok) {
                throw new Error('Kon Spotify afspeellijst niet aanmaken.');
            }

            playlist = await playlistResponse.json();
            console.log('✅ Created new playlist:', playlist.name);
        }

        // Search for tracks
        setLoading(true, 'Nummers zoeken op Spotify...', '0/' + songs.length);
        const trackUris = [];
        let foundCount = 0;
        
        for (let i = 0; i < songs.length; i++) {
            const song = songs[i];
            try {
                const uri = await searchSpotifyTrack(song.title, song.artist, accessToken);
                if (uri) {
                    // Only add if not already in playlist
                    if (!existingTrackUris.includes(uri)) {
                        trackUris.push(uri);
                    }
                    foundCount++;
                }
            } catch {
                console.warn(`Niet gevonden: ${song.title} van ${song.artist}`);
            }
            
            if ((i + 1) % 10 === 0 || i === songs.length - 1) {
                setLoading(true, 'Nummers zoeken op Spotify...', `${i + 1}/${songs.length}`);
            }
        }

        if (trackUris.length === 0 && existingTrackUris.length === 0) {
            throw new Error('Kon geen nummers vinden op Spotify.');
        }

        // Add new tracks to playlist
        if (trackUris.length > 0) {
            setLoading(true, 'Nummers toevoegen aan afspeellijst...', `${trackUris.length} nieuwe nummers`);
            for (let i = 0; i < trackUris.length; i += 100) {
                const chunk = trackUris.slice(i, i + 100);
                await fetch(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        uris: chunk
                    })
                });
            }
        }

        setLoading(false);
        
        if (existingTrackUris.length > 0 && trackUris.length > 0) {
            showSuccess(`${trackUris.length} nieuwe nummers toegevoegd! Totaal ${foundCount} van ${songs.length} nummers gevonden op Spotify.`);
        } else if (existingTrackUris.length > 0) {
            showSuccess(`Alle nummers staan al in de afspeellijst! Totaal ${existingTrackUris.length} nummers.`);
        } else {
            showSuccess(`Afspeellijst aangemaakt! ${foundCount} van ${songs.length} nummers gevonden op Spotify.`);
        }
        
        // Open playlist in Spotify
        window.open(playlist.external_urls.spotify, '_blank');
    } catch (err) {
        showError(err.message || 'Er is een fout opgetreden bij het maken van de afspeellijst.');
        console.error('Error:', err);
        setLoading(false);
    }
}

// Display Functions
function displaySongs() {
    songsList.innerHTML = '';
    songsCount.textContent = songs.length;
    
    const displayCount = Math.min(10, songs.length);
    for (let i = 0; i < displayCount; i++) {
        const song = songs[i];
        const songItem = document.createElement('div');
        songItem.className = 'song-item';
        songItem.innerHTML = `<strong>${song.title}</strong> - ${song.artist}`;
        songsList.appendChild(songItem);
    }
    
    if (songs.length > 10) {
        const moreItem = document.createElement('div');
        moreItem.className = 'song-item more';
        moreItem.textContent = `... en ${songs.length - 10} meer nummers`;
        songsList.appendChild(moreItem);
    }
    
    songsSection.style.display = 'block';
}

// Main workflow function
async function startFullProcess() {
    const link = npoLinkInput.value.trim();
    if (!link) {
        showError('Voer eerst een NPO link in.');
        return;
    }

    // Check if authenticated
    if (!accessToken) {
        authenticateSpotify(link);
        return;
    }

    try {
        // Fetch songs
        await fetchSongsFromNPO(link);
        
        // Create/update playlist
        await createOrUpdateSpotifyPlaylist();
    } catch (err) {
        // Error already shown by individual functions
        console.error('Process error:', err);
    }
}

// Event Listeners
inputForm.addEventListener('submit', (e) => {
    e.preventDefault();
    startFullProcess();
});

// Initialize
function init() {
    // Check for Spotify Client ID
    if (!SPOTIFY_CLIENT_ID) {
        configWarning.style.display = 'block';
    }

    // Get access token from URL query params after Spotify redirect
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
        console.log('📝 Authorization code received:', code.substring(0, 20) + '...');
        const codeVerifier = localStorage.getItem('code_verifier');
        if (codeVerifier) {
            console.log('✅ Code verifier found in localStorage');
            exchangeCodeForToken(code, codeVerifier);
        } else {
            console.error('❌ Code verifier not found in localStorage');
            showError('Authenticatie sessie verlopen. Probeer opnieuw verbinding te maken met Spotify.');
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }

    updateSpotifyConnectionStatus();
}

// Run initialization when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
