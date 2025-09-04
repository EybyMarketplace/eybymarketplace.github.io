#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Shopify Adapter Build Script
 * Builds a complete, minified JavaScript file for Shopify integration
 */

class ShopifyAdapterBuilder {
    constructor() {
        // Initialize config first without banner
        this.config = {
            version: '2.1.0',
            projectName: 'Influencer Tracker',
            outputDir: './dist',
            debugDir: './dist/debug'
        };

        // Now generate banner after config is set
        this.config.banner = this.generateBanner();

        this.buildOrder = [
            // Core utilities first
            'src/utils/utils.js',
            'src/modules/config.js',

            // Core modules
            'src/modules/consent-manager.js',
            'src/modules/id-generator.js',
            'src/modules/influencer-detector.js',
            'src/modules/device-fingerprint.js',
            'src/modules/event-queue.js',

            // Tracker core
            'src/core/tracker-core.js',

            // Shopify Utilities
            'src/adapters/shopify/utils/data-extractors.js',
            'src/adapters/shopify/utils/helpers.js',
            'src/adapters/shopify/utils/session-manager.js',

            // Shopify adapter core
            'src/adapters/shopify/core/state-manager.js',
            'src/adapters/shopify/core/adapter-core.js',

            // E-commerce tracking
            'src/adapters/shopify/ecommerce/cart-tracker.js',
            'src/adapters/shopify/ecommerce/product-tracker.js',
            'src/adapters/shopify/ecommerce/api-interceptor.js',

            // Behavioral tracking
            'src/adapters/shopify/behavioral/interaction-tracker.js',

            // Checkout tracking
            'src/adapters/shopify/checkout/checkout-tracker.js',
            'src/adapters/shopify/checkout/form-monitor.js',
            'src/adapters/shopify/checkout/abandonment-tracker.js',

            // AI components
            // 'src/ai/ai-data-collector.js',

            // Main entry point (MUST BE LAST)
            'src/adapters/shopify/shopify-adapter.js'
        ];

        this.processedFiles = [];
        this.errors = [];
    }

    generateBanner() {
        const date = new Date().toISOString().split('T')[0];
        return `/*!
 * ${this.config.projectName} v${this.config.version}
 * Shopify Adapter - Complete Build
 * Built: ${date}
 * 
 * This file contains all modules required for Shopify integration
 * including tracking, analytics, and AI data collection.
 */\n\n`;
    }

    log(message, type = 'info') {
        const icons = {
            info: '🔄',
            success: '✅',
            error: '❌',
            warning: '⚠️',
            debug: '🐛'
        };
        console.log(`${icons[type]} ${message}`);
    }

    ensureDirectories() {
        [this.config.outputDir, this.config.debugDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                this.log(`Created directory: ${dir}`);
            }
        });
    }

    validateFile(filePath) {
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }

        const content = fs.readFileSync(filePath, 'utf8');
        if (!content.trim()) {
            throw new Error(`File is empty: ${filePath}`);
        }

        // Basic syntax validation
        try {
            // Check for common syntax issues
            const lines = content.split('\n');
            let braceCount = 0;
            let parenCount = 0;

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                braceCount += (line.match(/{/g) || []).length;
                braceCount -= (line.match(/}/g) || []).length;
                parenCount += (line.match(/\(/g) || []).length;
                parenCount -= (line.match(/\)/g) || []).length;
            }

            if (braceCount !== 0) {
                this.log(`Warning: Unmatched braces in ${filePath} (${braceCount})`, 'warning');
            }
            if (parenCount !== 0) {
                this.log(`Warning: Unmatched parentheses in ${filePath} (${parenCount})`, 'warning');
            }

        } catch (error) {
            throw new Error(`Syntax validation failed for ${filePath}: ${error.message}`);
        }

        return content;
    }

    processFile(filePath) {
        try {
            this.log(`Processing: ${filePath}`);

            let content = this.validateFile(filePath);

            // Clean up content
            content = content.trim();

            // Ensure proper ending
            if (!content.endsWith(';') && !content.endsWith('}') && !content.endsWith(')')) {
                content += ';';
            }

            // Add file header comment
            const fileComment = `\n/* === ${filePath} === */\n`;
            content = fileComment + content;

            // Wrap modules in namespace protection (except main entry point)
            if (!filePath.includes('shopify-adapter.js')) {
                content = this.wrapInNamespace(content, filePath);
            }

            this.processedFiles.push(content);
            this.log(`✅ Processed: ${filePath}`, 'success');

            return content;

        } catch (error) {
            this.errors.push({ file: filePath, error: error.message });
            this.log(`❌ Error processing ${filePath}: ${error.message}`, 'error');
            throw error;
        }
    }

    wrapInNamespace(content, filePath) {
        // Don't wrap if already wrapped in IIFE or namespace
        if (content.includes('(function(') || content.includes('window.ShopifyAdapterModules')) {
            return content;
        }

        return `(function() {\n${content}\n})();`;
    }

    validateSyntax(code) {
        try {
            // Use Function constructor to validate syntax
            new Function(code);
            return true;
        } catch (error) {
            this.log(`Syntax validation failed: ${error.message}`, 'error');
            return false;
        }
    }

    generateDebugFile(content, filename = 'debug-build.js') {
        const debugPath = path.join(this.config.debugDir, filename);
        fs.writeFileSync(debugPath, content, 'utf8');
        this.log(`Debug file saved: ${debugPath}`, 'debug');
        return debugPath;
    }

    minifyCode(code) {
        try {
            // Simple minification - remove comments and extra whitespace
            return code
                .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
                .replace(/\/\/.*$/gm, '') // Remove line comments
                .replace(/\s+/g, ' ') // Collapse whitespace
                .replace(/;\s*}/g, ';}') // Clean up semicolons before braces
                .trim();
        } catch (error) {
            this.log(`Minification failed: ${error.message}`, 'warning');
            return code; // Return original if minification fails
        }
    }

    build() {
        try {
            this.log(`Building ${this.config.projectName} v${this.config.version} for Shopify (Complete)...`);

            // Setup
            this.ensureDirectories();
            this.processedFiles = [];
            this.errors = [];

            // Validate module structure
            this.log('Validating module structure...');
            this.buildOrder.forEach(file => {
                if (!fs.existsSync(file)) {
                    throw new Error(`Required file missing: ${file}`);
                }
            });
            this.log('✅ Validation completed', 'success');

            // Process files
            this.log('📦 Processing build...');
            this.buildOrder.forEach(file => {
                this.processFile(file);
            });

            // Combine all files
            const combinedCode = this.config.banner + this.processedFiles.join('\n\n');

            // Validate final syntax
            this.log('🔍 Validating final build...');
            if (!this.validateSyntax(combinedCode)) {
                this.generateDebugFile(combinedCode, 'debug-syntax-error.js');
                throw new Error('Final build has syntax errors');
            }

            // Generate debug version (unminified)
            const debugPath = path.join(this.config.outputDir, 'shopify-adapter-debug.js');
            fs.writeFileSync(debugPath, combinedCode, 'utf8');
            this.log(`Debug build saved: ${debugPath}`, 'success');

            // Generate production version (minified)
            this.log('📦 Minifying code...');
            const minifiedCode = this.minifyCode(combinedCode);
            const prodPath = path.join(this.config.outputDir, 'shopify-adapter.min.js');
            fs.writeFileSync(prodPath, minifiedCode, 'utf8');

            // Generate build info
            const buildInfo = {
                version: this.config.version,
                buildDate: new Date().toISOString(),
                files: this.buildOrder,
                sizes: {
                    debug: fs.statSync(debugPath).size,
                    minified: fs.statSync(prodPath).size
                }
            };

            fs.writeFileSync(
                path.join(this.config.outputDir, 'build-info.json'),
                JSON.stringify(buildInfo, null, 2)
            );

            // Success summary
            this.log('🎉 Build completed successfully!', 'success');
            this.log(`📁 Debug version: ${debugPath} (${buildInfo.sizes.debug} bytes)`);
            this.log(`📁 Production version: ${prodPath} (${buildInfo.sizes.minified} bytes)`);
            this.log(`📊 Compression ratio: ${Math.round((1 - buildInfo.sizes.minified / buildInfo.sizes.debug) * 100)}%`);

            return {
                success: true,
                debugPath,
                prodPath,
                buildInfo
            };

        } catch (error) {
            this.log(`Build failed: ${error.message}`, 'error');

            // Generate error debug file
            if (this.processedFiles.length > 0) {
                const partialBuild = this.processedFiles.join('\n\n');
                this.generateDebugFile(partialBuild, 'debug-error.js');
            }

            return {
                success: false,
                error: error.message,
                errors: this.errors
            };
        }
    }

    // Watch mode for development
    watch() {
        this.log('👀 Starting watch mode...');

        try {
            const chokidar = require('chokidar');
            const watcher = chokidar.watch(this.buildOrder, {
                ignored: /node_modules/,
                persistent: true
            });

            watcher.on('change', (filePath) => {
                this.log(`📝 File changed: ${filePath}`);
                setTimeout(() => {
                    this.build();
                }, 100); // Debounce
            });

            // Initial build
            this.build();
        } catch (error) {
            this.log('Watch mode requires chokidar. Install with: npm install chokidar', 'warning');
            this.log('Running single build instead...', 'info');
            this.build();
        }
    }
}

// CLI Interface
if (require.main === module) {
    const builder = new ShopifyAdapterBuilder();

    const args = process.argv.slice(2);

    if (args.includes('--watch') || args.includes('-w')) {
        builder.watch();
    } else {
        const result = builder.build();
        process.exit(result.success ? 0 : 1);
    }
}

module.exports = ShopifyAdapterBuilder;