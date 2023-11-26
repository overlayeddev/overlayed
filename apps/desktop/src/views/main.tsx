import { useSocket } from "../rpc/manager";
import { useAppStore } from "../store";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export const MainView = () => {
  useSocket();
  const { resetErrors } = useAppStore();

  useEffect(() => {
    resetErrors();
  }, []);

  return (
    <div className="h-screen p-2 bg-zinc-900">
      <div className="pt-1 mb-3 font-bold text-2xl text-center">
        <p className="mb-2">Authorize Discord</p>
        <ul className="text-sm text-center">
          <li className="text-zinc-400">
            <p>Overlayed is not affiliated with Discord. Discord is a trademark of Discord Inc.</p>
          </li>
        </ul>
        <ul className="flex flex-col pl-10 gap-4 p-4 mt-6 text-xl text-left">
          <li>
            <p className="leading-8">Discord should have opened a popup</p>
          </li>
          <li>
            <p className="leading-8">Click "Authorize" within discord</p>
          </li>
          <li>
            <p className="leading-8">Join a voice channel</p>
          </li>
        </ul>

        <div className="pt-8 text-2xl flex items-center justify-center">
          <Button>
            <Link to="/">Try Again</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};
