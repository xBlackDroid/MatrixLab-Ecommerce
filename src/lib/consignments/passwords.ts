// Sólo backend/herramientas administrativas; nunca importar desde componentes.
import { randomBytes, scrypt, timingSafeEqual, createHmac } from "node:crypto";
import type { AccessCommand } from "./access";

const derive = (password: string, salt: string) => new Promise<Buffer>((resolve, reject) =>
  scrypt(password, salt, 64, { N: 16384, r: 8, p: 1, maxmem: 32 * 1024 * 1024 }, (error, key) => error ? reject(error) : resolve(key)));
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `scrypt-v1$${salt}$${(await derive(password, salt)).toString("hex")}`;
}
export async function verifyPassword(password: string, digest: string | null | undefined) {
  const valid = /^scrypt-v1\$[a-f0-9]{32}\$[a-f0-9]{128}$/.test(digest ?? "");
  const parts = valid ? digest!.split("$") : ["", "0".repeat(32), "0".repeat(128)];
  // También derivar cuando no hay cuenta: misma respuesta y trabajo de contraseña.
  const actual = await derive(password, parts[1]);
  return timingSafeEqual(actual, Buffer.from(parts[2], "hex")) && valid;
}
export function accessFingerprint(command: AccessCommand, secret: string) {
  if (secret.length < 32) throw new Error("ACCESS_SECRET_REQUIRED");
  // Intención estable aunque scrypt use una sal nueva en cada reintento.
  // En la base sólo se persiste este HMAC, nunca la contraseña del formulario.
  return createHmac("sha256", secret).update(JSON.stringify([
    "consignment-access-v1", command.distributorId, command.action, command.username,
    "password" in command ? command.password : null,
  ])).digest("hex");
}
