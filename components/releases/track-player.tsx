"use client";

import { useRef, useState } from "react";
import type { ReleaseTrack } from "lib/content/releases";

function TrackPreview({
  track,
  onPlay,
}: {
  track: ReleaseTrack;
  onPlay: (audio: HTMLAudioElement) => void;
}) {
  const [failed, setFailed] = useState(false);
  if (track.audio.type !== "external" || !track.audio.url) return null;
  return (
    <div className="mt-3">
      <audio
        key={track.audio.url}
        src={track.audio.url}
        controls
        preload="none"
        aria-label={`Preview ${track.position}: ${track.title}`}
        className="h-9 w-full max-w-md"
        onPlay={(event) => onPlay(event.currentTarget)}
        onLoadedMetadata={() => setFailed(false)}
        onError={() => setFailed(true)}
      />
      {failed && (
        <p role="status" className="mt-2 text-xs text-neutral-400">
          This preview is currently unavailable.
        </p>
      )}
    </div>
  );
}

export function ReleaseTrackPlayer({ tracks }: { tracks: ReleaseTrack[] }) {
  const list = useRef<HTMLOListElement>(null);
  function play(selected: HTMLAudioElement) {
    list.current?.querySelectorAll("audio").forEach((audio) => {
      if (audio !== selected) audio.pause();
    });
  }
  return (
    <ol ref={list} className="space-y-5">
      {tracks.map((track) => (
        <li key={track.position} className="flex items-start gap-4">
          <span className="w-9 shrink-0 pt-0.5 text-xs text-neutral-400">
            {track.position}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">
              {track.title || "Untitled track"}
            </p>
            <TrackPreview
              key={`${track.position}-${track.audio.type === "external" ? track.audio.url : track.audio.type}`}
              track={track}
              onPlay={play}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}
