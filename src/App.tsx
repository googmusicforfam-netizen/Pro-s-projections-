import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Sport, Site, TabType, SportSlate } from './types';
import { Header } from './components/Header';
import { ProjectionsTab } from './components/ProjectionsTab';
import { TopValueTab } from './components/TopValueTab';
import { OwnershipLeverageTab } from './components/OwnershipLeverageTab';
import { StacksTab } from './components/StacksTab';
import { NewsAlertsTab } from './components/NewsAlertsTab';
import { LineupBuilderTab } from './components/LineupBuilderTab';
import { calculateRefreshSchedule, RefreshIntervalInfo } from './utils/timeFormat';
import { getSlateForSportAndSite } from './data/defaultSlates2026';
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
} from 'lucide-react';

export default function App() {
  const [currentSport, setCurrentSport] = useState<Sport>('nba');
  const [currentSite, setCurrentSite] = useState<Site>('draftkings');
  const [activeTab, setActiveTab] = useState<TabType>('projections');

  const [slate, setSlate] = useState<SportSlate | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [recentChanges, setRecentChanges] = useState<string[]>([]);

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

  // Load initial slate
  const loadSlate = useCallback(
    async (sport: Sport, site: Site, isManualRefresh = false) => {
      setIsRefreshing(true);
      try {
        const res = await fetch(`/api/slate?sport=${sport}&site=${site}`);
        if (!res.ok) throw new Error('Failed to fetch from server');
        const data: SportSlate = await res.json();
        setSlate(data);

        // Update schedule
        if (data.firstGameTime && data.lastGameTime) {
          const schedule = calculateRefreshSchedule(data.firstGameTime, data.lastGameTime);
          setRefreshInfo(schedule);
          if (schedule.seconds > 0) {
            setSecondsUntilNextRefresh(schedule.seconds);
          }
        }
      } catch (err) {
        console.warn('Backend fetch failed, using resilient local 2026 cache:', err);
        const fallback = getSlateForSportAndSite(sport, site);
        setSlate(fallback);
        const schedule = calculateRefreshSchedule(fallback.firstGameTime, fallback.lastGameTime);
        setRefreshInfo(schedule);
        if (schedule.seconds > 0) {
          setSecondsUntilNextRefresh(schedule.seconds);
        }
      } finally {
        setIsRefreshing(false);
      }
    },
    []
  );

  // Manual or Auto Trigger with Live Search Grounding
  const triggerFreshSync = useCallback(
    async (sport: Sport, site: Site) => {
      setIsRefreshing(true);
      try {
        const res = await fetch('/api/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sport, site }),
        });

        if (!res.ok) throw new Error('Refresh request failed');
        const data = await res.json();
        if (data.slate) {
          setSlate(data.slate);
        }
        if (data.changes && data.changes.length > 0) {
          setRecentChanges(data.changes);
        }

        // Reset countdown
        if (slate) {
          const schedule = calculateRefreshSchedule(slate.firstGameTime, slate.lastGameTime);
          setRefreshInfo(schedule);
          if (schedule.seconds > 0) {
            setSecondsUntilNextRefresh(schedule.seconds);
          }
        }
      } catch (err) {
        console.warn('Live refresh error, preserving last good data:', err);
      } finally {
        setIsRefreshing(false);
      }
    },
    [slate]
  );

  // Initial load & sport/site change
  useEffect(() => {
    loadSlate(currentSport, currentSite);
  }, [currentSport, currentSite, loadSlate]);

  // Dynamic tournament auto-refresh timer loop
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsUntilNextRefresh((prev) => {
        if (prev <= 1) {
          // Trigger refresh!
          triggerFreshSync(currentSport, currentSite);
          return refreshInfo.seconds || 300;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentSport, currentSite, refreshInfo.seconds, triggerFreshSync]);

  // Lock & Exclude handlers
  const handleToggleLock = (id: string) => {
    setLockedPlayerIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((pId) => pId !== id);
      } else {
        // If locking, remove from excluded
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
        // If excluding, remove from locked
        setLockedPlayerIds((lk) => lk.filter((pId) => pId !== id));
        return [...prev, id];
      }
    });
  };

  const handleLockMultiplePlayers = (playerNames: string[]) => {
    if (!slate) return;
    const matchingIds = slate.players
      .filter((p) => playerNames.some((name) => p.name.includes(name) || name.includes(p.name)))
      .map((p) => p.id);

    setLockedPlayerIds((prev) => Array.from(new Set([...prev, ...matchingIds])));
    setExcludedPlayerIds((ex) => ex.filter((id) => !matchingIds.includes(id)));
    // Switch to lineup builder to preview stack
    setActiveTab('builder');
  };

  const handleClearLocksAndExcludes = () => {
    setLockedPlayerIds([]);
    setExcludedPlayerIds([]);
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
        onSelectSport={(sport) => setCurrentSport(sport)}
        currentSite={currentSite}
        onToggleSite={(site) => setCurrentSite(site)}
        slate={slate}
        refreshInfo={refreshInfo}
        secondsUntilNextRefresh={secondsUntilNextRefresh}
        isRefreshing={isRefreshing}
        onRefreshNow={() => triggerFreshSync(currentSport, currentSite)}
        recentChanges={recentChanges}
      />

      {/* Main App Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-4 lg:px-6 py-4 pb-20 space-y-4">
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
                {tab.id === 'news' && slate?.highPriorityAlert && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content Display */}
        {slate ? (
          <div>
            {activeTab === 'projections' && (
              <ProjectionsTab
                players={slate.players}
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
                players={slate.players}
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
                players={slate.players}
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
                stacks={slate.stacks}
                sport={currentSport}
                site={currentSite}
                lockedPlayerIds={lockedPlayerIds}
                onLockMultiplePlayers={handleLockMultiplePlayers}
              />
            )}

            {activeTab === 'news' && (
              <NewsAlertsTab
                news={slate.news}
                highPriorityAlert={slate.highPriorityAlert}
                sport={currentSport}
              />
            )}

            {activeTab === 'builder' && (
              <LineupBuilderTab
                players={slate.players}
                sport={currentSport}
                site={currentSite}
                salaryCap={slate.salaryCap}
                rosterSlots={slate.rosterSlots}
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
            <p className="text-xs text-slate-400">Loading live 2026 DFS slate...</p>
          </div>
        )}
      </main>

      {/* Footer Strip with Sources & Grounding Notice */}
      <footer className="border-t border-slate-800/80 bg-slate-950/90 py-4 px-4 text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400 font-display">Pros Projections</span>
            <span>·</span>
            <span>Strictly 2026 Current Season DFS Analytics</span>
          </div>

          <div className="text-[11px] text-slate-500">
            Primary Projections: Fantasy Fuel DFS · Verified with Official Lineups & Injury Reports
          </div>
        </div>
      </footer>
    </div>
  );
}
