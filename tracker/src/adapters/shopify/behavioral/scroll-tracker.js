/*!
 * Scroll Tracking Module
 */

(function (window) {
    'use strict';

    window.ShopifyAdapterModules = window.ShopifyAdapterModules || {};

    window.ShopifyAdapterModules.ScrollTracker = {
        init: function (core) {
            this.core = core;
            this.stateManager = core.stateManager;
            this.setupScrollTracking();
        },

        setupScrollTracking: function () {
            console.log('📜 Configurando tracking de scroll');

            window.addEventListener('scroll', window.InfluencerTracker.Utils.throttle(() => {
                const scrollPercent = Math.round(
                    (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
                );

                if (scrollPercent > this.stateManager.lastScrollPercent) {
                    this.stateManager.lastScrollPercent = scrollPercent;

                    if ([25, 50, 75, 90].includes(scrollPercent)) {
                        const scrollData = {
                            scroll_percent: scrollPercent,
                            scroll_depth: window.scrollY,
                            page_height: document.body.scrollHeight,
                            viewport_height: window.innerHeight,
                            timestamp: Date.now()
                        };

                        this.core.track('scroll_milestone', scrollData);
                        this.saveScrollMilestone(scrollData);
                    }
                }
            }, 1000));
        },

        saveScrollMilestone: function (scrollData) {
            try {
                const milestones = this.getScrollMilestones();
                milestones.push({
                    timestamp: Date.now(),
                    page: window.location.href,
                    ...scrollData
                });

                sessionStorage.setItem('scroll_milestones', JSON.stringify(milestones.slice(-100)));
            } catch (e) {
                console.log('Erro ao salvar milestone de scroll:', e);
            }
        },

        getScrollMilestones: function () {
            try {
                return JSON.parse(sessionStorage.getItem('scroll_milestones') || '[]');
            } catch (e) {
                return [];
            }
        }
    };

    console.log('📜 ScrollTracker module loaded');

})(window);