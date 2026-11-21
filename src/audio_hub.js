// Audio Studio & Customization Hub for Yandex Music
// Provides:
// 1. Cava audio spectrum visualizer (bottom columns)
// 2. Right-side Studio Hub (Headphones settings, Beautiful Equalizer, Theme & Customization)

(function () {
  'use strict';

  function initAudioHub() {
    if (typeof window !== 'undefined') {
      if (window.__ymAudioHubInitialized) return;
      window.__ymAudioHubInitialized = true;
    }
    const hasNode = typeof require === 'function';
    let fs = null, path = null, os = null, child_process = null, readline = null;
    if (hasNode) {
      try {
        fs = require('fs');
        path = require('path');
        os = require('os');
        child_process = require('child_process');
        readline = require('readline');
      } catch (e) {}
    }

    // Default settings
    const STORAGE_KEY = 'ym_studio_hub_settings_v1';
    let settings = {
      activeTab: 'eq', // 'headphones' | 'eq' | 'custom'
      headphoneProfile: 'tws',
      spatialAudio: true,
      spatialDepth: 45,
      bassBoost: true,
      bassAmount: 6,
      vocalClarity: true,
      vocalAmount: 40,
      balance: 0,
      eqPreset: 'rock',
      eqBands: [4, 2, -1, 1, 3, 5, 4], // 60, 150, 400, 1k, 2.5k, 6k, 15k
      preamp: 0,
      themeColor: '#ebbf89',
      cavaMode: 'bottom', // 'bottom' | 'top' | 'center' | 'hidden'
      cavaBars: 36,
      cavaSensitivity: 100,
      glassBlur: 24,
      glassOpacity: 88,
      vibeCloudMode: 'theme', // 'theme' | 'space' | 'minimal' | 'original'
      vibeCloudBrightness: 90,
      isOpen: false
    };

    try {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) settings = Object.assign(settings, JSON.parse(saved));
      }
    } catch (e) {}

    const saveSettings = () => {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        }
      } catch (e) {}
    };

    // Filter mapping & dynamic hue calculation for Vibe background animation cloud
    const getFilterForTheme = (colorHex) => {
      let h = 33;
      const hex = (colorHex || '#ebbf89').replace('#', '');
      if (hex.length === 6) {
        const r = parseInt(hex.slice(0, 2), 16) / 255;
        const g = parseInt(hex.slice(2, 4), 16) / 255;
        const b = parseInt(hex.slice(4, 6), 16) / 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let d = max - min;
        if (d > 0.001) {
          if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
          else if (max === g) h = ((b - r) / d + 2) * 60;
          else h = ((r - g) / d + 4) * 60;
        }
      }
      const hueRot = Math.round((h - 38 + 360) % 360);
      return `hue-rotate(${hueRot}deg) saturate(1.35)`;
    };

    const applyVibeCloud = () => {
      if (typeof document === 'undefined' || !document.documentElement) return;
      const bri = (settings.vibeCloudBrightness || 90) / 100;
      let filterVal = 'none';
      let opacityVal = '0.95';
      let bgVal = '';

      if (settings.vibeCloudMode === 'minimal') {
        filterVal = 'none';
        opacityVal = '0';
        bgVal = 'none';
      } else if (settings.vibeCloudMode === 'space') {
        filterVal = 'contrast(1.25) brightness(0.65)';
        opacityVal = `${0.45 * bri}`;
        bgVal = 'radial-gradient(circle at 50% 44%, rgba(18, 18, 34, 0.5) 0%, rgba(3, 3, 5, 0.95) 75%)';
      } else if (settings.vibeCloudMode === 'original') {
        filterVal = 'none';
        opacityVal = `${bri}`;
        bgVal = '';
      } else {
        // 'theme' (default - dynamic vibrant theme harmony)
        const tint = getFilterForTheme(settings.themeColor);
        filterVal = `${tint} brightness(${0.98 * bri})`;
        opacityVal = `${0.95 * bri}`;
        bgVal = '';
      }

      document.documentElement.style.setProperty('--sys-vibe-filter', filterVal);
      document.documentElement.style.setProperty('--sys-vibe-opacity', opacityVal);
      if (bgVal) {
        document.documentElement.style.setProperty('--sys-vibe-bg', bgVal);
      } else {
        document.documentElement.style.removeProperty('--sys-vibe-bg');
      }
    };

    // Apply custom theme variables
    const applyTheme = () => {
      if (typeof document !== 'undefined' && document.documentElement) {
        const theme = settings.themeColor || '#ebbf89';
        const docStyle = document.documentElement.style;
        docStyle.setProperty('--sys-primary', theme, 'important');
        docStyle.setProperty('--sys-primary-hover', theme, 'important');
        docStyle.setProperty('--ym-controls-color-primary-default-enabled', theme, 'important');
        docStyle.setProperty('--ym-controls-color-primary-default-hovered', theme, 'important');
        docStyle.setProperty('--ym-controls-color-primary-outline-selected_stroke', theme, 'important');
        docStyle.setProperty('--ym-slider-color-primary-enabled', theme, 'important');
        docStyle.setProperty('--ym-slider-color-primary-progress', theme, 'important');
        docStyle.setProperty('--ym-logo-color-primary-variant', theme, 'important');
        docStyle.setProperty('--ym-logo-color-primary-player', theme, 'important');
        docStyle.setProperty('--text-color-accent', theme, 'important');
        docStyle.setProperty('--sys-glass-blur', `${settings.glassBlur || 20}px`, 'important');
        docStyle.setProperty('--sys-glass-opacity', ((settings.glassOpacity || 75) / 100).toFixed(2), 'important');
        applyVibeCloud();

        const hub = document.getElementById('ym-audio-hub-modal');
        if (hub) {
          hub.querySelectorAll('.ym-color-circle').forEach(b => {
            b.classList.toggle('active', (b.getAttribute('data-hex') || '').toLowerCase() === theme.toLowerCase());
          });
          const svgPath = hub.querySelector('.ym-eq-stroke');
          if (svgPath) svgPath.setAttribute('stroke', theme);
          const stop0 = hub.querySelector('#ym-eq-grad-fill stop[offset="0%"]');
          if (stop0) stop0.setAttribute('stop-color', theme);
        }
      }
    };
    applyTheme();

    // -------------------------------------------------------------------------
    // 1. CAVA ENGINE (PulseAudio / PipeWire spectrum)
    // -------------------------------------------------------------------------
    const NUM_BARS = 64;
    let cavaValues = new Float32Array(NUM_BARS);
    let visualBars = new Float32Array(NUM_BARS);
    // Listen for CAVA stream via postMessage from IPC bridge
    if (typeof window !== 'undefined') {
      window.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'ym-cava-data' && Array.isArray(event.data.data)) {
          const parts = event.data.data;
          const sens = (settings.cavaSensitivity || 100) / 100;
          for (let i = 0; i < NUM_BARS; i++) {
            const val = parts[i];
            if (typeof val === 'number' && !isNaN(val)) {
              cavaValues[i] = Math.min(100, val * sens);
            }
          }
        }
      });
    }

    // -------------------------------------------------------------------------
    // 2. MOUNT UI WHEN VIBE PAGE IS READY
    // -------------------------------------------------------------------------
    let cavaContainer = null;
    let canvas = null;
    let ctx = null;
    let animId = null;
    let phase = 0;

    function mountUI() {
      if (document.getElementById('ym-audio-hub-root')) return true;
      if (!document.body) return false;

      applyTheme();

      // CAVA Canvas Container
      cavaContainer = document.createElement('div');
      cavaContainer.id = 'ym-cava-container';
      cavaContainer.className = `ym-cava-${settings.cavaMode}`;
      canvas = document.createElement('canvas');
      canvas.id = 'ym-cava-canvas';
      cavaContainer.appendChild(canvas);
      document.body.appendChild(cavaContainer);

      ctx = canvas.getContext('2d');

      let cachedWidth = 0;
      let cachedHeight = 0;
      let cachedDpr = window.devicePixelRatio || 1;
      let cachedPlaying = false;
      let cachedGradient = null;
      let lastGradTheme = '';
      let lastGradHeight = 0;
      let lastGradMode = '';
      let lastFrameTime = 0;

      const resizeCanvas = () => {
        if (!cavaContainer || !canvas) return;
        const rect = cavaContainer.getBoundingClientRect();
        cachedDpr = window.devicePixelRatio || 1;
        cachedWidth = Math.floor(rect.width);
        cachedHeight = Math.floor(rect.height);
        if (cachedWidth > 0 && cachedHeight > 0) {
          canvas.width = cachedWidth * cachedDpr;
          canvas.height = cachedHeight * cachedDpr;
          ctx.setTransform(cachedDpr, 0, 0, cachedDpr, 0, 0);
          cachedGradient = null;
        }
      };
      window.addEventListener('resize', resizeCanvas);
      setTimeout(resizeCanvas, 50);

      const updatePlayingStatus = () => {
        let isPlaying = false;

        // 1. Check HTML5 audio tag (100% reliable across all OS)
        const audioEl = document.querySelector('audio');
        if (audioEl) {
          isPlaying = !audioEl.paused && !audioEl.ended && (audioEl.currentTime > 0 || audioEl.readyState > 2);
        }

        // 2. Play/Pause button detection fallback
        if (!isPlaying) {
          const playBtn = document.querySelector('[class*="VibePlayerControls_playButton"]') ||
                          document.querySelector('[class*="PlayerBarDesktop_playButton"]') ||
                          document.querySelector('[class*="VibePlayerBar_playButton"]') ||
                          document.querySelector('[data-test-id="PLAY_BUTTON"]') ||
                          document.querySelector('[class*="PlayerControls_playButton"]');
          if (playBtn) {
            const label = (playBtn.getAttribute('aria-label') || '').toLowerCase();
            isPlaying = label.includes('пауз') || label.includes('pause') ||
                        playBtn.classList.toString().includes('playing') ||
                        !!playBtn.querySelector('[class*="Pause"]') ||
                        !!playBtn.querySelector('svg[data-icon*="pause"]');
          }
        }

        cachedPlaying = isPlaying;
        if (typeof document !== 'undefined' && document.body) {
          document.body.classList.toggle('ym-vibe-playing', cachedPlaying);
        }
      };
      setInterval(updatePlayingStatus, 300);
      updatePlayingStatus();

      const isPlayingMusic = () => cachedPlaying;

      const getCurrentTrackCover = () => {
        const coverImg = document.querySelector('[class*="AlbumCover_cover"] img') ||
                         document.querySelector('[class*="AlbumCover_cover"]') ||
                         document.querySelector('img[src*="avatars.yandex.net"]');
        return coverImg ? (coverImg.src || coverImg.getAttribute('src') || '') : '';
      };

      const renderCava = (timestamp) => {
        if (settings.cavaMode === 'hidden') {
          if (cavaContainer && cavaContainer.style.display !== 'none') cavaContainer.style.display = 'none';
          animId = setTimeout(() => requestAnimationFrame(renderCava), 400);
          return;
        }

        const vibeRoot = document.querySelector('[class*="VibePage_root"]');
        const isOnVibe = !!vibeRoot && vibeRoot.offsetParent !== null;

        if (document.hidden || !isOnVibe) {
          if (cavaContainer && cavaContainer.style.display !== 'none') cavaContainer.style.display = 'none';
          animId = setTimeout(() => requestAnimationFrame(renderCava), 250);
          return;
        }

        animId = requestAnimationFrame(renderCava);

        if (cavaContainer.style.display !== 'block') {
          cavaContainer.style.display = 'block';
          resizeCanvas();
        }

        if (!cachedWidth || !cachedHeight) {
          resizeCanvas();
          if (!cachedWidth || !cachedHeight) return;
        }

        // Cap frame rate to ~60 FPS
        if (timestamp - lastFrameTime < 16) return;
        lastFrameTime = timestamp;

        ctx.clearRect(0, 0, cachedWidth, cachedHeight);

        phase += 0.05;

        let maxVal = 0;
        for (let i = 0; i < NUM_BARS; i++) {
          if (cavaValues[i] > maxVal) maxVal = cavaValues[i];
        }

        const barCount = Math.max(16, Math.min(64, settings.cavaBars || 36));
        const audioEl = document.querySelector('audio');
        const curTime = audioEl ? audioEl.currentTime : 0;
        const beatPhase = (curTime * 9.2) + phase;
        const sens = (settings.cavaSensitivity || 100) / 100;

        // Spring physics & smoothing for active bar count
        for (let i = 0; i < barCount; i++) {
          const srcIdx = Math.min(NUM_BARS - 1, Math.round(i * (NUM_BARS - 1) / (barCount - 1)));
          let target = cavaValues[srcIdx];

          // Rhythmic spectrum simulation or ambient breathing when idle/paused
          if (!cachedPlaying) {
            // Calm subtle breathing when paused
            const wave = Math.sin(phase + i * (10 / barCount)) * 0.5 + 0.5;
            const secondary = Math.cos(phase * 0.6 + i * (6 / barCount)) * 0.5 + 0.5;
            target = (wave * 0.6 + secondary * 0.4) * 6;
          } else if (maxVal < 1) {
            // Dynamic alive procedural spectrum when CAVA is unavailable (e.g. Windows)
            const normIdx = i / barCount;

            const kick = Math.pow(Math.max(0, Math.sin(beatPhase * 1.4)), 4) * 58;
            const subBass = Math.sin(beatPhase * 0.7 + i * 0.45) * 18;

            const midRhythm = (Math.sin(beatPhase * 2.8 + i * 0.35) * 0.5 + 0.5) * 42;
            const harmony = Math.cos(beatPhase * 1.9 + i * 0.6) * 15;

            const hiHat = Math.pow(Math.max(0, Math.sin(beatPhase * 3.8 + i * 0.8)), 3) * 34;

            let simHeight = 15;
            if (normIdx < 0.28) {
              simHeight = 22 + (kick + subBass) * (1 - normIdx * 1.4);
            } else if (normIdx < 0.7) {
              simHeight = 16 + midRhythm + harmony;
            } else {
              simHeight = 10 + hiHat + Math.sin(beatPhase * 4.5 + i) * 8;
            }

            target = Math.max(5, Math.min(98, simHeight * sens));
          }

          if (target > visualBars[i]) {
            visualBars[i] += (target - visualBars[i]) * 0.42;
          } else {
            visualBars[i] -= (visualBars[i] - target) * 0.18;
          }
          if (visualBars[i] < 0) visualBars[i] = 0;
        }

        const gap = barCount > 40 ? 3 : 4;
        const totalGaps = (barCount - 1) * gap;
        const isCenter = settings.cavaMode === 'center';
        const isTop = settings.cavaMode === 'top';
        const availableWidth = isCenter ? Math.min(cachedWidth * 0.75, 520) : cachedWidth - 40;
        const barWidth = Math.max(2, Math.floor((availableWidth - totalGaps) / barCount));
        const totalContentWidth = barCount * barWidth + totalGaps;
        const startX = Math.floor((cachedWidth - totalContentWidth) / 2);

        const themeCol = settings.themeColor || '#ebbf89';

        // Reuse a single pre-built gradient (0 heap allocations per frame)
        if (!cachedGradient || lastGradTheme !== themeCol || lastGradHeight !== cachedHeight || lastGradMode !== settings.cavaMode) {
          lastGradTheme = themeCol;
          lastGradHeight = cachedHeight;
          lastGradMode = settings.cavaMode;
          if (isTop) {
            cachedGradient = ctx.createLinearGradient(0, 0, 0, cachedHeight);
            cachedGradient.addColorStop(0, hexToRgba(themeCol, 0.95));
            cachedGradient.addColorStop(0.6, hexToRgba(themeCol, 0.6));
            cachedGradient.addColorStop(1, hexToRgba(themeCol, 0.12));
          } else if (isCenter) {
            cachedGradient = ctx.createLinearGradient(0, 0, 0, cachedHeight);
            cachedGradient.addColorStop(0, hexToRgba(themeCol, 0.75));
            cachedGradient.addColorStop(0.5, hexToRgba(themeCol, 0.95));
            cachedGradient.addColorStop(1, hexToRgba(themeCol, 0.75));
          } else {
            cachedGradient = ctx.createLinearGradient(0, cachedHeight, 0, 0);
            cachedGradient.addColorStop(0, hexToRgba(themeCol, 0.12));
            cachedGradient.addColorStop(0.5, hexToRgba(themeCol, 0.55));
            cachedGradient.addColorStop(1, hexToRgba(themeCol, 0.95));
          }
        }

        // 1. Single batched path for all bars (Massive GPU speedup)
        ctx.fillStyle = cachedGradient;
        ctx.beginPath();
        for (let i = 0; i < barCount; i++) {
          const x = startX + i * (barWidth + gap);
          const percent = visualBars[i] / 100;
          const barH = Math.max(3, percent * (cachedHeight - 12));

          if (isTop) {
            ctx.roundRect(x, 0, barWidth, barH, [0, 0, 3, 3]);
          } else if (isCenter) {
            const centerY = Math.floor(cachedHeight / 2);
            const y = centerY - barH / 2;
            ctx.roundRect(x, y, barWidth, barH, [3, 3, 3, 3]);
          } else {
            const y = cachedHeight - barH;
            ctx.roundRect(x, y, barWidth, barH, [3, 3, 0, 0]);
          }
        }
        ctx.fill();

        // 2. Single batched path for highlighted caps
        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.beginPath();
        for (let i = 0; i < barCount; i++) {
          const percent = visualBars[i] / 100;
          const barH = Math.max(3, percent * (cachedHeight - 12));
          if (barH > 8) {
            const x = startX + i * (barWidth + gap);
            if (isTop) {
              ctx.roundRect(x, barH - 2, barWidth, 2, [0, 0, 1, 1]);
            } else if (!isCenter) {
              const y = cachedHeight - barH;
              ctx.roundRect(x, y, barWidth, 2, [1, 1, 0, 0]);
            }
          }
        }
        ctx.fill();
      };
      renderCava();


      // Right-side Hub Root
      const rootHub = document.createElement('div');
      rootHub.id = 'ym-audio-hub-root';
      rootHub.className = settings.isOpen ? 'ym-hub-open' : 'ym-hub-closed';

      // Floating Toggle Pill on Right Edge
      const togglePill = document.createElement('button');
      togglePill.id = 'ym-hub-toggle-pill';
      togglePill.type = 'button';
      togglePill.setAttribute('aria-label', 'Настройки звука и кастомизация');
      togglePill.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6zM5 13h2v-2H5v2zm0-4h2V7H5v2zm0-4h2V3H5v2z"/>
        </svg>
        <span>Звук & Кастом</span>
      `;
      togglePill.addEventListener('click', (e) => {
        e.stopPropagation();
        settings.isOpen = !settings.isOpen;
        saveSettings();
        updateHubState();
      });
      document.body.appendChild(togglePill);

      const updateHubState = () => {
        rootHub.className = settings.isOpen ? 'ym-hub-open' : 'ym-hub-closed';
        togglePill.classList.toggle('active', settings.isOpen);
      };

      // Glass Panel Card
      const panel = document.createElement('div');
      panel.id = 'ym-hub-panel';

      const header = document.createElement('div');
      header.className = 'ym-hub-header';
      header.innerHTML = `
        <div class="ym-hub-title-row">
          <div class="ym-hub-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
            <span>Студия звука</span>
          </div>
          <button type="button" class="ym-hub-close-btn" aria-label="Закрыть панель">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div class="ym-hub-tabs">
          <button type="button" class="ym-tab-btn ${settings.activeTab === 'headphones' ? 'active' : ''}" data-tab="headphones">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3a9 9 0 0 0-9 9v7c0 1.1.9 2 2 2h4v-8H5v-1a7 7 0 0 1 14 0v1h-4v8h4c1.1 0 2-.9 2-2v-7a9 9 0 0 0-9-9z"/></svg>
            <span>Наушники</span>
          </button>
          <button type="button" class="ym-tab-btn ${settings.activeTab === 'eq' ? 'active' : ''}" data-tab="eq">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20h4V4h-4v16zm-6 0h4v-8H4v8zM16 9v11h4V9h-4z"/></svg>
            <span>Эквалайзер</span>
          </button>
          <button type="button" class="ym-tab-btn ${settings.activeTab === 'custom' ? 'active' : ''}" data-tab="custom">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 15.5A3.5 3.5 0 0 1 8.5 12 3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97 0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1 0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66z"/></svg>
            <span>Кастом</span>
          </button>
        </div>
      `;

      header.querySelector('.ym-hub-close-btn').addEventListener('click', () => {
        settings.isOpen = false;
        saveSettings();
        updateHubState();
      });

      const tabButtons = header.querySelectorAll('.ym-tab-btn');
      tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          const tab = btn.getAttribute('data-tab');
          settings.activeTab = tab;
          saveSettings();
          tabButtons.forEach(b => b.classList.toggle('active', b.getAttribute('data-tab') === tab));
          renderTabContent();
        });
      });

      panel.appendChild(header);

      const tabBody = document.createElement('div');
      tabBody.className = 'ym-hub-body';
      panel.appendChild(tabBody);
      rootHub.appendChild(panel);
      document.body.appendChild(rootHub);

      // -----------------------------------------------------------------------
      // REAL WEBAUDIO DSP ENGINE (EQUALIZER, PREAMP, BASS BOOST, SPATIAL, VOCAL)
      // -----------------------------------------------------------------------
      const eqFrequencies = [60, 150, 400, 1000, 2500, 6000, 15000];
      const eqFreqLabels = ['60', '150', '400', '1k', '2.5k', '6k', '15k'];
      const eqPresets = {
        flat: [0, 0, 0, 0, 0, 0, 0],
        rock: [4, 2, -1, 1, 3, 5, 4],
        bass: [6, 5, 3, 1, 0, 1, 1],
        electronic: [5, 4, 1, 2, 3, 5, 6],
        vocal: [-2, 0, 3, 4, 3, 1, -1],
        acoustic: [3, 2, 1, 2, 3, 4, 3],
        metal: [6, 2, -2, 0, 4, 6, 5]
      };

      let dspContext = null;
      let dspPreampNode = null;
      let dspBandNodes = [];
      let dspBassNode = null;
      let dspVocalNode = null;
      let dspPannerNode = null;
      let activeVinylTimer = null;

      const initDspEngine = (ctx) => {
        if (!ctx || dspContext === ctx) return;
        dspContext = ctx;

        try {
          dspPreampNode = ctx.createGain();

          dspBandNodes = eqFrequencies.map((freq, idx) => {
            const filter = ctx.createBiquadFilter();
            if (idx === 0) {
              filter.type = 'lowshelf';
            } else if (idx === eqFrequencies.length - 1) {
              filter.type = 'highshelf';
            } else {
              filter.type = 'peaking';
              filter.Q.value = 1.4;
            }
            filter.frequency.value = freq;
            filter.gain.value = 0;
            return filter;
          });

          // Dedicated Bass Boost node (Punchy lowshelf at 90Hz)
          dspBassNode = ctx.createBiquadFilter();
          dspBassNode.type = 'lowshelf';
          dspBassNode.frequency.value = 90;
          dspBassNode.gain.value = 0;

          // Dedicated Vocal Clarity node (Peaking at 2800Hz with wide Q)
          dspVocalNode = ctx.createBiquadFilter();
          dspVocalNode.type = 'peaking';
          dspVocalNode.frequency.value = 2800;
          dspVocalNode.Q.value = 1.1;
          dspVocalNode.gain.value = 0;

          // Stereo Balance Panner
          if (typeof ctx.createStereoPanner === 'function') {
            dspPannerNode = ctx.createStereoPanner();
            dspPannerNode.pan.value = 0;
          }

          // Chain nodes:
          // dspPreampNode -> dspBandNodes[0..6] -> dspBassNode -> dspVocalNode -> (dspPannerNode)
          let prev = dspPreampNode;
          for (const band of dspBandNodes) {
            prev.connect(band);
            prev = band;
          }
          prev.connect(dspBassNode);
          dspBassNode.connect(dspVocalNode);
          if (dspPannerNode) {
            dspVocalNode.connect(dspPannerNode);
          }

          applyDspSettings();
        } catch (e) {
          console.warn('[Enhancer DSP] Init error:', e);
        }
      };

      const getDspOutput = () => {
        return dspPannerNode || dspVocalNode || dspBassNode || dspPreampNode;
      };

      const applyDspSettings = () => {
        if (!dspContext) return;
        const now = dspContext.currentTime;

        // Preamp gain
        if (dspPreampNode && dspPreampNode.gain) {
          const db = typeof settings.preamp === 'number' ? settings.preamp : 0;
          const gainVal = Math.pow(10, db / 20);
          dspPreampNode.gain.setTargetAtTime(gainVal, now, 0.05);
        }

        // 7-Band Equalizer + Headphone profile offsets
        let profileOffsets = [0, 0, 0, 0, 0, 0, 0];
        if (settings.headphoneProfile === 'tws') {
          profileOffsets = [2, 1, 0, 0, 1, 2, 1];
        } else if (settings.headphoneProfile === 'overear') {
          profileOffsets = [1, 0, 0, 1, 1, 2, 3];
        } else if (settings.headphoneProfile === 'studio') {
          profileOffsets = [0, 0, 0, 0, 0, 0, 0];
        } else if (settings.headphoneProfile === 'acoustic') {
          profileOffsets = [1, 2, 2, 1, 0, -1, -1];
        }

        if (Array.isArray(settings.eqBands) && dspBandNodes.length === 7) {
          settings.eqBands.forEach((db, i) => {
            if (dspBandNodes[i] && dspBandNodes[i].gain) {
              const totalGain = Math.max(-15, Math.min(15, db + profileOffsets[i]));
              dspBandNodes[i].gain.setTargetAtTime(totalGain, now, 0.05);
            }
          });
        }

        // Bass Boost
        if (dspBassNode && dspBassNode.gain) {
          const boost = settings.bassBoost ? (settings.bassAmount || 0) : 0;
          dspBassNode.gain.setTargetAtTime(boost, now, 0.05);
        }

        // Vocal Clarity
        if (dspVocalNode && dspVocalNode.gain) {
          const vocalDb = settings.vocalClarity ? ((settings.vocalAmount || 0) / 12) : 0;
          dspVocalNode.gain.setTargetAtTime(vocalDb, now, 0.05);
        }

        // Stereo Balance Panner
        if (dspPannerNode && dspPannerNode.pan) {
          const pan = Math.max(-1, Math.min(1, (settings.balance || 0) / 100));
          dspPannerNode.pan.setTargetAtTime(pan, now, 0.05);
        }
      };

      // Monkey-patch AudioContext.prototype.createMediaElementSource to hook into Yandex Music playback
      if (typeof AudioContext !== 'undefined' && !AudioContext.prototype.__ymPatched) {
        AudioContext.prototype.__ymPatched = true;
        const origCreate = AudioContext.prototype.createMediaElementSource;
        AudioContext.prototype.createMediaElementSource = function (mediaElement) {
          const sourceNode = origCreate.call(this, mediaElement);
          initDspEngine(this);

          const origConnect = sourceNode.connect;
          sourceNode.connect = function (destination, outputIndex, inputIndex) {
            try {
              origConnect.call(sourceNode, dspPreampNode);
              const dspOut = getDspOutput();
              return AudioNode.prototype.connect.call(dspOut, destination, outputIndex, inputIndex);
            } catch (e) {
              return origConnect.call(sourceNode, destination, outputIndex, inputIndex);
            }
          };

          return sourceNode;
        };
      }

      // -----------------------------------------------------------------------
      // TAB 1: НАУШНИКИ
      // -----------------------------------------------------------------------
      const renderHeadphonesTab = () => {
        if (activeVinylTimer) {
          clearInterval(activeVinylTimer);
          activeVinylTimer = null;
        }
        tabBody.innerHTML = '';

        const container = document.createElement('div');
        container.className = 'ym-tab-pane';

        container.innerHTML = `
          <div class="ym-section-label">Профиль наушников</div>
          <div class="ym-profile-grid">
            <button type="button" class="ym-profile-chip ${settings.headphoneProfile === 'tws' ? 'active' : ''}" data-profile="tws">
              <span class="ym-chip-icon">🎧</span>
              <div class="ym-chip-info">
                <span class="ym-chip-name">TWS / Вкладыши</span>
                <span class="ym-chip-sub">Чистый плотный бас</span>
              </div>
            </button>
            <button type="button" class="ym-profile-chip ${settings.headphoneProfile === 'overear' ? 'active' : ''}" data-profile="overear">
              <span class="ym-chip-icon">🎧</span>
              <div class="ym-chip-info">
                <span class="ym-chip-name">Полноразмерные</span>
                <span class="ym-chip-sub">Широкая стереосцена</span>
              </div>
            </button>
            <button type="button" class="ym-profile-chip ${settings.headphoneProfile === 'studio' ? 'active' : ''}" data-profile="studio">
              <span class="ym-chip-icon">⚡</span>
              <div class="ym-chip-info">
                <span class="ym-chip-name">Студийные</span>
                <span class="ym-chip-sub">Точная детализация</span>
              </div>
            </button>
            <button type="button" class="ym-profile-chip ${settings.headphoneProfile === 'acoustic' ? 'active' : ''}" data-profile="acoustic">
              <span class="ym-chip-icon">🔊</span>
              <div class="ym-chip-info">
                <span class="ym-chip-name">Акустика</span>
                <span class="ym-chip-sub">Тёплый аналог</span>
              </div>
            </button>
          </div>

          <div class="ym-section-label" style="margin-top: 14px;">Обработка звука</div>
          <div class="ym-control-card">
            <div class="ym-ctrl-row">
              <div class="ym-ctrl-title">
                <span>Пространственный звук 3D</span>
                <span class="ym-ctrl-val">${settings.spatialAudio ? `${settings.spatialDepth}%` : 'Выкл'}</span>
              </div>
              <label class="ym-switch">
                <input type="checkbox" id="ym-spatial-toggle" ${settings.spatialAudio ? 'checked' : ''}>
                <span class="ym-slider-round"></span>
              </label>
            </div>
            <input type="range" class="ym-range-slider" id="ym-spatial-slider" min="0" max="100" value="${settings.spatialDepth}" ${settings.spatialAudio ? '' : 'disabled'}>
          </div>

          <div class="ym-control-card">
            <div class="ym-ctrl-row">
              <div class="ym-ctrl-title">
                <span>Bass Boost (Ударный бас)</span>
                <span class="ym-ctrl-val">${settings.bassBoost ? `+${settings.bassAmount} dB` : 'Выкл'}</span>
              </div>
              <label class="ym-switch">
                <input type="checkbox" id="ym-bass-toggle" ${settings.bassBoost ? 'checked' : ''}>
                <span class="ym-slider-round"></span>
              </label>
            </div>
            <input type="range" class="ym-range-slider" id="ym-bass-slider" min="0" max="12" value="${settings.bassAmount}" ${settings.bassBoost ? '' : 'disabled'}>
          </div>

          <div class="ym-control-card">
            <div class="ym-ctrl-row">
              <div class="ym-ctrl-title">
                <span>Vocal Clarity (Кристальный голос)</span>
                <span class="ym-ctrl-val">${settings.vocalClarity ? `${settings.vocalAmount}%` : 'Выкл'}</span>
              </div>
              <label class="ym-switch">
                <input type="checkbox" id="ym-vocal-toggle" ${settings.vocalClarity ? 'checked' : ''}>
                <span class="ym-slider-round"></span>
              </label>
            </div>
            <input type="range" class="ym-range-slider" id="ym-vocal-slider" min="0" max="100" value="${settings.vocalAmount}" ${settings.vocalClarity ? '' : 'disabled'}>
          </div>

          <div class="ym-control-card" style="margin-bottom: 8px;">
            <div class="ym-ctrl-row">
              <div class="ym-ctrl-title">
                <span>Баланс каналов</span>
                <span class="ym-ctrl-val">${settings.balance === 0 ? 'Центр' : (settings.balance < 0 ? `L ${Math.abs(settings.balance)}%` : `R ${settings.balance}%`)}</span>
              </div>
            </div>
            <input type="range" class="ym-range-slider" id="ym-balance-slider" min="-50" max="50" value="${settings.balance}">
          </div>
        `;

        container.querySelectorAll('.ym-profile-chip').forEach(chip => {
          chip.addEventListener('click', () => {
            settings.headphoneProfile = chip.getAttribute('data-profile');
            saveSettings();
            applyDspSettings();
            container.querySelectorAll('.ym-profile-chip').forEach(c => c.classList.toggle('active', c === chip));
          });
        });

        const spatialToggle = container.querySelector('#ym-spatial-toggle');
        const spatialSlider = container.querySelector('#ym-spatial-slider');
        const spatialVal = spatialSlider.previousElementSibling.querySelector('.ym-ctrl-val');
        spatialToggle.addEventListener('change', () => {
          settings.spatialAudio = spatialToggle.checked;
          spatialSlider.disabled = !settings.spatialAudio;
          spatialVal.textContent = settings.spatialAudio ? `${settings.spatialDepth}%` : 'Выкл';
          saveSettings();
          applyDspSettings();
        });
        spatialSlider.addEventListener('input', (e) => {
          settings.spatialDepth = parseInt(e.target.value, 10);
          spatialVal.textContent = `${settings.spatialDepth}%`;
          saveSettings();
          applyDspSettings();
        });

        const bassToggle = container.querySelector('#ym-bass-toggle');
        const bassSlider = container.querySelector('#ym-bass-slider');
        const bassVal = bassSlider.previousElementSibling.querySelector('.ym-ctrl-val');
        bassToggle.addEventListener('change', () => {
          settings.bassBoost = bassToggle.checked;
          bassSlider.disabled = !settings.bassBoost;
          bassVal.textContent = settings.bassBoost ? `+${settings.bassAmount} dB` : 'Выкл';
          saveSettings();
          applyDspSettings();
        });
        bassSlider.addEventListener('input', (e) => {
          settings.bassAmount = parseInt(e.target.value, 10);
          bassVal.textContent = `+${settings.bassAmount} dB`;
          saveSettings();
          applyDspSettings();
        });

        const vocalToggle = container.querySelector('#ym-vocal-toggle');
        const vocalSlider = container.querySelector('#ym-vocal-slider');
        const vocalVal = vocalSlider.previousElementSibling.querySelector('.ym-ctrl-val');
        vocalToggle.addEventListener('change', () => {
          settings.vocalClarity = vocalToggle.checked;
          vocalSlider.disabled = !settings.vocalClarity;
          vocalVal.textContent = settings.vocalClarity ? `${settings.vocalAmount}%` : 'Выкл';
          saveSettings();
          applyDspSettings();
        });
        vocalSlider.addEventListener('input', (e) => {
          settings.vocalAmount = parseInt(e.target.value, 10);
          vocalVal.textContent = `${settings.vocalAmount}%`;
          saveSettings();
          applyDspSettings();
        });

        const balanceSlider = container.querySelector('#ym-balance-slider');
        const balanceVal = balanceSlider.previousElementSibling.querySelector('.ym-ctrl-val');
        balanceSlider.addEventListener('input', (e) => {
          settings.balance = parseInt(e.target.value, 10);
          const label = settings.balance === 0 ? 'Центр' : (settings.balance < 0 ? `L ${Math.abs(settings.balance)}%` : `R ${settings.balance}%`);
          balanceVal.textContent = label;
          saveSettings();
          applyDspSettings();
        });

        tabBody.appendChild(container);
      };

      // -----------------------------------------------------------------------
      // TAB 2: КРАСИВЫЙ ЭКВАЛАЙЗЕР
      // -----------------------------------------------------------------------
      const renderEqTab = () => {
        if (activeVinylTimer) {
          clearInterval(activeVinylTimer);
          activeVinylTimer = null;
        }
        tabBody.innerHTML = '';

        const container = document.createElement('div');
        container.className = 'ym-tab-pane';

        const trackCover = getCurrentTrackCover();
        const isPlaying = isPlayingMusic();

        container.innerHTML = `
          <div class="ym-vinyl-card ${isPlaying ? 'ym-vinyl-playing' : 'ym-vinyl-paused'}">
            <div class="ym-vinyl-record-wrap" title="Воспроизведение / Пауза">
              <div class="ym-vinyl-disc">
                <div class="ym-vinyl-label">
                  ${trackCover ? `<img class="ym-vinyl-cover-img" src="${trackCover}" alt="Cover">` : ''}
                  <div class="ym-vinyl-spindle"></div>
                </div>
              </div>
              <div class="ym-vinyl-tonearm">
                <div class="ym-tonearm-pivot"></div>
                <div class="ym-tonearm-bar"></div>
                <div class="ym-tonearm-head"></div>
              </div>
            </div>

            <div class="ym-vinyl-curve-wrap">
              <div class="ym-eq-curve-container">
                <svg class="ym-eq-curve-svg" viewBox="0 0 220 74" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="ym-eq-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stop-color="${settings.themeColor}" stop-opacity="0.45"/>
                      <stop offset="100%" stop-color="${settings.themeColor}" stop-opacity="0.0"/>
                    </linearGradient>
                  </defs>
                  <path class="ym-eq-area" d="" fill="url(#ym-eq-grad)"/>
                  <path class="ym-eq-stroke" d="" fill="none" stroke="${settings.themeColor}" stroke-width="2.5" stroke-linecap="round"/>
                </svg>
              </div>
            </div>
          </div>

          <div class="ym-preset-scroll">
            <button type="button" class="ym-preset-chip ${settings.eqPreset === 'flat' ? 'active' : ''}" data-eq="flat">Flat</button>
            <button type="button" class="ym-preset-chip ${settings.eqPreset === 'rock' ? 'active' : ''}" data-eq="rock">Рок</button>
            <button type="button" class="ym-preset-chip ${settings.eqPreset === 'bass' ? 'active' : ''}" data-eq="bass">Бас+</button>
            <button type="button" class="ym-preset-chip ${settings.eqPreset === 'electronic' ? 'active' : ''}" data-eq="electronic">Электро</button>
            <button type="button" class="ym-preset-chip ${settings.eqPreset === 'vocal' ? 'active' : ''}" data-eq="vocal">Вокал</button>
            <button type="button" class="ym-preset-chip ${settings.eqPreset === 'acoustic' ? 'active' : ''}" data-eq="acoustic">Акустика</button>
            <button type="button" class="ym-preset-chip ${settings.eqPreset === 'metal' ? 'active' : ''}" data-eq="metal">Метал</button>
          </div>

          <div class="ym-eq-sliders-row">
            ${eqFreqLabels.map((freq, idx) => {
              const val = settings.eqBands[idx] || 0;
              const sign = val > 0 ? `+${val}` : `${val}`;
              return `
                <div class="ym-eq-col" data-idx="${idx}">
                  <span class="ym-eq-badge">${sign}</span>
                  <div class="ym-slider-track-wrap">
                    <input type="range" class="ym-eq-vertical-slider" min="-12" max="12" step="1" value="${val}" orient="vertical">
                  </div>
                  <span class="ym-eq-freq">${freq}</span>
                </div>
              `;
            }).join('')}
          </div>

          <div class="ym-eq-footer">
            <div class="ym-preamp-group">
              <span class="ym-preamp-label">Preamp</span>
              <input type="range" class="ym-range-slider ym-preamp-slider" min="-6" max="6" value="${settings.preamp}">
              <span class="ym-preamp-val">${settings.preamp > 0 ? `+${settings.preamp}` : settings.preamp} dB</span>
            </div>
            <button type="button" class="ym-reset-eq-btn">Сброс</button>
          </div>
        `;

        const updateCurve = () => {
          const svg = container.querySelector('.ym-eq-curve-svg');
          if (!svg) return;
          const area = svg.querySelector('.ym-eq-area');
          const stroke = svg.querySelector('.ym-eq-stroke');

          const points = settings.eqBands.map((db, i) => {
            const x = 12 + i * (196 / (eqFreqLabels.length - 1));
            const y = 37 - (db / 12) * 28;
            return { x, y };
          });

          let d = `M ${points[0].x} ${points[0].y}`;
          for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[i];
            const p1 = points[i + 1];
            const mx = (p0.x + p1.x) / 2;
            d += ` C ${mx} ${p0.y}, ${mx} ${p1.y}, ${p1.x} ${p1.y}`;
          }

          stroke.setAttribute('d', d);
          const areaPath = `${d} L ${points[points.length - 1].x} 74 L ${points[0].x} 74 Z`;
          area.setAttribute('d', areaPath);
        };
        setTimeout(updateCurve, 10);

        const vinylCard = container.querySelector('.ym-vinyl-card');
        const vinylWrap = container.querySelector('.ym-vinyl-record-wrap');
        const vinylLabel = container.querySelector('.ym-vinyl-label');

        if (vinylWrap) {
          vinylWrap.addEventListener('click', () => {
            const playBtn = document.querySelector('[class*="VibePlayerControls_playButton"]');
            if (playBtn) playBtn.click();
          });
        }

        const syncVinyl = () => {
          if (!container.isConnected) return;
          const playing = isPlayingMusic();
          if (vinylCard) {
            vinylCard.classList.toggle('ym-vinyl-playing', playing);
            vinylCard.classList.toggle('ym-vinyl-paused', !playing);
          }
          const cover = getCurrentTrackCover();
          const img = vinylLabel ? vinylLabel.querySelector('img') : null;
          if (cover && img && img.src !== cover) {
            img.src = cover;
          } else if (cover && !img && vinylLabel) {
            const newImg = document.createElement('img');
            newImg.className = 'ym-vinyl-cover-img';
            newImg.src = cover;
            vinylLabel.prepend(newImg);
          }
        };

        activeVinylTimer = setInterval(syncVinyl, 300);

        container.querySelectorAll('.ym-eq-vertical-slider').forEach(input => {
          input.addEventListener('input', (e) => {
            const col = e.target.closest('.ym-eq-col');
            const idx = parseInt(col.getAttribute('data-idx'), 10);
            const val = parseInt(e.target.value, 10);
            settings.eqBands[idx] = val;
            settings.eqPreset = 'custom';
            saveSettings();
            applyDspSettings();

            col.querySelector('.ym-eq-badge').textContent = val > 0 ? `+${val}` : `${val}`;
            container.querySelectorAll('.ym-preset-chip').forEach(c => c.classList.remove('active'));
            updateCurve();
          });
        });

        container.querySelectorAll('.ym-preset-chip').forEach(chip => {
          chip.addEventListener('click', () => {
            const name = chip.getAttribute('data-eq');
            if (eqPresets[name]) {
              settings.eqBands = [...eqPresets[name]];
              settings.eqPreset = name;
              saveSettings();
              applyDspSettings();

              container.querySelectorAll('.ym-preset-chip').forEach(c => c.classList.toggle('active', c === chip));
              container.querySelectorAll('.ym-eq-vertical-slider').forEach((sl, idx) => {
                sl.value = settings.eqBands[idx];
                const badge = sl.closest('.ym-eq-col').querySelector('.ym-eq-badge');
                badge.textContent = settings.eqBands[idx] > 0 ? `+${settings.eqBands[idx]}` : `${settings.eqBands[idx]}`;
              });
              updateCurve();
            }
          });
        });

        const preampSlider = container.querySelector('.ym-preamp-slider');
        const preampVal = container.querySelector('.ym-preamp-val');
        preampSlider.addEventListener('input', (e) => {
          settings.preamp = parseInt(e.target.value, 10);
          saveSettings();
          applyDspSettings();
          preampVal.textContent = `${settings.preamp > 0 ? `+${settings.preamp}` : settings.preamp} dB`;
        });

        container.querySelector('.ym-reset-eq-btn').addEventListener('click', () => {
          settings.eqBands = [0, 0, 0, 0, 0, 0, 0];
          settings.eqPreset = 'flat';
          settings.preamp = 0;
          saveSettings();
          applyDspSettings();

          container.querySelectorAll('.ym-preset-chip').forEach(c => c.classList.toggle('active', c.getAttribute('data-eq') === 'flat'));
          container.querySelectorAll('.ym-eq-vertical-slider').forEach((sl) => {
            sl.value = 0;
            sl.closest('.ym-eq-col').querySelector('.ym-eq-badge').textContent = '0';
          });
          preampSlider.value = 0;
          preampVal.textContent = '0 dB';
          updateCurve();
        });

        tabBody.appendChild(container);
      };

      // -----------------------------------------------------------------------
      // TAB 3: НАСТРОЙКА КАСТОМА
      // -----------------------------------------------------------------------
      const themePalettes = [
        { name: 'Золото Caelestia', hex: '#ebbf89' },
        { name: 'Аметист Неон', hex: '#c678dd' },
        { name: 'Киберпанк Циан', hex: '#56b6c2' },
        { name: 'Рубиновый Кармин', hex: '#e06c75' },
        { name: 'Изумрудный Мох', hex: '#98c379' },
        { name: 'Закатный Янтарь', hex: '#e5c07b' }
      ];

      const renderCustomTab = () => {
        if (activeVinylTimer) {
          clearInterval(activeVinylTimer);
          activeVinylTimer = null;
        }
        tabBody.innerHTML = '';
        const container = document.createElement('div');
        container.className = 'ym-tab-pane';

        container.innerHTML = `
          <div class="ym-section-label">Цветовой акцент интерфейса</div>
          <div class="ym-color-grid">
            ${themePalettes.map(pal => `
              <button type="button" class="ym-color-circle ${settings.themeColor.toLowerCase() === pal.hex.toLowerCase() ? 'active' : ''}" data-hex="${pal.hex}" title="${pal.name}" style="background-color: ${pal.hex};"></button>
            `).join('')}
          </div>

          <div class="ym-section-label" style="margin-top: 14px;">Столбики CAVA (Визуализатор звука)</div>
          <div class="ym-cava-mode-row">
            <button type="button" class="ym-preset-chip ${settings.cavaMode === 'bottom' ? 'active' : ''}" data-cava="bottom">Снизу</button>
            <button type="button" class="ym-preset-chip ${settings.cavaMode === 'top' ? 'active' : ''}" data-cava="top">Сверху</button>
            <button type="button" class="ym-preset-chip ${settings.cavaMode === 'center' ? 'active' : ''}" data-cava="center">По центру</button>
            <button type="button" class="ym-preset-chip ${settings.cavaMode === 'hidden' ? 'active' : ''}" data-cava="hidden">Скрыть</button>
          </div>

          <div class="ym-control-card" style="margin-top: 10px;">
            <div class="ym-ctrl-row">
              <div class="ym-ctrl-title">
                <span>Количество столбцов CAVA</span>
                <span class="ym-ctrl-val" id="ym-cava-bars-val">${settings.cavaBars || 36}</span>
              </div>
            </div>
            <input type="range" class="ym-range-slider" id="ym-cava-bars" min="16" max="64" step="2" value="${settings.cavaBars || 36}">
          </div>

          <div class="ym-control-card" style="margin-top: 10px;">
            <div class="ym-ctrl-row">
              <div class="ym-ctrl-title">
                <span>Чувствительность Cava</span>
                <span class="ym-ctrl-val">${settings.cavaSensitivity}%</span>
              </div>
            </div>
            <input type="range" class="ym-range-slider" id="ym-cava-sens" min="40" max="200" value="${settings.cavaSensitivity}">
          </div>

          <div class="ym-section-label" style="margin-top: 14px;">Облако волны (Фоновая аура)</div>
          <div class="ym-cava-mode-row" style="flex-wrap: wrap;">
            <button type="button" class="ym-preset-chip ${settings.vibeCloudMode === 'theme' ? 'active' : ''}" data-cloud="theme">В цвет темы</button>
            <button type="button" class="ym-preset-chip ${settings.vibeCloudMode === 'space' ? 'active' : ''}" data-cloud="space">Глубокий космос</button>
            <button type="button" class="ym-preset-chip ${settings.vibeCloudMode === 'minimal' ? 'active' : ''}" data-cloud="minimal">Без облака</button>
            <button type="button" class="ym-preset-chip ${settings.vibeCloudMode === 'original' ? 'active' : ''}" data-cloud="original">Оригинал</button>
          </div>

          <div class="ym-control-card" style="margin-top: 10px;">
            <div class="ym-ctrl-row">
              <div class="ym-ctrl-title">
                <span>Яркость ауры</span>
                <span class="ym-ctrl-val">${settings.vibeCloudBrightness || 90}%</span>
              </div>
            </div>
            <input type="range" class="ym-range-slider" id="ym-cloud-bright" min="20" max="120" value="${settings.vibeCloudBrightness || 90}">
          </div>

          <div class="ym-section-label" style="margin-top: 14px;">Стеклянный интерфейс (Glassmorphism)</div>
          <div class="ym-control-card">
            <div class="ym-ctrl-row">
              <div class="ym-ctrl-title">
                <span>Сила размытия (Blur)</span>
                <span class="ym-ctrl-val">${settings.glassBlur}px</span>
              </div>
            </div>
            <input type="range" class="ym-range-slider" id="ym-blur-slider" min="10" max="40" value="${settings.glassBlur}">
          </div>

          <div class="ym-control-card">
            <div class="ym-ctrl-row">
              <div class="ym-ctrl-title">
                <span>Плотность стекла (Opacity)</span>
                <span class="ym-ctrl-val">${settings.glassOpacity}%</span>
              </div>
            </div>
            <input type="range" class="ym-range-slider" id="ym-opacity-slider" min="40" max="98" value="${settings.glassOpacity}">
          </div>
        `;

        container.querySelectorAll('.ym-color-circle').forEach(btn => {
          btn.addEventListener('click', () => {
            settings.themeColor = btn.getAttribute('data-hex');
            saveSettings();
            applyTheme();
            container.querySelectorAll('.ym-color-circle').forEach(b => b.classList.toggle('active', b === btn));
          });
        });

        container.querySelectorAll('[data-cava]').forEach(btn => {
          btn.addEventListener('click', () => {
            settings.cavaMode = btn.getAttribute('data-cava');
            if (cavaContainer) cavaContainer.className = `ym-cava-${settings.cavaMode}`;
            saveSettings();
            container.querySelectorAll('[data-cava]').forEach(b => b.classList.toggle('active', b === btn));
            resizeCanvas();
          });
        });

        const barsSlider = container.querySelector('#ym-cava-bars');
        barsSlider.addEventListener('input', (e) => {
          settings.cavaBars = parseInt(e.target.value, 10);
          saveSettings();
          container.querySelector('#ym-cava-bars-val').textContent = `${settings.cavaBars}`;
        });

        const sensSlider = container.querySelector('#ym-cava-sens');
        sensSlider.addEventListener('input', (e) => {
          settings.cavaSensitivity = parseInt(e.target.value, 10);
          saveSettings();
          sensSlider.previousElementSibling.querySelector('.ym-ctrl-val').textContent = `${settings.cavaSensitivity}%`;
        });

        container.querySelectorAll('[data-cloud]').forEach(btn => {
          btn.addEventListener('click', () => {
            settings.vibeCloudMode = btn.getAttribute('data-cloud');
            saveSettings();
            applyVibeCloud();
            container.querySelectorAll('[data-cloud]').forEach(b => b.classList.toggle('active', b === btn));
          });
        });

        const cloudSlider = container.querySelector('#ym-cloud-bright');
        cloudSlider.addEventListener('input', (e) => {
          settings.vibeCloudBrightness = parseInt(e.target.value, 10);
          saveSettings();
          applyVibeCloud();
          cloudSlider.previousElementSibling.querySelector('.ym-ctrl-val').textContent = `${settings.vibeCloudBrightness}%`;
        });

        const blurSlider = container.querySelector('#ym-blur-slider');
        blurSlider.addEventListener('input', (e) => {
          settings.glassBlur = parseInt(e.target.value, 10);
          saveSettings();
          applyTheme();
          blurSlider.previousElementSibling.querySelector('.ym-ctrl-val').textContent = `${settings.glassBlur}px`;
        });

        const opacitySlider = container.querySelector('#ym-opacity-slider');
        opacitySlider.addEventListener('input', (e) => {
          settings.glassOpacity = parseInt(e.target.value, 10);
          saveSettings();
          applyTheme();
          opacitySlider.previousElementSibling.querySelector('.ym-ctrl-val').textContent = `${settings.glassOpacity}%`;
        });

        tabBody.appendChild(container);
      };

      const renderTabContent = () => {
        tabBody.innerHTML = '';
        if (settings.activeTab === 'headphones') {
          renderHeadphonesTab();
        } else if (settings.activeTab === 'eq') {
          renderEqTab();
        } else if (settings.activeTab === 'custom') {
          renderCustomTab();
        }
      };

      renderTabContent();
      updateHubState();

      // Floating Wave Tuning Capsule Pill ("плашечка в правом нижнем углу")
      let wavePill = document.getElementById('ym-wave-tuning-pill');
      if (!wavePill) {
        wavePill = document.createElement('button');
        wavePill.id = 'ym-wave-tuning-pill';
        wavePill.type = 'button';
        wavePill.setAttribute('aria-label', 'Развернуть настройку волны');
        wavePill.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
          </svg>
          <span>Настройка волны</span>
        `;
        wavePill.addEventListener('click', (e) => {
          e.stopPropagation();
          document.body.classList.toggle('wave-tuning-open');
        });
        document.body.appendChild(wavePill);
      }

      // -----------------------------------------------------------------------
      // WEIGHTLESS FLOATING LYRICS ENGINE
      // -----------------------------------------------------------------------
      const ensureLyricsContainer = () => {
        let el = document.getElementById('ym-vibe-lyrics');
        if (!el) {
          el = document.createElement('div');
          el.id = 'ym-vibe-lyrics';
          document.body.appendChild(el);
          el.addEventListener('click', () => {
            toggleLyrics(false);
          });
        } else if (el.parentElement !== document.body) {
          document.body.appendChild(el);
        }
        return el;
      };
      ensureLyricsContainer();

      let currentLyricsKey = '';
      let lyricsLines = [];
      let isSyncedLyrics = false;
      let activeLyricIdx = -1;

      const toggleLyrics = (forceState) => {
        const container = ensureLyricsContainer();
        const isOpen = typeof forceState === 'boolean' ? forceState : !document.body.classList.contains('ym-lyrics-mode-open');
        document.body.classList.toggle('ym-lyrics-mode-open', isOpen);
        const toggleBtn = document.getElementById('ym-lyrics-toggle-btn');
        if (toggleBtn) toggleBtn.classList.toggle('active', isOpen);
        if (isOpen) {
          fetchAndShowLyrics();
        }
      };

      const parseLrc = (lrcText) => {
        const lines = lrcText.split('\n');
        const list = [];
        const regex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/;
        for (const l of lines) {
          const m = l.match(regex);
          if (m) {
            const min = parseInt(m[1], 10);
            const sec = parseInt(m[2], 10);
            const ms = parseInt(m[3].padEnd(3, '0').slice(0, 3), 10);
            const text = m[4].trim();
            if (text) {
              list.push({ time: min * 60 + sec + ms / 1000, text });
            }
          }
        }
        return list.sort((a, b) => a.time - b.time);
      };

      const renderLyricsUI = (lines, message) => {
        const container = ensureLyricsContainer();
        container.innerHTML = '';
        if (message) {
          const empty = document.createElement('div');
          empty.className = 'ym-lyrics-empty';
          empty.textContent = message;
          container.appendChild(empty);
          return;
        }
        if (!lines || lines.length === 0) {
          const empty = document.createElement('div');
          empty.className = 'ym-lyrics-empty';
          empty.textContent = 'Текст песни не найден';
          container.appendChild(empty);
          return;
        }

        lines.forEach((item, idx) => {
          const lineEl = document.createElement('div');
          lineEl.className = 'ym-lyrics-line';
          lineEl.textContent = item.text;
          lineEl.setAttribute('data-idx', idx);
          if (item.time !== null) {
            lineEl.setAttribute('data-time', item.time);
          }
          lineEl.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleLyrics(false);
          });
          container.appendChild(lineEl);
        });
      };

      const fetchAndShowLyrics = async () => {
        const meta = navigator.mediaSession?.metadata;
        if (!meta || !meta.title) {
          renderLyricsUI(null, 'Нет активного трека');
          return;
        }

        const rawTitle = meta.title || '';
        const rawArtist = meta.artist || '';
        const cleanTitle = rawTitle.replace(/\s*[\(\[][^\)\]]*(?:remaster|deluxe|version|explicit|feat|live|bonus|mono|stereo)[^\)\]]*[\)\]]/gi, '').trim();
        const cleanArtist = rawArtist.replace(/\s*,\s*.*$/, '').trim();
        const trackKey = `${cleanTitle}:::${cleanArtist}`;

        if (trackKey === currentLyricsKey && lyricsLines.length > 0) {
          renderLyricsUI(lyricsLines);
          return;
        }

        currentLyricsKey = trackKey;
        lyricsLines = [];
        activeLyricIdx = -1;
        renderLyricsUI(null, 'Поиск текста песни...');

        try {
          let data = null;

          // Strategy 1: Direct GET with clean title & artist
          try {
            const url1 = `https://lrclib.net/api/get?track_name=${encodeURIComponent(cleanTitle)}&artist_name=${encodeURIComponent(cleanArtist)}`;
            const res1 = await fetch(url1, { headers: { 'User-Agent': 'YandexMusicDesktop/1.0' } });
            if (res1.ok) data = await res1.json();
          } catch (e1) {}

          // Strategy 2: Direct GET without punctuation (e.g. "Не завидуй!" -> "Не завидуй")
          if (!data || (!data.syncedLyrics && !data.plainLyrics)) {
            const noPunctTitle = cleanTitle.replace(/[!?,.:;'"«»()\[\]]/g, '').trim();
            if (noPunctTitle && noPunctTitle !== cleanTitle) {
              try {
                const url2 = `https://lrclib.net/api/get?track_name=${encodeURIComponent(noPunctTitle)}&artist_name=${encodeURIComponent(cleanArtist)}`;
                const res2 = await fetch(url2, { headers: { 'User-Agent': 'YandexMusicDesktop/1.0' } });
                if (res2.ok) data = await res2.json();
              } catch (e2) {}
            }
          }

          // Strategy 3: General search query ?q= (e.g. "Конец фильма Не завидуй")
          if (!data || (!data.syncedLyrics && !data.plainLyrics)) {
            try {
              const query = `${cleanArtist} ${cleanTitle}`.trim();
              const sUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(query)}`;
              const sRes = await fetch(sUrl, { headers: { 'User-Agent': 'YandexMusicDesktop/1.0' } });
              if (sRes.ok) {
                const list = await sRes.json();
                if (Array.isArray(list) && list.length > 0) {
                  data = list.find(item => (item.syncedLyrics || item.plainLyrics)) || list[0];
                }
              }
            } catch (e3) {}
          }

          if (data && data.syncedLyrics) {
            isSyncedLyrics = true;
            lyricsLines = parseLrc(data.syncedLyrics);
            renderLyricsUI(lyricsLines);
          } else if (data && data.plainLyrics) {
            isSyncedLyrics = false;
            lyricsLines = data.plainLyrics.split('\n').map(t => ({ time: null, text: t.trim() })).filter(t => t.text);
            renderLyricsUI(lyricsLines);
          } else {
            renderLyricsUI(null, 'Текст песни не найден');
          }
        } catch (e) {
          console.warn('Lyrics fetch failed:', e);
          renderLyricsUI(null, 'Текст песни не найден');
        }
      };

      // Periodic check for synced lyrics scrolling, track changes, button mounting and aura sync
      setInterval(() => {
        if (!document.getElementById('ym-lyrics-toggle-btn')) {
          mountPlayerLyricsBtn();
        }

        // Check if currently on Vibe page or in Fullscreen player
        const vibeRoot = document.querySelector('[class*="VibePage_root"]');
        const isOnVibe = !!vibeRoot && vibeRoot.offsetParent !== null;
        const isFullscreen = !!document.querySelector('[class*="FullscreenPlayerDesktop_root"]');

        const pill = document.getElementById('ym-wave-tuning-pill');
        const lyricsEl = document.getElementById('ym-vibe-lyrics');

        if (!isOnVibe || isFullscreen) {
          if (document.body.classList.contains('ym-lyrics-mode-open')) {
            toggleLyrics(false);
          }
          if (document.body.classList.contains('wave-tuning-open')) {
            document.body.classList.remove('wave-tuning-open');
          }
          if (pill) pill.style.display = 'none';
          if (lyricsEl) lyricsEl.style.display = 'none';
          return;
        } else {
          if (pill) pill.style.display = '';
          if (lyricsEl && document.body.classList.contains('ym-lyrics-mode-open')) {
            lyricsEl.style.display = '';
          }
        }

        if (!document.body.classList.contains('ym-lyrics-mode-open')) return;

        ensureLyricsContainer();


        const meta = navigator.mediaSession?.metadata;
        if (meta && meta.title) {
          const cleanTitle = (meta.title || '').replace(/\s*[\(\[][^\)\]]*(?:remaster|deluxe|version|explicit|feat|live|bonus|mono|stereo)[^\)\]]*[\)\]]/gi, '').trim();
          const cleanArtist = (meta.artist || '').replace(/\s*,\s*.*$/, '').trim();
          const trackKey = `${cleanTitle}:::${cleanArtist}`;
          if (trackKey !== currentLyricsKey) {
            fetchAndShowLyrics();
            return;
          }
        }

        if (!isSyncedLyrics || lyricsLines.length === 0) return;

        const overlay = document.querySelector('[class*="VibePlayerbarMeta_timecodeOverlay"]') ||
                        document.querySelector('[class*="VibePlayerbarTimecodeWithOverlay_timecode"]') ||
                        document.querySelector('[class*="ChangeTimecode_timecode"]') ||
                        document.querySelector('[class*="Timecode_"]') ||
                        document.querySelector('[data-test-id*="timecode"]');
        if (!overlay || !overlay.textContent) return;
        const m = overlay.textContent.match(/(\d{1,2}):(\d{2})/);
        if (!m) return;
        const curSec = parseInt(m[1], 10) * 60 + parseInt(m[2], 10);

        let newIdx = -1;
        for (let i = 0; i < lyricsLines.length; i++) {
          if (lyricsLines[i].time <= curSec + 0.35) {
            newIdx = i;
          } else {
            break;
          }
        }

        if (newIdx !== activeLyricIdx && newIdx >= 0) {
          activeLyricIdx = newIdx;
          const container = document.getElementById('ym-vibe-lyrics');
          if (container) {
            const allEls = container.querySelectorAll('.ym-lyrics-line');
            allEls.forEach((el, idx) => {
              if (idx === newIdx) {
                el.classList.add('active');
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              } else {
                el.classList.remove('active');
              }
            });
          }
        }
      }, 300);

      // Add Lyrics button on Player Bar (слегка левее с запасом до кнопки «...»)
      const mountPlayerLyricsBtn = () => {
        let lyricsBtn = document.getElementById('ym-lyrics-toggle-btn');
        if (!lyricsBtn) {
          lyricsBtn = document.createElement('button');
          lyricsBtn.id = 'ym-lyrics-toggle-btn';
          lyricsBtn.type = 'button';
          lyricsBtn.setAttribute('title', 'Текст песни (Lyrics)');
          lyricsBtn.setAttribute('aria-label', 'Текст песни');
          lyricsBtn.innerHTML = `
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 18V5l12-2v13"></path>
              <circle cx="6" cy="18" r="3"></circle>
              <circle cx="18" cy="16" r="3"></circle>
            </svg>
          `;
          lyricsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleLyrics();
          });
        }

        lyricsBtn.classList.toggle('active', document.body.classList.contains('ym-lyrics-mode-open'));

        // Locate the 3-dots "More" button in player bar across all page variants
        const ctxBtn = document.querySelector('button[aria-label*="Контекст"]') ||
                        document.querySelector('button[aria-label*="меню"]') ||
                        document.querySelector('[class*="PlayerBarDesktop_moreButton"]') ||
                        document.querySelector('[class*="trackContextMenuIcon"]') ||
                        document.querySelector('[class*="settingsButton"]') ||
                        document.querySelector('[class*="VibePlayerControls"] [class*="moreButton"]') ||
                        document.querySelector('button[aria-label*="Действия"]') ||
                        document.querySelector('button[aria-label*="ещё"]') ||
                        document.querySelector('button[data-test-id*="MORE"]');

        if (ctxBtn) {
          const target = (ctxBtn.parentElement && ctxBtn.parentElement.parentElement && ctxBtn.parentElement.parentElement.classList.contains('VibePlayerBar_progress__Cri6E'))
            ? ctxBtn.parentElement
            : ctxBtn;
          if (target && target.parentElement) {
            if (lyricsBtn.parentElement !== target.parentElement || lyricsBtn.nextElementSibling !== target) {
              target.parentElement.insertBefore(lyricsBtn, target);
            }
          }
        }
      };
      mountPlayerLyricsBtn();

      // Inject "Текст песни" into 3-dots context menu
      const checkAndInjectContextMenuLyrics = () => {
        const menu = document.querySelector('[data-test-id="VIBE_CONTEXT_MENU"], .ggP7WX2_erziDHFOo32s');
        if (!menu || menu.querySelector('.ym-lyrics-menu-btn')) return;

        const btn = document.createElement('button');
        btn.className = 'cpeagBA1_PblpJn8Xgtv UDMYhpDjiAFT3xUx268O dgV08FKVLZKFsucuiryn IlG7b1K0AD7E7AMx6F5p HbaqudSqu7Q3mv3zMPGr qU2apWBO1yyEK0lZ3lPO kc5CjvU5hT9KEj0iTt3C EiyUV4aCJzpfNzuihfMM ym-lyrics-menu-btn';
        btn.type = 'button';
        btn.setAttribute('role', 'menuitem');
        btn.setAttribute('tabindex', '0');
        btn.innerHTML = `
          <span class="JjlbHZ4FaP9EAcR_1DxF">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 12px; color: var(--sys-primary, #ebbf89); flex-shrink: 0;">
              <path d="M9 18V5l12-2v13"></path>
              <circle cx="6" cy="18" r="3"></circle>
              <circle cx="18" cy="16" r="3"></circle>
            </svg>
          </span>
          <span class="Xb0D75iQdE3p41aYqV02">Текст песни</span>
        `;
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
          toggleLyrics(true);
        });

        const soundItem = Array.from(menu.children).find(c => c.textContent.includes('Настройки звука'));
        if (soundItem && soundItem.nextSibling) {
          menu.insertBefore(btn, soundItem.nextSibling);
        } else {
          menu.appendChild(btn);
        }
      };

      // Close wave tuning on outside click
      document.addEventListener('click', (e) => {
        if (!document.body.classList.contains('wave-tuning-open')) return;
        const wheel = document.querySelector('[class*="WheelDesktop_root"], [class*="VibePage_wheel"]');
        const pill = document.getElementById('ym-wave-tuning-pill');
        if (wheel && (wheel.contains(e.target) || e.target === wheel)) return;
        if (pill && (pill.contains(e.target) || e.target === pill)) return;
        document.body.classList.remove('wave-tuning-open');
      });

      // Immediate route change detection (close Vibe lyrics and wave drawer when navigating)
      const handleRouteChange = () => {
        setTimeout(() => {
          const vibeRoot = document.querySelector('[class*="VibePage_root"]');
          const isOnVibe = !!vibeRoot && vibeRoot.offsetParent !== null;
          const isFullscreen = !!document.querySelector('[class*="FullscreenPlayerDesktop_root"]');
          if (!isOnVibe || isFullscreen) {
            toggleLyrics(false);
            document.body.classList.remove('wave-tuning-open');
            const pill = document.getElementById('ym-wave-tuning-pill');
            if (pill) pill.style.display = 'none';
            const lyricsEl = document.getElementById('ym-vibe-lyrics');
            if (lyricsEl) lyricsEl.style.display = 'none';
          }
        }, 30);
      };

      window.addEventListener('popstate', handleRouteChange);
      window.addEventListener('hashchange', handleRouteChange);
      document.addEventListener('click', (e) => {
        if (e.target.closest('a[href], button[class*="NavbarItem"], [data-test-id*="nav"]')) {
          handleRouteChange();
        }
      }, true);


      let obsExtraTimer = null;
      const debouncedObsExtra = () => {
        if (obsExtraTimer) return;
        obsExtraTimer = setTimeout(() => {
          obsExtraTimer = null;
          checkAndInjectContextMenuLyrics();
          if (!document.getElementById('ym-lyrics-toggle-btn')) {
            mountPlayerLyricsBtn();
          }
        }, 500);
      };

      const obsExtra = new MutationObserver(debouncedObsExtra);
      obsExtra.observe(document.body, { childList: true, subtree: false });
      return true;
    }

    // Helper: hex to rgba
    function hexToRgba(hex, alpha) {
      hex = hex.replace('#', '');
      if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
      const num = parseInt(hex, 16);
      return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
    }

    // Attempt mounting immediately if ready
    let obs = null;
    function tryMount() {
      if (mountUI()) {
        if (obs) {
          obs.disconnect();
          obs = null;
        }
        return true;
      }
      return false;
    }
    if (document.body) tryMount();

    // Observe document for React mounting VibePage only until mounted
    if (!document.getElementById('ym-audio-hub-root')) {
      const rootNode = document.documentElement || document;
      if (rootNode) {
        obs = new MutationObserver(() => tryMount());
        obs.observe(rootNode, { childList: true, subtree: true });
      }
    }

    // Cleanup on exit
    window.addEventListener('beforeunload', () => {
      if (animId) cancelAnimationFrame(animId);
    });
  }

  // Export and auto-run
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = initAudioHub;
  }
  if (typeof window !== 'undefined') {
    window.initAudioHub = initAudioHub;
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => initAudioHub());
    } else {
      initAudioHub();
    }
  }
})();
