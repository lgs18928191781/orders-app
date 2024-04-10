import { type ClassValue, clsx } from 'clsx'
import Decimal from 'decimal.js'
import { twMerge } from 'tailwind-merge'
import { networks } from 'bitcoinjs-lib'

type AddressType = 'p2pkh' | 'p2wpkh' | 'p2tr' | 'p2sh' | 'unknown'

type AddressInfo = {
  type: AddressType
  network: networks.Network
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatSat(tokenValue: number, tokenDecimal: number) {
  return new Decimal(tokenValue).mul(10 ** tokenDecimal).toNumber()
}

export function formatTok(
  tokenValue: number,
  tokenDecimal: number,
  fomat?: number,
) {
  if (fomat) {
    return removeTrailingZeros(
      new Decimal(tokenValue)
        .div(10 ** tokenDecimal)
        .toNumber()
        .toFixed(fomat),
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

export function determineAddressInfo(address: string): AddressInfo {
  const { bitcoin, testnet } = networks

  if (address.startsWith('bc1q')) {
    return {
      type: 'p2wpkh',
      network: bitcoin,
    }
  }
  if (address.startsWith('tb1q')) {
    return {
      type: 'p2wpkh',
      network: testnet,
    }
  }

  if (address.startsWith('bc1p')) {
    return {
      type: 'p2tr',
      network: bitcoin,
    }
  }

  if (address.startsWith('tb1p')) {
    return {
      type: 'p2tr',
      network: testnet,
    }
  }

  if (address.startsWith('1')) {
    return {
      type: 'p2pkh',
      network: bitcoin,
    }
  }
  if (address.startsWith('3') || address.startsWith('2')) {
    return {
      type: 'p2sh',
      network: bitcoin,
    }
  }
  if (address.startsWith('m') || address.startsWith('n')) {
    return {
      type: 'p2pkh',
      network: testnet,
    }
  }

  return {
    type: 'unknown',
    network: bitcoin,
  }
}
