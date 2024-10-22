import {Input, Telegraf} from 'telegraf';
import {message} from 'telegraf/filters';
import {
  DATA_DIR,
  downloadStickerPack,
  isStickerPackDownloaded,
} from './telegramStickers.js';
import path from 'path';
import fsp from 'fs/promises';

const bot: Telegraf = new Telegraf(process.env.BOT_TOKEN!);

bot.on(message('sticker'), async ctx => {
  // Get the sticker pack name
  const stickerPackName = ctx.message.sticker!.set_name;
  if (!stickerPackName) {
    await ctx.reply('This sticker does not belong to any sticker pack.');
    return;
  }

  // Download the whole sticker pack
  const stickerSet = await ctx.telegram.getStickerSet(stickerPackName);
  const mcStickerPackPath = path.join(
    DATA_DIR,
    stickerSet.name + '.telegram.stickerpack',
  );
  if (await isStickerPackDownloaded(stickerPackName)) {
    try {
      await fsp.access(mcStickerPackPath);
    } catch {
      await ctx.reply('Error: Sticker pack not found.');
      return;
    }
    await ctx.replyWithDocument(Input.fromLocalFile(mcStickerPackPath));
    return;
  }

  await ctx.reply('Downloading the sticker pack...');
  await downloadStickerPack(ctx.telegram, stickerSet);
  try {
    await fsp.access(mcStickerPackPath);
  } catch {
    await ctx.reply('Error: Sticker pack download error.');
    return;
  }
  await ctx.replyWithDocument(Input.fromLocalFile(mcStickerPackPath));
});

export {bot};
