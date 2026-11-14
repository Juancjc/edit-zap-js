import { Monospace, Variables } from "./extensions/index.js";
import { labels, icons, type ToolbarAction } from "./toolbar/index.js";
export type { ToolbarAction } from "./toolbar/index.js";
import { Editor, type JSONContent } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import DOMPurify from "dompurify";
import {
  parseWhatsApp,
  serializeWhatsApp,
  getPlainText,
  toHTML,
  applyVariables,
  safeUrl,
  validateDocument,
  type MessageDocument,
} from "../../core/src/index.js";
import "./style.css";
export * from "../../core/src/index.js";
export interface ChangePayload {
  whatsAppText: string;
  plainText: string;
  json: MessageDocument;
}
export interface EditZapOptions {
  element: HTMLElement | string;
  content?: string | MessageDocument;
  placeholder?: string;
  toolbar?: boolean | ToolbarAction[];
  preview?: boolean;
  theme?: "light" | "dark";
  minHeight?: string;
  maxHeight?: string;
  variables?: string[];
  previewData?: Record<string, unknown>;
  onChange?: (payload: ChangePayload) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onReady?: (editor: EditZapEditor) => void;
  onError?: (error: Error) => void;
}
export class EditZapEditor {
  readonly engine: Editor;
  readonly root: HTMLElement;
  private area: HTMLElement;
  private raw: HTMLTextAreaElement;
  private bubble: HTMLElement;
  private count: HTMLElement;
  private actions = new Map<ToolbarAction, HTMLButtonElement>();
  private options: EditZapOptions;
  private dead = false;
  constructor(options: EditZapOptions) {
    if (typeof document === "undefined")
      throw new Error("Create EditZap only after mounting in a browser");
    this.options = options;
    const host =
      typeof options.element === "string"
        ? document.querySelector<HTMLElement>(options.element)
        : options.element;
    if (!host) throw new Error("EditZap mount element not found");
    const doc =
      typeof options.content === "string"
        ? parseWhatsApp(options.content)
        : (options.content ?? parseWhatsApp(""));
    validateDocument(doc);
    this.root = document.createElement("section");
    this.root.className = "ez";
    this.root.dataset.theme = options.theme ?? "light";
    if (options.minHeight)
      this.root.style.setProperty("--ez-min-height", options.minHeight);
    if (options.maxHeight)
      this.root.style.setProperty("--ez-max-height", options.maxHeight);
    const tabs = document.createElement("div");
    tabs.className = "ez-tabs";
    tabs.setAttribute("aria-label", "Modo de edição");
    this.area = document.createElement("div");
    this.area.className = "ez-area";
    this.raw = document.createElement("textarea");
    this.raw.className = "ez-raw";
    this.raw.setAttribute("aria-label", "Texto WhatsApp");
    this.raw.hidden = true;
    const preview = document.createElement("div");
    preview.className = "ez-preview";
    preview.hidden = true;
    this.bubble = document.createElement("div");
    this.bubble.className = "ez-bubble";
    preview.append(this.bubble);
    const toolbar = document.createElement("div");
    toolbar.className = "ez-toolbar";
    toolbar.setAttribute("role", "toolbar");
    toolbar.setAttribute("aria-label", "Formatação");
    const available = Array.isArray(options.toolbar)
      ? options.toolbar
      : (Object.keys(labels) as ToolbarAction[]);
    if (options.toolbar !== false)
      for (const action of available) {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = icons[action];
        b.title = labels[action];
        b.setAttribute("aria-label", labels[action]);
        b.addEventListener("mousedown", (e) => e.preventDefault());
        b.addEventListener("click", () => this.run(action));
        toolbar.append(b);
        this.actions.set(action, b);
      }
    for (const [mode, label] of [
      ["visual", "Editor"],
      ["raw", "Texto bruto"],
      ...(options.preview === false ? [] : [["preview", "Prévia"]]),
    ]) {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = label;
      b.dataset.mode = mode;
      b.setAttribute("aria-pressed", String(mode === "visual"));
      b.onclick = () => {
        this.area.hidden = mode !== "visual";
        toolbar.hidden = mode !== "visual";
        this.raw.hidden = mode !== "raw";
        preview.hidden = mode !== "preview";
        tabs
          .querySelectorAll("button")
          .forEach((btn) =>
            btn.setAttribute("aria-pressed", String(btn === b)),
          );
        this.update();
      };
      tabs.append(b);
    }
    this.count = document.createElement("div");
    this.count.className = "ez-count";
    this.count.setAttribute("aria-live", "polite");
    this.root.append(tabs, toolbar, this.area, this.raw, preview, this.count);
    host.append(this.root);
    this.engine = new Editor({
      element: this.area,
      extensions: [
        StarterKit.configure({
          trailingNode: false,
          heading: false,
          horizontalRule: false,
          underline: false,
          link: {
            openOnClick: false,
            protocols: ["https", "http", "mailto"],
            isAllowedUri: (url) => safeUrl(url),
          },
        }),
        Placeholder.configure({
          placeholder: options.placeholder ?? "Digite sua mensagem...",
        }),
        Monospace,
        Variables,
      ],
      content: doc as JSONContent,
      editorProps: {
        attributes: {
          "aria-label": options.placeholder ?? "Mensagem",
          role: "textbox",
          "aria-multiline": "true",
        },
        transformPastedHTML: (html) =>
          DOMPurify.sanitize(html, {
            ALLOWED_TAGS: [
              "p",
              "br",
              "strong",
              "b",
              "em",
              "i",
              "s",
              "strike",
              "code",
              "pre",
              "blockquote",
              "ul",
              "ol",
              "li",
              "a",
              "span",
            ],
            ALLOWED_ATTR: ["href", "start", "data-monospace"],
          }),
      },
      onUpdate: () => {
        this.update();
        this.notify();
      },
      onSelectionUpdate: () => this.active(),
      onFocus: () => options.onFocus?.(),
      onBlur: () => options.onBlur?.(),
    });
    this.raw.oninput = () => {
      try {
        this.engine.commands.setContent(
          parseWhatsApp(this.raw.value) as JSONContent,
          { emitUpdate: false },
        );
        this.update(false);
        this.notify();
      } catch (error) {
        this.error(error);
      }
    };
    this.update();
    queueMicrotask(() => {
      if (!this.dead) options.onReady?.(this);
    });
  }
  private error(error: unknown) {
    this.options.onError?.(
      error instanceof Error ? error : new Error(String(error)),
    );
  }
  private notify() {
    this.options.onChange?.({
      whatsAppText: this.getWhatsAppText(),
      plainText: this.getPlainText(),
      json: this.getJSON(),
    });
  }
  private active() {
    for (const [action, b] of this.actions) {
      if (["undo", "redo", "emoji", "variable", "link"].includes(action))
        continue;
      b.setAttribute("aria-pressed", String(this.engine.isActive(action)));
    }
    const undo = this.actions.get("undo"),
      redo = this.actions.get("redo");
    if (undo) undo.disabled = !this.engine.can().undo();
    if (redo) redo.disabled = !this.engine.can().redo();
  }
  private update(raw = true) {
    if (!this.engine) return;
    if (raw) this.raw.value = this.getWhatsAppText();
    this.bubble.innerHTML = toHTML(
      applyVariables(this.getJSON(), this.options.previewData ?? {}),
    );
    this.count.textContent = `${Array.from(this.getPlainText()).length} caracteres`;
    this.active();
  }
  run(action: ToolbarAction): void {
    try {
      const chain = this.engine.chain().focus();
      switch (action) {
        case "bold":
          chain.toggleBold().run();
          break;
        case "italic":
          chain.toggleItalic().run();
          break;
        case "strike":
          chain.toggleStrike().run();
          break;
        case "code":
          chain.toggleCode().run();
          break;
        case "monospace":
          chain.toggleMark("monospace").run();
          break;
        case "blockquote":
          chain.toggleBlockquote().run();
          break;
        case "bulletList":
          chain.toggleBulletList().run();
          break;
        case "orderedList":
          chain.toggleOrderedList().run();
          break;
        case "undo":
          chain.undo().run();
          break;
        case "redo":
          chain.redo().run();
          break;
        case "emoji":
          this.picker(
            "Escolha um emoji",
            ["😀", "😊", "❤️", "🎉", "👍", "📦", "✅", "🙏"],
            (value) => this.insertText(value),
          );
          break;
        case "variable":
          this.picker(
            "Inserir variável",
            this.options.variables ?? ["nome", "pedido"],
            (value) => this.insertVariable(value),
          );
          break;
        case "link": {
          const href = window.prompt("URL completa (https://...)");
          if (href) this.insertLink(href);
          break;
        }
      }
    } catch (error) {
      this.error(error);
    }
  }
  private picker(
    label: string,
    items: string[],
    select: (value: string) => void,
  ) {
    this.root.querySelector(".ez-picker")?.remove();
    const panel = document.createElement("div");
    panel.className = "ez-picker";
    panel.setAttribute("role", "group");
    panel.setAttribute("aria-label", label);
    for (const item of items) {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = item;
      b.onmousedown = (e) => e.preventDefault();
      b.onclick = () => {
        select(item);
        panel.remove();
      };
      panel.append(b);
    }
    const close = document.createElement("button");
    close.type = "button";
    close.textContent = "Fechar";
    close.onclick = () => panel.remove();
    panel.append(close);
    this.root.append(panel);
    panel.querySelector("button")?.focus();
  }
  insertText(text: string): void {
    this.engine.chain().focus().insertContent({ type: "text", text }).run();
  }
  insertVariable(name: string): void {
    if (!/^[\w.-]+$/.test(name)) throw new Error("Invalid variable name");
    this.insertText(`{{${name}}}`);
  }
  insertLink(url: string): void {
    if (!safeUrl(url)) throw new Error("Unsafe URL");
    if (this.engine.state.selection.empty)
      this.engine
        .chain()
        .focus()
        .insertContent({
          type: "text",
          text: url,
          marks: [{ type: "link", attrs: { href: url } }],
        })
        .run();
    else this.engine.chain().focus().setLink({ href: url }).run();
  }
  getWhatsAppText(): string {
    return serializeWhatsApp(this.getJSON());
  }
  getJSON(): MessageDocument {
    return this.engine.getJSON() as MessageDocument;
  }
  getHTML(): string {
    return toHTML(this.getJSON());
  }
  getPlainText(): string {
    return getPlainText(this.getJSON());
  }
  setContent(content: string | MessageDocument): void {
    const doc = typeof content === "string" ? parseWhatsApp(content) : content;
    validateDocument(doc);
    this.engine.commands.setContent(doc as JSONContent);
    this.update();
  }
  setHTML(html: string): void {
    this.engine.commands.setContent(
      DOMPurify.sanitize(html, {
        ALLOWED_TAGS: [
          "p",
          "br",
          "b",
          "strong",
          "i",
          "em",
          "s",
          "code",
          "pre",
          "blockquote",
          "ul",
          "ol",
          "li",
          "a",
        ],
        ALLOWED_ATTR: ["href", "start"],
      }),
    );
  }
  clear(): void {
    this.engine.commands.clearContent();
  }
  focus(): void {
    this.engine.commands.focus();
  }
  setTheme(theme: "light" | "dark"): void {
    this.root.dataset.theme = theme;
  }
  setPreviewData(data: Record<string, unknown>): void {
    this.options.previewData = data;
    this.update();
  }
  destroy(): void {
    if (this.dead) return;
    this.dead = true;
    this.engine.destroy();
    this.root.remove();
  }
}
export function createEditZap(options: EditZapOptions): EditZapEditor {
  return new EditZapEditor(options);
}
