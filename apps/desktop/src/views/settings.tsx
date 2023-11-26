import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppStore } from "../store";
import { User } from "../components/user";
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
import { useState } from "react";

export const SettingsView = () => {
  const navigate = useNavigate();
  const { me, setMe } = useAppStore();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  return (
    <div className="bg-zinc-900 h-full p-4 pt-4 pb-14">
      <div className="flex flex-col gap-4">
        <h1 className="text-xl mb-3 font-bold">Settings</h1>

        <div className="">
          <p className="mb-3 font-bold">Logged in as {me?.username}</p>

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
                  <DialogTitle>Logout</DialogTitle>
                  <DialogDescription>Are you sure you want to lout out of Overlayed?</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button>Cancel</Button>
                  </DialogClose>
                  <Button variant="destructive" type="submit">
                    Confirm Logout
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <Input value={me?.username} onChange={() => {}} />
        <div className="fixed right-4 bottom-4">
          <Button
            variant="default"
            onClick={() => {
              if (!me?.id) return navigate("/");
              navigate("/channel");
            }}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
};
