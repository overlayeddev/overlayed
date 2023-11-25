import type { OverlayedUser } from "../types";
import { HeadphonesOff } from "./icons/headphones-off";
import { MicOff } from "./icons/mic-off";

export const User = ({ item }: { item: OverlayedUser }) => {
  const { id, selfMuted, selfDeafened, talking, avatarHash } = item;

  const avatarUrl = avatarHash ? `https://cdn.discordapp.com/avatars/${id}/${avatarHash}.jpg` : "/img/default.png";

  const talkingClass = talking ? "border-green-500" : "border-zinc-800";
  const mutedClass = selfMuted ? "text-zinc-400" : "";
  const mutedAndDeafened = selfMuted && selfDeafened;
  const avatarClass = selfMuted || selfDeafened ? "text-red-500" : "";

  return (
    <div className="flex flex-wrap py-1 p-2 items-center">
      <div className={`pointer-events-none relative rounded-full border-2 mr-2 ${avatarClass} ${talkingClass}`}>
        <img
          onError={e => {
            // @ts-ignore
            e.target.onerror = null;
            // @ts-ignore
            e.target.src = "/img/default.png";
          }}
          src={avatarUrl}
          alt="avatar"
          className="rounded-full w-8 h-8"
        />

        <div className="absolute flex md:hidden left-[10px] bottom-[-4px] bg-black rounded-full text-red-500">
          {mutedAndDeafened && <HeadphonesOff />}
          {selfMuted && !selfDeafened && <MicOff />}
        </div>
      </div>

      <div
        className={`max-w-[calc(100%_-_50px)] md:flex hidden pointer-events-none items-center rounded-md bg-zinc-800 ${mutedClass} p-1 pl-2 pr-2`}
      >
        <span className="truncate text-ellipsis">{item.username}</span>
        <div className="flex">
          {selfMuted && <MicOff />}
          {selfDeafened && <HeadphonesOff />}
        </div>
      </div>
    </div>
  );
};
