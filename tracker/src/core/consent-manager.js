import { CONFIG } from './config.js';

export class ConsentManager {
    static checkConsent() {
        if (!CONFIG.enableConsentCheck) return true;
        
        const consent = localStorage.getItem('analytics_consent');
        return consent === 'granted';
    }
    
    static waitForConsent(callback) {
        const checkInterval = setInterval(() => {
            if (this.checkConsent()) {
                clearInterval(checkInterval);
                callback();
            }
        }, 500);
        
        // Timeout após 10 segundos
        setTimeout(() => {
            clearInterval(checkInterval);
        }, 10000);
    }
}