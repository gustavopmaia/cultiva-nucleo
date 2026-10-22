# Mapa de bounded contexts

Dois contextos, ligados ao modelo de domínio do checkpoint 1 (trecho, leitura, alerta, ordem de serviço, equipe).

```
+-----------------------------+   alerta aberto (id, trecho, nível,   +-----------------------------+
|        Monitoramento        |   faixa de km)                        |         Manutenção          |
|  RoadSegment (raiz)         | ------------------------------------> |  WorkOrder                  |
|  Reading, Score, Alert      |                                       |  Team, RoutePlanner         |
|  fusão de fontes            | <------------------------------------ |  rota por equipe            |
+-----------------------------+   ordem concluída (alerta, quando)    +-----------------------------+
```

No código a ponte entre os dois fica na camada de aplicação (`RecordReading` abre a ordem a
partir do alerta, `CompleteWorkOrder` devolve a conclusão ao trecho). O domínio de manutenção
só enxerga do monitoramento o tipo `AlertLevel`, em `priority.ts`. Isso é conferido em
`tests/architecture.test.ts`.

## Monitoramento

Responde "qual o estado da vegetação neste trecho?". Guarda as leituras, calcula o score, detecta
divergência entre fontes e decide quando abrir um alerta. As leituras só têm sentido dentro do
trecho, então ficam no mesmo agregado.

## Manutenção

Responde "quem vai fazer o serviço e em que ordem?". Guarda a ordem de serviço, o ciclo
aberta/em andamento/concluída, as equipes e o planejamento de rotas.

## Por que separar

- As duas partes mudam por motivos diferentes: ajustar peso de sensor ou limiar não deveria
  mexer em despacho, e mudar regra de rota não deveria mexer no cálculo de score.
- O monitoramento recebe volume alto de leituras, a manutenção recebe poucas ordens e age sobre
  elas. No futuro podem ter ritmos e armazenamento diferentes.
- A ordem de serviço precisa ficar de pé mesmo que o score do trecho mude depois, então ela guarda só o
  id do trecho, o id do alerta e uma cópia da faixa de km.

## Termos que mudam de significado

| Termo              | Monitoramento                                   | Manutenção                                                            |
| ------------------ | ----------------------------------------------- | --------------------------------------------------------------------- |
| Trecho (segment)   | unidade medida, com score e alertas             | lugar onde a equipe trabalha; só interessa a faixa de km              |
| Nível / prioridade | nível do alerta: attention, urgent, critical    | prioridade da ordem: normal, urgent, critical (attention vira normal) |
| Concluir           | não existe, o alerta é fechado por consequência | encerrar a ordem pela equipe de campo                                 |

`KmRange` é compartilhado pelos dois (pequeno kernel compartilhado), porque os dois falam de
km da rodovia do mesmo jeito.
