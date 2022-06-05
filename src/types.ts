export interface PinkoiErrorResponse {
  error: {
    code: number
    message: string
  }
}

export interface PinkoiValidResponse<T> {
  result: T[]
}

export type PinkoiResponse<T = unknown> = PinkoiErrorResponse | PinkoiValidResponse<T>

export interface User {
  email: string
  nick: string
}

export interface WeeklyMission {
  'mission_key': string
  introduction: string
  achieved: boolean
  redeemed: boolean
}

export interface Redeem {
  // cspell:ignore successed
  successed: boolean
}

export interface SignResult {
  reward: number
  special: boolean
  signed: boolean
}

export interface Sign {
  0: SignResult
  1: SignResult
  2: SignResult
  3: SignResult
  4: SignResult
  5: SignResult
  6: SignResult
}

export interface InMissionPeriod {
  in_mission_period: boolean
}
