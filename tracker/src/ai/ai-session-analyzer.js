// src/ai/ai-session-analyzer.js
class AISessionAnalyzer {
    constructor() {
        this.sessionStart = Date.now();
        this.behaviorMetrics = {
            pageViews: 0,
            productViews: 0,
            cartActions: 0,
            totalClicks: 0,
            scrollDepth: [],
            timeOnPages: []
        };
        this.analysisInterval = null;
        this.isActive = false;
    }

    // Lazy initialization - only start when actually needed
    activate() {
        if (this.isActive) return;
        
        this.isActive = true;
        this.integrateWithTracker();
        this.startPeriodicAnalysis();
        
        console.log('🤖 AI Session Analyzer activated');
    }

    deactivate() {
        if (!this.isActive) return;
        
        this.isActive = false;
        if (this.analysisInterval) {
            clearInterval(this.analysisInterval);
            this.analysisInterval = null;
        }
        
        // Send final analysis before deactivating
        this.sendAnalysis();
        console.log('🤖 AI Session Analyzer deactivated');
    }

    analyzeBehavior() {
        const sessionDuration = Date.now() - this.sessionStart;
        const metrics = this.behaviorMetrics;

        return {
            behavioral_segment: this.getBehavioralSegment(metrics, sessionDuration),
            conversion_probability: this.getConversionProbability(metrics, sessionDuration),
            engagement_quality: this.getEngagementQuality(metrics, sessionDuration),
            device_tier: this.getDeviceTier(),
            attribution_confidence: this.getAttributionConfidence()
        };
    }

    // ... (keep all your existing analysis methods)
    getBehavioralSegment(metrics, duration) {
        if (metrics.cartActions > 0 && duration < 300000) return 'decisive_buyer';
        if (metrics.cartActions > 2) return 'hesitant_buyer';
        if (metrics.productViews > 5 && metrics.cartActions === 0) return 'researcher';
        if (metrics.totalClicks > 10) return 'price_conscious';
        return 'casual_browser';
    }

    getConversionProbability(metrics, duration) {
        let score = 0;
        if (metrics.cartActions > 0) score += 40;
        if (metrics.productViews > 3) score += 20;
        if (duration > 180000) score += 20;
        if (metrics.totalClicks > 5) score += 10;
        if (metrics.pageViews > 5) score += 10;

        if (score >= 70) return 'high';
        if (score >= 40) return 'medium';
        return 'low';
    }

    getEngagementQuality(metrics, duration) {
        const avgScrollDepth = metrics.scrollDepth.length > 0 ?
            metrics.scrollDepth.reduce((a, b) => a + b, 0) / metrics.scrollDepth.length : 0;

        let score = 0;
        score += metrics.pageViews * 5;
        score += (duration / 1000) * 0.1;
        score += metrics.totalClicks * 2;
        score += avgScrollDepth * 0.5;

        if (score >= 100) return 'high';
        if (score >= 50) return 'medium';
        return 'low';
    }

    getDeviceTier() {
        const memory = navigator.deviceMemory || 4;
        const cores = navigator.hardwareConcurrency || 4;
        const screen = window.screen;
        const resolution = screen.width * screen.height;

        if (memory >= 8 && cores >= 8 && resolution > 2073600) return 'premium';
        if (memory >= 4 && resolution > 921600) return 'mid_range';
        return 'budget';
    }

    getAttributionConfidence() {
        let confidence = 0.3;
        const urlParams = new URLSearchParams(window.location.search);
        const hasAffiliateCode = urlParams.get('affiliate') || urlParams.get('ref');
        const hasUTM = urlParams.get('utm_source');
        const hasSocialRef = document.referrer &&
            ['instagram.com', 'tiktok.com', 'youtube.com', 'facebook.com'].some(domain =>
                document.referrer.includes(domain));

        if (hasAffiliateCode) confidence += 0.4;
        if (hasUTM) confidence += 0.2;
        if (hasSocialRef) confidence += 0.1;

        return Math.min(confidence, 1.0);
    }

    updateMetrics(eventType, eventData) {
        if (!this.isActive) return; // Don't process if not active

        switch (eventType) {
            case 'page_view':
                this.behaviorMetrics.pageViews++;
                break;
            case 'product_view':
            case 'product_impression': 
                this.behaviorMetrics.productViews++;
                break;
            case 'cart_update': 
                this.behaviorMetrics.cartActions++;
                break;
            case 'scroll_milestone': 
                if (eventData && eventData.scroll_percent) {
                    this.behaviorMetrics.scrollDepth.push(eventData.scroll_percent);
                }
                break;
            case 'variant_selection':
            case 'click_event':
                this.behaviorMetrics.totalClicks++;
                break;
        }
    }

    integrateWithTracker() {
        if (!window.InfluencerTracker) {
            console.warn('InfluencerTracker not found, AI integration limited');
            return;
        }

        const originalTrack = window.InfluencerTracker.track;
        const self = this;

        window.InfluencerTracker.track = function (eventType, properties = {}) {
            // Update AI metrics
            self.updateMetrics(eventType, properties);
            // Call original function
            originalTrack.call(this, eventType, properties);
        };

        // Add AI analysis method
        window.InfluencerTracker.getAIAnalysis = () => this.analyzeBehavior();
        window.InfluencerTracker.ai = this; // Direct access to AI instance
    }

    startPeriodicAnalysis() {
        // Send analysis every 5 minutes
        this.analysisInterval = setInterval(() => {
            this.sendAnalysis();
        }, 300000);

        // Send final analysis on page unload
        window.addEventListener('beforeunload', () => {
            this.sendAnalysis();
        });
    }

    sendAnalysis() {
        if (!this.isActive || !window.InfluencerTracker) return;

        const analysis = this.analyzeBehavior();
        
        window.InfluencerTracker.track('ai_session_analysis', {
            session_analysis: analysis,
            session_duration: Date.now() - this.sessionStart,
            total_events: Object.values(this.behaviorMetrics).reduce((sum, val) =>
                Array.isArray(val) ? sum + val.length : sum + val, 0)
        });
    }

    // Get current metrics for debugging
    getMetrics() {
        return {
            ...this.behaviorMetrics,
            sessionDuration: Date.now() - this.sessionStart,
            isActive: this.isActive
        };
    }
}

export default AISessionAnalyzer;