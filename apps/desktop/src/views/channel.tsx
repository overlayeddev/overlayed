import type { DirectionLR } from "@/store";
import { User } from "../components/user";
import { useAppStore } from "../store";

export const ChannelView = ({ alignDirection }: { alignDirection: DirectionLR }) => {
  const { users, me, settings } = useAppStore();

  const showOnlyTalkingUsers = settings.showOnlyTalkingUsers;
  const showOwnUser = settings.showOwnUser;
  const opacity = settings.opacity;

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
          <User key={item.id} item={item} alignDirection={alignDirection} opacity={opacity} />
        ))}
      </div>
    </div>
  );
};
