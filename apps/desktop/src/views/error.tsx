import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useSetWindowSize } from "../use-set-size";
import { useAppStore } from "../store";

export const ErrorView = () => {
  useSetWindowSize({ width: 400, height: 600 });
  const { discordErrors } = useAppStore();

  return (
    <div className="flex flex-col items-center h-screen p-2 bg-zinc-900">
      <div className="pt-8 pb-8 font-bold text-2xl text-center">
        <p>Error Connecting to Discord</p>
      </div>
      <div className="w-32 h-32">
        <img src="/img/sad-face.svg" alt="sad" className="text-white fill-white w-full" />
      </div>
      <div className="pt-8 pb-8 text-2xl text-center">
        {discordErrors.map((item, i) => (
          <p key={`error-${i}`}>{item}</p>
        ))}
      </div>
      <div className="pt-8 text-2xl flex items-center justify-center">
        <Link to="/">
          <Button>Login to Discord</Button>
        </Link>
      </div>
    </div>
  );
};
