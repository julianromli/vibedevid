import { createFileRoute } from "@tanstack/react-router";
import { generateText } from "ai";
import { getAIModel } from "@/lib/ai/openrouter";

interface EnhanceRequest {
  description: string;
  title?: string;
  tagline?: string;
  tags?: string[];
}

const SYSTEM_PROMPT = `Kamu adalah AI writer untuk VibeDev Indonesia community - komunitas developer Indonesia.

TUGAS:
- Jika diberikan description mentah: Rapikan dan enhance menjadi description yang profesional
- Jika description kosong tapi ada title/tags: Generate description baru berdasarkan context

ATURAN PENULISAN:
1. Gunakan bahasa Indonesia yang santai tapi profesional (boleh campur bahasa Inggris untuk istilah teknis)
2. Struktur yang jelas dan mudah dibaca
3. Highlight fitur utama dengan bullet points jika ada banyak fitur
4. JANGAN tambahkan informasi yang tidak ada di input (jangan mengarang)
5. JANGAN gunakan markdown headers (# atau ##)
6. Boleh gunakan emoji secukupnya untuk highlight (🚀 💻 ✨ dll)
7. Maksimal 4000 karakter
8. Langsung tulis description-nya saja, tanpa pembuka seperti "Berikut adalah..." atau "Ini adalah..."

FORMAT OUTPUT (contoh):
[Nama Project] adalah [deskripsi singkat apa ini].

🚀 Fitur Utama:
• [Fitur 1]
• [Fitur 2]
• [Fitur 3]

💻 Tech Stack:
[List teknologi yang digunakan]

[Closing statement singkat - untuk siapa project ini cocok]`;

export const Route = createFileRoute("/api/ai/enhance-description")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body: EnhanceRequest = await request.json();
          const { description, title, tagline, tags } = body;

          if (!description?.trim() && !title?.trim()) {
            return Response.json(
              { error: "Minimal harus ada title atau description" },
              { status: 400 },
            );
          }

          const contextParts: string[] = [];
          if (title?.trim()) contextParts.push(`Title: ${title.trim()}`);
          if (tagline?.trim()) contextParts.push(`Tagline: ${tagline.trim()}`);
          if (tags?.length) contextParts.push(`Tech Stack/Tags: ${tags.join(", ")}`);

          let userPrompt: string;
          if (description?.trim()) {
            userPrompt = `${contextParts.join("\n")}

Description (tolong rapikan dan enhance):
${description.trim()}`;
          } else {
            userPrompt = `${contextParts.join("\n")}

Tolong buatkan description yang menarik untuk project ini berdasarkan informasi di atas.`;
          }

          const result = await generateText({
            model: getAIModel(),
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: userPrompt },
            ],
            temperature: 0.7,
            maxOutputTokens: 2500,
          });

          const enhancedDescription = result.text?.trim() || "";

          if (!enhancedDescription) {
            return Response.json({ error: "AI tidak menghasilkan output" }, { status: 500 });
          }

          return Response.json({ description: enhancedDescription });
        } catch (error) {
          console.error("AI enhance description error:", error);
          return Response.json(
            { error: "Gagal generate description. Coba lagi." },
            { status: 500 },
          );
        }
      },
    },
  },
});
