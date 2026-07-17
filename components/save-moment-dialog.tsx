"use client";

import { useState } from "react";
import { Check, Copy, Loader2, Share2, X } from "lucide-react";
import type { ReplayMoment } from "@/lib/replay-moments";
import { generateShareableUrl, generateTwitterShare, copyToClipboard } from "@/lib/replay-moments";

type SaveMomentDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  moment: ReplayMoment | null;
  isSaving: boolean;
  network: "mainnet" | "devnet";
};

export function SaveMomentDialog({ isOpen, onClose, moment, isSaving, network }: SaveMomentDialogProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareUrl = moment?.signature ? generateShareableUrl(moment.signature, network) : "";
  const twitterShare = moment?.signature ? generateTwitterShare(moment, shareUrl) : null;
  const explorerUrl = moment?.signature 
    ? `https://explorer.solana.com/tx/${moment.signature}?cluster=${network}`
    : "";

  const handleCopy = async () => {
    if (shareUrl) {
      const success = await copyToClipboard(shareUrl);
      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  const handleTwitterShare = () => {
    if (twitterShare) {
      window.open(twitterShare.url, "_blank", "width=550,height=420");
    }
  };

  return (
    <div 
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(2, 7, 19, 0.85)",
        backdropFilter: "blur(8px)",
        display: "grid",
        placeItems: "center",
        zIndex: 9999,
        padding: "20px",
      }}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "linear-gradient(145deg, rgba(12, 24, 61, .97), rgba(7, 16, 43, .98))",
          border: "1px solid rgba(132, 171, 255, .16)",
          borderRadius: "16px",
          padding: "24px",
          maxWidth: "480px",
          width: "100%",
          boxShadow: "0 20px 60px rgba(0,0,0,.4)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ margin: 0, fontSize: "18px", display: "flex", alignItems: "center", gap: "8px" }}>
            {isSaving ? (
              <>
                <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />
                Saving Moment...
              </>
            ) : moment?.signature ? (
              <>
                <Check size={20} style={{ color: "#b8ef25" }} />
                Moment Saved!
              </>
            ) : (
              "Save Replay Moment"
            )}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "1px solid rgba(132, 171, 255, .16)",
              borderRadius: "8px",
              width: "32px",
              height: "32px",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
              color: "#8998bd",
            }}
          >
            <X size={16} />
          </button>
        </div>

        {isSaving ? (
          <div style={{ padding: "40px 20px", textAlign: "center" }}>
            <p style={{ margin: 0, color: "#8998bd", fontSize: "12px" }}>
              Signing transaction with your wallet...
            </p>
            <p style={{ margin: "8px 0 0", color: "#8998bd", fontSize: "10px" }}>
              This will cost ~0.000005 SOL (~$0.001)
            </p>
          </div>
        ) : moment?.signature ? (
          <div style={{ display: "grid", gap: "16px" }}>
            <div style={{ 
              padding: "16px", 
              background: "rgba(184, 239, 37, 0.08)", 
              border: "1px solid rgba(184, 239, 37, 0.25)",
              borderRadius: "10px",
            }}>
              <div style={{ display: "grid", gap: "8px", fontSize: "11px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#8998bd" }}>Match:</span>
                  <strong>{moment.teams.home} vs {moment.teams.away}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#8998bd" }}>Score:</span>
                  <strong>{moment.teams.score}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#8998bd" }}>Time:</span>
                  <strong>{Math.floor(moment.second / 60)}&prime; {moment.second % 60}&Prime;</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#8998bd" }}>Camera:</span>
                  <strong>{moment.camera}</strong>
                </div>
              </div>
            </div>

            <div style={{ 
              padding: "12px", 
              background: "rgba(0, 0, 0, 0.25)",
              borderRadius: "8px",
              fontSize: "10px",
              fontFamily: "monospace",
              wordBreak: "break-all",
            }}>
              <div style={{ color: "#8998bd", marginBottom: "4px" }}>Transaction Signature:</div>
              <div style={{ color: "#b8ef25" }}>{moment.signature.slice(0, 32)}...{moment.signature.slice(-8)}</div>
            </div>

            <div style={{ display: "grid", gap: "8px" }}>
              <button
                onClick={handleTwitterShare}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "linear-gradient(90deg, #1DA1F2, #0c85d0)",
                  border: "none",
                  borderRadius: "8px",
                  color: "white",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                <Share2 size={16} />
                Share on Twitter
              </button>

              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "8px" }}>
                <button
                  onClick={handleCopy}
                  style={{
                    padding: "12px",
                    background: copied ? "rgba(184, 239, 37, 0.12)" : "rgba(54, 115, 255, 0.12)",
                    border: `1px solid ${copied ? "rgba(184, 239, 37, 0.3)" : "rgba(54, 115, 255, 0.3)"}`,
                    borderRadius: "8px",
                    color: copied ? "#b8ef25" : "#3673ff",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? "Copied!" : "Copy Link"}
                </button>

                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: "12px 16px",
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(132, 171, 255, 0.16)",
                    borderRadius: "8px",
                    color: "#8998bd",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    whiteSpace: "nowrap",
                  }}
                >
                  View on Explorer
                </a>
              </div>
            </div>

            <p style={{ 
              margin: "12px 0 0", 
              fontSize: "9px", 
              color: "#8998bd", 
              textAlign: "center",
              lineHeight: 1.5,
            }}>
              Your replay moment is permanently saved on Solana blockchain.
              <br />
              Anyone with the link can view and replay this exact moment.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
