import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../rpc/manager";

const MAX_LOADING_TIME = 10_000;
export const Main = () => {
  const navigate = useNavigate();

  useEffect(() => {
    console.log("MAIN: calling socket init")
    // NOTE: the app will always try to init the socket
    socket.init(navigate);

    // max time they can spend on tihs page befoore getting yeeted to error
    const timeoutId = setTimeout(() => navigate("/error"), MAX_LOADING_TIME);
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <>
      <div className="text-white pt-8 text-3xl flex items-center justify-center">
        loading...
      </div>
    </>
  );
};
