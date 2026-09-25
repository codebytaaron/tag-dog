"use client";
import { useState } from "react";
import type { Video } from "@/lib/recap";

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;

export default function Highlights({ videos, fallback }: { videos: Video[]; fallback: string }) {
  const [i, setI] = useState(0);
  if (!videos.length) {
    return <a className="btn ghost" href={fallback} target="_blank" rel="noreferrer">▶ Find highlights on YouTube</a>;
  }
  const v = videos[i];
  return (
    <div className="hl">
      <video key={v.mp4} className="hlv" src={v.mp4} poster={v.thumb} controls playsInline preload="none" />
      <b className="hlt">{v.title}</b>
      {videos.length > 1 && (
        <div className="hllist">
          {videos.map((x, k) => (
            <button key={x.mp4} className={k === i ? "on" : ""} onClick={() => setI(k)}>
              <span className="hlth">{x.thumb && <img src={x.thumb} alt="" />}<em className="mono">{mmss(x.duration)}</em></span>
              <span className="hlc">{x.title}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
