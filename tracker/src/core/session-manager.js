
/**
 * @fileoverview Manages session and local storage for customer journey data.
 */

class SessionManager {
    /**
     * Retrieves pages visited from session storage.
     * @returns {Array<object>} List of visited pages.
     */
    static getPagesVisited() {
        try {
            return JSON.parse(sessionStorage.getItem('pages_visited') || '[]');
        } catch (e) {
            console.error('Error parsing pages_visited from session storage:', e);
            return [];
        }
    }

    /**
     * Saves a page visit to session storage, keeping only the last 50.
     * @param {object} pageData - Data about the page visit.
     */
    static savePageVisit(pageData) {
        try {
            const pages = SessionManager.getPagesVisited();
            pages.push({
                url: window.location.href,
                title: document.title,
                timestamp: Date.now(),
                ...pageData
            });

            // Maintain only the last 50 pages
            sessionStorage.setItem('pages_visited', JSON.stringify(pages.slice(-50)));
        } catch (e) {
            console.error('Error saving page visit:', e);
        }
    }

    /**
     * Retrieves products viewed from session storage.
     * @returns {Array<object>} List of viewed products.
     */
    static getProductsViewed() {
        try {
            return JSON.parse(sessionStorage.getItem('products_viewed') || '[]');
        } catch (e) {
            console.error('Error parsing products_viewed from session storage:', e);
            return [];
        }
    }

    /**
     * Saves a product view to session storage, keeping only the last 20.
     * @param {object} productData - Data about the product view.
     */
    static saveProductView(productData) {
        try {
            const products = SessionManager.getProductsViewed();
            products.push({
                timestamp: Date.now(),
                ...productData
            });

            // Maintain only the last 20 products
            sessionStorage.setItem('products_viewed', JSON.stringify(products.slice(-20)));
        } catch (e) {
            console.error('Error saving product view:', e);
        }
    }

    /**
     * Retrieves scroll milestones from session storage.
     * @returns {Array<object>} List of scroll milestones.
     */
    static getScrollMilestones() {
        try {
            return JSON.parse(sessionStorage.getItem('scroll_milestones') || '[]');
        } catch (e) {
            console.error('Error parsing scroll_milestones from session storage:', e);
            return [];
        }
    }

    /**
     * Saves a scroll milestone to session storage, keeping only the last 100.
     * @param {object} scrollData - Data about the scroll milestone.
     */
    static saveScrollMilestone(scrollData) {
        try {
            const milestones = SessionManager.getScrollMilestones();
            milestones.push({
                timestamp: Date.now(),
                page: window.location.href,
                ...scrollData
            });

            // Maintain only the last 100 milestones
            sessionStorage.setItem('scroll_milestones', JSON.stringify(milestones.slice(-100)));
        } catch (e) {
            console.error('Error saving scroll milestone:', e);
        }
    }

    /**
     * Retrieves interaction history from session storage.
     * @returns {Array<object>} List of interactions.
     */
    static getInteractionHistory() {
        try {
            return JSON.parse(sessionStorage.getItem('interaction_history') || '[]');
        } catch (e) {
            console.error('Error parsing interaction_history from session storage:', e);
            return [];
        }
    }

    /**
     * Saves an interaction to session storage, keeping only the last 200.
     * @param {object} interactionData - Data about the interaction.
     */
    static saveInteraction(interactionData) {
        try {
            const interactions = SessionManager.getInteractionHistory();
            interactions.push({
                timestamp: Date.now(),
                page: window.location.href,
                ...interactionData
            });

            // Maintain only the last 200 interactions
            sessionStorage.setItem('interaction_history', JSON.stringify(interactions.slice(-200)));
        } catch (e) {
            console.error('Error saving interaction:', e);
        }
    }

    /**
     * Constructs the full customer journey object from various session storage items.
     * @param {number} startTime - The session start time.
     * @returns {object} The customer journey data.
     */
    static getCustomerJourney(startTime) {
        return {
            session_start: startTime,
            pages_visited: SessionManager.getPagesVisited(),
            products_viewed: SessionManager.getProductsViewed(),
            time_on_site: Date.now() - startTime,
            scroll_milestones: SessionManager.getScrollMilestones(),
            interactions: SessionManager.getInteractionHistory()
        };
    }

    /**
     * Saves the current checkout session data to session storage.
     * @param {object} checkoutSessionData - The checkout session object to save.
     */
    static saveCheckoutSession(checkoutSessionData) {
        try {
            sessionStorage.setItem('checkout_session', JSON.stringify(checkoutSessionData));
        } catch (e) {
            console.error('Error saving checkout session:', e);
        }
    }

    /**
     * Retrieves the checkout session data from session storage.
     * @returns {object|null} The checkout session object or null if not found.
     */
    static getCheckoutSession() {
        try {
            return JSON.parse(sessionStorage.getItem('checkout_session') || 'null');
        } catch (e) {
            console.error('Error retrieving checkout session:', e);
            return null;
        }
    }

    /**
     * Clears the checkout session data from session storage.
     */
    static clearCheckoutSession() {
        try {
            sessionStorage.removeItem('checkout_session');
        } catch (e) {
            console.error('Error clearing checkout session:', e);
        }
    }

    /**
     * Saves abandonment data to local storage.
     * @param {object} abandonmentData - Data related to the abandonment event.
     */
    static saveAbandonmentData(abandonmentData) {
        try {
            localStorage.setItem('checkout_abandonment', JSON.stringify(abandonmentData));
        } catch (e) {
            console.error('Error saving abandonment data:', e);
        }
    }

    /**
     * Retrieves abandonment data from local storage.
     * @returns {object|null} Abandonment data or null.
     */
    static getAbandonmentData() {
        try {
            return JSON.parse(localStorage.getItem('checkout_abandonment') || 'null');
        } catch (e) {
            console.error('Error retrieving abandonment data:', e);
            return null;
        }
    }

    /**
     * Clears abandonment data from local storage.
     */
    static clearAbandonmentData() {
        try {
            localStorage.removeItem('checkout_abandonment');
        } catch (e) {
            console.error('Error clearing abandonment data:', e);
        }
    }
}

export default SessionManager;