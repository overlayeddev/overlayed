import { Updater } from "@/components/updater";
import type { UpdateStatus } from "@tauri-apps/api/updater";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Account } from "./account";
import { JoinHistory } from "./join-history";
import { useState } from "react";
import { usePlatformInfo } from "@/hooks/use-platform-info";

export const SettingsView = ({
  update,
}: {
  update: { isAvailable: boolean; status: UpdateStatus | null; error: string };
}) => {
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
            <a target="_blank" href="https://overlayed.dev/download/canary#about">
              <p>The canary build my be unstable (click to learn more)</p>
            </a>
          </div>
        )}
        {!canary && update.isAvailable && <Updater update={update} />}
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
            <a className="text-blue-400" target="_blank" rel="noreferrer" href="https://github.com/Hacksore/overlayed">
              github repo
            </a>
          </p>
        </div>
      </Tabs>
    </div>
  );
};
