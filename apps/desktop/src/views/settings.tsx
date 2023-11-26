import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAppStore } from "../store";
import { getTauriVersion, getVersion } from "@tauri-apps/api/app";
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
import { invoke } from "@tauri-apps/api";
import { Link } from "@/components/ui/link";

export const SettingsView = () => {
  const navigate = useNavigate();
  const { me, setMe } = useAppStore();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [tauriVersion, setTauriVersion] = useState("");
  const [version, setVersion] = useState("");
  const [tokenExpires, setTokenExpires] = useState("");

  useEffect(() => {
    getTauriVersion().then(v => {
      setTauriVersion(v);
    });

    getVersion().then(v => {
      setVersion(v);
    });

    const token = localStorage.getItem("discord_expires_at");
    if (token) {
      setTokenExpires(token);
    }
  }, []);

  return (
    <div className="bg-zinc-900 h-full p-4 pt-4 pb-14">
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-bold">Settings</h1>
        <hr className="border-zinc-800" />
        <div className="">
          <p className="mb-3 font-bold">Logged in as {me?.username}</p>

          <div className="pb-4">{tokenExpires && <p className="text-sm">Token Expires: {tokenExpires}</p>}</div>
          <Dialog
            onOpenChange={e => {
              setShowLogoutDialog(e);
            }}
            open={showLogoutDialog}
          >
            <DialogTrigger asChild>
              <Button variant="destructive" disabled={!me?.id}>
                logout
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <form
                onSubmit={event => {
                  event.preventDefault();
                  setShowLogoutDialog(false);
                  setMe(null);
                  localStorage.removeItem("discord_access_token");
                  navigate("/");
                }}
              >
                <DialogHeader>
                  <DialogTitle>
                    <div className="text-xl mb-4 text-white">Logout</div>
                  </DialogTitle>
                  <DialogDescription>
                    <div className="text-xl mb-4 text-white">Are you sure you want to log out of Overlayed?</div>
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="secondary">Cancel</Button>
                  </DialogClose>
                  <Button variant="destructive" type="submit">
                    Confirm Logout
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <hr className="border-zinc-800" />
        <div className="flex flex-col gap-4">
          <div>
            {tauriVersion && (
              <p className="text-sm">
                <strong>Tauri Version</strong> {tauriVersion}
              </p>
            )}
          </div>
          <div>
            {version && (
              <p className="text-sm">
                <strong>App Version</strong> {version}
              </p>
            )}
          </div>
          <Button
            onClick={async () => {
              await invoke("open_devtools");
            }}
          >
            Open Devtools
          </Button>
          <p>
            If you find any issues or bugs please report them on the{" "}
            <Link to="https://github.com/Hacksore/overlayed">github</Link> repo.
          </p>
        </div>

        <div className="fixed right-4 bottom-4">
          <Button
            variant="secondary"
            onClick={() => {
              if (!me?.id) return navigate("/");
              navigate("/channel");
            }}
          >
            Exit Settings
          </Button>
        </div>
      </div>
    </div>
  );
};
