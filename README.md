# edit-zap-js

Editor visual de mensagens WhatsApp em TypeScript. Núcleo independente do DOM, editor Tiptap/ProseMirror, preview local, templates e componentes Vue 3 e React.

**Versão 0.1.0.** Pacote preparado localmente; nenhuma publicação foi realizada. O nome `edit-zap-js` retornou 404 no registry durante o desenvolvimento, mas disponibilidade não é reserva nem comprova direito de publicação.

## Executar este projeto

Requer Node.js 22.13+ (ou Node 24+) e npm. No diretório do projeto:

```sh
npm ci
npm run dev
npm test
npm run lint
npm run typecheck
npm run build
npm run build:playground
npm run check
npm pack --dry-run
npm pack
```

O playground abre no endereço exibido pelo Vite. Inclui edição, texto bruto, preview, templates, dados fictícios, tema, copiar e exemplos das três integrações. Não envia mensagens.

## Instalação em outra aplicação

Antes da primeira publicação, use o tarball gerado:

```sh
npm install /caminho/edit-zap-js-0.1.0.tgz
```

Após uma publicação feita pelo mantenedor: `npm install edit-zap-js`. Vue e React são peers opcionais: instale somente o framework utilizado. Importe o CSS uma vez.

## JavaScript puro

```ts
import { createEditZap } from "edit-zap-js";
import "edit-zap-js/style.css";

const editor = createEditZap({
  element: "#editor",
  content: "Olá, *{{nome}}*!",
  placeholder: "Digite sua mensagem...",
  toolbar: true,
  preview: true,
  variables: ["nome", "pedido"],
  previewData: { nome: "João" },
  onChange({ whatsAppText, plainText, json }) {
    console.log(whatsAppText, plainText, json);
  },
});
editor.getWhatsAppText(); // texto para enviar
editor.getJSON(); // estado estruturado independente do texto exportado
editor.getHTML(); // HTML gerado com escape e URLs validadas
editor.getPlainText(); // sem delimitadores de formatação
editor.setContent("Novo *texto*"); // strings são sintaxe WhatsApp, nunca HTML
editor.setHTML("<p><strong>Importação HTML</strong></p>"); // sanitizado
editor.insertText("Texto literal <sem HTML>");
editor.insertVariable("pedido");
editor.insertLink("https://example.com");
editor.setPreviewData({ nome: "Ana", pedido: "#12" });
editor.setTheme("dark");
editor.clear();
editor.focus();
// Ao desmontar a aplicação:
editor.destroy();
```

## Vue 3

```vue
<script setup lang="ts">
import { ref } from "vue";
import { EditZapEditor } from "edit-zap-js/vue";
import "edit-zap-js/style.css";
const message = ref("Olá, *mundo*!");
</script>
<template>
  <EditZapEditor
    v-model="message"
    placeholder="Digite sua mensagem..."
    :toolbar="true"
    :preview="true"
    :variables="['nome']"
    :preview-data="{ nome: 'Ana' }"
  />
</template>
```

Eventos Vue: `update:modelValue`, `change` (payload completo), `ready` (instância), `focus`, `blur`, `error`. Ref do componente expõe `getEditor()`. `modelValue`, `theme` e `previewData` são reativos; demais opções são de montagem.

## React

```tsx
import { useState } from "react";
import { EditZapEditor } from "edit-zap-js/react";
import "edit-zap-js/style.css";
export function Form() {
  const [message, setMessage] = useState("Olá!");
  return (
    <EditZapEditor
      value={message}
      onChange={setMessage}
      placeholder="Digite sua mensagem..."
      preview
    />
  );
}
```

`onChange(value, payload)` entrega texto WhatsApp no primeiro argumento. Outros callbacks têm a mesma assinatura da API JavaScript. `onReady` permite acessar a instância. `value`, `theme`, `previewData` e callbacks acompanham props novas; outras opções são de montagem. Para recriar a configuração, altere a `key`. Compatível com StrictMode e desmontagem.

## Núcleo sem navegador

```ts
import {
  parseWhatsApp,
  serializeWhatsApp,
  toHTML,
  getPlainText,
  renderVariables,
  findVariables,
  applyVariables,
  formatRange,
  TemplateStore,
} from "edit-zap-js/core";

const doc = parseWhatsApp("Olá *mundo*!");
serializeWhatsApp(doc); // Olá *mundo*!
formatRange(parseWhatsApp("Olá mundo"), 4, 9, "bold");
renderVariables("Olá, {{nome}}!", { nome: "João" }); // Olá, João!
findVariables("{{nome}} {{pedido}}"); // ['nome', 'pedido']
const resolved = applyVariables(doc, { nome: "Ana" }); // não altera doc
const store = new TemplateStore();
store.create("pedido", "Pedido pronto", "Olá {{nome}}, pedido *{{pedido}}*!");
store.get("pedido");
store.apply("pedido", { nome: "Ana", pedido: "42" }); // documento
const json = store.export();
store.import(json);
```

Persistência é responsabilidade da aplicação. `get`, `create` e `list` devolvem cópias. Importação valida o conjunto antes de alterar o store. JSON do documento é o formato de persistência sem perdas; o texto WhatsApp é um formato de entrega com normalização.

## Publicação manual

```sh
npm run check
npm pack --dry-run
npm pack
# Inspecione o tarball e confirme nome, versão, titularidade e login no npm.
npm login
npm publish --access public
```

Não existe workflow que publique automaticamente. `prepack` refaz o build. Distribuição ESM, declarações TypeScript, CSS separado e subpaths `/core`, `/vue`, `/react`, `/web`. Licença MIT. Veja [API](docs/API.md), [compatibilidade](docs/COMPATIBILITY.md) e [arquitetura](docs/ARCHITECTURE.md).
