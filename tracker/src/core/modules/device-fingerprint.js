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