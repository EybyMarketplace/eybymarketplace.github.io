/*!
 * Influencer Tracker - Device Fingerprint Module
 */
(function(global) {
    'use strict';
    
    global.InfluencerTracker = global.InfluencerTracker || {};
    
    global.InfluencerTracker.DeviceFingerprint = {
        // Cache do fingerprint
        cachedFingerprint: null,
        
        // Gerar fingerprint do dispositivo
        generate: function() {
            if (this.cachedFingerprint) {
                return this.cachedFingerprint;
            }
            
            const screen = window.screen;
            const nav = navigator;
            
            const fingerprint = {
                // Informações básicas
                user_agent: nav.userAgent,
                language: nav.language,
                languages: nav.languages ? nav.languages.join(',') : null,
                platform: nav.platform,
                
                // Informações de tela
                screen_resolution: `${screen.width}x${screen.height}`,
                screen_available: `${screen.availWidth}x${screen.availHeight}`,
                color_depth: screen.colorDepth,
                pixel_depth: screen.pixelDepth,
                
                // Informações de timezone
                timezone: this.getTimezone(),
                timezone_offset: new Date().getTimezoneOffset(),
                
                // Informações de hardware (quando disponível)
                device_memory: nav.deviceMemory || null,
                hardware_concurrency: nav.hardwareConcurrency || null,
                max_touch_points: nav.maxTouchPoints || null,
                
                // Informações de conexão (quando disponível)
                connection: this.getConnectionInfo(),
                
                // Informações de cookies e storage
                cookies_enabled: nav.cookieEnabled,
                local_storage: this.hasLocalStorage(),
                session_storage: this.hasSessionStorage(),
                
                // Informações do viewport
                viewport: this.getViewportInfo(),
                
                // Plugins instalados (limitado por privacidade)
                plugins_count: nav.plugins ? nav.plugins.length : 0,
                
                // Timestamp de geração
                generated_at: Date.now()
            };
            
            this.cachedFingerprint = fingerprint;
            return fingerprint;
        },
        
        // Obter timezone
        getTimezone: function() {
            try {
                return Intl.DateTimeFormat().resolvedOptions().timeZone;
            } catch (error) {
                return null;
            }
        },
        
        // Obter informações de conexão
        getConnectionInfo: function() {
            const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
            
            if (!conn) return null;
            
            return {
                effective_type: conn.effectiveType || null,
                downlink: conn.downlink || null,
                rtt: conn.rtt || null,
                save_data: conn.saveData || false
            };
        },
        
        // Verificar suporte a localStorage
        hasLocalStorage: function() {
            try {
                const test = '__test__';
                localStorage.setItem(test, test);
                localStorage.removeItem(test);
                return true;
            } catch (error) {
                return false;
            }
        },
        
        // Verificar suporte a sessionStorage
        hasSessionStorage: function() {
            try {
                const test = '__test__';
                sessionStorage.setItem(test, test);
                sessionStorage.removeItem(test);
                return true;
            } catch (error) {
                return false;
            }
        },
        
        // Obter informações do viewport
        getViewportInfo: function() {
            return {
                width: window.innerWidth || document.documentElement.clientWidth,
                height: window.innerHeight || document.documentElement.clientHeight,
                device_pixel_ratio: window.devicePixelRatio || 1
            };
        },
        
        // Gerar hash simples do fingerprint
        generateHash: function() {
            const fingerprint = this.generate();
            const str = JSON.stringify(fingerprint);
            let hash = 0;
            
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // Convert to 32bit integer
            }
            
            return Math.abs(hash).toString(36);
        },
        
        // Limpar cache
        clearCache: function() {
            this.cachedFingerprint = null;
        }
    };
    
    console.log('🔍 DeviceFingerprint module loaded');
    
})(window);