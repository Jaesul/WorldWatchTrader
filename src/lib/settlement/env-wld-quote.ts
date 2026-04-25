const WLD_DECIMALS = 18;
const USD_PER_WLD_DECIMALS = 9;

function pow10(exp: number): bigint {
  let r = BigInt(1);
  const ten = BigInt(10);
  for (let i = 0; i < exp; i++) {
    r *= ten;
  }
  return r;
}

/**
 * Parses `DM_SETTLEMENT_USD_PER_WLD` as "USD per 1 WLD" (e.g. `2.5` => $2.50 per WLD).
 * Returns a fixed-point bigint: value * 10^9 (nine decimal places of USD per WLD).
 */
export function parseUsdPerWldScaledFromEnv(raw: string | undefined): { ok: true; scaled: bigint } | { ok: false } {
  const s = raw?.trim();
  if (!s) return { ok: false };
  const m = /^(\d+)(?:\.(\d+))?$/.exec(s);
  if (!m) return { ok: false };
  const whole = m[1] ?? '0';
  let frac = (m[2] ?? '').replace(/\D/g, '');
  if (frac.length > 9) frac = frac.slice(0, 9);
  frac = (frac + '000000000').slice(0, 9);
  const scaled = BigInt(whole) * pow10(USD_PER_WLD_DECIMALS) + BigInt(frac || '0');
  if (scaled <= BigInt(0)) return { ok: false };
  return { ok: true, scaled };
}

/**
 * `priceUsd` is whole USD from the transaction request. Converts to WLD wei using
 * env USD-per-WLD scaled value. Integer math: wldWei = floor(priceUsd * 10^27 / scaled).
 */
export function wldAmountRawFromPriceUsd(
  priceUsd: number,
  usdPerWldScaled: bigint,
): { amountRaw: bigint; rateSnapshot: string } {
  const usd = BigInt(Math.max(0, Math.floor(priceUsd)));
  const exp = USD_PER_WLD_DECIMALS + WLD_DECIMALS;
  const wldWei = (usd * pow10(exp)) / usdPerWldScaled;
  const amountRaw = wldWei > BigInt(0) ? wldWei : BigInt(1);
  const rateSnapshot = formatScaledUsdPerWld(usdPerWldScaled);
  return { amountRaw, rateSnapshot };
}

function formatScaledUsdPerWld(scaled: bigint): string {
  const divisor = pow10(USD_PER_WLD_DECIMALS);
  const whole = scaled / divisor;
  const frac = scaled % divisor;
  const fracStr = frac
    .toString()
    .padStart(USD_PER_WLD_DECIMALS, '0')
    .replace(/0+$/, '');
  return fracStr.length > 0 ? `${whole.toString()}.${fracStr}` : whole.toString();
}

export function readDmSettlementUsdPerWldFromEnv(): string | undefined {
  return process.env.DM_SETTLEMENT_USD_PER_WLD;
}
