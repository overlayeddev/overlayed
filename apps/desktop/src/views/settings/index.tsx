import { Updater } from "@/components/updater";
import type { UpdateStatus } from "@tauri-apps/api/updater";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Account } from "./account";
import { Developer } from "./developer";
import { JoinHistory } from "./join-history";
import { useState } from "react";

export const SettingsView = ({
  update,
}: {
  update: { isAvailable: boolean; status: UpdateStatus | null; error: string };
}) => {
  const [currentTab, setCurrentTab] = useState("account");
  return (
    <div className="bg-zinc-900 w-[calc(100vw)] h-full">
      <Tabs
        defaultValue="account"
        className="w-full"
        onValueChange={value => {
          setCurrentTab(value);
        }}
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="account">General</TabsTrigger>
          <TabsTrigger value="developer">Developer</TabsTrigger>
          <TabsTrigger value="join-history">Join History</TabsTrigger>
        </TabsList>

        {update.isAvailable && <Updater update={update} />}
        <div className="p-4 pt-2 pb-14 overflow-auto">
          <div className="flex flex-col gap-4">
            <TabsContent tabIndex={-1} value="account">
              <Account />
            </TabsContent>
            <TabsContent tabIndex={-1} value="developer">
              <Developer />
            </TabsContent>
            <TabsContent tabIndex={-1} forceMount value="join-history">
              <div style={{ display: currentTab === "join-history" ? "block" : "none" }}>
                <JoinHistory />
              </div>
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  );
};
