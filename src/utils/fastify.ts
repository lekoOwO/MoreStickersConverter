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
      await reply.code(400).send('Invalid sticker pack name');
      return;
    }
    if (!/^[a-zA-Z0-9_-]+$/i.test(stickerId)) {
      await reply.code(400).send('Invalid sticker id');
      return;
    }

    if (!/^(?:webp|tgs)$/i.test(fileExtension)) {
      await reply.code(400).send('Invalid file extension');
      return;
    }

    const stickerFilePath = path.join(DATA_DIR, stickerPackName, filename);

    try {
      const fileStream = fs.createReadStream(stickerFilePath, {
        highWaterMark: 64 * 1024,
      });
      await reply
        .type(
          fileExtension === 'webp' ? 'image/webp' : 'application/octet-stream',
        )
        .header('Cache-Control', 'public, max-age=31536000')
        .send(fileStream);
    } catch {
      await reply.code(500).send('Internal server error');
    }
  },
);

export {app};
