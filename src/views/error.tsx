import { Link } from "react-router-dom";

export const Error = () => {
  return (
    <div className="h-screen p-2 bg-zinc-800">
      <div className="pt-8 font-bold text-2xl text-center">
        <p>Error Connecting to Dicsord</p>
      </div>
      <img src="/img/sad.png" alt="sad" className="w-full" />
      <div className="pt-8 text-2xl flex items-center justify-center">
        <Link to="/">
          <button className="bg-blue-800 p-2 rounded-md">
            Authorize Discord
          </button>
        </Link>
      </div>
    </div>
  );
};
