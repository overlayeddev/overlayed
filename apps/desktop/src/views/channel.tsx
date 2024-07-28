import type { DirectionLR } from "@/config";
import { User } from "../components/user";
import { useAppStore } from "../store";
import { useConfigValue } from "@/hooks/use-config-value";

export const ChannelView = ({ alignDirection }: { alignDirection: DirectionLR }) => {
  const { users, me } = useAppStore();

  const { value: showOnlyTalkingUsers } = useConfigValue("showOnlyTalkingUsers");
  const { value: showOwnUser } = useConfigValue("showOwnUser");

  const allUsers = Object.entries(users);
  let userList = showOnlyTalkingUsers ? allUsers.filter(([, item]) => item.talking) : allUsers;

  userList = userList.filter(([, item]) => {
    if (item.id === me?.id) {
      return showOwnUser && (showOnlyTalkingUsers ? item.talking : true);
    }
    return true;
  });

  return (
    <div>
      <div className={`py-2 ${alignDirection === "center" ? "flex flex-wrap justify-center" : ""}`}>
        {userList.map(([, item]) => (
          <User key={item.id} item={item} alignDirection={alignDirection} />
        ))}
      </div>
    </div>
  );
};
