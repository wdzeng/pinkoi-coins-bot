import { OptionValues } from 'commander'
import log from 'loglevel' // cspell: ignore loglevel

import { EXIT_CODE_INVALID_ARGUMENT } from './exit_code'

export function sleep() {
  return new Promise((res) => setTimeout(res, 500))
}

export function setupLogging(args: OptionValues) {
  if (process.env['DEBUG']) {
    log.setDefaultLevel('debug')
    if (args.quiet) {
      log.warn('Option `--quiet` is ignored in debug mode.')
    }
  } else if (args.quiet) {
    log.setDefaultLevel('warn')
  } else {
    log.setDefaultLevel('info')
  }
}

function requireCheckinOrSolveWeeklyMission(args: OptionValues) {
  if (args.checkin === args.solveWeeklyMission) {
    log.error(
      'You should run exactly one of --checkin or --solve-weekly-mission.'
    )
    process.exit(EXIT_CODE_INVALID_ARGUMENT)
  }
}

export function validateArgs(args: OptionValues) {
  requireCheckinOrSolveWeeklyMission(args)
}
