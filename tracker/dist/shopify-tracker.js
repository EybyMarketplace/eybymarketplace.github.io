window.CommerceTracker = (function () {
    const IdGenerator = {
        generateUUID: () => {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                const r = Math.random() * 16 | 0;
                const v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        },

        getUserId: () => {
            let userId = localStorage.getItem('commerce_tracker_user_id');
            if (!userId) {
                userId = IdGenerator.generateUUID();
                localStorage.setItem('commerce_tracker_user_id', userId);
            }
            return userId;
        },

        getSessionId: () => {
            let sessionId = sessionStorage.getItem('commerce_tracker_session_id');
            if (!sessionId) {
                sessionId = IdGenerator.generateUUID();
                sessionStorage.setItem('commerce_tracker_session_id', sessionId);
            }
            return sessionId;
        }
    };

    // 🎯 AFFILIATE & TRAFFIC SOURCE TRACKER
    const TrafficTracker = {
        // Detecta redes sociais pelo referrer
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
                for (const [key, name] of Object.entries(TrafficTracker.socialMediaSources)) {
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
                for (const [key, name] of Object.entries(TrafficTracker.searchEngines)) {
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
            const utmParams = TrafficTracker.getUtmParams();
            const affiliateInfo = TrafficTracker.getAffiliateInfo();
            const trafficSource = TrafficTracker.getTrafficSource();
            const facebookInfo = TrafficTracker.getFacebookCampaignInfo();
            const googleInfo = TrafficTracker.getGoogleCampaignInfo();

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

    const DeviceFingerprint = {
        generate: () => {
            return {
                user_agent: navigator.userAgent,
                language: navigator.language,
                platform: navigator.platform,
                screen_resolution: `${screen.width}x${screen.height}`,
                screen_color_depth: screen.colorDepth,
                timezone_offset: new Date().getTimezoneOffset(),
                has_local_storage: !!window.localStorage,
                has_session_storage: !!window.sessionStorage,
                has_cookies: navigator.cookieEnabled,
            };
        },
    };


    const getProjectId = () => {
        const hostname = window.location.hostname;
        return hostname.replace('.myshopify.com', '').replace(/\./g, '-');
    };

    const PROJECT_ID = getProjectId();
    const API_VERSION = '1.0.0';

    let eventBuffer = [];
    let bufferTimeout = null;

    function sendEventBatch() {
        if (eventBuffer.length === 0) return;

        const payload = {
            project_id: PROJECT_ID,
            events: [...eventBuffer],
            version: API_VERSION
        };

        console.log('📊 Enviando batch de eventos:', payload);

        fetch('https://rhino-bursting-cardinal.ngrok-free.app/api/tracking/events', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        }).then(response => {
            console.log('✅ Batch enviado:', response.status);
        }).catch(error => {
            console.error('❌ Erro ao enviar batch:', error);
        });

        eventBuffer = [];
    }

    // Função para limpar a URL do web pixel
    function getCleanPageUrl() {
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

    function trackEvent(eventType, properties = {}) {
        // 🎯 Adiciona dados de tráfego e afiliado a todos os eventos
        const trafficData = TrafficTracker.getTrafficData();

        const event = {
            event_id: IdGenerator.generateUUID(),
            event_type: eventType,
            timestamp: Date.now(),
            user_id: IdGenerator.getUserId(),
            session_id: IdGenerator.getSessionId(),
            page_url: getCleanPageUrl(),
            device_fingerprint: DeviceFingerprint.generate(),
            properties: {
                ...properties,
                traffic_attribution: [trafficData] // Array conforme solicitado
            }
        };

        console.log('📊 Evento rastreado (Pixel):', event);

        eventBuffer.push(event);

        if (eventBuffer.length >= 5) {
            if (bufferTimeout) {
                clearTimeout(bufferTimeout);
                bufferTimeout = null;
            }
            sendEventBatch();
        } else {
            if (!bufferTimeout) {
                bufferTimeout = setTimeout(() => {
                    sendEventBatch();
                    bufferTimeout = null;
                }, 2000);
            }
        }
    }

    // Helper function to extract product data
    function extractProductData(product) {
        if (!product) return null;

        return {
            id: product.id,
            title: product.title,
            handle: product.handle,
            vendor: product.vendor,
            type: product.type,
            price: product.price ? parseFloat(product.price.amount) : null,
            currency: product.price ? product.price.currencyCode : null,
            available: product.available,
            tags: product.tags || [],
            created_at: product.createdAt,
            updated_at: product.updatedAt
        };
    }

    // Helper function to extract variant data
    function extractVariantData(variant) {
        if (!variant) return null;

        return {
            id: variant.id,
            title: variant.title,
            price: parseFloat(variant.price.amount),
            currency: variant.price.currencyCode,
            compare_at_price: variant.compareAtPrice ? parseFloat(variant.compareAtPrice.amount) : null,
            available: variant.available,
            inventory_quantity: variant.inventoryQuantity,
            sku: variant.sku,
            barcode: variant.barcode,
            weight: variant.weight,
            weight_unit: variant.weightUnit,
            product: extractProductData(variant.product)
        };
    }

    // Helper function to extract cart line items
    function extractLineItems(lineItems) {
        if (!lineItems) return [];

        return lineItems.map(item => ({
            id: item.id,
            quantity: item.quantity,
            title: item.title,
            variant: extractVariantData(item.variant),
            line_price: parseFloat(item.variant.price.amount) * item.quantity,
            discounts: item.discounts || [],
            properties: item.properties || {}
        }));
    }

    function setupDOMEvents() {
        window.addEventListener('beforeunload', () => {
            if (eventBuffer.length > 0) {
                sendEventBatch();
            }
        });

        // === DOM INTERACTION EVENTS (Custom) ===

        // Track clicks on specific elements
        document.addEventListener('click', (e) => {
            // Track newsletter signup
            if (e.target.matches('[data-track="newsletter-signup"]') ||
                e.target.closest('[data-track="newsletter-signup"]')) {
                trackEvent('fp_newsletter_signup_clicked', {
                    element_text: e.target.textContent?.trim(),
                    element_id: e.target.id,
                    element_class: e.target.className,
                    timestamp: Date.now()
                });
            }

            // Track social media clicks
            if (e.target.matches('[data-track="social-media"]') ||
                e.target.closest('[data-track="social-media"]')) {
                trackEvent('fp_social_media_clicked', {
                    platform: e.target.dataset.platform || 'unknown',
                    element_text: e.target.textContent?.trim(),
                    timestamp: Date.now()
                });
            }

            // Track CTA button clicks
            if (e.target.matches('.btn, .button, [data-track="cta"]') ||
                e.target.closest('.btn, .button, [data-track="cta"]')) {
                trackEvent('fp_cta_clicked', {
                    button_text: e.target.textContent?.trim(),
                    button_id: e.target.id,
                    button_class: e.target.className,
                    page_url: getCleanPageUrl(),
                    timestamp: Date.now()
                });
            }
        });

        // Track scroll depth
        let maxScrollDepth = 0;
        let scrollDepthSent = [];

        window.addEventListener('scroll', () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrollPercent = Math.round((scrollTop / documentHeight) * 100);

            if (scrollPercent > maxScrollDepth) {
                maxScrollDepth = scrollPercent;

                // Track at 25%, 50%, 75%, 100%
                [25, 50, 75, 100].forEach(threshold => {
                    if (scrollPercent >= threshold && !scrollDepthSent.includes(threshold)) {
                        scrollDepthSent.push(threshold);
                        trackEvent('fp_scroll_depth', {
                            depth_percent: threshold,
                            page_url: getCleanPageUrl(),
                            timestamp: Date.now()
                        });
                    }
                });
            }
        });

        // Track time on page
        let pageStartTime = Date.now();
        let timeOnPageSent = [];

        setInterval(() => {
            const timeOnPage = Math.round((Date.now() - pageStartTime) / 1000);

            // Track at 30s, 60s, 120s, 300s
            [30, 60, 120, 300].forEach(threshold => {
                if (timeOnPage >= threshold && !timeOnPageSent.includes(threshold)) {
                    timeOnPageSent.push(threshold);
                    trackEvent('fp_time_on_page', {
                        time_seconds: threshold,
                        page_url: getCleanPageUrl(),
                        timestamp: Date.now()
                    });
                }
            });
        }, 5000); // Check every 5 seconds

    }

    // API pública
    return {
        init: function () {
            setupDOMEvents();
            console.log('✅ Commerce Tracker Core inicializado!');
        },

        track: trackEvent,
        getCleanPageUrl: getCleanPageUrl,
        extractProductData: extractProductData,
        extractVariantData: extractVariantData,
        extractLineItems: extractLineItems
    };
})();