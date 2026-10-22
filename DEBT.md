# Dívida técnica

Registro das escolhas que fizemos sabendo que vão custar manutenção depois.
Prioridade: **alta** compromete o projeto, **média** adia melhorias, **baixa** é cosmética.

## DT-01 - Persistência só em memória

- Onde: `src/adapters/in-memory-repositories.ts`
- Por que foi assumido: o enunciado deste checkpoint dispensa banco, e o foco era o domínio.
- Impacto: reiniciar a aplicação perde tudo. Não há transação entre salvar a ordem e salvar o trecho na conclusão.
- Prioridade: alta, resolver antes de expor a API.
- Custo de conviver: nenhuma demo ou uso real sobrevive a um restart; a conclusão da ordem pode ficar pela metade se o segundo `save` falhar (hoje não falha, em memória).

## DT-02 - Fusão guarda todas as leituras dentro do trecho

- Onde: `src/domain/monitoring/road-segment.ts` (`readings`, `fuseReadings`)
- Por que foi assumido: a regra de 24h ficou simples filtrando a lista inteira a cada leitura.
- Impacto: a lista cresce sem limite e cada leitura nova percorre tudo. Além disso, depois que a ordem é concluída o score zera, mas as leituras antigas das últimas 24h voltam a pesar na próxima fusão e podem reabrir o alerta.
- Prioridade: alta (o segundo ponto é um erro de regra, o primeiro é desempenho).
- Custo de conviver: ~1 dia para decidir a regra com o negócio (descartar leituras anteriores à conclusão) e ajustar os testes; com volume real de sensores a leitura fica lenta.

## DT-03 - Equipe com um único território e primeira equipe que cobre ganha

- Onde: `src/domain/maintenance/route-planner.ts`
- Por que foi assumido: o planejador só precisava provar a ordenação da rota.
- Impacto: se dois territórios se sobrepõem, a ordem vai sempre para a primeira equipe cadastrada. Sem limite de capacidade por equipe.
- Prioridade: média.
- Custo de conviver: ~2h para cada ajuste de despacho que dependa de balanceamento; hoje o gestor teria que reordenar na mão.

## DT-04 - Estado da ordem sem histórico de transições

- Onde: `src/domain/maintenance/work-order.ts`
- Por que foi assumido: o padrão State resolveu as transições válidas, mas não registra quem mudou nem quando, exceto a conclusão.
- Impacto: não dá para auditar quando a ordem foi iniciada.
- Prioridade: baixa.
- Custo de conviver: só aparece quando houver requisito de auditoria.

## DT-05 - Mensagens de erro como texto solto

- Onde: `throw new Error("...")` em `src/domain` e `src/application`
- Por que foi assumido: prazo curto, os testes comparam o texto.
- Impacto: a camada de entrada não consegue diferenciar "não encontrado" de "regra violada" sem comparar string.
- Prioridade: baixa (cosmética por enquanto, sobe para média quando existir API HTTP).
- Custo de conviver: ~2h na hora de mapear erros para códigos HTTP.
