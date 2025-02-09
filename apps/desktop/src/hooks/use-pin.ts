import { useContext } from "react";
import { SettingContext } from "@/App";

// TODO: this might need updating?
export const usePin = () => {
  const store = useContext(SettingContext);
  const pin = store.get("pin");

  return { pin };
};
