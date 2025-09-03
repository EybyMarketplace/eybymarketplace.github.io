/*!
 * Time Tracking Module
 */

(function (window) {
    'use strict';

    window.ShopifyAdapterModules = window.ShopifyAdapterModules || {};

    window.ShopifyAdapterModules.TimeTracker = {
        init: function (core) {
            this.core = core;
            this.stateManager = core.stateManager;
            this.setupTimeTracking();
        },

        setupTimeTracking: function () {
            console.log('⏱️ Configurando tracking de tempo');

            setInterval(() => {
                this.stateManager.timeOnPage += 10;

                if ([30, 60, 120, 300, 600].includes(this.stateManager.timeOnPage)) {
                    this.core.track('time_milestone', {
                        seconds_on_page: this.stateManager.timeOnPage,
                        minutes_on_page: Math.round(this.stateManager.timeOnPage / 60),
                        is_active: document.hasFocus(),
                        timestamp: Date.now()
                    });
                }
            }, 10000);
        }
    };

    console.log('⏱️ TimeTracker module loaded');

})(window);