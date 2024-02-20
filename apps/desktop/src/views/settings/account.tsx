import { Button } from "@/components/ui/button";
import { exit } from "@tauri-apps/api/process";
import * as dateFns from "date-fns";
import { saveWindowState, StateFlags } from "tauri-plugin-window-state-api";

import { shell } from "@tauri-apps/api";
import { invoke } from "@tauri-apps/api";
import { usePlatformInfo } from "@/hooks/use-platform-info";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";

export const Developer = () => {
  const platformInfo = usePlatformInfo();
  return (
    <>
      <div className="flex flex-col gap-2">
        <div className="flex gap-4 pb-2">
          <Button
            variant="outline"
            onClick={async () => {
              await invoke("open_devtools");
            }}
          >
            Open Devtools
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              shell.open(platformInfo.configDir);
            }}
          >
            Open Config Dir
          </Button>
        </div>
        <div className="flex flex-col gap-2 pb-4">
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
      </div>
    </>
  );
};

export const Account = () => {
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showQuitDialog, setShowQuitDialog] = useState(false);
  // TODO: type this
  const [user, setUser] = useState < any > (null);
  const [tokenExpires, setTokenExpires] = useState(localStorage.getItem("discord_access_token_expiry"));

  // pull out the user data from localStorage
  useEffect(() => {
    const user = localStorage.getItem("user_data");
    if (user) {
      setUser(JSON.parse(user));
    }

    // TODO: these should have keys that are shared from perhaps and abstraction
    const onStorageChange = (e: StorageEvent) => {
      if (e.key === "user_data" && e.newValue) {
        setUser(JSON.parse(e.newValue));
      }

      if (e.key === "discord_access_token_expiry" && e.newValue) {
        setTokenExpires(e.newValue);
      }
    };

    // if we get a login update the data
    window.addEventListener("storage", onStorageChange);

    return () => {
      window.removeEventListener("storage", onStorageChange);
    };
  }, []);

  return (
    <div>
      <div className="h-[282px]">
        <div className="flex items-center mb-2">
          {user?.id && (
            <img
              style={{ width: 64, height: 64 }}
              className="mr-3"
              src={`https://cdn.discordapp.com/avatars/${user?.id}/${user?.avatar}.png`}
              alt="user avatar"
            />
          )}
          <div>
            {user?.id ? (
              <div>
                <p className="mb-3 mt-3 font-bold">
                  {user?.global_name} ({user?.id})
                </p>
              </div>
            ) : (
              <p>Please Login to use Overlayed</p>
            )}

            <div className="pb-4">
              {tokenExpires && (
                <p className="text-sm">
                  <strong>Token Expires</strong> {dateFns.formatDistanceToNow(new Date(tokenExpires))}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-4 pb-4">
          <div>
            <Dialog
              onOpenChange={e => {
                setShowLogoutDialog(e);
              }}
              open={showLogoutDialog}
            >
              <DialogTrigger asChild>
                <Button disabled={!user?.id} className="w-[100px]">
                  Logout
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[80%]">
                <form
                  onSubmit={async event => {
                    event.preventDefault();
                    setShowLogoutDialog(false);
                    // TODO: move this to the other window but for now this works
                    localStorage.removeItem("discord_access_token");
                    localStorage.removeItem("discord_access_token_expiry");
                    localStorage.removeItem("user_data");
                    setTokenExpires(null);
                    setUser(null);
                  }}
                >
                  <DialogHeader>
                    <DialogTitle className="text-xl mb-4 text-white">Logout</DialogTitle>
                    <DialogDescription className="text-xl mb-4 text-white">
                      Are you sure you want to log out of Overlayed?
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="secondary">Cancel</Button>
                    </DialogClose>
                    <Button type="submit">Confirm Logout</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Dialog
            onOpenChange={e => {
              setShowQuitDialog(e);
            }}
            open={showQuitDialog}
          >
            <DialogTrigger asChild>
              <Button className="w-[100px]">Quit</Button>
            </DialogTrigger>
            <DialogContent className="w-[80%]">
              <form
                onSubmit={async event => {
                  event.preventDefault();
                  await saveWindowState(StateFlags.ALL);
                  await exit();
                }}
              >
                <DialogHeader>
                  <DialogTitle className="text-xl mb-4 text-white">Quit Overlayed</DialogTitle>
                  <DialogDescription className="text-xl mb-4 text-white">
                    Are you sure you want to quit the Overlayed app?
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="secondary">Cancel</Button>
                  </DialogClose>
                  <Button variant="destructive" type="submit">
                    Quit
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <Developer />
      </div>

      <div className="pt-2 flex h-full text-gray-400 items-center">
        <p>
          Fond a bug? Please report them on the{" "}
          <a className="text-blue-400" target="_blank" rel="noreferrer" href="https://github.com/Hacksore/overlayed">
            github repo
          </a>
        </p>
      </div>
    </div>
  );
};
