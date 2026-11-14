# Compatibilidade e limites

Sintaxes documentadas pelo WhatsApp: `*negrito*`, `_itálico_`, `~tachado~`, três crases para monoespaçado, uma crase para código inline, `> ` para citação, `- ` para lista e `1. ` para lista numerada. Referência: https://faq.whatsapp.com/539178204879377/

A implementação é um parser próprio para um subconjunto conservador; não é o parser oficial do WhatsApp. A prévia é aproximada. Aplicativos móveis, Web, versões e provedores de APIs podem apresentar diferenças. Verifique mensagens representativas no cliente e API que sua aplicação utiliza. A biblioteca não valida limites, modelos aprovados ou regras de uma API de envio.

O formato WhatsApp não representa todo estado de um editor rich text. JSON é o formato de armazenamento sem perdas. O texto normaliza listas, marcas adjacentes e espaços junto a delimitadores. Quebras simples e parágrafos exportam `\n` e não podem ser diferenciados ao reimportar. Citações consecutivas podem ser normalizadas em blocos separados; listas aninhadas e múltiplos parágrafos por item são achatados na exportação. Código com crases literais e estilos em limites de palavras têm diferenças entre clientes.

Não existe escape universal documentado pelo WhatsApp para delimitadores literais. Esta biblioteca usa U+200B após caracteres de formatação literais e antes de prefixos estruturais literais. Isso altera a sequência de code points e pode afetar buscas/cópia. O parser local reconhece essa convenção; o comportamento em clientes externos deve ser validado. URLs inteiras não recebem separadores. Valores de variáveis não são reprocessados como markup; use estado estruturado para preview e exportação posteriores. Não há promessa de round-trip JSON exato por texto para todos os documentos possíveis.

Links não têm rótulo oculto no formato final: `Visite` com href exporta `Visite (https://...)`. Somente http, https e mailto são aceitos. Esquemas customizados são recusados. HTML é gerado com escape ou importado com DOMPurify; atributos de evento, estilos, scripts e imagens não fazem parte do modelo. Colar texto/HTML usa os mecanismos ProseMirror e sanitização antes do schema; conteúdo externo não é executado.

SSR: `/core` não importa DOM. Componentes React/Vue só criam o editor após montagem. JavaScript puro exige DOM no momento de `createEditZap`. Inclua o CSS no bundler da aplicação; chamadas a APIs de browser devem ficar no cliente.

Acessibilidade: botões com labels, estado de toggle, foco por teclado e textarea identificada. Não foi realizada auditoria completa com leitores de tela ou teste em dispositivos físicos. A toolbar usa controles nativos com Tab, sem navegação por setas customizada. Layout responsivo; validação automatizada em jsdom não substitui testes em Safari/iOS/Android reais.

A biblioteca é independente e não possui afiliação com WhatsApp ou Meta. Nenhuma marca ou logotipo oficial é distribuído.
