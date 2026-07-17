"use client";

import { useMemo, useState } from "react";
import { CalendarDays, ChevronRight, Database, Goal, Medal, Search, ShieldCheck, Sparkles, Trophy } from "lucide-react";
import { explorerMatches, playerLeaders } from "@/lib/fieldtracer";

type MatchFilter = "All" | "90 min" | "Extra time";

function TeamBadge({ code }: { code: string }) {
  return <span className="explorer-team-badge">{code.slice(0, 3)}</span>;
}

export function ExplorerView({ onOpenReplay }: { onOpenReplay: () => void }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<MatchFilter>("All");
  const [selectedFixture, setSelectedFixture] = useState(explorerMatches[0].fixtureId);

  const visibleMatches = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return explorerMatches.filter((match) => {
      const matchesFilter = filter === "All" || match.duration === filter;
      const matchesQuery = !normalized || `${match.home} ${match.away} ${match.fixtureId}`.toLowerCase().includes(normalized);
      return matchesFilter && matchesQuery;
    });
  }, [filter, query]);

  const selected = explorerMatches.find((match) => match.fixtureId === selectedFixture) || explorerMatches[0];
  const capturedGoals = explorerMatches.reduce((total, match) => total + match.goals.length, 0);

  return (
    <section className="explorer-shell">
      <div className="explorer-hero panel">
        <div>
          <span className="eyebrow">TXLINE HISTORICAL DATA</span>
          <h1>Match explorer</h1>
          <p>Browse the captured World Cup fixtures, inspect final scores, and trace player contributions back to TxLINE score and lineup events.</p>
        </div>
        <div className="explorer-summary">
          <div><Database size={17} /><span><strong>{explorerMatches.length}</strong>fixtures</span></div>
          <div><Goal size={17} /><span><strong>{capturedGoals}</strong>goal events</span></div>
          <div><ShieldCheck size={17} /><span><strong>4</strong>full histories</span></div>
        </div>
      </div>

      <div className="explorer-toolbar panel">
        <label><Search size={17} /><input aria-label="Search match history" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search team or fixture ID..." /></label>
        <div className="explorer-filters" aria-label="Filter matches">
          {(["All", "90 min", "Extra time"] as MatchFilter[]).map((item) => <button className={filter === item ? "active" : ""} key={item} onClick={() => setFilter(item)}>{item}</button>)}
        </div>
        <span className="explorer-result-count">{visibleMatches.length} results</span>
      </div>

      <div className="explorer-grid">
        <div className="match-history panel">
          <div className="explorer-section-title"><div><span className="eyebrow">ARCHIVE</span><h2>Match history</h2></div><CalendarDays size={19} /></div>
          <div className="history-list">
            {visibleMatches.map((match) => (
              <button className={`history-row ${selected.fixtureId === match.fixtureId ? "selected" : ""}`} key={match.fixtureId} onClick={() => setSelectedFixture(match.fixtureId)}>
                <div className="history-date"><strong>{match.date.split(" ")[0]}</strong><span>{match.date.slice(3)}</span><small>{match.kickoff}</small></div>
                <div className="history-teams">
                  <div><TeamBadge code={match.homeCode} /><strong>{match.home}</strong><b>{match.homeScore}</b></div>
                  <div><TeamBadge code={match.awayCode} /><strong>{match.away}</strong><b>{match.awayScore}</b></div>
                </div>
                <div className="history-meta"><span>{match.duration}</span><small>#{match.fixtureId}</small><em>{match.capture}</em></div>
                <ChevronRight size={17} />
              </button>
            ))}
            {!visibleMatches.length && <div className="empty-history"><Search size={20} /><strong>No matching fixtures</strong><span>Try another team name or match type.</span></div>}
          </div>
        </div>

        <aside className="explorer-side">
          <div className="match-detail panel">
            <div className="detail-head"><div><span className="eyebrow">SELECTED MATCH</span><small>#{selected.fixtureId}</small></div><span>{selected.status}</span></div>
            <div className="detail-score">
              <div><TeamBadge code={selected.homeCode} /><strong>{selected.home}</strong></div>
              <b>{selected.homeScore}<i>-</i>{selected.awayScore}</b>
              <div><TeamBadge code={selected.awayCode} /><strong>{selected.away}</strong></div>
            </div>
            <div className="goal-breakdown">
              <span>SCORING EVENTS</span>
              {selected.goals.map((goal, index) => <div key={`${goal.minute}-${index}`}><Goal size={14} /><strong>{goal.minute}&prime;</strong><span>{goal.player}<small>{goal.team}{!goal.resolved ? " · ID unresolved" : ""}</small></span></div>)}
              {!selected.goals.length && <p>No scorer event was retained in this capture.</p>}
            </div>
            {selected.fixtureId === explorerMatches[0].fixtureId ? <button className="open-replay" onClick={onOpenReplay}><Sparkles size={15} /> Open interactive replay</button> : <div className="capture-note"><Database size={14} /> Historical score inspection available</div>}
          </div>

          <div className="leaders-card panel">
            <div className="explorer-section-title"><div><span className="eyebrow">CONTRIBUTIONS</span><h2>Best players</h2></div><Trophy size={19} /></div>
            <p className="leader-method">FieldTracer impact ranks captured goal contributions. It is not an official TxLINE player rating.</p>
            <div className="leader-list">
              {playerLeaders.map((player) => (
                <div key={player.name}>
                  <span className={`leader-rank rank-${player.rank}`}>{player.rank <= 3 ? <Medal size={14} /> : player.rank}</span>
                  <span className="leader-name"><strong>{player.name}</strong><small>{player.team} · {player.goals} {player.goals === 1 ? "goal" : "goals"}</small></span>
                  <b>{player.impact.toFixed(1)}</b>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
