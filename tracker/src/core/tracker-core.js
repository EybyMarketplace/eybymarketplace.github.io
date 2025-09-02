import { CONFIG, updateConfig } from './config.js';
import { ConsentManager } from './consent-manager.js';
import { IdGenerator } from './id-generator.js';
import { InfluencerDetector } from './influencer-detector.js';
import { DeviceFingerprint } from './device-fingerprint.js';
import { EventQueue } from './event-queue.js';
import Utils from '../utils/helpers.js'; 
import { getAdapter } from './adapter-registry.js';

export class InfluencerTrackerCore {
    constructor() {
        this.initialized = false;
        this.startTime = Date.now();
        this.platform = 'generic';
        this.adapter = null;
        this.eventQueue = new EventQueue();
        
        // Bind methods to maintain context
        this.track = this.track.bind(this);
    }
    
    init(options = {}) {
        if (this.initialized) return;
        
        // Configura opções
        updateConfig(options);
        
        if (!CONFIG.apiEndpoint) {
            console.warn('Influencer Tracker: apiEndpoint não configurado');
            return;
        }
        
        // Detecta plataforma
        this.platform = this.detectPlatform();
        console.log(`🎯 Plataforma detectada: ${this.platform}`);
        
        // Carrega adaptador
        this.adapter = this.loadAdapter(this.platform);
        
        // Verifica consent antes de iniciar
        if (CONFIG.enableConsentCheck && !ConsentManager.checkConsent()) {
            ConsentManager.waitForConsent(() => this.startTracking());
            return;
        }
        
        this.startTracking();
    }
    
    detectPlatform() {
        // Shopify
        if (window.Shopify || window.shopifyData ||
            document.querySelector('meta[name="shopify-checkout-api-token"]')) {
            return 'shopify';
        }
        
        // Vtex
        if (window.vtex || window.vtexjs || 
            document.querySelector('meta[name="vtex-version"]')) {
            return 'vtex';
        }
        
        // Nuvemshop
        if (window.LS || document.querySelector('meta[name="nuvemshop"]')) {
            return 'nuvemshop';
        }
        
        return 'generic';
    }
    
    loadAdapter(platform) {
        return getAdapter(platform);
    }
    
    startTracking() {
        this.initialized = true;
        
        // Detecta influenciador
        const influencerData = InfluencerDetector.detectInfluencer();
        
        // Evento de page view
        this.track('page_view', {
            page_url: window.location.href,
            page_title: document.title,
            referrer: document.referrer,
            influencer_data: influencerData
        });
        
        // Configura listeners universais
        this.setupUniversalTracking();
        
        // Inicialização específica da plataforma
        if (this.adapter?.init) {
            this.adapter.init();
        }
        
        // Flush automático
        this.eventQueue.scheduleFlush();
        
        // Flush quando sair da página
        window.addEventListener('beforeunload', () => this.eventQueue.flush());
        
        console.log('Influencer Tracker: Inicializado com sucesso');
    }
    
    track(eventType, properties = {}) {
        if (!this.initialized) return;
        
        const event = {
            event_id: IdGenerator.generateUUID(),
            event_type: eventType,
            timestamp: Date.now(),
            user_id: IdGenerator.getUserId(),
            session_id: IdGenerator.getSessionId(),
            page_url: window.location.href,
            device_fingerprint: DeviceFingerprint.generate(),
            platform: this.platform,
            properties: properties
        };
        
        // Enriquecer com dados específicos da plataforma
        if (this.adapter?.enrichEvent) {
            Object.assign(event.properties, this.adapter.enrichEvent(eventType, properties));
        }
        
        this.eventQueue.add(event);
    }
    
    setupUniversalTracking() {
        // Tracking de scroll
        let maxScroll = 0;
        window.addEventListener('scroll', Utils.throttle(() => {
            const scrollPercent = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
            if (scrollPercent > maxScroll) {
                maxScroll = scrollPercent;
                
                // Marcos de scroll
                if ([25, 50, 75, 90].includes(scrollPercent)) {
                    this.track('scroll_milestone', { scroll_percent: scrollPercent });
                }
            }
        }, 1000));
        
        // Tracking de tempo na página
        let timeOnPage = 0;
        setInterval(() => {
            timeOnPage += 10;
            
            // Marcos de tempo
            if ([30, 60, 120, 300].includes(timeOnPage)) {
                this.track('time_milestone', { seconds_on_page: timeOnPage });
            }
        }, 10000);
        
        // Tracking de saída
        this.setupExitTracking();
    }
    
    setupExitTracking() {
        let exitTracked = false;
        
        document.addEventListener('mouseleave', (e) => {
            if (e.clientY <= 0 && !exitTracked) {
                exitTracked = true;
                this.track('exit_intent', {
                    time_on_page: Date.now() - this.startTime,
                    scroll_percent: Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100)
                });
            }
        });
    }
    
    // Métodos públicos para tracking manual
    // trackPurchase(orderData) {
    //     this.track('purchase', {
    //         order_id: orderData.orderId,
    //         total_value: orderData.totalValue,
    //         currency: orderData.currency || 'BRL',
    //         items: orderData.items,
    //         coupon_code: orderData.couponCode,
    //         influencer_attribution: JSON.parse(sessionStorage.getItem('inf_attribution') || 'null')
    //     });
    // }
    
    // trackCustomEvent(eventName, properties) {
    //     this.track(eventName, properties);
    // }

    
    // Getters for backward compatibility
    get ConsentManager() { return ConsentManager; }
    get IdGenerator() { return IdGenerator; }
    get InfluencerDetector() { return InfluencerDetector; }
    get DeviceFingerprint() { return DeviceFingerprint; }
    get EventQueue() { return this.eventQueue; }
}

// Global exposure wrapper for Rollup bundle output
(function(global) {
    // Create singleton instance
    const trackerInstance = new InfluencerTrackerCore();
    
    if (!global.InfluencerTracker) {
        global.InfluencerTracker = trackerInstance;
        
        // Expose internal modules for backward compatibility
        global.InfluencerTracker.ConsentManager = ConsentManager;
        global.InfluencerTracker.IdGenerator = IdGenerator;
        global.InfluencerTracker.InfluencerDetector = InfluencerDetector;
        global.InfluencerTracker.DeviceFingerprint = DeviceFingerprint;
        global.InfluencerTracker.EventQueue = trackerInstance.eventQueue;
        
        console.log('🎯 Influencer Tracker Core loaded');
    } else {
        console.log('InfluencerTracker already exists, skipping core initialization');
    }
})(typeof window !== 'undefined' ? window : this);

// Export for ES6 module usage
export default InfluencerTrackerCore;
export { ConsentManager, IdGenerator, InfluencerDetector, DeviceFingerprint, EventQueue };