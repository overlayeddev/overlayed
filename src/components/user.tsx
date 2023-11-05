import { OverlayedUser } from "../types";
import { MicOff, Headphones } from "lucide-react";

export const User = ({ item }: { item: OverlayedUser }) => {
  const { id, selfMuted, selfDeafened, talking, avatarHash } = item;

  const avatarUrl = avatarHash
    ? `https://cdn.discordapp.com/avatars/${id}/${avatarHash}.jpg`
    : "./img/default.png";

  const talkingClass = talking ? "border-green-500" : "border-slate-900";
  const mutedClass = selfMuted ? "text-zinc-400" : "";

  return (
    <div data-tauri-drag-region className="flex py-1 p-2 items-center">
      <div
        className={`pointer-events-none rounded-full bg-black w-8 h-8 border-2 mr-2 ${talkingClass}`}
      >
        <img src={avatarUrl} alt="avatar" className="rounded-full" />
      </div>

      <div
        data-tauri-drag-region
        className={`pointer-events-none flex items-center rounded-md bg-zinc-800 ${mutedClass} p-1 pl-2 pr-2`}
      >
        <p>{item.username}</p>
        <div className="flex">
          {selfMuted && (
            <svg
              className="ml-1"
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
            >
              <path
                className="fill-current text-zinc-400"
                d="M19 11c0 1.19-.34 2.3-.9 3.28l-1.23-1.23c.27-.62.43-1.31.43-2.05H19m-4 .16L9 5.18V5a3 3 0 0 1 3-3a3 3 0 0 1 3 3v6.16M4.27 3L21 19.73L19.73 21l-4.19-4.19c-.77.46-1.63.77-2.54.91V21h-2v-3.28c-3.28-.49-6-3.31-6-6.72h1.7c0 3 2.54 5.1 5.3 5.1c.81 0 1.6-.19 2.31-.52l-1.66-1.66L12 14a3 3 0 0 1-3-3v-.72L3 4.27L4.27 3Z"
              />
            </svg>
          )}
          {selfDeafened && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                d="M12 1a9 9 0 0 1 9 9v7c0 .62-.19 1.19-.5 1.67L15 13.18V12h4v-2a7 7 0 0 0-7-7c-2 0-3.77.82-5.04 2.14L5.55 3.72A8.96 8.96 0 0 1 12 1M2.78 3.5L20.5 21.22l-1.27 1.28l-2.5-2.5H15v-1.73l-6-6V20H6a3 3 0 0 1-3-3v-7c0-1.11.2-2.18.57-3.16L1.5 4.77L2.78 3.5m2.39 4.94C5.06 8.94 5 9.46 5 10v2h3.73L5.17 8.44Z"
              />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
};
