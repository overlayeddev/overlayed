import { Updater } from "@/components/updater";
import type { UpdateStatus } from "@tauri-apps/api/updater";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Account } from "./account";
import { Developer } from "./developer";
import { Audit } from "./audit";

export const SettingsView = ({
  update,
}: {
  update: { isAvailable: boolean; status: UpdateStatus | null; error: string };
}) => {
  return (
    <div className="bg-zinc-900 w-[calc(100vw)] h-full">
      <Tabs defaultValue="account" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="account">General</TabsTrigger>
          <TabsTrigger value="developer">Developer</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        {update.isAvailable && <Updater update={update} />}
        <div className="p-4 pt-4 pb-14 overflow-auto">
          <div className="flex flex-col gap-4">
            <TabsContent value="account">
              <Account />
            </TabsContent>
            <TabsContent value="developer">
              <Developer />
            </TabsContent>
            <TabsContent value="audit">
              <Audit />
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  );
};
