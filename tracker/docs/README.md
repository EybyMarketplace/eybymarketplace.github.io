# Influencer Tracker v2.1.0 for Shopify

Built: 2025-09-03T20:29:32.858Z

## 📦 Complete Bundle

- **File**: `influencer-tracker-shopify.min.js`
- **Size**: 19.6 KB (minified)
- **Modules**: 9 included
- **Description**: Complete Shopify tracker with all features

## 🚀 Installation

### CDN (Recommended)
```html
<script src="https://your-cdn.com/dist/influencer-tracker-shopify.min.js"></script>
```

### With Configuration
```html
<script 
  src="https://your-cdn.com/dist/influencer-tracker-shopify.min.js"
  data-api-endpoint="https://your-api.com/events"
  data-project-id="your-project-id"
  data-auto-init="true">
</script>
```

### Manual Configuration
```html
<script src="https://your-cdn.com/dist/influencer-tracker-shopify.min.js" data-auto-init="false"></script>
<script>
  InfluencerTracker.init({
    apiEndpoint: 'https://your-api.com/events',
    projectId: 'your-project-id',
    enableConsentCheck: true,
    debug: false
  });
</script>
```

## 🛍️ Shopify Features

- **Native Integration**: Automatic Shopify detection and hooks
- **Product Tracking**: Automatic product view and cart events
- **Advanced Cart Tracking**: Real-time cart changes with detailed item data
- **Checkout Integration**: Complete checkout step tracking and form monitoring
- **Purchase Tracking**: Automatic order completion with full details
- **Abandonment Detection**: Cart and checkout abandonment tracking
- **Theme Compatibility**: Works with any Shopify theme

## 🤖 AI Features

- **Behavioral Segmentation**: Automatic customer profiling
- **Conversion Prediction**: Real-time conversion probability scoring
- **Journey Mapping**: Complete customer path analysis
- **Engagement Scoring**: Quality metrics for each visitor
- **Scroll & Interaction Analysis**: Deep behavioral insights
- **Time-based Segmentation**: Activity pattern recognition

## 📊 Usage Examples

### Basic Tracking
```javascript
// Custom event tracking
InfluencerTracker.track('video_watched', {
  video_id: 'intro-video',
  duration: 120,
  completion_rate: 0.8
});
```

### Shopify Integration
```javascript
// Get current cart state
const shopifyState = InfluencerTracker.shopify.getState();
console.log('Cart items:', shopifyState.cartState.items);
console.log('Cart value:', shopifyState.cartState.total);

// Check if Shopify tracking is active
if (InfluencerTracker.shopify.isReady()) {
  console.log('Shopify integration is working');
}
```

### AI Analytics
```javascript
// Get customer segment
const segment = InfluencerTracker.ai.getSegment();
console.log('Customer type:', segment.type);
console.log('Engagement level:', segment.engagement);

// Get conversion prediction
const prediction = InfluencerTracker.ai.getPrediction();
console.log('Conversion probability:', prediction.probability);
console.log('Recommended actions:', prediction.recommendations);

// Get journey analysis
const journey = InfluencerTracker.ai.getJourney();
console.log('Pages visited:', journey.pages.length);
console.log('Time on site:', journey.totalTime);
```

### Purchase Tracking
```javascript
// Manual purchase tracking (usually automatic)
InfluencerTracker.trackPurchase({
  orderId: 'ORDER-123',
  totalValue: 299.90,
  currency: 'USD',
  items: [
    {
      id: 'PROD-1',
      name: 'Product Name',
      price: 299.90,
      quantity: 1,
      category: 'Electronics'
    }
  ],
  couponCode: 'SAVE10'
});
```

## 🎯 Influencer Attribution

The tracker automatically detects influencer attribution from:
- URL parameters: `?inf_id=123&campaign=summer`
- UTM parameters: `?utm_source=influencer&utm_medium=social`
- Referrer detection: Instagram, TikTok, YouTube, etc.
- Custom attribution parameters

## ⚙️ Configuration Options

```javascript
InfluencerTracker.init({
  // Required
  apiEndpoint: 'https://your-api.com/events',
  projectId: 'your-project-id',
  
  // Optional
  enableConsentCheck: true,    // GDPR/LGPD compliance
  batchSize: 10,              // Events per batch
  batchTimeout: 3000,         // Batch timeout (ms)
  sessionTimeout: 1800000,    // Session timeout (30 min)
  debug: false,               // Debug mode
  
  // Shopify specific
  shopifyTracking: true,      // Enable Shopify features
  cartPollingInterval: 20000, // Cart state check interval
  
  // AI specific
  aiAnalytics: true,          // Enable AI features
  behavioralTracking: true,   // Enable behavior analysis
  predictionEnabled: true     // Enable conversion prediction
});
```

## 📋 Complete Module List

- `modules/config.js`
- `utils/utils.js`
- `modules/consent-manager.js`
- `modules/id-generator.js`
- `modules/influencer-detector.js`
- `modules/device-fingerprint.js`
- `modules/event-queue.js`
- `core/tracker-core.js`
- `ai/ai-data-collector.js`

## 🔧 Build Details

- **Original Size**: 48.2 KB
- **Minified Size**: 19.6 KB
- **Compression**: 59.2%
- **Build Time**: 288ms

## 🏗️ Architecture

This build uses a modular architecture with the following components:

- **Core Tracker**: Base event tracking and attribution
- **Shopify Adapter**: Complete Shopify integration with modular components
- **AI Data Collector**: Machine learning and predictive analytics
- **Behavioral Modules**: User interaction and engagement tracking
- **Checkout Modules**: Advanced e-commerce conversion tracking

All modules work together seamlessly to provide comprehensive tracking and analytics for Shopify stores.
