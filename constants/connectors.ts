
import { ConnectorDefinition } from '../types';

export const CONNECTOR_REGISTRY: ConnectorDefinition[] = [
    // TIER 1 - CORE
    {
        id: 'google-drive',
        name: 'Google Drive',
        icon: 'HardDrive',
        category: 'STORAGE',
        tier: 1,
        description: 'Sync Vault relics and scrolls to the cloud.',
        permissions: ['Read Files', 'Write Files', 'Manage Folder'],
        authType: 'OAUTH'
    },
    {
        id: 'google-cloud',
        name: 'GCP (Vertex/Storage)',
        icon: 'Cloud',
        category: 'DEV',
        tier: 1,
        description: 'Advanced AI models and massive storage bridge.',
        permissions: ['Vertex AI Access', 'Cloud Storage Admin'],
        authType: 'API_KEY'
    },
    {
        id: 'gmail',
        name: 'Gmail',
        icon: 'Mail',
        category: 'COMMUNICATION',
        tier: 1,
        description: 'Search and summarize sanctuary communications.',
        permissions: ['Read Messages', 'Send Drafts'],
        authType: 'OAUTH'
    },
    {
        id: 'google-calendar',
        name: 'Google Calendar',
        icon: 'Calendar',
        category: 'PRODUCTIVITY',
        tier: 1,
        description: 'Sync life events and mission deadlines.',
        permissions: ['Read Calendar', 'Write Events'],
        authType: 'OAUTH'
    },
    {
        id: 'github',
        name: 'GitHub',
        icon: 'Github',
        category: 'DEV',
        tier: 1,
        description: 'Monitor code evolution and sanctuary patches.',
        permissions: ['Read Repos', 'Read Commits', 'Read Issues'],
        authType: 'OAUTH'
    },
    {
        id: 'gemini-api',
        name: 'Google Gemini',
        icon: 'Sparkles',
        category: 'MODELS',
        tier: 1,
        description: 'Primary model provider for Council intelligence.',
        permissions: ['Content Generation', 'Model Analysis'],
        authType: 'API_KEY'
    },
    {
        id: 'openai-api',
        name: 'OpenAI',
        icon: 'Zap',
        category: 'MODELS',
        tier: 1,
        description: 'Secondary model provider for diverse reasoning.',
        permissions: ['GPT-4o Access', 'Embeddings'],
        authType: 'API_KEY'
    },
    {
        id: 'minimax-api',
        name: 'Minimax',
        icon: 'Mic',
        category: 'MODELS',
        tier: 1,
        description: 'High-fidelity audio and voice synthesis.',
        permissions: ['Audio Generation'],
        authType: 'API_KEY'
    },

    // TIER 2 - EXPANSION
    { id: 'outlook-mail', name: 'Outlook Mail', icon: 'Mail', category: 'COMMUNICATION', tier: 2, description: 'Microsoft communication bridge.', permissions: ['Read Mail'], authType: 'OAUTH' },
    { id: 'notion', name: 'Notion', icon: 'Book', category: 'PRODUCTIVITY', tier: 2, description: 'External database for sanctuary knowledge.', permissions: ['Read Pages', 'Write Pages'], authType: 'OAUTH' },
    { id: 'zapier', name: 'Zapier', icon: 'Zap', category: 'PRODUCTIVITY', tier: 2, description: 'Connect sanctuary to 5000+ apps.', permissions: ['Execute Hooks'], authType: 'API_KEY' },
    { id: 'asana', name: 'Asana', icon: 'ClipboardList', category: 'PRODUCTIVITY', tier: 2, description: 'Enterprise project management.', permissions: ['Read Tasks'], authType: 'OAUTH' },
    { id: 'supabase', name: 'Supabase', icon: 'Database', category: 'DEV', tier: 2, description: 'External postgres and auth bridge.', permissions: ['DB Admin'], authType: 'API_KEY' },
    { id: 'vercel', name: 'Vercel', icon: 'Triangle', category: 'DEV', tier: 2, description: 'Deployment and edge signal monitoring.', permissions: ['Read Projects'], authType: 'OAUTH' },
    { id: 'stripe', name: 'Stripe', icon: 'CreditCard', category: 'BUSINESS', tier: 2, description: 'Financial flow monitoring.', permissions: ['Read Transactions'], authType: 'API_KEY' },
    { id: 'airtable', name: 'Airtable', icon: 'Grid', category: 'PRODUCTIVITY', tier: 2, description: 'Structured data management.', permissions: ['Read Bases'], authType: 'API_KEY' },
    { id: 'cloudflare', name: 'Cloudflare', icon: 'Shield', category: 'DEV', tier: 2, description: 'Network security and edge sync.', permissions: ['DNS Access'], authType: 'API_KEY' },
    { id: 'canva', name: 'Canva', icon: 'Palette', category: 'PRODUCTIVITY', tier: 2, description: 'Visual asset design sync.', permissions: ['Read Design'], authType: 'OAUTH' },
    { id: 'zoom', name: 'Zoom', icon: 'Video', category: 'COMMUNICATION', tier: 2, description: 'Record and transcribe meetings.', permissions: ['Read Meetings'], authType: 'OAUTH' },
    { id: 'nvdia', name: 'NVIDIA', icon: 'Cpu', category: 'MODELS', tier: 2, description: 'GPU-accelerated model endpoints.', permissions: ['NIM Access'], authType: 'API_KEY' },
    { id: 'hume', name: 'Hume', icon: 'Smile', category: 'MODELS', tier: 2, description: 'Empathic AI for emotional telemetry.', permissions: ['Expression Analysis'], authType: 'API_KEY' },
];
