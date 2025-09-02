export class InfluencerDetector {
    static detectInfluencer() {
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        
        // Verifica parâmetros de influenciador na URL
        const influencerParams = {
            influencer_id: urlParams.get('inf_id') || urlParams.get('influencer') || hashParams.get('inf_id'),
            campaign_id: urlParams.get('camp_id') || urlParams.get('campaign') || hashParams.get('camp_id'),
            promo_code: urlParams.get('promo') || urlParams.get('codigo') || hashParams.get('promo'),
            utm_source: urlParams.get('utm_source'),
            utm_medium: urlParams.get('utm_medium'),
            utm_campaign: urlParams.get('utm_campaign'),
            ref: urlParams.get('ref')
        };
        
        // Detecta origem de redes sociais
        const referrer = document.referrer;
        let socialSource = null;
        
        if (referrer.includes('instagram.com')) socialSource = 'instagram';
        else if (referrer.includes('tiktok.com')) socialSource = 'tiktok';
        else if (referrer.includes('youtube.com') || referrer.includes('youtu.be')) socialSource = 'youtube';
        else if (referrer.includes('facebook.com')) socialSource = 'facebook';
        else if (referrer.includes('twitter.com') || referrer.includes('x.com')) socialSource = 'twitter';
        
        // Salva dados do influenciador na sessão se detectado
        const hasInfluencerData = Object.values(influencerParams).some(val => val !== null);
        
        if (hasInfluencerData || socialSource) {
            const influencerData = {
                ...influencerParams,
                social_source: socialSource,
                detected_at: Date.now(),
                landing_page: window.location.href
            };
            
            sessionStorage.setItem('inf_attribution', JSON.stringify(influencerData));
            return influencerData;
        }
        
        // Retorna dados salvos se existirem
        const saved = sessionStorage.getItem('inf_attribution');
        return saved ? JSON.parse(saved) : null;
    }
}