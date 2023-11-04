import { Link, useLocation } from "react-router-dom";

export const NavBar = () => {
  const location = useLocation();

  return (
    <div
      data-tauri-drag-region
      className="cursor-default rounded-t-md font-bold select-none p-2 bg-zinc-900 text-white"
    >
      overlayed
      <div className="float-right">
        {["/home", "/channel"].includes(location.pathname) ? (
          <Link to="/settings">Settings</Link>
        ) : (
          <Link to="/">Home</Link>
        )}
      </div>
    </div>
  );
};
