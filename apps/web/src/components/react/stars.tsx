import { useEffect, useState } from "react";
import { API_HOST } from "../../config";

const LoadingSpinner = () => {
  return (
    <svg
      aria-hidden="true"
      className="w-4 h-4 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
      viewBox="0 0 100 101"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
        fill="currentColor"
      ></path>
      <path
        d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
        fill="currentFill"
      ></path>
    </svg>
  );
};

const AnimatedStar = () => {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="duration-200 group-hover:stroke-indigo-400 group-hover:fill-indigo-400 group-hover:rotate-180 lucide lucide-sparkles"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path>
      <path d="M3 5h4"></path>
      <path d="M17 19h4"></path>
    </svg>
  );
};

const AnimatedArrow = () => {
  return (
    <svg
      width="16"
      height="16"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
      className="duration-200 group-hover:translate-x-0.5 lucide lucide-chevron-right"
    >
      <path d="m9 18 6-6-6-6"></path>
    </svg>
  );
};

export const Stars = () => {
  const [stars, setStars] = useState(0);

  useEffect(() => {
    fetch(`${API_HOST}/stars`)
      .then((res) => res.json())
      .then((data) => setStars(data.stars));
  }, []);

  return (
    <div className="text-sm m-2 backdrop-blur-[8px] md:text-base group border hover:no-underline border-zinc-400/50 bg-gradient-to-r from-indigo-300/30 to-white/5 rounded-full p-2 px-3 sm:p-1 sm:px-2 mx-auto flex gap-2 items-center text-zinc-50 duration-200 hover:border-primary">
      <AnimatedStar />
      <span
        id="star-count"
        className="bg-gradient-to-br from-primary to-indigo-300 bg-clip-text text-transparent drop-shadow-xl font-bold"
      >
        {!stars ? <LoadingSpinner /> : stars}
      </span>
      <span className="opacity-50">|</span>
      <span className="hidden sm:block font-semibold">
        Give us a star on Github
      </span>
      <span className="sm:hidden font-semibold">Star us on Github</span>
      <AnimatedArrow />
    </div>
  );
};
