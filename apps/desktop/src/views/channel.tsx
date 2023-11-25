import { Button } from "ui/components/button";
import { User } from "../components/user";
import { useAppStore } from "../store";

export const ChannelView = () => {
  const { users } = useAppStore();

  return (
    <div>
      <div className="py-2">
        <Button variant="destructive">help me</Button>
        {Object.entries(users).map(([_, item]) => (
          <User key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
};
