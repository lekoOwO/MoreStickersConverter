export interface Sticker {
  id: string;
  image: string;
  title: string;
  stickerPackId: StickerPackMeta['id'];
  filename?: string;
  isAnimated?: boolean;
}

export interface StickerPackMeta {
  id: string;
  title: string;
  author?: {
    name: string;
    url?: string;
  };
  logo: Sticker;
}

export interface StickerPack extends StickerPackMeta {
  stickers: Sticker[];
}
