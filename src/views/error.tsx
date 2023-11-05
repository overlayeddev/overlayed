import { Link } from "react-router-dom";

export const Error = () => {
  return (
    <div className="h-screen p-2 bg-zinc-800">
      <div className="pt-8 text-2xl text-center">
        <p>⚠️ There was an error trying to connect to discord client.</p>
      </div>
      <div className="pt-8 text-2xl flex items-center justify-center">
        <Link to="/">
          <button className="bg-blue-800 p-2 rounded-md">
            Try logging in again
          </button>
        </Link>
      </div>
    </div>
  );
};
