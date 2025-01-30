import { createProxyMiddleware } from "http-proxy-middleware";

const { MOCKED } = process.env;
const shouldFilterReq = (paths, pathname) => paths.includes(pathname);
const isMockedMode = Boolean(MOCKED);

console.log(`[🌐 Proxy] Running in ${isMockedMode ? "mocked" : "proxy"} mode`);
/**
 * @param {string} filter
 */
const createMockedProxy = (filter) =>
  createProxyMiddleware({
    pathFilter: filter,
    target: "http://127.0.0.1:3000",
    changeOrigin: true,
    pathRewrite: (path) => {
      const jsonPath = path.replace(/\//g, "-").replace(/^-/, "/").substring(1);
      console.log(
        `[🤡 Mocked Request] Resolving ${path} to /mocks/${jsonPath}.json`,
      );
      return `/mocks/${jsonPath}.json`;
    },
  });

const createProxy = (filter) =>
  createProxyMiddleware(filter, {
    target: "http://127.0.0.1:8787",
    changeOrigin: true,
  });

/**
 * @param {string[]} paths
 */
export default (paths) => {
  const apiProxy = isMockedMode
    ? createMockedProxy((pathname) => shouldFilterReq(paths, pathname))
    : createProxy((pathname) => shouldFilterReq(paths, pathname));

  return {
    name: "proxy",
    hooks: {
      "astro:server:setup": ({ server }) => {
        server.middlewares.use(apiProxy);
      },
    },
  };
};
