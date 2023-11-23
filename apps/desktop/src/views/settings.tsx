import { useNavigate } from "react-router-dom";
import { Button } from "@radix-ui/themes";
import { useAppStore } from "../store";
import { LogicalSize, LogicalPosition, currentMonitor, appWindow } from "@tauri-apps/api/window";
import { useEffect, useRef, useState } from "react";

const SETTINGS_WIDTH = 400;
const SETTINGS_HEIGHT = 700;

export const SettingsView = () => {
  const navigate = useNavigate();
  const { me } = useAppStore();
  const lastSizeRef = useRef<LogicalSize | null>(null);
  const lastWindowPosRef = useRef<LogicalPosition | null>(null);
  const [scaleFactor, setScaleFactor] = useState(1);

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

  return (
    <div className="flex flex-col justify-between bg-zinc-800 h-full p-4 pt-4 pb-14">
      <div>
        <h1 className="text-xl mb-3 font-bold">Settings</h1>

        <label className="flex items-center gap-2">
          <span>Scale</span>
        </label>

        {/* <div> */}
        {/*   <div className="flex flex-col gap-2 mb-2"> */}
        {/*     <Button */}
        {/*       className="w-full" */}
        {/*       onClick={async () => { */}
        {/*         if (!paths.configDir) return; */}
        {/*         await shell.open(paths.configDir); */}
        {/*       }} */}
        {/*     > */}
        {/*       Open App Dir */}
        {/*     </Button> */}
        {/*     <Button */}
        {/*       className="w-full" */}
        {/*       onClick={async () => { */}
        {/*         await invoke("open_devtools"); */}
        {/*       }} */}
        {/*     > */}
        {/*       Open Devtools */}
        {/*     </Button> */}
        {/*   </div> */}
        {/* </div> */}
        {/* <div> */}
        {/*   <div className=""> */}
        {/*     <textarea */}
        {/*       className="bg-zinc-600 w-full min-h-[300px]" */}
        {/*       readOnly */}
        {/*       value={JSON.stringify(me, null, 2)} */}
        {/*     ></textarea> */}
        {/*     <Button */}
        {/*       disabled={!me?.id} */}
        {/*       className="w-full" */}
        {/*       intent="danger" */}
        {/*       onClick={() => { */}
        {/*         localStorage.removeItem("discord_access_token"); */}
        {/*         setMe(null); */}
        {/*         navigate("/"); */}
        {/*       }} */}
        {/*     > */}
        {/*       logout */}
        {/*     </Button> */}
        {/*   </div> */}
        {/* </div> */}
        {/**/}
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
