import type { DirectionLR } from "@/config";
import type { OverlayedUser } from "../types";
import { HeadphonesOff } from "./icons/headphones-off";
import { MicOff } from "./icons/mic-off";

export const User = ({ item, alignDirection }: { item: OverlayedUser; alignDirection: DirectionLR }) => {
  const { id, selfMuted, selfDeafened, talking, muted, deafened, avatarHash } = item;

  const avatarUrl = avatarHash ? `https://cdn.discordapp.com/avatars/${id}/${avatarHash}.jpg` : "/img/default.png";

  const talkingClass = talking ? "border-green-500" : "border-zinc-800";
  const mutedClass = selfMuted || muted ? "text-zinc-400" : "";
  const mutedAndDeafened = selfMuted && selfDeafened;
  const avatarClass = selfMuted || selfDeafened ? "text-red-500" : "";

  // TODO: use tw merge so this looks better i guess

  return (
    <div
      className={`flex gap-2 py-1 p-2 justify-start items-center ${alignDirection == "right" ? "flex-row-reverse" : "flex-row"
        }`}
    >
      <div className={`pointer-events-none relative rounded-full border-2 ${talkingClass}`}>
        <img
          onError={e => {
            // @ts-expect-error need to fix this prolly
            e.target.onerror = null;
            // @ts-expect-error need to fix this prolly
            e.target.src = "/img/default.png";
          }}
          src={avatarUrl}
          alt="avatar"
          className="rounded-full w-8 h-8"
        />

        <div
          className={`absolute left-[10px] bottom-[-4px] bg-black rounded-full ${alignDirection == "center" ? "flaex" : "md:hidden"
            }`}
        >
          {(mutedAndDeafened || deafened) && <HeadphonesOff />}
          {(selfMuted || muted) && !selfDeafened && <MicOff className={muted ? "fill-red-600" : "fill-current"} />}
        </div>
      </div>

      <div
        className={`max-w-[calc(100%_-_50px)] md:flex hidden pointer-events-none items-center rounded-md bg-zinc-800 ${mutedClass} p-1 pl-2 pr-2 ${alignDirection == "center" ? "hidden md:hidden" : ""
          }`}
      >
        <span className="truncate text-ellipsis">{item.username}</span>
        <div className="flex">
          {(selfMuted || muted) && <MicOff className={muted ? "fill-red-600" : "fill-current"} />}
          {(selfDeafened || deafened) && <HeadphonesOff />}
        </div>
      </div>
    </div>
  );
};
