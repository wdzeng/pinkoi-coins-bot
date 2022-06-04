import fs from 'fs'
import path from 'path'
import log from 'loglevel'
import { program } from 'commander'
import Bot from './pinkoi-bot'

const EXIT_TASK_FAILED = 1
const EXIT_LOGIN_FAILED = 69
const EXIT_CODE_INVALID_ARGUMENT = 87
const EXIT_CODE_UNKNOWN_ERROR = 255

log.setDefaultLevel(process.env['DEBUG'] ? 'debug' : 'info')

program
  .name('pinkoi-coins-bot')
  .description('A bot to checkin to get Pinkoi coins.')
  .requiredOption('-c, --cookie <path>', 'path to cookie')
  .option('-s, --checkin', 'checkin Pinkoi')
  .option('-m, --solve-weekly-mission', 'solve Pinkoi weekly mission')
  .usage('docker run -it')
  .version('0.0.0', '-v, --version')
  .exitOverride(() => process.exit(EXIT_CODE_INVALID_ARGUMENT))

program.parse(process.argv)
const args = program.opts()

async function main() {
  if (args.checkin === args.solveWeeklyMission) {
    log.error('You should run exactly one of --checkin or --solve-weekly-mission.')
    process.exit(EXIT_CODE_INVALID_ARGUMENT)
  }

  log.debug('Start to load cookie from: ' + args.cookie)
  let cookie: string
  try {
    cookie = fs.readFileSync(path.resolve(args.cookie), 'utf-8').trim()
  } catch (e: unknown) {
    log.error('Failed to read cookie: ' + args.cookie)
    if (e instanceof Error) {
      log.error(e.message)
    }
    process.exit(EXIT_CODE_INVALID_ARGUMENT)
  }
  log.info('Cookie loaded.')
  log.debug('Use cookie: ' + cookie)

  const bot = new Bot(cookie)
  const user = await bot.getUser()
  if (user === undefined) {
    log.error('Login failed. Please check your cookie.')
    process.exit(EXIT_LOGIN_FAILED)
  }

  log.info(`Login: ${user.nick} <${user.email}>`)
  if (args.checkin) {
    try {
      await bot.checkin()
      log.info('Checkin succeeded.')
    } catch (e: unknown) {
      if (e instanceof Error) {
        log.error('Checkin failed: ' + e.message)
      }
      else {
        log.error('Checkin failed: unknown error')
        log.error(e)
        process.exit(EXIT_CODE_UNKNOWN_ERROR)
      }
    }
  }
  else {
    try {
      await bot.solveWeeklyMission()
      log.info('Mission completed.')
    } catch (e: unknown) {
      if (e instanceof Error) {
        log.error('Mission failed: ' + e.message)
        process.exit(EXIT_TASK_FAILED)
      }
      else {
        log.error('Checkin failed: unknown error')
        log.error(e)
        process.exit(EXIT_CODE_UNKNOWN_ERROR)
      }
    }
  }
}

main()
