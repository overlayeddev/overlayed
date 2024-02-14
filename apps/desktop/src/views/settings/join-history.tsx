import { Button } from "@/components/ui/button";
import { Trash, PhoneOff, PhoneIncoming } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useEffect, useRef, useState } from "react";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { Event } from "@/constants";
import { useToast } from "@/components/ui/use-toast";

const MAX_LOG_LENGTH = 420;
export const JoinHistory = () => {
  const [userLog, setUserLog] = useState < any[] > ([]);
  const { toast } = useToast();

  const createdListener = useRef(false);

  useEffect(() => {
    // keep a flag to stop it from creating multiple listeners
    if (createdListener.current) return;
    console.log("Creating listener for user log");
    listen(Event.UserLogUpdate, event => {
      console.log(event);
      // TODO: type this
      setUserLog((prev: any) => {
        const newLog = [...prev, event.payload];
        if (newLog.length > MAX_LOG_LENGTH) {
          newLog.shift();
        }
        return newLog;
      });
    });

    // set the flag to true
    createdListener.current = true;
  }, []);

  const resetUserLog = () => {
    setUserLog([]);
  };

  return (
    <div className="flex flex-col pb-4">
      <p className="text-sm text-gray-400 mb-2">
        Display join/leave events in the voice chat useful for moderation purposes{" "}
      </p>

      <div className="overflow-auto nice-scroll h-[216px]">
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

      <div className="flex justify-end items-center mt-4 pb-2">
        <Button onClick={resetUserLog} variant="ghost" className="hover:bg-red-500">
          <span className="mr-2">Clear list</span>
          <Trash size={18} />
        </Button>
      </div>
    </div>
  );
};
