import {app} from './utils/fastify.js';
import {bot} from './utils/telegram.js';

const port = parseInt(process.env.PORT!);
const host = process.env.HOST ?? '::';

process.on('SIGINT', () => bot.stop('SIGINT'));
process.on('SIGTERM', () => bot.stop('SIGTERM'));

await Promise.all([
  app
    .listen({port, host})
    .then(() => console.log(`Server listening on http://${host}:${port}`)),
  bot.launch(),
]);
