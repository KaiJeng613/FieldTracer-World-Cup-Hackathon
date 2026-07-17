"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import Image from "next/image";
import { ExplorerView } from "@/components/explorer-view";
import {
  Activity,
  BadgeCheck,
  Bot,
  Box,
  ChevronDown,
  Clock3,
  Crosshair,
  Database,
  Eye,
  Goal,
  Gauge,
  Layers3,
  ListFilter,
  Pause,
  Play,
  Rotate3D,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  Moon,
  TimerReset,
  Users,
  Wallet,
  Zap,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { ballAt, events as defaultEvents, formatClock, highlights as defaultHighlights, matches, nearestEvent, playerAt, players as defaultPlayers, type JerseyKit, type MatchEvent, type MatchEventType, type MatchHighlight, type MatchSummary, type Player } from "@/lib/fieldtracer";
import { parseTxLineFixture, type ParsedFixtureData } from "@/lib/txline-parser";

type Camera = "Tactical" | "Broadcast" | "Orbit";
type LayerKey = "paths" | "network" | "pressure" | "offside";
type Theme = "dark" | "light";
type AppView = "replay" | "explorer";
type ApiStatus = { configured: boolean; mode: "live" | "demo"; network: string; message: string };

const MAX_SECONDS = 5765;
const subscribeToHydration = () => () => undefined;

const eventIcon: Record<MatchEventType, string> = {
  goal: "G",
  shot: "S",
  corner: "C",
  card: "Y",
  var: "V",
  substitution: "↕",
  possession: "P",
};

function Flag({ code, tone }: { code: string; tone: "blue" | "red" }) {
  return <span className={`flag flag-${tone}`}>{code.slice(0, 2)}</span>;
}

function StatBar({ label, home, away, suffix = "" }: { label: string; home: number; away: number; suffix?: string }) {
  const total = Math.max(home + away, 1);
  return (
    <div className="stat-row">
      <div className="stat-values"><strong>{home}{suffix}</strong><span>{label}</span><strong>{away}{suffix}</strong></div>
      <div className="split-bar"><span style={{ width: `${(home / total) * 100}%` }} /><i /></div>
    </div>
  );
}

function LayerButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return <button className={`layer-chip ${active ? "active" : ""}`} onClick={onClick}><span />{label}</button>;
}

function KitDetail({ kit }: { kit: JerseyKit }) {
  if (kit.pattern === "vertical-stripes") {
    return (
      <g className="kit-detail">
        <path style={{ fill: kit.secondary }} d="M-5.2-7 H-3 V7 H-5.2Z M-.9-9 H1.1 V8 H-.9Z M3.2-8 H5.2 V7 H3.2Z" />
        <circle style={{ fill: kit.accent }} cx="2.8" cy="-4.2" r="1.2" />
      </g>
    );
  }

  if (kit.pattern === "tricolor") {
    return <g className="kit-detail"><path style={{ fill: kit.secondary }} d="M-1.8-8 H-.25 V7 H-1.8Z"/><path style={{ fill: kit.accent }} d="M-.25-8 H1.8 V7 H-.25Z"/></g>;
  }

  if (kit.pattern === "center-stripe") {
    return <g className="kit-detail"><path style={{ fill: kit.secondary }} d="M-1-8 H1 V7 H-1Z"/><circle style={{ fill: "none", stroke: kit.accent }} cx="0" cy="-3" r="2.2"/></g>;
  }

  return <path className="kit-detail solid-kit" style={{ fill: kit.secondary }} d="M-5-1 H5 V1 H-5Z" />;
}

function PlayerFigure({ player, selected }: { player: Player; selected: boolean }) {
  const skinTones = ["#f2c7a2", "#dca77c", "#a96f4f", "#704533"];
  const skin = skinTones[player.id % skinTones.length];
  const stride = 4 + (player.id % 3) * 1.4;
  const armLift = (player.id % 2 ? -1 : 1) * (2 + player.id % 3);

  return (
    <g className="humanoid" style={{ animationDelay: `${-(player.id % 8) * 0.17}s` }}>
      <ellipse className="player-shadow" cx="0" cy="12" rx="10" ry="4" />
      {selected && <circle r="20" className="selection-pulse" />}
      <line className="limb leg" style={{ stroke: player.kit.shadow }} x1="-3" y1="5" x2={-stride} y2="15" />
      <line className="limb leg" style={{ stroke: player.kit.shadow }} x1="3" y1="5" x2={stride} y2="15" />
      <line className="limb arm" style={{ stroke: player.kit.shadow }} x1="-6" y1="-2" x2="-12" y2={armLift} />
      <line className="limb arm" style={{ stroke: player.kit.shadow }} x1="6" y1="-2" x2="12" y2={-armLift} />
      <path className="jersey" fill={`url(#${player.team}Jersey)`} d="M-7-7 L-3-10 L3-10 L7-7 L6 7 Q0 10-6 7 Z" />
      <KitDetail kit={player.kit} />
      <path className="jersey-shine" d="M-5-6 Q-2-9 0-8 L-1 6 Q-4 6-5 4Z" />
      <circle className="player-head" cx="0" cy="-13" r="5" style={{ fill: skin }} />
      <ellipse className="head-shine" cx="-1.5" cy="-14.5" rx="1.6" ry="1.2" />
      <path className="player-hair" d="M-4-15 Q0-20 4-15 Q1-17-4-15" />
      <text className="jersey-number" y="3">{player.number}</text>
    </g>
  );
}

export function FieldTracerApp() {
  const wallet = useWallet();
  const mounted = useSyncExternalStore(subscribeToHydration, () => true, () => false);
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "dark";
    return window.localStorage.getItem("fieldtracer-theme") === "light" ? "light" : "dark";
  });
  const [activeView, setActiveView] = useState<AppView>("replay");
  const [second, setSecond] = useState(3922);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [camera, setCamera] = useState<Camera>("Tactical");
  const [layers, setLayers] = useState<Record<LayerKey, boolean>>({ paths: true, network: false, pressure: true, offside: false });
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(10);
  const [hoveredPlayer, setHoveredPlayer] = useState<number | null>(null);
  const [pitchZoom, setPitchZoom] = useState(1);
  const [orbitAngle, setOrbitAngle] = useState(18);
  const [status, setStatus] = useState<ApiStatus | null>(null);
  const [proofState, setProofState] = useState<"idle" | "signing" | "signed" | "unsupported">("idle");
  const [query, setQuery] = useState("");
  const [recentMatches, setRecentMatches] = useState<MatchSummary[]>(matches);
  const [selectedFixtureId, setSelectedFixtureId] = useState(18209181);
  const [loadingFixture, setLoadingFixture] = useState(false);
  const [currentFixtureData, setCurrentFixtureData] = useState<ParsedFixtureData | null>(null);
  const [selectedHighlightId, setSelectedHighlightId] = useState(defaultHighlights[1].id);
  const frameRef = useRef<number | null>(null);
  const previousRef = useRef<number>(0);

  // Use current fixture data or fall back to defaults
  const activeMatch = currentFixtureData?.match || matches[0];
  const events = currentFixtureData?.events || defaultEvents;
  const highlights = currentFixtureData?.highlights || defaultHighlights;
  const players = currentFixtureData?.players || defaultPlayers;

  useEffect(() => {
    fetch("/api/txline/status").then((response) => response.json()).then(setStatus).catch(() => undefined);
    fetch("/api/txline/fixtures").then((response) => response.json()).then((data) => {
      if (data.fixtures && data.fixtures.length > 0) {
        setRecentMatches(data.fixtures);
      }
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    // Load fixture details when a different fixture is selected
    setLoadingFixture(true);
    
    fetch(`/api/txline/fixture/${selectedFixtureId}`)
      .then((response) => response.text())
      .then((data) => {
        console.log("Fixture data loaded for", selectedFixtureId);
        const parsed = parseTxLineFixture(data, selectedFixtureId);
        
        if (parsed) {
          console.log("Parsed fixture data:", parsed);
          setCurrentFixtureData(parsed);
          // Reset playback to start
          setSecond(0);
          setPlaying(false);
          if (parsed.highlights.length > 0) {
            setSelectedHighlightId(parsed.highlights[0].id);
            setSelectedPlayer(parsed.highlights[0].playerId);
          }
        } else {
          console.warn("Could not parse fixture data for", selectedFixtureId);
        }
      })
      .catch((error) => {
        console.error("Failed to load fixture:", error);
      })
      .finally(() => {
        setLoadingFixture(false);
      });
  }, [selectedFixtureId]);

  useEffect(() => {
    if (!playing) return;
    const tick = (now: number) => {
      const delta = (now - previousRef.current) / 1000;
      previousRef.current = now;
      setSecond((current) => {
        const next = current + delta * speed * 9;
        const selectedHighlight = highlights.find((highlight) => highlight.id === selectedHighlightId);
        const insideHighlight = selectedHighlight && current >= selectedHighlight.startSecond - 1 && current <= selectedHighlight.endSecond;
        const replayEnd = camera === "Orbit" && insideHighlight ? selectedHighlight.endSecond : MAX_SECONDS;
        if (next >= replayEnd) {
          setPlaying(false);
          return replayEnd;
        }
        return next;
      });
      frameRef.current = requestAnimationFrame(tick);
    };
    previousRef.current = performance.now();
    frameRef.current = requestAnimationFrame(tick);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [camera, playing, selectedHighlightId, speed]);

  const currentEvent = useMemo(() => nearestEvent(second), [second]);
  const ball = useMemo(() => ballAt(second), [second]);
  const positions = useMemo(() => players.map((player) => ({ player, ...playerAt(player, second) })), [second]);
  const inspectedPlayerId = hoveredPlayer ?? selectedPlayer;
  const inspected = positions.find(({ player }) => player.id === inspectedPlayerId);
  const homeKit = players.find((player) => player.team === "home")!.kit;
  const awayKit = players.find((player) => player.team === "away")!.kit;
  const selectedHighlight = highlights.find((highlight) => highlight.id === selectedHighlightId) || highlights[0] || { 
    id: 'default', 
    startSecond: 0, 
    endSecond: MAX_SECONDS,
    second: 0,
    eventId: '',
    team: 'home' as const,
    title: 'Match replay',
    scorer: '',
    playerId: 1,
    txlinePlayerId: 0,
    score: '0-0',
    goalType: 'Shot'
  };
  const replayProgress = selectedHighlight ? Math.max(0, Math.min(1, (second - selectedHighlight.startSecond) / (selectedHighlight.endSecond - selectedHighlight.startSecond))) : 0;
  const liveOrbitAngle = camera === "Orbit" && playing ? (orbitAngle + replayProgress * 42) % 360 : orbitAngle;

  const toggleLayer = (key: LayerKey) => setLayers((current) => ({ ...current, [key]: !current[key] }));
  const jumpTo = (value: number) => { setSecond(value); setPlaying(false); };
  const adjustZoom = (change: number) => setPitchZoom((current) => Math.max(.75, Math.min(1.6, Number((current + change).toFixed(2)))));

  const playHighlight = (highlightId: string) => {
    const highlight = highlights.find((item) => item.id === highlightId);
    if (!highlight) return;
    setSelectedHighlightId(highlight.id);
    setSelectedPlayer(highlight.playerId);
    setCamera("Orbit");
    setSecond(highlight.startSecond);
    setPlaying(true);
  };

  const signReplay = useCallback(async () => {
    if (!wallet.publicKey || !wallet.signMessage) {
      setProofState("unsupported");
      return;
    }
    setProofState("signing");
    const message = new TextEncoder().encode(`FieldTracer Replay Proof\nFixture: 18209181\nTimestamp: ${Math.floor(second)}\nSource: TxLINE`);
    try {
      await wallet.signMessage(message);
      setProofState("signed");
    } catch {
      setProofState("idle");
    }
  }, [second, wallet]);

  const runSearch = (value: string) => {
    setQuery(value);
    const lower = value.toLowerCase();
    const target = events.find((event) => lower.includes(event.type) || lower.includes(event.title.toLowerCase().split(" ")[0]));
    if (target) jumpTo(target.second);
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    window.localStorage.setItem("fieldtracer-theme", next);
    setTheme(next);
  };

  if (!mounted) {
    return (
      <main className="app-boot" aria-label="Loading FieldTracer">
        <div className="boot-mark"><Crosshair size={26} /></div>
        <strong>FIELDTRACER</strong>
        <span>Preparing replay studio</span>
      </main>
    );
  }

  return (
    <main className={`app-shell theme-${theme}`}>
      <header className="topbar">
        <div className="brand"><div className="brand-mark"><Image src="/fieldtracer-logo.png" alt="FieldTracer international football" width={42} height={42} priority /></div><div><strong>FIELDTRACER</strong><span>Match intelligence</span></div></div>
        <nav><button className={activeView === "replay" ? "active" : ""} onClick={() => setActiveView("replay")}>Replay studio</button><button className={activeView === "explorer" ? "active" : ""} onClick={() => setActiveView("explorer")}>Explorer</button><button disabled title="Live desk is coming next">Live desk</button></nav>
        <div className="top-actions">
          <button className="theme-toggle" onClick={toggleTheme} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`} title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}>
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <WalletMultiButton />
        </div>
      </header>

      {activeView === "explorer" ? <ExplorerView onOpenReplay={() => setActiveView("replay")} /> : <section className="workspace">
        <aside className="left-rail panel">
          <div className="rail-heading"><div><span className="eyebrow">WORLD CUP 2026</span><h2>Replay library</h2></div><button aria-label="Filter matches" className="icon-button"><ListFilter size={17} /></button></div>
          <label className="search-box"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search moments…" /></label>
          <div className="date-separator"><span>RECENT MATCHES</span><i /></div>
          <div className="match-list">
            {recentMatches.map((match) => (
              <button 
                className={`match-card ${match.fixtureId === selectedFixtureId ? "selected" : ""}`} 
                key={match.fixtureId}
                onClick={() => setSelectedFixtureId(match.fixtureId)}
              >
                <div className="match-meta"><span>{match.stage}</span><small>#{match.fixtureId}</small></div>
                <div className="team-line"><Flag code={match.homeCode} tone="blue" /><strong>{match.home}</strong><b>{match.homeScore}</b></div>
                <div className="team-line"><Flag code={match.awayCode} tone="red" /><strong>{match.away}</strong><b>{match.awayScore}</b></div>
                <div className="match-status"><BadgeCheck size={13} /> TxLINE capture</div>
              </button>
            ))}
          </div>
          <div className="rail-footer"><Database size={16} /><div><strong>{recentMatches.length} fixtures indexed</strong><span>Scores · odds · historical</span></div></div>
        </aside>

        <section className="studio">
          {loadingFixture && (
            <div className="loading-overlay" style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(2, 7, 19, 0.9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              gap: '12px',
              flexDirection: 'column'
            }}>
              <div style={{ animation: 'spin 1s linear infinite' }}>
                <Database size={32} />
              </div>
              <strong>Loading fixture {selectedFixtureId}...</strong>
              <span style={{ opacity: 0.7 }}>Fetching TxLINE data</span>
            </div>
          )}
          <div className="scoreboard panel">
            <div className="competition"><span className="eyebrow">WORLD CUP · {activeMatch.stage.toUpperCase()}</span><div><Clock3 size={14} /> TxLINE fixture {activeMatch.fixtureId}</div></div>
            <div className="score-team home"><div><span>{activeMatch.homeCode}</span><strong>{activeMatch.home}</strong></div><Flag code={activeMatch.homeCode} tone="blue" /></div>
            <div className="score"><strong>{activeMatch.homeScore}</strong><span>—</span><strong>{activeMatch.awayScore}</strong><small>{activeMatch.status.toUpperCase()}</small></div>
            <div className="score-team away"><Flag code={activeMatch.awayCode} tone="red" /><div><span>{activeMatch.awayCode}</span><strong>{activeMatch.away}</strong></div></div>
            <button aria-label="Show match details" className="more-button"><ChevronDown size={18} /></button>
          </div>

          <section className="highlights-panel panel" aria-labelledby="match-highlights-title">
            <div className="highlights-heading">
              <div><span className="eyebrow">MATCH HIGHLIGHTS</span><h2 id="match-highlights-title">Choose an exciting moment</h2></div>
              <div className="highlight-source"><Database size={13} /> Goal time + scorer from TxLINE</div>
            </div>
            <div className="highlight-carousel">
              {highlights.map((highlight, index) => (
                <article className={`highlight-card ${selectedHighlightId === highlight.id ? "selected" : ""}`} key={highlight.id}>
                  <button className="highlight-select" onClick={() => { setSelectedHighlightId(highlight.id); jumpTo(highlight.second); setSelectedPlayer(highlight.playerId); }}>
                    <span className="highlight-minute">{Math.floor(highlight.second / 60)}&prime;</span>
                    <span className="highlight-icon"><Goal size={17} /></span>
                    <span className="highlight-copy"><small>GOAL {index + 1} &middot; {highlight.score}</small><strong>{highlight.scorer}</strong><span>{highlight.title}</span></span>
                    <span className="feed-badge">TX</span>
                  </button>
                  <button className="watch-360" onClick={() => playHighlight(highlight.id)}><Rotate3D size={15} /> Watch 360&deg;</button>
                </article>
              ))}
              <div className="orbit-control">
                <div><Rotate3D size={16} /><span><strong>Camera orbit</strong><small>Drag to inspect the reconstructed play</small></span><b>{Math.round(liveOrbitAngle)}&deg;</b></div>
                <input aria-label="360 degree replay camera angle" type="range" min="0" max="359" value={orbitAngle} onChange={(event) => { setOrbitAngle(Number(event.target.value)); setCamera("Orbit"); }} />
              </div>
            </div>
          </section>

          <div className="viewer panel">
            <div className="viewer-toolbar">
              <div className="camera-group">
                {(["Tactical", "Broadcast", "Orbit"] as Camera[]).map((view) => <button key={view} onClick={() => setCamera(view)} className={camera === view ? "active" : ""}>{view === "Orbit" ? <Rotate3D size={15} /> : <Eye size={15} />}{view === "Orbit" ? "360° replay" : view}</button>)}
              </div>
              <div className="viewer-actions">
                <div className="zoom-controls" aria-label="Board zoom controls">
                  <button aria-label="Zoom out" disabled={pitchZoom <= .75} onClick={() => adjustZoom(-.15)}><ZoomOut size={15} /></button>
                  <button className="zoom-value" aria-label="Reset board zoom" title="Reset zoom" onClick={() => setPitchZoom(1)}>{Math.round(pitchZoom * 100)}%</button>
                  <button aria-label="Zoom in" disabled={pitchZoom >= 1.6} onClick={() => adjustZoom(.15)}><ZoomIn size={15} /></button>
                </div>
                <div className="reconstruction-label"><Sparkles size={14} /> Reconstructed movement</div>
              </div>
            </div>

            <div className={`pitch-stage camera-${camera.toLowerCase()} ${camera === "Orbit" ? "is-360-replay" : ""}`} style={{ "--orbit-angle": `${liveOrbitAngle}deg`, "--pitch-zoom": pitchZoom } as CSSProperties}>
              <svg className="pitch" viewBox="0 0 1050 680" role="img" aria-label="Interactive football pitch replay">
                <defs>
                  <radialGradient id="pressureHome"><stop offset="0" stopColor="#6dff8d" stopOpacity=".28"/><stop offset="1" stopColor="#6dff8d" stopOpacity="0"/></radialGradient>
                  <radialGradient id="pressureAway"><stop offset="0" stopColor="#ff806c" stopOpacity=".25"/><stop offset="1" stopColor="#ff806c" stopOpacity="0"/></radialGradient>
                  <linearGradient id="homeJersey" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={homeKit.primary}/><stop offset=".58" stopColor={homeKit.primary}/><stop offset="1" stopColor={homeKit.shadow}/></linearGradient>
                  <linearGradient id="awayJersey" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={awayKit.primary}/><stop offset=".58" stopColor={awayKit.primary}/><stop offset="1" stopColor={awayKit.shadow}/></linearGradient>
                  <radialGradient id="ballShell" cx="32%" cy="25%" r="78%"><stop offset="0" stopColor="#ffffff"/><stop offset=".68" stopColor="#f7f8fb"/><stop offset="1" stopColor="#c8ced8"/></radialGradient>
                  <linearGradient id="ballPanel" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#337fbe"/><stop offset="1" stopColor="#164f8b"/></linearGradient>
                  <clipPath id="ballClip"><circle r="11"/></clipPath>
                  <filter id="ballShadow" x="-70%" y="-70%" width="240%" height="240%"><feDropShadow dx="1.2" dy="2" stdDeviation="1.8" floodColor="#020713" floodOpacity=".65"/></filter>
                </defs>
                <rect className="pitch-ground" x="8" y="8" width="1034" height="664" rx="8" />
                {[1,2,3,4,5,6,7,8,9].map((line) => <rect key={line} className={line % 2 ? "grass-a" : "grass-b"} x={8 + (line - 1) * 115} y="8" width="115" height="664" />)}
                <g className="field-lines">
                  <rect x="22" y="22" width="1006" height="636" />
                  <line x1="525" y1="22" x2="525" y2="658" />
                  <circle cx="525" cy="340" r="82" /><circle cx="525" cy="340" r="4" fill="currentColor" />
                  <rect x="22" y="151" width="165" height="378" /><rect x="863" y="151" width="165" height="378" />
                  <rect x="22" y="245" width="62" height="190" /><rect x="966" y="245" width="62" height="190" />
                  <circle cx="126" cy="340" r="4" fill="currentColor" /><circle cx="924" cy="340" r="4" fill="currentColor" />
                  <path d="M187 275 A82 82 0 0 1 187 405" /><path d="M863 275 A82 82 0 0 0 863 405" />
                </g>
                {layers.pressure && <g><ellipse cx="705" cy="340" rx="210" ry="195" fill="url(#pressureHome)"/><ellipse cx="370" cy="340" rx="190" ry="180" fill="url(#pressureAway)"/></g>}
                {layers.network && <g className="network-lines">{positions.filter((p) => p.player.team === "home" && p.player.id > 5).map((p, index, all) => { const next = all[(index + 1) % all.length]; return <line key={p.player.id} x1={p.x * 10.5} y1={p.y * 6.8} x2={next.x * 10.5} y2={next.y * 6.8} />; })}</g>}
                {layers.offside && <line className="offside-line" x1="764" x2="764" y1="22" y2="658" />}
                {layers.paths && <g className="movement-paths">{positions.filter((_, index) => index % 2 === 0).map(({ player, x, y }) => { const old = playerAt(player, second - 70); return <path key={player.id} d={`M ${old.x * 10.5} ${old.y * 6.8} Q ${(old.x + x) * 5.25 + Math.sin(player.id) * 25} ${(old.y + y) * 3.4} ${x * 10.5} ${y * 6.8}`} />; })}</g>}
                {positions.map(({ player, x, y }) => (
                  <g key={player.id} className={`player-token ${player.team} ${inspectedPlayerId === player.id ? "selected" : ""}`} transform={`translate(${x * 10.5} ${y * 6.8})`} onClick={() => setSelectedPlayer(player.id)} onMouseEnter={() => setHoveredPlayer(player.id)} onMouseLeave={() => setHoveredPlayer(null)} onFocus={() => setHoveredPlayer(player.id)} onBlur={() => setHoveredPlayer(null)} role="button" tabIndex={0} aria-label={`Inspect ${player.name}`}>
                    <PlayerFigure player={player} selected={inspectedPlayerId === player.id} />
                    {(inspectedPlayerId === player.id || player.id === 10 || player.id === 13) && <g className="player-label"><rect x="-36" y="-37" width="72" height="18" rx="5"/><text y="-24">{player.name}</text></g>}
                  </g>
                ))}
                <g className="ball" transform={`translate(${ball.x * 10.5} ${ball.y * 6.8})`}>
                  <ellipse className="ball-ground-shadow" cx="1" cy="10" rx="10" ry="3.6" />
                  <g className="ball-spin" transform={`rotate(${second * 2})`} filter="url(#ballShadow)">
                    <circle className="ball-shell" r="11" fill="url(#ballShell)" />
                    <g clipPath="url(#ballClip)">
                      <path className="ball-center-panel" fill="url(#ballPanel)" d="M0-5 L4.8-1.5 L3 4 L-3 4 L-4.8-1.5Z" />
                      <path className="ball-color-panel green" d="M-5.8-10.5 L0-12 L5.8-10.5 L3.3-7 L0-5 L-3.3-7Z" />
                      <path className="ball-color-panel blue" d="M-11-4.7 L-8-8 L-5.2-6.5 L-4.8-1.5 L-9.2 1Z" />
                      <path className="ball-color-panel red" d="M11 3.8 L8.2 8.8 L4.8 8.2 L3 4 L7.7 1.4Z" />
                      <path className="ball-seams" d="M0-5 L0-11 M4.8-1.5 L10-3.5 M3 4 L6.2 9 M-3 4 L-6.2 9 M-4.8-1.5 L-10-3.5" />
                      <path className="ball-accents" d="M-3.5-8.8 L-1.5-8.2 M6.3 6.5 L8 5.4 M-8-2.8 L-7.1-4.8" />
                    </g>
                    <circle className="ball-rim" r="11" />
                    <ellipse className="ball-highlight" cx="-4" cy="-5" rx="2.4" ry="1.4" />
                  </g>
                </g>
              </svg>
              <div className="pitch-caption"><span><i /> TXLINE EVENT</span><strong>{currentEvent.title}</strong><small>{Math.abs(currentEvent.second - second) < 12 ? currentEvent.detail : "Interpolating between recorded events"}</small></div>
              {camera === "Orbit" && <div className="replay-360-badge"><Rotate3D size={14} /><div><strong>360° REPLAY</strong><span>{selectedHighlight.scorer} · {selectedHighlight.score}</span></div></div>}
              {inspected && <aside className="player-stats-panel" aria-live="polite">
                <div className="player-stats-head"><div className="player-avatar">{inspected.player.number}</div><div><span>{inspected.player.team === "home" ? "FRANCE" : "MOROCCO"}</span><strong>{inspected.player.name}</strong><small>{inspected.player.txlinePlayerId ? `TxLINE ID ${inspected.player.txlinePlayerId}` : "TxLINE identity unresolved"}</small></div></div>
                <div className="stats-source"><Database size={13} /><span>TXLINE PLAYER STATS</span><b>{inspected.player.txlinePlayerId ? "RESOLVED" : "LIMITED"}</b></div>
                <div className="player-stat-grid">
                  <div><span>GOALS</span><strong>{inspected.player.feedStats.goals}</strong></div>
                  <div><span>YELLOW</span><strong>{inspected.player.feedStats.yellowCards}</strong></div>
                  <div><span>RED</span><strong>{inspected.player.feedStats.redCards}</strong></div>
                  <div><span>PENALTIES</span><strong>{inspected.player.feedStats.penaltyGoals}/{inspected.player.feedStats.penaltyAttempts}</strong></div>
                </div>
                <div className="lineup-facts"><span><small>SQUAD</small><strong>#{inspected.player.number}</strong></span><span><small>LINEUP</small><strong>{inspected.player.starter ? "Starter" : "Unresolved"}</strong></span></div>
                <div className="estimated-metric"><span><small>FIELDTRACER ESTIMATE</small><strong>{(22 + Math.abs(Math.sin(second / 30 + inspected.player.id)) * 9).toFixed(1)} km/h</strong></span><b>RECONSTRUCTED</b></div>
              </aside>}
            </div>

            <div className="playback">
              <button aria-label={playing ? "Pause replay" : "Play replay"} className="play-button" onClick={() => setPlaying((value) => !value)}>{playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}</button>
              <button aria-label="Restart replay" className="reset-button" onClick={() => jumpTo(0)}><TimerReset size={17} /></button>
              <strong className="clock">{formatClock(second)}</strong>
              <div className="scrubber">
                <input aria-label="Replay timeline" type="range" min="0" max={MAX_SECONDS} value={second} onChange={(event) => jumpTo(Number(event.target.value))} />
                <div className="event-dots">{events.map((event) => <button aria-label={event.title} title={`${formatClock(event.second)} · ${event.title}`} key={event.id} className={`event-dot ${event.type}`} style={{ left: `${event.second / MAX_SECONDS * 100}%` }} onClick={() => jumpTo(event.second)} />)}</div>
              </div>
              <strong className="clock muted">95:05</strong>
              <button className="speed-button" onClick={() => setSpeed((value) => value === 1 ? 2 : value === 2 ? .5 : 1)}>{speed}×</button>
            </div>
          </div>

          <div className="bottom-grid">
            <div className="timeline-card panel">
              <div className="section-title"><div><span className="eyebrow">MATCH SIGNAL</span><h3>Event timeline</h3></div><span className="legend"><i />France <i />Morocco</span></div>
              <div className="momentum-chart"><div className="centerline" />{events.map((event) => <button key={event.id} style={{ left: `${event.second / MAX_SECONDS * 100}%`, height: `${18 + event.intensity * .46}px` }} className={`${event.team} ${event.type} ${currentEvent.id === event.id ? "active" : ""}`} onClick={() => jumpTo(event.second)}><span>{eventIcon[event.type]}</span></button>)}</div>
              <div className="timeline-labels"><span>0′</span><span>15′</span><span>30′</span><span>HT</span><span>60′</span><span>75′</span><span>FT</span></div>
            </div>
            <div className="data-card panel"><div className="section-title"><div><span className="eyebrow">DATA PROVENANCE</span><h3>Replay integrity</h3></div><ShieldCheck size={20} /></div><div className="integrity-row"><span className={`status-orb ${status?.configured ? "live" : ""}`} /><div><strong>{status?.configured ? "Live TxLINE adapter" : "Demo adapter active"}</strong><span>{status?.message || "Checking server configuration…"}</span></div></div><button className="proof-button" disabled={!wallet.connected || proofState === "signing"} onClick={signReplay}><Wallet size={16} />{proofState === "signed" ? "Replay proof signed" : proofState === "signing" ? "Awaiting signature…" : wallet.connected ? "Sign replay proof" : "Connect wallet to sign"}</button></div>
          </div>
        </section>

        <aside className="right-rail">
          <div className="analyst-card panel">
            <div className="analyst-header"><div className="ai-mark"><Bot size={20} /></div><div><span className="eyebrow">FIELDTRACER AI</span><h2>Tactical analyst</h2></div><span className="ai-online"><i />READY</span></div>
            <div className="analysis-highlight"><Sparkles size={16} /><p><strong>Why did the second goal happen?</strong> France compressed Morocco’s midfield after the restart, then attacked the space behind the advancing right side. The decisive run stretched the final line before the finish at 65:22.</p></div>
            <div className="insight-list"><div><span>01</span><p><strong>Width created the lane</strong>Morocco’s block shifted 11.8m toward the ball side.</p></div><div><span>02</span><p><strong>Late central arrival</strong>The reconstructed runner entered behind the midfield screen.</p></div><div><span>03</span><p><strong>Fast sequence</strong>High-danger possession became a goal within 9 seconds.</p></div></div>
            <div className="ask-box"><Search size={16}/><input placeholder="Ask about this replay…" value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") runSearch(query); }} /><button aria-label="Search replay" onClick={() => runSearch(query)}><Zap size={15}/></button></div>
            <div className="quick-prompts"><button onClick={() => runSearch("show goals")}>Show goals</button><button onClick={() => runSearch("find VAR")}>Find VAR</button><button onClick={() => runSearch("show corner")}>Corners</button></div>
          </div>

          <div className="metrics-card panel">
            <div className="section-title"><div><span className="eyebrow">FULL TIME</span><h3>Match metrics</h3></div><Gauge size={19}/></div>
            <StatBar label="Possession" home={57} away={43} suffix="%" />
            <StatBar label="Shots" home={19} away={10} />
            <StatBar label="Corners" home={5} away={5} />
            <StatBar label="Yellow cards" home={0} away={1} />
            <div className="metric-cards"><div><Activity size={16}/><span>ATTACK INDEX</span><strong>7.8</strong><small>France</small></div><div><Users size={16}/><span>PRESSURE</span><strong>62%</strong><small>High block</small></div></div>
          </div>

          <div className="layers-card panel"><div className="section-title"><div><span className="eyebrow">VIEW CONTROL</span><h3>Tactical layers</h3></div><Layers3 size={19}/></div><div className="layer-grid"><LayerButton active={layers.paths} label="Running paths" onClick={() => toggleLayer("paths")}/><LayerButton active={layers.pressure} label="Pressure radius" onClick={() => toggleLayer("pressure")}/><LayerButton active={layers.network} label="Passing network" onClick={() => toggleLayer("network")}/><LayerButton active={layers.offside} label="Offside line" onClick={() => toggleLayer("offside")}/></div><div className="source-note"><Box size={15}/><span>Positions are reconstructed for this MVP. TxLINE events remain source-authentic.</span></div></div>
        </aside>
      </section>}
    </main>
  );
}
