// index.ts
import { Hono } from "hono";
import token from "./handlers/token.js";
import updater from "./handlers/updater.js";
import canary from "./handlers/canary.js";
import github from "./handlers/github.js";
import { cors } from "hono/cors";

const app = new Hono();
app.use("*", cors());

// NOTE: because this one has a route with /download/:platform/:version we need to to take precedence
// routes for github downloads
app.route("/", github);

// routes for token stuff
app.route("/", token);

// routes for updater stuff
app.route("/", updater);

// routes for canary
app.route("/", canary);

export default app;
