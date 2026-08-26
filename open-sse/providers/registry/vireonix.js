export default {
  id: "vireonix",
  priority: 50,
  hasFree: true,
  alias: "vrx",
  uiAlias: "vrx",
  display: {
    name: "Vireonix",
    icon: "bolt",
    color: "#00C853",
    textIcon: "VR",
    website: "https://vireonix.ai",
    notice: {
      text: "Vireonix — free, no API key required. Uses smart routing to pick the best model per request.",
    },
  },
  category: "free",
  noAuth: true,
  featured: true,
  transport: {
    baseUrl: "https://vireonix.ai/v1/chat/completions",
    noAuth: true,
  },
  models: [
    { id: "auto", name: "Auto (Smart Router)" },
  ],
  passthroughModels: true,
};
