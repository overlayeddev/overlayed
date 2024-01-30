import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store";
import { Eraser, PhoneOff, PhoneIncoming } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export const Audit = () => {
  const { userLog, resetUserLog } = useAppStore();


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
          const userInfoString = `${item.username} (${item.event}) <@${item.id}>`;
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
