# Padrões GoF aplicados

Os dois entraram por refatoração, com testes verdes antes e depois (ver [refatorações](refactorings.md)).
Não usamos Singleton.

## Strategy: score por fonte

Problema: `recordReading` tinha uma cadeia de `if` por fonte (iot, veículo, satélite) calculando o
score e outra para escolher o peso. Cada fonte nova mexia em dois pontos do mesmo método.

Onde: `src/domain/monitoring/score-strategies.ts` e `road-segment.ts`.

```
RoadSegment (Context) ---usa---> ScoreStrategy (Strategy)
                                     ^   ^   ^
                       iotScore -----+   |   +---- satelliteScore
                              vehicleScore
```

| Papel            | Código                                                                                     |
| ---------------- | ------------------------------------------------------------------------------------------ |
| Strategy         | `ScoreStrategy` (`weight`, `calculate`)                                                    |
| ConcreteStrategy | `iotScore`, `vehicleScore`, `satelliteScore`                                               |
| Context          | `RoadSegment.recordReading` / `fuseReadings`, que escolhe por `STRATEGIES[reading.source]` |

Commits: `de99d1a` e `d93a265`.

## State: ciclo da ordem de serviço

Problema: o status da ordem era uma string e cada método (`start`, `complete`) testava com `if` qual transição era
permitida. Cada novo estado obrigava a revisar todos os ifs.

Onde: `src/domain/maintenance/work-order.ts`.

```
WorkOrder (Context) ---state---> WorkOrderState
                                    ^      ^        ^
                                  Open  InProgress  Completed
```

| Papel         | Código                                              |
| ------------- | --------------------------------------------------- |
| State         | `WorkOrderState`                                    |
| ConcreteState | `Open`, `InProgress`, `Completed`                   |
| Context       | `WorkOrder` (`start`, `complete` delegam ao estado) |

Commit: `11082c4`. Com três estados o ganho é modesto: as mensagens de erro de cada transição
inválida passaram a morar no estado que a proíbe. Se o ciclo não crescer, uma tabela de transições
resolveria igual, e isso está anotado como decisão consciente.
