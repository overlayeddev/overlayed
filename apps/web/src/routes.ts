type Route<T> = Readonly<{
  title: T;
  path: T;
}>;

export const routes: ReadonlyArray<Route<string>> = [
  {
    title: "Home",
    path: "/",
  },
  {
    title: "About",
    path: "/about",
  },
  {
    title: "Download",
    path: "/download",
  },
  {
    title: "Canary",
    path: "/canary",
  },
  {
    title: "Discord",
    path: "/discord",
  },
  {
    title: "Blog",
    path: "/blog",
  },
];
