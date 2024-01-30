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

import { emit, listen } from "@tauri-apps/api/event";
import { Event } from "@/constants";
export const Account = () => {
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showQuitDialog, setShowQuitDialog] = useState(false);
  // TODO: type this
  const [user, setUser] = useState < any > (null);
  const tokenExpires = localStorage.getItem("discord_expires_at");

  // TODO: abstract?
  // TODO: make constants
  useEffect(() => {
    const unlisten = listen(Event.AuthUpdate, data => {
      console.log("Got update from main app");
      setUser(data);
    });

    // NOTE: this may or may not work
    return () => {
      (async () => {
        const unlFn = await unlisten;
        unlFn();
      })();
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
                <Button disabled={!user?.id} className="w-[100px]">Logout</Button>
              </DialogTrigger>
              <DialogContent className="w-[80%]">
                <form
                  onSubmit={async event => {
                    event.preventDefault();
                    setShowLogoutDialog(false);
                    // TODO: move this to the other window
                    localStorage.removeItem("discord_access_token");
                    localStorage.removeItem("discord_expires_at");
                    setUser(null);

                    await emit(Event.AuthLogout);
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
