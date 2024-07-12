// plugins/proxy-middleware.mjs
import { createProxyMiddleware } from "http-proxy-middleware";

export default (paths) => {
  const filter = function (pathname) {
    return paths.includes(pathname);
  };

  const apiProxy = createProxyMiddleware(filter, {
    target: "http://localhost:8787",
    changeOrigin: true,
  });

  return {
    name: "proxy",
    hooks: {
      "astro:server:setup": ({ server }) => {
        server.middlewares.use(apiProxy);
      },
    },
  };
};
