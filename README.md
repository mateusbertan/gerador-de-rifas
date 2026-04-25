# Gerador de Rifas

Este projeto surgiu da necessidade de gerar folhas de rifas personalizadas para o terceirão do colégio que estudo, que anteriormente editava e exportava cada folha manualmente no Excel.

A aplicação utiliza modelos HTML/CSS com placeholders, que são substituídos conforme os dados de cada rifa, e depois gera as folhas de rifa já prontas para a impressão em formato PDF.

## Uso

Requisitos:
- Node.js
- NPM

### 1. Instale as depedências
```shell
$ npm i
```

### 2. Execute o programa

#### Versão Web (local)
```shell
$ npm start
```

#### Versão Web (host)
```shell
$ npm run host
```
> Obs.: Este projeto foi projetado para funcionar com Cloudflare Tunnels, permitindo expor o ambiente local de forma segura. Caso for hospedar de outra forma, recomendo fortemente implementar TLS e outras medidas de segurança.

#### Versão CLI

```shell
$ npm run cli
```
## TODO
* Modo de vendedor automático
* Refatoração do código
