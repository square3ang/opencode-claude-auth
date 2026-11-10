export interface ModelOverride {
  exclude?: string[]
  add?: string[]
  disableEffort?: boolean
}

export interface ModelConfig {
  ccVersion: string
  baseBetas: string[]
  longContextBetas: string[]
  modelOverrides: Record<string, ModelOverride>
}

export const config: ModelConfig = {
  ccVersion: "2.1.321",
  baseBetas: [
    "claude-code-20250219",
    "oauth-2025-04-20",
    "interleaved-thinking-2025-05-14",
    "context-management-2025-06-27",
    "advisor-tool-2026-03-01",
    "advanced-tool-use-2025-11-20",
    "thinking-token-count-2026-05-13",
    "extended-cache-ttl-2025-04-11",
  ],
  longContextBetas: [
    "context-1m-2025-08-07",
    "interleaved-thinking-2025-05-14",
  ],
  // NOTE: getModelOverride is first-match-wins. Keep "haiku" ahead of any
  // "4-5" add so claude-haiku-4-5 never receives effort. "opus-4-5" is
  // more specific than a bare "4-5" would be (sonnet-4-5 still omits
  // effort). Pinned by the "effort beta" test in betas.test.ts from
  // Claude CLI 2.1.257 intercept traffic.
  modelOverrides: {
    haiku: {
      exclude: ["effort-2025-11-24"],
      disableEffort: true,
    },
    "opus-4-5": {
      add: ["effort-2025-11-24"],
    },
    "4-6": {
      add: ["effort-2025-11-24"],
    },
    "4-7": {
      add: ["effort-2025-11-24"],
    },
  },
}

/**
 * Find the override entry matching a model ID.
 * Keys are matched via includes() against the lowercased model ID.
 *
 * First-match-wins: if multiple keys match, only the first (by insertion
 * order) is returned. List more specific keys before broader ones
 * (e.g. "opus-4-6" before "opus") so they take priority.
 */
export function getModelOverride(modelId: string): ModelOverride | null {
  const lower = modelId.toLowerCase()
  for (const [pattern, override] of Object.entries(config.modelOverrides)) {
    if (lower.includes(pattern)) return override
  }
  return null
}

/** SDK version OpenCode's claude-agent provider pins; the user agent names it. */
const AGENT_SDK_VERSION = "0.3.301"

export function getUserAgent(): string {
  if (process.env.ANTHROPIC_USER_AGENT) return process.env.ANTHROPIC_USER_AGENT
  const version = process.env.ANTHROPIC_CLI_VERSION ?? config.ccVersion
  const entrypoint = process.env.CLAUDE_CODE_ENTRYPOINT ?? "opencode"
  const sdk = process.env.CLAUDE_AGENT_SDK_VERSION ?? AGENT_SDK_VERSION
  const clientApp = process.env.CLAUDE_AGENT_SDK_CLIENT_APP
  return `claude-cli/${version} (external, ${entrypoint}, agent-sdk/${sdk}${
    clientApp ? `, client-app/${clientApp}` : ""
  })`
}
