# Acoplamento entre módulos

Medido com `npm run coupling`, que conta os imports entre as pastas de `src/`.
Nenhuma linha parte de `domain/*` para `application` ou `adapters`.

| from -> to                              | imports |
| --------------------------------------- | ------- |
| adapters -> application                 | 6       |
| adapters -> domain/maintenance          | 4       |
| adapters -> domain/monitoring           | 2       |
| adapters -> domain/shared               | 1       |
| application -> domain/maintenance       | 5       |
| application -> domain/monitoring        | 2       |
| domain/maintenance -> domain/monitoring | 1       |
| domain/maintenance -> domain/shared     | 2       |
| domain/monitoring -> domain/shared      | 1       |
