import fsp from 'fs/promises';
import fs from 'fs';
import path from 'path';
import {Readable} from 'stream';
import {Telegram} from 'telegraf';
import {StickerPack, Sticker as McSticker} from './mcStickerPack.js';
import {Sticker, StickerSet} from 'telegraf/types';

const DATA_DIR = path.join(path.resolve(process.env.DATA_DIR!), 'telegram');
const CONCURRENCY = parseInt(process.env.CONCURRENCY || '5');
const MC_STICKER_PACK_ID_PREFIX = 'telegram:';
const MC_STICKER_ID_PREFIX = 'telegram:';
const EXTERNAL_URL = process.env.EXTERNAL_URL!;

function generateExternalUrl(
  stickerPackName: string,
  stickerId: string,
  fileExtension: string,
) {
  return `${EXTERNAL_URL}/sticker/telegram/${stickerPackName}/${stickerId}.${fileExtension}`;
}

async function isStickerPackDownloaded(stickerSetName: string) {
  try {
    await fsp.access(path.join(DATA_DIR, stickerSetName));
    return true;
  } catch {
    return false;
  }
}

async function downloadSticker(
  queue: Sticker[],
  telegram: Telegram,
  stickerSet: StickerSet,
) {
  if (queue.length === 0) return;
  const sticker = queue.shift()!;
  const stickerFile = await telegram.getFile(sticker.file_id);
  const stickerFileType = stickerFile.file_path?.split('.').pop() || '';
  const stickerFilePath = path.join(
    DATA_DIR,
    stickerSet.name,
    stickerFile.file_unique_id + '.' + stickerFileType,
  );

  const fileLink = await telegram.getFileLink(stickerFile.file_id);
  const fileStream = fs.createWriteStream(stickerFilePath);
  let retries = 5;
  let response: Response | null = null;
  // eslint-disable-next-line no-constant-condition
  while (retries--) {
    try {
      response = await fetch(fileLink);
      break;
    } catch (e) {
      console.error(e);
      if (retries === 0) {
        await downloadSticker(queue, telegram, stickerSet);
        return;
      }
    }
  }
  if (!response?.body) {
    await downloadSticker(queue, telegram, stickerSet);
    return;
  }
  const stream = Readable.fromWeb(response.body);
  stream.pipe(fileStream);
  await new Promise(resolve => fileStream.on('finish', resolve));
  await downloadSticker(queue, telegram, stickerSet);
}

async function downloadStickerPack(telegram: Telegram, stickerSet: StickerSet) {
  const stickerSetDir = path.join(DATA_DIR, stickerSet.name);
  await fsp.mkdir(stickerSetDir);
  const queue = stickerSet.stickers.slice();

  const downloadPromises = Array.from({length: CONCURRENCY}, () =>
    downloadSticker(queue, telegram, stickerSet),
  );
  await Promise.all(downloadPromises);

  const mcStickerPack = await toMcStickerPack(telegram, stickerSet);
  const mcStickerPackPath = path.join(
    DATA_DIR,
    stickerSet.name + '.telegram.stickerpack',
  );
  await fsp.writeFile(mcStickerPackPath, JSON.stringify(mcStickerPack));
}

async function toMcStickerPack(
  telegram: Telegram,
  stickerSet: StickerSet,
): Promise<StickerPack> {
  const stickerPs = stickerSet.stickers.map(async sticker => {
    const stickerFile = await telegram.getFile(sticker.file_id);
    const stickerFileType = stickerFile.file_path?.split('.').pop() || '';
    return {
      id: `${MC_STICKER_ID_PREFIX}${sticker.file_unique_id}`,
      image: generateExternalUrl(
        stickerSet.name,
        sticker.file_unique_id,
        stickerFileType,
      ),
      title: sticker.emoji,
      stickerPackId: `${MC_STICKER_PACK_ID_PREFIX}${stickerSet.name}`,
      filename: stickerFile.file_unique_id + '.' + stickerFileType,
      isAnimated: sticker.is_animated,
    } as McSticker;
  });
  const stickers = await Promise.all(stickerPs);
  return {
    id: `${MC_STICKER_PACK_ID_PREFIX}${stickerSet.name}`,
    title: stickerSet.title,
    logo: stickers[0],
    stickers,
  } as StickerPack;
}

export {
  isStickerPackDownloaded,
  downloadStickerPack,
  toMcStickerPack,
  DATA_DIR,
};
