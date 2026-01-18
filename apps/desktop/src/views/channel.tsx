import type { DirectionLR } from "@/config";
import { User } from "../components/user";
import { cn } from "@/utils/tw";
import { useAppStore } from "../store";
import { useConfigValue } from "@/hooks/use-config-value";

export const ChannelView = ({ alignDirection }: { alignDirection: DirectionLR }) => {
  const { users, me } = useAppStore();

  const { value: showOnlyTalkingUsers } = useConfigValue("showOnlyTalkingUsers");
  const { value: showOwnUser } = useConfigValue("showOwnUser");
  const { value: opacity } = useConfigValue("opacity");
  const { value: opacityTarget } = useConfigValue("opacityTarget");
  const { value: userScale } = useConfigValue("userScale");
  const { value: vertical } = useConfigValue("vertical");

  const allUsers = Object.entries(users);
  let userList = showOnlyTalkingUsers ? allUsers.filter(([, item]) => item.talking) : allUsers;

  userList = userList.filter(([, item]) => {
    if (item.id === me?.id) {
      return showOwnUser && (showOnlyTalkingUsers ? item.talking : true);
    }
    return true;
  });

  return (
    <div className="h-full">
      <div
        className={cn("py-2 h-full", {
          "flex flex-wrap justify-center": alignDirection === "center",
          "flex flex-1 flex-col": alignDirection !== "center",
          "justify-end": alignDirection !== "center" && vertical === "bottom",
          "justify-start": alignDirection !== "center" && vertical !== "bottom",
          "overflow-auto": userScale === 100,
          "overflow-visible": userScale !== 100,
        })}
        style={{ maxHeight: "100%" }}
      >
        {userList.map(([, item]) => (
          <User
            key={item.id}
            item={item}
            alignDirection={alignDirection}
            opacity={opacity}
            opacityTarget={opacityTarget}
            userScale={userScale}
          />
        ))}
      </div>
    </div>
  );
};
