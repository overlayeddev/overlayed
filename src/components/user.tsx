import { OverlayedUser } from "../types";

export const User = ({ item }: { item: OverlayedUser }) => {
  const { id, avatarHash } = item;

  const avatarUrl = avatarHash
    ? `https://cdn.discordapp.com/avatars/${id}/${avatarHash}.jpg`
    : "./img/default.png";

  const talkingClass = item.talking ? "border-green-500" : "border-slate-900";

  return (
    <div data-tauri-drag-region className="flex py-1 p-2 items-center">
      <div
        className={`pointer-events-none rounded-full bg-black w-8 h-8 border-2 mr-2 ${talkingClass}`}
      >
        <img src={avatarUrl} alt="avatar" className="rounded-full" />
      </div>

      <div data-tauri-drag-region className="pointer-events-none rounded-md bg-zinc-800 p-1 pl-2 pr-2">
        {item.username}
      </div>
    </div>
  );
};
