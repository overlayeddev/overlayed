import { useState } from "react";
import { type DirectionLR, type DirectionTB } from "@/store";

// TODO: make it update automatically when the window moves
export const useAlign = () => {
  const [horizontal, setHorizontalDirection] = useState<DirectionLR>("right");
  const [vertical, setVerticalDirection] = useState<DirectionTB>("bottom");

  return { horizontal, vertical, setHorizontalDirection, setVerticalDirection };
};
