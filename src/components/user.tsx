import { OverlayedUser } from "../types";
import { HeadphonesOff } from "./headphones-off";
import { MicOff } from "./mic-off";

export const User = ({ item }: { item: OverlayedUser }) => {
  const { id, selfMuted, selfDeafened, talking, avatarHash } = item;

  const avatarUrl = avatarHash
    ? `https://cdn.discordapp.com/avatars/${id}/${avatarHash}.jpg`
    : "/img/default.png";

  const talkingClass = talking ? "border-green-500" : "border-zinc-800";
  const mutedClass = selfMuted ? "text-zinc-400" : "";

  return (
    <div data-tauri-drag-region className="flex py-1 p-2 items-center">
      <div
        className={`pointer-events-none rounded-full w-8 h-8 border-2 mr-2 ${talkingClass}`}
      >
        <img
          onError={(e) => {
            // @ts-ignore
            e.target.onerror = null;
            // @ts-ignore
            e.target.src = "/img/default.png";
          }}
          src={avatarUrl}
          alt="avatar"
          className="rounded-full"
        />
      </div>

      <div
        data-tauri-drag-region
        className={`pointer-events-none flex items-center rounded-md bg-zinc-800 ${mutedClass} p-1 pl-2 pr-2`}
      >
        <p>{item.username}</p>
        <div className="flex">
          {selfMuted && <MicOff />}
          {selfDeafened && <HeadphonesOff />}
        </div>
      </div>
    </div>
  );
};
