# Validação local — 14/11/2026

- Windows, Node 26.12.1, npm 11.20.0.
- `npm run lint`: aprovado.
- `npm run typecheck`: aprovado.
- `npm test`: 42 testes aprovados em 3 arquivos (core em Node; editor e adaptadores em jsdom).
- `npm run build`: ESM, CSS e declarações gerados.
- `npm run build:playground`: versão estática gerada em playground-dist.
- `npm audit` e `npm audit --omit=dev`: zero vulnerabilidades reportadas na execução.
- `npm pack --dry-run` e `npm pack`: pacote criado e inspecionado.
- Tarball instalado em diretório consumidor separado, sem instalar peers de frameworks. Imports ESM da raiz e /core funcionaram em Node sem DOM; CSS e documentação presentes. Tipos de raiz e core compilados em consumidor TypeScript com resolução NodeNext.
- Componentes Vue 3 e React testados em montagem, atualização controlada e desmontagem; renderização SSR testada nos dois.
- Playground conferido em navegador: editor, preview com variáveis e cópia com confirmação visual. Viewport de 390px sem transbordamento horizontal; override removido após conferência.
- Captura do playground: ../playground.png.
- Pacote npm: edit-zap-js-0.1.0.tgz. Nenhuma publicação ou envio de mensagens realizado.

## Limites da validação

Não houve teste em clientes WhatsApp ou APIs de envio reais, dispositivos físicos, Safari/iOS ou leitores de tela. CI Node 22/24 foi configurado, mas não executado no GitHub nesta sessão. A sintaxe WhatsApp tem normalizações e limitações de escape descritas em docs/COMPATIBILITY.md; JSON é o formato de persistência sem perdas. Build do editor incorpora Tiptap/ProseMirror (~150 KB gzip no chunk principal); o core fica separado (~3,7 KB gzip).
