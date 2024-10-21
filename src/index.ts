import {app} from './utils/fastify.js';
import {bot} from './utils/telegram.js';

const port = parseInt(process.env.PORT!);
const host = process.env.HOST ?? '::';

await bot.launch();
process.on('SIGINT', () => bot.stop('SIGINT'));
process.on('SIGTERM', () => bot.stop('SIGTERM'));

app.listen({port, host}, () => {
  console.log(`Server listening on http://${host}:${port}`);
});
