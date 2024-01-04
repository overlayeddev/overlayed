import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { shell } from "@tauri-apps/api";
import { invoke } from "@tauri-apps/api";
import { usePlatformInfo } from "@/hooks/use-platform-info";

export const Developer = () => {
  const platformInfo = usePlatformInfo();
  return (
    <>
      <div className="flex flex-col gap-2">
        <div>
          <p className="text-sm">
            <strong>OS</strong> {platformInfo.os} {platformInfo.kernalVersion} {platformInfo.arch}
          </p>
        </div>
        <div>
          <p className="text-sm">
            <strong>Tauri Version</strong> {platformInfo.tauriVersion}
          </p>
        </div>
        <div>
          <p className="text-sm">
            <strong>App Version</strong> {platformInfo.appVersion}
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={async () => {
            await invoke("open_devtools");
          }}
        >
          Open Devtools
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            shell.open(platformInfo.configDir);
          }}
        >
          Open Config Dir
        </Button>
        <p>
          If you find any issues or bugs please report them on the{" "}
          <Link to="https://github.com/Hacksore/overlayed">github</Link> repo.
        </p>
      </div>
    </>
  );
};
