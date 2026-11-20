import type { Context } from "@actions/github/lib/context";
import type { GitHub } from "@actions/github/lib/utils";

// The arguments used by our actions/github-script handlers.
export type AsyncFunctionArguments = {
  context: Context;
  github: InstanceType<typeof GitHub>;
};
