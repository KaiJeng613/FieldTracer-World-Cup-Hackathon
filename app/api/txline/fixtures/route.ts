import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const jwt = process.env.TXLINE_GUEST_JWT;
  const apiToken = process.env.TXLINE_API_TOKEN;
  const origin = (process.env.TXLINE_API_ORIGIN || "https://txline-dev.txodds.com").replace(/\/$/, "");

  if (!jwt || !apiToken) {
    // Return demo/fallback data if not configured
    // Always ensure France vs Morocco is first
    return NextResponse.json({
      mode: "demo",
      fixtures: [
        { fixtureId: 18209181, home: "France", away: "Morocco", homeCode: "FRA", awayCode: "MAR", homeScore: 2, awayScore: 0, stage: "Round of 16", status: "Full time" },
        { fixtureId: 18213979, home: "Norway", away: "England", homeCode: "NOR", awayCode: "ENG", homeScore: 1, awayScore: 2, stage: "Knockout · AET", status: "Full time" },
        { fixtureId: 18218149, home: "Spain", away: "Belgium", homeCode: "ESP", awayCode: "BEL", homeScore: 2, awayScore: 1, stage: "Knockout", status: "Full time" },
        { fixtureId: 18222446, home: "Argentina", away: "Switzerland", homeCode: "ARG", awayCode: "SUI", homeScore: 3, awayScore: 1, stage: "Knockout · AET", status: "Full time" },
        { fixtureId: 18237038, home: "Team 1", away: "Team 2", homeCode: "T01", awayCode: "T02", homeScore: 0, awayScore: 2, stage: "Knockout", status: "Full time" },
        { fixtureId: 18241006, home: "Team 1", away: "Team 2", homeCode: "T01", awayCode: "T02", homeScore: 1, awayScore: 2, stage: "Knockout", status: "Full time" },
      ],
    });
  }

  try {
    // Fetch fixtures list from TxLINE API
    const response = await fetch(`${origin}/api/scores/fixtures`, {
      headers: {
        Authorization: `Bearer ${jwt}`,
        "X-Api-Token": apiToken,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`TxLINE API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform TxLINE data to match expected format
    const fixtures = Array.isArray(data) ? data : data.fixtures || [];
    
    const transformedFixtures = fixtures.map((fixture: any) => ({
      fixtureId: fixture.fixtureId || fixture.fixture_id || fixture.id,
      home: fixture.homeTeam || fixture.home_team || fixture.home || "Unknown",
      away: fixture.awayTeam || fixture.away_team || fixture.away || "Unknown",
      homeCode: (fixture.homeCode || fixture.home_code || fixture.homeTeam || fixture.home || "UNK").slice(0, 3).toUpperCase(),
      awayCode: (fixture.awayCode || fixture.away_code || fixture.awayTeam || fixture.away || "UNK").slice(0, 3).toUpperCase(),
      homeScore: fixture.homeScore ?? fixture.home_score ?? fixture.scoreHome ?? 0,
      awayScore: fixture.awayScore ?? fixture.away_score ?? fixture.scoreAway ?? 0,
      stage: fixture.stage || fixture.round || "Match",
      status: fixture.status || "Completed",
    }));

    // Ensure France vs Morocco (18209181) is always first if it exists
    const franceMatch = transformedFixtures.find((f: any) => f.fixtureId === 18209181);
    const otherMatches = transformedFixtures.filter((f: any) => f.fixtureId !== 18209181);
    
    const sortedFixtures = franceMatch ? [franceMatch, ...otherMatches] : transformedFixtures;
    
    return NextResponse.json({
      mode: "live",
      fixtures: sortedFixtures,
    });
  } catch (error) {
    console.error("Failed to fetch fixtures from TxLINE:", error);
    
    // Return fallback data on error
    return NextResponse.json({
      mode: "error",
      error: error instanceof Error ? error.message : "Failed to fetch fixtures",
      fixtures: [
        { fixtureId: 18209181, home: "France", away: "Morocco", homeCode: "FRA", awayCode: "MAR", homeScore: 2, awayScore: 0, stage: "Round of 16", status: "Full time" },
      ],
    });
  }
}
