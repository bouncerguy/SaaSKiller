import OpenAI from "openai";
import { log } from "./index";

let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI | null {
  if (openaiClient) return openaiClient;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === "sk-...") return null;
  openaiClient = new OpenAI({ apiKey });
  return openaiClient;
}

export function isOpenAIConfigured(): boolean {
  const key = process.env.OPENAI_API_KEY;
  return !!(key && key !== "sk-...");
}

export interface AgentContext {
  agentName: string;
  agentDescription?: string | null;
  actionsJson?: string | null;
  triggerType: string;
  prompt: string;
}

export interface AgentResult {
  success: boolean;
  response: string;
  model: string;
  tokensUsed?: number;
}

export async function runAgent(context: AgentContext): Promise<AgentResult> {
  const client = getOpenAI();
  if (!client) {
    return {
      success: false,
      response: "OpenAI is not configured. Set the OPENAI_API_KEY environment variable to enable AI agent execution.",
      model: "none",
    };
  }

  const systemPrompt = buildSystemPrompt(context);

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: context.prompt },
      ],
      max_tokens: 1024,
      temperature: 0.7,
    });

    const message = completion.choices[0]?.message?.content || "No response generated.";
    const tokensUsed = completion.usage?.total_tokens;

    log(`AI agent "${context.agentName}" completed: ${tokensUsed} tokens`, "ai");

    return {
      success: true,
      response: message,
      model: completion.model,
      tokensUsed,
    };
  } catch (err: any) {
    log(`AI agent "${context.agentName}" failed: ${err.message}`, "ai");
    return {
      success: false,
      response: `AI execution failed: ${err.message}`,
      model: "gpt-4o-mini",
    };
  }
}

function buildSystemPrompt(context: AgentContext): string {
  let prompt = `You are an AI automation agent named "${context.agentName}".`;
  if (context.agentDescription) {
    prompt += ` Your purpose: ${context.agentDescription}`;
  }
  prompt += ` Trigger type: ${context.triggerType}.`;

  if (context.actionsJson && context.actionsJson !== "[]") {
    try {
      const actions = JSON.parse(context.actionsJson);
      if (Array.isArray(actions) && actions.length > 0) {
        prompt += ` Configured actions: ${JSON.stringify(actions)}.`;
      }
    } catch {}
  }

  prompt += ` Respond concisely and helpfully. If the user asks you to perform an action, describe what you would do and any results.`;
  return prompt;
}
