/*!
 * Influencer Tracker v2.1.0
 * Shopify Adapter - Complete Build
 * Built: 2025-09-04
 * 
 * This file contains all modules required for Shopify integration
 * including tracking, analytics, and AI data collection.
 */


/* === src/utils/utils.js === */
/*!
 * Influencer Tracker - Utilities Module
 */
(function(window) {
    'use strict';
    
    window.InfluencerTracker = window.InfluencerTracker || {};
    
    window.InfluencerTracker.Utils = {
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
        
        // Calcular porcentagem de scroll
        getScrollPercentage: function() {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
            return Math.round((scrollTop / scrollHeight) * 100);
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
    
    console.log('🔧 Utils module loaded');
    
})(window);


/* === src/modules/config.js === */
/*!
 * Influencer Tracker - Configuration Module
 */
(function(window) {
    'use strict';
    
    // Criar namespace se não existir
    window.InfluencerTracker = window.InfluencerTracker || {};
    
    // Módulo de Configuração
    window.InfluencerTracker.Config = {
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
    window.InfluencerTracker.Config.init();
    
    console.log('📋 Config module loaded');
    
})(window);


/* === src/modules/consent-manager.js === */
/*!
 * Influencer Tracker - Consent Manager Module (LGPD)
 */
(function(window) {
    'use strict';
    
    window.InfluencerTracker = window.InfluencerTracker || {};
    
    window.InfluencerTracker.ConsentManager = {
        // Chaves de armazenamento
        CONSENT_KEY: 'analytics_consent',
        CONSENT_DATE_KEY: 'analytics_consent_date',
        
        // Callbacks aguardando consent
        pendingCallbacks: [],
        
        // Verificar se há consentimento
        checkConsent: function() {
            const config = window.InfluencerTracker.Config;
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
    
    console.log('🔒 ConsentManager module loaded');
    
})(window);


/* === src/modules/id-generator.js === */
/*!
 * Influencer Tracker - ID Generator Module
 */
(function(window) {
    'use strict';
    
    window.InfluencerTracker = window.InfluencerTracker || {};
    
    window.InfluencerTracker.IdGenerator = {
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
            const config = window.InfluencerTracker.Config;
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
    
    console.log('🆔 IdGenerator module loaded');
    
})(window);


/* === src/modules/influencer-detector.js === */
/*!
 * Influencer Tracker - Influencer Detector Module
 */
(function(window) {
    'use strict';
    
    window.InfluencerTracker = window.InfluencerTracker || {};
    
    window.InfluencerTracker.InfluencerDetector = {
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
    
    console.log('🎯 InfluencerDetector module loaded');
    
})(window);


/* === src/modules/device-fingerprint.js === */
/*!
 * Influencer Tracker - Device Fingerprint Module
 */
(function(window) {
    'use strict';
    
    window.InfluencerTracker = window.InfluencerTracker || {};
    
    window.InfluencerTracker.DeviceFingerprint = {
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
    
    console.log('🔍 DeviceFingerprint module loaded');
    
})(window);


/* === src/modules/event-queue.js === */
/*!
 * Influencer Tracker - Event Queue Module
 */
(function(window) {
    'use strict';
    
    window.InfluencerTracker = window.InfluencerTracker || {};
    
    window.InfluencerTracker.EventQueue = {
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
            
            const config = window.InfluencerTracker.Config;
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
            
            const config = window.InfluencerTracker.Config;
            const batchTimeout = config.get('batchTimeout');
            
            this.flushTimer = setTimeout(() => {
                this.flush();
            }, batchTimeout);
        },
        
        // Enviar eventos para API
        flush: function() {
            if (this.queue.length === 0) return Promise.resolve();
            
            const config = window.InfluencerTracker.Config;
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
            const config = window.InfluencerTracker.Config;
            
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
    
    console.log('📤 EventQueue module loaded');
    
})(window);


/* === src/core/tracker-core.js === */
/*!
 * Influencer Tracker - Core Module
 */
(function(window) {
    'use strict';
    
    // Aliases para facilitar uso
    const Config = window.InfluencerTracker.Config;
    const ConsentManager = window.InfluencerTracker.ConsentManager;
    const IdGenerator = window.InfluencerTracker.IdGenerator;
    const InfluencerDetector = window.InfluencerTracker.InfluencerDetector;
    const DeviceFingerprint = window.InfluencerTracker.DeviceFingerprint;
    const EventQueue = window.InfluencerTracker.EventQueue;
    const Utils = window.InfluencerTracker.Utils;
    
    // Tracker Principal
    window.InfluencerTracker.Core = {
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
            
            return 'generic';
        },
        
        // Carregar adaptador da plataforma
        loadAdapter: function(platform) {
            const adapterName = `${platform}Adapter`;
            return window[adapterName] || null;
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
    
    console.log('🎯 TrackerCore module loaded');
    
})(window);


/* === src/adapters/shopify/utils/data-extractors.js === */
/*!
 * Data Extractors Utility Module
 */

(function (window) {
    'use strict';

    window.ShopifyAdapterModules = window.ShopifyAdapterModules || {};

    window.ShopifyAdapterModules.DataExtractors = {
        extractProductData: function () {
            const productData = {};

            // Tentar múltiplas fontes
            if (window.product) {
                productData.product_id = window.product.id;
                productData.product_handle = window.product.handle;
                productData.product_title = window.product.title;
                productData.product_type = window.product.type;
                productData.vendor = window.product.vendor;
                productData.price = window.product.price / 100;
                productData.available = window.product.available;
                productData.variants_count = window.product.variants?.length || 0;
            } else if (window.meta?.product) {
                productData.product_id = window.meta.product.id;
                productData.product_handle = window.meta.product.handle;
            }

            // Fallback para meta tags
            if (!productData.product_id) {
                const metaProduct = document.querySelector('meta[property="product:retailer_item_id"]');
                if (metaProduct) productData.product_id = metaProduct.content;
            }

            return Object.keys(productData).length > 0 ? productData : null;
        },

        extractCollectionData: function () {
            const collectionData = {};

            if (window.collection) {
                collectionData.collection_id = window.collection.id;
                collectionData.collection_handle = window.collection.handle;
                collectionData.collection_title = window.collection.title;
                collectionData.products_count = window.collection.products_count;
            }

            return Object.keys(collectionData).length > 0 ? collectionData : null;
        },

        extractCustomerData: function () {
            const customerData = {};

            if (window.customer) {
                customerData.customer_id = window.customer.id;
                customerData.customer_email = window.customer.email;
                customerData.customer_tags = window.customer.tags;
                customerData.orders_count = window.customer.orders_count;
                customerData.total_spent = window.customer.total_spent;
            } else if (window.Shopify?.customer) {
                customerData.customer_id = window.Shopify.customer.id;
                customerData.customer_email = window.Shopify.customer.email;
            }

            return Object.keys(customerData).length > 0 ? customerData : null;
        },

        extractShopData: function () {
            return {
                shop_domain: window.Shopify?.shop || window.shopifyData?.shop?.domain,
                shop_currency: window.Shopify?.currency?.active || window.shopifyData?.shop?.currency,
                shop_money_format: window.Shopify?.money_format,
                shop_locale: window.Shopify?.locale
            };
        },

        extractOrderData: function () {
            const orderData = {};

            // Shopify checkout object
            if (window.Shopify?.checkout) {
                orderData.order_id = window.Shopify.checkout.order_id;
                orderData.order_number = window.Shopify.checkout.order_number;
                orderData.total_price = window.Shopify.checkout.total_price / 100;
                orderData.currency = window.Shopify.checkout.currency;
                orderData.customer_id = window.Shopify.checkout.customer_id;
            }

            // Fallback: extrair do DOM
            if (!orderData.order_id) {
                const orderElement = document.querySelector('.order-number, [data-order-number], .order-id');
                if (orderElement) {
                    orderData.order_number = orderElement.textContent?.trim();
                }
            }

            return orderData;
        },

        getProductId: function () {
            if (window.product?.id) return window.product.id;
            if (window.meta?.product?.id) return window.meta.product.id;

            const metaProduct = document.querySelector('meta[property="product:retailer_item_id"]');
            return metaProduct ? metaProduct.content : null;
        },

        getProductHandle: function () {
            if (window.product?.handle) return window.product.handle;

            const pathParts = window.location.pathname.split('/');
            return pathParts[pathParts.length - 1] || null;
        }
    };

    console.log('📦 Data Extractors module loaded');

})(window);


/* === src/adapters/shopify/utils/session-manager.js === */
/*!
 * Session Manager Module
 */

(function (window) {
    'use strict';

    window.ShopifyAdapterModules = window.ShopifyAdapterModules || {};

    window.ShopifyAdapterModules.SessionManager = {
        // Checkout Session Management
        saveCheckoutSession: function (sessionData) {
            try {
                sessionStorage.setItem('checkout_session', JSON.stringify(sessionData));
            } catch (e) {
                console.log('Erro ao salvar sessão de checkout:', e);
            }
        },

        getCheckoutSession: function () {
            try {
                return JSON.parse(sessionStorage.getItem('checkout_session') || 'null');
            } catch (e) {
                return null;
            }
        },

        clearCheckoutSession: function () {
            try {
                sessionStorage.removeItem('checkout_session');
            } catch (e) {
                console.log('Erro ao limpar sessão de checkout:', e);
            }
        },

        // User Journey Management
        saveUserJourney: function (journeyData) {
            try {
                const journey = this.getUserJourney() || [];
                journey.push({
                    timestamp: Date.now(),
                    ...journeyData
                });

                // Manter apenas últimos 100 eventos
                sessionStorage.setItem('user_journey', JSON.stringify(journey.slice(-100)));
            } catch (e) {
                console.log('Erro ao salvar jornada do usuário:', e);
            }
        },

        getUserJourney: function () {
            try {
                return JSON.parse(sessionStorage.getItem('user_journey') || '[]');
            } catch (e) {
                return [];
            }
        },

        // Attribution Management
        saveAttribution: function (attributionData) {
            try {
                sessionStorage.setItem('inf_attribution', JSON.stringify(attributionData));
            } catch (e) {
                console.log('Erro ao salvar atribuição:', e);
            }
        },

        getAttribution: function () {
            try {
                return JSON.parse(sessionStorage.getItem('inf_attribution') || 'null');
            } catch (e) {
                return null;
            }
        },

        // Performance Metrics
        savePerformanceMetric: function (metric, value) {
            try {
                const metrics = this.getPerformanceMetrics();
                metrics[metric] = {
                    value: value,
                    timestamp: Date.now()
                };
                sessionStorage.setItem('performance_metrics', JSON.stringify(metrics));
            } catch (e) {
                console.log('Erro ao salvar métrica de performance:', e);
            }
        },

        getPerformanceMetrics: function () {
            try {
                return JSON.parse(sessionStorage.getItem('performance_metrics') || '{}');
            } catch (e) {
                return {};
            }
        },

        // Generic Storage Methods
        setItem: function (key, value, storage = 'session') {
            try {
                const storageObj = storage === 'local' ? localStorage : sessionStorage;
                storageObj.setItem(key, JSON.stringify(value));
            } catch (e) {
                console.log(`Erro ao salvar ${key}:`, e);
            }
        },

        getItem: function (key, defaultValue = null, storage = 'session') {
            try {
                const storageObj = storage === 'local' ? localStorage : sessionStorage;
                const item = storageObj.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (e) {
                console.log(`Erro ao recuperar ${key}:`, e);
                return defaultValue;
            }
        },

        removeItem: function (key, storage = 'session') {
            try {
                const storageObj = storage === 'local' ? localStorage : sessionStorage;
                storageObj.removeItem(key);
            } catch (e) {
                console.log(`Erro ao remover ${key}:`, e);
            }
        },

        // Cleanup Methods
        clearExpiredData: function () {
            const now = Date.now();
            const oneDay = 24 * 60 * 60 * 1000;

            // Limpar dados antigos de abandono
            try {
                const abandonmentData = JSON.parse(localStorage.getItem('checkout_abandonment') || 'null');
                if (abandonmentData && (now - abandonmentData.abandonment_time) > oneDay) {
                    localStorage.removeItem('checkout_abandonment');
                }
            } catch (e) {
                console.log('Erro ao limpar dados de abandono:', e);
            }

            // Limpar métricas antigas
            try {
                const metrics = this.getPerformanceMetrics();
                Object.keys(metrics).forEach(key => {
                    if ((now - metrics[key].timestamp) > oneDay) {
                        delete metrics[key];
                    }
                });
                sessionStorage.setItem('performance_metrics', JSON.stringify(metrics));
            } catch (e) {
                console.log('Erro ao limpar métricas antigas:', e);
            }
        }
    };

    console.log('📦 Session Manager module loaded');

})(window);


/* === src/adapters/shopify/core/state-manager.js === */
/*!
 * State Manager for Shopify Adapter
 */

(function (window) {
    'use strict';

    window.ShopifyAdapterModules = window.ShopifyAdapterModules || {};

    window.ShopifyAdapterModules.StateManager = {
        lastCartState: null,
        lastScrollPercent: 0,
        timeOnPage: 0,
        exitTracked: false,

        init: function (core) {
            this.core = core;
            this.initializeCartState();
            this.initializePageState();
        },

        initializeCartState: function () {
            fetch('/cart.js')
                .then(response => response.json())
                .then(cartData => {
                    this.lastCartState = {
                        items: cartData.item_count || 0,
                        total: cartData.total_price ? cartData.total_price / 100 : 0,
                        currency: cartData.currency || 'USD',
                        token: cartData.token
                    };

                    console.log('🛒 Estado inicial do carrinho:', this.lastCartState);
                })
                .catch(e => {
                    console.log('⚠️ Erro ao carregar estado inicial do carrinho:', e);
                    this.lastCartState = { items: 0, total: 0, currency: 'USD', token: null };
                });
        },

        initializePageState: function () {
            this.savePageVisit({
                page_type: this.detectPageType(),
                referrer: document.referrer
            });
        },

        detectPageType: function () {
            const path = window.location.pathname;

            if (path.includes('/products/')) return 'product';
            if (path.includes('/collections/')) return 'collection';
            if (path.includes('/cart')) return 'cart';
            if (path.includes('/checkout')) return 'checkout';
            if (path.includes('/thank_you') || path.includes('/orders/')) return 'thank_you';
            if (path === '/' || path === '') return 'home';

            return 'other';
        },

        savePageVisit: function (pageData) {
            try {
                const pages = this.getPagesVisited();
                pages.push({
                    url: window.location.href,
                    title: document.title,
                    timestamp: Date.now(),
                    ...pageData
                });

                sessionStorage.setItem('pages_visited', JSON.stringify(pages.slice(-50)));
            } catch (e) {
                console.log('Erro ao salvar visita de página:', e);
            }
        },

        getPagesVisited: function () {
            try {
                return JSON.parse(sessionStorage.getItem('pages_visited') || '[]');
            } catch (e) {
                return [];
            }
        }
    };

    console.log('🛒 StateManager module loaded');

})(window);


/* === src/adapters/shopify/core/adapter-core.js === */
/*!
 * Shopify Adapter Core
 */

(function (window) {
    'use strict';

    window.ShopifyAdapterModules = window.ShopifyAdapterModules || {};

    window.ShopifyAdapterModules.AdapterCore = {
        initialized: false,
        startTime: Date.now(),

        init: function (modules = {}) {
            if (this.initialized) return;

            console.log('🔄 Inicializando Shopify Adapter Core');

            // Initialize all provided modules
            Object.entries(modules).forEach(([name, module]) => {
                if (module && typeof module.init === 'function') {
                    try {
                        module.init(this);
                        console.log(`✅ Módulo ${name} inicializado`);
                    } catch (error) {
                        console.error(`❌ Erro ao inicializar módulo ${name}:`, error);
                    }
                }
            });

            this.initialized = true;
            console.log('✅ Shopify Adapter Core inicializado');
        },

        track: function (eventType, properties = {}) {
            // Use the main tracker
            if (window.InfluencerTracker && window.InfluencerTracker.track) {
                window.InfluencerTracker.track(eventType, properties);
            } else {
                console.log('📊 Evento rastreado:', eventType, properties);
            }
        }
    };

    console.log('🔄 Shopify Adapter Core loaded');

})(window);


/* === src/adapters/shopify/ecommerce/cart-tracker.js === */
/*!
 * Cart Tracking Module
 */

(function (window) {
    'use strict';

    window.ShopifyAdapterModules = window.ShopifyAdapterModules || {};

    window.ShopifyAdapterModules.CartTracker = {
        init: function (core) {
            this.core = core;
            this.stateManager = window.ShopifyAdapterModules.StateManager;
            this.setupCartTracking();
        },

        setupCartTracking: function () {
            console.log('🛒 Configurando tracking de carrinho');
            this.setupSmartPolling();
            this.listenToShopifyEvents();
        },

        setupSmartPolling: function () {
            let pollInterval = 30000;

            const checkCartState = async () => {
                try {
                    const response = await fetch('/cart.js');
                    if (response.ok) {
                        const cartData = await response.json();
                        this.handleCartData(cartData, 'polling');
                    }
                } catch (e) {
                    console.log('🔄 Erro no polling:', e);
                }
            };

            setInterval(() => {
                const isActive = document.hasFocus() && !document.hidden;
                pollInterval = isActive ? 20000 : 60000;
                checkCartState();
            }, pollInterval);

            console.log('✅ Polling inteligente configurado');
        },

        listenToShopifyEvents: function () {
            const shopifyEvents = [
                'cart:updated', 'cart:added', 'cart:removed', 'cart:changed',
                'product:added-to-cart', 'ajaxCart:updated', 'drawer:updated'
            ];

            shopifyEvents.forEach(eventName => {
                document.addEventListener(eventName, (e) => {
                    console.log(`🛒 Evento Shopify detectado: ${eventName}`);
                    setTimeout(() => {
                        this.refreshCartState('shopify_event', eventName, e.detail);
                    }, 300);
                });
            });

            if (window.jQuery) {
                const $ = window.jQuery;
                $(document).on('cart.requestComplete', (event, cart) => {
                    console.log('🛒 Evento jQuery cart.requestComplete');
                    this.handleCartData(cart, 'jquery_event');
                });
            }
        },

        handleCartAdd: function (data, url) {
            console.log('🛒 Produto adicionado ao carrinho:', data);

            this.core.track('cart_add', {
                product_id: data.product_id,
                variant_id: data.variant_id || data.id,
                quantity: data.quantity || 1,
                price: data.price ? data.price / 100 : null,
                title: data.title || data.product_title,
                vendor: data.vendor,
                product_type: data.product_type,
                api_endpoint: url,
                timestamp: Date.now()
            });

            setTimeout(() => this.refreshCartState('cart_add'), 500);
        },

        handleCartUpdate: function (data, url) {
            console.log('🛒 Carrinho atualizado:', data);

            this.core.track('cart_update_action', {
                updates: data.updates || data,
                api_endpoint: url,
                timestamp: Date.now()
            });

            setTimeout(() => this.refreshCartState('cart_update'), 500);
        },

        handleCartClear: function (url) {
            console.log('🛒 Carrinho limpo');

            this.core.track('cart_clear', {
                api_endpoint: url,
                timestamp: Date.now()
            });

            setTimeout(() => this.refreshCartState('cart_clear'), 500);
        },

        handleCartData: function (data, source) {
            const currentState = {
                items: data.item_count || 0,
                total: data.total_price ? data.total_price / 100 : 0,
                currency: data.currency || 'USD',
                token: data.token
            };

            const lastState = this.stateManager.lastCartState;

            if (!lastState ||
                currentState.items !== lastState.items ||
                Math.abs(currentState.total - lastState.total) > 0.01) {

                console.log('🛒 Estado do carrinho mudou:', lastState, '→', currentState);

                const changeType = this.determineChangeType(lastState, currentState);

                this.core.track('cart_update', {
                    cart_items: currentState.items,
                    cart_value: currentState.total,
                    cart_currency: currentState.currency,
                    cart_token: currentState.token,
                    previous_items: lastState?.items || 0,
                    previous_value: lastState?.total || 0,
                    change_type: changeType,
                    change_trigger: source,
                    items_detail: data.items ? data.items.map(item => ({
                        product_id: item.product_id,
                        variant_id: item.variant_id,
                        quantity: item.quantity,
                        price: item.price / 100,
                        line_price: item.line_price / 100,
                        title: item.title,
                        vendor: item.vendor,
                        product_type: item.product_type,
                        handle: item.handle,
                        sku: item.sku,
                        grams: item.grams,
                        properties: item.properties
                    })) : [],
                    total_discount: data.total_discount ? data.total_discount / 100 : 0,
                    discounts: data.cart_level_discount_applications || [],
                    cart_note: data.note,
                    cart_attributes: data.attributes || {},
                    timestamp: Date.now()
                });

                this.stateManager.lastCartState = currentState;
            }
        },

        refreshCartState: function (trigger, eventName = null, eventDetail = null) {
            setTimeout(async () => {
                try {
                    const response = await fetch('/cart.js');
                    if (response.ok) {
                        const cartData = await response.json();
                        this.handleCartData(cartData, trigger);
                    }
                } catch (e) {
                    console.log('🔄 Erro ao atualizar estado do carrinho:', e);
                }
            }, 300);
        },

        determineChangeType: function (previous, current) {
            if (!previous) return 'initial';
            if (current.items > previous.items) return 'add';
            if (current.items < previous.items) return 'remove';
            if (Math.abs(current.total - previous.total) > 0.01) return 'update';
            return 'unknown';
        }
    };

    console.log('🛒 Cart Tracker module loaded');

})(window);


/* === src/adapters/shopify/ecommerce/product-tracker.js === */
/*!
 * Product Tracking Module
 */

(function (window) {
    'use strict';

    window.ShopifyAdapterModules = window.ShopifyAdapterModules || {};

    window.ShopifyAdapterModules.ProductTracker = {
        init: function (core) {
            this.core = core;
            this.dataExtractors = window.ShopifyAdapterModules.DataExtractors;
            this.setupProductTracking();
        },

        setupProductTracking: function () {
            console.log('📦 Configurando tracking de produtos');
            this.trackPageType();
            this.trackVariantSelections();
        },

        trackPageType: function () {
            const path = window.location.pathname;
            let pageType = 'other';

            if (path.includes('/products/')) {
                pageType = 'product';
                this.trackProductView();
            } else if (path.includes('/collections/')) {
                pageType = 'collection';
                this.trackCollectionView();
            } else if (path.includes('/cart')) {
                pageType = 'cart';
            } else if (path.includes('/checkout')) {
                pageType = 'checkout';
            } else if (path === '/' || path === '') {
                pageType = 'home';
            }

            this.core.track('page_view_detailed', {
                page_type: pageType,
                page_path: path,
                page_title: document.title,
                referrer: document.referrer,
                timestamp: Date.now()
            });
        },

        trackProductView: function () {
            const productData = this.dataExtractors.extractProductData();

            if (productData) {
                this.core.track('product_view', {
                    ...productData,
                    timestamp: Date.now()
                });

                this.saveProductView(productData);
            }
        },

        trackCollectionView: function () {
            const collectionData = this.dataExtractors.extractCollectionData();

            if (collectionData) {
                this.core.track('collection_view', {
                    ...collectionData,
                    timestamp: Date.now()
                });
            }
        },

        trackVariantSelections: function () {
            const variantSelectors = [
                'input[name="id"]',
                'select[name="id"]',
                '[data-variant-id]',
                '.product-variant-id'
            ];

            variantSelectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(element => {
                    element.addEventListener('change', () => {
                        this.core.track('variant_selection', {
                            product_id: this.dataExtractors.getProductId(),
                            variant_id: element.value || element.dataset.variantId,
                            product_handle: this.dataExtractors.getProductHandle(),
                            selection_method: element.tagName.toLowerCase(),
                            timestamp: Date.now()
                        });
                    });
                });
            });
        },

        handleProductData: function (data, url) {
            console.log('📦 Dados de produto carregados:', data);

            this.core.track('product_data_loaded', {
                product_id: data.id,
                product_handle: data.handle,
                product_title: data.title,
                product_type: data.product_type,
                vendor: data.vendor,
                price_min: data.price_min / 100,
                price_max: data.price_max / 100,
                available: data.available,
                variants_count: data.variants ? data.variants.length : 0,
                images_count: data.images ? data.images.length : 0,
                tags: data.tags || [],
                api_endpoint: url,
                timestamp: Date.now()
            });
        },

        saveProductView: function (productData) {
            try {
                const products = this.getProductsViewed();
                products.push({
                    timestamp: Date.now(),
                    ...productData
                });

                sessionStorage.setItem('products_viewed', JSON.stringify(products.slice(-20)));
            } catch (e) {
                console.log('Erro ao salvar visualização de produto:', e);
            }
        },

        getProductsViewed: function () {
            try {
                return JSON.parse(sessionStorage.getItem('products_viewed') || '[]');
            } catch (e) {
                return [];
            }
        }
    };

    console.log('📦 Product Tracker module loaded');

})(window);


/* === src/adapters/shopify/checkout/checkout-tracker.js === */
/*!
 * Checkout Tracking Module
 */

(function (window) {
    'use strict';

    window.ShopifyAdapterModules = window.ShopifyAdapterModules || {};

    window.ShopifyAdapterModules.CheckoutTracker = {
        isInitialized: false,
        checkoutStartTime: null,
        checkoutSteps: [],
        currentStep: null,
        checkoutSessionData: {},
        abandonmentTracked: false,

        init: function (core) {
            this.core = core;
            this.sessionManager = window.ShopifyAdapterModules.SessionManager;
            this.dataExtractors = window.ShopifyAdapterModules.DataExtractors;
            this.setupCheckoutTracking();
            this.isInitialized = true;
        },

        setupCheckoutTracking: function () {
            console.log('💳 Configurando checkout tracking');

            if (this.isCheckoutPage()) {
                this.initCheckoutTracking();
            }

            this.monitorCheckoutNavigation();

            if (this.isThankYouPage()) {
                this.handlePurchaseCompletion();
            }

            this.checkForAbandonedCheckout();
        },

        isCheckoutPage: function () {
            return window.location.pathname.includes('/checkout') ||
                window.location.pathname.includes('/checkouts/') ||
                document.querySelector('.checkout, #checkout, [data-checkout]') ||
                document.querySelector('body.checkout, body[class*="checkout"]');
        },

        isThankYouPage: function () {
            return window.location.pathname.includes('/thank_you') ||
                window.location.pathname.includes('/orders/') ||
                document.querySelector('.order-confirmation, .thank-you, [data-order-confirmation]');
        },

        monitorCheckoutNavigation: function () {
            document.addEventListener('click', (e) => {
                const element = e.target;

                if (this.isCheckoutButton(element)) {
                    this.core.track('checkout_button_clicked', {
                        button_text: element.textContent?.trim(),
                        button_location: this.getElementLocation(element),
                        cart_value: this.getCartValue(),
                        cart_items: this.getCartItemCount(),
                        influencer_attribution: this.getInfluencerAttribution(),
                        timestamp: Date.now()
                    });
                }
            });

            let lastUrl = window.location.href;
            const urlObserver = new MutationObserver(() => {
                const currentUrl = window.location.href;
                if (currentUrl !== lastUrl) {
                    if (this.isCheckoutPage() && !lastUrl.includes('/checkout')) {
                        setTimeout(() => this.initCheckoutTracking(), 500);
                    }
                    lastUrl = currentUrl;
                }
            });

            urlObserver.observe(document, { subtree: true, childList: true });
        },

        isCheckoutButton: function (element) {
            const text = element.textContent?.toLowerCase() || '';
            const classes = (element.className?.baseVal ?? element.className)?.toLowerCase() || '';
            const id = element.id?.toLowerCase() || '';

            const checkoutKeywords = ['checkout', 'finalizar', 'comprar', 'buy now', 'purchase'];

            return checkoutKeywords.some(keyword =>
                text.includes(keyword) ||
                classes.includes(keyword) ||
                id.includes(keyword)
            ) || element.matches('[href*="/checkout"], [data-checkout], .checkout-btn, .btn-checkout');
        },

        initCheckoutTracking: function () {
            if (this.checkoutStartTime) return;

            console.log('💳 Inicializando tracking de checkout');

            this.checkoutStartTime = Date.now();
            this.checkoutSteps = [];
            this.currentStep = this.detectCheckoutStep();
            this.checkoutSessionData = this.initCheckoutSession();
            this.abandonmentTracked = false;

            this.core.track('checkout_started', {
                checkout_id: this.generateCheckoutId(),
                cart_value: this.getCartValue(),
                cart_items: this.getCartItemCount(),
                cart_details: this.getCartDetails(),
                influencer_attribution: this.getInfluencerAttribution(),
                customer_journey: this.getCustomerJourney(),
                entry_method: this.getCheckoutEntryMethod(),
                device_info: this.getDeviceInfo(),
                initial_step: this.currentStep,
                timestamp: Date.now()
            });

            this.sessionManager.saveCheckoutSession(this.checkoutSessionData);
            this.monitorCheckoutSteps();

            console.log('✅ Checkout tracking ativo para step:', this.currentStep);
        },

        initCheckoutSession: function () {
            return {
                checkout_id: this.generateCheckoutId(),
                start_time: Date.now(),
                steps_data: {},
                form_interactions: {},
                performance_metrics: {},
                user_behavior: {
                    scroll_events: [],
                    click_events: [],
                    focus_events: []
                }
            };
        },

        generateCheckoutId: function () {
            return 'checkout_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        },

        detectCheckoutStep: function () {
            // Estratégia 1: Atributos data
            if (document.querySelector('[data-step="contact"], [data-checkout-step="contact"]')) return 'contact';
            if (document.querySelector('[data-step="shipping"], [data-checkout-step="shipping"]')) return 'shipping';
            if (document.querySelector('[data-step="payment"], [data-checkout-step="payment"]')) return 'payment';
            if (document.querySelector('[data-step="review"], [data-checkout-step="review"]')) return 'review';

            // Estratégia 2: Classes CSS
            if (document.querySelector('.step-contact, .checkout-step-contact')) return 'contact';
            if (document.querySelector('.step-shipping, .checkout-step-shipping')) return 'shipping';
            if (document.querySelector('.step-payment, .checkout-step-payment')) return 'payment';
            if (document.querySelector('.step-review, .checkout-step-review')) return 'review';

            // Estratégia 3: Conteúdo da página
            if (document.querySelector('input[name="email"], #email')) return 'contact';
            if (document.querySelector('select[name="country"], input[name="address1"]')) return 'shipping';
            if (document.querySelector('input[name="number"], [data-payment]')) return 'payment';

            // Estratégia 4: URL
            const url = window.location.href;
            if (url.includes('contact')) return 'contact';
            if (url.includes('shipping')) return 'shipping';
            if (url.includes('payment')) return 'payment';
            if (url.includes('review')) return 'review';

            return 'unknown';
        },

        monitorCheckoutSteps: function () {
            const observer = new MutationObserver(() => {
                const newStep = this.detectCheckoutStep();

                if (newStep !== this.currentStep && newStep !== 'unknown') {
                    const stepTime = Date.now() - this.checkoutStartTime;
                    const previousStep = this.currentStep;

                    console.log(`💳 Step mudou: ${previousStep} → ${newStep}`);

                    if (previousStep && previousStep !== 'unknown') {
                        this.core.track('checkout_step_completed', {
                            checkout_id: this.checkoutSessionData.checkout_id,
                            step: previousStep,
                            next_step: newStep,
                            time_on_step: stepTime,
                            step_data: this.getStepData(previousStep),
                            timestamp: Date.now()
                        });

                        this.checkoutSteps.push({
                            step: previousStep,
                            time_spent: stepTime,
                            completed: true,
                            data: this.getStepData(previousStep)
                        });
                    }

                    this.core.track('checkout_step_started', {
                        checkout_id: this.checkoutSessionData.checkout_id,
                        step: newStep,
                        previous_step: previousStep,
                        total_time_in_checkout: Date.now() - this.checkoutSessionData.start_time,
                        timestamp: Date.now()
                    });

                    this.currentStep = newStep;
                    this.checkoutStartTime = Date.now();
                    this.sessionManager.saveCheckoutSession(this.checkoutSessionData);
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['class', 'data-step', 'data-checkout-step']
            });
        },

        handleCheckoutData: function (data, url) {
            console.log('💳 Dados de checkout:', data);

            this.core.track('checkout_data', {
                checkout_data: data,
                api_endpoint: url,
                timestamp: Date.now()
            });
        },

        handlePurchaseCompletion: function () {
            console.log('🎉 Purchase completed - coletando dados finais');

            const orderData = this.dataExtractors.extractOrderData();
            const checkoutSession = this.sessionManager.getCheckoutSession();

            this.core.track('purchase_completed_detailed', {
                ...orderData,
                checkout_session: checkoutSession,
                customer_journey: this.getCustomerJourney(),
                influencer_attribution: this.getInfluencerAttribution(),
                total_checkout_time: checkoutSession ? Date.now() - checkoutSession.start_time : null,
                device_info: this.getDeviceInfo(),
                timestamp: Date.now()
            });

            this.sessionManager.clearCheckoutSession();
        },

        checkForAbandonedCheckout: function () {
            try {
                const abandonmentData = JSON.parse(localStorage.getItem('checkout_abandonment') || 'null');

                if (abandonmentData) {
                    const timeSinceAbandonment = Date.now() - abandonmentData.abandonment_time;

                    if (timeSinceAbandonment < 24 * 60 * 60 * 1000) {
                        this.core.track('checkout_recovery_opportunity', {
                            original_checkout_id: abandonmentData.checkout_id,
                            time_since_abandonment: timeSinceAbandonment,
                            abandoned_step: abandonmentData.step,
                            abandoned_cart_value: abandonmentData.cart_value,
                            recovery_page: window.location.href,
                            timestamp: Date.now()
                        });

                        if (this.isCheckoutPage()) {
                            this.core.track('checkout_recovery_attempt', {
                                original_checkout_id: abandonmentData.checkout_id,
                                time_since_abandonment: timeSinceAbandonment,
                                timestamp: Date.now()
                            });

                            localStorage.removeItem('checkout_abandonment');
                        }
                    } else {
                        localStorage.removeItem('checkout_abandonment');
                    }
                }
            } catch (e) {
                console.log('Erro ao verificar checkout abandonado:', e);
            }
        },

        // Métodos auxiliares
        getStepData: function (step) {
            const data = {};

            try {
                switch (step) {
                    case 'contact':
                        data.email = this.getFieldValue('email');
                        data.phone = this.getFieldValue('phone');
                        data.newsletter_signup = this.getCheckboxValue('newsletter');
                        break;
                    case 'shipping':
                        data.shipping_method = this.getSelectedShippingMethod();
                        data.address_country = this.getFieldValue('country');
                        data.address_state = this.getFieldValue('province');
                        data.address_city = this.getFieldValue('city');
                        data.shipping_price = this.getShippingPrice();
                        break;
                    case 'payment':
                        data.payment_method = this.getSelectedPaymentMethod();
                        data.billing_same_as_shipping = this.getCheckboxValue('billing_same_as_shipping');
                        break;
                }
            } catch (e) {
                console.log('Erro ao extrair dados do step:', e);
            }

            return data;
        },

        getFieldValue: function (fieldName) {
            const selectors = [
                `input[name="${fieldName}"]`,
                `select[name="${fieldName}"]`,
                `textarea[name="${fieldName}"]`,
                `#${fieldName}`,
                `input[name*="${fieldName}"]`,
                `select[name*="${fieldName}"]`
            ];

            for (const selector of selectors) {
                const element = document.querySelector(selector);
                if (element) {
                    return element.value || null;
                }
            }

            return null;
        },

        getCheckboxValue: function (fieldName) {
            const element = document.querySelector(`input[name="${fieldName}"], input[name*="${fieldName}"], #${fieldName}`);
            return element ? element.checked : null;
        },

        getSelectedShippingMethod: function () {
            const selected = document.querySelector('input[name*="shipping"]:checked, select[name*="shipping"] option:checked');
            return selected ? selected.value || selected.textContent : null;
        },

        getSelectedPaymentMethod: function () {
            const selected = document.querySelector('input[name*="payment"]:checked, select[name*="payment"] option:checked');
            return selected ? selected.value || selected.textContent : null;
        },

        getShippingPrice: function () {
            const priceElement = document.querySelector('.shipping-price, [data-shipping-price], .delivery-price');
            if (priceElement) {
                const priceText = priceElement.textContent;
                const price = parseFloat(priceText.replace(/[^0-9.,]/g, '').replace(',', '.'));
                return isNaN(price) ? null : price;
            }
            return null;
        },

        getElementLocation: function (element) {
            const rect = element.getBoundingClientRect();
            return {
                x: rect.left,
                y: rect.top,
                width: rect.width,
                height: rect.height,
                viewport_position: {
                    x_percent: Math.round((rect.left / window.innerWidth) * 100),
                    y_percent: Math.round((rect.top / window.innerHeight) * 100)
                }
            };
        },

        getCartValue: function () {
            return this.core.stateManager.lastCartState?.total || 0;
        },

        getCartItemCount: function () {
            return this.core.stateManager.lastCartState?.items || 0;
        },

        getCartDetails: function () {
            try {
                const xhr = new XMLHttpRequest();
                xhr.open('GET', '/cart.js', false);
                xhr.send();

                if (xhr.status === 200) {
                    const cartData = JSON.parse(xhr.responseText);
                    return {
                        items: cartData.items.map(item => ({
                            product_id: item.product_id,
                            variant_id: item.variant_id,
                            quantity: item.quantity,
                            price: item.price / 100,
                            title: item.title
                        })),
                        total_discount: cartData.total_discount / 100,
                        currency: cartData.currency
                    };
                }
            } catch (e) {
                console.log('Erro ao obter detalhes do carrinho:', e);
            }

            return null;
        },

        getCheckoutEntryMethod: function () {
            const referrer = document.referrer;

            if (referrer.includes('/cart')) return 'cart_page';
            if (referrer.includes('/products/')) return 'product_page';
            if (referrer.includes('/collections/')) return 'collection_page';
            if (referrer.includes('checkout')) return 'direct_checkout';
            if (!referrer) return 'direct_url';

            return 'unknown';
        },

        getDeviceInfo: function () {
            return {
                user_agent: navigator.userAgent,
                screen_resolution: `${screen.width}x${screen.height}`,
                viewport_size: `${window.innerWidth}x${window.innerHeight}`,
                device_pixel_ratio: window.devicePixelRatio,
                connection: navigator.connection ? {
                    effective_type: navigator.connection.effectiveType,
                    downlink: navigator.connection.downlink
                } : null,
                touch_support: 'ontouchstart' in window
            };
        },

        getInfluencerAttribution: function () {
            try {
                return JSON.parse(sessionStorage.getItem('inf_attribution') || 'null');
            } catch (e) {
                return null;
            }
        },

        getCustomerJourney: function () {
            return {
                session_start: this.core.startTime,
                pages_visited: this.core.stateManager.getPagesVisited(),
                products_viewed: this.core.productTracker.getProductsViewed(),
                time_on_site: Date.now() - this.core.startTime,
                scroll_milestones: this.core.scrollTracker.getScrollMilestones(),
                interactions: this.core.interactionTracker.getInteractionHistory()
            };
        }
    };

    console.log('💳 CheckoutTracker module loaded');

})(window);


/* === src/adapters/shopify/ecommerce/api-interceptor.js === */
/*!
 * API Interceptor Module
 */

(function (window) {
    'use strict';

    window.ShopifyAdapterModules = window.ShopifyAdapterModules || {};

    window.ShopifyAdapterModules.APIInterceptor = {
        init: function (core) {
            this.core = core;
            this.cartTracker = window.ShopifyAdapterModules.CartTracker;
            this.productTracker = window.ShopifyAdapterModules.ProductTracker;
            this.checkoutTracker = window.ShopifyAdapterModules.CheckoutTracker;
            this.interceptAPIs();
        },

        interceptAPIs: function () {
            console.log('🔌 Configurando interceptação de APIs');
            this.interceptFetch();
            this.interceptXHR();
        },

        interceptFetch: function () {
            const self = this;
            const originalFetch = window.fetch;

            window.fetch = async function (...args) {
                const response = await originalFetch.apply(this, args);

                if (response.ok) {
                    const url = typeof args[0] === 'string' ? args[0] : args[0].url;

                    try {
                        if (url.includes('/cart')) {
                            const clonedResponse = response.clone();

                            if (url.includes('/cart/add')) {
                                const data = await clonedResponse.json();
                                self.cartTracker.handleCartAdd(data, url);
                            } else if (url.includes('/cart/update') || url.includes('/cart/change')) {
                                const data = await clonedResponse.json();
                                self.cartTracker.handleCartUpdate(data, url);
                            } else if (url.includes('/cart/clear')) {
                                self.cartTracker.handleCartClear(url);
                            } else if (url.includes('/cart.js') || url.endsWith('/cart')) {
                                const data = await clonedResponse.json();
                                self.cartTracker.handleCartData(data, url);
                            }
                        }

                        if (url.includes('/products/') && url.includes('.js')) {
                            const data = await clonedResponse.json();
                            self.productTracker.handleProductData(data, url);
                        }

                        if (url.includes('/checkout') || url.includes('/orders')) {
                            const contentType = response.headers.get('content-type');
                            if (contentType && contentType.includes('application/json')) {
                                const data = await clonedResponse.json();
                                self.checkoutTracker.handleCheckoutData(data, url);
                            }
                        }

                    } catch (e) {
                        console.log('🔄 Erro ao processar resposta:', e);
                    }
                }

                return response;
            };
        },

        interceptXHR: function () {
            const self = this;
            const originalOpen = XMLHttpRequest.prototype.open;

            XMLHttpRequest.prototype.open = function (method, url, ...rest) {
                if (url.includes('/cart')) {
                    this.addEventListener('load', function () {
                        if (this.status >= 200 && this.status < 300) {
                            try {
                                const data = JSON.parse(this.responseText);

                                if (url.includes('/cart/add')) {
                                    self.cartTracker.handleCartAdd(data, url);
                                } else if (url.includes('/cart/update') || url.includes('/cart/change')) {
                                    self.cartTracker.handleCartUpdate(data, url);
                                } else if (url.includes('/cart.js')) {
                                    self.cartTracker.handleCartData(data, url);
                                }
                            } catch (e) {
                                // Não é JSON válido
                            }
                        }
                    });
                }

                return originalOpen.apply(this, [method, url, ...rest]);
            };

            console.log('✅ Interceptação de APIs configurada');
        }
    };

    console.log('🔌 API Interceptor module loaded');

})(window);


/* === src/adapters/shopify/behavioral/interaction-tracker.js === */
/*!
 * Interaction Tracking Module
 */
(function (window) {
    'use strict';

    window.ShopifyAdapterModules = window.ShopifyAdapterModules || {};

    window.ShopifyAdapterModules.InteractionTracker = {
        init: function (core) {
            this.core = core;
            this.setupInteractionTracking();
        },

        setupInteractionTracking: function () {
            console.log('👆 Configurando tracking de interações');
            this.trackClickBehavior();
            this.trackFormInteractions();
            this.trackPageVisibility();
        },

        trackClickBehavior: function () {
            document.addEventListener('click', window.InfluencerTracker.Utils.throttle((e) => {
                const element = e.target;

                let clickType = 'generic';

                if (element.matches('a[href*="/products/"]')) {
                    clickType = 'product_link';
                } else if (element.matches('button[name="add"], input[name="add"]')) {
                    clickType = 'add_to_cart_button';
                } else if (element.matches('a[href*="/cart"], button[data-cart]')) {
                    clickType = 'cart_link';
                } else if (element.matches('a[href*="/checkout"]')) {
                    clickType = 'checkout_link';
                }

                const clickData = {
                    click_type: clickType,
                    element_tag: element.tagName,
                    element_class: element.className,
                    element_id: element.id,
                    element_text: element.textContent?.substring(0, 100),
                    href: element.href,
                    position_x: e.clientX,
                    position_y: e.clientY,
                    timestamp: Date.now()
                };

                this.core.track('click_event', clickData);
                this.saveInteraction({
                    type: 'click',
                    ...clickData
                });
            }, 500));
        },

        trackFormInteractions: function () {
            document.addEventListener('submit', (e) => {
                const form = e.target;

                let formType = 'generic';
                if (form.action && form.action.includes('/cart/add')) {
                    formType = 'add_to_cart';
                } else if (form.action && form.action.includes('/contact')) {
                    formType = 'contact';
                } else if (form.querySelector('input[type="email"]')) {
                    formType = 'newsletter';
                }

                this.core.track('form_submit', {
                    form_type: formType,
                    form_action: form.action,
                    form_method: form.method,
                    fields_count: form.elements.length,
                    timestamp: Date.now()
                });
            });
        },

        trackPageVisibility: function () {
            document.addEventListener('visibilitychange', () => {
                this.core.track('page_visibility_change', {
                    is_visible: !document.hidden,
                    time_on_page: Date.now() - this.core.startTime,
                    timestamp: Date.now()
                });
            });
        },

        saveInteraction: function (interactionData) {
            try {
                const interactions = this.getInteractionHistory();
                interactions.push({
                    timestamp: Date.now(),
                    page: window.location.href,
                    ...interactionData
                });

                sessionStorage.setItem('interaction_history', JSON.stringify(interactions.slice(-200)));
            } catch (e) {
                console.log('Erro ao salvar interação:', e);
            }
        },

        getInteractionHistory: function () {
            try {
                return JSON.parse(sessionStorage.getItem('interaction_history') || '[]');
            } catch (e) {
                return [];
            }
        }
    };

    console.log('🔒 InteractionTracker module loaded');

})(window);


/* === src/adapters/shopify/checkout/form-monitor.js === */
/*!
 * Form Monitor Module for Checkout
 */

(function (window) {
    'use strict';

    window.ShopifyAdapterModules = window.ShopifyAdapterModules || {};

    window.ShopifyAdapterModules.FormMonitor = {
        formInteractions: {},

        init: function (core) {
            this.core = core;
            this.checkoutTracker = window.ShopifyAdapterModules.CheckoutTracker;
            
            // Aguardar a inicialização do checkoutTracker
            if (this.checkoutTracker && this.checkoutTracker.isInitialized) {
                this.setupFormMonitoring();
            } else {
                // Aguardar a inicialização
                const checkInit = () => {
                    if (this.checkoutTracker && this.checkoutTracker.isInitialized) {
                        this.setupFormMonitoring();
                    } else {
                        setTimeout(checkInit, 100);
                    }
                };
                checkInit();
            }
        },

        setupFormMonitoring: function () {
            console.log('📝 Configurando monitoramento de formulários');

            const formElements = document.querySelectorAll('input, select, textarea');
            formElements.forEach(element => {
                this.setupFieldMonitoring(element);
            });

            const observer = new MutationObserver((mutations) => {
                mutations.forEach(mutation => {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            const newFields = node.querySelectorAll('input, select, textarea');
                            newFields.forEach(field => this.setupFieldMonitoring(field));
                        }
                    });
                });
            });

            observer.observe(document.body, { childList: true, subtree: true });
        },

        getCurrentStep: function() {
            return this.checkoutTracker?.currentStep || 'unknown';
        },

        getCheckoutId: function() {
            return this.checkoutTracker?.checkoutSessionData?.checkout_id || 'unknown';
        },

        setupFieldMonitoring: function (element) {
            if (element.dataset.trackerMonitored) return;
            element.dataset.trackerMonitored = 'true';

            const fieldName = element.name || element.id || element.placeholder || 'unknown';
            const fieldType = element.type || element.tagName.toLowerCase();

            let interactionData = {
                field_name: fieldName,
                field_type: fieldType,
                focus_count: 0,
                input_count: 0,
                total_focus_time: 0,
                value_changes: 0,
                focus_start: null,
                initial_value: element.value,
                error_count: 0
            };

            // Focus events
            element.addEventListener('focus', () => {
                interactionData.focus_count++;
                interactionData.focus_start = Date.now();

                this.core.track('checkout_field_focus', {
                    checkout_id: this.getCheckoutId(),
                    step: this.getCurrentStep(),
                    field_name: fieldName,
                    field_type: fieldType,
                    focus_count: interactionData.focus_count,
                    timestamp: Date.now()
                });
            });

            // Blur events
            element.addEventListener('blur', () => {
                if (interactionData.focus_start) {
                    const focusTime = Date.now() - interactionData.focus_start;
                    interactionData.total_focus_time += focusTime;
                    interactionData.focus_start = null;

                    this.core.track('checkout_field_blur', {
                        checkout_id: this.getCheckoutId(),
                        step: this.getCurrentStep(),
                        field_name: fieldName,
                        field_type: fieldType,
                        focus_time: focusTime,
                        total_focus_time: interactionData.total_focus_time,
                        has_value: !!element.value,
                        timestamp: Date.now()
                    });
                }
            });

            // Input events
            element.addEventListener('input', () => {
                interactionData.input_count++;

                if (element.value !== interactionData.initial_value) {
                    interactionData.value_changes++;
                }

                this.throttledTrackInput(element, interactionData);
            });

            // Change events
            element.addEventListener('change', () => {
                this.core.track('checkout_field_change', {
                    checkout_id: this.getCheckoutId(),
                    step: this.getCurrentStep(),
                    field_name: fieldName,
                    field_type: fieldType,
                    new_value: fieldType === 'select-one' ? element.value : '[hidden]',
                    timestamp: Date.now()
                });
            });

            // Error detection
            const checkForErrors = () => {
                const hasError = element.classList.contains('error') ||
                    element.classList.contains('invalid') ||
                    element.getAttribute('aria-invalid') === 'true' ||
                    element.closest('.error, .invalid, [data-error]');

                if (hasError) {
                    interactionData.error_count++;

                    this.core.track('checkout_field_error', {
                        checkout_id: this.getCheckoutId(),
                        step: this.getCurrentStep(),
                        field_name: fieldName,
                        field_type: fieldType,
                        error_count: interactionData.error_count,
                        timestamp: Date.now()
                    });
                }
            };

            setInterval(checkForErrors, 2000);

            // Salvar dados de interação
            const currentStep = this.getCurrentStep();
            if (!this.formInteractions[currentStep]) {
                this.formInteractions[currentStep] = {};
            }
            this.formInteractions[currentStep][fieldName] = interactionData;
        },

        // Método corrigido com bind apropriado
        throttledTrackInput: function (element, interactionData) {
            const fieldName = interactionData.field_name;
            
            // Usar uma propriedade da instância para armazenar os timeouts
            if (!this.throttleMap) {
                this.throttleMap = new Map();
            }

            if (this.throttleMap.has(fieldName)) {
                clearTimeout(this.throttleMap.get(fieldName));
            }

            // Armazenar referência do contexto
            const self = this;

            this.throttleMap.set(fieldName, setTimeout(function() {
                // Verificar se core ainda existe antes de usar
                if (self.core && typeof self.core.track === 'function') {
                    self.core.track('checkout_field_input', {
                        checkout_id: self.getCheckoutId(),
                        step: self.getCurrentStep(),
                        field_name: fieldName,
                        field_type: interactionData.field_type,
                        input_count: interactionData.input_count,
                        value_changes: interactionData.value_changes,
                        has_value: !!element.value,
                        value_length: element.value?.length || 0,
                        timestamp: Date.now()
                    });
                } else {
                    console.warn('FormMonitor: core.track não está disponível');
                }

                self.throttleMap.delete(fieldName);
            }, 1000));
        }
    };
    
    console.log('�� FormMonitor module loaded');
})(window);


/* === src/adapters/shopify/checkout/abandonment-tracker.js === */
/*!
 * Abandonment Tracking Module
 */

(function (window) {
    'use strict';

    window.ShopifyAdapterModules = window.ShopifyAdapterModules || {};

    window.ShopifyAdapterModules.AbandonmentTracker = {
        init: function (core) {
            this.core = core;
            this.checkoutTracker = window.ShopifyAdapterModules.CheckoutTracker;
            this.sessionManager = window.ShopifyAdapterModules.SessionManager;
            this.setupAbandonmentTracking();
        },

        setupAbandonmentTracking: function () {
            console.log('🚪 Configurando tracking de abandono');
            this.monitorPageUnload();
            this.monitorExitIntent();
            this.monitorInactivity();
        },

        monitorPageUnload: function () {
            window.addEventListener('beforeunload', (e) => {
                if (!this.checkoutTracker.abandonmentTracked && this.checkoutTracker.isCheckoutPage()) {
                    this.trackCheckoutAbandonment('page_unload');
                }
            });
        },

        monitorExitIntent: function () {
            document.addEventListener('mouseleave', (e) => {
                if (e.clientY <= 0 &&
                    !this.checkoutTracker.abandonmentTracked &&
                    this.checkoutTracker.isCheckoutPage()) {

                    this.core.track('checkout_exit_intent', {
                        checkout_id: this.checkoutTracker.checkoutSessionData.checkout_id,
                        step: this.checkoutTracker.currentStep,
                        time_in_checkout: Date.now() - this.checkoutTracker.checkoutSessionData.start_time,
                        time_on_current_step: Date.now() - this.checkoutTracker.checkoutStartTime,
                        form_completion: this.calculateFormCompletion(),
                        timestamp: Date.now()
                    });
                }
            });
        },

        monitorInactivity: function () {
            let inactivityTimer;

            const resetInactivityTimer = () => {
                clearTimeout(inactivityTimer);
                inactivityTimer = setTimeout(() => {
                    if (this.checkoutTracker.isCheckoutPage() && !this.checkoutTracker.abandonmentTracked) {
                        this.core.track('checkout_inactivity', {
                            checkout_id: this.checkoutTracker.checkoutSessionData.checkout_id,
                            step: this.checkoutTracker.currentStep,
                            inactivity_duration: 300000,
                            timestamp: Date.now()
                        });
                    }
                }, 300000); // 5 minutos
            };

            ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
                document.addEventListener(event, resetInactivityTimer, { passive: true });
            });

            resetInactivityTimer();
        },

        trackCheckoutAbandonment: function (reason) {
            if (this.checkoutTracker.abandonmentTracked) return;
            this.checkoutTracker.abandonmentTracked = true;

            console.log('🚪 Checkout abandonado:', reason);

            this.core.track('checkout_abandonment', {
                checkout_id: this.checkoutTracker.checkoutSessionData.checkout_id,
                abandonment_reason: reason,
                abandonment_step: this.checkoutTracker.currentStep,
                time_in_checkout: Date.now() - this.checkoutTracker.checkoutSessionData.start_time,
                time_on_current_step: Date.now() - this.checkoutTracker.checkoutStartTime,
                steps_completed: this.checkoutTracker.checkoutSteps,
                form_completion: this.calculateFormCompletion(),
                cart_value: this.checkoutTracker.getCartValue(),
                cart_items: this.checkoutTracker.getCartItemCount(),
                influencer_attribution: this.checkoutTracker.getInfluencerAttribution(),
                customer_journey: this.checkoutTracker.getCustomerJourney(),
                device_info: this.checkoutTracker.getDeviceInfo(),
                timestamp: Date.now()
            });

            this.saveAbandonmentData();
        },

        calculateFormCompletion: function () {
            const allFields = document.querySelectorAll('input:not([type="hidden"]), select, textarea');
            const filledFields = Array.from(allFields).filter(field => field.value && field.value.trim() !== '');

            return allFields.length > 0 ? Math.round((filledFields.length / allFields.length) * 100) : 0;
        },

        saveAbandonmentData: function () {
            const abandonmentData = {
                checkout_id: this.checkoutTracker.checkoutSessionData.checkout_id,
                abandonment_time: Date.now(),
                step: this.checkoutTracker.currentStep,
                cart_value: this.checkoutTracker.getCartValue(),
                form_completion: this.calculateFormCompletion(),
                influencer_attribution: this.checkoutTracker.getInfluencerAttribution()
            };

            try {
                localStorage.setItem('checkout_abandonment', JSON.stringify(abandonmentData));
            } catch (e) {
                console.log('Erro ao salvar dados de abandono:', e);
            }
        }
    };

    console.log('🚪 AbandonmentTracker module loaded');

})(window);


/* === src/adapters/shopify/shopify-adapter.js === */
/*!
 * Shopify Adapter - Main Entry Point
 */

(function(window, document) {
    'use strict';

    const ShopifyAdapter = {
        initialized: false,
        
        init: function() {
            if (this.initialized) {
                console.log('⚠️ Shopify Adapter já foi inicializado');
                return this;
            }

            console.log('�� Inicializando Shopify Adapter');

            if (!window.ShopifyAdapterModules) {
                console.error('❌ ShopifyAdapterModules namespace não encontrado');
                return this;
            }

            const modules = window.ShopifyAdapterModules;

            if (!modules.AdapterCore) {
                console.error('❌ AdapterCore não encontrado');
                return this;
            }

            try {
                // Add module references to AdapterCore
                Object.entries(modules).forEach(([name, module]) => {
                    if (name !== 'AdapterCore') {
                        modules.AdapterCore[name.toLowerCase()] = module;
                    }
                });

                // Initialize
                modules.AdapterCore.init({
                    stateManager: modules.StateManager,
                    cartTracker: modules.CartTracker,
                    productTracker: modules.ProductTracker,
                    apiInterceptor: modules.APIInterceptor,
                    interactionTracker: modules.InteractionTracker,
                    checkoutTracker: modules.CheckoutTracker,
                    formMonitor: modules.FormMonitor,
                    abandonmentTracker: modules.AbandonmentTracker,
                    dataExtractors: modules.DataExtractors,
                    helpers: modules.Helpers,
                    sessionManager: modules.SessionManager
                });

                this.initialized = true;
                console.log('✅ Shopify Adapter inicializado');
                
            } catch (error) {
                console.error('❌ Erro ao inicializar:', error);
            }

            return this;
        },

        // Direct access to core
        getCore: function() {
            return window.ShopifyAdapterModules?.AdapterCore || null;
        }
    };

    // Expose globally
    window.shopifyAdapter = ShopifyAdapter;
    
    // Auto-initialize
    function autoInit() {
        if (!window.ShopifyAdapterModules) {
            setTimeout(autoInit, 100);
            return;
        }
        ShopifyAdapter.init();
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', autoInit);
    } else {
        autoInit();
    }
    
    console.log('🔄 Shopify Adapter carregado');

})(window, document);