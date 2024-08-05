// plugins/proxy-middleware.mjs
import { createProxyMiddleware } from "http-proxy-middleware";

const { MOCKED } = process.env;
const shouldFilterReq = (paths, pathname) => paths.includes(pathname);

const createMockedProxy = (filter) =>
  createProxyMiddleware(filter, {
    target: "http://127.0.0.1:4321",
    changeOrigin: true,
    onProxyReq: (proxyReq) => {
      // replace all slashes after the first one with dashes
      const jsonPath = proxyReq.path.replace(/\//g, "-").replace(/^-/, "/");
      console.log(
        `[🌐 Mocked Proxy] Resolving ${proxyReq.path} to /mocks/${jsonPath}.json`,
      );
      proxyReq.path = `/mocks/${jsonPath}.json`;
    },
  });

const createProxy = (filter) =>
  createProxyMiddleware(filter, {
    target: "http://127.0.0.1:8787",
    changeOrigin: true,
  });

export default (paths) => {
  const apiProxy = MOCKED
    ? createMockedProxy((pathname) => shouldFilterReq(paths, pathname))
    : createProxy((pathname) => shouldFilterReq(paths, pathname));

  console.log(
    "[🌐 Mocked Proxy] Enabled, will resolve /latest/stable to /stable-mock.json",
  );

  return {
    name: "proxy",
    hooks: {
      "astro:server:setup": ({ server }) => {
        server.middlewares.use(apiProxy);
      },
    },
  };
};
