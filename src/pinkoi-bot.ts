// cspell:ignore isobject

import axios, { AxiosResponse } from 'axios'
import isobject from 'isobject'
import log from 'loglevel'

interface UserResult {
  result: {
    email: string
    nick: string
  }[]
}

interface WeeklyMission {
  'mission_key': string
  introduction: string
  achieved: boolean
  redeemed: boolean
}

interface WeeklyMissionList {
  result: WeeklyMission[]
}

interface RedeemResult {
  // cspell:ignore successed
  result: { successed: boolean }
}

interface SignStatus {
  reward: number
  special: boolean
  signed: boolean
}

interface SignResult {
  result: Record<number, SignStatus>[]
}

function outdate(): never {
  log.error('Unexpected mission content. Maybe this bot is outdated. Try passing environment DEBUG=1 to see what occurred.')
  throw new Error('unexpected mission content')
}

function validateWeeklyMissionContent(_mission: unknown): _mission is WeeklyMission {
  if (!isobject(_mission)) {
    log.debug(_mission)
    outdate()
  }

  const mission: any = _mission
  const missionCount: unknown = mission?.result?.length
  if (missionCount !== 6) {
    log.debug('Expected 6 missions.')
    log.debug(mission)
    outdate()
  }

  function validateMissionKey(index: number, expectedKey: string) {
    const keyName: unknown = mission.result[index]['mission_key']
    if (keyName !== expectedKey) {
      log.debug('Unexpected mission key: ' + keyName)
      log.debug('Expected mission key: ' + expectedKey)
      outdate()
    }
  }

  validateMissionKey(0, 'browse_three_subcategory')
  validateMissionKey(1, 'view_topic')
  validateMissionKey(2, 'add_fav_item')
  validateMissionKey(3, 'view_recommend')
  validateMissionKey(4, 'add_fav_shop')
  validateMissionKey(5, 'weekly_bonus')

  log.debug('Get expected mission content.')
  return true
}

function getWeeklyMissionStatus(missionList: WeeklyMissionList): (0 | 1 | 2)[] {
  return missionList.result.map(x => x.redeemed ? 2 : (x.achieved ? 1 : 0))
}

function validatePinkoiResponse(response: AxiosResponse) {
  if (response.data.error?.message) {
    log.debug(response.data)
    throw new Error('pinkoi: ' + response.data.error.message)
  }
  if (response.data.error) {
    log.debug(response.data)
    throw response.data.error
  }
}

function handleMissionError(i: number, e: unknown): never {
  if (e instanceof Error) {
    throw new Error('mission ' + i + ': ' + e.message)
  }
  else {
    throw e
  }
}


export default class PinkoiBot {

  constructor(private readonly cookie: string) {
  }

  private async solveWeeklyMission0(mission: WeeklyMission): Promise<void> {
    try {
      // 擊瀏覽三個推薦分類 <a href=\"https://www.pinkoi.com/browse?subcategory=501\">燈具/燈飾</a>、<a href=\"https://www.pinkoi.com/browse?subcategory=516\">香氛蠟燭/燭台</a>、<a href=\"https://www.pinkoi.com/browse?subcategory=549\">乾燥花/永生花</a><br>任務進度：3 / 3

      const urlRegex = /https:\/\/([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:\/~+#-]*[\w@?^=%&\/~+#-])/g
      const urls: string[] | null = mission.introduction.match(urlRegex)
      log.debug('Url parsed from mission introduction: ' + urls)
      if (urls?.length !== 3) {
        throw new Error('expected 3 urls')
      }

      const self = this
      async function solve(url: string) {
        const response = await axios(url, { headers: { cookie: self.cookie } })
        validatePinkoiResponse(response)
      }

      await Promise.all(urls.map(solve))
      log.info('Mission 0 completed.')
    } catch (e: unknown) {
      handleMissionError(0, e)
    }
  }

  private async solveWeeklyMission1(mission: WeeklyMission): Promise<void> {
    // 點擊瀏覽當季的活動頁 👉 <a href=\"https://www.pinkoi.com/topic/pinkoi-brand\">Pinkoi 理想生活新樣貌</a>

    try {
      const urlRegex = /https:\/\/([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:\/~+#-]*[\w@?^=%&\/~+#-])/g
      const urls: string[] | null = mission.introduction.match(urlRegex)
      log.debug('Url parsed from mission introduction: ' + urls)

      if (urls?.length !== 1) {
        throw new Error('expected 1 url')
      }

      const response = await axios(urls[0], { headers: { cookie: this.cookie } })
      validatePinkoiResponse(response)
      log.info('Mission 1 completed.')
    } catch (e: unknown) {
      handleMissionError(1, e)
    }
  }

  private async solveWeeklyMission2(mission: WeeklyMission): Promise<void> {
    // 將你喜歡的 1 項商品加入慾望清單，即可領取 P Coins<br>👉 任務頁面下方有「你的專屬推薦商品」不妨從那裡開始吧！
    const tid = 'PAv3tZXu'
    let response: AxiosResponse

    try {
      // Add an item to favor list.
      response = await axios.post('https://www.pinkoi.com/apiv3/item/fav', { tid }, { headers: { cookie: this.cookie } })
      validatePinkoiResponse(response)

      // Remove an item from favor list
      response = await axios.post('https://www.pinkoi.com/apiv3/item/unfav', { tid }, { headers: { cookie: this.cookie } })
      validatePinkoiResponse(response)
      log.info('Mission 2 completed.')
    } catch (e: unknown) {
      handleMissionError(2, e)
    }
  }

  private async solveWeeklyMission3(mission: WeeklyMission): Promise<void> {
    // 點擊商品頁，或此頁底下的「找相似」發現同類、風格型商品
    // TODO: not sure if this works

    const url = 'https://www.pinkoi.com/recommend/product/qLE8qUei?tab=similia'
    const referer = 'https://www.pinkoi.com/event/mission_game'

    try {
      const response = await axios(url, { headers: { cookie: this.cookie, referer } })
      validatePinkoiResponse(response)
      log.info('Mission 3 completed.')
    } catch (e: unknown) {
      handleMissionError(3, e)
    }
  }

  private async solveWeeklyMission4(mission: WeeklyMission): Promise<void> {
    // 在週五、六、日，本週期間內，關注 1 間喜愛的設計館，即可領取 P Coins<br>👉 任務頁面下方推薦了「嚴選品牌推薦」不妨從那裡開始吧！
    const sid = 'oliviayaojewellery' // cspell:disable-line
    let response: AxiosResponse

    try {
      // Add a store to favor list
      response = await axios.post('https://www.pinkoi.com/apiv2/shop/fav', { sid }, { headers: { cookie: this.cookie } })
      validatePinkoiResponse(response)

      // Remove a store from favor list
      response = await axios.post('https://www.pinkoi.com/apiv3/item/unfav', { sid }, { headers: { cookie: this.cookie } })
      validatePinkoiResponse(response)
      log.info('Mission 4 completed.')
    } catch (e: unknown) {
      handleMissionError(4, e)
    }
  }

  async requireInWeeklyMissionPeriod(): Promise<void> {
    // Check if it is mission period now.
    const url = 'https://www.pinkoi.com/apiv2/mission_game/in_mission_period'
    const response = await axios(url)
    validatePinkoiResponse(response)

    if (response.data.result[0]['in_mission_period'] !== true) {
      throw new Error('Failed to solve weekly mission: not in period.')
    }
  }

  private async getWeeklyMissionList(): Promise<WeeklyMissionList> {
    // Get mission list.
    const url = 'https://www.pinkoi.com/apiv2/mission_game/mission_list'
    const response = await axios(url, { headers: { cookie: this.cookie } })
    validatePinkoiResponse(response)

    // Validate mission list content.
    validateWeeklyMissionContent(response.data)

    return response.data
  }

  private async redeemWeeklyMission(missionKey: string): Promise<void> {
    const url = 'https://www.pinkoi.com/apiv2/mission_game/redeem'
    const body = { mission_key: missionKey }
    const response = await axios.post(url, body, { headers: { cookie: this.cookie } })
    validatePinkoiResponse(response)

    const result: RedeemResult = response.data
    if (result.result.successed !== true) {
      throw new Error('mission not completed: ' + missionKey)
    }
  }

  async solveWeeklyMission(): Promise<void> {
    // Require in mission period.
    await this.requireInWeeklyMissionPeriod()

    // Get mission list.
    let missionList = await this.getWeeklyMissionList()
    let missionStatus = getWeeklyMissionStatus(missionList)

    // Solve missions if not completed.
    await Promise.all([
      missionStatus[0] >= 1 ? Promise.resolve() : this.solveWeeklyMission0(missionList.result[0]),
      missionStatus[1] >= 1 ? Promise.resolve() : this.solveWeeklyMission1(missionList.result[1]),
      missionStatus[2] >= 1 ? Promise.resolve() : this.solveWeeklyMission2(missionList.result[2]),
      missionStatus[3] >= 1 ? Promise.resolve() : this.solveWeeklyMission3(missionList.result[3]),
      missionStatus[4] >= 1 ? Promise.resolve() : this.solveWeeklyMission4(missionList.result[4]),
    ])

    // Check if all five missions should have been completed.
    missionList = await this.getWeeklyMissionList()
    missionStatus = getWeeklyMissionStatus(missionList)
    if (missionStatus.some(x => x === 0)) {
      log.debug('Mission status: ' + missionStatus)
      throw new Error('not all missions are completed')
    }

    // Click complete buttons for five missions.
    await Promise.all([
      missionStatus[0] === 2 ? Promise.resolve() : this.redeemWeeklyMission('browse_three_subcategory'),
      missionStatus[1] === 2 ? Promise.resolve() : this.redeemWeeklyMission('view_topic'),
      missionStatus[2] === 2 ? Promise.resolve() : this.redeemWeeklyMission('add_fav_item'),
      missionStatus[3] === 2 ? Promise.resolve() : this.redeemWeeklyMission('view_recommend'),
      missionStatus[4] === 2 ? Promise.resolve() : this.redeemWeeklyMission('add_fav_shop'),
    ])

    // Receive weekly bonus.
    if (missionStatus[5] !== 2) {
      await this.redeemWeeklyMission('weekly_bonus')
    }
  }

  async getCheckinStatus(): Promise<boolean[]> {
    const url = 'https://www.pinkoi.com/apiv2/mission_game/daily_signin'
    const response = await axios.post(url, undefined, { headers: { cookie: this.cookie } })
    validatePinkoiResponse(response)

    const result: SignResult = response.data
    const values = Object.values(result.result[0])
    return values.map(e => e.signed)
  }

  async checkin(): Promise<void> {
    // Get current day
    type Day = 0 | 1 | 2 | 3 | 4 | 5 | 6
    let day: Day = new Date().getDay() as Day
    // Map Sunday to 6 and Monday - Saturday to 0 - 5
    day = ((day === 0) ? 6 : (day - 1)) as Day
    log.debug('Today: ' + day)

    const status = await this.getCheckinStatus()
    if (!status[day]) {
      // Should not happened
      throw new Error('unknown error')
    }
  }

  async getUser(): Promise<{ email: string, nick: string } | undefined> {
    const url = 'https://www.pinkoi.com/apiv2/user/meta'
    const response = await axios(url, { headers: { cookie: this.cookie } })

    if (response.data.error?.code === 403) {
      return undefined // not logged in
    }
    validatePinkoiResponse(response)

    const result: UserResult = response.data
    return result.result[0]
  }
}
