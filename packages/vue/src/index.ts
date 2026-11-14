import {
  defineComponent,
  h,
  onMounted,
  onBeforeUnmount,
  watch,
  ref,
  type PropType,
} from "vue";
import {
  createEditZap,
  type EditZapOptions,
  type EditZapEditor as Instance,
} from "../../editor/src/index.js";
export const EditZapEditor = defineComponent({
  name: "EditZapEditor",
  props: {
    modelValue: { type: String, default: "" },
    placeholder: String,
    toolbar: {
      type: [Boolean, Array] as PropType<EditZapOptions["toolbar"]>,
      default: true,
    },
    preview: { type: Boolean, default: true },
    theme: { type: String as PropType<"light" | "dark">, default: "light" },
    variables: Array as PropType<string[]>,
    previewData: Object as PropType<Record<string, unknown>>,
  },
  emits: ["update:modelValue", "change", "ready", "focus", "blur", "error"],
  setup(props, { emit, expose }) {
    const host = ref<HTMLElement>();
    let instance: Instance | undefined;
    onMounted(() => {
      instance = createEditZap({
        element: host.value!,
        content: props.modelValue,
        placeholder: props.placeholder,
        toolbar: props.toolbar,
        preview: props.preview,
        theme: props.theme,
        variables: props.variables,
        previewData: props.previewData,
        onChange: (p) => {
          emit("update:modelValue", p.whatsAppText);
          emit("change", p);
        },
        onReady: (e) => emit("ready", e),
        onFocus: () => emit("focus"),
        onBlur: () => emit("blur"),
        onError: (e) => emit("error", e),
      });
    });
    watch(
      () => props.modelValue,
      (value) => {
        if (instance && value !== instance.getWhatsAppText())
          instance.setContent(value);
      },
    );
    watch(
      () => props.theme,
      (theme) => instance?.setTheme(theme),
    );
    watch(
      () => props.previewData,
      (data) => instance?.setPreviewData(data ?? {}),
      { deep: true },
    );
    onBeforeUnmount(() => instance?.destroy());
    expose({ getEditor: () => instance });
    return () => h("div", { ref: host });
  },
});
