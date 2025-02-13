import type { DirectionLR } from "@/store";
import type { OverlayedUser } from "../types";
import { HeadphonesOff } from "./icons/headphones-off";
import { MicOff } from "./icons/mic-off";

export const User = ({
  item,
  alignDirection,
  opacity,
}: {
  item: OverlayedUser;
  alignDirection: DirectionLR;
  opacity: number;
}) => {
  const { id, selfMuted, selfDeafened, talking, muted, deafened, avatarHash } = item;

  const avatarUrl = avatarHash ? `https://cdn.discordapp.com/avatars/${id}/${avatarHash}.jpg` : "/img/default.png";

  const talkingClass = talking ? "border-green-500" : "border-zinc-800";
  const mutedClass = selfMuted || muted ? "text-zinc-400" : "";
  const opacityStyle = talking ? "100%" : `${opacity}%`;

  // TODO: use tw merge so this looks better i guess

  function renderCheeseMicIcon() {
    let icon = null;

    if (selfMuted) {
      icon = <MicOff className={muted ? "fill-red-600" : "fill-neutral-400"} />;
    }

    if (selfDeafened) {
      icon = <HeadphonesOff className={deafened ? "fill-red-600" : "fill-neutral-400"} />;
    }

    if (muted) {
      icon = <MicOff className="fill-red-600" />;
    }

    if (deafened) {
      icon = <HeadphonesOff className="fill-red-600" />;
    }

    const anyState = selfMuted || selfDeafened || muted || deafened;

    return (
      <div
        className={`absolute left-[12px] bottom-[-8px] pr-[4px] py-[2px] min-w-[24px] h-[24px] ${anyState ? "bg-black/80" : "bg-transparent"} rounded-full ${
          alignDirection == "center" ? "flex" : "md:hidden"
        }`}
      >
        {icon}
      </div>
    );
  }

  return (
    <div
      className={`flex gap-2 py-1 p-2 justify-start items-center transition-opacity ${
        alignDirection == "right" ? "flex-row-reverse" : "flex-row"
      }`}
      style={{ opacity: opacityStyle }}
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

        {/* This is cheese string mode */}
        {renderCheeseMicIcon()}
      </div>

      {/* This is the normal list */}
      <div
        className={`max-w-[calc(100%_-_50px)] md:flex hidden pointer-events-none items-center rounded-md bg-zinc-800 ${mutedClass} p-1 pl-2 pr-2 ${
          alignDirection == "center" ? "hidden md:hidden" : ""
        }`}
      >
        <span className="truncate text-ellipsis">{item.username}</span>
        <div className="flex">
          {(selfMuted || muted) && <MicOff className={muted ? "fill-red-600" : "fill-current"} />}
          {(selfDeafened || deafened) && <HeadphonesOff className={deafened ? "fill-red-600" : "fill-current"} />}
        </div>
      </div>
    </div>
  );
};
