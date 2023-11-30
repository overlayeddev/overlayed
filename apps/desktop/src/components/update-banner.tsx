import { checkUpdate, installUpdate, onUpdaterEvent } from "@tauri-apps/api/updater";
import { relaunch } from "@tauri-apps/api/process";
import { Download } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export const UpdateBanner = () => {
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  useEffect(() => {
    const setupUpdater = async () => {
      const unlisten = await onUpdaterEvent(({ error, status }) => {
        // This will log all updater events, including status updates and errors.
        console.log("Updater event", error, status);
      });

      try {
        const { shouldUpdate } = await checkUpdate();

        setIsUpdateAvailable(shouldUpdate);
      } catch (error) {
        console.error(error);
      }

      return unlisten;
    };

    setupUpdater();
  }, []);

  if (!isUpdateAvailable) return null;

  return (
    <Link to="/settings?update">
      <div className="bg-blue-500 hover:bg-blue-400 !text-white py-2 font-bold cursor-pointer flex gap-2 items-center justify-center">
        <Download />
        <p>Click here to update.</p>
      </div>
    </Link>
  );
};
