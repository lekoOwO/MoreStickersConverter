import {Input, Telegraf} from 'telegraf';
import {message} from 'telegraf/filters';
import {
  DATA_DIR,
  downloadStickerPack,
  isStickerPackDownloaded,
} from './telegramStickers.js';
import path from 'path';

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
  if (await isStickerPackDownloaded(stickerPackName)) {
    await ctx.reply('The sticker pack is already downloaded.');
    return;
  }

  const firstMessage = await ctx.reply('Downloading the sticker pack...');
  await downloadStickerPack(ctx.telegram, stickerSet);
  await ctx.telegram.editMessageText(
    ctx.chat.id,
    firstMessage.message_id,
    undefined,
    'The sticker pack has been downloaded.',
  );
  const mcStickerPackPath = path.join(
    DATA_DIR,
    stickerSet.name + '.telegram.stickerpack',
  );
  await ctx.replyWithDocument(Input.fromLocalFile(mcStickerPackPath));
});

export {bot};
