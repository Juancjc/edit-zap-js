# Referência da API

## createEditZap(options)

Retorna `EditZapEditor`. Requer navegador e elemento existente. Erros de inicialização são lançados para o chamador; `onError` trata erros nas ações da interface. Nenhum callback é obrigatório.

| Opção                 | Tipo / padrão                       | Comportamento                             |
| --------------------- | ----------------------------------- | ----------------------------------------- |
| element               | HTMLElement ou seletor; obrigatório | Cada instância anexa sua própria raiz     |
| content               | string WhatsApp ou MessageDocument  | Padrão vazio; strings HTML são texto      |
| placeholder           | string                              | Digite sua mensagem...                    |
| toolbar               | boolean ou ToolbarAction[]; true    | Lista controla botões e ordem             |
| preview               | boolean; true                       | Disponibiliza aba de prévia               |
| theme                 | light ou dark; light                | Tema local                                |
| minHeight / maxHeight | string CSS                          | 180px / 420px                             |
| variables             | string[]                            | nome, pedido                              |
| previewData           | Record<string, unknown>             | Dados somente para visualização           |
| onChange              | (ChangePayload) => void             | whatsAppText, plainText, json             |
| onFocus / onBlur      | () => void                          | Foco da área visual                       |
| onReady               | (instance) => void                  | Microtask após inicialização              |
| onError               | (Error) => void                     | Falha de ação de toolbar ou entrada bruta |

Ações: `bold`, `italic`, `strike`, `code`, `monospace`, `blockquote`, `bulletList`, `orderedList`, `undo`, `redo`, `emoji`, `variable`, `link`. `run(action)` executa a ação sobre a seleção. Picker de emojis local e variável com nomes fornecidos; link pede URL em diálogo do navegador. Atalhos nativos Tiptap: Ctrl/Cmd+B, I, Shift+S, E, Z, Shift+Z; Shift+Enter para quebra simples. A toolbar mantém a seleção ao clicar. Código e monoespaçado são exclusivos dos outros estilos.

Métodos públicos: `getWhatsAppText`, `getJSON`, `getHTML`, `getPlainText`, `setContent`, `setHTML`, `clear`, `focus`, `insertText`, `insertVariable`, `insertLink`, `setTheme`, `setPreviewData`, `run`, `destroy`. `engine` expõe o editor Tiptap para seleções, comandos ou extensões criadas pela aplicação; `root` expõe o elemento da instância. `destroy` é idempotente. `insertLink` valida protocolo e usa seleção ou insere URL visível; remover links pode ser feito por `engine.chain().focus().unsetLink().run()`.

## Núcleo

- `MessageDocument`: `{type:'doc', content:MessageNode[]}`. Blocos: paragraph, blockquote, bulletList, orderedList, listItem, codeBlock. Inline: text e hardBreak. Marks: bold, italic, strike, code, monospace, link. `orderedList.attrs.start` define início.
- `parseWhatsApp(text)` interpreta delimitadores balanceados e listas/citações no início de linha; normaliza CRLF. URLs http(s)/mailto são reconhecidas antes dos delimitadores.
- `serializeWhatsApp(document)` exporta estilos, listas e quebras. Links com rótulo viram `rótulo (URL)`.
- `getPlainText(document)` omite formatação e prefixos de lista. Quebras entre blocos são preservadas.
- `toHTML(document)` escapa texto e atributos; gera somente elementos conhecidos e links com protocolos permitidos.
- `safeUrl(url)` aceita somente http, https e mailto sem espaços ou caracteres de tag/atributo.
- `validateDocument(unknown)` valida o modelo e impõe limite de profundidade (32) e quantidade de nós (50 mil).
- `formatRange(doc, from, to, mark, enabled=true)` retorna novo documento; offsets UTF-16 correspondem ao texto simples, com separadores entre blocos. Formata parte do texto sem DOM. Código exclui marcas visuais incompatíveis.
- `findVariables(template)` retorna nomes distintos (`[\w.-]+`).
- `renderVariables(template, values, {missing:'preserve'|'throw',literal:true})` substitui em uma passagem, usa apenas propriedades próprias e preserva ausentes por padrão. `literal:false` é opt-in para valores sem proteção de delimitadores.
- `applyVariables(document, values)` retorna cópia e substitui texto sem reinterpretar como sintaxe. Para preview seguro, prefira `toHTML(applyVariables(...))`.
- `literalText(text)` adiciona separadores U+200B após delimitadores para evitar interpretação no parser local.
- `TemplateStore.create(id,name,content)`, `get(id)`, `list()`, `export()`, `import(json)`, `apply(id,values)`. IDs repetidos substituem modelos, sem banco ou rede.

## Personalização

Seletores de CSS são prefixados com `.ez`; não é Shadow DOM. CSS global da aplicação ainda pode interferir. Variáveis: `--ez-bg`, `--ez-ink`, `--ez-muted`, `--ez-border`, `--ez-accent`, `--ez-soft`, `--ez-min-height`, `--ez-max-height`. Configure em `.ez` ou por instância com `editor.root.style.setProperty('--ez-accent', '#8254cc')`. Tema escuro usa `data-theme=dark`.

As três abas permitem editar visualmente, editar texto WhatsApp e ver prévia. Os dados de preview não substituem o template do editor. Contador usa code points Unicode (um emoji composto pode contar várias unidades); não é contador de bytes nem limite de API.

## Integração de envio

```ts
const text = editor.getWhatsAppText();
// Sua aplicação decide quando enviar e chama o próprio backend.
await fetch("/api/messages", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ text }),
});
```

O endpoint acima é da aplicação consumidora e não faz parte da biblioteca. Guarde credenciais e decisões de destino no backend. Não há integração remota automática.
