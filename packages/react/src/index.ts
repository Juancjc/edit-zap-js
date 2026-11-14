import { createElement, useEffect, useRef } from "react";
import {
  createEditZap,
  type EditZapOptions,
  type EditZapEditor as Instance,
  type ChangePayload,
} from "../../editor/src/index.js";
export interface EditZapEditorProps extends Omit<
  EditZapOptions,
  "element" | "content" | "onChange"
> {
  value: string;
  onChange?: (value: string, payload: ChangePayload) => void;
  className?: string;
}
export function EditZapEditor(props: EditZapEditorProps) {
  const host = useRef<HTMLDivElement>(null),
    editor = useRef<Instance | undefined>(undefined),
    latest = useRef(props);
  latest.current = props;
  useEffect(() => {
    const e = createEditZap({
      ...latest.current,
      element: host.current!,
      content: latest.current.value,
      onChange: (p) => latest.current.onChange?.(p.whatsAppText, p),
      onFocus: () => latest.current.onFocus?.(),
      onBlur: () => latest.current.onBlur?.(),
      onError: (e) => latest.current.onError?.(e),
      onReady: (e) => latest.current.onReady?.(e),
    });
    editor.current = e;
    return () => {
      e.destroy();
      editor.current = undefined;
    };
  }, []);
  useEffect(() => {
    if (editor.current && props.value !== editor.current.getWhatsAppText())
      editor.current.setContent(props.value);
  }, [props.value]);
  useEffect(() => {
    editor.current?.setTheme(props.theme ?? "light");
  }, [props.theme]);
  useEffect(() => {
    editor.current?.setPreviewData(props.previewData ?? {});
  }, [props.previewData]);
  return createElement("div", { ref: host, className: props.className });
}
