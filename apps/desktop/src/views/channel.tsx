import type { DirectionLR } from "@/config";
import { User } from "../components/user";
import { useAppStore } from "../store";
import { useConfigValue } from "@/hooks/use-config-value";
import { useIntersectEvent } from "@/hooks/use-intersect";

export const ChannelView = ({ alignDirection }: { alignDirection: DirectionLR }) => {
  const { users, me } = useAppStore();

  const { value: showOnlyTalkingUsers } = useConfigValue("showOnlyTalkingUsers");

  const allUsers = Object.entries(users);
  const userList = showOnlyTalkingUsers ? allUsers.filter(([, item]) => item.talking || item.id === me?.id) : allUsers;

  useIntersectEvent(
    () => {
      document.body.style.opacity = "0.2";
    },
    () => {
      document.body.style.opacity = "1.0";
    }
  );

  return (
    <div>
      <div className={`py-2 ${alignDirection == "center" ? "flex flex-wrap justify-center" : ""}`}>
        {userList.map(([, item]) => (
          <User key={item.id} item={item} alignDirection={alignDirection} />
        ))}
      </div>
    </div>
  );
};
