import { createProxyMiddleware } from "http-proxy-middleware";
import type { AstroIntegration } from "astro";

const { MOCKED } = process.env;
const isMockedMode = Boolean(MOCKED);

const createMockedProxy = (filter: string[]) =>
  createProxyMiddleware({
    pathFilter: filter,
    // TODO: use PORT var from the vite config
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

const createProxy = (filter: string[]) =>
  createProxyMiddleware({
    pathFilter: filter,
    target: "http://127.0.0.1:8787",
    changeOrigin: true,
  });

export default (paths: string[]) => {
  const apiProxy = isMockedMode ? createMockedProxy(paths) : createProxy(paths);

  return {
    name: "proxy",
    hooks: {
      "astro:server:setup": ({ server }) => {
        server.middlewares.use(apiProxy);
      },
    },
  } as AstroIntegration;
};
