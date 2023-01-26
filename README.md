# Pinkoi 簽到機器人

[![release](https://badgen.net/github/release/wdzeng/pinkoi-coins-bot/stable?color=red)](https://github.com/wdzeng/pinkoi-coins-bot/releases/latest)
[![github](https://badgen.net/badge/icon/github/black?icon=github&label=)](https://github.com/wdzeng/pinkoi-coins-bot)
[![docker](https://badgen.net/badge/icon/docker?icon=docker&label=)](https://hub.docker.com/repository/docker/hyperbola/pinkoi-coins-bot)

💰💰 每日簽到 [Pinkoi](https://www.pinkoi.com) 的機器人 💰💰

## 執行方式

請先安裝 [docker](https://docker.com) 或 [podman](https://podman.io/)。映像可於 Docker Hub `hyperbola/pinkoi-coins-bot` 或 GitHub Container Registry (ghcr) [`ghcr.io/wdzeng/pinkoi-coins-bot`](https://ghcr.io/wdzeng/pinkoi-coins-bot) 取得。最新的 tag 為 `1`，tag 清單可見於 Docker Hub 或 ghcr。

Pinkoi 登入的方式眾多。由於沒有辦法模擬 Google 帳號以及其他第三方平台登入的情況，使用者需要自備 cookie 給機器人登入。請將 cookie 字串存在檔案中餵給機器人。Pinkoi 的 cookie 通常會長得像下面這樣，注意一定只有一行。

```txt
slocale=1; lang=zh_TW; b=20220603xxxxxxxx; __zlcmid=xxxxxxxxxxxxx; sessionid=xxxxxxxxxxxxxxxxxxxxxxxxxxx; sv=1.0; stv=1.0; ad=0; geo=TW; ci=HSQ; tz="Asia/Taipei"; c=TWD; country_code=TW; st=b'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'; campaign=mission_game
```

關於 cookie 的取得方式，請參考這份[文件](docs/cookie_instruction.md)或這個[影片](https://www.youtube.com/watch?v=E-j-vlDuYtA)。

> **Warning**
> Cookie 是機密資訊，請妥善保存。

### 使用說明

使用 `--help` 參數。

```sh
docker run -it hyperbola/pinkoi-coins-bot:1 --help
```

### 每日簽到

使用 `--checkin` 參數。

```sh
docker run [-it] \
    -v /path/to/cookie:/cookie \
    hyperbola/pinkoi-coins-bot:1 --cookie /cookie --checkin
```

### 解週末任務

使用 `--solve-weekly-mission` 參數。

```sh
docker run [-it] \
    -v /path/to/cookie:/cookie \
    hyperbola/pinkoi-coins-bot:1 --cookie /cookie --solve-weekly-mission
```

## 參數

執行機器人時，必須從 `--checkin` 或 `--solve-weekly-mission` 中選擇恰一個執行。Cookie 是必填。

- `-c`, `--cookie`: cookie 檔案位置
- `-s`, `--checkin`: 每日簽到
- `-m`, `--solve-weekly-mission`: 解週末任務
- `-q`, `--quiet`: 不要印出訊息；警告和錯誤訊息仍會印出
- `-V`, `--version`: 印出版本
- `-h`, `--help`: 印出使用方式

## Exit Code

| Exit Code | 解釋 |
| ---       | ---- |
| 0 | 簽到或任務成功。 |
| 1 | 簽到或任務失敗。 |
| 69 | 登入失敗。這表示 cookie 有問題。 |
| 87 | 參數錯誤。 |
| 255 | 不明錯誤。 |

## 姊妹機器人

- [蝦皮簽到機器人](https://github.com/wdzeng/shopee-coins-bot/)
- [批踢踢登入機器人](https://github.com/wdzeng/ptt-login-bot/)
- [Telegram ID 覬覦者](https://github.com/wdzeng/telegram-id-pretender/)
