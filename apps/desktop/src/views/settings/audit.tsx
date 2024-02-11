import { Button } from "@/components/ui/button";
import { Eraser, PhoneOff, PhoneIncoming } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { Event } from "@/constants";

const MAX_LOG_LENGTH = 100;
export const Audit = () => {
  const [userLog, setUserLog] = useState<any[]>([]);
  useEffect(() => {
    const listener = async () => {
      return await listen(Event.UserLogUpdate, event => {
        setUserLog((prev: any) => {
          const newLog = [...prev, event.payload];
          if (newLog.length > MAX_LOG_LENGTH) {
            newLog.shift();
          }
          return newLog;
        });
      });
    };

    listener();
  }, []);

  const resetUserLog = () => {
    setUserLog([]);
  };

  return (
    <div className="flex flex-col text-center h-screen pb-4">
      <div className="flex items-center pb-4">
        <p className="text-2xl">Audit Log</p>
        <Button onClick={resetUserLog} variant="ghost" size="sm" className="w-20">
          <Eraser size={18} />
        </Button>
      </div>

      <div className="overflow-auto h-[230px]">
        {[...userLog].reverse().map((item, i) => {
          const timeInSeconds = Math.floor(item.timestamp / 1000);
          const userInfoString = `${item.username} (${item.event}) <@${item.id}> <t:${timeInSeconds}:R>`;
          const Icon = item.event === "join" ? PhoneIncoming : PhoneOff;
          const className = item.event === "join" ? "text-green-500" : "text-red-500";
          return (
            <Tooltip key={`user-${i}-${item.id}`} delayDuration={100}>
              <TooltipTrigger asChild>
                <div className="text-lg flex items-center text-white">
                  <Icon size={18} className={cn(className, "mr-2")} />{" "}
                  <span
                    onClick={() => {
                      navigator.clipboard.writeText(userInfoString);
                    }}
                  >
                    {item.username}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent avoidCollisions={false} align="center">
                {userInfoString}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
};
