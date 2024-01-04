import { Button } from "@/components/ui/button";
import { shell } from "@tauri-apps/api";
import { invoke } from "@tauri-apps/api";
import { usePlatformInfo } from "@/hooks/use-platform-info";

export const Developer = () => {
  const platformInfo = usePlatformInfo();
  return (
    <>
      <div className="flex flex-col gap-2 ">
        <div className="flex flex-col gap-4 pb-4">
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
        </div>
        <div className="flex gap-4">
          <Button
            variant="default"
            onClick={async () => {
              await invoke("open_devtools");
            }}
          >
            Open Devtools
          </Button>
          <Button
            variant="default"
            onClick={() => {
              shell.open(platformInfo.configDir);
            }}
          >
            Open Config Dir
          </Button>
        </div>
        <p className="pt-2">
          If you find any issues or bugs please report them on the
          <a className="text-blue-400" target="_blank" rel="noreferrer" href="https://github.com/Hacksore/overlayed">{" "}
            github repo
          </a>
        </p>
      </div>
    </>
  );
};
