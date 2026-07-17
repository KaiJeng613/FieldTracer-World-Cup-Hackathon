import { Connection, clusterApiUrl } from "@solana/web3.js";
import { getReplayMoment } from "@/lib/replay-moments";
import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ signature: string }>;
  searchParams: Promise<{ network?: string }>;
};

export default async function ReplayMomentPage({ params, searchParams }: Props) {
  const { signature } = await params;
  const { network = "devnet" } = await searchParams;
  
  const endpoint = network === "mainnet" 
    ? clusterApiUrl("mainnet-beta")
    : clusterApiUrl("devnet");
  
  const connection = new Connection(endpoint);
  
  let moment;
  try {
    moment = await getReplayMoment(connection, signature);
  } catch (error) {
    console.error("Failed to load replay moment:", error);
  }

  if (!moment) {
    redirect("/");
  }

  const { teams, second, camera, fixtureId, description } = moment;
  const minute = Math.floor(second / 60);
  const secs = second % 60;

  return (
    <main style={{
      minHeight: "100vh",
      background: "radial-gradient(circle at 48% -18%, rgba(46,109,255,.23), transparent 36%), #050b25",
      color: "#f6f9ff",
      padding: "40px 20px",
    }}>
      <div style={{
        maxWidth: "800px",
        margin: "0 auto",
        background: "linear-gradient(145deg, rgba(12, 24, 61, .97), rgba(7, 16, 43, .98))",
        border: "1px solid rgba(132, 171, 255, .16)",
        borderRadius: "16px",
        padding: "32px",
        boxShadow: "0 20px 60px rgba(0,0,0,.4)",
      }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{
            width: "56px",
            height: "56px",
            margin: "0 auto 16px",
            display: "grid",
            placeItems: "center",
            borderRadius: "50%",
            background: "#b8ef25",
            color: "#0a120a",
            fontSize: "28px",
          }}>
            ⚽
          </div>
          <h1 style={{ margin: "0 0 8px", fontSize: "28px", letterSpacing: "-.03em" }}>
            Replay Moment
          </h1>
          <p style={{ margin: 0, color: "#8998bd", fontSize: "13px" }}>
            Saved on Solana blockchain
          </p>
        </div>

        <div style={{
          padding: "24px",
          background: "rgba(184, 239, 37, 0.08)",
          border: "1px solid rgba(184, 239, 37, 0.25)",
          borderRadius: "12px",
          marginBottom: "24px",
        }}>
          <h2 style={{ margin: "0 0 20px", fontSize: "20px", textAlign: "center" }}>
            {teams.home} vs {teams.away}
          </h2>
          
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            alignItems: "center",
            gap: "16px",
            marginBottom: "20px",
          }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "48px", fontWeight: 700, fontFamily: "monospace" }}>
                {teams.score.split("-")[0]}
              </div>
              <div style={{ fontSize: "14px", color: "#8998bd" }}>{teams.home}</div>
            </div>
            <div style={{ fontSize: "24px", color: "#8998bd" }}>—</div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "48px", fontWeight: 700, fontFamily: "monospace" }}>
                {teams.score.split("-")[1]}
              </div>
              <div style={{ fontSize: "14px", color: "#8998bd" }}>{teams.away}</div>
            </div>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
            padding: "16px",
            background: "rgba(0, 0, 0, 0.2)",
            borderRadius: "8px",
          }}>
            <div>
              <div style={{ fontSize: "10px", color: "#8998bd", marginBottom: "4px" }}>TIME</div>
              <div style={{ fontSize: "16px", fontWeight: 700 }}>{minute}&prime; {secs}&Prime;</div>
            </div>
            <div>
              <div style={{ fontSize: "10px", color: "#8998bd", marginBottom: "4px" }}>CAMERA</div>
              <div style={{ fontSize: "16px", fontWeight: 700 }}>{camera}</div>
            </div>
            <div>
              <div style={{ fontSize: "10px", color: "#8998bd", marginBottom: "4px" }}>FIXTURE ID</div>
              <div style={{ fontSize: "16px", fontWeight: 700, fontFamily: "monospace" }}>#{fixtureId}</div>
            </div>
            <div>
              <div style={{ fontSize: "10px", color: "#8998bd", marginBottom: "4px" }}>NETWORK</div>
              <div style={{ fontSize: "16px", fontWeight: 700, textTransform: "uppercase" }}>{network}</div>
            </div>
          </div>
        </div>

        <div style={{
          padding: "16px",
          background: "rgba(0, 0, 0, 0.25)",
          borderRadius: "8px",
          marginBottom: "24px",
        }}>
          <div style={{ fontSize: "10px", color: "#8998bd", marginBottom: "8px" }}>TRANSACTION SIGNATURE</div>
          <div style={{
            fontSize: "11px",
            fontFamily: "monospace",
            wordBreak: "break-all",
            color: "#b8ef25",
          }}>
            {signature}
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <a
            href="/"
            style={{
              flex: 1,
              minWidth: "200px",
              padding: "14px",
              background: "linear-gradient(110deg, #3673ff, #5639d4)",
              color: "white",
              textAlign: "center",
              borderRadius: "10px",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: "14px",
            }}
          >
            Watch Full Replay
          </a>
          <a
            href={`https://explorer.solana.com/tx/${signature}?cluster=${network}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flex: 1,
              minWidth: "200px",
              padding: "14px",
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(132, 171, 255, 0.16)",
              color: "#8998bd",
              textAlign: "center",
              borderRadius: "10px",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: "14px",
            }}
          >
            View on Explorer
          </a>
        </div>

        <p style={{
          marginTop: "24px",
          fontSize: "11px",
          color: "#8998bd",
          textAlign: "center",
          lineHeight: 1.6,
        }}>
          This replay moment is permanently stored on the Solana blockchain.
          <br />
          Created with FieldTracer - Interactive Football Intelligence
        </p>
      </div>
    </main>
  );
}

export async function generateMetadata({ params, searchParams }: Props) {
  const { signature } = await params;
  const { network = "devnet" } = await searchParams;
  
  const endpoint = network === "mainnet" 
    ? clusterApiUrl("mainnet-beta")
    : clusterApiUrl("devnet");
  
  const connection = new Connection(endpoint);
  
  let moment;
  try {
    moment = await getReplayMoment(connection, signature);
  } catch {
    return {
      title: "Replay Moment - FieldTracer",
    };
  }

  if (!moment) {
    return {
      title: "Replay Moment - FieldTracer",
    };
  }

  const minute = Math.floor(moment.second / 60);
  const title = `${moment.teams.home} vs ${moment.teams.away} (${moment.teams.score}) at ${minute}' - FieldTracer`;
  const description = `Watch this epic moment from ${moment.description} - saved on Solana blockchain`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
