import type { AIProviderAdapter } from "@/lib/ai-gateway";

export const OpenRouterProvider: AIProviderAdapter = {
  name: "openrouter",

  async chat({ model, messages, maxTokens, temperature, apiKey, baseUrl }) {
    const url = baseUrl ?? "https://openrouter.ai/api/v1/chat/completions";

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "https://edumanage.com",
        "X-Title": "EduManage",
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: maxTokens ?? 4096,
        temperature: temperature ?? 0.7,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`OpenRouter error ${response.status}: ${body}`);
    }

    const data = await response.json();
    const choice = data.choices?.[0];

    return {
      content: choice?.message?.content ?? "",
      inputTokens: data.usage?.prompt_tokens ?? 0,
      outputTokens: data.usage?.completion_tokens ?? 0,
      cachedTokens: data.usage?.prompt_tokens_details?.cached_tokens ?? 0,
    };
  },
};
