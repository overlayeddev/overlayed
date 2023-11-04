import { OverlayedUser } from "./types";

export const User = ({ item }: { item: OverlayedUser }) => {
  const { id, avatarHash } = item;

  const avatarUrl = avatarHash
    ? `https://cdn.discordapp.com/avatars/${id}/${avatarHash}.jpg`
    : "./img/default.png";

  const talkingClass = item.talking ? "border-green-500" : "border-slate-900";

  return (
    <div className="flex py-1 items-center">
      <div
        className={`rounded-full bg-black w-8 h-8 border-2 mr-2 ${talkingClass}`}
      >
        <img src={avatarUrl} alt="avatar" className="rounded-full" />
      </div>

      <div className="text-white rounded-md bg-zinc-900 p-1">{item.username}</div>
    </div>
  );
};
