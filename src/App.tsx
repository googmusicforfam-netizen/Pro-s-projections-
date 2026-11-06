import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Sport, Site, TabType, SportSlate, SlateMeta } from './types';
import { Header } from './components/Header';
import { SlateSelector } from './components/SlateSelector';
import { UpcomingSlatesModal } from './components/UpcomingSlatesModal';
import { ProjectionsTab } from './components/ProjectionsTab';
import { TopValueTab } from './components/TopValueTab';
import { OwnershipLeverageTab } from './components/OwnershipLeverageTab';
import { StacksTab } from './components/StacksTab';
import { NewsAlertsTab } from './components/NewsAlertsTab';
import { LineupBuilderTab } from './components/LineupBuilderTab';
import { calculateRefreshSchedule, RefreshIntervalInfo } from './utils/timeFormat';
import { getAllSlates, getUpcoming7DaySlates } from './data/slatesRepository2026';
import {
  Table2,
  TrendingUp,
  Zap,
  Layers,
  BellRing,
  Wand2,
  Lock,
  Ban,
  Clock,
  Sparkles,
  CalendarDays,
} from 'lucide-react';

export default function App() {
  const [currentSport, setCurrentSport] = useState<Sport>('nba');
  const [currentSite, setCurrentSite] = useState<Site>('draftkings');
  const [activeTab, setActiveTab] = useState<TabType>('projections');

  // Slates state for the active sport and site
  const [slates, setSlates] = useState<SportSlate[]>([]);
  const [selectedSlateId, setSelectedSlateId] = useState<string>('');
  const [upcoming7DaysList, setUpcoming7DaysList] = useState<SlateMeta[]>([]);
  const [isUpcomingModalOpen, setIsUpcomingModalOpen] = useState<boolean>(false);

  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [recentChanges, setRecentChanges] = useState<string[]>([]);
  const [newSlateAlert, setNewSlateAlert] = useState<string | null>(null);

  // Locks and Excludes shared state across all tabs
  const [lockedPlayerIds, setLockedPlayerIds] = useState<string[]>([]);
  const [excludedPlayerIds, setExcludedPlayerIds] = useState<string[]>([]);

  // Refresh schedule state
  const [secondsUntilNextRefresh, setSecondsUntilNextRefresh] = useState<number>(300);
  const [refreshInfo, setRefreshInfo] = useState<RefreshIntervalInfo>({
    seconds: 300,
    label: '5m refresh',
    isLockedSlate: false,
    isPastAllGames: false,
    minutesToStart: 120,
  });

  // Load all slates for current sport and site
  const loadSlatesForSportAndSite = useCallback(
    async (sport: Sport, site: Site, preferredSlateId?: string) => {
      setIsRefreshing(true);
      try {
        const res = await fetch(`/api/slates?sport=${sport}&site=${site}`);
        if (!res.ok) throw new Error('Failed to fetch slates');
        const data: SportSlate[] = await res.json();
        setSlates(data);

        // Pick active slate:
        // If preferredSlateId is in data, pick it.
        // Otherwise, pick first non-locked slate. If all locked, pick first.
        const nonLocked = data.filter((s) => s.status !== 'Locked');
        const defaultSlate =
          data.find((s) => s.id === preferredSlateId) ||
          nonLocked[0] ||
          data[0];

        if (defaultSlate) {
          setSelectedSlateId(defaultSlate.id);
          const schedule = calculateRefreshSchedule(defaultSlate.firstGameTime, defaultSlate.lastGameTime);
          setRefreshInfo(schedule);
          if (schedule.seconds > 0) {
            setSecondsUntilNextRefresh(schedule.seconds);
          }
        }
      } catch (err) {
        console.warn('Backend fetch failed, using local 2026 slates repo:', err);
        const fallback = getAllSlates(sport, site);
        setSlates(fallback);
        const nonLocked = fallback.filter((s) => s.status !== 'Locked');
        const defaultSlate =
          fallback.find((s) => s.id === preferredSlateId) ||
          nonLocked[0] ||
          fallback[0];

        if (defaultSlate) {
          setSelectedSlateId(defaultSlate.id);
          const schedule = calculateRefreshSchedule(defaultSlate.firstGameTime, defaultSlate.lastGameTime);
          setRefreshInfo(schedule);
          if (schedule.seconds > 0) {
            setSecondsUntilNextRefresh(schedule.seconds);
          }
        }
      } finally {
        setIsRefreshing(false);
      }
    },
    []
  );

  // Fetch 7-day upcoming slates index
  const loadUpcoming7Days = useCallback(async () => {
    try {
      const res = await fetch('/api/upcoming-7days');
      if (res.ok) {
        const list = await res.json();
        setUpcoming7DaysList(list);
      } else {
        setUpcoming7DaysList(getUpcoming7DaySlates());
      }
    } catch {
      setUpcoming7DaysList(getUpcoming7DaySlates());
    }
  }, []);

  // Trigger live search sync across DraftKings & FanDuel lobbies
  const triggerFreshSync = useCallback(
    async (sport: Sport, site: Site, slateId: string) => {
      setIsRefreshing(true);
      try {
        const res = await fetch('/api/refresh-slates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sport, site, slateId }),
        });

        if (!res.ok) throw new Error('Refresh request failed');
        const data = await res.json();
        if (data.slates && data.slates.length > 0) {
          setSlates(data.slates);
        }
        if (data.changes && data.changes.length > 0) {
          setRecentChanges(data.changes);
        }
        if (data.newSlateAlert) {
          setNewSlateAlert(data.newSlateAlert);
          setTimeout(() => setNewSlateAlert(null), 8000);
        }

        // Reset countdown for active slate
        const active = (data.slates || slates).find((s: SportSlate) => s.id === slateId);
        if (active) {
          const schedule = calculateRefreshSchedule(active.firstGameTime, active.lastGameTime);
          setRefreshInfo(schedule);
          if (schedule.seconds > 0) {
            setSecondsUntilNextRefresh(schedule.seconds);
          }
        }
      } catch (err) {
        console.warn('Live refresh error, preserving cached slates:', err);
      } finally {
        setIsRefreshing(false);
      }
    },
    [slates]
  );

  // Initial load
  useEffect(() => {
    loadSlatesForSportAndSite(currentSport, currentSite);
    loadUpcoming7Days();
  }, [currentSport, currentSite, loadSlatesForSportAndSite, loadUpcoming7Days]);

  // Active Slate object derived from selectedSlateId
  const currentSlate = useMemo(() => {
    return slates.find((s) => s.id === selectedSlateId) || slates[0] || null;
  }, [slates, selectedSlateId]);

  // When active slate changes, reset countdown based on that slate's game times
  useEffect(() => {
    if (currentSlate) {
      const schedule = calculateRefreshSchedule(currentSlate.firstGameTime, currentSlate.lastGameTime);
      setRefreshInfo(schedule);
      if (schedule.seconds > 0) {
        setSecondsUntilNextRefresh(schedule.seconds);
      }
    }
  }, [currentSlate]);

  // Check if active slate just locked, and if so, auto-default to next available upcoming slate
  useEffect(() => {
    if (!currentSlate) return;
    const now = Date.now();
    const startMs = new Date(currentSlate.firstGameTime).getTime();

    if (now >= startMs && currentSlate.status !== 'Locked') {
      // Find next upcoming non-locked slate
      const nextAvailable = slates.find(
        (s) => s.id !== currentSlate.id && new Date(s.firstGameTime).getTime() > now
      );
      if (nextAvailable) {
        setSelectedSlateId(nextAvailable.id);
      }
    }
  }, [currentSlate, slates]);

  // Auto-refresh countdown loop
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsUntilNextRefresh((prev) => {
        if (prev <= 1) {
          triggerFreshSync(currentSport, currentSite, selectedSlateId);
          return refreshInfo.seconds || 300;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentSport, currentSite, selectedSlateId, refreshInfo.seconds, triggerFreshSync]);

  // Lock & Exclude handlers
  const handleToggleLock = (id: string) => {
    setLockedPlayerIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((pId) => pId !== id);
      } else {
        setExcludedPlayerIds((ex) => ex.filter((pId) => pId !== id));
        return [...prev, id];
      }
    });
  };

  const handleToggleExclude = (id: string) => {
    setExcludedPlayerIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((pId) => pId !== id);
      } else {
        setLockedPlayerIds((lk) => lk.filter((pId) => pId !== id));
        return [...prev, id];
      }
    });
  };

  const handleLockMultiplePlayers = (playerNames: string[]) => {
    if (!currentSlate) return;
    const matchingIds = currentSlate.players
      .filter((p) => playerNames.some((name) => p.name.includes(name) || name.includes(p.name)))
      .map((p) => p.id);

    setLockedPlayerIds((prev) => Array.from(new Set([...prev, ...matchingIds])));
    setExcludedPlayerIds((ex) => ex.filter((id) => !matchingIds.includes(id)));
    setActiveTab('builder');
  };

  const handleClearLocksAndExcludes = () => {
    setLockedPlayerIds([]);
    setExcludedPlayerIds([]);
  };

  // Jump from 7-day upcoming calendar directly into a slate
  const handleJumpToUpcomingSlate = (slateId: string, sport: Sport, site: Site) => {
    setCurrentSport(sport);
    setCurrentSite(site);
    loadSlatesForSportAndSite(sport, site, slateId);
  };

  const tabs: { id: TabType; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'projections', label: 'Projections', icon: Table2 },
    { id: 'top_value', label: 'Top 20 Value', icon: TrendingUp },
    { id: 'leverage', label: 'Ownership & Leverage', icon: Zap },
    { id: 'stacks', label: 'Stacks', icon: Layers },
    { id: 'news', label: 'News & Alerts', icon: BellRing },
    { id: 'builder', label: 'Lineup Builder', icon: Wand2 },
  ];

  return (
    <div className="min-h-screen bg-[#0a0e17] text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Bar with Sport Selector & DK/FD Toggle */}
      <Header
        currentSport={currentSport}
        onSelectSport={(sport) => {
          setCurrentSport(sport);
          setLockedPlayerIds([]);
          setExcludedPlayerIds([]);
        }}
        currentSite={currentSite}
        onToggleSite={(site) => {
          setCurrentSite(site);
          setLockedPlayerIds([]);
          setExcludedPlayerIds([]);
        }}
        slate={currentSlate}
        refreshInfo={refreshInfo}
        secondsUntilNextRefresh={secondsUntilNextRefresh}
        isRefreshing={isRefreshing}
        onRefreshNow={() => triggerFreshSync(currentSport, currentSite, selectedSlateId)}
        recentChanges={recentChanges}
      />

      {/* Granular Slate Selector Bar (Under sport selector & site toggle) */}
      <SlateSelector
        slates={slates}
        selectedSlateId={selectedSlateId}
        onSelectSlate={(id) => {
          setSelectedSlateId(id);
          setLockedPlayerIds([]);
          setExcludedPlayerIds([]);
        }}
        onOpenUpcomingModal={() => setIsUpcomingModalOpen(true)}
        currentSport={currentSport}
        currentSite={currentSite}
        newSlateAlert={newSlateAlert}
      />

      {/* Main App Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-4 lg:px-6 py-4 pb-20 space-y-4">
        {/* Active Slate Banner Strip */}
        {currentSlate && (
          <div className="bg-slate-900/60 border border-slate-800/80 px-4 py-2.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-white font-display text-sm">
                Active Slate:
              </span>
              <span className="text-emerald-400 font-bold">
                {currentSlate.slateName}
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-300 font-mono">
                {currentSlate.players.length} Players Available
              </span>
              {currentSlate.isCaptainMode && (
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                  {currentSite === 'draftkings' ? 'DraftKings Showdown (CPT 1.5x $ & Pts)' : 'FanDuel Single Game (MVP 1.5x Pts)'}
                </span>
              )}
            </div>

            <div className="text-slate-400 font-mono text-[11px] shrink-0">
              Salary Cap: <strong className="text-white">${currentSlate.salaryCap.toLocaleString()}</strong> · Roster: <strong className="text-slate-200">{currentSlate.rosterSlots.join(', ')}</strong>
            </div>
          </div>
        )}

        {/* Navigation Tabs Bar */}
        <div className="bg-slate-900/90 border border-slate-800/90 p-1.5 rounded-2xl flex items-center gap-1 overflow-x-auto no-scrollbar shadow-lg sticky top-[92px] sm:top-[96px] z-20 backdrop-blur-md">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap min-h-[44px] shrink-0 ${
                  isActive
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.id === 'builder' && (lockedPlayerIds.length > 0 || excludedPlayerIds.length > 0) && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-950/40 text-emerald-950 font-black">
                    {lockedPlayerIds.length}L / {excludedPlayerIds.length}E
                  </span>
                )}
                {tab.id === 'news' && currentSlate?.highPriorityAlert && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content Display - Strictly For Selected Slate */}
        {currentSlate ? (
          <div>
            {activeTab === 'projections' && (
              <ProjectionsTab
                players={currentSlate.players}
                sport={currentSport}
                site={currentSite}
                lockedPlayerIds={lockedPlayerIds}
                excludedPlayerIds={excludedPlayerIds}
                onToggleLock={handleToggleLock}
                onToggleExclude={handleToggleExclude}
              />
            )}

            {activeTab === 'top_value' && (
              <TopValueTab
                players={currentSlate.players}
                sport={currentSport}
                site={currentSite}
                lockedPlayerIds={lockedPlayerIds}
                excludedPlayerIds={excludedPlayerIds}
                onToggleLock={handleToggleLock}
                onToggleExclude={handleToggleExclude}
              />
            )}

            {activeTab === 'leverage' && (
              <OwnershipLeverageTab
                players={currentSlate.players}
                sport={currentSport}
                site={currentSite}
                lockedPlayerIds={lockedPlayerIds}
                excludedPlayerIds={excludedPlayerIds}
                onToggleLock={handleToggleLock}
                onToggleExclude={handleToggleExclude}
              />
            )}

            {activeTab === 'stacks' && (
              <StacksTab
                stacks={currentSlate.stacks}
                sport={currentSport}
                site={currentSite}
                lockedPlayerIds={lockedPlayerIds}
                onLockMultiplePlayers={handleLockMultiplePlayers}
              />
            )}

            {activeTab === 'news' && (
              <NewsAlertsTab
                news={currentSlate.news}
                highPriorityAlert={currentSlate.highPriorityAlert}
                sport={currentSport}
              />
            )}

            {activeTab === 'builder' && (
              <LineupBuilderTab
                players={currentSlate.players}
                sport={currentSport}
                site={currentSite}
                salaryCap={currentSlate.salaryCap}
                rosterSlots={currentSlate.rosterSlots}
                lockedPlayerIds={lockedPlayerIds}
                excludedPlayerIds={excludedPlayerIds}
                onToggleLock={handleToggleLock}
                onToggleExclude={handleToggleExclude}
                onClearLocksAndExcludes={handleClearLocksAndExcludes}
              />
            )}
          </div>
        ) : (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Loading slate data from official lobby...</p>
          </div>
        )}
      </main>

      {/* 7-Day Multi-Sport Upcoming Slates Modal */}
      <UpcomingSlatesModal
        isOpen={isUpcomingModalOpen}
        onClose={() => setIsUpcomingModalOpen(false)}
        upcomingSlates={upcoming7DaysList}
        onSelectSlate={handleJumpToUpcomingSlate}
      />

      {/* Footer Strip with Sources & Grounding Notice */}
      <footer className="border-t border-slate-800/80 bg-slate-950/90 py-4 px-4 text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400 font-display">Pros Projections</span>
            <span>·</span>
            <span>DraftKings & FanDuel Lobbies Grounding</span>
          </div>

          <div className="text-[11px] text-slate-500">
            Current 2026 Season Slate Rules · Cross-Checked with FantasyLabs & Official Inactives
          </div>
        </div>
      </footer>
    </div>
  );
}
