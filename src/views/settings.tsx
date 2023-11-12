import { useNavigate } from "react-router-dom";
import { usePaths } from "../use-paths";
import { Button } from "../components/ui/button";
import { useAppStore } from "../store";
import { shell } from "@tauri-apps/api";
import { LogicalSize, appWindow } from "@tauri-apps/api/window";
import { useEffect } from "react";

export const Settings = () => {
  const navigate = useNavigate();
  const paths = usePaths();
  const { me, setMe } = useAppStore();

  useEffect(() => {
    appWindow.outerSize().then((size) => {
      appWindow.setSize(new LogicalSize(size.width, 700));
    });
  }, []);

  return (
    <div className="flex flex-col justify-between bg-zinc-800 h-full p-4 pt-4 pb-14">
      <div>
        <h1 className="text-xl font-bold">Settings</h1>

        <div>
          <h2 className="text-lg font-bold mt-4">Directories</h2>
          <div className="flex gap-4">
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
          </div>
        </div>
        <div>
          <h2 className="text-lg font-bold mt-4">Discord</h2>
          <div className="">
            <pre>{JSON.stringify({ id: me?.id }, null, 2)}</pre>
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
