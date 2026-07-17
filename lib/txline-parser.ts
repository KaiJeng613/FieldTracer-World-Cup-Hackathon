import type { MatchEvent, MatchHighlight, Player, MatchSummary } from "./fieldtracer";
import { resolveJerseyKit } from "./fieldtracer";

export type TxLineEvent = {
  type: string;
  data: any;
  timestamp?: number;
};

export type ParsedFixtureData = {
  fixtureId: number;
  match: MatchSummary;
  events: MatchEvent[];
  highlights: MatchHighlight[];
  players: Player[];
  homeTeam: {
    name: string;
    code: string;
    score: number;
  };
  awayTeam: {
    name: string;
    code: string;
    score: number;
  };
};

export function parseTxLineFixture(rawData: string, fixtureId: number): ParsedFixtureData | null {
  try {
    // TxLINE returns event-stream format, parse it
    const lines = rawData.split('\n').filter(line => line.trim());
    const txlineEvents: TxLineEvent[] = [];
    
    let currentEvent: Partial<TxLineEvent> = {};
    
    for (const line of lines) {
      if (line.startsWith('event:')) {
        currentEvent.type = line.substring(6).trim();
      } else if (line.startsWith('data:')) {
        try {
          const jsonData = line.substring(5).trim();
          currentEvent.data = JSON.parse(jsonData);
          if (currentEvent.type) {
            txlineEvents.push(currentEvent as TxLineEvent);
          }
          currentEvent = {};
        } catch {
          // Skip invalid JSON
        }
      }
    }

    // Try to parse as JSON if not event-stream
    if (txlineEvents.length === 0) {
      try {
        const jsonData = JSON.parse(rawData);
        if (Array.isArray(jsonData)) {
          txlineEvents.push(...jsonData.map(data => ({ type: 'event', data })));
        } else {
          txlineEvents.push({ type: 'fixture', data: jsonData });
        }
      } catch {
        // Not valid JSON either
      }
    }

    if (txlineEvents.length === 0) {
      return null;
    }

    // Extract fixture metadata
    let homeTeam = { name: "Team 1", code: "T01", score: 0 };
    let awayTeam = { name: "Team 2", code: "T02", score: 0 };
    let stage = "Match";
    let status = "Full time";

    // Find fixture/score events
    const fixtureEvent = txlineEvents.find(e => 
      e.type === 'fixture' || 
      e.type === 'score' || 
      e.type === 'match' ||
      e.data?.homeTeam || 
      e.data?.home_team
    );

    if (fixtureEvent?.data) {
      const data = fixtureEvent.data;
      homeTeam = {
        name: data.homeTeam || data.home_team || data.home || "Team 1",
        code: (data.homeCode || data.home_code || data.homeTeam || data.home || "T01").slice(0, 3).toUpperCase(),
        score: data.homeScore ?? data.home_score ?? data.scoreHome ?? 0,
      };
      awayTeam = {
        name: data.awayTeam || data.away_team || data.away || "Team 2",
        code: (data.awayCode || data.away_code || data.awayTeam || data.away || "T02").slice(0, 3).toUpperCase(),
        score: data.awayScore ?? data.away_score ?? data.scoreAway ?? 0,
      };
      stage = data.stage || data.round || "Match";
      status = data.status || "Full time";
    }

    // Parse goals
    const goalEvents = txlineEvents.filter(e => 
      e.type === 'goal' || 
      e.data?.eventType === 'goal' ||
      e.data?.type === 'goal'
    );

    const parsedHighlights: MatchHighlight[] = goalEvents.map((goal, index) => {
      const data = goal.data;
      const minute = data.minute || data.matchMinute || Math.floor((data.second || 0) / 60) || 10 + index * 20;
      const second = data.second || minute * 60;
      const scorer = data.player || data.scorer || data.playerName || `Player ${data.playerId || index + 1}`;
      const team = data.team === 'home' || data.homeTeam ? 'home' : 'away';
      const playerId = data.playerId || data.player_id || 100 + index;

      return {
        id: `highlight-goal-${minute}-${index}`,
        eventId: `goal-${minute}`,
        second,
        startSecond: second - 20,
        endSecond: second + 10,
        team,
        title: `${team === 'home' ? homeTeam.name : awayTeam.name} scores`,
        scorer,
        playerId,
        txlinePlayerId: playerId,
        score: team === 'home' ? `${homeTeam.score}-${awayTeam.score}` : `${homeTeam.score}-${awayTeam.score}`,
        goalType: data.goalType || "Shot",
      } as MatchHighlight;
    });

    // Parse events (goals, corners, cards, etc.)
    const parsedEvents: MatchEvent[] = [];
    
    txlineEvents.forEach((event, index) => {
      const data = event.data;
      const eventType = data.eventType || data.type || event.type;
      
      let matchEventType: MatchEvent['type'] = 'possession';
      if (eventType?.toLowerCase().includes('goal')) matchEventType = 'goal';
      else if (eventType?.toLowerCase().includes('corner')) matchEventType = 'corner';
      else if (eventType?.toLowerCase().includes('card')) matchEventType = 'card';
      else if (eventType?.toLowerCase().includes('shot')) matchEventType = 'shot';
      else if (eventType?.toLowerCase().includes('var')) matchEventType = 'var';
      else if (eventType?.toLowerCase().includes('sub')) matchEventType = 'substitution';

      const minute = data.minute || data.matchMinute || index * 5;
      const second = data.second || minute * 60;
      const team = data.team === 'home' || data.homeTeam ? 'home' : 'away';

      parsedEvents.push({
        id: `event-${index}`,
        second,
        type: matchEventType,
        team,
        title: data.title || data.description || `${eventType} event`,
        detail: data.detail || data.description || `Event at ${minute}'`,
        intensity: matchEventType === 'goal' ? 100 : 40 + Math.random() * 40,
      });
    });

    // Sort events by time
    parsedEvents.sort((a, b) => a.second - b.second);

    // Parse lineups
    const lineupEvents = txlineEvents.filter(e => 
      e.type === 'lineup' || 
      e.data?.lineup ||
      e.data?.players
    );

    const parsedPlayers: Player[] = [];
    const homeShape = [[7,50],[22,18],[20,39],[20,62],[22,82],[39,37],[39,64],[56,50],[66,22],[72,48],[65,78]];
    const awayShape = [[93,50],[79,18],[81,39],[81,62],[79,82],[63,37],[63,64],[48,50],[36,22],[29,48],[36,78]];

    lineupEvents.forEach(event => {
      const lineup = event.data?.lineup || event.data?.players || event.data;
      if (Array.isArray(lineup)) {
        lineup.forEach((player: any, idx: number) => {
          const team = player.team === 'home' || player.homeTeam ? 'home' : 'away';
          const shape = team === 'home' ? homeShape : awayShape;
          const position = shape[idx % shape.length] || [50, 50];

          parsedPlayers.push({
            id: parsedPlayers.length + 1,
            name: player.name || player.playerName || `Player ${player.number || idx + 1}`,
            number: player.number || player.shirtNumber || idx + 1,
            txlinePlayerId: player.playerId || player.player_id,
            starter: player.starter !== false,
            feedStats: {
              goals: player.goals || 0,
              yellowCards: player.yellowCards || 0,
              redCards: player.redCards || 0,
              penaltyGoals: player.penaltyGoals || 0,
              penaltyAttempts: player.penaltyAttempts || 0,
            },
            team,
            countryCode: team === 'home' ? homeTeam.code : awayTeam.code,
            kit: resolveJerseyKit(team === 'home' ? homeTeam.code : awayTeam.code),
            x: position[0],
            y: position[1],
          });
        });
      }
    });

    // If no players found, create default lineups
    if (parsedPlayers.length === 0) {
      homeShape.forEach(([x, y], idx) => {
        parsedPlayers.push({
          id: idx + 1,
          name: `${homeTeam.name} Player ${idx + 1}`,
          number: idx + 1,
          starter: true,
          feedStats: { goals: 0, yellowCards: 0, redCards: 0, penaltyGoals: 0, penaltyAttempts: 0 },
          team: 'home',
          countryCode: homeTeam.code,
          kit: resolveJerseyKit(homeTeam.code),
          x, y,
        });
      });

      awayShape.forEach(([x, y], idx) => {
        parsedPlayers.push({
          id: parsedPlayers.length + 1,
          name: `${awayTeam.name} Player ${idx + 1}`,
          number: idx + 1,
          starter: true,
          feedStats: { goals: 0, yellowCards: 0, redCards: 0, penaltyGoals: 0, penaltyAttempts: 0 },
          team: 'away',
          countryCode: awayTeam.code,
          kit: resolveJerseyKit(awayTeam.code),
          x, y,
        });
      });
    }

    const match: MatchSummary = {
      fixtureId,
      home: homeTeam.name,
      away: awayTeam.name,
      homeCode: homeTeam.code,
      awayCode: awayTeam.code,
      homeScore: homeTeam.score,
      awayScore: awayTeam.score,
      stage,
      status,
    };

    return {
      fixtureId,
      match,
      events: parsedEvents,
      highlights: parsedHighlights,
      players: parsedPlayers,
      homeTeam,
      awayTeam,
    };
  } catch (error) {
    console.error("Failed to parse TxLINE fixture:", error);
    return null;
  }
}
