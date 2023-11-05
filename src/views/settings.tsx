export const Settings = () => {
  return (
    <div 
      style={{ height: "calc(100vh - 48px)" }}
      className="bg-zinc-800 p-4 pt-4 pb-4">
      <h1 className="text-xl font-bold">Settings</h1>
      <div>
        <button
          onClick={() => {
            localStorage.removeItem("discord_access_token");
            window.location.reload();
          }}
          className="bg-blue-800 p-2 rounded-md"
        >
          logout
        </button>
      </div>
    </div>
  );
};
