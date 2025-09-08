/*!
 * Influencer Tracker - Geolocation Module
 */
(function(window) {
    'use strict';

    window.CommerceTracker = window.CommerceTracker || {};

    window.CommerceTracker.GeolocationManager = {
        getApproximateLocation: function() {
            return new Promise((resolve, reject) => {
                const optOut = localStorage.getItem('location_opt_out');
                if (optOut) {
                    reject(new Error('User has opted out of location tracking'));
                    return;
                }

                fetch('https://ipapi.co/json/')
                    .then(response => response.json())
                    .then(data => {
                        const location = {
                            country: data.country_name,
                            country_code: data.country_code,
                            region: data.region,
                            city: data.city,
                            latitude: data.latitude,
                            longitude: data.longitude,
                            timezone: data.timezone,
                            type: 'approximate',
                            timestamp: Date.now()
                        };
                        resolve(location);
                    })
                    .catch(reject);
            });
        }
    };

    console.log('📍 Geolocation module loaded');
    
})(window);