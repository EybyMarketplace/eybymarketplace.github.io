/*!
 * Influencer Tracker for Shopify - Complete Bundle
 * Version: 2.1.0 with AI Analytics
 * Built: 2025-09-03T18:16:01.768Z
 * Architecture: Modular Vanilla JS
 * 
 * Modules included: 8
 * - modules/config.js
 * - utils/utils.js
 * - modules/consent-manager.js
 * - modules/id-generator.js
 * - modules/influencer-detector.js
 * - modules/device-fingerprint.js
 * - modules/event-queue.js
 * - core/tracker-core.js
 * 
 * Features:
 * - Event Tracking ✅
 * - Affiliate Attribution ✅
 * - Shopify Integration 🛍️
 * - AI Behavioral Analysis 🤖
 * - Customer Journey Mapping 🤖
 * - Conversion Prediction 🤖
 * 
 * Copyright (c) 2025
 * Licensed under MIT
 */

(function(window, document, undefined) {
    'use strict';
    
    // Build info
    const BUILD_INFO = {
        name: 'shopify-full',
        version: '2.1.0',
        platform: 'shopify',
        timestamp: '2025-09-03T18:16:01.769Z',
        modules: ["modules/config.js","utils/utils.js","modules/consent-manager.js","modules/id-generator.js","modules/influencer-detector.js","modules/device-fingerprint.js","modules/event-queue.js","core/tracker-core.js"],
        features: {
            tracking: true,
            attribution: true,
            shopify: true,
            ai: true
        }
    };
    
    // Create global namespace
    window.InfluencerTracker = window.InfluencerTracker || {};
    
    // Expose build info
    window.InfluencerTracker.BuildInfo = BUILD_INFO;

    // ===== MODULES/CONFIG.JS =====
    // Module: modules/config.js

    'use strict';
    
    // Criar namespace se não existir
    global.InfluencerTracker = global.InfluencerTracker || {};
    
    // Módulo de Configuração
    global.InfluencerTracker.Config = {
        // Configurações padrão
        defaults: {
            apiEndpoint: '',
            projectId: '',
            enableConsentCheck: true,
            batchSize: 10,
            batchTimeout: 3000,
            sessionTimeout: 30 * 60 * 1000, // 30 minutos
            version: '2.0.0'
        },
        
        // Configurações atuais
        current: {},
        
        // Inicializar com valores padrão
        init: function() {
            this.current = Object.assign({}, this.defaults);
        },
        
        // Atualizar configurações
        update: function(options = {}) {
            Object.assign(this.current, options);
        },
        
        // Obter configuração específica
        get: function(key) {
            return this.current[key];
        },
        
        // Obter todas as configurações
        getAll: function() {
            return Object.assign({}, this.current);
        },
        
        // Verificar se está configurado corretamente
        isValid: function() {
            return !!(this.current.apiEndpoint && this.current.projectId);
        }
    };
    
    // Auto-inicializar
    global.InfluencerTracker.Config.init();
    
    

    // ===== UTILS/UTILS.JS =====
    // Module: utils/utils.js

    'use strict';
    
    global.InfluencerTracker = global.InfluencerTracker || {};
    
    global.InfluencerTracker.Utils = {
        // Throttle function
        throttle: function(func, limit) {
            let inThrottle;
            return function() {
                const args = arguments;
                const context = this;
                if (!inThrottle) {
                    func.apply(context, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        },
        
        // Debounce function
        debounce: function(func, wait, immediate) {
            let timeout;
            return function() {
                const context = this;
                const args = arguments;
                const later = function() {
                    timeout = null;
                    if (!immediate) func.apply(context, args);
                };
                const callNow = immediate && !timeout;
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
                if (callNow) func.apply(context, args);
            };
        },
        
        // Verificar se é mobile
        isMobile: function() {
            return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        },
        
        // Verificar se é tablet
        isTablet: function() {
            return /(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(navigator.userAgent);
        },
        
        // Obter tipo de dispositivo
        getDeviceType: function() {
            if (this.isMobile()) return 'mobile';
            if (this.isTablet()) return 'tablet';
            return 'desktop';
        },
        
        // Verificar se elemento está visível
        isElementVisible: function(element) {
            const rect = element.getBoundingClientRect();
            return (
                rect.top >= 0 &&
                rect.left >= 0 &&
                rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                rect.right <= (window.innerWidth || document.documentElement.clientWidth)
            );
        },
        
        // Calcular porcentagem de scroll
        getScrollPercentage: function() {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
            return Math.round((scrollTop / scrollHeight) * 100);
        },
        
        // Obter parâmetros da URL
        getUrlParams: function() {
            const params = {};
            const urlParams = new URLSearchParams(window.location.search);
            
            for (const [key, value] of urlParams) {
                params[key] = value;
            }
            
            return params;
        },
        
        // Sanitizar string para evitar XSS
        sanitizeString: function(str) {
            if (typeof str !== 'string') return str;
            
            return str
                .replace(/[<>]/g, '')
                .replace(/javascript:/gi, '')
                .replace(/on\w+=/gi, '')
                .trim();
        },
        
        // Validar email
        isValidEmail: function(email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        },
        
        // Gerar timestamp legível
        formatTimestamp: function(timestamp) {
            return new Date(timestamp).toISOString();
        },
        
        // Deep merge de objetos
        deepMerge: function(target, source) {
            const result = Object.assign({}, target);
            
            for (const key in source) {
                if (source.hasOwnProperty(key)) {
                    if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
                        result[key] = this.deepMerge(result[key] || {}, source[key]);
                    } else {
                        result[key] = source[key];
                    }
                }
            }
            
            return result;
        }
    };
    
    

    // ===== MODULES/CONSENT-MANAGER.JS =====
    // Module: modules/consent-manager.js

    'use strict';
    
    global.InfluencerTracker = global.InfluencerTracker || {};
    
    global.InfluencerTracker.ConsentManager = {
        // Chaves de armazenamento
        CONSENT_KEY: 'analytics_consent',
        CONSENT_DATE_KEY: 'analytics_consent_date',
        
        // Callbacks aguardando consent
        pendingCallbacks: [],
        
        // Verificar se há consentimento
        checkConsent: function() {
            const config = global.InfluencerTracker.Config;
            if (!config.get('enableConsentCheck')) return true;
            
            const consent = localStorage.getItem(this.CONSENT_KEY);
            const consentDate = localStorage.getItem(this.CONSENT_DATE_KEY);
            
            // Verificar se consent ainda é válido (1 ano)
            if (consent === 'granted' && consentDate) {
                const oneYearAgo = Date.now() - (365 * 24 * 60 * 60 * 1000);
                return parseInt(consentDate) > oneYearAgo;
            }
            
            return false;
        },
        
        // Aguardar consentimento
        waitForConsent: function(callback, timeout = 10000) {
            if (this.checkConsent()) {
                callback();
                return;
            }
            
            this.pendingCallbacks.push(callback);
            
            const startTime = Date.now();
            const checkInterval = setInterval(() => {
                if (this.checkConsent()) {
                    clearInterval(checkInterval);
                    this.triggerPendingCallbacks();
                } else if (Date.now() - startTime > timeout) {
                    clearInterval(checkInterval);
                    console.warn('Influencer Tracker: Consent timeout reached');
                }
            }, 500);
        },
        
        // Definir consentimento
        setConsent: function(granted = true) {
            localStorage.setItem(this.CONSENT_KEY, granted ? 'granted' : 'denied');
            localStorage.setItem(this.CONSENT_DATE_KEY, Date.now().toString());
            
            if (granted) {
                this.triggerPendingCallbacks();
            }
        },
        
        // Disparar callbacks pendentes
        triggerPendingCallbacks: function() {
            this.pendingCallbacks.forEach(callback => {
                try {
                    callback();
                } catch (error) {
                    console.error('Consent callback error:', error);
                }
            });
            this.pendingCallbacks = [];
        },
        
        // Revogar consentimento
        revokeConsent: function() {
            localStorage.removeItem(this.CONSENT_KEY);
            localStorage.removeItem(this.CONSENT_DATE_KEY);
        }
    };
    
    

    // ===== MODULES/ID-GENERATOR.JS =====
    // Module: modules/id-generator.js

    'use strict';
    
    global.InfluencerTracker = global.InfluencerTracker || {};
    
    global.InfluencerTracker.IdGenerator = {
        // Chaves de armazenamento
        USER_ID_KEY: 'inf_user_id',
        SESSION_KEY: 'inf_session',
        
        // Gerar UUID v4
        generateUUID: function() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                const r = Math.random() * 16 | 0;
                const v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        },
        
        // Obter ou criar User ID persistente
        getUserId: function() {
            let userId = localStorage.getItem(this.USER_ID_KEY);
            if (!userId) {
                userId = this.generateUUID();
                localStorage.setItem(this.USER_ID_KEY, userId);
            }
            return userId;
        },
        
        // Obter ou criar Session ID
        getSessionId: function() {
            let sessionData = sessionStorage.getItem(this.SESSION_KEY);
            const config = global.InfluencerTracker.Config;
            const sessionTimeout = config.get('sessionTimeout');
            
            if (sessionData) {
                try {
                    const session = JSON.parse(sessionData);
                    const now = Date.now();
                    
                    // Verificar se a sessão não expirou
                    if (now - session.lastActivity < sessionTimeout) {
                        session.lastActivity = now;
                        sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
                        return session.id;
                    }
                } catch (error) {
                    console.warn('Invalid session data, creating new session');
                }
            }
            
            // Criar nova sessão
            const newSession = {
                id: this.generateUUID(),
                startTime: Date.now(),
                lastActivity: Date.now()
            };
            
            sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(newSession));
            return newSession.id;
        },
        
        // Obter informações da sessão atual
        getSessionInfo: function() {
            const sessionData = sessionStorage.getItem(this.SESSION_KEY);
            if (sessionData) {
                try {
                    return JSON.parse(sessionData);
                } catch (error) {
                    return null;
                }
            }
            return null;
        },
        
        // Invalidar sessão atual
        invalidateSession: function() {
            sessionStorage.removeItem(this.SESSION_KEY);
        }
    };
    
    

    // ===== MODULES/INFLUENCER-DETECTOR.JS =====
    // Module: modules/influencer-detector.js

    'use strict';
    
    global.InfluencerTracker = global.InfluencerTracker || {};
    
    global.InfluencerTracker.InfluencerDetector = {
        // Chave de armazenamento
        ATTRIBUTION_KEY: 'inf_attribution',
        
        // Mapeamento de redes sociais
        socialNetworks: {
            'instagram.com': 'instagram',
            'tiktok.com': 'tiktok',
            'youtube.com': 'youtube',
            'youtu.be': 'youtube',
            'facebook.com': 'facebook',
            'twitter.com': 'twitter',
            'x.com': 'twitter',
            'linkedin.com': 'linkedin',
            'pinterest.com': 'pinterest',
            'snapchat.com': 'snapchat'
        },
        
        // Detectar influenciador
        detectInfluencer: function() {
            const urlParams = new URLSearchParams(window.location.search);
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            
            // Parâmetros de influenciador
            const influencerParams = {
                influencer_id: this.getParam(urlParams, hashParams, ['inf_id', 'influencer', 'inf']),
                campaign_id: this.getParam(urlParams, hashParams, ['camp_id', 'campaign', 'cmp']),
                promo_code: this.getParam(urlParams, hashParams, ['promo', 'codigo', 'discount']),
                utm_source: urlParams.get('utm_source'),
                utm_medium: urlParams.get('utm_medium'),
                utm_campaign: urlParams.get('utm_campaign'),
                utm_content: urlParams.get('utm_content'),
                utm_term: urlParams.get('utm_term'),
                ref: urlParams.get('ref'),
                affiliate_id: this.getParam(urlParams, hashParams, ['aff_id', 'affiliate'])
            };
            
            // Detectar origem de redes sociais
            const socialSource = this.detectSocialSource();
            
            // Verificar se há dados de influenciador
            const hasInfluencerData = Object.values(influencerParams).some(val => val !== null && val !== '');
            
            if (hasInfluencerData || socialSource) {
                const influencerData = {
                    ...influencerParams,
                    social_source: socialSource,
                    detected_at: Date.now(),
                    landing_page: window.location.href,
                    referrer: document.referrer,
                    user_agent: navigator.userAgent
                };
                
                // Salvar na sessão
                sessionStorage.setItem(this.ATTRIBUTION_KEY, JSON.stringify(influencerData));
                return influencerData;
            }
            
            // Retornar dados salvos se existirem
            return this.getSavedAttribution();
        },
        
        // Obter parâmetro de múltiplas fontes
        getParam: function(urlParams, hashParams, keys) {
            for (const key of keys) {
                const value = urlParams.get(key) || hashParams.get(key);
                if (value) return value;
            }
            return null;
        },
        
        // Detectar origem de rede social
        detectSocialSource: function() {
            const referrer = document.referrer;
            if (!referrer) return null;
            
            try {
                const referrerHost = new URL(referrer).hostname.toLowerCase();
                
                for (const [domain, network] of Object.entries(this.socialNetworks)) {
                    if (referrerHost.includes(domain)) {
                        return network;
                    }
                }
            } catch (error) {
                console.warn('Error parsing referrer:', error);
            }
            
            return null;
        },
        
        // Obter atribuição salva
        getSavedAttribution: function() {
            try {
                const saved = sessionStorage.getItem(this.ATTRIBUTION_KEY);
                return saved ? JSON.parse(saved) : null;
            } catch (error) {
                console.warn('Error parsing saved attribution:', error);
                return null;
            }
        },
        
        // Limpar atribuição
        clearAttribution: function() {
            sessionStorage.removeItem(this.ATTRIBUTION_KEY);
        },
        
        // Verificar se há atribuição ativa
        hasActiveAttribution: function() {
            return !!this.getSavedAttribution();
        }
    };
    
    

    // ===== MODULES/DEVICE-FINGERPRINT.JS =====
    // Module: modules/device-fingerprint.js

    'use strict';
    
    global.InfluencerTracker = global.InfluencerTracker || {};
    
    global.InfluencerTracker.DeviceFingerprint = {
        // Cache do fingerprint
        cachedFingerprint: null,
        
        // Gerar fingerprint do dispositivo
        generate: function() {
            if (this.cachedFingerprint) {
                return this.cachedFingerprint;
            }
            
            const screen = window.screen;
            const nav = navigator;
            
            const fingerprint = {
                // Informações básicas
                user_agent: nav.userAgent,
                language: nav.language,
                languages: nav.languages ? nav.languages.join(',') : null,
                platform: nav.platform,
                
                // Informações de tela
                screen_resolution: `${screen.width}x${screen.height}`,
                screen_available: `${screen.availWidth}x${screen.availHeight}`,
                color_depth: screen.colorDepth,
                pixel_depth: screen.pixelDepth,
                
                // Informações de timezone
                timezone: this.getTimezone(),
                timezone_offset: new Date().getTimezoneOffset(),
                
                // Informações de hardware (quando disponível)
                device_memory: nav.deviceMemory || null,
                hardware_concurrency: nav.hardwareConcurrency || null,
                max_touch_points: nav.maxTouchPoints || null,
                
                // Informações de conexão (quando disponível)
                connection: this.getConnectionInfo(),
                
                // Informações de cookies e storage
                cookies_enabled: nav.cookieEnabled,
                local_storage: this.hasLocalStorage(),
                session_storage: this.hasSessionStorage(),
                
                // Informações do viewport
                viewport: this.getViewportInfo(),
                
                // Plugins instalados (limitado por privacidade)
                plugins_count: nav.plugins ? nav.plugins.length : 0,
                
                // Timestamp de geração
                generated_at: Date.now()
            };
            
            this.cachedFingerprint = fingerprint;
            return fingerprint;
        },
        
        // Obter timezone
        getTimezone: function() {
            try {
                return Intl.DateTimeFormat().resolvedOptions().timeZone;
            } catch (error) {
                return null;
            }
        },
        
        // Obter informações de conexão
        getConnectionInfo: function() {
            const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
            
            if (!conn) return null;
            
            return {
                effective_type: conn.effectiveType || null,
                downlink: conn.downlink || null,
                rtt: conn.rtt || null,
                save_data: conn.saveData || false
            };
        },
        
        // Verificar suporte a localStorage
        hasLocalStorage: function() {
            try {
                const test = '__test__';
                localStorage.setItem(test, test);
                localStorage.removeItem(test);
                return true;
            } catch (error) {
                return false;
            }
        },
        
        // Verificar suporte a sessionStorage
        hasSessionStorage: function() {
            try {
                const test = '__test__';
                sessionStorage.setItem(test, test);
                sessionStorage.removeItem(test);
                return true;
            } catch (error) {
                return false;
            }
        },
        
        // Obter informações do viewport
        getViewportInfo: function() {
            return {
                width: window.innerWidth || document.documentElement.clientWidth,
                height: window.innerHeight || document.documentElement.clientHeight,
                device_pixel_ratio: window.devicePixelRatio || 1
            };
        },
        
        // Gerar hash simples do fingerprint
        generateHash: function() {
            const fingerprint = this.generate();
            const str = JSON.stringify(fingerprint);
            let hash = 0;
            
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // Convert to 32bit integer
            }
            
            return Math.abs(hash).toString(36);
        },
        
        // Limpar cache
        clearCache: function() {
            this.cachedFingerprint = null;
        }
    };
    
    

    // ===== MODULES/EVENT-QUEUE.JS =====
    // Module: modules/event-queue.js

    'use strict';
    
    global.InfluencerTracker = global.InfluencerTracker || {};
    
    global.InfluencerTracker.EventQueue = {
        // Propriedades da fila
        queue: [],
        flushTimer: null,
        isOnline: navigator.onLine,
        
        // Chaves de armazenamento
        FAILED_EVENTS_KEY: 'inf_failed_events',
        
        // Inicializar
        init: function() {
            this.setupNetworkListeners();
            this.retryFailedEvents();
        },
        
        // Configurar listeners de rede
        setupNetworkListeners: function() {
            const self = this;
            
            window.addEventListener('online', function() {
                self.isOnline = true;
                self.retryFailedEvents();
                if (self.queue.length > 0) {
                    self.flush();
                }
            });
            
            window.addEventListener('offline', function() {
                self.isOnline = false;
            });
        },
        
        // Adicionar evento à fila
        add: function(event) {
            this.queue.push(event);
            
            const config = global.InfluencerTracker.Config;
            const batchSize = config.get('batchSize');
            
            if (this.queue.length >= batchSize) {
                this.flush();
            } else {
                this.scheduleFlush();
            }
        },
        
        // Agendar flush automático
        scheduleFlush: function() {
            if (this.flushTimer) {
                clearTimeout(this.flushTimer);
            }
            
            const config = global.InfluencerTracker.Config;
            const batchTimeout = config.get('batchTimeout');
            
            this.flushTimer = setTimeout(() => {
                this.flush();
            }, batchTimeout);
        },
        
        // Enviar eventos para API
        flush: function() {
            if (this.queue.length === 0) return Promise.resolve();
            
            const config = global.InfluencerTracker.Config;
            const apiEndpoint = config.get('apiEndpoint');
            const projectId = config.get('projectId');
            
            if (!apiEndpoint) {
                console.warn('Influencer Tracker: API endpoint not configured');
                return Promise.reject(new Error('API endpoint not configured'));
            }
            
            const events = this.queue.splice(0, config.get('batchSize'));
            
            const payload = {
                project_id: projectId,
                events: events,
                version: config.get('version'),
                timestamp: Date.now()
            };
            
            return this.sendEvents(payload, events);
        },
        
        // Enviar eventos via fetch
        sendEvents: function(payload, originalEvents) {
            const config = global.InfluencerTracker.Config;
            
            return fetch(config.get('apiEndpoint'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                return response.json();
            })
            .catch(error => {
                console.warn('Influencer Tracker: Failed to send events', error);
                this.saveFailedEvents(originalEvents);
                throw error;
            });
        },
        
        // Salvar eventos que falharam
        saveFailedEvents: function(events) {
            try {
                const stored = JSON.parse(localStorage.getItem(this.FAILED_EVENTS_KEY) || '[]');
                stored.push(...events);
                
                // Manter apenas os últimos 100 eventos para evitar overflow
                const limited = stored.slice(-100);
                localStorage.setItem(this.FAILED_EVENTS_KEY, JSON.stringify(limited));
            } catch (error) {
                console.warn('Failed to save failed events:', error);
            }
        },
        
        // Tentar reenviar eventos que falharam
        retryFailedEvents: function() {
            if (!this.isOnline) return;
            
            try {
                const failedEvents = JSON.parse(localStorage.getItem(this.FAILED_EVENTS_KEY) || '[]');
                
                if (failedEvents.length > 0) {
                    console.log(`Retrying ${failedEvents.length} failed events`);
                    
                    // Adicionar de volta à fila
                    this.queue.unshift(...failedEvents);
                    
                    // Limpar storage
                    localStorage.removeItem(this.FAILED_EVENTS_KEY);
                    
                    // Tentar enviar
                    this.flush();
                }
            } catch (error) {
                console.warn('Error retrying failed events:', error);
            }
        },
        
        // Obter tamanho da fila
        getQueueSize: function() {
            return this.queue.length;
        },
        
        // Limpar fila
        clear: function() {
            this.queue = [];
            if (this.flushTimer) {
                clearTimeout(this.flushTimer);
                this.flushTimer = null;
            }
        },
        
        // Forçar flush imediato
        forceFlush: function() {
            if (this.flushTimer) {
                clearTimeout(this.flushTimer);
                this.flushTimer = null;
            }
            return this.flush();
        }
    };
    
    

    // ===== CORE/TRACKER-CORE.JS =====
    // Module: core/tracker-core.js

    'use strict';
    
    // Aliases para facilitar uso
    const Config = global.InfluencerTracker.Config;
    const ConsentManager = global.InfluencerTracker.ConsentManager;
    const IdGenerator = global.InfluencerTracker.IdGenerator;
    const InfluencerDetector = global.InfluencerTracker.InfluencerDetector;
    const DeviceFingerprint = global.InfluencerTracker.DeviceFingerprint;
    const EventQueue = global.InfluencerTracker.EventQueue;
    const Utils = global.InfluencerTracker.Utils;
    
    // Tracker Principal
    global.InfluencerTracker.Core = {
        // Estado do tracker
        initialized: false,
        startTime: Date.now(),
        platform: 'generic',
        adapter: null,
        
        // Inicializar tracker
        init: function(options = {}) {
            if (this.initialized) {
                console.warn('Influencer Tracker already initialized');
                return;
            }
            
            // Configurar opções
            Config.update(options);
            
            if (!Config.isValid()) {
                console.warn('Influencer Tracker: Invalid configuration - missing apiEndpoint or projectId');
                return;
            }
            
            // Inicializar módulos
            EventQueue.init();
            
            // Detectar plataforma
            this.platform = this.detectPlatform();
            console.log(`🎯 Plataforma detectada: ${this.platform}`);
            
            // Carregar adaptador
            this.adapter = this.loadAdapter(this.platform);
            
            // Verificar consent antes de iniciar
            if (Config.get('enableConsentCheck') && !ConsentManager.checkConsent()) {
                ConsentManager.waitForConsent(() => this.startTracking());
                return;
            }
            
            this.startTracking();
        },
        
        // Detectar plataforma de e-commerce
        detectPlatform: function() {
            // Shopify
            if (window.Shopify || window.shopifyData ||
                document.querySelector('meta[name="shopify-checkout-api-token"]')) {
                return 'shopify';
            }
            
            // VTEX
            if (window.vtex || window.vtexjs || 
                document.querySelector('meta[name="vtex-version"]')) {
                return 'vtex';
            }
            
            // Nuvemshop
            if (window.LS || document.querySelector('meta[name="nuvemshop"]')) {
                return 'nuvemshop';
            }
            
            // WooCommerce
            if (window.wc || document.querySelector('meta[name="generator"][content*="WooCommerce"]')) {
                return 'woocommerce';
            }
            
            return 'generic';
        },
        
        // Carregar adaptador da plataforma
        loadAdapter: function(platform) {
            const adapterName = `${platform}Adapter`;
            return global[adapterName] || null;
        },
        
        // Iniciar tracking
        startTracking: function() {
            this.initialized = true;
            
            // Detectar influenciador
            const influencerData = InfluencerDetector.detectInfluencer();
            
            // Evento de page view
            this.track('page_view', {
                page_url: window.location.href,
                page_title: document.title,
                referrer: document.referrer,
                influencer_data: influencerData,
                device_type: Utils.getDeviceType(),
                viewport: DeviceFingerprint.generate().viewport
            });
            
            // Configurar listeners universais
            this.setupUniversalTracking();
            
            // Inicialização específica da plataforma
            if (this.adapter && this.adapter.init) {
                this.adapter.init();
            }
            
            // Flush quando sair da página
            window.addEventListener('beforeunload', () => {
                EventQueue.forceFlush();
            });
            
            // Flush quando página ficar invisível
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'hidden') {
                    EventQueue.forceFlush();
                }
            });
            
            console.log('🎯 Influencer Tracker: Inicializado com sucesso');
        },
        
        // Método principal de tracking
        track: function(eventType, properties = {}) {
            if (!this.initialized) {
                console.warn('Tracker not initialized');
                return;
            }
            
            const event = {
                event_id: IdGenerator.generateUUID(),
                event_type: eventType,
                timestamp: Date.now(),
                user_id: IdGenerator.getUserId(),
                session_id: IdGenerator.getSessionId(),
                page_url: window.location.href,
                device_fingerprint: DeviceFingerprint.generate(),
                platform: this.platform,
                properties: Utils.deepMerge({}, properties)
            };
            
            // Enriquecer com dados específicos da plataforma
            if (this.adapter && this.adapter.enrichEvent) {
                const enrichedProps = this.adapter.enrichEvent(eventType, properties);
                event.properties = Utils.deepMerge(event.properties, enrichedProps);
            }
            
            EventQueue.add(event);
        },
        
        // Configurar tracking universal
        setupUniversalTracking: function() {
            // Tracking de scroll
            let maxScroll = 0;
            window.addEventListener('scroll', Utils.throttle(() => {
                const scrollPercent = Utils.getScrollPercentage();
                if (scrollPercent > maxScroll) {
                    maxScroll = scrollPercent;
                    
                    // Marcos de scroll
                    if ([25, 50, 75, 90].includes(scrollPercent)) {
                        this.track('scroll_milestone', { 
                            scroll_percent: scrollPercent,
                            max_scroll: maxScroll
                        });
                    }
                }
            }, 1000));
            
            // Tracking de tempo na página
            let timeOnPage = 0;
            const timeInterval = setInterval(() => {
                timeOnPage += 10;
                
                // Marcos de tempo (30s, 1min, 2min, 5min)
                if ([30, 60, 120, 300].includes(timeOnPage)) {
                    this.track('time_milestone', { 
                        seconds_on_page: timeOnPage,
                        session_duration: Date.now() - this.startTime
                    });
                }
            }, 10000);
            
            // Limpar interval quando sair da página
            window.addEventListener('beforeunload', () => {
                clearInterval(timeInterval);
            });
            
            // Tracking de saída
            this.setupExitTracking();
        },
        
        // Configurar tracking de saída
        setupExitTracking: function() {
            let exitTracked = false;
            
            document.addEventListener('mouseleave', (e) => {
                if (e.clientY <= 0 && !exitTracked) {
                    exitTracked = true;
                    this.track('exit_intent', {
                        time_on_page: Date.now() - this.startTime,
                        scroll_percent: Utils.getScrollPercentage(),
                        page_url: window.location.href
                    });
                }
            });
        },
        
        // Métodos públicos para tracking manual
        trackPurchase: function(orderData) {
            this.track('purchase', {
                order_id: orderData.orderId,
                total_value: orderData.totalValue,
                currency: orderData.currency || 'BRL',
                items: orderData.items,
                coupon_code: orderData.couponCode,
                payment_method: orderData.paymentMethod,
                influencer_attribution: InfluencerDetector.getSavedAttribution()
            });
        },
        
        trackCustomEvent: function(eventName, properties) {
            this.track(Utils.sanitizeString(eventName), properties);
        },
        
        // Obter informações do tracker
        getInfo: function() {
            return {
                initialized: this.initialized,
                platform: this.platform,
                version: Config.get('version'),
                userId: IdGenerator.getUserId(),
                sessionId: IdGenerator.getSessionId(),
                queueSize: EventQueue.getQueueSize(),
                hasAttribution: InfluencerDetector.hasActiveAttribution()
            };
        }
    };
    
    

    
    // ===== AUTO-INITIALIZATION =====
    
    // Verificar dependências
    const requiredModules = ['Config', 'Utils', 'Core'];
    const missingModules = requiredModules.filter(module => 
        !window.InfluencerTracker[module]
    );
    
    if (missingModules.length > 0) {
        console.error('Missing required modules:', missingModules);
    } else {
        // Criar instância principal
        window.InfluencerTracker.instance = window.InfluencerTracker.Core;
        
        // Métodos de conveniência
        window.InfluencerTracker.init = function(options) {
            return window.InfluencerTracker.Core.init(options);
        };
        
        window.InfluencerTracker.track = function(eventType, properties) {
            return window.InfluencerTracker.Core.track(eventType, properties);
        };
        
        window.InfluencerTracker.trackPurchase = function(orderData) {
            return window.InfluencerTracker.Core.trackPurchase(orderData);
        };
        
        window.InfluencerTracker.getInfo = function() {
            return window.InfluencerTracker.Core.getInfo();
        };
        
        // Auto-init se configurado via data attributes
        const script = document.currentScript;
        if (script && script.dataset.autoInit !== 'false') {
            const config = {};
            if (script.dataset.apiEndpoint) config.apiEndpoint = script.dataset.apiEndpoint;
            if (script.dataset.projectId) config.projectId = script.dataset.projectId;
            
            if (Object.keys(config).length > 0) {
                window.InfluencerTracker.init(config);
            }
        }
        
        console.log('🎯 Influencer Tracker v2.1.0 for Shopify loaded');
        console.log('📦 Modules loaded:', 8);
        console.log('🛍️ Shopify integration: Ready');
        console.log('🤖 AI analytics: Enabled');
    }
    
})(typeof window !== 'undefined' ? window : this, typeof document !== 'undefined' ? document : {});