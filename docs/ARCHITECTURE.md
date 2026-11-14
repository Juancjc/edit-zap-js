# Arquitetura

Repositório modular com código em `packages/core`, `packages/editor`, `packages/vue`, `packages/react` e documentação da entrada web em `packages/web`. A publicação usa um único pacote e subpaths; estes diretórios não são workspaces npm com releases independentes. Isso evita nomes de pacotes e namespaces não controlados.

O core é TypeScript sem DOM ou frameworks. O modelo é um subconjunto de JSON ProseMirror; parser, serializer, HTML, variáveis, validação, formatação por intervalo e templates são funções independentes do editor. O editor usa Tiptap StarterKit, histórico ProseMirror, mark monoespaçado e decorações de variáveis. DOMPurify faz sanitização do HTML de entrada; a saída HTML é construída com escape pelo core.

Os adaptadores criam e destroem uma instância JavaScript por montagem e sincronizam o valor sem reinjetar conteúdo idêntico. UI e preview compartilham o estado estruturado; dados fictícios nunca alteram o template. O editor não faz requisições de rede. O playground pode carregar fontes do Google Fonts; fontes de sistema são fallback.

Vite Library Mode gera ESM com chunks compartilhados; tsc gera declarações. Frameworks são externos e peers opcionais. Dependências Tiptap/ProseMirror são incorporadas ao bundle do editor; o subpath core continua independente. `sideEffects` preserva CSS e permite tree shaking dos módulos JavaScript.

Testes em Node garantem o core sem DOM; jsdom verifica editor, seleção, histórico, sanitização e adaptadores. CI executa lint, tipos, testes, build e inspeção de pacote em Node 22 e 24. Não há workflow de publicação nem banco de dados.
