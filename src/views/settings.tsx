import { useNavigate } from "react-router-dom";
import { usePaths } from "../use-paths";
import { useClickthrough } from "../use-clickthrough";

export const Settings = () => {
  const navigate = useNavigate();
  const { clickthrough } = useClickthrough();
  const paths = usePaths();
  return (
    <div
      style={{ height: "calc(100vh - 48px)" }}
      className="bg-zinc-800 p-4 pt-4 pb-4"
    >
      <h1 className="text-xl font-bold">Settings</h1>
      <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify({clickthrough, paths }, null, 2)}</pre>
      <div>
        <button
          onClick={() => {
            localStorage.removeItem("discord_access_token");
            navigate("/");
          }}
          className="bg-red-700 w-full p-2 rounded-md"
        >
          logout
        </button>
      </div>
    </div>
  );
};
