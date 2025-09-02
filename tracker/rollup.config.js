// rollup.config.js
import { terser } from '@rollup/plugin-terser';

const createConfig = (input, output, name) => ({
  input,
  output: {
    file: output,
    format: 'iife',
    name: 'InfluencerTracker',
    banner: `/* Influencer Tracker ${name} v2.1.0 | Built: ${new Date().toISOString()} */`
  },
  plugins: [
    terser({
      compress: {
        drop_console: false,
        drop_debugger: true
      },
      mangle: {
        reserved: ['InfluencerTracker', 'shopifyAdapter', 'AIDataCollector']
      }
    })
  ]
});

export default [
  createConfig('src/builds/shopify.js', 'dist/tracker-shopify.min.js', 'Shopify'),
  createConfig('src/builds/shopify-lite.js', 'dist/tracker-shopify-lite.min.js', 'Shopify Lite'),
  createConfig('src/builds/generic.js', 'dist/tracker-generic.min.js', 'Generic'),
  createConfig('src/builds/ai-only.js', 'dist/tracker-ai-addon.min.js', 'AI Addon'),
];