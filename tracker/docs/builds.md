# Influencer Tracker v2.1.0 - Builds Disponíveis

Gerado em: 2025-09-02T17:42:03.628Z

## 📦 Builds Disponíveis

### full
- **Arquivo**: `tracker-full.min.js`
- **Tamanho**: 19.4 KB (minificado)
- **Recursos**: 🤖 **Com IA**
- **Arquivos incluídos**: src/core/tracker-core.js, src/adapters/shopify-adapter.js, src/ai/ai-data-collector.js, src/utils/helpers.js


## 🚀 Como Usar

### Opção 1: Auto-loader (Recomendado)
```html
<script src="https://eybymarketplace.github.io/traffic-tracker/dist/tracker-auto.min.js"></script>
```

### Opção 2: Build Específico
```html
<!-- Shopify com IA -->
<script src="https://eybymarketplace.github.io/traffic-tracker/dist/tracker-shopify.min.js"></script>

<!-- Shopify sem IA (mais leve) -->
<script src="https://eybymarketplace.github.io/traffic-tracker/dist/tracker-shopify-lite.min.js"></script>
```

### Opção 3: Addon de IA Separado
```html
<!-- Carregar tracker básico -->
<script src="https://eybymarketplace.github.io/traffic-tracker/dist/tracker-shopify-lite.min.js"></script>
<!-- Adicionar IA depois -->
<script src="https://eybymarketplace.github.io/traffic-tracker/dist/tracker-ai-addon.min.js"></script>
```

## ⚙️ Configuração

```javascript
// Configurar antes de carregar o script
window.InfluencerTrackerConfig = {
  enableAI: true, // ou false para desabilitar IA
  apiEndpoint: 'https://sua-api.com/events',
  projectId: 'seu_projeto_id'
};
```

## 🤖 Recursos de IA

Quando habilitada, a IA fornece:
- Segmentação comportamental automática
- Predição de probabilidade de conversão
- Análise de qualidade de engajamento
- Mapeamento da jornada do cliente
- Métricas de performance de afiliados
