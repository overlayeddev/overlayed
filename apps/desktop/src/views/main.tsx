import { useSocket } from "../rpc/manager";
import { useAppStore } from "../store";
import { useEffect } from "react";
import { useSetWindowSize } from "../use-set-size";
import { Button } from "@radix-ui/themes";
import { Link } from "react-router-dom";

export const MainView = () => {
  useSocket();
  useSetWindowSize({ width: 400, height: 600 });
  const { resetErrors } = useAppStore();

  useEffect(() => {
    resetErrors();
  }, []);

  return (
    <div className="h-screen p-2 bg-zinc-800">
      <div className="pt-1 mb-3 font-bold text-2xl text-center">
        <p>Authorize Discord</p>
        <ul className="text-sm text-center">
          <li className="text-zinc-400">
            <p>This app is not affiliated with Discord. Discord is a trademark of Discord Inc.</p>
          </li>
        </ul>
        <ul className="flex flex-col gap-4 p-4 mt-6 text-2xl text-left">
          <li>
            <p className="leading-8">1. Discord should have opened a popup</p>
          </li>
          <li>
            <p className="leading-8">2. Click "Authorize" within discord</p>
          </li>
          <li>
            <p className="leading-8">3. Join a voice channel</p>
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
