/*!
 * Influencer Tracker - Influencer Detector Module
 */
(function(window) {
    'use strict';
    
    window.CommerceTracker = window.CommerceTracker || {};
    
    window.CommerceTracker.InfluencerDetector = {
        // Chave de armazenamento
        ATTRIBUTION_KEY: 'inf_attribution',
        
        // Mapeamento de redes sociais
        socialNetworks: {
            'instagram.com': 'instagram',
            'tiktok.com': 'tiktok',
            'youtube.com': 'youtube',
            'youtu.be': 'youtube',
            'facebook.com': 'facebook',
            'twitter.com': 'twitter',
            'x.com': 'twitter',
            'linkedin.com': 'linkedin',
            'pinterest.com': 'pinterest',
            'snapchat.com': 'snapchat'
        },
        
        // Detectar influenciador
        detectInfluencer: function() {
            const urlParams = new URLSearchParams(window.location.search);
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            
            // Parâmetros de influenciador
            const influencerParams = {
                influencer_id: this.getParam(urlParams, hashParams, ['inf_id', 'influencer', 'inf']),
                campaign_id: this.getParam(urlParams, hashParams, ['camp_id', 'campaign', 'cmp']),
                promo_code: this.getParam(urlParams, hashParams, ['promo', 'codigo', 'discount']),
                utm_source: urlParams.get('utm_source'),
                utm_medium: urlParams.get('utm_medium'),
                utm_campaign: urlParams.get('utm_campaign'),
                utm_content: urlParams.get('utm_content'),
                utm_term: urlParams.get('utm_term'),
                ref: urlParams.get('ref'),
                affiliate_id: this.getParam(urlParams, hashParams, ['aff_id', 'affiliate'])
            };
            
            // Detectar origem de redes sociais
            const socialSource = this.detectSocialSource();
            
            // Verificar se há dados de influenciador
            const hasInfluencerData = Object.values(influencerParams).some(val => val !== null && val !== '');
            
            if (hasInfluencerData || socialSource) {
                const influencerData = {
                    ...influencerParams,
                    social_source: socialSource,
                    detected_at: Date.now(),
                    landing_page: window.location.href,
                    referrer: document.referrer,
                    user_agent: navigator.userAgent
                };
                
                // Salvar na sessão
                sessionStorage.setItem(this.ATTRIBUTION_KEY, JSON.stringify(influencerData));
                return influencerData;
            }
            
            // Retornar dados salvos se existirem
            return this.getSavedAttribution();
        },
        
        // Obter parâmetro de múltiplas fontes
        getParam: function(urlParams, hashParams, keys) {
            for (const key of keys) {
                const value = urlParams.get(key) || hashParams.get(key);
                if (value) return value;
            }
            return null;
        },
        
        // Detectar origem de rede social
        detectSocialSource: function() {
            const referrer = document.referrer;
            if (!referrer) return null;
            
            try {
                const referrerHost = new URL(referrer).hostname.toLowerCase();
                
                for (const [domain, network] of Object.entries(this.socialNetworks)) {
                    if (referrerHost.includes(domain)) {
                        return network;
                    }
                }
            } catch (error) {
                console.warn('Error parsing referrer:', error);
            }
            
            return null;
        },
        
        // Obter atribuição salva
        getSavedAttribution: function() {
            try {
                const saved = sessionStorage.getItem(this.ATTRIBUTION_KEY);
                return saved ? JSON.parse(saved) : null;
            } catch (error) {
                console.warn('Error parsing saved attribution:', error);
                return null;
            }
        },
        
        // Limpar atribuição
        clearAttribution: function() {
            sessionStorage.removeItem(this.ATTRIBUTION_KEY);
        },
        
        // Verificar se há atribuição ativa
        hasActiveAttribution: function() {
            return !!this.getSavedAttribution();
        }
    };
    
    console.log('🎯 InfluencerDetector module loaded');
    
})(window);