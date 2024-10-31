# MoreStickersConverter

This project provides a way to transform Telegram stickers into compatible MoreSticker sticker packs.

## Setup

Setup the following environment variables.

| Variable     | Description                                                                                                                                                                                                                                  |
|--------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| BOT_TOKEN    | The telegram bot token                                                                                                                                                                                                                       |
| PORT         | Port of your HTTP Server listens to                                                                                                                                                                                                          |
| DATA_DIR     | Where your data stores in                                                                                                                                                                                                                    |
| EXTERNAL_URL | The external URL of your HTTP Server. Useful when you are reverse-proxing your HTTP Server. In most cases you should reverse proxy the HTTP Server since Discord client requires HTTPS connection or a Mixed-Content error may be triggered. |

We recommmand starting this app using Docker (Compose). The dockerfile is included.

Docker Compose is recommanded since you can pack your reverse proxy server in.

## Usage

Send a sticker to the telegram bot.

The bot should start download the sticker, and send you the .stickerpack file.

The image is hosted with the HTTP Server in this project instead of embedding inside the stickerpack file.
