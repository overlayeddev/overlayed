import type { DirectionLR } from "@/config";
import { User } from "../components/user";
import { cn } from "@/utils/tw";
import { useAppStore } from "../store";
import { useConfigValue } from "@/hooks/use-config-value";
import { getChannelName } from "@/utils/channel";

export const ChannelView = ({
  alignDirection,
  anchored,
  displayOnly,
}: {
  alignDirection: DirectionLR;
  anchored: boolean;
  displayOnly: boolean;
}) => {
  const { users, me, currentChannel } = useAppStore();

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

  const channelName = getChannelName(currentChannel);
  const rows = userList.map(([, item]) => (
    <User
      key={item.id}
      item={item}
      alignDirection={alignDirection}
      opacity={opacity}
      opacityTarget={opacityTarget}
      userScale={userScale}
      anchored={anchored}
    />
  ));

  return (
    <div
      className={
        anchored
          ? cn("flex flex-1 min-h-0 overflow-hidden", {
              "justify-start": alignDirection === "left",
              "[justify-content:safe_center]": alignDirection === "center",
              "[justify-content:safe_flex-end]": alignDirection === "right",
              "[align-items:safe_flex-end]": vertical === "bottom",
              "items-start": vertical !== "bottom",
            })
          : "h-full"
      }
    >
      <div
        data-placement-content={anchored ? "" : undefined}
        className={
          anchored
            ? cn("flex flex-col w-max shrink-0 overflow-hidden py-2", {
                "items-center": alignDirection === "center",
                "items-start": alignDirection === "left",
                "items-end": alignDirection === "right",
              })
            : cn("py-2 h-full", {
                "flex flex-wrap justify-center": alignDirection === "center",
                "flex flex-1 flex-col": alignDirection !== "center",
                "justify-end": alignDirection !== "center" && vertical === "bottom",
                "justify-start": alignDirection !== "center" && vertical !== "bottom",
                "overflow-auto": userScale === 100,
                "overflow-visible": userScale !== 100,
              })
        }
        style={anchored ? undefined : { maxHeight: "100%" }}
      >
        {displayOnly && channelName && (
          <div
            className="mx-2 mb-1 max-w-[280px] truncate rounded-md px-2 py-1 text-xs font-semibold text-white"
            title={channelName}
            style={{
              opacity: opacityTarget === "all" ? opacity / 100 : 1,
              backgroundColor: `rgba(40, 40, 40, ${opacityTarget === "username-box" ? opacity / 100 : 1})`,
            }}
          >
            {channelName}
          </div>
        )}
        {anchored ? (
          <div
            className={cn("flex w-max shrink-0 overflow-hidden", {
              "flex-row": alignDirection === "center",
              "flex-col items-start": alignDirection === "left",
              "flex-col items-end": alignDirection === "right",
            })}
          >
            {rows}
          </div>
        ) : (
          rows
        )}
      </div>
    </div>
  );
};
