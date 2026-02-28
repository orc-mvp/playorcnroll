## Correção de dados: Filtro de Lobisomem em /customization

### Problema

A atualização em massa anterior adicionou incorretamente a tag `lobisomem_w20` a 256 itens que pertencem exclusivamente ao Vampiro. Resultado: ao filtrar por "Lobisomem: O Apocalipse", aparecem 286 itens em vez dos 28 corretos.

### Correção (somente dados, zero alteração de código)

Executar um UPDATE para remover `lobisomem_w20` dos itens que possuem ambos os sistemas (`vampiro_v3` e `lobisomem_w20`):

```text
UPDATE merits_flaws
SET game_systems = array_remove(game_systems, 'lobisomem_w20')
WHERE 'vampiro_v3' = ANY(game_systems)
  AND 'lobisomem_w20' = ANY(game_systems);
```

### Resultado esperado

- Filtro "Todos os Sistemas": 286 itens
- Filtro "Vampiro: A Mascara": 258 itens (somente com `vampiro_v3`)
- Filtro "Lobisomem: O Apocalipse": 28 itens (somente com `lobisomem_w20`)
- Não ser mais possível adicionar nenhum item com a tag `lobisomem_w20`

