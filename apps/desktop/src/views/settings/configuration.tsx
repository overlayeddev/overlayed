import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import Config from "@/config";
import { useConfigValue } from "@/hooks/use-config-value";
import { emit } from "@tauri-apps/api/event";

export const Configuration = () => {
  const { value: showOnlyTalkingUsers } = useConfigValue("showOnlyTalkingUsers");
  const { value: opacity } = useConfigValue("opacity");
  const { value: opacityTarget } = useConfigValue("opacityTarget");
  const { value: vertical } = useConfigValue("vertical");
  const { value: horizontal } = useConfigValue("horizontal");
  const { value: maxUsernameLength } = useConfigValue("maxUsernameLength");

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between mt-2 h-8 mx-2">
        <label
          htmlFor="notification"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Only show users who are speaking
        </label>
        <Switch
          id="notification"
          checked={showOnlyTalkingUsers}
          onCheckedChange={async () => {
            const newBool = !showOnlyTalkingUsers;
            await Config.set("showOnlyTalkingUsers", newBool);

            await emit("config_update", await Config.getConfig());
          }}
        />
      </div>
      <div className="flex items-center justify-between h-8 mx-2">
        <label htmlFor="maxUsernameLength" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Max username length
        </label>
        <div className="flex items-center gap-4 w-1/2">
          <div className="flex-1">
            <Slider
              value={[maxUsernameLength]}
              min={4}
              max={60}
              step={1}
              onValueChange={async (val: number[]) => {
                const newVal = val[0] ?? maxUsernameLength;
                await Config.set("maxUsernameLength", Number(newVal));
                await emit("config_update", await Config.getConfig());
              }}
            />
          </div>
          <div className="w-10 text-right">
            <span className="text-sm">{maxUsernameLength}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between h-8 mx-2">
        <label htmlFor="horizontal" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Anchor horizontal
        </label>
        <select
          id="horizontal"
          value={horizontal}
          onChange={async event => {
            const newTarget = event.target.value as "left" | "center" | "right";
            await Config.set("horizontal", newTarget);

            await emit("config_update", await Config.getConfig());
          }}
          className="w-40 p-1 rounded border bg-zinc-800 text-white outline-none focus:ring-0"
        >
          <option value="left" className="bg-zinc-800 text-white">Left</option>
          <option value="center" className="bg-zinc-800 text-white">Center</option>
          <option value="right" className="bg-zinc-800 text-white">Right</option>
        </select>
      </div>
      <div className="flex items-center justify-between h-8 mx-2">
        <label htmlFor="vertical" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Anchor vertical
        </label>
        <select
          id="vertical"
          value={vertical}
          onChange={async event => {
            const newTarget = event.target.value as "top" | "bottom";
            await Config.set("vertical", newTarget);

            await emit("config_update", await Config.getConfig());
          }}
          className="w-40 p-1 rounded border bg-zinc-800 text-white outline-none focus:ring-0"
        >
          <option value="top" className="bg-zinc-800 text-white">
            Top
          </option>
          <option value="bottom" className="bg-zinc-800 text-white">
            Bottom
          </option>
        </select>
      </div>
      <div className="flex items-center justify-between h-8 mx-2">
        <label htmlFor="opacityTarget" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Opacity target
        </label>
        <select
          id="opacityTarget"
          value={opacityTarget}
          onChange={async event => {
            const newTarget = event.target.value as "all" | "username-box";
            await Config.set("opacityTarget", newTarget);

            await emit("config_update", await Config.getConfig());
          }}
          className="p-1 rounded border bg-zinc-800 text-white outline-none focus:ring-0"
        >
          <option value="all" className="bg-zinc-800 text-white">
            Everything
          </option>
          <option value="username-box" className="bg-zinc-800 text-white">
            Username background only
          </option>
        </select>
      </div>
      <div className="flex items-center justify-between h-8 mx-2">
        <label htmlFor="opacity" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Overlay opacity
        </label>
        <div className="flex items-center gap-4 w-1/2">
          <div className="flex-1">
            <Slider
              value={[opacity]}
              min={1}
              max={100}
              step={1}
              onValueChange={async (val: number[]) => {
                const newVal = val[0] ?? opacity;
                await Config.set("opacity", Number(newVal));
                await emit("config_update", await Config.getConfig());
              }}
            />
          </div>
          <div className="w-10 text-right">
            <span className="text-sm">{opacity} %</span>
          </div>
        </div>
      </div>
    </div>
  );
};
