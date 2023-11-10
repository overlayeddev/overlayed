import { useNavigate } from "react-router-dom";
import { useSocket } from "../rpc/manager";
import { Button } from "../components/ui/button";

export const Main = () => {
  const socket = useSocket();
  const navigate = useNavigate();

  return (
    <div className="h-screen p-2 bg-zinc-800">
      <div className="pt-1 mb-3 font-bold text-2xl text-center">
        <p>Authorize Discord</p>
      </div>

      <img src="/img/login.png" alt="login" className="w-full" />

      <div className="pt-8 text-2xl flex items-center flex-col justify-center">
        <p>Request Prompt again</p>
        <Button
          onClick={() => {
            socket?.init(navigate);
          }}
          className="bg-blue-800 p-2 rounded-md"
        >
          Authorize Discord
        </Button>
      </div>
    </div>
  );
};
