/*!
 * Influencer Tracker - AI-ONLY Build
 * Version: 2.1.0 with AI Analytics
 * Built: 2025-09-01T19:49:10.940Z
 * Files: src/ai/ai-data-collector.js
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
    name: 'ai-only',
    version: '2.1.0',
    timestamp: '2025-09-01T19:49:10.940Z',
    files: ["src/ai/ai-data-collector.js"],
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


/* === src/ai/ai-data-collector.js === */
/*!
 * AI Data Collector - Integração com customer_sessions existente
 */

(function (window, document) {
    'use strict';

    const AISessionAnalyzer = {
        sessionStart: Date.now(),
        behaviorMetrics: {
            pageViews: 0,
            productViews: 0,
            cartActions: 0,
            totalClicks: 0,
            scrollDepth: [],
            timeOnPages: []
        },

        // Analisar comportamento baseado nos eventos já coletados
        analyzeBehavior: function () {
            const sessionDuration = Date.now() - this.sessionStart;
            const metrics = this.behaviorMetrics;

            return {
                behavioral_segment: this.getBehavioralSegment(metrics, sessionDuration),
                conversion_probability: this.getConversionProbability(metrics, sessionDuration),
                engagement_quality: this.getEngagementQuality(metrics, sessionDuration),
                device_tier: this.getDeviceTier(),
                attribution_confidence: this.getAttributionConfidence()
            };
        },

        getBehavioralSegment: function (metrics, duration) {
            // Lógica baseada nos eventos já coletados
            if (metrics.cartActions > 0 && duration < 300000) return 'decisive_buyer';
            if (metrics.cartActions > 2) return 'hesitant_buyer';
            if (metrics.productViews > 5 && metrics.cartActions === 0) return 'researcher';
            if (metrics.totalClicks > 10) return 'price_conscious';
            return 'casual_browser';
        },

        getConversionProbability: function (metrics, duration) {
            let score = 0;

            if (metrics.cartActions > 0) score += 40;
            if (metrics.productViews > 3) score += 20;
            if (duration > 180000) score += 20; // > 3 min
            if (metrics.totalClicks > 5) score += 10;
            if (metrics.pageViews > 5) score += 10;

            if (score >= 70) return 'high';
            if (score >= 40) return 'medium';
            return 'low';
        },

        getEngagementQuality: function (metrics, duration) {
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
        },

        getDeviceTier: function () {
            const memory = navigator.deviceMemory || 4;
            const cores = navigator.hardwareConcurrency || 4;
            const screen = window.screen;
            const resolution = screen.width * screen.height;

            if (memory >= 8 && cores >= 8 && resolution > 2073600) return 'premium';
            if (memory >= 4 && resolution > 921600) return 'mid_range';
            return 'budget';
        },

        getAttributionConfidence: function () {
            // Calcular confiança baseada nos dados de atribuição
            let confidence = 0.3; // Base

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
        },

        // Atualizar métricas baseado nos eventos
        updateMetrics: function (eventType, eventData) {
            switch (eventType) {
                case 'page_view':
                    this.behaviorMetrics.pageViews++;
                    break;
                case 'product_view':
                    this.behaviorMetrics.productViews++;
                    break;
                case 'add_to_cart':
                case 'remove_from_cart':
                    this.behaviorMetrics.cartActions++;
                    break;
                case 'click':
                    this.behaviorMetrics.totalClicks++;
                    break;
                case 'scroll':
                    if (eventData && eventData.scroll_percent) {
                        this.behaviorMetrics.scrollDepth.push(eventData.scroll_percent);
                    }
                    break;
            }
        },

        // Enviar análise final para atualizar customer_sessions
        sendAnalysis: function () {
            const analysis = this.analyzeBehavior();

            // Usar o sistema existente do InfluencerTracker
            if (window.InfluencerTracker) {
                window.InfluencerTracker.track('ai_session_analysis', {
                    session_analysis: analysis,
                    session_duration: Date.now() - this.sessionStart,
                    total_events: Object.values(this.behaviorMetrics).reduce((sum, val) =>
                        Array.isArray(val) ? sum + val.length : sum + val, 0)
                });
            }
        }
    };

    // Integrar com o InfluencerTracker existente
    if (window.InfluencerTracker) {
        const originalTrack = window.InfluencerTracker.track;

        window.InfluencerTracker.track = function (eventType, properties = {}) {
            // Atualizar métricas de IA
            AISessionAnalyzer.updateMetrics(eventType, properties);

            // Chamar função original
            originalTrack.call(this, eventType, properties);
        };

        // Adicionar método para análise manual
        window.InfluencerTracker.getAIAnalysis = function () {
            return AISessionAnalyzer.analyzeBehavior();
        };
    }

    // Enviar análise periodicamente
    setInterval(() => {
        AISessionAnalyzer.sendAnalysis();
    }, 300000); // A cada 5 minutos

    // Enviar análise final ao sair
    window.addEventListener('beforeunload', () => {
        AISessionAnalyzer.sendAnalysis();
    });

    // Expor globalmente para debug
    window.AISessionAnalyzer = AISessionAnalyzer;

    console.log('🤖 AI Session Analyzer integrated with existing customer_sessions');

})(window, document);


})(typeof window !== 'undefined' ? window : this, typeof document !== 'undefined' ? document : {});