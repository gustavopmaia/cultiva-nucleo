# Refatorações

Antes de refatorar, o commit `test: cover score, fusion, alerts...` (`38f8bb9`) congelou o
comportamento com 33 testes de caracterização. Eles passaram sem alteração depois de cada
commit `refactor:` abaixo (rodamos a suíte em cada commit do histórico).

## 1. Método longo com `if` por fonte (Strategy)

Smell: função longa e cadeia de condicionais. `recordReading` calculava o score de cada fonte, fundia, decidia
o nível e abria alerta e ordem, tudo no mesmo método de cerca de 90 linhas, com números mágicos soltos (1.4, 0.35, 40).

Antes (`170d7bb`, trecho):

```ts
let score = 0;
if (reading.source === "iot") {
  if (reading.heightCm < 0) throw new Error("invalid height");
  score = reading.heightCm * 1.4;
} else if (reading.source === "vehicle") {
  let base = 0;
  if (reading.condition === "ok") base = 10;
  else if (reading.condition === "attention") base = 50;
  ...
```

Depois (`score-strategies.ts`):

```ts
const iotScore: ScoreStrategy = {
  weight: 0.5,
  calculate(reading) {
    if (reading.source !== "iot") throw new Error("reading is not iot");
    if (reading.heightCm < 0) throw new Error("invalid height");
    return new Score(reading.heightCm * 1.4);
  },
};
```

O que melhorou: cada fonte tem regra e peso num lugar só, e uma fonte nova vira um objeto novo em vez de dois
`if` no meio de um método grande. Commits: `de99d1a`, `d93a265`.

## 2. Domínio espalhado em uma classe só (separação em contextos)

Smell: classe que faz tudo (`ServicoCultiva`, depois `CultivaService`) com arrays públicos, regras de
score, de alerta, de despacho e de ordem misturadas, e entidades sem comportamento (só interfaces com campos).

Depois: `RoadSegment` (raiz do agregado, com leituras e alertas), `Alert`, `Score`, `WorkOrder`,
`Team`, `KmRange` e `RoutePlanner`, cada um com as próprias regras. O serviço virou só a ligação. Commits:
`523e2ea`, `ba4ca19`.

## 3. Domínio acoplado ao armazenamento e à entrada (portas e adaptadores)

Antes, o serviço guardava os dados em arrays dele e a demo conhecia o serviço inteiro. Depois, os casos
de uso (`RecordReading`, `StartWorkOrder`, `CompleteWorkOrder`, `BuildRoutes`) recebem
as portas pelo construtor (`SegmentRepository`, `WorkOrderRepository`, `TeamRepository`,
`WorkOrderNotifier`) e os adaptadores ficam em `src/adapters`. Veja o [ADR](adr/0001-hexagonal-architecture.md).
Commits: `55cd660`, `1751f73`.
