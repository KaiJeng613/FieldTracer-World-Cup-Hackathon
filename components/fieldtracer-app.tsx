"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
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
} from "lucide-react";
import { ballAt, events, formatClock, matches, nearestEvent, playerAt, players, type JerseyKit, type MatchEventType, type Player } from "@/lib/fieldtracer";

type Camera = "Tactical" | "Broadcast" | "Orbit";
type LayerKey = "paths" | "network" | "pressure" | "offside";
type Theme = "dark" | "light";
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
  const [second, setSecond] = useState(3922);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [camera, setCamera] = useState<Camera>("Tactical");
  const [layers, setLayers] = useState<Record<LayerKey, boolean>>({ paths: true, network: false, pressure: true, offside: false });
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(10);
  const [status, setStatus] = useState<ApiStatus | null>(null);
  const [proofState, setProofState] = useState<"idle" | "signing" | "signed" | "unsupported">("idle");
  const [query, setQuery] = useState("");
  const frameRef = useRef<number | null>(null);
  const previousRef = useRef<number>(0);

  useEffect(() => {
    fetch("/api/txline/status").then((response) => response.json()).then(setStatus).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!playing) return;
    const tick = (now: number) => {
      const delta = (now - previousRef.current) / 1000;
      previousRef.current = now;
      setSecond((current) => {
        const next = current + delta * speed * 9;
        if (next >= MAX_SECONDS) {
          setPlaying(false);
          return MAX_SECONDS;
        }
        return next;
      });
      frameRef.current = requestAnimationFrame(tick);
    };
    previousRef.current = performance.now();
    frameRef.current = requestAnimationFrame(tick);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [playing, speed]);

  const currentEvent = useMemo(() => nearestEvent(second), [second]);
  const ball = useMemo(() => ballAt(second), [second]);
  const positions = useMemo(() => players.map((player) => ({ player, ...playerAt(player, second) })), [second]);
  const selected = positions.find(({ player }) => player.id === selectedPlayer);
  const homeKit = players.find((player) => player.team === "home")!.kit;
  const awayKit = players.find((player) => player.team === "away")!.kit;

  const toggleLayer = (key: LayerKey) => setLayers((current) => ({ ...current, [key]: !current[key] }));
  const jumpTo = (value: number) => { setSecond(value); setPlaying(false); };

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
        <div className="brand"><div className="brand-mark"><Crosshair size={22} /></div><div><strong>FIELDTRACER</strong><span>Match intelligence</span></div></div>
        <nav><button className="active">Replay studio</button><button>Explorer</button><button>Live desk</button></nav>
        <div className="top-actions">
          <button className="theme-toggle" onClick={toggleTheme} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`} title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}>
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <WalletMultiButton />
        </div>
      </header>

      <section className="workspace">
        <aside className="left-rail panel">
          <div className="rail-heading"><div><span className="eyebrow">WORLD CUP 2026</span><h2>Replay library</h2></div><button aria-label="Filter matches" className="icon-button"><ListFilter size={17} /></button></div>
          <label className="search-box"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search moments…" /></label>
          <div className="date-separator"><span>RECENT MATCHES</span><i /></div>
          <div className="match-list">
            {matches.map((match, index) => (
              <button className={`match-card ${index === 0 ? "selected" : ""}`} key={match.fixtureId}>
                <div className="match-meta"><span>{match.stage}</span><small>#{match.fixtureId}</small></div>
                <div className="team-line"><Flag code={match.homeCode} tone="blue" /><strong>{match.home}</strong><b>{match.homeScore}</b></div>
                <div className="team-line"><Flag code={match.awayCode} tone="red" /><strong>{match.away}</strong><b>{match.awayScore}</b></div>
                <div className="match-status"><BadgeCheck size={13} /> TxLINE capture</div>
              </button>
            ))}
          </div>
          <div className="rail-footer"><Database size={16} /><div><strong>6 raw fixtures indexed</strong><span>Scores · odds · historical</span></div></div>
        </aside>

        <section className="studio">
          <div className="scoreboard panel">
            <div className="competition"><span className="eyebrow">WORLD CUP · ROUND OF 16</span><div><Clock3 size={14} /> TxLINE fixture 18209181</div></div>
            <div className="score-team home"><div><span>FRA</span><strong>France</strong></div><Flag code="FR" tone="blue" /></div>
            <div className="score"><strong>2</strong><span>—</span><strong>0</strong><small>FULL TIME</small></div>
            <div className="score-team away"><Flag code="MA" tone="red" /><div><span>MAR</span><strong>Morocco</strong></div></div>
            <button aria-label="Show match details" className="more-button"><ChevronDown size={18} /></button>
          </div>

          <div className="viewer panel">
            <div className="viewer-toolbar">
              <div className="camera-group">
                {(["Tactical", "Broadcast", "Orbit"] as Camera[]).map((view) => <button key={view} onClick={() => setCamera(view)} className={camera === view ? "active" : ""}>{view === "Orbit" ? <Rotate3D size={15} /> : <Eye size={15} />}{view}</button>)}
              </div>
              <div className="reconstruction-label"><Sparkles size={14} /> Reconstructed movement</div>
            </div>

            <div className={`pitch-stage camera-${camera.toLowerCase()}`}>
              <svg className="pitch" viewBox="0 0 1050 680" role="img" aria-label="Interactive football pitch replay">
                <defs>
                  <radialGradient id="pressureHome"><stop offset="0" stopColor="#6dff8d" stopOpacity=".28"/><stop offset="1" stopColor="#6dff8d" stopOpacity="0"/></radialGradient>
                  <radialGradient id="pressureAway"><stop offset="0" stopColor="#ff806c" stopOpacity=".25"/><stop offset="1" stopColor="#ff806c" stopOpacity="0"/></radialGradient>
                  <linearGradient id="homeJersey" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={homeKit.primary}/><stop offset=".58" stopColor={homeKit.primary}/><stop offset="1" stopColor={homeKit.shadow}/></linearGradient>
                  <linearGradient id="awayJersey" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={awayKit.primary}/><stop offset=".58" stopColor={awayKit.primary}/><stop offset="1" stopColor={awayKit.shadow}/></linearGradient>
                  <filter id="glow"><feGaussianBlur stdDeviation="4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
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
                  <g key={player.id} className={`player-token ${player.team} ${selectedPlayer === player.id ? "selected" : ""}`} transform={`translate(${x * 10.5} ${y * 6.8})`} onClick={() => setSelectedPlayer(player.id)} role="button" tabIndex={0}>
                    <PlayerFigure player={player} selected={selectedPlayer === player.id} />
                    {(selectedPlayer === player.id || player.id === 10 || player.id === 13) && <g className="player-label"><rect x="-36" y="-37" width="72" height="18" rx="5"/><text y="-24">{player.name}</text></g>}
                  </g>
                ))}
                <g className="ball" transform={`translate(${ball.x * 10.5} ${ball.y * 6.8})`} filter="url(#glow)"><circle r="8"/><circle r="2"/></g>
              </svg>
              <div className="pitch-caption"><span><i /> TXLINE EVENT</span><strong>{currentEvent.title}</strong><small>{Math.abs(currentEvent.second - second) < 12 ? currentEvent.detail : "Interpolating between recorded events"}</small></div>
              {selected && <div className="player-card"><div className="player-avatar">{selected.player.number}</div><div><span>{selected.player.team === "home" ? "FRANCE" : "MOROCCO"}</span><strong>{selected.player.name}</strong></div><div><span>EST. SPEED</span><strong>{(22 + Math.abs(Math.sin(second / 30 + selected.player.id)) * 9).toFixed(1)} km/h</strong></div></div>}
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
      </section>
    </main>
  );
}
