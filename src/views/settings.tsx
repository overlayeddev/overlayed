import { useAppStore } from "../store";
import { invoke } from "@tauri-apps/api/tauri";

export const Settings = () => {
  const { setClickThrough, clickThrough } = useAppStore();

  return (
    <div className="h-screen pt-2 bg-zinc-800 p-2">
      <h1 className="text-xl pl-2 pt-2 font-bold">Settings</h1>
      <button
        className="bg-blue-800 p-2 rounded-md"
        onClick={() => {
          const updatedClickThrough = !clickThrough;

          setClickThrough(updatedClickThrough);

          invoke("toggle_clickthrough", {
            enabled: updatedClickThrough,
          });

        }}
      >
        {clickThrough ? "Disable" : "Enable"} clickThrough
      </button>
      <div className="pt-2 pl-2">
        <button
          onClick={() => {
            localStorage.removeItem("discord_access_token");
            window.location.reload();
          }}
          className="bg-blue-800 p-2 rounded-md"
        >
          logout
        </button>
      </div>
    </div>
  );
};
