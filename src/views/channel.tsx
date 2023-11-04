import { useAppStore } from "../store";
import { User } from "../user";

export const Channel = () => {
  const { users } = useAppStore();
  return (

    <div className="py-2">
      {Object.entries(users).map(([_k, item]) => (
        <User key={item.id} item={item} />
      ))}
    </div>
  );
};
