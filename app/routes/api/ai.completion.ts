import { createFileRoute } from "@tanstack/react-router";
import { streamText } from "ai";
import { getAIModel } from "@/lib/ai/openrouter";

export const Route = createFileRoute("/api/ai/completion")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const { prompt } = body;

          if (!prompt || typeof prompt !== "string") {
            return Response.json({ error: "Invalid prompt" }, { status: 400 });
          }

          const result = streamText({
            model: getAIModel(),
            messages: [
              {
                role: "system",
                content: `You are an AI writing assistant that continues existing text based on context.
Give more weight to the later characters than the beginning ones.
Limit your response to no more than 200 characters.
Construct complete sentences.
Use Markdown formatting when appropriate.`,
              },
              {
                role: "user",
                content: prompt,
              },
            ],
            temperature: 0.7,
            maxOutputTokens: 200,
          });

          return result.toTextStreamResponse();
        } catch (error) {
          console.error("AI completion error:", error);
          return Response.json({ error: "Failed to generate completion" }, { status: 500 });
        }
      },
    },
  },
});
