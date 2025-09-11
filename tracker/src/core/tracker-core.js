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