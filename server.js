import express from 'express';
import cors from 'cors';

import logger from './utils/logger.js';
import config from './config.json' with { type: 'json' };

const app = express();

app.use(cors());

app.use(express.static('public'));
app.use('/templates', express.static('templates'));

app.get('/', (req, res) => {
  res.render('index');
  logger.debug(`Requisição feita: ${req.method} ${req.url}`);
});

app.post('/gerar-rifa', (req, res) => {
  res.send('todo');
  logger.debug(`Requisição feita: ${req.method} ${req.url}`);
});

app.use((req, res) => {
  res.status(404).send("Página não encontrada!");
  logger.debug(`Página não encontrada: ${req.method} ${req.url}`);
});

app.use((err, req, res) => {
  res.status(500).send('Ocorreu um erro inesperado!');
  logger.error(err.stack);
});

app.listen(config.serverPort, () => {
  logger.info(`Aplicação aberta em http://localhost:${config.serverPort}/`);
});
