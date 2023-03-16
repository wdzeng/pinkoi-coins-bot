import axios, { AxiosError, AxiosResponse } from 'axios'
import isobject from 'isobject'
import log from 'loglevel' // c-spell: ignore loglevel

import {
  FavList,
  InMissionPeriod,
  PinkoiResponse,
  PinkoiValidResponse,
  Redeem,
  Sign,
  SignResult,
  User,
  WeeklyMission
} from './types'
import { sleep } from './util'

const missionKeyNames = [
  'view_topic',
  'add_fav_shop',
  'add_fav_item',
  'weekly_bonus'
]
const urlRegex =
  /https:\/\/([\w_-]+(?:(?:\.[\w_-]+)+))([\w\p{Script=Han}.,@?^=%&:\/~+#-]*[\w\p{Script=Han}@?^=%&\/~+#-])/gu
const referer = 'https://www.pinkoi.com/event/mission_game'

function outdate(): never {
  log.error(
    'Unexpected mission content. Maybe this bot is outdated. Try passing environment variable DEBUG=1 to see what occurred.'
  )
  throw new Error('unexpected mission content')
}

function validateWeeklyMissionContent(
  _mission: PinkoiValidResponse<unknown>
): asserts _mission is PinkoiValidResponse<WeeklyMission> {
  log.debug('Check if mission content is as expected.')

  if (!isobject(_mission)) {
    log.debug(_mission)
    outdate()
  }

  const mission: any = _mission
  const missionCount: unknown = mission?.result?.length
  if (missionCount !== missionKeyNames.length) {
    log.debug(
      `Expected ${missionKeyNames.length} missions but got ${missionCount}.`
    )
    log.debug(mission)
    outdate()
  }

  function validateMissionKey(index: number, expectedKey: string) {
    const keyName: unknown = mission.result[index]['mission_key']
    if (keyName !== expectedKey) {
      log.debug(
        'Unexpected mission key: ' + keyName + '; should be ' + expectedKey
      )
      outdate()
    }
  }

  missionKeyNames.map((keyName, index) => validateMissionKey(index, keyName))

  log.debug('Get expected mission content.')
}

function getWeeklyMissionStatus(missionList: WeeklyMission[]): (0 | 1 | 2)[] {
  // 0: not solved
  // 1: solved; not redeemed
  // 2: redeemed
  return missionList.map((x) => (x.redeemed ? 2 : x.achieved ? 1 : 0))
}

function validatePinkoiResponse<T>(
  response: AxiosResponse<PinkoiResponse<T>>
): asserts response is AxiosResponse<PinkoiValidResponse<T>> {
  if ('error' in response.data) {
    log.debug(JSON.stringify(response.data))
    throw new Error('pinkoi: ' + response.data.error.message)
  }
  // No error
}

function handleMissionError(missionKey: string, e: unknown): never {
  if (e instanceof Error) {
    throw new Error(`${missionKey}: ` + e.message)
  }

  // Unexpected error
  log.debug(e)
  throw new Error(`${missionKey}: unknown error`)
}

export default class PinkoiBot {
  constructor(private readonly cookie: string) {}

  private async solveViewTopic(mission: WeeklyMission): Promise<void> {
    // 點擊瀏覽當季的活動頁 👉 <a href="https://www.pinkoi.com/topic/experience_tw">週末放假靈感｜手作地毯・流動畫</a>

    const missionKey = mission.mission_key
    log.debug('Solve mission: ' + missionKey)

    try {
      const urls: string[] | null = mission.introduction.match(urlRegex)
      log.debug(`${missionKey}: got urls: ${JSON.stringify(urls)}`)

      if (urls?.length !== 1) {
        throw new Error('expected 1 url')
      }

      log.debug(`${missionKey}: click url: ${urls[0]}`)
      await axios.get<unknown>(urls[0], {
        headers: { cookie: this.cookie, referer }
      })
      log.debug(`${missionKey}: url clicked: ${urls[0]}`)
      await sleep()

      log.info(`Mission ${missionKey} solved.`)
    } catch (e: unknown) {
      handleMissionError(missionKey, e)
    }
  }

  private async addFavShop(shopId: string): Promise<void> {
    const url = 'https://www.pinkoi.com/apiv2/shop/fav'
    const body = { sid: shopId }
    const headers = { cookie: this.cookie, referer }
    log.debug('Adding fav shop: %s', shopId)
    await axios.post(url, body, { headers: headers })
    log.debug('Added fav shop: %s', shopId)
  }

  private async removeFavShop(shopId: string): Promise<void> {
    const url = 'https://www.pinkoi.com/apiv2/shop/unfav'
    const body = { sid: shopId }
    const headers = { cookie: this.cookie, referer }
    log.debug('Removing fav shop: %s', shopId)
    await axios.post(url, body, { headers: headers })
    log.debug('Removed fav shop: %s', shopId)
  }

  private async solveAddFavShop(mission: WeeklyMission): Promise<void> {
    // 關注 1 間設計館 👉 馬上看 <a href=#n-event-mission-game__recommend-title>你的專屬推薦</a>
    // 點擊查看設計館頁，並完成 1 次關注。<br/>\n👉 任務頁面下方有「為你推薦的品牌及商品」，快去看看吧

    const missionKey = mission.mission_key
    log.debug('Solving mission: %s', missionKey)

    const shopId = 'ekax'
    try {
      await this.addFavShop(shopId)
      await sleep()
      log.debug('Add fav shop: %s', shopId)
      await this.removeFavShop(shopId)
      await sleep()
    } catch (e: unknown) {
      handleMissionError(missionKey, e)
    }

    log.info('Mission solved: %s', missionKey)
  }

  private async createFavList(favListName: string): Promise<string> {
    log.debug('Creating new fav list: %s', favListName)

    const url = 'https://www.pinkoi.com/apiv3/favlist/add'
    const body = { name: favListName, is_public: 0 }
    const headers = { cookie: this.cookie, referer }

    // Note that the response is not wrapped (not PinkoiResponse<T>)
    const res = await axios.post<FavList>(url, body, { headers })
    const favListId = res.data.favlist_id

    log.debug('Fav list created: %s, ID: %d', favListName, favListId)
    return favListId
  }

  private async removeFavList(favListId: string): Promise<void> {
    log.debug('Removing fav list: %s', favListId)

    const url = 'https://www.pinkoi.com/apiv3/favlist/delete'
    // cspell: ignore unfav
    const body = { favlist_id: favListId, unfav_all: true }
    const headers = { cookie: this.cookie, referer }
    const res2 = await axios.post(url, body, { headers })
    validatePinkoiResponse(res2)

    log.debug('Fav list removed: %s', favListId)
  }

  private async addFavItem(itemId: string, favListId: string): Promise<void> {
    log.debug('Adding fav item: %s', itemId)

    const url = 'https://www.pinkoi.com/apiv3/item/fav'
    const body = { favlist_id: favListId, tid: itemId }
    const headers = { cookie: this.cookie, referer }
    await axios.post<unknown>(url, body, { headers })

    log.debug('Fav item added: %s', itemId)
  }

  private async solveAddFavItem(mission: WeeklyMission): Promise<void> {
    // 點擊查看商品，並完成 3 次收藏 👉 馬上看 <a href=#n-event-mission-game__recommend-title>你的專屬推薦</a><br>任務進度：0 / 3
    // 點擊查看商品，並完成 3 次收藏。<br/>\n👉 任務頁面下方有「為你推薦的品牌及商品」，快去看看吧！<br>任務進度：已達成 0 / 3

    const missionKey = mission.mission_key
    const favListName = 'pinkoi-coins-bot'
    const itemIds = ['6k5tF2uK', 'zDzEKiTR', 'YRcUicek']  // cspell:disable-line

    log.debug('Solving mission: %s', missionKey)
    try {
      const favListId = await this.createFavList(favListName)
      await sleep()

      for (const itemId of itemIds) {
        await this.addFavItem(itemId, favListId)
        await sleep()
      }

      await this.removeFavList(favListId)
      await sleep()

      log.info('Mission completed: %s;', missionKey)
    } catch (e: unknown) {
      handleMissionError(missionKey, e)
    }
  }

  async requireInWeeklyMissionPeriod(): Promise<void> {
    // Check if it is mission period now.

    log.debug('Check if now is in mission period.')

    const url = 'https://www.pinkoi.com/apiv2/mission_game/in_mission_period'
    const response = await axios.get<PinkoiResponse<InMissionPeriod>>(url)
    validatePinkoiResponse(response)

    if (response.data.result[0].in_mission_period !== true) {
      throw new Error('not in weekly mission period.')
    }

    log.debug('In mission period.')
  }

  private async getWeeklyMissionList(): Promise<WeeklyMission[]> {
    // Get mission list.
    const url = 'https://www.pinkoi.com/apiv2/mission_game/mission_list'
    const response = await axios.get<PinkoiResponse>(url, {
      headers: { cookie: this.cookie, referer }
    })
    validatePinkoiResponse(response)

    // Validate mission list content.
    validateWeeklyMissionContent(response.data)
    return response.data.result
  }

  private async redeemWeeklyMission(missionKey: string): Promise<void> {
    log.debug('Redeem mission: ' + missionKey)

    try {
      const url = 'https://www.pinkoi.com/apiv2/mission_game/redeem'
      const body = { mission_key: missionKey }
      const response = await axios.post<PinkoiResponse<Redeem>>(url, body, {
        headers: { cookie: this.cookie, referer }
      })
      validatePinkoiResponse(response)

      const result = response.data
      log.debug(JSON.stringify(result))

      if (result.result[0].successed !== true) {
        // c-spell: ignore successed
        if (process.env['STRICT']) {
          throw new Error('mission not solved')
        } else {
          log.warn(
            `Mission ${missionKey} not redeemed. This may be concurrency issue on Pinkoi server. Keep goin.`
          )
        }
      } else {
        log.info(`Mission ${missionKey} redeemed.`)
      }
    } catch (e) {
      if (e instanceof Error) {
        log.error('Mission not redeemed: ' + missionKey + ': ' + e.message)
        if (e instanceof AxiosError) {
          log.debug(JSON.stringify(e.response?.data))
        }
      } else {
        log.error('Mission not redeemed: ' + missionKey + ': unknown error')
      }
      throw e
    }
  }

  async solveWeeklyMission(): Promise<void> {
    try {
      // Require in mission period.
      await this.requireInWeeklyMissionPeriod()

      // Get mission list.
      log.debug('Get mission list.')
      let missionList = await this.getWeeklyMissionList()
      let missionStatus = getWeeklyMissionStatus(missionList)
      log.debug('Mission list fetched: ' + JSON.stringify(missionList))

      // Solve missions if not solved.
      function alreadySolved(keyName: string) {
        log.info(`Mission ${keyName} already solved.`)
        return Promise.resolve()
      }

      await (missionStatus[0] === 0
        ? this.solveViewTopic(missionList[0])
        : alreadySolved(missionKeyNames[0]))
      await (missionStatus[1] === 0
        ? this.solveAddFavShop(missionList[1])
        : alreadySolved(missionKeyNames[1]))
      await (missionStatus[2] === 0
        ? this.solveAddFavItem(missionList[3])
        : alreadySolved(missionKeyNames[3]))

      // Check if all five missions should have been solved.
      // Note: there are bugs on pinkoi server. The mission may be showed
      // not solved but can be redeemed.
      log.debug('Update mission status.')
      missionList = await this.getWeeklyMissionList()
      missionStatus = getWeeklyMissionStatus(missionList)
      log.debug('Mission status updated: ' + missionStatus)

      const unsolvedMissions = []
      for (let i of [0, 1, 3]) {
        if (missionStatus[i] === 0) unsolvedMissions.push(i)
      }
      if (unsolvedMissions.length > 0) {
        if (process.env['STRICT']) {
          throw new Error('not all missions are solved: ' + unsolvedMissions)
        } else {
          log.warn('Not all missions are solved: ' + unsolvedMissions)
          log.warn(
            'This may be concurrency issue on Pinkoi server. Keep going on.'
          )
        }
      } else {
        log.info('All missions solved.')
      }

      // Click redeem buttons for six missions.
      for (let i of [0, 1, 3, 2]) {
        if (missionStatus[i] === 2) {
          log.info(`Mission ${missionKeyNames[i]} already redeemed.`)
        } else {
          await this.redeemWeeklyMission(missionKeyNames[i])
          await sleep()
        }
      }
      log.info('All missions redeemed.')

      log.info('Weekly missions all done.')
    } catch (e: unknown) {
      if (e instanceof AxiosError) {
        log.error('Status code: ' + e.response?.status)
        log.error(JSON.stringify(e.response?.data))
        log.debug(e)
      }
      throw e
    }
  }

  async getCheckinStatus(): Promise<boolean[]> {
    const url = 'https://www.pinkoi.com/apiv2/mission_game/daily_signin'
    const response = await axios.post<PinkoiResponse<Sign>>(url, undefined, {
      headers: { cookie: this.cookie, referer }
    })
    validatePinkoiResponse(response)

    const values: SignResult[] = Object.values(response.data.result[0])
    return values.map((e) => e.signed)
  }

  async checkin(): Promise<void> {
    // Get current day
    type Day = 0 | 1 | 2 | 3 | 4 | 5 | 6
    let day: Day = new Date().getDay() as Day
    // Map Sunday to 6 and Monday - Saturday to 0 - 5
    day = (day === 0 ? 6 : day - 1) as Day
    log.debug('Today: ' + day)

    const status = await this.getCheckinStatus()
    if (!status[day]) {
      // Should not happened
      throw new Error('checkin failed: unknown error')
    }
  }

  async getUser(): Promise<{ email: string; nick: string } | undefined> {
    const url = 'https://www.pinkoi.com/apiv2/user/meta'
    let response: AxiosResponse<PinkoiResponse<User>>

    try {
      response = await axios.get<PinkoiResponse<User>>(url, {
        headers: { cookie: this.cookie }
      })
    } catch (e: unknown) {
      if (e instanceof AxiosError) {
        log.debug('AxiosError: ' + e.code)
        if (e.code === AxiosError.ERR_FR_TOO_MANY_REDIRECTS) {
          // Expired cookies
          log.warn('Cookies may have been expired.')
          return undefined
        }
      }
      // Unknown error
      throw e
    }

    if ('error' in response.data && response.data.error.code === 403) {
      return undefined // not logged in
    }
    validatePinkoiResponse(response)

    return response.data.result[0]
  }
}
