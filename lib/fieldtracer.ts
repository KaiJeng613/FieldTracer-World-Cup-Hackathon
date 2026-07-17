export type MatchEventType =
  | "goal"
  | "shot"
  | "corner"
  | "card"
  | "var"
  | "substitution"
  | "possession";

export type MatchEvent = {
  id: string;
  second: number;
  type: MatchEventType;
  team: "home" | "away";
  title: string;
  detail: string;
  intensity: number;
};

export type MatchHighlight = {
  id: string;
  eventId: string;
  second: number;
  startSecond: number;
  endSecond: number;
  team: "home" | "away";
  title: string;
  scorer: string;
  playerId: number;
  txlinePlayerId: number;
  score: string;
  goalType: string;
};

export type MatchSummary = {
  fixtureId: number;
  home: string;
  away: string;
  homeCode: string;
  awayCode: string;
  homeScore: number;
  awayScore: number;
  stage: string;
  status: string;
};

export type ExplorerGoal = {
  minute: number;
  player: string;
  team: string;
  resolved: boolean;
};

export type ExplorerMatch = MatchSummary & {
  date: string;
  kickoff: string;
  duration: "90 min" | "Extra time";
  capture: "Historical replay" | "Live capture";
  goals: ExplorerGoal[];
};

export type PlayerLeader = {
  rank: number;
  name: string;
  team: string;
  goals: number;
  appearances: number;
  impact: number;
  fixtureId: number;
};

export type Player = {
  id: number;
  name: string;
  number: number;
  txlinePlayerId?: number;
  starter?: boolean;
  feedStats: PlayerFeedStats;
  team: "home" | "away";
  countryCode: string;
  kit: JerseyKit;
  x: number;
  y: number;
};

export type PlayerFeedStats = {
  goals: number;
  yellowCards: number;
  redCards: number;
  penaltyGoals: number;
  penaltyAttempts: number;
};

export type JerseyPattern = "solid" | "center-stripe" | "tricolor" | "vertical-stripes";

export type JerseyKit = {
  primary: string;
  secondary: string;
  accent: string;
  shadow: string;
  pattern: JerseyPattern;
  source: "txline" | "country-fallback";
};

const txlineColors: Record<string, string> = {
  red: "#d52232",
  white: "#f7f8fc",
  blue: "#2456c8",
  green: "#138653",
  black: "#171a24",
  yellow: "#f2c62c",
};

const countryKits: Record<string, Omit<JerseyKit, "source">> = {
  FRA: { primary: "#214fb8", secondary: "#ffffff", accent: "#ef3340", shadow: "#102b72", pattern: "tricolor" },
  MAR: { primary: "#d52232", secondary: "#0e8f55", accent: "#25ce78", shadow: "#71101c", pattern: "center-stripe" },
  ARG: { primary: "#f7f8fc", secondary: "#74c8ec", accent: "#d6ad35", shadow: "#3f8db8", pattern: "vertical-stripes" },
};

export function resolveJerseyKit(countryCode: string, txlineColor?: string): JerseyKit {
  const country = countryKits[countryCode.toUpperCase()];
  const feedColor = txlineColor ? txlineColors[txlineColor.toLowerCase()] : undefined;

  if (country) {
    return {
      ...country,
      primary: feedColor || country.primary,
      source: feedColor ? "txline" : "country-fallback",
    };
  }

  const primary = feedColor || "#f7f8fc";
  return {
    primary,
    secondary: primary === txlineColors.white ? "#26324d" : "#f7f8fc",
    accent: primary,
    shadow: primary === txlineColors.white ? "#aeb6c8" : "#4b5264",
    pattern: "solid",
    source: feedColor ? "txline" : "country-fallback",
  };
}

export const matches: MatchSummary[] = [
  { fixtureId: 18209181, home: "France", away: "Morocco", homeCode: "FRA", awayCode: "MAR", homeScore: 2, awayScore: 0, stage: "Round of 16", status: "Full time" },
  { fixtureId: 18213979, home: "Team 1", away: "Team 2", homeCode: "T01", awayCode: "T02", homeScore: 1, awayScore: 2, stage: "Knockout · AET", status: "Full time" },
  { fixtureId: 18218149, home: "Team 1", away: "Team 2", homeCode: "T01", awayCode: "T02", homeScore: 2, awayScore: 1, stage: "Knockout", status: "Full time" },
  { fixtureId: 18222446, home: "Team 1", away: "Team 2", homeCode: "T01", awayCode: "T02", homeScore: 3, awayScore: 1, stage: "Knockout · AET", status: "Full time" },
  { fixtureId: 18237038, home: "Team 1", away: "Team 2", homeCode: "T01", awayCode: "T02", homeScore: 0, awayScore: 2, stage: "Knockout", status: "Full time" },
  { fixtureId: 18241006, home: "Team 1", away: "Team 2", homeCode: "T01", awayCode: "T02", homeScore: 1, awayScore: 2, stage: "Knockout", status: "Full time" },
];

export const explorerMatches: ExplorerMatch[] = [
  {
    ...matches[0], date: "09 Jul 2026", kickoff: "20:00 UTC", duration: "90 min", capture: "Historical replay",
    goals: [
      { minute: 59, player: "Kylian Mbappe", team: "France", resolved: true },
      { minute: 65, player: "Ousmane Dembele", team: "France", resolved: true },
    ],
  },
  {
    ...matches[1], home: "Norway", away: "England", homeCode: "NOR", awayCode: "ENG", date: "11 Jul 2026", kickoff: "21:00 UTC", duration: "Extra time", capture: "Historical replay",
    goals: [
      { minute: 35, player: "Andreas Schjelderup", team: "Norway", resolved: true },
      { minute: 46, player: "Jude Bellingham", team: "England", resolved: true },
      { minute: 92, player: "Jude Bellingham", team: "England", resolved: true },
    ],
  },
  {
    ...matches[2], home: "Spain", away: "Belgium", homeCode: "ESP", awayCode: "BEL", date: "10 Jul 2026", kickoff: "19:00 UTC", duration: "90 min", capture: "Historical replay",
    goals: [
      { minute: 29, player: "Fabian Ruiz", team: "Spain", resolved: true },
      { minute: 40, player: "Charles De Ketelaere", team: "Belgium", resolved: true },
      { minute: 87, player: "Mikel Merino", team: "Spain", resolved: true },
    ],
  },
  {
    ...matches[3], home: "Argentina", away: "Switzerland", homeCode: "ARG", awayCode: "SUI", date: "12 Jul 2026", kickoff: "01:00 UTC", duration: "Extra time", capture: "Historical replay",
    goals: [
      { minute: 9, player: "Alexis Mac Allister", team: "Argentina", resolved: true },
      { minute: 66, player: "Dan Ndoye", team: "Switzerland", resolved: true },
      { minute: 111, player: "Julian Alvarez", team: "Argentina", resolved: true },
      { minute: 120, player: "Lautaro Martinez", team: "Argentina", resolved: true },
    ],
  },
  {
    ...matches[4], date: "14 Jul 2026", kickoff: "19:00 UTC", duration: "90 min", capture: "Live capture",
    goals: [{ minute: 57, player: "Player 907005", team: "Team 2", resolved: false }],
  },
  {
    ...matches[5], date: "15 Jul 2026", kickoff: "19:00 UTC", duration: "90 min", capture: "Live capture",
    goals: [
      { minute: 54, player: "Player 911404", team: "Team 1", resolved: false },
      { minute: 84, player: "Player 10035609", team: "Team 2", resolved: false },
      { minute: 91, player: "Player 948167", team: "Team 2", resolved: false },
    ],
  },
];

// FieldTracer impact is a transparent contribution score, not an official TxLINE rating.
export const playerLeaders: PlayerLeader[] = [
  { rank: 1, name: "Jude Bellingham", team: "England", goals: 2, appearances: 1, impact: 9.4, fixtureId: 18213979 },
  { rank: 2, name: "Kylian Mbappe", team: "France", goals: 1, appearances: 1, impact: 8.8, fixtureId: 18209181 },
  { rank: 3, name: "Julian Alvarez", team: "Argentina", goals: 1, appearances: 1, impact: 8.6, fixtureId: 18222446 },
  { rank: 4, name: "Ousmane Dembele", team: "France", goals: 1, appearances: 1, impact: 8.4, fixtureId: 18209181 },
  { rank: 5, name: "Fabian Ruiz", team: "Spain", goals: 1, appearances: 1, impact: 8.2, fixtureId: 18218149 },
];

export const events: MatchEvent[] = [
  { id: "corner-20", second: 1188, type: "corner", team: "home", title: "France corner", detail: "Pressure building down the left channel", intensity: 58 },
  { id: "shot-20", second: 1219, type: "shot", team: "home", title: "Shot attempt", detail: "First contact after the corner", intensity: 71 },
  { id: "corner-23", second: 1389, type: "corner", team: "away", title: "Morocco corner", detail: "Quick transition forces a set piece", intensity: 56 },
  { id: "var-26", second: 1550, type: "var", team: "home", title: "VAR review", detail: "Possible incident checked and cleared", intensity: 38 },
  { id: "shot-46", second: 2756, type: "shot", team: "home", title: "Sustained pressure", detail: "Four linked shot frames in the TxLINE feed", intensity: 82 },
  { id: "goal-59", second: 3560, type: "goal", team: "home", title: "Goal · France", detail: "Breakthrough at 59:20", intensity: 100 },
  { id: "sub-61", second: 3683, type: "substitution", team: "away", title: "Morocco change", detail: "Fresh legs introduced after conceding", intensity: 34 },
  { id: "card-62", second: 3756, type: "card", team: "away", title: "Yellow card", detail: "Challenge stops the next phase", intensity: 47 },
  { id: "goal-65", second: 3922, type: "goal", team: "home", title: "Goal · France", detail: "Second goal at 65:22", intensity: 100 },
  { id: "corner-72", second: 4341, type: "corner", team: "away", title: "Morocco corner", detail: "Late attacking spell begins", intensity: 63 },
  { id: "shot-83", second: 4970, type: "shot", team: "away", title: "Morocco shot", detail: "Attempt from sustained possession", intensity: 76 },
  { id: "shot-93", second: 5612, type: "shot", team: "home", title: "Final France attempt", detail: "Closing action before full time", intensity: 66 },
];

// Goal metadata resolved from the TxLINE goal and lineup events in fixture 18209181.
// Spatial movement remains reconstructed because this feed does not contain tracking coordinates.
export const highlights: MatchHighlight[] = [
  {
    id: "highlight-goal-59",
    eventId: "goal-59",
    second: 3560,
    startSecond: 3538,
    endSecond: 3570,
    team: "home",
    title: "France break the deadlock",
    scorer: "Kylian Mbappe",
    playerId: 10,
    txlinePlayerId: 453928,
    score: "1-0",
    goalType: "Shot",
  },
  {
    id: "highlight-goal-65",
    eventId: "goal-65",
    second: 3922,
    startSecond: 3900,
    endSecond: 3932,
    team: "home",
    title: "France double the lead",
    scorer: "Ousmane Dembele",
    playerId: 9,
    txlinePlayerId: 413676,
    score: "2-0",
    goalType: "Shot",
  },
];

const homeNames = ["Maignan", "Koundé", "Saliba", "Upamecano", "Hernández", "Tchouaméni", "Rabiot", "Griezmann", "Dembélé", "Mbappé", "Thuram"];
const awayNames = ["Bounou", "Hakimi", "Aguerd", "Saïss", "Mazraoui", "Amrabat", "Ounahi", "Ziyech", "Boufal", "En-Nesyri", "Ezzalzouli"];
const homeShape = [[7,50],[22,18],[20,39],[20,62],[22,82],[39,37],[39,64],[56,50],[66,22],[72,48],[65,78]];
const awayShape = [[93,50],[79,18],[81,39],[81,62],[79,82],[63,37],[63,64],[48,50],[36,22],[29,48],[36,78]];
const homeTxlineIds: Array<number | undefined> = [450704, 602326, 1023287, 493403, undefined, undefined, 182068, undefined, 413676, 453928, undefined];
const awayTxlineIds: Array<number | undefined> = [313097, 664273, undefined, undefined, 453867, undefined, 10092778, undefined, undefined, undefined, undefined];
const capturedPlayerStats: Record<number, Partial<PlayerFeedStats>> = {
  413676: { goals: 1 },
  453928: { goals: 1 },
};

function feedStatsFor(txlinePlayerId?: number): PlayerFeedStats {
  return {
    goals: 0,
    yellowCards: 0,
    redCards: 0,
    penaltyGoals: 0,
    penaltyAttempts: 0,
    ...(txlinePlayerId ? capturedPlayerStats[txlinePlayerId] : undefined),
  };
}

export const players: Player[] = [
  ...homeShape.map(([x, y], index) => ({ id: index + 1, name: homeNames[index], number: [16,5,17,4,22,8,14,7,11,10,15][index], txlinePlayerId: homeTxlineIds[index], starter: homeTxlineIds[index] ? true : undefined, feedStats: feedStatsFor(homeTxlineIds[index]), team: "home" as const, countryCode: "FRA", kit: resolveJerseyKit("FRA"), x, y })),
  ...awayShape.map(([x, y], index) => ({ id: index + 12, name: awayNames[index], number: [1,2,5,6,3,4,8,7,17,19,16][index], txlinePlayerId: awayTxlineIds[index], starter: awayTxlineIds[index] ? true : undefined, feedStats: feedStatsFor(awayTxlineIds[index]), team: "away" as const, countryCode: "MAR", kit: resolveJerseyKit("MAR"), x, y })),
];

export function formatClock(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60);
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

export function nearestEvent(second: number) {
  return events.reduce((nearest, event) =>
    Math.abs(event.second - second) < Math.abs(nearest.second - second) ? event : nearest,
  );
}

export function playerAt(player: Player, second: number) {
  const phase = second / 17 + player.id * 1.73;
  const event = nearestEvent(second);
  const proximity = Math.max(0, 1 - Math.abs(event.second - second) / 180);
  const direction = player.team === "home" ? 1 : -1;
  const surge = proximity * (event.team === player.team ? event.intensity / 18 : event.intensity / 34) * direction;
  return {
    x: Math.max(3, Math.min(97, player.x + Math.sin(phase / 7) * 2.4 + surge)),
    y: Math.max(4, Math.min(96, player.y + Math.cos(phase / 9) * 3.2 + Math.sin(player.id + second / 41) * proximity * 2)),
  };
}

export function ballAt(second: number) {
  const event = nearestEvent(second);
  const before = Math.max(0, Math.min(1, (second - event.second + 90) / 180));
  const home = event.team === "home";
  const targetX = event.type === "goal" ? (home ? 97 : 3) : home ? 68 : 32;
  return {
    x: 50 + (targetX - 50) * before + Math.sin(second / 13) * 3,
    y: 50 + Math.sin(second / 21) * 19,
  };
}
