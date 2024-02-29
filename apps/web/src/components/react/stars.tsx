import { useEffect, useState } from "react";
import { API_HOST } from "../../config";

export const Stars = () => {
  const [stars, setStars] = useState(0);

  useEffect(() => {
    fetch(`${API_HOST}/stars`)
      .then((res) => res.json())
      .then((data) => setStars(data.stars));
  }, []);

  return <div>Stars {stars}</div>;
};
