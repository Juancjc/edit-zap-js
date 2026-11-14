import { renderToString as renderVue } from "vue/server-renderer";
import { it, expect, afterEach } from "vitest";
import { createApp, createSSRApp, h, ref, nextTick } from "vue";
import { EditZapEditor as VueEditor } from "../packages/vue/src/index";
import { createElement, act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { EditZapEditor as ReactEditor } from "../packages/react/src/index";
import type { EditZapEditor } from "../packages/editor/src/index";
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
let cleanup = () => {};
afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
});
it("Vue mounts, updates v-model and cleans up", async () => {
  const value = ref("Olá");
  let editor: EditZapEditor | undefined;
  const host = document.createElement("div");
  document.body.append(host);
  const app = createApp({
    setup: () => () =>
      h(VueEditor, {
        modelValue: value.value,
        "onUpdate:modelValue": (v: string) => (value.value = v),
        onReady: (e: EditZapEditor) => (editor = e),
      }),
  });
  app.mount(host);
  cleanup = () => app.unmount();
  await nextTick();
  await Promise.resolve();
  editor!.setContent("*Ana*");
  await nextTick();
  expect(value.value).toBe("*Ana*");
  value.value = "Externo";
  await nextTick();
  expect(editor!.getPlainText()).toBe("Externo");
  app.unmount();
  cleanup = () => {};
  expect(host.querySelector(".ez")).toBeNull();
});
it("React mounts, controls external value and emits changes", async () => {
  let root: Root | undefined;
  let editor: EditZapEditor | undefined;
  let value = "";
  const host = document.createElement("div");
  document.body.append(host);
  await act(async () => {
    root = createRoot(host);
    root.render(
      createElement(ReactEditor, {
        value: "Olá",
        onReady: (e) => (editor = e),
        onChange: (v) => (value = v),
      }),
    );
  });
  cleanup = () => {
    act(() => root!.unmount());
  };
  await act(async () => {
    editor!.setContent("*Ana*");
  });
  expect(value).toBe("*Ana*");
  await act(async () => {
    root!.render(createElement(ReactEditor, { value: "Externo" }));
  });
  expect(editor!.getPlainText()).toBe("Externo");
  await act(async () => root!.unmount());
  cleanup = () => {};
  expect(host.querySelector(".ez")).toBeNull();
});
it("React renders server-side without creating an editor", () => {
  expect(renderToString(createElement(ReactEditor, { value: "SSR" }))).toBe(
    "<div></div>",
  );
});

it("Vue renders server-side without a DOM editor", async () => {
  const html = await renderVue(
    createSSRApp({ render: () => h(VueEditor, { modelValue: "SSR" }) }),
  );
  expect(html).toBe("<div></div>");
});
