# MoreStickersConverter

MoreStickersConverter is a tool that converts **Telegram stickers** into **MoreSticker-compatible `.stickerpack` files**.
Simply send a sticker to the bot, and it will download the asset, generate a stickerpack, and return it to you.

This project includes both the Telegram bot logic and the HTTP server used to host sticker images.

---

## ✨ Features

* Receive Telegram stickers from users
* Automatically download sticker assets
* Convert stickers into `.stickerpack` format
* Host sticker images through the built-in HTTP server
* Stickerpacks reference external URLs instead of embedding images

---

## ⚙️ Environment Variables

Before running the service, configure the following environment variables:

| Variable         | Description                                                                                                                                                             |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **BOT_TOKEN**    | Telegram bot token                                                                                                                                                      |
| **PORT**         | Port on which the built-in HTTP server will listen                                                                                                                      |
| **DATA_DIR**     | Directory where all sticker data is stored                                                                                                                              |
| **EXTERNAL_URL** | Public URL of this HTTP server. Required when running behind a reverse proxy. <br>Discord clients typically require HTTPS, otherwise a Mixed-Content warning may occur. |

---

## 🐳 Recommended: Run with Docker

A `Dockerfile` is included, and **Docker Compose is recommended** because:

* It simplifies environment variable configuration
* You can bundle your reverse proxy (Nginx/Caddy/etc.)
* It makes HTTPS setup easier for clients like Discord

---

## ▶️ How to Use

1. Send a sticker to your Telegram bot
2. The bot downloads the sticker file
3. The bot generates and sends back a `.stickerpack` file
4. Sticker images are served by this project's HTTP server (they are **not embedded** inside the `.stickerpack` file)

---

## Notes

* Since stickerpacks rely on externally hosted images, make sure your server's external URL is reachable.
* If using a reverse proxy, ensure that HTTPS is properly configured to avoid client-side loading errors.
