export const CONFIG = {
    apiEndpoint: '',
    projectId: '',
    enableConsentCheck: true,
    batchSize: 10,
    batchTimeout: 3000,
    sessionTimeout: 30 * 60 * 1000, // 30 minutos
    version: '2.1.0' // Updated version
};

export function updateConfig(options = {}) {
    Object.assign(CONFIG, options);
}