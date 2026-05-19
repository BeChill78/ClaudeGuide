// ============================================================
// NOMADE — Guide de voyage IA — app.js
// ============================================================

const App = {
  state: {
    apiKey: '',
    currentTour: null,   // { destination, theme, format, duration, pois: [] }
    currentPoiIndex: -1,
    userPosition: null,
    speechSynth: window.speechSynthesis,
    currentUtterance: null,
    isPlaying: false,
    chatHistory: [],     // { role, content } for current poi
    watchId: null,
    history: [],         // saved tours
    voices: [],
  },

  // ============================================================
  // INIT
  // ============================================================
  init() {
    this.loadSettings();
    this.loadHistory();
    this.loadVoices();
    this.bindHome();
    this.bindSettings();
    this.showScreen('home');
  },

  loadSettings() {
    this.state.apiKey = localStorage.getItem('nomade_api_key') || '';
  },

  loadHistory() {
    try {
      this.state.history = JSON.parse(localStorage.getItem('nomade_history') || '[]');
    } catch { this.state.history = []; }
  },

  saveHistory() {
    localStorage.setItem('nomade_history', JSON.stringify(this.state.history.slice(0, 20)));
  },

  loadVoices() {
    const load = () => {
      const voices = this.state.speechSynth.getVoices();
      this.state.voices = voices;
    };
    load();
    this.state.speechSynth.onvoiceschanged = load;
  },

  getFrenchVoice() {
    const voices = this.state.voices;
    // Priorité : voix française de qualité
    const preferred = ['Thomas', 'Amelie', 'Marie', 'French'];
    for (const name of preferred) {
      const v = voices.find(v => v.name.includes(name) && v.lang.startsWith('fr'));
      if (v) return v;
    }
    // Fallback : n'importe quelle voix fr
    const frVoice = voices.find(v => v.lang.startsWith('fr'));
    if (frVoice) return frVoice;
    // Dernier fallback : première voix disponible
    return voices[0] || null;
  },

  // ============================================================
  // NAVIGATION
  // ============================================================
  showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById('screen-' + id);
    if (target) target.classList.add('active');
  },

  // ============================================================
  // HOME SCREEN
  // ============================================================
  bindHome() {
    // Theme buttons
    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // Format buttons
    document.querySelectorAll('.format-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.format-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // Generate
    document.getElementById('btn-generate').addEventListener('click', () => this.startGeneration());

    // Settings icon
    document.getElementById('btn-open-settings').addEventListener('click', () => this.showSettingsScreen());

    // History
    this.renderHistory();
  },

  getSelectedTheme() {
    const active = document.querySelector('.theme-btn.active');
    return active ? active.dataset.theme : 'histoire';
  },

  getSelectedFormat() {
    const active = document.querySelector('.format-btn.active');
    return active ? active.dataset.format : 'dense';
  },

  renderHistory() {
    const container = document.getElementById('history-list');
    if (!container) return;
    if (!this.state.history.length) {
      container.innerHTML = '<div class="empty-state">Aucune visite enregistrée</div>';
      return;
    }
    container.innerHTML = this.state.history.map((h, i) => `
      <div class="history-item" onclick="App.loadHistoryTour(${i})">
        <div class="history-dest">${h.destination}</div>
        <div class="history-meta">${h.theme} · ${h.duration}h · ${h.pois.length} lieux · ${h.date}</div>
      </div>
    `).join('');
  },

  loadHistoryTour(index) {
    const tour = this.state.history[index];
    if (!tour) return;
    this.state.currentTour = tour;
    this.state.currentPoiIndex = -1;
    this.initMap();
    this.showScreen('map');
  },

  // ============================================================
  // GENERATION
  // ============================================================
  async startGeneration() {
    if (!this.state.apiKey) {
      this.toast('Clé API manquante — va dans les réglages', 'error');
      this.showSettingsScreen();
      return;
    }

    const dest = document.getElementById('input-destination').value.trim();
    if (!dest) {
      this.toast('Indique une destination', 'error');
      return;
    }

    const duration = parseFloat(document.getElementById('input-duration').value);
    const theme = this.getSelectedTheme();
    const format = this.getSelectedFormat();

    this.showScreen('loading');
    this.setLoadingStep(0);

    try {
      // Step 1 : localiser la destination
      this.setLoadingStep(0);
      const coords = await this.geocodeDestination(dest);

      // Step 2 : générer les POI via Claude
      this.setLoadingStep(1);
      const pois = await this.generatePOIs(dest, duration, theme, format);

      // Step 3 : géocoder chaque POI
      this.setLoadingStep(2);
      for (const poi of pois) {
        const c = await this.geocodePOI(poi.nom, dest);
        poi.lat = c.lat;
        poi.lng = c.lng;
        poi.visited = false;
      }

      // Step 4 : initialiser la carte
      this.setLoadingStep(3);
      const tour = {
        destination: dest,
        theme, format, duration,
        centerLat: coords.lat,
        centerLng: coords.lng,
        pois,
        date: new Date().toLocaleDateString('fr-FR')
      };
      this.state.currentTour = tour;
      this.state.currentPoiIndex = -1;
      this.state.chatHistory = [];

      // Sauvegarder
      this.state.history.unshift(tour);
      this.saveHistory();
      this.renderHistory();

      await new Promise(r => setTimeout(r, 400));
      this.initMap();
      this.showScreen('map');

    } catch (err) {
      console.error(err);
      this.toast('Erreur : ' + err.message, 'error');
      this.showScreen('home');
    }
  },

  setLoadingStep(index) {
    document.querySelectorAll('.loading-step').forEach((el, i) => {
      el.classList.remove('active', 'done');
      if (i < index) el.classList.add('done');
      if (i === index) el.classList.add('active');
    });
  },

  async geocodeDestination(dest) {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(dest)}&format=json&limit=1`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'fr' } });
    const data = await res.json();
    if (!data.length) throw new Error(`Destination introuvable : ${dest}`);
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  },

  async geocodePOI(name, city) {
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(name + ' ' + city)}&format=json&limit=1`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'fr' } });
      const data = await res.json();
      if (data.length) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lng || data[0].lon) };
    } catch {}
    // Fallback : léger offset aléatoire autour du centre si géocodage échoue
    const tour = this.state.currentTour;
    return {
      lat: tour.centerLat + (Math.random() - 0.5) * 0.02,
      lng: tour.centerLng + (Math.random() - 0.5) * 0.02
    };
  },

  async generatePOIs(destination, duration, theme, format) {
    const nbPois = Math.max(3, Math.min(10, Math.round(duration * 2.5)));
    const themeLabels = {
      histoire: 'histoire, architecture, patrimoine',
      gastro: 'gastronomie, marchés, bars et restaurants locaux authentiques',
      mixte: 'histoire, culture et gastronomie',
      nature: 'parcs, jardins, points de vue et espaces naturels',
    };
    const formatInstr = format === 'dense'
      ? 'La description audio doit être courte et dense (60-90 mots), style guide expert, sans fioritures.'
      : 'La description audio doit être narrative et immersive (180-220 mots), avec une anecdote ou un fait méconnu.';

    const prompt = `Tu es un expert voyageur francophone, consultant pour un guide de voyage haut de gamme. Tu connais ${destination} comme un local expérimenté.

Génère exactement ${nbPois} points d'intérêt pour une visite à pied de ${duration} heure(s) à ${destination}, thème : ${themeLabels[theme]}.

RÈGLES STRICTES :
- ZÉRO lieu pièges à touristes, ZÉRO attrape-touriste évident
- Privilégie les lieux conseillés par des voyageurs expérimentés, des guides spécialisés (Lonely Planet, Wallpaper Guide, etc.), des blogueurs de voyage reconnus
- Chaque lieu doit avoir un vrai intérêt : histoire forte, qualité exceptionnelle, ambiance unique
- Indique le niveau de fréquentation touristique réel : faible / moyen / élevé
- Inclus le meilleur moment pour visiter (heure, saison)
- Un conseil pratique non-évident (ce que font les locaux, ce qu'éviter)

${formatInstr}

Réponds UNIQUEMENT avec un JSON valide, sans markdown, sans explication :
{
  "pois": [
    {
      "nom": "Nom exact du lieu",
      "type": "emoji représentatif (1 seul)",
      "frequentation": "faible|moyen|élevé",
      "meilleur_moment": "ex: tôt le matin avant 9h",
      "description": "texte du guide audio en français",
      "conseil_local": "conseil pratique non-évident",
      "source_recommendation": "ex: Lonely Planet, forum Tripadvisor avancé, etc."
    }
  ]
}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.state.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || 'Erreur API Claude');
    }

    const data = await response.json();
    const text = data.content[0].text.trim();

    // Parse JSON robuste
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Réponse IA invalide');
    const parsed = JSON.parse(jsonMatch[0]);
    return parsed.pois;
  },

  // ============================================================
  // MAP
  // ============================================================
  map: null,
  markers: [],
  userMarker: null,

  initMap() {
    // Détruire la carte existante
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    this.markers = [];

    const tour = this.state.currentTour;
    const mapEl = document.getElementById('map');

    this.map = L.map(mapEl, {
      center: [tour.centerLat, tour.centerLng],
      zoom: 15,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(this.map);

    // Placer les marqueurs
    tour.pois.forEach((poi, index) => {
      const el = document.createElement('div');
      el.className = 'poi-marker';
      el.textContent = poi.type || (index + 1);
      el.addEventListener('click', () => this.selectPOI(index));

      const marker = L.marker([poi.lat, poi.lng], {
        icon: L.divIcon({
          html: el.outerHTML,
          className: '',
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        })
      }).addTo(this.map);

      this.markers.push({ marker, el });
    });

    // Mettre à jour l'UI map
    document.getElementById('map-destination').textContent = tour.destination;
    document.getElementById('map-meta').textContent =
      `${tour.pois.length} lieux · ${tour.theme} · ${tour.duration}h`;

    // Rendre la strip des POI
    this.renderPoiStrip();

    // Binder les boutons map
    this.bindMapControls();

    // Démarrer le GPS
    this.startGPS();
  },

  renderPoiStrip() {
    const strip = document.getElementById('poi-strip');
    const tour = this.state.currentTour;
    strip.innerHTML = tour.pois.map((poi, i) => `
      <div class="poi-chip ${poi.visited ? 'visited' : ''}" id="chip-${i}" onclick="App.selectPOI(${i})">
        <span class="chip-icon">${poi.type || '📍'}</span>
        <span class="chip-num">${i + 1}</span>
        <span>${poi.nom.split(' ').slice(0, 3).join(' ')}</span>
      </div>
    `).join('');
  },

  selectPOI(index) {
    const tour = this.state.currentTour;
    const poi = tour.pois[index];
    if (!poi) return;

    this.state.currentPoiIndex = index;
    this.state.chatHistory = [];

    // Centrer la carte
    this.map.flyTo([poi.lat, poi.lng], 17, { duration: 0.8 });

    // Mettre à jour les chips
    document.querySelectorAll('.poi-chip').forEach((c, i) => {
      c.classList.toggle('active', i === index);
    });

    // Remplir la sheet
    this.renderPoiSheet(poi, index);
    document.getElementById('poi-sheet').classList.add('open');
    document.getElementById('poi-strip').style.display = 'none';
  },

  renderPoiSheet(poi, index) {
    const crowdClass = { 'faible': 'crowd-low', 'moyen': 'crowd-med', 'élevé': 'crowd-high' }[poi.frequentation] || '';
    const crowdLabel = { 'faible': '🟢 Peu fréquenté', 'moyen': '🟡 Fréquentation modérée', 'élevé': '🔴 Très touristique' }[poi.frequentation] || poi.frequentation;

    document.getElementById('poi-sheet-content').innerHTML = `
      <div class="poi-number">Lieu ${index + 1} sur ${this.state.currentTour.pois.length}</div>
      <div class="poi-name">${poi.nom}</div>
      <div class="poi-tags">
        <span class="poi-tag ${crowdClass}">${crowdLabel}</span>
        <span class="poi-tag">⏰ ${poi.meilleur_moment}</span>
        <span class="poi-tag">📚 ${poi.source_recommendation || 'Recommandé'}</span>
      </div>
      <div class="poi-description">${poi.description}</div>
      <div class="poi-tip">
        <strong>Conseil local</strong>
        ${poi.conseil_local}
      </div>
      <div class="poi-actions">
        <button class="btn-audio" id="btn-audio-poi" onclick="App.toggleAudio(${index})">
          <span>▶</span> Écouter le guide
        </button>
        <button class="btn-chat" onclick="App.openChat(${index})" title="Poser une question">💬</button>
      </div>
    `;
  },

  bindMapControls() {
    // Fermer la sheet
    document.getElementById('btn-close-sheet').addEventListener('click', () => {
      document.getElementById('poi-sheet').classList.remove('open');
      document.getElementById('poi-strip').style.display = 'flex';
      this.stopAudio();
    });

    // Bouton retour home
    document.getElementById('btn-map-home').addEventListener('click', () => {
      this.stopAudio();
      this.stopGPS();
      this.showScreen('home');
    });

    // Bouton localiser
    document.getElementById('btn-locate').addEventListener('click', () => {
      if (this.state.userPosition) {
        this.map.flyTo([this.state.userPosition.lat, this.state.userPosition.lng], 17);
      } else {
        this.toast('Position GPS non disponible');
      }
    });

    // Bouton réglages depuis map
    document.getElementById('btn-map-settings').addEventListener('click', () => {
      this.showSettingsScreen();
    });

    // Bouton stop audio bar
    document.getElementById('btn-audio-stop').addEventListener('click', () => {
      this.stopAudio();
    });
  },

  // ============================================================
  // GPS
  // ============================================================
  startGPS() {
    if (!navigator.geolocation) return;
    this.state.watchId = navigator.geolocation.watchPosition(
      pos => this.onPositionUpdate(pos),
      err => console.warn('GPS error:', err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );
  },

  stopGPS() {
    if (this.state.watchId !== null) {
      navigator.geolocation.clearWatch(this.state.watchId);
      this.state.watchId = null;
    }
  },

  onPositionUpdate(pos) {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;
    this.state.userPosition = { lat, lng };

    // Placer/déplacer le marqueur utilisateur
    if (!this.userMarker) {
      const el = document.createElement('div');
      el.className = 'user-marker';
      this.userMarker = L.marker([lat, lng], {
        icon: L.divIcon({
          html: el.outerHTML,
          className: '',
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        }),
        zIndexOffset: 1000
      }).addTo(this.map);
    } else {
      this.userMarker.setLatLng([lat, lng]);
    }
  },

  // ============================================================
  // AUDIO (TTS)
  // ============================================================
  toggleAudio(poiIndex) {
    if (this.state.isPlaying) {
      this.stopAudio();
      return;
    }
    this.playAudio(poiIndex);
  },

  playAudio(poiIndex) {
    const poi = this.state.currentTour?.pois[poiIndex];
    if (!poi) return;

    this.stopAudio();

    const text = `${poi.nom}. ${poi.description}`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    utterance.rate = 0.92;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    const voice = this.getFrenchVoice();
    if (voice) utterance.voice = voice;

    utterance.onstart = () => {
      this.state.isPlaying = true;
      this.updateAudioUI(true, poi.nom);
      poi.visited = true;
      this.renderPoiStrip();
    };

    utterance.onend = () => {
      this.state.isPlaying = false;
      this.updateAudioUI(false, '');
    };

    utterance.onerror = () => {
      this.state.isPlaying = false;
      this.updateAudioUI(false, '');
    };

    this.state.currentUtterance = utterance;
    this.state.speechSynth.speak(utterance);
  },

  stopAudio() {
    this.state.speechSynth.cancel();
    this.state.isPlaying = false;
    this.state.currentUtterance = null;
    this.updateAudioUI(false, '');
  },

  updateAudioUI(playing, poiName) {
    // Bouton dans la sheet
    const btn = document.getElementById('btn-audio-poi');
    if (btn) {
      btn.className = playing ? 'btn-audio playing' : 'btn-audio';
      btn.innerHTML = playing
        ? '<span>⏹</span> Arrêter'
        : '<span>▶</span> Écouter le guide';
    }
    // Barre audio flottante
    const bar = document.getElementById('audio-bar');
    if (bar) {
      bar.className = playing ? 'audio-bar visible' : 'audio-bar';
      if (playing) document.getElementById('audio-bar-name').textContent = poiName;
    }
  },

  // ============================================================
  // CHAT
  // ============================================================
  openChat(poiIndex) {
    const poi = this.state.currentTour?.pois[poiIndex];
    if (!poi) return;

    this.state.chatHistory = [];
    document.getElementById('chat-poi-name').textContent = poi.nom;
    document.getElementById('chat-messages').innerHTML = `
      <div class="msg assistant">
        <div class="msg-bubble">Bonjour. Je suis ton guide pour <strong>${poi.nom}</strong>. Qu'est-ce que tu veux savoir ?</div>
      </div>
    `;

    this.showScreen('chat');

    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('btn-send-chat');

    // Nettoyer les anciens listeners
    sendBtn.replaceWith(sendBtn.cloneNode(true));
    const newSend = document.getElementById('btn-send-chat');

    const send = () => {
      const msg = input.value.trim();
      if (!msg) return;
      input.value = '';
      this.sendChatMessage(poi, msg);
    };

    newSend.addEventListener('click', send);
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
    });

    document.getElementById('chat-back').addEventListener('click', () => {
      this.showScreen('map');
    });
  },

  async sendChatMessage(poi, userMessage) {
    // Afficher le message user
    const container = document.getElementById('chat-messages');
    container.innerHTML += `
      <div class="msg user"><div class="msg-bubble">${this.escapeHtml(userMessage)}</div></div>
    `;
    container.scrollTop = container.scrollHeight;

    // Ajouter à l'historique
    this.state.chatHistory.push({ role: 'user', content: userMessage });

    // Indicateur de frappe
    const typingId = 'typing-' + Date.now();
    container.innerHTML += `
      <div class="msg assistant" id="${typingId}">
        <div class="msg-bubble">…</div>
      </div>
    `;
    container.scrollTop = container.scrollHeight;

    try {
      const systemPrompt = `Tu es un guide de voyage expert francophone, spécialiste de ${this.state.currentTour.destination}. 
Tu guides le visiteur sur le lieu : ${poi.nom}. 
Description du lieu : ${poi.description}
Réponds de façon précise, courte (2-4 phrases max), en français, avec la voix d'un expert passionné, jamais condescendant.`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.state.apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 400,
          system: systemPrompt,
          messages: this.state.chatHistory
        })
      });

      const data = await response.json();
      const reply = data.content[0].text;

      this.state.chatHistory.push({ role: 'assistant', content: reply });

      // Remplacer l'indicateur
      const typingEl = document.getElementById(typingId);
      if (typingEl) typingEl.innerHTML = `<div class="msg-bubble">${this.escapeHtml(reply)}</div>`;
      container.scrollTop = container.scrollHeight;

    } catch (err) {
      const typingEl = document.getElementById(typingId);
      if (typingEl) typingEl.innerHTML = `<div class="msg-bubble" style="color:#e74c3c">Erreur : ${err.message}</div>`;
    }
  },

  // ============================================================
  // SETTINGS
  // ============================================================
  bindSettings() {
    document.getElementById('btn-settings-back').addEventListener('click', () => {
      this.showScreen('home');
    });

    document.getElementById('btn-save-key').addEventListener('click', () => {
      const key = document.getElementById('input-api-key').value.trim();
      if (!key.startsWith('sk-ant-')) {
        this.toast('Clé invalide (doit commencer par sk-ant-)', 'error');
        return;
      }
      this.state.apiKey = key;
      localStorage.setItem('nomade_api_key', key);
      this.updateKeyStatus();
      this.toast('Clé sauvegardée ✓', 'success');
    });

    document.getElementById('btn-clear-history').addEventListener('click', () => {
      if (confirm('Effacer tout l\'historique ?')) {
        this.state.history = [];
        this.saveHistory();
        this.renderHistory();
        this.toast('Historique effacé');
      }
    });
  },

  showSettingsScreen() {
    // Pré-remplir
    const keyInput = document.getElementById('input-api-key');
    if (this.state.apiKey) {
      keyInput.value = this.state.apiKey.slice(0, 12) + '••••••••••••••••';
      keyInput.dataset.filled = 'true';
      keyInput.addEventListener('focus', () => {
        if (keyInput.dataset.filled === 'true') {
          keyInput.value = '';
          keyInput.dataset.filled = 'false';
        }
      }, { once: true });
    }
    this.updateKeyStatus();
    this.showScreen('settings');
  },

  updateKeyStatus() {
    const el = document.getElementById('key-status');
    if (this.state.apiKey) {
      el.className = 'key-status ok';
      el.textContent = '✓ Clé configurée';
    } else {
      el.className = 'key-status missing';
      el.textContent = 'Clé API manquante';
    }
  },

  // ============================================================
  // UTILS
  // ============================================================
  toast(msg, type = '') {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.className = 'toast ' + type + ' show';
    setTimeout(() => el.className = 'toast ' + type, 2500);
  },

  escapeHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
