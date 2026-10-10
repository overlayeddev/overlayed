import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import Config from "@/config";
import { useConfigValue } from "@/hooks/use-config-value";
import { emit } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { SimpleSelect } from "@/components/ui/simple-select";

export const Configuration = () => {
  const { value: showOnlyTalkingUsers } = useConfigValue("showOnlyTalkingUsers");
  const { value: opacity } = useConfigValue("opacity");
  const { value: opacityTarget } = useConfigValue("opacityTarget");
  const { value: vertical } = useConfigValue("vertical");
  const { value: horizontal } = useConfigValue("horizontal");
  const { value: maxUsernameLength } = useConfigValue("maxUsernameLength");
  const { value: userScale } = useConfigValue("userScale");
  const { value: hideTaskbarWhenPinned } = useConfigValue("hideTaskbarWhenPinned");

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
        <label
          htmlFor="maxUsernameLength"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
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
        <label
          htmlFor="horizontal"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Anchor horizontal
        </label>
        <SimpleSelect
          id="horizontal"
          value={horizontal}
          onChange={async val => {
            const newTarget = val as "left" | "center" | "right";
            await Config.set("horizontal", newTarget);

            await emit("config_update", await Config.getConfig());
          }}
          options={[
            { value: "left", label: "Left" },
            { value: "center", label: "Center" },
            { value: "right", label: "Right" },
          ]}
          className="w-40"
        />
      </div>
      <div className="flex items-center justify-between h-8 mx-2">
        <label
          htmlFor="vertical"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Anchor vertical
        </label>
        <SimpleSelect
          id="vertical"
          value={vertical}
          onChange={async val => {
            const newTarget = val as "top" | "bottom";
            await Config.set("vertical", newTarget);

            await emit("config_update", await Config.getConfig());
          }}
          options={[
            { value: "top", label: "Top" },
            { value: "bottom", label: "Bottom" },
          ]}
          className="w-40"
        />
      </div>
      <div className="flex items-center justify-between h-8 mx-2">
        <label
          htmlFor="opacityTarget"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Opacity target
        </label>
        <SimpleSelect
          id="opacityTarget"
          value={opacityTarget}
          onChange={async val => {
            const newTarget = val as "all" | "username-box";
            await Config.set("opacityTarget", newTarget);

            await emit("config_update", await Config.getConfig());
          }}
          options={[
            { value: "all", label: "Everything" },
            { value: "username-box", label: "Username background only" },
          ]}
          className="w-56"
        />
      </div>
      <div className="flex items-center justify-between h-8 mx-2">
        <label
          htmlFor="opacity"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
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
      <div className="flex items-center justify-between h-8 mx-2">
        <label
          htmlFor="userScale"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Scale
        </label>
        <div className="flex items-center gap-4 w-1/2">
          <div className="flex-1">
            <Slider
              value={[userScale]}
              min={50}
              max={200}
              step={5}
              onValueChange={async (val: number[]) => {
                const newVal = val[0] ?? userScale;
                await Config.set("userScale", Number(newVal));
                await emit("config_update", await Config.getConfig());
              }}
            />
          </div>
          <div className="w-16 text-right">
            <span className="text-sm">{userScale} %</span>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between h-8 mx-2">
        <label
          htmlFor="hideTaskbar"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Hide taskbar when pinned
        </label>
        <Switch
          id="hideTaskbar"
          checked={hideTaskbarWhenPinned}
          onCheckedChange={async () => {
            const newBool = !hideTaskbarWhenPinned;
            await Config.set("hideTaskbarWhenPinned", newBool);

            await invoke("set_hide_taskbar_when_pinned", {
              hideTaskbarWhenPinned: newBool,
            });

            await emit("config_update", await Config.getConfig());
          }}
        />
      </div>
    </div>
  );
};
