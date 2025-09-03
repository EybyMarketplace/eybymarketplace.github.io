# Influencer Tracker v2.1.0 for Shopify

Built: 2025-09-03T18:16:01.999Z

## 📦 Build Information

- **File**: `influencer-tracker.min.js`
- **Size**: 15.7 KB (minified)
- **Modules**: 8 included
- **Platform**: Shopify
- **AI**: Enabled

## 🚀 Installation

### CDN (Recommended)
```html
<script src="https://your-cdn.com/dist/influencer-tracker.min.js"></script>
```

### With Configuration
```html
<script 
  src="https://your-cdn.com/dist/influencer-tracker.min.js"
  data-api-endpoint="https://your-api.com/events"
  data-project-id="your-project-id"
  data-auto-init="true">
</script>
```

### Manual Configuration
```html
<script src="https://your-cdn.com/dist/influencer-tracker.min.js" data-auto-init="false"></script>
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
- **Checkout Integration**: Purchase tracking with order details
- **Theme Compatibility**: Works with any Shopify theme

## 🤖 AI Features

- **Behavioral Segmentation**: Automatic customer profiling
- **Conversion Prediction**: Real-time conversion probability
- **Journey Mapping**: Customer path analysis
- **Engagement Scoring**: Quality metrics for each visitor

## 📊 Usage Examples

### Basic Tracking
```javascript
// Custom event
InfluencerTracker.track('video_watched', {
  video_id: 'intro-video',
  duration: 120,
  completion_rate: 0.8
});
```

### Purchase Tracking
```javascript
// Manual purchase tracking (if needed)
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

### Get Analytics Data
```javascript
// Get current session info
const info = InfluencerTracker.getInfo();
console.log('User ID:', info.userId);
console.log('Session ID:', info.sessionId);
console.log('Has Attribution:', info.hasAttribution);
```

## 🎯 Influencer Attribution

The tracker automatically detects influencer attribution from:
- URL parameters: `?inf_id=123&campaign=summer`
- UTM parameters: `?utm_source=influencer&utm_medium=social`
- Referrer detection: Instagram, TikTok, YouTube, etc.

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
  debug: false                // Debug mode
});
```

## 📋 Modules Included

- `modules/config.js`
- `utils/utils.js`
- `modules/consent-manager.js`
- `modules/id-generator.js`
- `modules/influencer-detector.js`
- `modules/device-fingerprint.js`
- `modules/event-queue.js`
- `core/tracker-core.js`

## 🔧 Build Details

- **Original Size**: 38.8 KB
- **Minified Size**: 15.7 KB
- **Compression**: 59.6%
- **Build Time**: 231ms
