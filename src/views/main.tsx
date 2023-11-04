import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const MAX_LOADING_TIME = 10_000;
export const Main = () => {
  const navigate = useNavigate();

  useEffect(() => {
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
