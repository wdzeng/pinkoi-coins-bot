# Pinkoi 簽到機器人

💰💰 每日簽到 [Pinkoi](https://www.pinkoi.com) 的機器人 💰💰

## 使用方式

請先安裝 [docker](https://docker.com)。

Pinkoi 登入的方式眾多。由於沒有辦法模擬 Google 帳號以及其他第三方平台登入的情況，使用者需要自備 cookie 給機器人登入。請將 cookie 字串存在檔案中餵給機器人。關於 cookie 的取得方式，請參考[這個影片](https://www.youtube.com/watch?v=E-j-vlDuYtA)。Pinkoi 的 cookie 通常會長得像這樣一行：

```text
slocale=1; lang=zh_TW; b=20220603xxxxxxxx; __zlcmid=xxxxxxxxxxxxx; sessionid=xxxxxxxxxxxxxxxxxxxxxxxxxxx; sv=1.0; stv=1.0; ad=0; geo=TW; ci=HSQ; tz="Asia/Taipei"; c=TWD; country_code=TW; st=b'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'; campaign=mission_game
```

Cookie 是機密資訊，請妥善保存。

### 每日簽到

```sh
docker run -v /path/to/cookie:/cookie --it hyperbola/pinkoi-coins-bot:v1 --cookie /cookie --checkin
```

### 解週末任務

```sh
docker run -v /path/to/cookie:/cookie --it hyperbola/pinkoi-coins-bot:v1 --cookie /cookie --solve-weekly-mission
```

### 看使用說明

```sh
docker run --it hyperbola/pinkoi-coins-bot:v1 --help
```

## 參數

執行機器人時，必須從 `--checkin` 或 `--solve-weekly-mission` 中選擇恰一個執行。

- `-c`, `--cookie`: （必填）cookie 的存放位置
- `-s`, `--checkin`: 每日簽到
- `-m`, `--solve-weekly-mission`：解週末任務

## Exit Code

| Exit Code | 解釋 |
| ---       | ---- |
| 0 | 簽到或任務成功。 |
| 1 | 簽到或任務失敗。 |
| 69 | 登入失敗。這表示 cookie 有問題。 |
| 87 | 參數錯誤。 |
| 255 | 不明錯誤。 |
