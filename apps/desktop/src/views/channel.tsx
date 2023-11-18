import { User } from "../components/user";
import { useAppStore } from "../store";
import { useWindowResize } from "../use-window-resize";

export const Channel = () => {
  const { users } = useAppStore();
  const windowSize = useWindowResize();

  return (
    <div>
      {JSON.stringify({ windowSize })}
      <div className="py-2">
        {Object.entries(users).map(([_k, item]) => (
          <User key={item.id} windowSize={windowSize} item={item} />
        ))}
      </div>
    </div>
  );
};
