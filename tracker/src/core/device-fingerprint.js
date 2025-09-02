export class DeviceFingerprint {
    static generate() {
        const screen = window.screen;
        const nav = navigator;
        
        return {
            user_agent: nav.userAgent,
            language: nav.language,
            platform: nav.platform,
            screen_resolution: `${screen.width}x${screen.height}`,
            color_depth: screen.colorDepth,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            device_memory: nav.deviceMemory || null,
            hardware_concurrency: nav.hardwareConcurrency || null,
            connection: nav.connection ? {
                effective_type: nav.connection.effectiveType,
                downlink: nav.connection.downlink
            } : null
        };
    }
}