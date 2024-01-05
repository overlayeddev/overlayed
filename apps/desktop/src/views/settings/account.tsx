import { Link, useNavigate } from "react-router-dom";
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
import { useAppStore } from "@/store";
import { useEffect, useState } from "react";
export const Account = () => {
  const navigate = useNavigate();
  const { me, setMe } = useAppStore();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showQuitDialog, setShowQuitDialog] = useState(false);

  const [tokenExpires, setTokenExpires] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("discord_expires_at");
    if (token) {
      setTokenExpires(token);
    }
  }, []);
  return (
    <>
      <div>
        {me?.id ? (
          <p className="mb-3 font-bold">
            {me?.global_name} ({me?.id})
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
            {me?.id ? (
              <Dialog
                onOpenChange={e => {
                  setShowLogoutDialog(e);
                }}
                open={showLogoutDialog}
              >
                <DialogTrigger asChild>
                  <Button disabled={!me?.id} className="w-[100px]">
                    Logout
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[80%]">
                  <form
                    onSubmit={event => {
                      event.preventDefault();
                      setShowLogoutDialog(false);
                      setMe(null);
                      localStorage.removeItem("discord_access_token");
                      localStorage.removeItem("discord_expires_at");
                      navigate("/");
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
            ) : (
              <Button variant="default">
                <Link to="/" className="no-underline text-white hover:text-white">
                  Login to Discord
                </Link>
              </Button>
            )}
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
