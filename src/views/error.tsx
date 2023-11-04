import { Link } from "react-router-dom";

export const Error = () => {
  return (
    <>
      <div className="text-white pt-8 text-3xl flex items-center justify-center">
        There was an error trying to connect to discord client
      </div>
      <div>
        <Link to="/">
          <button className="bg-blue-800 text-white p-2 rounded-md">
            Try logging in again
          </button>
        </Link>
      </div>
    </>
  );
};
