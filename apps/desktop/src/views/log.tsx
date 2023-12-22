import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store";
import { Eraser, PhoneOff, PhoneIncoming } from "lucide-react";
import { cn } from "@/lib/utils";

export const LogView = () => {
  const { userLog, resetUserLog } = useAppStore();

  return (
    <div className="flex flex-col text-center h-screen bg-zinc-900 p-2">
      <div className="flex items-center pb-4">
        <p className="text-2xl mr-4">Audit Log</p>
        <Button onClick={resetUserLog} variant="ghost" size="sm" className="w-20 mt-2">
          <Eraser size={18} />
        </Button>
      </div>

      <div className="overflow-auto">
        {[...userLog].reverse().map((user, i) => {
          const Icon = user.event === "join" ? PhoneIncoming : PhoneOff;
          const className = user.event === "join" ? "text-green-500" : "text-red-500";
          return (
            <div key={i} className="text-lg flex items-center text-white">
              <Icon size={18} className={cn(className, "mr-2")} /> <span>{user.username}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
