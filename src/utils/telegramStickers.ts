import fsp from 'fs/promises';
import fs from 'fs';
import path from 'path';
import {Readable} from 'stream';
import {Telegram} from 'telegraf';
import {StickerPack, Sticker as McSticker} from './mcStickerPack.js';
import {Sticker, StickerSet} from 'telegraf/types';

const DATA_DIR = path.join(path.resolve(process.env.DATA_DIR!), 'telegram');
const CONCURRENCY = parseInt(process.env.CONCURRENCY || '5');
const MC_STICKER_PACK_ID_PREFIX = 'MoreStickers:Telegram:Pack';
const MC_STICKER_ID_PREFIX = 'MoreStickers:Telegram:Sticker';
const EXTERNAL_URL = process.env.EXTERNAL_URL!;

function toMcStickerPackId(stickerSetName: string) {
  return `${MC_STICKER_PACK_ID_PREFIX}:${stickerSetName}`;
}

function toMcStickerId(stickerId: string, stickerPackName: string) {
  return `${MC_STICKER_ID_PREFIX}:${stickerPackName}:${stickerId}`;
}

function generateExternalUrl(
  stickerPackName: string,
  stickerId: string,
  fileExtension: string,
) {
  return `${EXTERNAL_URL}/sticker/telegram/${stickerPackName}/${stickerId}.${fileExtension}`;
}

export function generateStickerPackDirPath(stickerSetName: string) {
  return path.join(DATA_DIR, stickerSetName);
}

export function generateStickerPackFilePath(stickerSetName: string){
  return path.join(
    DATA_DIR,
    stickerSetName + '.telegram.stickerpack',
  );
}

async function isStickerPackDownloaded(stickerSetName: string) {
  try {
    const p = generateStickerPackDirPath(stickerSetName);
    await fsp.access(p);
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
  const stickerPackDirPath = generateStickerPackDirPath(stickerSet.name);
  const stickerFilePath = path.join(
    stickerPackDirPath,
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
  const stickerSetDir = generateStickerPackDirPath(stickerSet.name);
  await fsp.mkdir(stickerSetDir);
  const queue = stickerSet.stickers.slice();

  const downloadPromises = Array.from({length: CONCURRENCY}, () =>
    downloadSticker(queue, telegram, stickerSet),
  );
  await Promise.all(downloadPromises);

  const mcStickerPack = await toMcStickerPack(telegram, stickerSet);
  const mcStickerPackPath = generateStickerPackFilePath(stickerSet.name);
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
      id: toMcStickerId(sticker.file_unique_id, stickerSet.name),
      image: generateExternalUrl(
        stickerSet.name,
        sticker.file_unique_id,
        stickerFileType,
      ),
      title: sticker.emoji,
      stickerPackId: toMcStickerPackId(stickerSet.name),
      filename: stickerFile.file_unique_id + '.' + stickerFileType,
      isAnimated: sticker.is_animated,
    } as McSticker;
  });
  const stickers = await Promise.all(stickerPs);
  return {
    id: toMcStickerPackId(stickerSet.name),
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
