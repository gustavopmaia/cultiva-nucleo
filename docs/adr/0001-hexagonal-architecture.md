# ADR 0001 - Arquitetura hexagonal com domínio isolado

Status: aceito (checkpoint 2)

## Contexto

O MVP precisa provar as regras de negócio sem banco, rede ou servidor, e o checkpoint 3 vai
trocar a persistência (banco real, transações, migrations) e expor uma API. A primeira versão tinha a
regra e o armazenamento no mesmo lugar, então qualquer troca mexia nas regras.

## Alternativas consideradas

1. **Manter o serviço único com arrays internos.** Menos arquivos, mas testar a regra exigia montar o
   serviço inteiro e a troca de armazenamento mexia no mesmo código da regra. Descartada.
2. **Camadas clássicas (controller, service, repository).** Resolve parte, mas o service acaba
   importando o repositório concreto, e é fácil a regra vazar para o controller. Descartada.
3. **Hexagonal: domínio no centro, portas como interfaces, adaptadores nas bordas.** Escolhida.

## Decisão

- `src/domain` não importa pacote nenhum nem as camadas de fora. O ESLint (`no-restricted-imports`)
  e `tests/architecture.test.ts` conferem isso.
- `src/application` tem os casos de uso e as portas (`ports.ts`). Os casos de uso recebem as
  portas pelo construtor.
- `src/adapters` implementa as portas (repositórios em memória, notificador de console) e a demo.
- Os testes de caso de uso usam um notificador falso (`RecordingNotifier`) e os repositórios em memória.

## Consequências

- Trocar o armazenamento é escrever outro adaptador de repositório e mudar a montagem da demo.
- O notificador tem duas implementações (console e a fake dos testes). Os repositórios só têm a versão em
  memória por enquanto; aceitamos isso porque o checkpoint 3 traz o banco, e a porta já está no lugar.
- Mais arquivos e um pouco de cerimônia para um domínio pequeno.
- O acoplamento foi medido com `npm run coupling` ([docs/COUPLING.md](../COUPLING.md)): zero imports de
  `domain` para `application` ou `adapters`.
