/*!
 * Influencer Tracker - Core Module
 */
(function(window) {
    'use strict';
    
    // Aliases para facilitar uso
    const Config = window.CommerceTracker.Config;
    const ConsentManager = window.CommerceTracker.ConsentManager;
    const IdGenerator = window.CommerceTracker.IdGenerator;
    const InfluencerDetector = window.CommerceTracker.InfluencerDetector;
    const DeviceFingerprint = window.CommerceTracker.DeviceFingerprint;
    const EventQueue = window.CommerceTracker.EventQueue;
    const Utils = window.CommerceTracker.Utils;
    
    // Tracker Principal
    window.CommerceTracker.Core = {
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