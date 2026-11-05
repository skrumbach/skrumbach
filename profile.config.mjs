// Everything on the profile that is not fetched lives here. Edit, then run `npm run sample` to preview.
export default {
  login: 'skrumbach',
  hero: {
    eyebrow: 'OT/IT DEVELOPER • CONTROLS ENGINEER • SELF-HOSTER',
    tags: ['PLC • ROBOTS • VISION', 'OPC UA • .NET • HOMELAB'],
    first: 'SASCHA',
    last: 'KRUMBACH',
    tagline: 'Bridging OT and IT by day, running a self-hosted homelab by night.',
    currently: 'CURRENTLY: EXTENDING OPC UA & .NET SKILLS',
  },
  about: [
    'I am a curious developer trying to bridge the OT/IT world. I love plc programming, robots, vision sensors, and dotnet.',
    'I am currently extending my skills around OPC/UA and dotnet. I have a few projects I am working on. One is to collect images from various vision systems and store them in a central system.',
  ],
  location: 'South Carolina, USA',

  // Featured repos, in order. `description` overrides the GitHub description (home-ops has none).
  featured: [
    { name: 'home-ops', description: 'GitOps for a 3-node Talos Linux Kubernetes cluster, continuously reconciled by Flux v2.' },
    { name: 'mortyops' },
  ],

  // Newest first. Roles at the same company are grouped automatically.
  experience: [
    { date: 'May 2024 — Present', title: 'Controls Engineer Specialist', company: 'BMW Manufacturing Co., LLC', location: 'United States' },
    { date: 'May 2023 — May 2024', title: 'Controls Engineer', company: 'Linamar Corporation', location: 'Mills River, North Carolina' },
    { date: 'Mar 2021 — Mar 2023', title: 'Service Technician', company: 'HAHN Automation', location: 'Rheinböllen, Germany' },
    { date: 'Dec 2019 — Feb 2021', title: 'Manufacturing Engineer', company: 'Continental', location: 'Arden, North Carolina' },
    { date: 'Feb 2012 — Dec 2019', title: 'Engineering Technician', company: 'Continental', location: 'Arden, North Carolina' },
    { date: 'Aug 2002 — May 2012', title: 'Mechatronic Technician', company: 'Continental', location: 'Rheinböllen, Germany' },
  ],
  logos: [
    { match: 'BMW', file: 'bmw.svg' },
    { match: 'Linamar', file: 'linamar.svg' },
    { match: 'HAHN', file: 'hahn-automation.svg' },
    { match: 'Continental', file: 'continental.svg' },
  ],

  connect: { tagline: 'CODE. EXPERIMENT. AUTOMATE. SELF-HOST. REPEAT.' },

  homelab: {
    context: 'home-ops',
    terminalTitle: 'sascha@home-ops: ~ — k9s',
    repoLink: 'github.com/skrumbach/home-ops',
    // Data older than this is shown as "last seen" instead of live.
    staleAfterHours: 24,
    // kromgo metric ids (GET <KROMGO_URL>/badges/<id>?format=json). Keys are what the renderer uses.
    metrics: {
      talos: 'talos_version',
      kubernetes: 'kubernetes_version',
      flux: 'flux_version',
      nodes: 'cluster_node_count',
      nodesReady: 'cluster_node_ready_count',
      pods: 'cluster_pod_count',
      cpu: 'cluster_cpu_usage',
      mem: 'cluster_memory_usage',
      age: 'cluster_age_days',
      uptime: 'cluster_uptime_days',
      alerts: 'cluster_alert_count',
      tokens7d: 'ai_tokens_7d',
      requests7d: 'ai_requests_7d',
      localShare: 'ai_local_share_7d',
      cacheHit: 'ai_cache_hit_rate_7d',
      vramUsed: 'gpu_vram_used_gib',
      vramTotal: 'gpu_vram_total_gib',
      gpuTemp: 'gpu_temp_celsius',
      gpuPower: 'gpu_power_watts',
      fan: 'gpu_fan_rpm',
      decode: 'llm_decode_tps_24h',
      model: 'llm_model',
      slotsBusy: 'llm_requests_processing',
    },
    // Version strings and the model name are labels, everything else is numeric.
    textMetrics: ['talos', 'kubernetes', 'flux', 'model'],
  },

  ai: { caption: 'LiteLLM · local llama.cpp on the B70 first, Claude as fallback · last 7 days' },

  gpu: {
    name: 'INTEL ARC PRO B70',
    sub: '32 GB · talos-3',
    engine: 'llama.cpp · SYCL',
    vramNote: 'weights + KV cache',
    // Detail chips are only shown while this exact model is the one loaded.
    models: {
      'Qwen3.8-35B-A3B-Distill': { chips: ['Q3_K_M', '262K CTX', 'MoE · 3B ACTIVE'], vramNote: 'weights + 262K KV cache' },
    },
  },
};
