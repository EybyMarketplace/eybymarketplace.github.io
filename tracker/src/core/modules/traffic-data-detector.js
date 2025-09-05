/*!
 * Influencer Tracker - Influencer Detector Module
 */
(function(window) {
    'use strict';
    
    window.CommerceTracker = window.CommerceTracker || {};
    
    window.CommerceTracker.TrafficDataDetector = {
        // Chave de armazenamento
        ATTRIBUTION_KEY: 'inf_attribution',
        
        // Mapeamento de redes sociais
        socialMediaSources: {
            'facebook.com': 'Facebook',
            'fb.com': 'Facebook',
            'm.facebook.com': 'Facebook',
            'instagram.com': 'Instagram',
            'twitter.com': 'Twitter',
            'x.com': 'Twitter',
            't.co': 'Twitter',
            'linkedin.com': 'LinkedIn',
            'youtube.com': 'YouTube',
            'youtu.be': 'YouTube',
            'tiktok.com': 'TikTok',
            'pinterest.com': 'Pinterest',
            'pin.it': 'Pinterest',
            'snapchat.com': 'Snapchat',
            'reddit.com': 'Reddit',
            'whatsapp.com': 'WhatsApp',
            'telegram.org': 'Telegram',
            't.me': 'Telegram',
            'discord.com': 'Discord',
            'twitch.tv': 'Twitch'
        },

        // Detecta mecanismos de busca
        searchEngines: {
            'google.': 'Google',
            'bing.com': 'Bing',
            'yahoo.com': 'Yahoo',
            'duckduckgo.com': 'DuckDuckGo',
            'yandex.': 'Yandex',
            'baidu.com': 'Baidu'
        },
        
        
        // Extrai informações de UTM parameters
        getUtmParams: () => {
            const urlParams = new URLSearchParams(window.location.search);
            return {
                utm_source: urlParams.get('utm_source'),
                utm_medium: urlParams.get('utm_medium'),
                utm_campaign: urlParams.get('utm_campaign'),
                utm_term: urlParams.get('utm_term'),
                utm_content: urlParams.get('utm_content')
            };
        },

        // Extrai informações de afiliado
        getAffiliateInfo: () => {
            const urlParams = new URLSearchParams(window.location.search);
            return {
                affiliate_id: urlParams.get('aff') || urlParams.get('affiliate') || urlParams.get('ref'),
                referral_code: urlParams.get('referral') || urlParams.get('promo'),
                partner_id: urlParams.get('partner') || urlParams.get('pid'),
                influencer_code: urlParams.get('influencer') || urlParams.get('inf'),
                discount_code: urlParams.get('discount') || urlParams.get('coupon')
            };
        },

        // Detecta fonte de tráfego pelo referrer
        getTrafficSource: () => {
            const referrer = document.referrer.toLowerCase();

            if (!referrer) {
                return {
                    source_type: 'direct',
                    source_name: 'Direct Traffic',
                    referrer_domain: null
                };
            }

            try {
                const referrerUrl = new URL(document.referrer);
                const domain = referrerUrl.hostname.toLowerCase();

                // Verifica se é rede social
                for (const [key, name] of Object.entries(this.socialMediaSources)) {
                    if (domain.includes(key)) {
                        return {
                            source_type: 'social',
                            source_name: name,
                            referrer_domain: domain,
                            referrer_url: document.referrer
                        };
                    }
                }

                // Verifica se é mecanismo de busca
                for (const [key, name] of Object.entries(this.searchEngines)) {
                    if (domain.includes(key)) {
                        return {
                            source_type: 'search',
                            source_name: name,
                            referrer_domain: domain,
                            referrer_url: document.referrer,
                            search_query: referrerUrl.searchParams.get('q') ||
                                referrerUrl.searchParams.get('query') ||
                                referrerUrl.searchParams.get('search')
                        };
                    }
                }

                // Verifica se é email marketing
                if (domain.includes('mail') || domain.includes('email') ||
                    referrer.includes('newsletter') || referrer.includes('campaign')) {
                    return {
                        source_type: 'email',
                        source_name: 'Email Marketing',
                        referrer_domain: domain,
                        referrer_url: document.referrer
                    };
                }

                // Tráfego de referência genérico
                return {
                    source_type: 'referral',
                    source_name: domain,
                    referrer_domain: domain,
                    referrer_url: document.referrer
                };

            } catch (error) {
                return {
                    source_type: 'unknown',
                    source_name: 'Unknown',
                    referrer_domain: null,
                    error: error.message
                };
            }
        },

        // Detecta informações de campanha do Facebook
        getFacebookCampaignInfo: () => {
            const urlParams = new URLSearchParams(window.location.search);
            return {
                fbclid: urlParams.get('fbclid'),
                fb_action_ids: urlParams.get('fb_action_ids'),
                fb_action_types: urlParams.get('fb_action_types'),
                fb_source: urlParams.get('fb_source')
            };
        },

        // Detecta informações de campanha do Google
        getGoogleCampaignInfo: () => {
            const urlParams = new URLSearchParams(window.location.search);
            return {
                gclid: urlParams.get('gclid'),
                gclsrc: urlParams.get('gclsrc'),
                dclid: urlParams.get('dclid'),
                wbraid: urlParams.get('wbraid'),
                gbraid: urlParams.get('gbraid')
            };
        },

        // Função principal que coleta todas as informações
        getTrafficData: () => {
            const utmParams = this.getUtmParams();
            const affiliateInfo = this.getAffiliateInfo();
            const trafficSource = this.getTrafficSource();
            const facebookInfo = this.getFacebookCampaignInfo();
            const googleInfo = this.getGoogleCampaignInfo();

            return {
                // Informações de UTM
                utm_data: utmParams,

                // Informações de afiliado
                affiliate_data: affiliateInfo,

                // Fonte de tráfego
                traffic_source: trafficSource,

                // Informações específicas de plataformas
                facebook_data: facebookInfo,
                google_data: googleInfo,

                // Informações adicionais
                landing_page: window.location.pathname,
                full_url: window.location.href,
                user_agent: navigator.userAgent,
                timestamp: Date.now()
            };
        }
    };
    
    console.log('🎯 TrafficDataDetector module loaded');
    
})(window);