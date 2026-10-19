// Password hashing with scrypt from Node's standard library (no extra packages needed).
import crypto from "node:crypto";

const PARAMS = {N: 16384, r: 8, p: 1, keylen: 64};

function derive(password, salt, params) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, params.keylen, {N: params.N, r: params.r, p: params.p, maxmem: 64 * 1024 * 1024}, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });
}

export async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const key = await derive(password, salt, PARAMS);
  return ["scrypt", PARAMS.N, PARAMS.r, PARAMS.p, salt.toString("base64"), key.toString("base64")].join("$");
}

export async function verifyPassword(password, stored) {
  const parts = String(stored || "").split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const params = {N: Number(parts[1]), r: Number(parts[2]), p: Number(parts[3]), keylen: 64};
  const expected = Buffer.from(parts[5], "base64");
  const actual = await derive(password, Buffer.from(parts[4], "base64"), {...params, keylen: expected.length});
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

// Used to spend the same time on unknown emails as on real ones, so login timing does not reveal accounts.
export const DUMMY_HASH = await hashPassword(crypto.randomBytes(12).toString("hex"));

export const sha256 = value => crypto.createHash("sha256").update(value).digest("hex");
export const newToken = () => crypto.randomBytes(32).toString("base64url");
