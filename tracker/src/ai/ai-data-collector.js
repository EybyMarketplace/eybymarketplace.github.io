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