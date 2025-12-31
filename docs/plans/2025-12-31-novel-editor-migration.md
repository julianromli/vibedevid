# Novel Editor Migration Plan

> **Date:** 2025-12-31
> **Status:** ✅ Completed
> **Estimated Time:** 4-6 hours

## 🎯 Objective

Migrasi penuh dari `RichTextEditor` (Tiptap basic) ke Novel Editor dengan fitur Notion-like dan AI completion via OpenRouter.

## 📋 Summary

| Aspek              | Detail                                                           |
| ------------------ | ---------------------------------------------------------------- |
| **AI Model**       | `google/gemini-3-flash-preview` via OpenRouter                   |
| **AI Features**    | Full: Autocomplete (`++`) + AI Commands (improve, grammar, dll)  |
| **Image Upload**   | Integrasi dengan UploadThing yang sudah ada                      |
| **Slash Commands** | Default Novel commands                                           |
| **Risk Level**     | 🟢 Low (content format compatible)                               |

---

## 📁 File Structure

### New Files

```
app/
├── api/
│   └── ai/
│       └── completion/
│           └── route.ts          # AI completion API endpoint

components/
├── blog/
│   ├── novel-editor.tsx          # Novel Editor wrapper
│   ├── novel-extensions.ts       # Custom extensions (image upload)
│   ├── novel-slash-command.tsx   # Slash command component
│   ├── novel-ai-selector.tsx     # AI selector for bubble menu
│   ├── novel-node-selector.tsx   # Node type selector
│   └── novel-text-buttons.tsx    # Text formatting buttons

lib/
├── ai/
│   └── openrouter.ts             # OpenRouter configuration (maintainable)
```

### Modified Files

```
app/
├── blog/
│   └── editor/
│       └── blog-editor-client.tsx  # Update to use NovelEditor

.env.local                          # Add OPENROUTER_API_KEY
```

### Deprecated Files (Keep for Reference)

```
components/
├── blog/
│   └── rich-text-editor.tsx      # Old Tiptap editor
```

---

## 📦 Dependencies

### New Packages

```bash
# Novel Editor
bun add novel

# OpenRouter AI SDK Provider (for Vercel AI SDK)
bun add @openrouter/ai-sdk-provider

# Vercel AI SDK (required by Novel)
bun add ai @ai-sdk/react
```

### Existing Packages (No Changes)

- `@tiptap/*` - Tetap digunakan (Novel built on Tiptap)
- `uploadthing` - Untuk image upload

---

## 🔧 Implementation Steps

### Phase 1: Setup AI Infrastructure (1-1.5 jam)

#### Step 1.1: Environment Variable

Add to `.env.local`:

```env
OPENROUTER_API_KEY=sk-or-v1-xxxx
```

#### Step 1.2: Create OpenRouter Configuration

**File:** `lib/ai/openrouter.ts`

```typescript
/**
 * OpenRouter AI Configuration
 *
 * Maintainable: Ganti model dengan mengubah AI_MODEL constant
 * Docs: https://openrouter.ai/docs
 */
import { createOpenRouter } from '@openrouter/ai-sdk-provider'

// ============================================
// 🔧 CONFIGURABLE: Change model here
// ============================================
export const AI_MODEL = 'google/gemini-3-flash-preview'

// Alternative models (for future reference):
// - 'google/gemini-2.5-flash-preview-09-2025' (cheaper)
// - 'anthropic/claude-3.5-sonnet' (better quality)
// - 'openai/gpt-4o' (OpenAI alternative)

export const createAIClient = () => {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not set')
  }

  return createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
  })
}

export const getAIModel = () => {
  const client = createAIClient()
  return client.chat(AI_MODEL)
}
```

#### Step 1.3: Create AI Completion API Route

**File:** `app/api/ai/completion/route.ts`

```typescript
import { streamText } from 'ai'
import { getAIModel } from '@/lib/ai/openrouter'

export const runtime = 'edge'

export async function POST(req: Request) {
  const { prompt } = await req.json()

  const result = streamText({
    model: getAIModel(),
    messages: [
      {
        role: 'system',
        content: `You are an AI writing assistant that continues existing text based on context.
Give more weight to the later characters than the beginning ones.
Limit your response to no more than 200 characters.
Construct complete sentences.
Use Markdown formatting when appropriate.`,
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.7,
    maxTokens: 200,
  })

  return result.toDataStreamResponse()
}
```

---

### Phase 2: Create Novel Editor Components (2-2.5 jam)

#### Step 2.1: Novel Editor Wrapper

**File:** `components/blog/novel-editor.tsx`

Main component yang wraps Novel dengan:

- EditorRoot, EditorContent
- Slash command menu
- Bubble menu dengan AI selector
- Integration dengan UploadThing

#### Step 2.2: Extensions Configuration

**File:** `components/blog/novel-extensions.ts`

Configure Tiptap extensions:

- StarterKit (headings, lists, code, etc.)
- TiptapImage (with UploadThing integration)
- TiptapLink
- TaskList, TaskItem
- Placeholder

#### Step 2.3: AI Selector Component

**File:** `components/blog/novel-ai-selector.tsx`

Bubble menu AI commands:

- Improve writing
- Fix grammar
- Make shorter
- Make longer
- Translate to English

#### Step 2.4: Slash Command Configuration

**File:** `components/blog/novel-slash-command.tsx`

Default slash commands:

- Text (paragraph)
- Heading 1, 2, 3
- Bullet List
- Numbered List
- Quote
- Code Block
- To-do List

#### Step 2.5: Supporting Components

**Files:**

- `components/blog/novel-node-selector.tsx` - Node type selector
- `components/blog/novel-text-buttons.tsx` - Bold, italic, etc.

---

### Phase 3: Integration & Migration (1 jam)

#### Step 3.1: Update Blog Editor Client

**File:** `app/blog/editor/blog-editor-client.tsx`

Changes:

1. Replace `RichTextEditor` import with `NovelEditor`
2. Add AI autocomplete trigger (`++`)
3. Integrate with existing UploadThing for images
4. Keep same content format (Tiptap JSON)

#### Step 3.2: Verify Blog Post Renderer

Ensure blog post viewer can render Novel content (should be compatible as both use Tiptap JSON format).

---

### Phase 4: Testing & Cleanup (30 menit)

#### Functional Tests

- [ ] Slash commands (`/`) work
- [ ] AI autocomplete (`++`) triggers completion
- [ ] AI commands in bubble menu work
- [ ] Image upload via UploadThing works
- [ ] Create new blog post works
- [ ] Edit existing blog post works
- [ ] Preview blog post works
- [ ] Existing blog posts render correctly

#### Technical Tests

- [ ] TypeScript compiles without errors (`bun tsc --noEmit`)
- [ ] Biome linting passes (`bun lint`)
- [ ] No console errors in browser

---

## 📊 Risk Assessment

| Risk                           | Level     | Mitigation                               |
| ------------------------------ | --------- | ---------------------------------------- |
| Content format incompatibility | 🟢 Low    | Novel uses Tiptap JSON (same as current) |
| OpenRouter API errors          | 🟡 Medium | Add error handling, fallback messages    |
| Bundle size increase           | 🟡 Medium | Novel ~120kB, but lazy loaded            |
| UploadThing integration        | 🟢 Low    | Keep existing implementation             |

---

## ✅ Definition of Done

- [ ] Novel Editor installed and configured
- [ ] OpenRouter AI completion API working
- [ ] Slash commands (`/`) functional
- [ ] AI autocomplete (`++`) working
- [ ] AI commands (bubble menu) working
- [ ] Image upload via UploadThing integrated
- [ ] Create new blog post works
- [ ] Edit existing blog post works
- [ ] Preview blog post works
- [ ] Existing blog posts render correctly
- [ ] TypeScript compiles without errors
- [ ] Biome linting passes
- [ ] No regressions in existing functionality

---

## 🔄 Future Enhancements (Out of Scope)

- [ ] Real-time collaboration (Liveblocks/Yjs)
- [ ] Custom AI commands
- [ ] More slash command options (embed, table, etc.)
- [ ] Drag-and-drop block reordering
- [ ] AI image generation

---

## 📚 References

- [Novel Documentation](https://novel.sh/docs)
- [OpenRouter Documentation](https://openrouter.ai/docs)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [Tiptap Documentation](https://tiptap.dev/docs)
- [OpenRouter AI SDK Provider](https://github.com/OpenRouterTeam/ai-sdk-provider)

---

## 📝 Notes

### Model Configuration

The AI model is configured in `lib/ai/openrouter.ts`. To change the model:

1. Open `lib/ai/openrouter.ts`
2. Change the `AI_MODEL` constant
3. No other changes required

Available models on OpenRouter:

- `google/gemini-3-flash-preview` - Fast, good quality ($0.50/M input, $3/M output)
- `google/gemini-2.5-flash-preview-09-2025` - Cheaper ($0.30/M input, $2.50/M output)
- `anthropic/claude-3.5-sonnet` - Best quality (higher cost)
- `openai/gpt-4o` - OpenAI alternative

### Content Format Compatibility

Both the current `RichTextEditor` and Novel use Tiptap JSON format:

```json
{
  "type": "doc",
  "content": [
    {
      "type": "paragraph",
      "content": [{ "type": "text", "text": "Hello world" }]
    }
  ]
}
```

This means:

- ✅ Existing blog posts will work without migration
- ✅ New posts created with Novel will be compatible
- ✅ No database changes required
