import { Button } from "@/components/ui/button";
import { exit } from "@tauri-apps/api/process";
import * as dateFns from "date-fns";
import { saveWindowState, StateFlags } from "tauri-plugin-window-state-api";

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

export const Account = () => {
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showQuitDialog, setShowQuitDialog] = useState(false);
  // TODO: type this
  const [user, setUser] = useState<any>(null);
  const tokenExpires = localStorage.getItem("discord_expires_at");

  // pull out the user data from localStorage
  useEffect(() => {
    const user = localStorage.getItem("user_data");
    if (user) {
      setUser(JSON.parse(user));
    }

    const onStorageChange = (e: StorageEvent) => {
      if (e.key === "user_data" && e.newValue) {
        setUser(JSON.parse(e.newValue));
      }
    };

    // if we get a login update the data
    window.addEventListener("storage", onStorageChange);

    return () => {
      window.removeEventListener("storage", onStorageChange);
    };
  }, []);

  return (
    <>
      <div>
        {user?.id ? (
          <p className="mb-3 font-bold">
            {user?.global_name} ({user?.id})
          </p>
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

        <div className="flex flex-col gap-4 pb-4">
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
                    // TODO: move this to the other window
                    localStorage.removeItem("discord_access_token");
                    localStorage.removeItem("discord_expires_at");
                    localStorage.removeItem("user_data");
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
        </div>

        <div>
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
      </div>
    </>
  );
};
