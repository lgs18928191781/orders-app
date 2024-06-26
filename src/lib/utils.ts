import { type ClassValue, clsx } from 'clsx'
import Decimal from 'decimal.js'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatSat(tokenValue: number, tokenDecimal: number) {
  return new Decimal(tokenValue).mul(10 ** tokenDecimal).toNumber()
}

export function formatTok(
  tokenValue: number,
  tokenDecimal: number,
  fomat?: number
) {
  if (fomat) {
    return removeTrailingZeros(
      new Decimal(tokenValue)
        .div(10 ** tokenDecimal)
        .toNumber()
        .toFixed(fomat)
    )
  } else {
    return new Decimal(tokenValue).div(10 ** tokenDecimal).toNumber()
  }
}

function removeTrailingZeros(value: string) {
  const regex = /\.?0+$/
  const result = value.replace(regex, '')

  return result
}
