import { Button } from "@/components/ui/button";
import { Trash, PhoneOff, PhoneIncoming } from "lucide-react";
import { cn } from "@/utils/tw";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useEffect, useRef, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import type { UnlistenFn } from "@tauri-apps/api/event";
import { Event } from "@/constants";
import { useToast } from "@/components/ui/use-toast";
import { requestPermission, sendNotification } from "@tauri-apps/plugin-notification";
import { Checkbox } from "@/components/ui/checkbox";
import Config from "@/config";
import type { JoinHistoryLogUser } from "@/types";
import { useConfigValue } from "@/hooks/use-config-value";
import { emit } from "@tauri-apps/api/event";

const MAX_LOG_LENGTH = 420;

export const JoinHistory = () => {
  const [userLog, setUserLog] = useState<JoinHistoryLogUser[]>([]);
  const { value: joinHistoryNotifications } = useConfigValue("joinHistoryNotifications");

  const { toast } = useToast();
  const notificationListener = useRef<Promise<UnlistenFn> | null>(null);
  // NOTE: this might be considered a react ware crime
  const notificationsEnabledRef = useRef(false);

  useEffect(() => {
    if (notificationListener.current) return;

    // TODO: handle this better, maybe at the app level?
    requestPermission();

    notificationListener.current = listen(Event.UserLogUpdate, event => {
      const payload = event.payload as JoinHistoryLogUser;
      const { event: eventType, username } = payload;
      if (notificationsEnabledRef.current) {
        const joinLeave = eventType === "leave" ? "left" : "joined";
        // TODO: clicking this would be nice to pop open the join history tab
        // BLOCKED: by https://github.com/tauri-apps/tauri/issues/3698
        sendNotification({ title: "Join History", body: `${joinLeave.toUpperCase()} ${username}` });
      }

      setUserLog((prev: JoinHistoryLogUser[]) => {
        const newLog = [...prev, payload];
        if (newLog.length > MAX_LOG_LENGTH) {
          newLog.shift();
        }
        return newLog;
      });
    });
  }, []);

  // keep the notifications toggle in sync with the config
  useEffect(() => {
    // HACK: add a ref to avoid stale closure
    notificationsEnabledRef.current = joinHistoryNotifications;
  }, [joinHistoryNotifications]);

  const resetUserLog = () => {
    setUserLog([]);
  };

  return (
    <div className="flex flex-col pb-4">
      <p className="text-sm text-gray-400 mb-2">
        Display join/leave events in the voice chat useful for moderation purposes
      </p>
      <div className="flex items-center gap-4 pb-2">
        <div className="flex items-center">
          <Checkbox
            id="notification"
            checked={joinHistoryNotifications}
            onCheckedChange={async () => {
              await Config.set("joinHistoryNotifications", !joinHistoryNotifications);
              await emit("config_update", await Config.getConfig());
            }}
          />
          <label
            htmlFor="notification"
            className="ml-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Enable join/leave notifications
          </label>
        </div>
        <div className="flex-grow"></div>
        <Button size="sm" onClick={resetUserLog} variant="ghost" className="hover:bg-red-500">
          <span className="mr-2">Clear list</span>
          <Trash size={18} />
        </Button>
      </div>
      <div className="overflow-auto nice-scroll pb-4 h-[160px]">
        {[...userLog].reverse().map((item, i) => {
          const timeInSeconds = Math.floor(item.timestamp / 1000);
          const userInfoString = `${item.username} (${item.event}) <@${item.id}> <t:${timeInSeconds}:R>`;
          const Icon = item.event === "join" ? PhoneIncoming : PhoneOff;
          const className = item.event === "join" ? "text-green-500" : "text-red-500";
          return (
            <Tooltip key={`user-${i}-${item.id}`} disableHoverableContent delayDuration={100}>
              <TooltipTrigger asChild>
                <div className="text-lg cursor-pointer flex items-center text-white">
                  <Icon size={18} className={cn(className, "mr-2")} />{" "}
                  <span
                    onClick={() => {
                      navigator.clipboard.writeText(userInfoString);
                      toast({
                        title: "User Info Copied",
                        variant: "success",
                        description: `${item.username} (${item.event}) copied to clipboard`,
                        duration: 3000,
                      });
                    }}
                  >
                    {item.username}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent align="start">
                {item.username} ({item.event})
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
};
