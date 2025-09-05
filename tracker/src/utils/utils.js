/*!
 * Influencer Tracker - Utilities Module
 */
(function(window) {
    'use strict';
    
    window.CommerceTracker = window.CommerceTracker || {};
    
    window.CommerceTracker.Utils = {
        // Throttle function
        throttle: function(func, limit) {
            let inThrottle;
            return function() {
                const args = arguments;
                const context = this;
                if (!inThrottle) {
                    func.apply(context, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        },
        
        // Verificar se é mobile
        isMobile: function() {
            return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        },
        
        // Verificar se é tablet
        isTablet: function() {
            return /(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(navigator.userAgent);
        },
        
        // Obter tipo de dispositivo
        getDeviceType: function() {
            if (this.isMobile()) return 'mobile';
            if (this.isTablet()) return 'tablet';
            return 'desktop';
        },
        
        // Calcular porcentagem de scroll
        getScrollPercentage: function() {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
            return Math.round((scrollTop / scrollHeight) * 100);
        },
        
        // Sanitizar string para evitar XSS
        sanitizeString: function(str) {
            if (typeof str !== 'string') return str;
            
            return str
                .replace(/[<>]/g, '')
                .replace(/javascript:/gi, '')
                .replace(/on\w+=/gi, '')
                .trim();
        },
        
        // Deep merge de objetos
        deepMerge: function(target, source) {
            const result = Object.assign({}, target);
            
            for (const key in source) {
                if (source.hasOwnProperty(key)) {
                    if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
                        result[key] = this.deepMerge(result[key] || {}, source[key]);
                    } else {
                        result[key] = source[key];
                    }
                }
            }
            
            return result;
        },

        // Função para limpar a URL do web pixel
        getCleanPageUrl: function() {
            let url = window.location.href;

            try {
                // Remove prefixos do web pixel
                const webPixelPattern = /\/web-pixels@[^\/]+\/[^\/]+\/web-pixel-[^\/]+@[^\/]+\/sandbox\/modern/;
                url = url.replace(webPixelPattern, '');

                // Se a URL ainda contém o domínio do Shopify, reconstrói a URL limpa
                const urlObj = new URL(url);

                // Remove parâmetros de tracking comuns
                const trackingParams = [
                    'pr_prod_strat',
                    'pr_rec_id',
                    'pr_rec_pid',
                    'pr_ref_pid',
                    'pr_seq',
                    'utm_source',
                    'utm_medium',
                    'utm_campaign',
                    'utm_term',
                    'utm_content',
                    'fbclid',
                    'gclid',
                    'msclkid',
                    '_ga',
                    '_gl'
                ];

                trackingParams.forEach(param => {
                    urlObj.searchParams.delete(param);
                });

                // Reconstrói a URL limpa
                let cleanUrl = `${urlObj.origin}${urlObj.pathname}`;

                // Adiciona parâmetros de query restantes se existirem
                const remainingParams = urlObj.searchParams.toString();
                if (remainingParams) {
                    cleanUrl += `?${remainingParams}`;
                }

                return cleanUrl;

            } catch (error) {
                console.warn('Erro ao limpar URL:', error);
                // Fallback: retorna pelo menos o pathname
                return `${window.location.origin}${window.location.pathname}`;
            }
        }
    };
    
    console.log('🔧 Utils module loaded');
    
})(window);