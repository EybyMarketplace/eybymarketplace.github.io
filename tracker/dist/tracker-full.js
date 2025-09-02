/*!
 * Influencer Tracker - FULL Build
 * Version: 2.1.0 with AI Analytics
 * Built: 2025-09-02T22:07:42.033Z
 * Files: src/core/tracker-core.js, src/adapters/shopify/index.js, src/ai/ai-data-collector.js, src/utils/helpers.js
 * 
 * Features:
 * - Event Tracking ✅
 * - Affiliate Attribution ✅
 * - Platform Adapters ✅
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
    name: 'full',
    version: '2.1.0',
    timestamp: '2025-09-02T22:07:42.033Z',
    files: ["src/core/tracker-core.js","src/adapters/shopify/index.js","src/ai/ai-data-collector.js","src/utils/helpers.js"],
    features: {
      tracking: true,
      attribution: true,
      adapters: true,
      ai: true
    }
  };
  
  // Expose build info
  if (typeof window !== 'undefined') {
    window.InfluencerTrackerBuild = BUILD_INFO;
  }


/* === src/core/tracker-core.js === */
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

/* === src/adapters/shopify/index.js === */
import ShopifyTracker from './shopify-tracker'; 
import PageDataExtractor from './page-data-extractor'; 
import EcommerceTracker from './ecommerce-tracker'; 
import BehavioralTracker from './behavioral-tracker'; 
import ShopifySpecificTracker from './shopify-specific-tracker'; 
import CheckoutTracker from './checkout-tracker'; 
import Utils from '../../utils/helpers'; 

// Re-exporting for consistency if needed, but not strictly necessary for this entry point's goal
export { ShopifyTracker, PageDataExtractor, EcommerceTracker, BehavioralTracker, ShopifySpecificTracker, CheckoutTracker, Utils };

// Initialize the Shopify adapter
const shopifyTrackerInstance = new ShopifyTracker();

// Global exposure wrapper for Rollup bundle output
(function(global) {
    if (!global.shopifyTracker) { // Existing global name from your original script
        global.shopifyTracker = shopifyTrackerInstance;

        // Ensure it initializes after the DOM is ready, and ideally after Core Influencer Tracker
        document.addEventListener('DOMContentLoaded', () => {
            // Check if core tracker is available and initialized, then init adapter
            if (global.InfluencerTracker && global.InfluencerTracker.isInitialized) {
                shopifyTrackerInstance.init();
            } else {
                console.warn('Influencer Tracker Core not found or not initialized. Shopify Adapter might not function correctly.');
                // Fallback init for adapter if core isn't there, or delay/retry
                shopifyTrackerInstance.init();
            }
        });
    }
})(typeof window !== 'undefined' ? window : this);

/* === src/ai/ai-data-collector.js === */
// src/ai/ai-data-collector.js (Entry point)
import AISessionAnalyzer from './ai-session-analyzer';

class AIDataCollector {
    constructor() {
        this.analyzer = new AISessionAnalyzer();
        this.activationStrategy = this.determineActivationStrategy();
        this.setupSmartActivation();
    }

    determineActivationStrategy() {
        const config = window.InfluencerTrackerConfig || {};
        
        // Respect explicit configuration
        if (config.aiActivation) return config.aiActivation;
        
        // Smart defaults based on context
        const path = window.location.pathname;
        const isHighValuePage = path.includes('/checkout') || 
                               path.includes('/cart') || 
                               path.includes('/products/');
        
        if (isHighValuePage) return 'immediate';
        
        // Check device capabilities
        const isLowEndDevice = navigator.deviceMemory < 4 || 
                              navigator.hardwareConcurrency < 4;
        
        if (isLowEndDevice) return 'delayed';
        
        return 'engagement'; // Activate based on user engagement
    }

    setupSmartActivation() {
        switch (this.activationStrategy) {
            case 'immediate':
                this.analyzer.activate();
                break;
                
            case 'delayed':
                setTimeout(() => this.analyzer.activate(), 10000); // 10 seconds
                break;
                
            case 'engagement':
                this.activateOnEngagement();
                break;
                
            case 'manual':
                // Wait for manual activation
                break;
                
            default:
                this.activateOnEngagement();
        }
    }

    activateOnEngagement() {
        let engagementScore = 0;
        const engagementThreshold = 3;

        const trackEngagement = () => {
            engagementScore++;
            if (engagementScore >= engagementThreshold && !this.analyzer.isActive) {
                this.analyzer.activate();
                // Remove listeners once activated
                document.removeEventListener('scroll', trackEngagement);
                document.removeEventListener('click', trackEngagement);
                document.removeEventListener('mousemove', trackEngagement);
            }
        };

        // Track basic engagement signals
        document.addEventListener('scroll', trackEngagement, { passive: true, once: false });
        document.addEventListener('click', trackEngagement, { passive: true });
        document.addEventListener('mousemove', trackEngagement, { passive: true });

        // Fallback: activate after 30 seconds regardless
        setTimeout(() => {
            if (!this.analyzer.isActive) {
                this.analyzer.activate();
            }
        }, 30000);
    }

    // Public API
    activate() {
        this.analyzer.activate();
    }

    deactivate() {
        this.analyzer.deactivate();
    }

    getAnalysis() {
        return this.analyzer.analyzeBehavior();
    }

    getMetrics() {
        return this.analyzer.getMetrics();
    }
}

// Global exposure for the build system
const aiDataCollectorInstance = new AIDataCollector();

// Global exposure wrapper for Rollup bundle output
(function(global) {
    if (!global.AIDataCollector) {
        global.AIDataCollector = aiDataCollectorInstance;
        console.log('🤖 AI Data Collector loaded');
    }
})(typeof window !== 'undefined' ? window : this);

export default AIDataCollector;

/* === src/utils/helpers.js === */
/**
 * @fileoverview Utility functions for the Hybrid Shopify Tracker.
 */

class Utils {
    /**
     * Throttles a function to limit how often it can be called.
     * Useful for events like scroll or resize.
     * @param {Function} func - The function to throttle.
     * @param {number} limit - The time in milliseconds to wait before allowing the function to be called again.
     * @returns {Function} - The throttled function.
     */
    static throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    
}

export default Utils;


})(typeof window !== 'undefined' ? window : this, typeof document !== 'undefined' ? document : {});