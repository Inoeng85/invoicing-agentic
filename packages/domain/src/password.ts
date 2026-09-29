import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scryptAsync = promisify(scrypt)

export async function hashPassword(password: string): Promise<string> {
  let salt = randomBytes(16).toString('hex')
  let derived = (await scryptAsync(password, salt, 64)) as Buffer
  return `${salt}:${derived.toString('hex')}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  let [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  let derived = (await scryptAsync(password, salt, 64)) as Buffer
  let expected = Buffer.from(hash, 'hex')
  if (derived.length !== expected.length) return false
  return timingSafeEqual(derived, expected)
}
