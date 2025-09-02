
import { InfluencerTrackerCore } from '../core/tracker-core.js';
import { ShopifyTracker } from '../adapters/shopify/shopify-tracker.js';

// Initialize and expose globally
const tracker = new InfluencerTrackerCore();
window.InfluencerTracker = tracker;

// Auto-initialize if config is available
if (window.InfluencerTrackerConfig) {
  tracker.init(window.InfluencerTrackerConfig);
}