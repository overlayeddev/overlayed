import { Button } from "@/components/ui/button";
import { exit } from "@tauri-apps/api/process";
import * as dateFns from "date-fns";
import { saveWindowState, StateFlags } from "tauri-plugin-window-state-api";

import { shell } from "@tauri-apps/api";
import { invoke } from "@tauri-apps/api";
import { usePlatformInfo } from "@/hooks/use-platform-info";
import Config from "@/config";

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
import { Checkbox } from "@/components/ui/checkbox";
import { emit } from "@tauri-apps/api/event";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { VoiceUser } from "@/types";
import { useConfigValue } from "@/hooks/use-config-value";

export const Developer = () => {
  const platformInfo = usePlatformInfo();
  return (
    <>
      <div className="flex flex-col gap-2">
        <div className="flex gap-4 pb-2">
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              await invoke("open_devtools");
            }}
          >
            Open Devtools
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              shell.open(platformInfo.configDir);
            }}
          >
            Open Config Dir
          </Button>
        </div>
      </div>
    </>
  );
};
export const AppInfo = () => {
  const platformInfo = usePlatformInfo();
  const { value: showOnlyTalkingUsers } = useConfigValue("showOnlyTalkingUsers");

  return (
    <div>
      <div className="flex items-center pb-2">
        <Checkbox
          id="notification"
          checked={showOnlyTalkingUsers}
          onCheckedChange={async () => {
            const newBool = !showOnlyTalkingUsers;
            await Config.set("showOnlyTalkingUsers", newBool);

            await emit("config_update", await Config.getConfig());
          }}
        />
        <label
          htmlFor="notification"
          className="ml-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Only show users who are speaking
        </label>
      </div>
      <div className="flex items-center gap-2 pb-4 text-zinc-400">
        <div>
          <p className="text-sm">
            <strong>OS</strong> {platformInfo.os} {platformInfo.kernalVersion} {platformInfo.arch}
          </p>
        </div>
        <span className="text-xs">/</span>
        <div>
          <p className="text-sm">
            <strong>Tauri</strong> {platformInfo.tauriVersion}
          </p>
        </div>
        <span className="text-sm">/</span>
        <div>
          <p className="text-sm">
            <strong>App</strong> {platformInfo.appVersion}
          </p>
        </div>
      </div>
    </div>
  );
};

export const Account = () => {
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showQuitDialog, setShowQuitDialog] = useState(false);
  const [user, setUser] = useState<VoiceUser | null>(null);
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
  const avatarUrl = `https://cdn.discordapp.com/avatars/${user?.id}/${user?.avatar}.png`;
  return (
    <div>
      <div className="h-[282px]">
        <div className="flex items-center mb-2">
          {user?.id && (
            <Avatar className="w-16 h-16 mr-3">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
          )}
          <div>
            {user?.id ? (
              <div>
                <p className="mt-3 mb-3 font-bold">
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

        <div className="flex flex-row gap-4 pb-4">
          <div>
            <Dialog
              onOpenChange={e => {
                setShowLogoutDialog(e);
              }}
              open={showLogoutDialog}
            >
              <DialogTrigger asChild>
                <Button size="sm" disabled={!user?.id} className="w-[100px]">
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
                    <DialogTitle className="mb-4 text-xl text-white">Logout</DialogTitle>
                    <DialogDescription className="mb-4 text-xl text-white">
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
              <Button size="sm" className="w-[100px]">
                Quit
              </Button>
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
                  <DialogTitle className="mb-4 text-xl text-white">Quit Overlayed</DialogTitle>
                  <DialogDescription className="mb-4 text-xl text-white">
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
          <Developer />
        </div>
        <AppInfo />
      </div>
    </div>
  );
};
