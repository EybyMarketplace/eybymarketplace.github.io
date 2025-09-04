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