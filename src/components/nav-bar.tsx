import { useCallback } from "react";
import { Link, useLocation } from "react-router-dom";

export const NavBar = () => {
  const location = useLocation();

  const getNavLink = useCallback(() => {
    if (["/channel", "/"].includes(location.pathname)) {
      return <Link to="/settings">Settings</Link>; 
    }

    if (location.pathname === "/error") {
      return <Link to="/">Home</Link>; 
    }

    if (location.pathname === "/settings") {
      return <Link to="/channel">Channel</Link>; 
    }

  }, [location.pathname])

  return (
    <div
      data-tauri-drag-region
      className="cursor-default rounded-t-md font-bold select-none p-2 bg-zinc-900 text-white"
    >
      overlayed
      <div className="float-right">
        {getNavLink()}
      </div>
    </div>
  );
};
