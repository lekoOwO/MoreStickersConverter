import Fastify from 'fastify';
import path from 'path';
import {DATA_DIR} from './telegramStickers.js';
import fsp from 'fs/promises';
import fs from 'fs';

interface ParamsType {
  stickerPackName: string;
  filename: string;
}

const app = Fastify();

app.get(
  '/sticker/telegram/:stickerPackName/:filename',
  async (request, reply) => {
    const {stickerPackName, filename} = request.params as unknown as ParamsType;
    const [stickerId, fileExtension] = filename.split('.', 2);

    // Sanitize stickerPackName and stickerId
    if (!/^[a-z0-9_]+$/i.test(stickerPackName)) {
      await reply.status(400).send('Invalid sticker pack name');
      return;
    }
    if (!/^[a-z0-9_]+$/i.test(stickerId)) {
      await reply.status(400).send('Invalid sticker id');
      return;
    }

    if (!/^(?:webp|tgs)$/i.test(fileExtension)) {
      await reply.status(400).send('Invalid file extension');
      return;
    }

    const stickerFilePath = path.join(DATA_DIR, stickerPackName, filename);
    try {
      await fsp.access(stickerFilePath);
    } catch {
      await reply.status(404).send('Sticker not found');
      return;
    }

    const fileStream = fs.createReadStream(stickerFilePath);
    await reply
      .type(
        fileExtension === 'webp' ? 'image/webp' : 'application/octet-stream',
      )
      .send(fileStream);
  },
);

export {app};
