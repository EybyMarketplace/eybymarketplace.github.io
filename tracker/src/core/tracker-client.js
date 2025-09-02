/**
 * @fileoverview Client for sending tracking events.
 * Abstracts the underlying tracking mechanism (e.g., window.InfluencerTracker).
 */

class TrackerClient {
    /**
     * Sends a tracking event.
     * If window.InfluencerTracker is available, it uses its track method.
     * Otherwise, it logs the event to the console.
     * @param {string} eventType - The type of event (e.g., 'cart_add', 'page_view').
     * @param {object} [properties={}] - An object containing properties related to the event.
     */
    static track(eventType, properties = {}) {
        if (window.InfluencerTracker && window.InfluencerTracker.track) {
            window.InfluencerTracker.track(eventType, properties);
        } else {
            // Fallback for development or if the main tracker isn't loaded
            console.log('📊 Evento rastreado:', eventType, properties);
        }
    }
}

export default TrackerClient;