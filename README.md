# edit-zap-js

**Escreva visualmente. Personalize com variáveis. Exporte mensagens para WhatsApp.**

[![npm](https://img.shields.io/npm/v/edit-zap-js)](https://www.npmjs.com/package/edit-zap-js)
[![CI](https://github.com/Juancjc/edit-zap-js/actions/workflows/ci.yml/badge.svg)](https://github.com/Juancjc/edit-zap-js/actions/workflows/ci.yml)
[![MIT](https://img.shields.io/badge/license-MIT-green)](https://github.com/Juancjc/edit-zap-js/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-tipos%20inclu%C3%ADdos-blue)](https://www.npmjs.com/package/edit-zap-js)

Biblioteca TypeScript para criar mensagens em um editor WYSIWYG e exportar a sintaxe de formatação do WhatsApp. Funciona com **JavaScript puro, Vue 3 e React**, com um núcleo que também pode ser usado no Node.js, sem navegador.

```text
Você escreve e formata:  Olá, João! Seu pedido está pronto.
Você exporta:           Olá, *João*! Seu pedido está pronto.
```

![Playground: prévia com variáveis e texto exportado lado a lado](https://raw.githubusercontent.com/Juancjc/edit-zap-js/main/docs/assets/playground.png)

[Instalação](#instalação) · [JavaScript](#javascript-puro) · [Vue 3](#vue-3) · [React](#react) · [Variáveis](#variáveis-dinâmicas) · [API](#api-do-editor) · [Desenvolvimento](#desenvolvimento)

## O que está incluído

- Editor Tiptap/ProseMirror com seleção de texto, barra de ferramentas e atalhos.
- Negrito, itálico, tachado, código inline, monoespaçado, citações e listas.
- Três modos: editor visual, texto bruto e prévia da mensagem.
- Emojis, links, desfazer/refazer e contador de caracteres.
- Variáveis `{{nome}}`, destaque visual e dados fictícios na prévia.
- Templates identificados por ID, com importação e exportação JSON.
- Temas claro/escuro, variáveis CSS e múltiplas instâncias independentes.
- Parser e serializer próprios, sanitização de HTML e validação de URLs.
- Distribuição ESM com tipos TypeScript e CSS separado.

A biblioteca prepara o conteúdo. O envio das mensagens fica sob controle da aplicação consumidora.

## Instalação

```sh
npm install edit-zap-js
```

Para usar os componentes, instale também o framework correspondente, caso ele ainda não faça parte do seu projeto:

```sh
# Vue
npm install vue

# React
npm install react react-dom
```

**Compatibilidade declarada:** Vue 3.3+, React 18/19 e Node.js 22.13+ para instalação e desenvolvimento. Os frameworks são peer dependencies opcionais; JavaScript puro e `/core` não exigem Vue ou React.

Importe `edit-zap-js/style.css` uma vez na aplicação. Os exemplos de interface abaixo pressupõem um bundler ESM, como Vite. O subpath `/core` não precisa de CSS ou DOM.

## JavaScript puro

Crie o elemento de montagem:

```html
<div id="editor"></div>
```

Depois de o elemento existir no DOM:

```ts
import { createEditZap } from "edit-zap-js";
import "edit-zap-js/style.css";

const editor = createEditZap({
  element: "#editor",
  content: "Olá, *{{nome}}*! Seu pedido está pronto. 📦",
  placeholder: "Digite sua mensagem...",
  toolbar: true,
  preview: true,
  variables: ["nome", "pedido"],
  previewData: { nome: "João", pedido: "#1042" },
  onChange({ whatsAppText, plainText, json }) {
    console.log({ whatsAppText, plainText, json });
  },
});

console.log(editor.getWhatsAppText());
// Olá, *{{nome}}*! Seu pedido está pronto. 📦
```

`previewData` muda apenas a prévia; o template continua com seus placeholders. Ao remover a interface, chame `editor.destroy()` para liberar os recursos.

## Vue 3

```vue
<script setup lang="ts">
import { ref } from "vue";
import { EditZapEditor } from "edit-zap-js/vue";
import "edit-zap-js/style.css";

const message = ref("Olá, *{{nome}}*! 👋");
</script>

<template>
  <EditZapEditor
    v-model="message"
    placeholder="Digite sua mensagem..."
    :toolbar="true"
    :preview="true"
    :variables="['nome', 'pedido']"
    :preview-data="{ nome: 'Ana', pedido: '#1042' }"
  />
  <pre>{{ message }}</pre>
</template>
```

O `v-model` contém o texto WhatsApp. Eventos disponíveis: `update:modelValue`, `change` (payload completo), `ready` (instância), `focus`, `blur` e `error`. Uma ref do componente expõe `getEditor()`.

`modelValue`, `theme` e `previewData` são reativos; as demais opções são definidas na montagem. Use uma nova `key` para recriar o componente com outra configuração inicial.

## React

```tsx
import { useState } from "react";
import { EditZapEditor } from "edit-zap-js/react";
import "edit-zap-js/style.css";

export function MessageForm() {
  const [message, setMessage] = useState("Olá, *{{nome}}*! 👋");

  return (
    <>
      <EditZapEditor
        value={message}
        onChange={setMessage}
        placeholder="Digite sua mensagem..."
        variables={["nome", "pedido"]}
        previewData={{ nome: "Ana", pedido: "#1042" }}
        preview
      />
      <pre>{message}</pre>
    </>
  );
}
```

`onChange(value, payload)` recebe o texto WhatsApp primeiro e o estado completo no segundo argumento. `onReady(instance)` dá acesso à API do editor.

`value`, `theme`, `previewData` e callbacks acompanham novas props. As demais opções são de montagem; use outra `key` para recriar a configuração. O editor é destruído na desmontagem.

## Formatação e exportação

| Formatação         | Texto WhatsApp             |
| ------------------ | -------------------------- |
| Negrito            | `*texto*`                  |
| Itálico            | `_texto_`                  |
| Tachado            | `~texto~`                  |
| Código inline      | Uma crase antes e depois   |
| Monoespaçado       | Três crases antes e depois |
| Citação            | `> texto`                  |
| Lista não ordenada | `- Item`                   |
| Lista numerada     | `1. Item`                  |

Estilos compatíveis podem ser combinados. Código e monoespaçado são exclusivos das demais marcas visuais. Links com rótulo são exportados como `rótulo (https://exemplo.com)`, pois o texto final não representa hyperlinks ocultos.

```ts
editor.getWhatsAppText(); // Sintaxe WhatsApp, sem HTML
editor.getPlainText(); // Texto sem marcas ou prefixos de lista
editor.getJSON(); // Documento estruturado para persistência
editor.getHTML(); // HTML escapado para integração ou exibição
```

Use **JSON para guardar o estado estruturado** e texto WhatsApp como formato de entrega. A conversão de volta para o editor pode normalizar a estrutura; veja as [limitações de compatibilidade](https://github.com/Juancjc/edit-zap-js/blob/main/docs/COMPATIBILITY.md).

## Variáveis dinâmicas

Para substituições simples:

```ts
import { findVariables, renderVariables } from "edit-zap-js/core";

const template = "Olá, {{nome}}! Seu pedido {{pedido}} está pronto.";

findVariables(template); // ["nome", "pedido"]
renderVariables(template, { nome: "João", pedido: "#1042" });
// Olá, João! Seu pedido #1042 está pronto.

// Por padrão, variáveis ausentes permanecem no texto.
// Use esta opção quando todas precisarem estar preenchidas:
renderVariables(template, { nome: "João" }, { missing: "throw" });
// Lança erro por falta de "pedido".
```

Para aplicar os dados a um documento e exportar a mensagem:

```ts
import { applyVariables, serializeWhatsApp } from "edit-zap-js/core";

const resolved = applyVariables(editor.getJSON(), {
  nome: "Ana",
  pedido: "#1042",
});
const textToSend = serializeWhatsApp(resolved);
// O documento original do editor permanece intacto.
```

As substituições não reinterpretam os valores como comandos de formatação. O serializer protege delimitadores literais usando separadores U+200B; essa convenção e suas diferenças entre clientes estão descritas na [documentação de compatibilidade](https://github.com/Juancjc/edit-zap-js/blob/main/docs/COMPATIBILITY.md).

## Templates reutilizáveis

```ts
import { TemplateStore, serializeWhatsApp } from "edit-zap-js/core";

const templates = new TemplateStore();
templates.create(
  "pedido-pronto",
  "Pedido pronto",
  "Olá, *{{nome}}*! Seu pedido *{{pedido}}* está pronto. 📦",
);

const document = templates.apply("pedido-pronto", {
  nome: "Ana",
  pedido: "#1042",
});
serializeWhatsApp(document);
// Olá, *Ana*! Seu pedido *#1042* está pronto. 📦

const exported = templates.export();
const restored = new TemplateStore();
restored.import(exported);
restored.get("pedido-pronto");
restored.list();
```

O armazenamento fica a cargo da aplicação: arquivo, banco de dados ou armazenamento local. IDs repetidos substituem o template; `create`, `get` e `list` devolvem cópias. A importação valida o conjunto antes de alterar o store.

## Núcleo sem navegador

```ts
import {
  parseWhatsApp,
  serializeWhatsApp,
  getPlainText,
  toHTML,
  formatRange,
} from "edit-zap-js/core";

const doc = parseWhatsApp("Olá, *mundo*!");
getPlainText(doc); // Olá, mundo!
toHTML(doc); // <p>Olá, <strong>mundo</strong>!</p>
serializeWhatsApp(doc); // Olá, *mundo*!

const formatted = formatRange(parseWhatsApp("Olá mundo"), 4, 9, "bold");
serializeWhatsApp(formatted); // Olá *mundo*
```

`formatRange` usa offsets UTF-16 do texto simples e retorna um novo documento. O core também exporta `validateDocument`, `safeUrl`, `escapeHTML`, `literalText` e os tipos do modelo.

Em SSR, utilize `/core` para transformações no servidor. Os componentes Vue/React criam o editor após montagem; `createEditZap` exige DOM no momento da chamada. No Next.js App Router, coloque o componente consumidor em um módulo com `"use client"`.

## API do editor

| Método                           | Finalidade                                      |
| -------------------------------- | ----------------------------------------------- |
| `getWhatsAppText()`              | Exportar a sintaxe WhatsApp                     |
| `getJSON()`                      | Obter o documento estruturado                   |
| `getHTML()`                      | Gerar HTML com escape de texto e URLs validadas |
| `getPlainText()`                 | Obter texto simples                             |
| `setContent(string \| document)` | Carregar texto WhatsApp ou documento JSON       |
| `setHTML(html)`                  | Importar HTML com sanitização                   |
| `insertText(text)`               | Inserir texto literal na seleção                |
| `insertVariable(name)`           | Inserir um placeholder                          |
| `insertLink(url)`                | Aplicar um link à seleção ou inserir a URL      |
| `run(action)`                    | Executar uma ação da toolbar                    |
| `setTheme("light" \| "dark")`    | Alterar o tema da instância                     |
| `setPreviewData(values)`         | Atualizar dados fictícios da prévia             |
| `clear()` / `focus()`            | Limpar ou focar a área visual                   |
| `destroy()`                      | Destruir a instância e liberar recursos         |

`setContent` interpreta strings como texto WhatsApp. Para HTML, use explicitamente `setHTML`.

Callbacks JavaScript: `onChange({ whatsAppText, plainText, json })`, `onReady(instance)`, `onFocus()`, `onBlur()` e `onError(error)`. Erros de inicialização são lançados para o chamador. A propriedade `engine` expõe o editor Tiptap; `root` expõe o elemento da instância.

Consulte as assinaturas, opções e comportamentos na [referência completa da API](https://github.com/Juancjc/edit-zap-js/blob/main/docs/API.md).

## Personalização

```ts
const editor = createEditZap({
  element: "#editor",
  theme: "dark",
  minHeight: "160px",
  maxHeight: "400px",
  toolbar: ["bold", "italic", "bulletList", "variable", "undo", "redo"],
  preview: true,
});

editor.root.style.setProperty("--ez-accent", "#8254cc");
```

Ações disponíveis: `bold`, `italic`, `strike`, `code`, `monospace`, `blockquote`, `bulletList`, `orderedList`, `undo`, `redo`, `emoji`, `variable` e `link`. `toolbar: false` oculta os botões; `preview: false` remove a aba de prévia.

Variáveis CSS: `--ez-bg`, `--ez-ink`, `--ez-muted`, `--ez-border`, `--ez-accent`, `--ez-soft`, `--ez-min-height` e `--ez-max-height`. Os estilos usam o prefixo `.ez`; não há Shadow DOM, portanto regras globais da aplicação ainda podem interferir.

## Segurança e compatibilidade

- HTML importado e colado é sanitizado com DOMPurify e limitado pelo schema do editor.
- A saída HTML escapa texto e atributos; links aceitam apenas `http`, `https` e `mailto`.
- Não há uso de `eval`, envio automático de mensagens ou armazenamento remoto obrigatório.
- A prévia é aproximada e não depende de APIs externas. O playground pode carregar fontes do Google Fonts, com fallback local.
- Quebras de linha, listas aninhadas e marcas podem ser normalizadas ao converter entre texto e JSON.
- O contador usa code points Unicode; não representa bytes ou limites de uma API de envio.

Valide mensagens representativas nos clientes e provedores utilizados pela sua aplicação. Leia as [limitações conhecidas](https://github.com/Juancjc/edit-zap-js/blob/main/docs/COMPATIBILITY.md) antes da integração de envio. O projeto é independente, sem afiliação com WhatsApp ou Meta.

## Desenvolvimento

```sh
git clone https://github.com/Juancjc/edit-zap-js.git
cd edit-zap-js
npm ci
npm run dev
```

Abra o endereço exibido pelo Vite. O playground oferece editor completo, texto exportado, prévia, copiar, templates, dados fictícios, alteração de tema e exemplos de integração.

| Comando                    | Resultado                                       |
| -------------------------- | ----------------------------------------------- |
| `npm run dev`              | Iniciar o playground de desenvolvimento         |
| `npm test`                 | Executar os testes em Node e jsdom              |
| `npm run lint`             | Verificar o código com ESLint                   |
| `npm run typecheck`        | Validar tipos TypeScript                        |
| `npm run build`            | Gerar biblioteca ESM, tipos e CSS em `dist/`    |
| `npm run build:playground` | Gerar playground estático em `playground-dist/` |
| `npm run check`            | Executar lint, tipos, testes e build            |
| `npm run format`           | Formatar os arquivos com Prettier               |
| `npm pack --dry-run`       | Inspecionar o conteúdo do pacote npm            |
| `npm pack`                 | Gerar um tarball instalável                     |

Os testes cobrem conversão, estilos combinados, variáveis, templates, HTML, seleções, undo/redo, múltiplas instâncias, sincronização dos componentes e SSR. A CI configura verificações em Node 22 e 24.

## Estrutura e distribuição

```text
packages/
  core/       Parser, serializer, variáveis, templates e validação sem DOM
  editor/     Editor Tiptap, toolbar, estilos e preview
  vue/        Componente Vue 3 com v-model
  react/      Componente React controlado
  web/        Documentação da entrada JavaScript puro
playground/   Interface de demonstração
tests/       Testes automatizados
docs/        API, arquitetura, compatibilidade e imagens
```

O repositório é modular e publica **um único pacote** com subpaths:

| Import                             | Conteúdo                                   |
| ---------------------------------- | ------------------------------------------ |
| `edit-zap-js` ou `edit-zap-js/web` | Editor JavaScript e exports do core        |
| `edit-zap-js/core`                 | Núcleo independente do DOM e de frameworks |
| `edit-zap-js/vue`                  | Componente Vue 3                           |
| `edit-zap-js/react`                | Componente React                           |
| `edit-zap-js/style.css`            | Estilos do editor                          |

Os diretórios em `packages/` não são pacotes npm publicados separadamente. Saiba mais na [arquitetura](https://github.com/Juancjc/edit-zap-js/blob/main/docs/ARCHITECTURE.md).

## Publicação no npm

Para mantenedores autenticados com permissão de publicação:

```sh
npm run check
npm pack --dry-run
npm login
npm publish --access public
```

O npm pode solicitar confirmação de 2FA. O hook `prepack` gera o build antes do empacotamento. Para uma nova versão, atualize a versão e o [changelog](https://github.com/Juancjc/edit-zap-js/blob/main/CHANGELOG.md); versões já publicadas não podem ser sobrescritas. Não existe publicação automática configurada na CI.

Para testar um pacote local antes da publicação:

```sh
npm pack
# Na aplicação consumidora, substitua <versao> pela versão gerada:
npm install /caminho/edit-zap-js-<versao>.tgz
```

## Contribuições e licença

Sugestões e relatos de problemas são bem-vindos nas [issues](https://github.com/Juancjc/edit-zap-js/issues). Inclua versão, framework, mensagem de exemplo e passos para reproduzir. Antes de abrir um pull request, execute `npm run check`.

Distribuído sob a [licença MIT](https://github.com/Juancjc/edit-zap-js/blob/main/LICENSE).
