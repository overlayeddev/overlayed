import { useAppStore } from "../store";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { exit } from "@tauri-apps/api/process";

export const MainView = () => {
  const { resetErrors } = useAppStore();

  useEffect(() => {
    resetErrors();
  }, []);

  return (
    <div className="h-screen p-2 bg-zinc-900">
      <div className="pt-1 mb-3 font-bold text-2xl text-center">
        <p className="mb-2">Authorize Discord</p>
        <p className="text-sm text-center text-zinc-400">
          Overlayed is not affiliated with Discord. Discord is a trademark of Discord Inc.
        </p>
        <ul className="flex flex-col pl-10 gap-4 p-4 mt-6 text-xl text-left">
          <li>
            <p className="leading-8">Discord should have opened a popup</p>
          </li>
          <li>
            <p className="leading-8">Click &quot;Authorize&quot; within Discord</p>
          </li>
          <li>
            <p className="leading-8">Join a voice channel</p>
          </li>
          <li>
            <p className="leading-8">Enjoy 🥳</p>
          </li>
        </ul>

        <div className="pt-8 text-2xl flex flex-col gap-4 items-center justify-center">
          <Button
            onClick={() => {
              // TODO: this is a hack, it should be handled better
              window.location.reload();
            }}
          >
            Try Again
          </Button>

          <Button
            variant="ghost"
            onClick={async () => {
              await exit();
            }}
          >
            Quit Overlayed
          </Button>
        </div>
      </div>
    </div>
  );
};
