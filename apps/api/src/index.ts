// index.ts
import { Hono } from "hono";
import token from "./handlers/token.js";
import updater from "./handlers/updater.js";
import webhook from "./handlers/webhook.js";
import { cors } from "hono/cors";

const app = new Hono();
app.use("*", cors());

// routes for token stuff
app.route("/", token);

// routes for updater stuff
app.route("/", updater);

// routes for canary
app.route("/", webhook);

export default app;
