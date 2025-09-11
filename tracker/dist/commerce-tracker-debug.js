/*!
 * Commerce Tracker v2.1.0
 * Shopify Adapter - Complete Build
 * Built: 2025-09-11
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
    
    window.CommerceTracker = window.CommerceTracker || {};
    
    window.CommerceTracker.Utils = {
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
        },

        // Função para limpar a URL do web pixel
        getCleanPageUrl: function() {
            let url = window.location.href;

            try {
                // Remove prefixos do web pixel
                const webPixelPattern = /\/web-pixels@[^\/]+\/[^\/]+\/web-pixel-[^\/]+@[^\/]+\/sandbox\/modern/;
                url = url.replace(webPixelPattern, '');

                // Se a URL ainda contém o domínio do Shopify, reconstrói a URL limpa
                const urlObj = new URL(url);

                // Remove parâmetros de tracking comuns
                const trackingParams = [
                    'pr_prod_strat',
                    'pr_rec_id',
                    'pr_rec_pid',
                    'pr_ref_pid',
                    'pr_seq',
                    'utm_source',
                    'utm_medium',
                    'utm_campaign',
                    'utm_term',
                    'utm_content',
                    'fbclid',
                    'gclid',
                    'msclkid',
                    '_ga',
                    '_gl'
                ];

                trackingParams.forEach(param => {
                    urlObj.searchParams.delete(param);
                });

                // Reconstrói a URL limpa
                let cleanUrl = `${urlObj.origin}${urlObj.pathname}`;

                // Adiciona parâmetros de query restantes se existirem
                const remainingParams = urlObj.searchParams.toString();
                if (remainingParams) {
                    cleanUrl += `?${remainingParams}`;
                }

                return cleanUrl;

            } catch (error) {
                console.warn('Erro ao limpar URL:', error);
                // Fallback: retorna pelo menos o pathname
                return `${window.location.origin}${window.location.pathname}`;
            }
        }
    };
    
    console.log('🔧 Utils module loaded');
    
})(window);


/* === src/core/modules/config.js === */
/*!
 * Influencer Tracker - Configuration Module
 */
(function(window) {
    'use strict';
    
    // Criar namespace se não existir
    window.CommerceTracker = window.CommerceTracker || {};
    
    // Módulo de Configuração
    window.CommerceTracker.Config = {
        // Configurações padrão
        defaults: {
            apiEndpoint: '',
            projectId: '',
            enableConsentCheck: true,
            platform: '',
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
    window.CommerceTracker.Config.init();
    
    console.log('📋 Config module loaded');
    
})(window);


/* === src/core/modules/consent-manager.js === */
/*!
 * Influencer Tracker - Consent Manager Module (LGPD)
 */
(function(window) {
    'use strict';
    
    window.CommerceTracker = window.CommerceTracker || {};
    
    window.CommerceTracker.ConsentManager = {
        // Chaves de armazenamento
        CONSENT_KEY: 'analytics_consent',
        CONSENT_DATE_KEY: 'analytics_consent_date',
        
        // Callbacks aguardando consent
        pendingCallbacks: [],
        
        // Verificar se há consentimento
        checkConsent: function() {
            const config = window.CommerceTracker.Config;
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


/* === src/core/modules/id-generator.js === */
/*!
 * Influencer Tracker - ID Generator Module
 */
(function(window) {
    'use strict';
    
    window.CommerceTracker = window.CommerceTracker || {};
    
    window.CommerceTracker.IdGenerator = {
        // Chaves de armazenamento
        USER_ID_KEY: 'inf_user_id',
        SESSION_KEY: 'inf_session',

        getProjectId: function() {
            const hostname = window.location.hostname;
            return hostname.replace('.myshopify.com', '').replace(/\./g, '-');
        },
        
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
            const config = window.CommerceTracker.Config;
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


/* === src/core/modules/traffic-data-detector.js === */
/*!
 * Influencer Tracker - Influencer Detector Module
 */
(function(window) {
    'use strict';
    
    window.CommerceTracker = window.CommerceTracker || {};
    
    window.CommerceTracker.TrafficDataDetector = {
        // Chave de armazenamento
        ATTRIBUTION_KEY: 'inf_attribution',
        
        // Mapeamento de redes sociais
        socialMediaSources: {
            'facebook.com': 'Facebook',
            'fb.com': 'Facebook',
            'm.facebook.com': 'Facebook',
            'instagram.com': 'Instagram',
            'twitter.com': 'Twitter',
            'x.com': 'Twitter',
            't.co': 'Twitter',
            'linkedin.com': 'LinkedIn',
            'youtube.com': 'YouTube',
            'youtu.be': 'YouTube',
            'tiktok.com': 'TikTok',
            'pinterest.com': 'Pinterest',
            'pin.it': 'Pinterest',
            'snapchat.com': 'Snapchat',
            'reddit.com': 'Reddit',
            'whatsapp.com': 'WhatsApp',
            'telegram.org': 'Telegram',
            't.me': 'Telegram',
            'discord.com': 'Discord',
            'twitch.tv': 'Twitch'
        },

        // Detecta mecanismos de busca
        searchEngines: {
            'google.': 'Google',
            'bing.com': 'Bing',
            'yahoo.com': 'Yahoo',
            'duckduckgo.com': 'DuckDuckGo',
            'yandex.': 'Yandex',
            'baidu.com': 'Baidu'
        },

        cachedTrafficData: null,
        
        // Extrai informações de UTM parameters
        getUtmParams: () => {
            const urlParams = new URLSearchParams(window.location.search);
            return {
                utm_source: urlParams.get('utm_source'),
                utm_medium: urlParams.get('utm_medium'),
                utm_campaign: urlParams.get('utm_campaign'),
                utm_term: urlParams.get('utm_term'),
                utm_content: urlParams.get('utm_content')
            };
        },

        // Extrai informações de afiliado
        getAffiliateInfo: () => {
            const urlParams = new URLSearchParams(window.location.search);
            return {
                affiliate_id: urlParams.get('aff') || urlParams.get('affiliate') || urlParams.get('ref'),
                referral_code: urlParams.get('referral') || urlParams.get('promo'),
                influencer_code: urlParams.get('influencer') || urlParams.get('inf'),
                discount_code: urlParams.get('discount') || urlParams.get('coupon')
            };
        },

        // Detecta fonte de tráfego pelo referrer
        getTrafficSource() {
            const referrer = document.referrer.toLowerCase();

            if (!referrer) {
                return {
                    source_type: 'direct',
                    source_name: 'Direct Traffic',
                    referrer_domain: null
                };
            }

            try {
                const referrerUrl = new URL(document.referrer);
                const domain = referrerUrl.hostname.toLowerCase();

                // Verifica se é rede social
                for (const [key, name] of Object.entries(this.socialMediaSources)) {
                    if (domain.includes(key)) {
                        return {
                            source_type: 'social',
                            source_name: name,
                            referrer_domain: domain,
                            referrer_url: document.referrer
                        };
                    }
                }

                // Verifica se é mecanismo de busca
                for (const [key, name] of Object.entries(this.searchEngines)) {
                    if (domain.includes(key)) {
                        return {
                            source_type: 'search',
                            source_name: name,
                            referrer_domain: domain,
                            referrer_url: document.referrer,
                            search_query: referrerUrl.searchParams.get('q') ||
                                referrerUrl.searchParams.get('query') ||
                                referrerUrl.searchParams.get('search')
                        };
                    }
                }

                // Verifica se é email marketing
                if (domain.includes('mail') || domain.includes('email') ||
                    referrer.includes('newsletter') || referrer.includes('campaign')) {
                    return {
                        source_type: 'email',
                        source_name: 'Email Marketing',
                        referrer_domain: domain,
                        referrer_url: document.referrer
                    };
                }

                // Tráfego de referência genérico
                return {
                    source_type: 'referral',
                    source_name: domain,
                    referrer_domain: domain,
                    referrer_url: document.referrer
                };

            } catch (error) {
                return {
                    source_type: 'unknown',
                    source_name: 'Unknown',
                    referrer_domain: null,
                    error: error.message
                };
            }
        },

        // Função principal que coleta todas as informações
        getTrafficData() {

            if (this.cachedTrafficData) {
                return this.cachedTrafficData;
            }
            
            const utmParams = this.getUtmParams();
            const affiliateInfo = this.getAffiliateInfo();
            const trafficSource = this.getTrafficSource();

            let trafficData = {
                // Informações de UTM
                utm_data: utmParams,

                // Informações de afiliado
                affiliate_data: affiliateInfo,

                // Fonte de tráfego
                traffic_source: trafficSource,

                // Informações adicionais
                full_url: window.location.href,
                user_agent: navigator.userAgent,
                timestamp: Date.now()
            };

            this.cachedTrafficData = trafficData;
            return trafficData;
        }
    };
    
    console.log('🎯 TrafficDataDetector module loaded');
    
})(window);


/* === src/core/modules/device-fingerprint.js === */
/*!
 * Influencer Tracker - Device Fingerprint Module
 */
(function(window) {
    'use strict';
    
    window.CommerceTracker = window.CommerceTracker || {};
    
    window.CommerceTracker.DeviceFingerprint = {
        // Cache do fingerprint
        cachedFingerprint: null,
        
        // Gerar fingerprint do dispositivo
        generate: function() {
            if (this.cachedFingerprint) {
                return this.cachedFingerprint;
            }
            
            const screen = window.screen;
            
            const fingerprint = {
                user_agent: navigator.userAgent,
                language: navigator.language,
                platform: navigator.platform,
                screen_resolution: `${screen.width}x${screen.height}`,
                screen_color_depth: screen.colorDepth,
                timezone_offset: new Date().getTimezoneOffset(),
                has_local_storage: !!window.localStorage,
                has_session_storage: !!window.sessionStorage,
                has_cookies: navigator.cookieEnabled,
                viewport: this.getViewportInfo()
            };
            
            this.cachedFingerprint = fingerprint;
            return fingerprint;
        },
        
        // Obter informações do viewport
        getViewportInfo: function() {
            return {
                width: window.innerWidth || document.documentElement.clientWidth,
                height: window.innerHeight || document.documentElement.clientHeight,
                device_pixel_ratio: window.devicePixelRatio || 1
            };
        },
        
        // Limpar cache
        clearCache: function() {
            this.cachedFingerprint = null;
        }
    };
    
    console.log('🔍 DeviceFingerprint module loaded');
    
})(window);


/* === src/core/modules/event-queue.js === */
/*!
 * Influencer Tracker - Event Queue Module
 */
(function(window) {
    'use strict';
    
    window.CommerceTracker = window.CommerceTracker || {};
    
    window.CommerceTracker.EventQueue = {
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
            
            const config = window.CommerceTracker.Config;
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
            
            const config = window.CommerceTracker.Config;
            const batchTimeout = config.get('batchTimeout');
            
            this.flushTimer = setTimeout(() => {
                this.flush();
            }, batchTimeout);
        },
        
        // Enviar eventos para API
        flush: function() {
            if (this.queue.length === 0) return Promise.resolve();
            
            const config = window.CommerceTracker.Config;
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
            const config = window.CommerceTracker.Config;
            
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

(function() {

/* === src/core/modules/shopify-data-extractors.js === */
/*!
 * Data Extractors Utility Module
 */

(function (window) {
    'use strict';

    window.CommerceTracker = window.CommerceTracker || {};

    window.CommerceTracker.ShopifyDataExtractors = {
   // Helper function to extract product data
        extractProductData(product) {
            if (!product) return null;

            return {
                id: product.id,
                title: product.title,
                handle: product.handle,
                vendor: product.vendor,
                type: product.type,
                price: product.price ? parseFloat(product.price.amount) : null,
                currency: product.price ? product.price.currencyCode : null,
                available: product.available,
                tags: product.tags || [],
                created_at: product.createdAt,
                updated_at: product.updatedAt
            };
        },

        // Helper function to extract variant data
        extractVariantData(variant) {
            if (!variant) return null;

            return {
                id: variant.id,
                title: variant.title,
                price: parseFloat(variant.price.amount),
                currency: variant.price.currencyCode,
                compare_at_price: variant.compareAtPrice ? parseFloat(variant.compareAtPrice.amount) : null,
                available: variant.available,
                inventory_quantity: variant.inventoryQuantity,
                sku: variant.sku,
                barcode: variant.barcode,
                weight: variant.weight,
                weight_unit: variant.weightUnit,
                product: this.extractProductData(variant.product)
            };
        },

        // Helper function to extract cart line items
        extractLineItems(lineItems) {
            if (!lineItems) return [];

            return lineItems.map(item => ({
                id: item.id,
                quantity: item.quantity,
                title: item.title,
                variant: this.extractVariantData(item.variant),
                line_price: parseFloat(item.variant.price.amount) * item.quantity,
                discounts: item.discounts || [],
                properties: item.properties || {}
            }));
        }
    };

    console.log('📦 Shopify Data Extractors module loaded');

})(window);
})();


/* === src/core/tracker-core.js === */
/*!
 * Influencer Tracker - Core Module
 */
(function(window) {
    'use strict';
    
    // Aliases para facilitar uso
    const Config = window.CommerceTracker.Config;
    const ConsentManager = window.CommerceTracker.ConsentManager;
    const IdGenerator = window.CommerceTracker.IdGenerator;
    const TrafficDataDetector = window.CommerceTracker.TrafficDataDetector;
    const DeviceFingerprint = window.CommerceTracker.DeviceFingerprint;
    const EventQueue = window.CommerceTracker.EventQueue;
    // const GeolocationManager = window.CommerceTracker.GeolocationManager;
    const Utils = window.CommerceTracker.Utils;
    
    // Tracker Principal
    window.CommerceTracker.Core = {
        // Estado do tracker
        initialized: false,
        startTime: Date.now(),
        platform: 'generic',
        adapter: null,
        locationContext: null,
        locationPromise: null,
        
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

            console.log('🎯 Consentimento: ', ConsentManager.checkConsent());
            
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
            if (Config.get('platform') === 'shopify') {
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

            // this.locationPromise = GeolocationManager.getApproximateLocation()
            //     .then(location => {
            //         this.locationContext = location;
            //         console.log('📍 Location context available:', location.city);

            //         return location;
            //     })
            //     .catch(error => {
            //         console.warn('Location context unavailable:', error.message);
            //         return null;
            //     });
            
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

            // Base event data
            const baseEventData = {
                page_title: document.title,
                referrer: document.referrer,
                device_type: Utils.getDeviceType(),
            };
            
            let sendTrafficData = false;
            if (!sessionStorage.getItem("passedFirstPageView")) { 
                sessionStorage.setItem("passedFirstPageView", "true");
                sendTrafficData = true;
            }
            
            this.track('page_view:entry_point', {
                ...baseEventData,
                ...(sendTrafficData && {
                    traffic_attribution: TrafficDataDetector.getTrafficData()
                }),
                ...(this.locationContext && {
                    location: this.locationContext
                })
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
                page_url: Utils.getCleanPageUrl(),
                device_fingerprint: DeviceFingerprint.generate(),
                platform: this.platform,
                domain: window.location.hostname,
                properties: Utils.deepMerge({}, properties)
            };

            console.log('📊 Evento rastreado:', eventType, properties);
            
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
        
        // Obter informações do tracker
        getInfo: function() {
            return {
                initialized: this.initialized,
                platform: this.platform,
                version: Config.get('version'),
                userId: IdGenerator.getUserId(),
                sessionId: IdGenerator.getSessionId(),
                queueSize: EventQueue.getQueueSize(),
                hasAttribution: TrafficDataDetector.hasActiveAttribution()
            };
        }
    };
    
    console.log('🎯 TrackerCore module loaded');
    
})(window);