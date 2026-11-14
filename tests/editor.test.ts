import { afterEach, describe, it, expect, vi } from "vitest";
import {
  createEditZap,
  type EditZapEditor,
} from "../packages/editor/src/index";
const instances: EditZapEditor[] = [];
function create(options: Partial<Parameters<typeof createEditZap>[0]> = {}) {
  const host = document.createElement("div");
  document.body.append(host);
  const editor = createEditZap({ element: host, ...options });
  instances.push(editor);
  return editor;
}
afterEach(() => {
  instances.splice(0).forEach((e) => e.destroy());
  document.body.innerHTML = "";
});
describe("visual editor", () => {
  it("formats a selection, exports it and supports undo/redo", () => {
    const e = create({ content: "Olá João" });
    e.engine.commands.setTextSelection({ from: 5, to: 9 });
    e.run("bold");
    expect(e.getWhatsAppText()).toBe("Olá *João*");
    e.run("undo");
    expect(e.getWhatsAppText()).toBe("Olá João");
    e.run("redo");
    expect(e.getHTML()).toContain("<strong>João</strong>");
  });
  it("keeps instances independent and removes resources", () => {
    const a = create(),
      b = create({ content: "B" });
    a.setContent("*A*");
    expect(b.getWhatsAppText()).toBe("B");
    const root = a.root;
    a.destroy();
    expect(root.isConnected).toBe(false);
    expect(b.root.isConnected).toBe(true);
  });
  it("emits payloads, ready, focus and blur", async () => {
    const change = vi.fn(),
      ready = vi.fn(),
      focus = vi.fn(),
      blur = vi.fn();
    const e = create({
      onChange: change,
      onReady: ready,
      onFocus: focus,
      onBlur: blur,
    });
    await Promise.resolve();
    expect(ready).toHaveBeenCalledWith(e);
    e.setContent("*Olá*");
    expect(change).toHaveBeenCalledWith(
      expect.objectContaining({
        whatsAppText: "*Olá*",
        plainText: "Olá",
        json: expect.any(Object),
      }),
    );
    e.engine.commands.focus(undefined, { scrollIntoView: false });
    await new Promise((r) => setTimeout(r, 30));
    e.engine.commands.blur();
    await new Promise((r) => setTimeout(r, 30));
    expect(focus).toHaveBeenCalled();
    expect(blur).toHaveBeenCalled();
  });
  it("sanitizes imported and pasted HTML", () => {
    const e = create();
    e.setHTML(
      '<p onclick="bad()"><script>alert(1)</script><b>Safe</b><a href="javascript:alert(1)">link</a><img src=x onerror=bad()></p>',
    );
    expect(e.getHTML()).toContain("<strong>Safe</strong>");
    expect(e.getHTML()).not.toMatch(/script|onclick|onerror|javascript:/);
    const sanitize = e.engine.view.someProp("transformPastedHTML")!;
    expect(
      (sanitize as (html: string) => string)(
        '<p onclick="bad()">hello<script>bad()</script></p>',
      ),
    ).toBe("<p>hello</p>");
  });
  it("supports raw mode, preview variables, theme and clear", () => {
    const e = create({ content: "Olá {{nome}}", previewData: { nome: "Ana" } });
    expect(e.root.querySelector(".ez-bubble")!.textContent).toBe("Olá Ana");
    e.setTheme("dark");
    expect(e.root.dataset.theme).toBe("dark");
    e.root.querySelectorAll("button")[1].click();
    const raw = e.root.querySelector("textarea")!;
    raw.value = "*Novo*";
    raw.dispatchEvent(new Event("input"));
    expect(e.getPlainText()).toBe("Novo");
    e.clear();
    expect(e.getPlainText()).toBe("");
  });
  it("inserts safe links, variables, literal text and monochrome styles", () => {
    const e = create();
    expect(() => e.insertLink("javascript:alert(1)")).toThrow();
    e.insertText("<img>");
    expect(e.getHTML()).toContain("&lt;img&gt;");
    e.insertVariable("nome");
    expect(e.getPlainText()).toContain("{{nome}}");
    expect(e.root.querySelector(".ez-variable")).not.toBeNull();
    expect(() => e.insertVariable("<script>")).toThrow();
  });
  it("toggles compatible styles and lists", () => {
    const e = create({ content: "Olá" });
    e.engine.commands.selectAll();
    e.run("italic");
    e.run("strike");
    expect(e.getWhatsAppText()).toBe("_~Olá~_");
    e.run("bulletList");
    expect(e.getWhatsAppText()).toBe("- _~Olá~_");
  });
});
