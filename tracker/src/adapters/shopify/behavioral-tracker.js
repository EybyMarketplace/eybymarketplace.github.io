import TrackerClient from '../../core/tracker-client';
import Utils from '../../utils/Utils';
import SessionManager from '../session/SessionManager';

/**
 * @fileoverview Manages behavioral tracking for user interactions on the page.
 */
class BehavioralTracker {
    constructor(startTime) {
        this.startTime = startTime || Date.now();
        this.lastScrollPercent = 0;
        this.timeOnPage = 0;
        this.exitTracked = false;
        this.formInteractions = {}; // To store data about form field interactions
        this.setupBehavioralTracking();
    }

    /**
     * Sets up all behavioral tracking listeners.
     */
    setupBehavioralTracking() {
        console.log('👤 Configurando tracking comportamental');

        this.trackScrollBehavior();
        this.trackTimeOnPage();
        this.trackExitIntent();
        this.trackClickBehavior();
        this.trackFormInteractions();
        this.trackPageVisibility();
    }

    /**
     * Tracks user scroll depth as percentage milestones.
     */
    trackScrollBehavior() {
        window.addEventListener('scroll', Utils.throttle(() => {
            // Calculate scroll percentage only if the document is scrollable
            const docHeight = document.body.scrollHeight - window.innerHeight;
            if (docHeight <= 0) return; // No scrollbar

            const scrollPercent = Math.round((window.scrollY / docHeight) * 100);

            if (scrollPercent > this.lastScrollPercent) {
                this.lastScrollPercent = scrollPercent;

                // Track at specific milestones
                const milestones = [25, 50, 75, 90, 100]; // Added 100% for full scroll
                if (milestones.includes(scrollPercent) || (scrollPercent >= 99 && this.lastScrollPercent < 99)) { // Ensure 100% is caught
                    const scrollData = {
                        scroll_percent: scrollPercent,
                        scroll_depth: window.scrollY,
                        page_height: document.body.scrollHeight,
                        viewport_height: window.innerHeight,
                        timestamp: Date.now()
                    };

                    TrackerClient.track('scroll_milestone', scrollData);
                    SessionManager.saveScrollMilestone(scrollData);
                }
            }
        }, 1000)); // Throttle to once per second
    }

    /**
     * Tracks time spent on the page at defined intervals.
     */
    trackTimeOnPage() {
        setInterval(() => {
            this.timeOnPage += 10; // Increment by 10 seconds

            // Track at specific time milestones (in seconds)
            const timeMilestones = [30, 60, 120, 300, 600];
            if (timeMilestones.includes(this.timeOnPage)) {
                TrackerClient.track('time_milestone', {
                    seconds_on_page: this.timeOnPage,
                    minutes_on_page: Math.round(this.timeOnPage / 60),
                    is_active: document.hasFocus(), // Is the browser tab active?
                    timestamp: Date.now()
                });
            }
        }, 10000); // Check every 10 seconds
    }

    /**
     * Tracks exit intent when the mouse leaves the top of the viewport.
     */
    trackExitIntent() {
        document.addEventListener('mouseleave', (e) => {
            if (e.clientY <= 0 && !this.exitTracked) {
                this.exitTracked = true; // Track only once per session
                TrackerClient.track('exit_intent', {
                    time_on_page: Date.now() - this.startTime,
                    scroll_percent: this.lastScrollPercent,
                    page_url: window.location.href,
                    referrer: document.referrer,
                    timestamp: Date.now()
                });
            }
        });
    }

    /**
     * Tracks user clicks on various elements, identifying specific types of links/buttons.
     */
    trackClickBehavior() {
        document.addEventListener('click', Utils.throttle((e) => {
            const element = e.target;
            let clickType = 'generic_click'; // Default click type

            // Determine more specific click types
            if (element.matches('a[href*="/products/"]')) {
                clickType = 'product_link';
            } else if (element.matches('button[name="add"], input[name="add"], [data-add-to-cart]')) {
                clickType = 'add_to_cart_button';
            } else if (element.matches('a[href*="/cart"], button[data-cart], .cart-icon, .cart-link')) {
                clickType = 'cart_link';
            } else if (element.matches('a[href*="/checkout"], button[data-checkout], .checkout-button')) {
                clickType = 'checkout_link';
            } else if (element.matches('button[type="submit"], input[type="submit"]')) {
                clickType = 'submit_button';
            } else if (element.matches('a[href^="#"], [data-toggle]')) {
                clickType = 'internal_anchor_or_toggle';
            }

            const clickData = {
                click_type: clickType,
                element_tag: element.tagName,
                element_class: element.className,
                element_id: element.id,
                element_text: element.textContent?.substring(0, 100).trim(), // Trim long text
                href: element.href || null, // Only for links
                position_x: e.clientX,
                position_y: e.clientY,
                timestamp: Date.now()
            };

            TrackerClient.track('click_event', clickData);
            SessionManager.saveInteraction({ type: 'click', ...clickData });
        }, 500)); // Throttle to prevent multiple rapid clicks on the same element
    }

    /**
     * Tracks form submissions and interactions.
     */
    trackFormInteractions() {
        document.addEventListener('submit', (e) => {
            const form = e.target;
            let formType = 'generic_form_submit';

            // Identify common form types
            if (form.action && form.action.includes('/cart/add')) {
                formType = 'add_to_cart_form';
            } else if (form.action && form.action.includes('/contact')) {
                formType = 'contact_form';
            } else if (form.action && form.action.includes('/search')) {
                formType = 'search_form';
            } else if (form.querySelector('input[type="email"]')) {
                // Heuristic for newsletter forms
                formType = 'newsletter_signup_form';
            }

            TrackerClient.track('form_submit', {
                form_type: formType,
                form_action: form.action,
                form_method: form.method,
                fields_count: form.elements.length,
                timestamp: Date.now()
            });

            SessionManager.saveInteraction({ type: 'form_submit', form_type: formType });
        });
    }

    /**
     * Tracks page visibility changes (tab active/inactive).
     */
    trackPageVisibility() {
        document.addEventListener('visibilitychange', () => {
            TrackerClient.track('page_visibility_change', {
                is_visible: !document.hidden,
                time_on_page: Date.now() - this.startTime,
                timestamp: Date.now()
            });
            SessionManager.saveInteraction({
                type: 'page_visibility_change',
                is_visible: !document.hidden
            });
        });
    }
}

export default BehavioralTracker;