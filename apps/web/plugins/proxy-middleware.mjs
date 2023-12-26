// plugins/proxy-middleware.mjs
import { createProxyMiddleware } from "http-proxy-middleware";

export default (context, options) => {
  const apiProxy = createProxyMiddleware(context, options);

  return {
    name: "proxy",
    hooks: {
      "astro:server:setup": ({ server }) => {
        server.middlewares.use(apiProxy);
      },
    },
  };
};
