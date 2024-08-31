import { Updater } from "@/components/updater";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Account } from "./account";
import { JoinHistory } from "./join-history";
import { useState } from "react";
import { usePlatformInfo } from "@/hooks/use-platform-info";
import { SiX, SiTwitch, SiDiscord, type IconType } from "@icons-pack/react-simple-icons";
import type { Update } from "@tauri-apps/plugin-updater";

function Link({ icon: Icon, url }: { icon: IconType; url: string }) {
  return (
    <a className="text-gray-400 hover:text-gray-300" target="_blank" rel="noreferrer" href={url}>
      <Icon />
    </a>
  );
}

export const SettingsView = ({ update }: { update: Update | null }) => {
  const { canary } = usePlatformInfo();
  const [currentTab, setCurrentTab] = useState("account");
  return (
    <div className="bg-zinc-900 w-[calc(100vw)] h-full">
      <Tabs
        defaultValue="account"
        onValueChange={value => {
          setCurrentTab(value);
        }}
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="account">General</TabsTrigger>
          <TabsTrigger value="join-history">Join History</TabsTrigger>
        </TabsList>
        {canary && (
          <div className="h-[32px] bg-yellow-400 font-semibold text-black flex items-center justify-center">
            <a target="_blank" href="https://overlayed.dev/canary#about">
              <p>The canary build may be unstable (click to learn more)</p>
            </a>
          </div>
        )}
        {!canary && update?.available && <Updater update={update} />}
        <div className="p-4 pt-0">
          <TabsContent tabIndex={-1} value="account">
            <Account />
          </TabsContent>
          <TabsContent tabIndex={-1} forceMount value="join-history">
            <div style={{ display: currentTab === "join-history" ? "block" : "none" }}>
              <JoinHistory />
            </div>
          </TabsContent>
        </div>
        <div className="absolute bottom-0 flex items-center w-full h-10 pl-4 text-gray-400 bg-zinc-800">
          <p>
            Found a bug? Please report them on the{" "}
            <a
              className="text-blue-400"
              target="_blank"
              rel="noreferrer"
              href="https://github.com/overlayeddev/overlayed"
            >
              github repo
            </a>
          </p>
          <div className="flex flex-grow pr-4 justify-end gap-3 ">
            <Link icon={SiX} url="https://x.com/OverlayedDev" />
            <Link icon={SiTwitch} url="https://twitch.tv/OverlayedDev" />
            <Link icon={SiDiscord} url="https://discord.gg/eXmeNkVjye" />
          </div>
        </div>
      </Tabs>
    </div>
  );
};
