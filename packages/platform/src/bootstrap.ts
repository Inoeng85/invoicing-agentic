import { configureEmailFromEnv } from './email.ts'
import { validateEnvAtBoot, type AppTarget } from './env.ts'

export function bootstrapPlatform(target: AppTarget) {
  let env = validateEnvAtBoot(target)
  configureEmailFromEnv(env)
  return env
}
