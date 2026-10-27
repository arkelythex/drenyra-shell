/**
 * Print the control mutation scoreboard (REQ-CONF-009).
 *
 *   bun run eval:controls
 *
 * Exits 0 after printing, even with survivors: survivors are kernel gaps to
 * report upstream, not a failure of this run. The ratchet that fails on a
 * changed verdict is `__tests__/control-mutation.test.ts`.
 */

import { MUTATION_BASELINE, MUTATION_CASES } from "../lib/control-mutation-corpus.js";
import { formatScoreboard, runMutationSuite } from "../lib/control-mutation.js";

console.log(formatScoreboard(runMutationSuite(MUTATION_CASES, MUTATION_BASELINE)));
