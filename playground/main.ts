import { createEditZap, TemplateStore } from "../packages/editor/src/index";
import "./style.css";
const templates = new TemplateStore();
templates.create(
  "pedido",
  "Pedido pronto",
  "Olá, *{{nome}}*! 👋\n\nSeu pedido *{{pedido}}* está pronto para retirada.\n\n- Confira os itens\n- Apresente seu documento\n\n_Obrigado por escolher a gente!_ 💚",
);
templates.create(
  "lembrete",
  "Lembrete",
  "Olá, {{nome}}! 📅\n\nPassando para lembrar do seu compromisso amanhã.\n> Responda esta mensagem para confirmar.",
);
document.querySelector("#app")!.innerHTML =
  `<aside><a class="brand" href="#">e<span>z</span><b>edit zap</b></a><div class="workspace">WORKSPACE</div><a class="nav active" href="#studio">✎ &nbsp; Message studio <span>01</span></a><a class="nav" href="#integrations">⌘ &nbsp; Integrações</a><div class="aside-bottom"><span class="status"></span> Tudo acontece no seu navegador<br><small>edit-zap-js / v0.1.0</small></div></aside><main id="studio"><header><span>Workspace / <b>Message studio</b></span><button id="theme">◐ &nbsp; Alterar tema</button></header><div class="intro"><div class="eyebrow">FEITO PARA CONVERSAS MELHORES</div><h1>Uma boa mensagem.<br><span>Do seu jeito.</span></h1><p>Escreva, personalize e veja sua mensagem ganhar forma.<br>Pronta para copiar e levar para a sua aplicação.</p></div><div class="studio"><section><div class="section-title"><h2>Componha sua mensagem</h2><span class="badge">● &nbsp; Edição ao vivo</span></div><div class="template-row"><label for="template">Comece com um modelo</label><select id="template"><option value="pedido">📦 &nbsp; Pedido pronto</option><option value="lembrete">📅 &nbsp; Lembrete</option><option value="blank">＋ &nbsp; Mensagem em branco</option></select></div><div id="editor"></div><div class="hint">Dica: selecione um trecho para formatar. Use {{ }} para inserir variáveis.</div><div class="data-panel"><div><h3>Uma mensagem mais pessoal</h3><p>Dados de exemplo usados apenas na prévia.</p></div><label>Nome<input id="name" value="João"></label><label>Pedido<input id="order" value="#1042"></label></div></section><section class="export"><div class="section-title"><h2>Pronto para enviar</h2><span class="tag">WHATSAPP</span></div><p>Texto formatado, sem HTML. Sua aplicação cuida do envio.</p><pre id="output"></pre><div class="export-footer"><span id="bytes"></span><button id="copy">Copiar mensagem &nbsp; ↗</button></div><div class="note"><span>↗</span><div><b>Do editor para qualquer aplicação</b><p>Use o texto exportado no seu fluxo de mensagens ou integre diretamente com a API.</p></div></div><details><summary>Ver estado estruturado</summary><pre id="json"></pre></details></section></div><section id="integrations" class="integrations"><div><div class="eyebrow">PEQUENO NO CÓDIGO. GRANDE NAS POSSIBILIDADES.</div><h2>Encaixa no seu projeto.</h2><p>JavaScript puro, Vue 3 ou React. O mesmo núcleo, a sua stack.</p></div><div class="code-card"><div><button data-framework="js" class="selected">JavaScript</button><button data-framework="vue">Vue 3</button><button data-framework="react">React</button></div><pre id="code"></pre></div></section><footer>edit zap <span>Open source · MIT · Feito para conectar</span></footer></main>`;
const output = document.querySelector("#output")!,
  json = document.querySelector("#json")!;
const refresh = () => {
  output.textContent = editor.getWhatsAppText();
  json.textContent = JSON.stringify(editor.getJSON(), null, 2);
  document.querySelector("#bytes")!.textContent =
    `${Array.from(editor.getPlainText()).length} caracteres`;
};
const editor = createEditZap({
  element: "#editor",
  content: templates.get("pedido")!.document,
  variables: ["nome", "pedido"],
  previewData: { nome: "João", pedido: "#1042" },
  onChange: refresh,
});
refresh();
document.querySelector<HTMLSelectElement>("#template")!.onchange = (e) => {
  const id = (e.target as HTMLSelectElement).value;
  editor.setContent(id === "blank" ? "" : templates.get(id)!.document);
};
let dark = false;
document.querySelector<HTMLButtonElement>("#theme")!.onclick = () => {
  dark = !dark;
  document.body.classList.toggle("dark", dark);
  editor.setTheme(dark ? "dark" : "light");
};
for (const id of ["name", "order"])
  document.querySelector<HTMLInputElement>("#" + id)!.oninput = () =>
    editor.setPreviewData({
      nome: document.querySelector<HTMLInputElement>("#name")!.value,
      pedido: document.querySelector<HTMLInputElement>("#order")!.value,
    });
document.querySelector<HTMLButtonElement>("#copy")!.onclick = async () => {
  const button = document.querySelector("#copy")!;
  try {
    await navigator.clipboard.writeText(editor.getWhatsAppText());
    button.textContent = "Copiado ✓";
  } catch {
    button.textContent = "Selecione o texto para copiar";
  }
  setTimeout(() => (button.textContent = "Copiar mensagem ↗"), 2000);
};
const examples: Record<string, string> = {
  js: `import { createEditZap } from 'edit-zap-js'\nimport 'edit-zap-js/style.css'\n\nconst editor = createEditZap({\n  element: '#editor', preview: true\n})\neditor.getWhatsAppText()`,
  vue: `import { EditZapEditor } from 'edit-zap-js/vue'\nimport 'edit-zap-js/style.css'\n\n<EditZapEditor v-model="message"\n  :preview="true" />`,
  react: `import { EditZapEditor } from 'edit-zap-js/react'\nimport 'edit-zap-js/style.css'\n\n<EditZapEditor value={message}\n  onChange={setMessage} />`,
};
document.querySelector("#code")!.textContent = examples.js;
document.querySelectorAll<HTMLButtonElement>("[data-framework]").forEach(
  (b) =>
    (b.onclick = () => {
      document.querySelector("#code")!.textContent =
        examples[b.dataset.framework!];
      document
        .querySelectorAll("[data-framework]")
        .forEach((el) => el.classList.toggle("selected", el === b));
    }),
);
