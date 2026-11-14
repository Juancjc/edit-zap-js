// @vitest-environment node
import { describe, it, expect } from "vitest";
import {
  parseWhatsApp as parse,
  serializeWhatsApp as serialize,
  getPlainText,
  toHTML,
  renderVariables,
  findVariables,
  TemplateStore,
  applyVariables,
  safeUrl,
  validateDocument,
  formatRange,
  type MessageDocument,
} from "../packages/core/src/index";
describe("headless WhatsApp conversion", () => {
  it.each([
    ["*Olá*", "bold"],
    ["_Olá_", "italic"],
    ["~Olá~", "strike"],
    ["`Olá`", "code"],
    ["```Olá```", "monospace"],
  ])("parses %s", (input, mark) => {
    const doc = parse(input);
    expect(doc.content[0].content![0].marks).toEqual([{ type: mark }]);
    expect(serialize(doc)).toBe(input);
  });
  it("combines compatible styles canonically", () => {
    const doc = parse("*_Olá_*");
    expect(doc.content[0].content![0].marks).toEqual([
      { type: "bold" },
      { type: "italic" },
    ]);
    expect(serialize(doc)).toBe("*_Olá_*");
  });
  it.each([
    "- Um\n- Dois",
    "3. Um\n4. Dois",
    "> Olá\n> mundo",
    "Olá\n\nMundo 😀",
    "não *fechado",
    "a_b_c",
    'Olá <script> & "teste"',
  ])("preserves round-trip %s", (value) =>
    expect(serialize(parse(serialize(parse(value))))).toBe(
      serialize(parse(value)),
    ),
  );
  it("preserves structured canonical lists and inline styles", () => {
    for (const text of [
      "*um* e _dois_",
      "- *um*\n- dois",
      "2. um\n3. ~dois~",
      "> _oi_",
    ])
      expect(parse(serialize(parse(text)))).toEqual(parse(text));
  });
  it("preserves URLs with delimiters", () => {
    const url = "https://example.com/a_b?q=x~y";
    expect(serialize(parse(url))).toBe(url);
    expect(toHTML(parse(url))).toContain('href="' + url + '"');
  });
  it("handles malformed and empty input", () => {
    expect(getPlainText(parse(""))).toBe("");
    expect(serialize(parse("* * ~ _ ```"))).toContain("*");
    expect(() => parse(null as never)).toThrow();
  });
  it("renders HTML safely", () => {
    const html = toHTML(parse("<img src=x onerror=alert(1)>"));
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img");
    expect(safeUrl("javascript:alert(1)")).toBe(false);
    expect(safeUrl("https://example.com")).toBe(true);
  });
  it("serializes links as visible URLs", () => {
    expect(
      serialize({
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "site",
            marks: [{ type: "link", attrs: { href: "https://example.com" } }],
          },
        ],
      }),
    ).toBe("site (https://example.com)");
  });
  it("coalesces adjacent marks and keeps edge whitespace outside delimiters", () => {
    const d: MessageDocument = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: " olá", marks: [{ type: "bold" }] },
            { type: "text", text: " mundo ", marks: [{ type: "bold" }] },
          ],
        },
      ],
    };
    expect(serialize(d)).toBe(" *olá mundo* ");
  });
  it("handles hard breaks and multiline code blocks", () => {
    const d: MessageDocument = {
      type: "doc",
      content: [
        {
          type: "codeBlock",
          content: [{ type: "text", text: "const a = 1;\nconst b = 2;" }],
        },
      ],
    };
    expect(parse(serialize(d))).toEqual(d);
    expect(
      serialize({
        type: "paragraph",
        content: [
          { type: "text", text: "a" },
          { type: "hardBreak" },
          { type: "text", text: "b" },
        ],
      }),
    ).toBe("a\nb");
  });
  it("keeps literal delimiters literal inside our parser", () => {
    const d: MessageDocument = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "*literal* _sim_" }],
        },
      ],
    };
    expect(getPlainText(parse(serialize(d)))).toBe("*literal* _sim_");
    expect(parse(serialize(d)).content[0].content![0].marks).toBeUndefined();
  });
});
describe("variables and templates", () => {
  it("replaces once and preserves unknown variables", () => {
    expect(renderVariables("Olá, {{nome}}!", { nome: "João" })).toBe(
      "Olá, João!",
    );
    expect(renderVariables("{{a}} {{b}}", { a: "{{b}}", b: "X" })).toBe(
      "{{b}} X",
    );
    expect(findVariables("{{a}} {{a}} {{b}}")).toEqual(["a", "b"]);
    expect(() => renderVariables("{{x}}", {}, { missing: "throw" })).toThrow(
      "Missing",
    );
  });
  it("does not promote supplied values into formatting", () => {
    const text = renderVariables("Olá {{nome}}", { nome: "*Admin*\n- Item" });
    const doc = parse(text);
    expect(toHTML(doc)).not.toContain("<strong>");
    expect(toHTML(doc)).not.toContain("<ul>");
  });
  it("does not mutate the original template", () => {
    const doc = parse("Oi {{nome}}");
    const next = applyVariables(doc, { nome: "<script>*hi*" });
    expect(getPlainText(doc)).toBe("Oi {{nome}}");
    expect(toHTML(next)).toContain("&lt;script&gt;");
    expect(toHTML(next)).not.toContain("<strong>");
  });
  it("round-trips JSON and isolates consumers", () => {
    const store = new TemplateStore();
    const t = store.create("a", "Olá", "*Oi* {{nome}}");
    t.document.content = [];
    expect(store.get("a")!.document.content).not.toHaveLength(0);
    const copy = new TemplateStore();
    copy.import(store.export());
    expect(copy.list()).toEqual(store.list());
    expect(getPlainText(copy.apply("a", { nome: "Ana" }))).toBe("Oi Ana");
  });
  it("validates imports atomically and rejects invalid documents", () => {
    const s = new TemplateStore();
    expect(() =>
      s.import(
        '[{"id":"x","name":"X","version":1,"document":{"type":"script"}}]',
      ),
    ).toThrow();
    expect(s.list()).toHaveLength(0);
    expect(() =>
      validateDocument({ type: "doc", content: [{ type: "text", text: 3 }] }),
    ).toThrow();
  });
});

it("formats and removes a partial selection without changing the source", () => {
  const doc = parse("Ol� mundo");
  const bold = formatRange(doc, 4, 9, "bold");
  expect(serialize(bold)).toBe("Ol� *mundo*");
  expect(getPlainText(doc)).toBe("Ol� mundo");
  expect(serialize(formatRange(bold, 4, 9, "bold", false))).toBe("Ol� mundo");
  expect(() => formatRange(doc, -1, 4, "bold")).toThrow();
});
it("keeps literal list prefixes literal", () => {
  const doc: MessageDocument = {
    type: "doc",
    content: [
      { type: "paragraph", content: [{ type: "text", text: "- literal" }] },
    ],
  };
  expect(parse(serialize(doc))).toEqual(doc);
});

it("preserves URLs inside literal unmarked text", () => {
  const d: MessageDocument = {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [
          { type: "text", text: "Veja https://example.com/a_b e *literal*" },
        ],
      },
    ],
  };
  expect(serialize(d)).toContain("https://example.com/a_b");
});

it("rejects unsafe URLs and malformed JSON hierarchy", () => {
  expect(() =>
    validateDocument({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "x",
              marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }],
            },
          ],
        },
      ],
    }),
  ).toThrow("Unsafe link");
  expect(() =>
    validateDocument({ type: "doc", content: [{ type: "text", text: "x" }] }),
  ).toThrow("Invalid child");
});
it("preserves variable line breaks in exported HTML", () => {
  expect(
    toHTML(applyVariables(parse("{{nome}}"), { nome: "Ana\nMaria" })),
  ).toContain("Ana<br>Maria");
});
