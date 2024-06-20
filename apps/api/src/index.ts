// index.ts
import { Hono } from "hono";
import token from "./handlers/token.js";
import updater from "./handlers/updater.js";
import canary from "./handlers/canary.js";
import { cors } from "hono/cors";

const app = new Hono();
app.use("*", cors());

// routes for token stuff
app.route("/", token);

// routes for updater stuff
app.route("/", updater);

// routes for canary
app.route("/", canary);

export default app;
