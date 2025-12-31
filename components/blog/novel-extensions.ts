import { cx } from 'class-variance-authority'
import {
  Command,
  createSuggestionItems,
  HorizontalRule,
  handleCommandNavigation,
  Placeholder,
  renderItems,
  StarterKit,
  TaskItem,
  TaskList,
  TiptapImage,
  TiptapLink,
  UpdatedImage,
} from 'novel'

/**
 * Placeholder extension with customizable placeholder text
 */
export const placeholder = Placeholder

/**
 * Link extension with Tailwind styling
 */
export const tiptapLink = TiptapLink.configure({
  HTMLAttributes: {
    class: cx(
      'text-muted-foreground underline underline-offset-[3px] hover:text-primary transition-colors cursor-pointer',
    ),
  },
})

/**
 * Task list extension with proper styling
 */
export const taskList = TaskList.configure({
  HTMLAttributes: {
    class: cx('not-prose pl-2'),
  },
})

/**
 * Task item extension with flex layout
 */
export const taskItem = TaskItem.configure({
  HTMLAttributes: {
    class: cx('flex items-start my-4'),
  },
  nested: true,
})

/**
 * Horizontal rule with border styling
 */
export const horizontalRule = HorizontalRule.configure({
  HTMLAttributes: {
    class: cx('mt-4 mb-6 border-t border-muted-foreground'),
  },
})

/**
 * StarterKit with customized list and code styling
 */
export const starterKit = StarterKit.configure({
  bulletList: {
    HTMLAttributes: {
      class: cx('list-disc list-outside leading-3 -mt-2'),
    },
  },
  orderedList: {
    HTMLAttributes: {
      class: cx('list-decimal list-outside leading-3 -mt-2'),
    },
  },
  listItem: {
    HTMLAttributes: {
      class: cx('leading-normal -mb-2'),
    },
  },
  blockquote: {
    HTMLAttributes: {
      class: cx('border-l-4 border-primary'),
    },
  },
  codeBlock: {
    HTMLAttributes: {
      class: cx('rounded-sm bg-muted border p-5 font-mono font-medium'),
    },
  },
  code: {
    HTMLAttributes: {
      class: cx('rounded-md bg-muted px-1.5 py-1 font-mono font-medium'),
      spellcheck: 'false',
    },
  },
  horizontalRule: false,
  dropcursor: {
    color: 'hsl(var(--primary))',
    width: 4,
  },
  gapcursor: false,
})

/**
 * Image extension for Novel editor
 * Note: Image upload is handled separately via UploadThing
 */
export const tiptapImage = TiptapImage.configure({
  allowBase64: false,
  HTMLAttributes: {
    class: cx('rounded-lg border border-muted'),
  },
})

/**
 * Default extensions for the Novel editor
 * Includes all commonly used extensions with proper Tailwind styling
 */
export const defaultExtensions = [
  starterKit,
  placeholder,
  tiptapLink,
  tiptapImage,
  UpdatedImage,
  taskList,
  taskItem,
  horizontalRule,
]

// Re-export command-related utilities for slash commands
export { Command, createSuggestionItems, renderItems, handleCommandNavigation }
