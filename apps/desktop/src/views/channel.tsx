import type { DirectionLR } from "@/config";
import { User } from "../components/user";
import { useAppStore } from "../store";

export const ChannelView = ({ alignDirection }: { alignDirection: DirectionLR }) => {
  const { users } = useAppStore();

  return (
    <div>
      <div className={`py-2 ${alignDirection == "center" ? "flex flex-wrap justify-center" : ""}`}>
        {Object.entries(users).map(([_, item]) => (
          <User key={item.id} item={item} alignDirection={alignDirection} />
        ))}
      </div>
    </div>
  );
};