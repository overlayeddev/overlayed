import { useNavigate } from "react-router-dom";
import { Button, Slider } from "@radix-ui/themes";
import { useAppStore } from "../store";
import { LogicalSize, LogicalPosition, currentMonitor, appWindow } from "@tauri-apps/api/window";
import { useEffect, useRef, useState } from "react";
import { User } from "../components/user";

const SETTINGS_WIDTH = 400;
const SETTINGS_HEIGHT = 700;

export const SettingsView = () => {
  const navigate = useNavigate();
  const { me, setMe } = useAppStore();
  const lastSizeRef = useRef<LogicalSize | null>(null);
  const lastWindowPosRef = useRef<LogicalPosition | null>(null);
  const [scaleFactor, setScaleFactor] = useState(10);

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

      // if out of the x bounds set it to the start of the screen
      if (x + SETTINGS_WIDTH > screenWidth) {
        appWindow.setPosition(new LogicalPosition(screenWidth - SETTINGS_WIDTH, y));
      }

      // if out of the x bounds set it to the start of the screen
      if (y + SETTINGS_HEIGHT > screenHeight) {
        appWindow.setPosition(new LogicalPosition(x, screenHeight - SETTINGS_HEIGHT));
      }

      // change the size to something good lookin
      appWindow.setSize(new LogicalSize(SETTINGS_WIDTH, SETTINGS_HEIGHT));

      //  watch for resize events
      const factor = await appWindow.scaleFactor();
      // we never clean this up LMAO
      // FIXME: please fix
      await appWindow.onResized(size => {
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

  const scaleFactorValue = scaleFactor - 10 + 1;
  return (
    <div className="bg-zinc-900 h-full p-4 pt-4 pb-14">
      <div className="flex flex-col gap-4">
        <h1 className="text-xl mb-3 font-bold">Settings</h1>

        <div>
          <label className="flex items-center gap-2">
            <span>Channel UI Scale</span>
          </label>
          <div className="flex items-center">
            <div className="w-72">
              <Slider value={[scaleFactor]} max={19} onValueChange={([value]) => setScaleFactor(value)} />
            </div>

            <div className="ml-4">{scaleFactorValue}</div>
          </div>
          <div>
            <User
              // @ts-expect-error
              item={{
                username: "Overlayed User",
              }}
            />
          </div>
        </div>

        <div className="">
          <p className="mb-3 font-bold">Logged in as {me?.username}</p>
          <Button
            color="red"
            disabled={!me?.id}
            className="w-full"
            onClick={() => {
              localStorage.removeItem("discord_access_token");
              setMe(null);
              navigate("/");
            }}
          >
            logout
          </Button>
        </div>
        <div className="fixed right-4 bottom-4">
          <Button
            onClick={() => {
              if (!me?.id) return navigate("/");
              navigate("/channel");
            }}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
};
