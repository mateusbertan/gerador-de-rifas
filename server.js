import express from 'express';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { randomUUID } from 'crypto';

import logger from './utils/logger.js';
import gerarRifa from './utils/gerarRifa.js';
import validarRifa from './utils/validarRifa.js';
import config from './config.json' with { type: 'json' };

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

app.use(helmet());
app.disable('x-powered-by');
app.use(cors({
  methods: ['GET', 'POST'],
  origin: `${config.server.url}:${config.server.port}`
}));

app.use(express.json({ limit: config.server.requestSizeLimit }));

app.use(rateLimit({
  windowMs: config.server.minutesToRememberTimeout * 60 * 1000,
	limit: config.server.maxRequestsUntilTimeout,
	standardHeaders: 'draft-8',
	legacyHeaders: false,
	ipv6Subnet: 56,
	message: {
    error: 'Você está fazendo muitas requisições. Tente novamente mais tarde!'
  }
}));

app.use(express.static('public'));
app.use('/templates', express.static('templates'));
app.use('/rifas', express.static('rifas_geradas'));

let activeGenerations = 0;

app.get('/', (req, res) => {
  logger.debug(`Requisição feita: ${req.method} ${req.url} ${req.ip}`);
  res.render('index');
});

app.post('/gerar-rifa', async (req, res) => {
  logger.debug(`Requisição feita: ${req.method} ${req.url} ${req.ip}`);

  if (activeGenerations >= config.server.maxConcurrentGenerations) {
    logger.warn('Servidor ocupado!');
    return res.status(503).json({
      error: 'Servidor ocupado, há muitas rifas sendo geradas no momento.'
    });
  };

  const validationError = await validarRifa(req);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  };

  const taskId = randomUUID();

  try {
    activeGenerations++;
    logger.info(`< ${taskId} > Iniciando geração... Ativas: ${activeGenerations}.`);

    res.status(200).json({
      msg: "Geração iniciada.",
      taskId: taskId
    });

    await gerarRifa(req.body, taskId, io);
  } catch (error) {
    logger.error(`< ${taskId} > Erro na geração: ${error.stack}`);
    res.status(500).json({
      error: "Falha na geração.",
      taskId: taskId
    });
  } finally {
    activeGenerations--;
    logger.info(`< ${taskId} > Geração finalizada. Ativas: ${activeGenerations}`);
  };
});

app.use((req, res) => {
  res.status(404).send("Página não encontrada!");
  logger.debug(`Página não encontrada: ${req.method} ${req.url} ${req.ip}`);
});

app.use((err, req, res) => {
  logger.error(err);

  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      error: "Requisição muito grande."
    });
  };

  if (err.type === 'invalid.json') {
    return res.status(400).json({
      error: "Requisição inválida."
    });
  };

  res.status(err.status || 500).json({
    error: "Erro no servidor."
  });
});

httpServer.listen(config.server.port, () => {
  logger.info(`Aplicação aberta em http://localhost:${config.server.port}/`);
});
