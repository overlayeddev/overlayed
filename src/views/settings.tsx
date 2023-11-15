import { useNavigate } from "react-router-dom";
import { usePaths } from "../use-paths";
import { Button } from "../components/ui/button";
import { useAppStore } from "../store";
import { invoke, shell } from "@tauri-apps/api";
import {
  LogicalSize,
  LogicalPosition,
  currentMonitor,
  appWindow,
} from "@tauri-apps/api/window";
import { useEffect, useRef } from "react";

const SETTINGS_WIDTH = 400;
const SETTINGS_HEIGHT = 700;

export const Settings = () => {
  const navigate = useNavigate();
  const paths = usePaths();
  const { me, setMe } = useAppStore();
  const lastSizeRef = useRef<LogicalSize | null>(null);
  const lastWindowPosRef = useRef<LogicalPosition | null>(null);

  useEffect(() => {
    const alignAndSaveWindow = async () => {
      // save the list size
      const outerSize = await appWindow.outerSize();
      lastSizeRef.current = outerSize;

      // save the pos of the window
      const windowPos = await appWindow.outerPosition();
      lastWindowPosRef.current = windowPos;

      const monitor = await currentMonitor();
      const screenWidth = monitor?.size.width!;
      const screenHeight = monitor?.size.height!;

      // check if the window would be out of the bounds and move it
      const { x, y } = windowPos;

      if (x + SETTINGS_WIDTH > screenWidth) {
        appWindow.setPosition(
          new LogicalPosition(screenWidth - SETTINGS_WIDTH, y),
        );
      }

      if (y + SETTINGS_HEIGHT > screenHeight) {
        appWindow.setPosition(
          new LogicalPosition(x, screenHeight - SETTINGS_HEIGHT),
        );
      }

      // change the size to something good lookin
      appWindow.setSize(new LogicalSize(SETTINGS_WIDTH, SETTINGS_HEIGHT));

      //  watch for resize events
      const factor = await appWindow.scaleFactor();
      // we never clean this up LMAO
      // FIXME: please fix
      await appWindow.onResized((size) => {
        lastSizeRef.current = size.payload.toLogical(factor);
      });
    };

    alignAndSaveWindow();

    return () => {
      if (!lastSizeRef.current || !lastWindowPosRef.current) return;
      appWindow.setSize(lastSizeRef.current!);
      appWindow.setPosition(lastWindowPosRef.current!);
    };
  }, []);

  return (
    <div className="flex flex-col justify-between bg-zinc-800 h-full p-4 pt-4 pb-14">
      <div>
        <h1 className="text-xl font-bold">Settings</h1>

        <div>
          <div className="flex flex-col gap-2 mb-2">
            <Button
              className="w-full"
              disabled
              onClick={async () => {
                if (!paths.logDir) return;
                await shell.open(paths.logDir);
              }}
            >
              Open Log Dir
            </Button>
            <Button
              className="w-full"
              onClick={async () => {
                if (!paths.configDir) return;
                await shell.open(paths.configDir);
              }}
            >
              Open App Dir
            </Button>
            <Button
              className="w-full"
              onClick={async () => {
                await invoke("open_devtools");
              }}
            >
              Open Devtools
            </Button>
          </div>
        </div>
        <div>
          <div className="">
            <textarea
              className="bg-zinc-600 w-full min-h-[300px]"
              readOnly
              value={JSON.stringify(me, null, 2)}
            ></textarea>
            <Button
              disabled={!me?.id}
              className="w-full"
              intent="danger"
              onClick={() => {
                localStorage.removeItem("discord_access_token");
                setMe(null);
                navigate("/");
              }}
            >
              logout
            </Button>
          </div>
        </div>

        <hr className="my-8 border-gray-700" />
      </div>

      <div className="">
        <Button
          className="w-full"
          onClick={() => {
            if (!me?.id) return navigate("/");
            navigate("/channel");
          }}
        >
          Close Settings
        </Button>
      </div>
    </div>
  );
};
