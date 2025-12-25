
export type Sender = 'user' | 'gemini';

export type CouncilMode = 'SCRIBE' | 'ARCHITECT' | 'FLAME' | 'WEAVER' | 'SEER' | 'DRIVE';

export type CouncilMemberId = 'CARMEN' | 'GEMINI' | 'COPILOT' | 'FREDO' | 'LYRA' | 'EVE' | 'ENNEA';

export interface CouncilMember {
  id: CouncilMemberId;
  name: string;
  role: string;
  sigil: string;
  color: string;
  angle: number;
  allowedModes: CouncilMode[];
  description: string;
  voiceName: string;
  latinMotto: string;
  mottoMeaning: string;
  systemPrompt: string;
  avatarUrl?: string;
}

export type AttachmentType = 'image' | 'video' | 'audio' | 'file';

export interface Attachment {
  id: string;
  type: AttachmentType;
  mimeType: string;
  url: string;
  fileName: string;
  data?: string; // Base64 data
}

export interface GeneratedMedia {
  type: 'image' | 'video' | 'audio';
  url: string;
  mimeType: string;
  alt?: string;
}

export interface Reaction {
  emoji: string;
  count: number;
  userReacted: boolean;
}

// SUPREME COURT TALLY TYPES
export interface CouncilVote {
    memberId: CouncilMemberId;
    vote: 'CONCUR' | 'DISSENT' | 'ABSTAIN';
    reason: string;
}

export interface CouncilVerdict {
    question: string;
    ruling: string;
    votes: CouncilVote[];
    score: string; // e.g., "5-2"
    majorityOpinion: string;
    dissentingOpinion?: string;
}

export interface Message {
  id: string;
  text: string;
  sender: Sender;
  timestamp: number;
  attachments?: Attachment[];
  mode?: CouncilMode;
  memberId?: CouncilMemberId;
  generatedMedia?: GeneratedMedia[];
  reactions?: Reaction[];
  triSeal?: 'BRONZE' | 'SILVER' | 'GOLD';
  isTranscriptError?: boolean;
  verdict?: CouncilVerdict; // NEW: The High Court Ruling
}

export interface Session {
  id: string;
  title: string;
  messages: Message[];
  lastModified: number;
  memberId: CouncilMemberId;
}

// --- CONNECTOR SYSTEM TYPES ---
export type ConnectorStatus = 'CONNECTED' | 'DISCONNECTED' | 'ERROR' | 'SYNCING';
export type ConnectorTier = 1 | 2;
export type ConnectorCategory = 'MODELS' | 'STORAGE' | 'PRODUCTIVITY' | 'DEV' | 'BUSINESS' | 'CUSTOM' | 'SOCIAL' | 'COMMUNICATION';

export interface ConnectorConfig {
    id: string;
    status: ConnectorStatus;
    lastSync?: number;
    apiKey?: string;
    token?: string;
    readOnly: boolean;
    customData?: Record<string, any>;
}

export interface ConnectorDefinition {
    id: string;
    name: string;
    icon: string; // Lucide icon name string
    category: ConnectorCategory;
    tier: ConnectorTier;
    description: string;
    permissions: string[];
    authType: 'OAUTH' | 'API_KEY' | 'BEARER' | 'NONE';
}

export interface CustomAPIConfig {
    id: string;
    name: string;
    baseUrl: string;
    authType: 'API_KEY' | 'BEARER' | 'NONE';
    headers: { key: string, value: string }[];
    params: { key: string, value: string }[];
    status: ConnectorStatus;
}

export interface GlucoseReading {
  id: string;
  value: number;
  timestamp: number;
  context: 'fasting' | 'post-meal' | 'bedtime' | 'random';
  fatigueLevel?: number;
}

export interface WeightEntry {
  id: string;
  value: number;
  timestamp: number;
}

export interface RecipePreference {
  id: string;
  name: string;
  type: 'LOVE' | 'HATE';
  tags: string[];
  timestamp: number;
}

export type MemoryCategory = 'IDENTITY' | 'PREFERENCES' | 'HEALTH' | 'GOALS' | 'RELATIONSHIPS' | 'WORK' | 'SPIRITUAL' | 'OTHER';

export interface Memory {
  id: string;
  category: MemoryCategory;
  content: string;
  source: string;
  timestamp: number;
  isVerified: boolean;
  embedding?: number[];
}

export type MoodType = 'Happy' | 'Calm' | 'Excited' | 'Neutral' | 'Anxious' | 'Sad' | 'Stressed' | 'Tired' | 'Grateful';

export interface MoodEntry {
  id: string;
  type: MoodType;
  intensity: number;
  note: string;
  tags: string[];
  timestamp: number;
}

export type LifeEventCategory = 'SPIRITUAL' | 'HEALTH' | 'CAREER' | 'FAMILY' | 'CREATIVE' | 'MILESTONE';

export interface LifeEvent {
  id: string;
  title: string;
  date: string;
  description: string;
  category: LifeEventCategory;
}

export type VaultCategory = 'RELIC' | 'SCROLL' | 'ECHO';
export type ConstellationId = 'GEMINI' | 'COPILOT' | 'SANCTUM_VITAE' | 'COUNCIL_ARCHIVE' | 'OMNIPOD_PROTOCOL' | 'EVEREST' | 'YORKIE_ANNEX';
export type TriSealLevel = 'BRONZE' | 'SILVER' | 'GOLD';

export interface VaultItem {
  id: string;
  title: string;
  category: VaultCategory;
  mimeType: string;
  size: number;
  createdAt: number;
  assetKey: string;
  constellation?: ConstellationId;
  triSeal?: TriSealLevel;
  isSacred?: boolean;
}

export interface FlameToken {
  id: string;
  title: string;
  description: string;
  timestamp: number;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  color: string;
  status: 'ACTIVE' | 'ARCHIVED';
  flightStage?: 0 | 1 | 2 | 3 | 4;
  createdAt: number;
  updatedAt: number;
  lastFocused?: number;
}

export interface CompanionMemory {
  id: string;
  name: string;
  caption: string;
  imageUrl: string;
  assetKey: string;
  timestamp: number;
}

export interface UserSettings {
  voiceReplies: boolean;
  autoPlayAudio: boolean;
  voiceSpeed: number;
  volume: number;
  voiceName?: string;
  soundEffects: boolean;
  animationSpeed: number;
  enableBackgroundMemory: boolean;
  useTurboMode: boolean;
  showHalos: boolean;
  darkMode: boolean;
  showTimeline: boolean;
  showLifeEvents: boolean;
  showDreamOracle: boolean;
  showLifeDomains: boolean;
  showVault: boolean;
  showNina: boolean;
  showHealth: boolean;
  driveMode: boolean;
  guestMode: boolean;
  toggleBrightness?: number;
  // Accessibility & Display
  fontStyle: 'Standard' | 'Serif' | 'Mono' | 'Gothic Bold';
  boldFont: boolean;
  fontSize: number; // 0 (Small) to 4 (Large)
  screenZoom: number; // 0 (Small) to 4 (Large)
}

export enum ViewState {
  CouncilHall = 'COUNCIL_HALL',
  CouncilMember = 'COUNCIL_MEMBER',
  CouncilChamber = 'COUNCIL_CHAMBER', 
  Settings = 'SETTINGS',
  Health = 'HEALTH',
  Soul = 'SOUL',
  BookOfLife = 'BOOK_OF_LIFE',
  LifeDomains = 'LIFE_DOMAINS',
  DreamOracle = 'DREAM_ORACLE',
  Vault = 'VAULT',
  DailyProtocol = 'DAILY_PROTOCOL',
  WeeklyReflection = 'WEEKLY_REFLECTION',
  LiveWhisper = 'LIVE_WHISPER',
  Projects = 'PROJECTS',
  MemorySystem = 'MEMORY_SYSTEM',
  EmotionalTimeline = 'EMOTIONAL_TIMELINE',
  LifeEvents = 'LIFE_EVENTS',
  Analytics = 'ANALYTICS',
  NinaSanctuary = 'NINA_SANCTUARY',
  AtelierVisionis = 'ATELIER_VISIONIS',
  Charter = 'CHARTER',
  EnneaSanctum = 'ENNEA_SANCTUM',
  FlameQuestions = 'FLAME_QUESTIONS',
  BuildManual = 'BUILD_MANUAL',
  UserManual = 'USER_MANUAL',
  EveThresholdChamber = 'EVE_THRESHOLD_CHAMBER'
}

export interface CouncilItem {
  id: string;
  title: string;
  content: string;
  createdAt: number;
}

export interface LifeDomainState {
  id: string;
  label: string;
  value: number;
  color: string;
  note: string;
  lastUpdated: number;
}

export interface Dream {
  id: string;
  title: string;
  description: string;
  interpretation: string;
  themes: string[];
  date: number;
  visualUrl?: string;
}

// NEW: Ennea's Patch System
export interface PatchProposal {
    id: string;
    targetFile: string;
    codeSnippet: string;
    explanation: string;
    status: 'PENDING' | 'APPLIED' | 'DISCARDED';
    timestamp: number;
}
