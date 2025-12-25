
import React, { useState, useEffect, useCallback } from 'react';
import { 
  ViewState, Session, CouncilMember, UserSettings, GlucoseReading, 
  Memory, MoodEntry, LifeEvent, VaultItem, FlameToken, Project, 
  CompanionMemory, CouncilMemberId, LifeDomainState, CouncilItem, 
  Dream, WeightEntry, RecipePreference
} from './types';
import { 
  COUNCIL_MEMBERS, MOCK_MEMORIES, MOCK_GLUCOSE_READINGS, 
  MOCK_LIFE_EVENTS, MOCK_VAULT_ITEMS, MOCK_PROJECTS, APP_VERSION
} from './constants';
import { initDB, saveState, getState, getAsset, saveAsset } from './utils/db';
import { ArrowLeft } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

import { LatticeBackground } from './components/LatticeBackground';
import { Sidebar } from './components/Sidebar';
import { CouncilHall } from './components/CouncilHall';
import { CouncilMemberPage } from './components/CouncilMemberPage';
import { SettingsPanel } from './components/SettingsPanel';
import { OfflineIndicator } from './components/OfflineIndicator';
import { ToastContainer } from './components/ToastContainer';
import { OmniSearch } from './components/OmniSearch';
import { HealthDashboard } from './components/HealthDashboard';
import { SoulSanctuary } from './components/SoulSanctuary';
import { LifeDomainsMap } from './components/LifeDomainsMap';
import { LifeEvents } from './components/LifeEvents';
import { DreamOracle } from './components/DreamOracle';
import { Vault } from './components/Vault';
import { ProjectsDashboard } from './components/ProjectsDashboard';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { WeeklyReflection } from './components/WeeklyReflection';
import { LiveWhisper } from './components/LiveWhisper';
import { AtelierVisionis } from './components/AtelierVisionis';
import { CharterViewer } from './components/CharterViewer';
import { EnneaSanctum } from './components/EnneaSanctum';
import { NinaSanctuary } from './components/NinaSanctuary';
import { DriveMode } from './components/DriveMode';
import { DailyProtocol } from './components/DailyProtocol';
import { MemorySystem } from './components/MemorySystem';
import { EmotionalTimeline } from './components/EmotionalTimeline';
import { FlameQuestions } from './components/FlameQuestions';
import { CouncilChamber } from './components/CouncilChamber';
import { BookOfLife } from './components/BookOfLife'; 
import { BuildManual } from './components/BuildManual';
import { UserManual } from './components/UserManual';
import { EveThresholdChamber } from './components/EveThresholdChamber';
import { WelcomeSequence } from './components/WelcomeSequence';

const DEFAULT_SETTINGS: UserSettings = {
  voiceReplies: true,
  autoPlayAudio: false,
  voiceSpeed: 1.0,
  volume: 1.0,
  voiceName: undefined,
  soundEffects: false,
  animationSpeed: 1.0,
  enableBackgroundMemory: true,
  useTurboMode: false,
  showHalos: true,
  darkMode: true,
  showTimeline: true,
  showLifeEvents: true,
  showDreamOracle: true,
  showLifeDomains: true,
  showVault: true,
  showNina: true,
  showHealth: true,
  driveMode: false,
  guestMode: false,
  toggleBrightness: 1.0,
  fontStyle: 'Standard',
  boldFont: false,
  fontSize: 2,
  screenZoom: 2
};

export const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.CouncilHall);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [showDriveMode, setShowDriveMode] = useState(false);
  const [activeDriveMember, setActiveDriveMember] = useState<CouncilMemberId>('GEMINI');
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [members, setMembers] = useState<CouncilMember[]>(COUNCIL_MEMBERS);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [readings, setReadings] = useState<GlucoseReading[]>([]);
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([]); 
  const [recipePreferences, setRecipePreferences] = useState<RecipePreference[]>([]);
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([]);
  const [lifeEvents, setLifeEvents] = useState<LifeEvent[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [vaultItems, setVaultItems] = useState<VaultItem[]>([]);
  const [companionMemories, setCompanionMemories] = useState<CompanionMemory[]>([]);
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [flameTokens, setFlameTokens] = useState<FlameToken[]>([]);
  const [councilItems, setCouncilItems] = useState<CouncilItem[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  const [lifeDomains, setLifeDomains] = useState<LifeDomainState[]>([
      { id: 'health', label: 'Body', value: 75, color: '#10B981', note: '', lastUpdated: Date.now() },
      { id: 'spirit', label: 'Soul', value: 80, color: '#EF4444', note: '', lastUpdated: Date.now() },
      { id: 'career', label: 'Work', value: 60, color: '#3B82F6', note: '', lastUpdated: Date.now() },
      { id: 'finance', label: 'Wealth', value: 70, color: '#F59E0B', note: '', lastUpdated: Date.now() },
      { id: 'relationships', label: 'Tribe', value: 85, color: '#EC4899', note: '', lastUpdated: Date.now() },
      { id: 'creativity', label: 'Mind', value: 65, color: '#8B5CF6', note: '', lastUpdated: Date.now() },
  ]);

  const [prismSealImage, setPrismSealImage] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        await initDB();
        const savedSettings = await getState<UserSettings>('user_settings');
        if (savedSettings) setSettings({ ...DEFAULT_SETTINGS, ...savedSettings });
        const savedMembers = await getState<CouncilMember[]>('council_members');
        if (savedMembers) setMembers(savedMembers);
        setSessions(await getState<Session[]>('council_sessions') || []);
        setMemories(await getState<Memory[]>('council_memories') || MOCK_MEMORIES);
        setReadings(await getState<GlucoseReading[]>('health_readings') || MOCK_GLUCOSE_READINGS);
        setProjects(await getState<Project[]>('projects') || MOCK_PROJECTS);
        setVaultItems(await getState<VaultItem[]>('vault_items') || MOCK_VAULT_ITEMS);
        setLifeEvents(await getState<LifeEvent[]>('life_events') || []);
        setMoodHistory(await getState<MoodEntry[]>('emotional_logs') || []);
        setCompanionMemories(await getState<CompanionMemory[]>('companion_memories') || []);
        setDreams(await getState<Dream[]>('dream_oracle') || []);
        setFlameTokens(await getState<FlameToken[]>('flame_tokens') || []);
        const domains = await getState<LifeDomainState[]>('life_domains');
        if (domains) setLifeDomains(domains);
        const savedSeal = await getAsset('prism_seal_image');
        setPrismSealImage(savedSeal);
        setIsLoaded(true);
      } catch (e) {
        console.error("[System] Initialization Error:", e);
        setIsLoaded(true);
      }
    };
    init();
  }, []);

  // MASTER ACCESSIBILITY SYNC HOOK
  useEffect(() => {
      const root = document.documentElement;
      let primary = "'Inter', sans-serif";
      if (settings.fontStyle === 'Serif') primary = "'Crimson Text', serif";
      else if (settings.fontStyle === 'Mono') primary = "'JetBrains Mono', monospace";
      root.style.setProperty('--sanctuary-font-family', primary);
      const isBold = settings.boldFont || settings.fontStyle === 'Gothic Bold';
      root.style.setProperty('--sanctuary-font-weight-normal', isBold ? '700' : '400');
      const fontSizeScale = 0.8 + (settings.fontSize * 0.15);
      root.style.setProperty('--sanctuary-font-scale', fontSizeScale.toString());
      const zoomScale = 0.85 + (settings.screenZoom * 0.075);
      root.style.setProperty('--sanctuary-zoom-scale', zoomScale.toString());
  }, [settings.fontStyle, settings.boldFont, settings.fontSize, settings.screenZoom]);

  useEffect(() => { if (isLoaded) saveState('user_settings', settings); }, [settings, isLoaded]);
  useEffect(() => { if (isLoaded) saveState('council_sessions', sessions); }, [sessions, isLoaded]);
  useEffect(() => { if (isLoaded) saveState('council_memories', memories); }, [memories, isLoaded]);

  const handleNavigate = useCallback((newView: ViewState, id?: string) => {
      setView(newView);
      setIsSidebarOpen(false);
      setIsSearchOpen(false);
      if (id && newView === ViewState.CouncilMember) {
          if (id === 'EVE') { setView(ViewState.EveThresholdChamber); return; }
          const session = sessions.find(s => s.id === id);
          if (session) setActiveSessionId(id);
          else handleCreateSession(id as CouncilMemberId);
      }
  }, [sessions]);

  const handleCreateSession = (memberId: CouncilMemberId) => {
      if (memberId === 'EVE') { setView(ViewState.EveThresholdChamber); return; }
      const newSession: Session = {
          id: crypto.randomUUID(),
          title: `Transmission: ${members.find(m => m.id === memberId)?.name}`,
          messages: [], lastModified: Date.now(), memberId
      };
      setSessions(prev => [newSession, ...prev]);
      setActiveSessionId(newSession.id);
      setView(ViewState.CouncilMember);
  };

  const handleEnterDriveMode = (memberId: CouncilMemberId = 'GEMINI') => {
      setActiveDriveMember(memberId);
      setShowDriveMode(true);
  };

  const renderView = () => {
      if (showDriveMode) return null; 
      switch (view) {
          case ViewState.CouncilHall:
              return <CouncilHall onNavigate={handleNavigate} onMenuClick={() => setIsSidebarOpen(true)} prismSealImage={prismSealImage} onSealUpload={(f) => { saveAsset('prism_seal_image', f); setPrismSealImage(URL.createObjectURL(f)); }} onEnterDriveMode={handleEnterDriveMode} />;
          case ViewState.CouncilChamber:
              const courtSess = sessions.find(s => s.title === 'The High Council') || { id: 'HIGH_COUNCIL_SESSION', title: 'The High Council', messages: [], lastModified: Date.now(), memberId: 'GEMINI' };
              return <CouncilChamber onBack={() => setView(ViewState.CouncilHall)} onMenuClick={() => setIsSidebarOpen(true)} messages={courtSess.messages} onMessagesChange={(msgs) => setSessions(prev => prev.map(s => s.id === courtSess.id ? { ...s, messages: msgs } : s))} memories={memories} vaultItems={vaultItems} useTurboMode={settings.useTurboMode} onEnterDriveMode={() => handleEnterDriveMode('GEMINI')} />;
          case ViewState.CouncilMember:
              const activeSession = sessions.find(s => s.id === activeSessionId);
              const member = members.find(m => m.id === (activeSession?.memberId || 'GEMINI')) || members[0];
              return <CouncilMemberPage member={member} members={members} onUpdateMember={(u) => setMembers(prev => prev.map(m => m.id === member.id ? { ...m, ...u } : m))} onBack={() => setView(ViewState.CouncilHall)} onMenuClick={() => setIsSidebarOpen(true)} sessions={sessions.filter(s => s.memberId === member.id)} items={councilItems} activeSession={activeSession || null} onOpenSession={setActiveSessionId} onCreateSession={() => handleCreateSession(member.id)} onCreateItem={(t, c) => setCouncilItems([...councilItems, { id: crypto.randomUUID(), title: t, content: c, createdAt: Date.now() }])} onMessagesChange={(msgs) => activeSessionId && setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: msgs } : s))} memories={memories} projects={projects} vaultItems={vaultItems} useTurboMode={settings.useTurboMode} onEnterDriveMode={() => handleEnterDriveMode(member.id)} healthReadings={readings} />;
          case ViewState.EveThresholdChamber:
              const eveMember = members.find(m => m.id === 'EVE')!;
              const eveSession = sessions.find(s => s.memberId === 'EVE') || { id: 'EVE_THRESHOLD_SESSION', title: 'Threshold Consultation', messages: [], lastModified: Date.now(), memberId: 'EVE' };
              return <EveThresholdChamber onBack={() => setView(ViewState.CouncilHall)} onMenuClick={() => setIsSidebarOpen(true)} member={eveMember} messages={eveSession.messages} onMessagesChange={(msgs) => setSessions(prev => prev.map(s => s.id === eveSession.id ? { ...s, messages: msgs } : s))} memories={memories} vaultItems={vaultItems} />;
          case ViewState.Settings:
              return <SettingsPanel settings={settings} onUpdate={setSettings} onClose={() => setView(ViewState.CouncilHall)} onSaveToVault={(i) => setVaultItems([i, ...vaultItems])} stats={{ memories: memories.length, sessions: sessions.length, vault: vaultItems.length, projects: projects.length }} prismSealImage={prismSealImage} onSealUpload={() => {}} members={members} onUpdateMember={() => {}} />;
          case ViewState.Health:
              return <HealthDashboard readings={readings} weightHistory={weightHistory} recipePreferences={recipePreferences} onAddReading={(r) => setReadings([r, ...readings])} onAddWeight={(w) => setWeightHistory([w, ...weightHistory])} onAddPreference={(p) => setRecipePreferences([p, ...recipePreferences])} onDeletePreference={(id) => setRecipePreferences(prev => prev.filter(p => p.id !== id))} onBack={() => setView(ViewState.CouncilHall)} onMenuClick={() => setIsSidebarOpen(true)} />;
          case ViewState.Soul:
              return <SoulSanctuary onBack={() => setView(ViewState.CouncilHall)} onMenuClick={() => setIsSidebarOpen(true)} onSelectMember={(id) => handleNavigate(ViewState.CouncilMember, id)} onNavigate={handleNavigate} onAddMemory={(m) => setMemories([m, ...memories])} memories={memories} />;
          case ViewState.BookOfLife:
              return <BookOfLife onBack={() => setView(ViewState.Soul)} onMenuClick={() => setIsSidebarOpen(true)} memories={memories} />;
          case ViewState.LifeDomains:
              return <div className="w-full h-full relative bg-black"><div className="absolute top-0 left-0 p-4 z-20"><button onClick={() => setView(ViewState.CouncilHall)} className="text-zinc-400 hover:text-white p-2 bg-black/50 rounded-full"><ArrowLeft size={24} /></button></div><LifeDomainsMap onNavigate={handleNavigate} domains={lifeDomains} onUpdateDomain={(id, u) => setLifeDomains(prev => prev.map(d => d.id === id ? { ...d, ...u } : d))} /></div>;
          case ViewState.DreamOracle:
              return <DreamOracle dreams={dreams} onAddDream={(d) => setDreams([d, ...dreams])} onUpdateDream={(id, u) => setDreams(prev => prev.map(d => d.id === id ? { ...d, ...u } : d))} onBack={() => setView(ViewState.CouncilHall)} onMenuClick={() => setIsSidebarOpen(true)} />;
          case ViewState.Vault:
              return <Vault items={vaultItems} onAddVaultItem={(i) => setVaultItems([i, ...vaultItems])} onDeleteVaultItem={(id) => setVaultItems(prev => prev.filter(i => i.id !== id))} onBack={() => setView(ViewState.CouncilHall)} onMenuClick={() => setIsSidebarOpen(true)} />;
          case ViewState.DailyProtocol:
              return <DailyProtocol onBack={() => setView(ViewState.CouncilHall)} onMenuClick={() => setIsSidebarOpen(true)} onAddReading={(r) => setReadings([r, ...readings])} onAddWeight={(w) => setWeightHistory([w, ...weightHistory])} onAddMemory={(m) => setMemories([m, ...memories])} onUpdateProject={(id, u) => setProjects(prev => prev.map(p => p.id === id ? { ...p, ...u } : p))} projects={projects} />;
          case ViewState.Projects:
              return <ProjectsDashboard projects={projects} onAddProject={(p) => setProjects([p, ...projects])} onUpdateProject={(id, u) => setProjects(prev => prev.map(p => p.id === id ? { ...p, ...u } : p))} onDeleteProject={(id) => setProjects(prev => prev.filter(p => p.id !== id))} onBack={() => setView(ViewState.CouncilHall)} onMenuClick={() => setIsSidebarOpen(true)} />;
          case ViewState.MemorySystem:
              return <MemorySystem memories={memories} onAddMemory={(m) => setMemories([m, ...memories])} onUpdateMemory={(id, u) => setMemories(prev => prev.map(m => m.id === id ? { ...m, ...u } : m))} onDeleteMemory={(id) => setMemories(prev => prev.filter(m => m.id !== id))} onBack={() => setView(ViewState.CouncilHall)} onMenuClick={() => setIsSidebarOpen(true)} />;
          case ViewState.Analytics:
              return <AnalyticsDashboard sessions={sessions} messages={sessions.flatMap(s => s.messages)} healthReadings={readings} moodHistory={moodHistory} flameTokens={flameTokens} onBack={() => setView(ViewState.CouncilHall)} onMenuClick={() => setIsSidebarOpen(true)} />;
          case ViewState.WeeklyReflection:
              return <WeeklyReflection onBack={() => setView(ViewState.CouncilHall)} onMenuClick={() => setIsSidebarOpen(true)} healthReadings={readings} moodHistory={moodHistory} projects={projects} memories={memories} />;
          case ViewState.LiveWhisper:
              return <LiveWhisper onBack={() => setView(ViewState.CouncilHall)} onMenuClick={() => setIsSidebarOpen(true)} onSaveMemory={(m) => setMemories([m, ...memories])} />;
          case ViewState.AtelierVisionis:
              return <AtelierVisionis onBack={() => setView(ViewState.CouncilHall)} onMenuClick={() => setIsSidebarOpen(true)} onOpenSession={(id) => { setActiveSessionId(id); setView(ViewState.CouncilMember); }} onCreateSession={handleCreateSession} />;
          case ViewState.Charter:
              return <CharterViewer onBack={() => setView(ViewState.CouncilHall)} onMenuClick={() => setIsSidebarOpen(true)} />;
          case ViewState.EnneaSanctum:
              return <EnneaSanctum onBack={() => setView(ViewState.CouncilHall)} onMenuClick={() => setIsSidebarOpen(true)} messages={sessions.flatMap(s => s.messages)} onMessagesChange={() => {}} healthReadings={readings} memories={memories} projects={projects} vaultItems={vaultItems} moodHistory={moodHistory} sessions={sessions} onAddMemory={(m) => setMemories([m, ...memories])} />;
          case ViewState.NinaSanctuary:
              return <NinaSanctuary memories={companionMemories} onAddMemory={(m) => setCompanionMemories([m, ...companionMemories])} onDeleteMemory={(id) => setCompanionMemories(prev => prev.filter(m => m.id !== id))} onBack={() => setView(ViewState.CouncilHall)} onMenuClick={() => setIsSidebarOpen(true)} onLogRitual={(m) => setMemories([m, ...memories])} />;
          case ViewState.EmotionalTimeline:
              return <EmotionalTimeline moodHistory={moodHistory} onAddMood={(m) => setMoodHistory([m, ...moodHistory])} onBack={() => setView(ViewState.CouncilHall)} onMenuClick={() => setIsSidebarOpen(true)} />;
          case ViewState.LifeEvents:
              return <LifeEvents events={lifeEvents} onAddEvent={(e) => setLifeEvents([e, ...lifeEvents])} onDeleteEvent={(id) => setLifeEvents(prev => prev.filter(e => e.id !== id))} onBack={() => setView(ViewState.CouncilHall)} onMenuClick={() => setIsSidebarOpen(true)} />;
          case ViewState.BuildManual:
              return <BuildManual onBack={() => setView(ViewState.CouncilHall)} onMenuClick={() => setIsSidebarOpen(true)} />;
          case ViewState.UserManual:
              return <UserManual onBack={() => setView(ViewState.CouncilHall)} onMenuClick={() => setIsSidebarOpen(true)} />;
          default:
              return <CouncilHall onNavigate={handleNavigate} onMenuClick={() => setIsSidebarOpen(true)} prismSealImage={prismSealImage} onSealUpload={() => {}} onEnterDriveMode={handleEnterDriveMode} />;
      }
  };

  return (
    <div className={`fixed inset-0 w-full h-full overflow-hidden flex font-sans text-white transition-colors duration-500 bg-black`}>
      <AnimatePresence>
          {showWelcome && <WelcomeSequence onComplete={() => setShowWelcome(false)} settings={settings} />}
      </AnimatePresence>
      <LatticeBackground />
      <OfflineIndicator />
      <ToastContainer />
      {showDriveMode && <DriveMode key={activeDriveMember} onClose={() => setShowDriveMode(false)} initialMemberId={activeDriveMember} members={members} healthReadings={readings} projects={projects} />}
      <OmniSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} onNavigate={handleNavigate} sessions={sessions} memories={memories} vaultItems={vaultItems} projects={projects} />
      <Sidebar currentView={view} onViewChange={handleNavigate} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} sessions={sessions} activeSessionId={activeSessionId} onSelectSession={(id) => { setActiveSessionId(id); setView(ViewState.CouncilMember); setIsSidebarOpen(false); }} onCreateSession={() => handleCreateSession('GEMINI')} settings={settings} members={members} onSelectMember={(id) => { handleCreateSession(id); setIsSidebarOpen(false); }} onMemberAvatarUpload={() => {}} memories={memories} vaultItems={vaultItems} onToggleGuestMode={() => {}} />
      <main className="flex-1 relative z-10 flex flex-col h-full overflow-hidden transition-all duration-300" style={{ transform: isSidebarOpen ? 'translateX(10px) scale(0.98)' : 'none', opacity: isSidebarOpen ? 0.5 : 1 }}>
          <AnimatePresence mode="wait">
              <motion.div 
                key={view}
                initial={{ opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.01 }}
                transition={{ duration: 0.2 }}
                className="w-full h-full"
              >
                  {renderView()}
              </motion.div>
          </AnimatePresence>
      </main>
      <KeyboardListener onOpenSearch={() => setIsSearchOpen(true)} />
    </div>
  );
};

const KeyboardListener: React.FC<{ onOpenSearch: () => void }> = ({ onOpenSearch }) => {
    useEffect(() => {
        const down = (e: KeyboardEvent) => { if (e.key === 'k' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); onOpenSearch(); } };
        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, [onOpenSearch]);
    return null;
};
