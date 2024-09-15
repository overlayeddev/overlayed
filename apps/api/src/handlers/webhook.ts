import { Bindings, Request } from "../types.js";
import { Hono } from "hono/quick";
import { WorkflowRunEvent } from "@octokit/webhooks-types";
import { Webhooks } from "@octokit/webhooks";
import { isProd } from "../utils.js";

const app = new Hono<{ Bindings: Bindings }>();

app.post("/webhook", async (c) => {
	const webhooks = new Webhooks({
		secret: c.env.CANARY_UPLOAD_SECRET,
	});

	const isProduction = isProd(c.req.url);
	const body = await c.req.json();
	const bodyAsString = JSON.stringify(body);
	const signature = c.req.header("x-hub-signature-256") || "";

	// only enable this is production!
	if (isProduction && !(await webhooks.verify(bodyAsString, signature))) {
		return c.json({ error: "Unauthorized" });
	}

	// if it's a workflow run use that type
	if ("workflow_run" in body) {
		console.log("handling workflow run event");
		const payload = body as WorkflowRunEvent;
		const isSuccesfulRun =
			payload.action === "completed" &&
			payload.workflow_run.conclusion === "success";

		if (!isSuccesfulRun) {
			return c.json({ error: "Not a successful run" });
		}

		if (payload.workflow.name === "Canary") {
			return await handleCanaryRun({ c, payload });
		}
	}

	return c.json({ error: "Unable to handle webhook" });
});

async function handleCanaryRun({
	c,
	payload,
}: {
	c: Request;
	payload: WorkflowRunEvent;
}) {
	const sha = payload.workflow_run.head_sha;
	await fetch(c.env.CANARY_WEBHOOK_URL, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			content: `<@&1266782388168560952> New Overlayed Canary version uploaded [${sha}](<https://github.com/overlayeddev/overlayed/commit/${sha}>)

You can download it on [overlayed.dev/canary](<https://overlayed.dev/canary>)
`,
		}),
	});

	return c.json(
		{
			status: "success",
		},
		200,
	);
}

export default app;
