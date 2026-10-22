# Cultiva - núcleo do MVP

![CI](https://github.com/gustavopmaia/cultiva-nucleo/actions/workflows/ci.yml/badge.svg)

Núcleo do Cultiva (checkpoint 1: monitoramento de vegetação em rodovias). Leituras de
sensor IoT, câmera de veículo e satélite são fundidas num score por trecho. Quando o score
passa de um limiar abre um alerta e uma ordem de serviço, que o planejador joga na rota da
equipe certa. Quando a equipe conclui a ordem, o score do trecho zera e o alerta fecha.

Os dados ficam em memória, como o enunciado permite. A interface é uma demo em linha de comando.

## Como rodar

Precisa de Node 20 ou mais novo.

```bash
npm install
npm run demo      # fluxo completo: leitura, alerta, ordem, rota, conclusão
npm test          # testes
npm run lint      # eslint + prettier --check + tsc
```

Para ver a cobertura: `npm run cobertura` (o relatório de referência está em `docs/coverage.txt`).

## Histórias Must have implementadas

1. Registrar leitura de uma fonte e calcular o score do trecho (fusão ponderada das últimas 24h).
2. Abrir alerta e ordem de serviço ao cruzar os limiares 30, 55 e 80, sem duplicar.
3. Montar a rota de cada equipe por prioridade, data de criação e km.
4. Concluir a ordem: zera o score do trecho e fecha o alerta.

O caso de uso principal é o fluxo 1 -> 2 -> 3 -> 4, que o `npm run demo` executa ponta a ponta.

## Estrutura

```
src/domain/monitoring    trecho (RoadSegment), alerta, score, leituras, estratégias de score
src/domain/maintenance   ordem de serviço, equipe, planejador de rotas
src/domain/shared        KmRange
src/application          casos de uso e portas (interfaces)
src/adapters             repositórios em memória, notificador de console, demo (cli)
tests                    testes de unidade, de casos de uso (adaptadores falsos) e de arquitetura
```

Mais detalhes: [contextos](docs/bounded-contexts.md), [padrões GoF](docs/patterns.md),
[refatorações](docs/refactorings.md), [ADR da arquitetura](docs/adr/0001-hexagonal-architecture.md),
[acoplamento](docs/COUPLING.md) e [dívida técnica](DEBT.md).

## Padrões de código

- Arquivos em `kebab-case`, classes em `PascalCase`, funções e variáveis em `camelCase`, constantes em `MAIOR_SNAKE`.
- Código e commits em inglês. Os nomes do domínio seguem o glossário do checkpoint 1 (RoadSegment = trecho,
  WorkOrder = ordem de serviço, Team = equipe, Alert = alerta).
- Branches: `feat/...`, `fix/...`, `refactor/...`, `chore/...`. Nada de commit direto na `main`, tudo entra por pull request.
- Commits seguem Conventional Commits (`feat:`, `fix:`, `refactor:`, `test:`, `chore:`, `docs:`).
- Formatador: Prettier (`.prettierrc`, `.editorconfig`). Linter: ESLint (`eslint.config.js`).

```bash
npm run formatar   # aplica o prettier
npm run lint       # eslint, checagem do prettier e tsc
```

O ESLint também barra, dentro de `src/domain`, qualquer import de pacote ou das camadas de fora.

## CI

`.github/workflows/ci.yml`: instala dependências, roda o lint e roda os testes, nesta ordem, em
pull request e em push na `main`.
