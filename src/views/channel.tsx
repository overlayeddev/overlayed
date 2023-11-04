import { User } from "../components/user";
import { useAppStore } from "../store";

export const Channel = () => {
  const { users } = useAppStore();
  return (
    <>
      <div className="py-2">
        {Object.entries(users).map(([_k, item]) => (
          <User key={item.id} item={item} />
        ))}
      </div>
    </>
  );
};
