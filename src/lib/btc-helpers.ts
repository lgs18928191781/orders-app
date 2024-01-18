import { Buffer } from 'buffer'
import * as ecc from 'tiny-secp256k1'
import { type Psbt } from 'bitcoinjs-lib'

import { useBtcJsStore } from '@/stores/btcjs'
import { useConnectionStore } from '@/stores/connection'

export function createValidator() {
  const ECPair = useBtcJsStore().ECPair

  if (!ECPair) throw new Error('ECPair is not set!')

  const legacyValidator = (
    pubkey: Buffer,
    msghash: Buffer,
    signature: Buffer
  ): boolean => ECPair.fromPublicKey(pubkey).verify(msghash, signature)

  const schnorrValidator = (
    pubkey: Buffer,
    msghash: Buffer,
    signature: Buffer
  ): boolean => ecc.verifySchnorr(msghash, pubkey, signature)

  // determine which validator to use
  const isTaproot = useConnectionStore().isTaproot
  console.log(
    '🚀 ~ file: btc-helpers.ts:27 ~ createValidator ~ isTaproot:',
    isTaproot
  )

  return isTaproot ? schnorrValidator : legacyValidator
}

export function validatePsbt({ psbt, type }: { psbt: Psbt; type: 'ask' }) {
  const validator = createValidator()

  if (type === 'ask') {
    // validate the first input;
    // if taproot, tweak pubkey and validate
    let pubkey
    if (useConnectionStore().isTaproot) {
      // pubkey = toXOnly(Buffer.from(useConnectionStore().getPubKey, 'hex'))
      pubkey = Buffer.from(useConnectionStore().getPubKey, 'hex')
    }
    return psbt.validateSignaturesOfInput(0, validator)
  }
}

export function toXOnly(pubKey: Buffer) {
  return pubKey.length === 32 ? pubKey : pubKey.slice(1, 33)
}

class BtcHelpers {
  private btcjs
  private ECPair

  constructor() {
    const btcJsStore = useBtcJsStore()
    this.btcjs = btcJsStore.get!
    this.ECPair = btcJsStore.ECPair!
  }

  public createValidator() {
    const validator = (
      pubkey: Buffer,
      msghash: Buffer,
      signature: Buffer
    ): boolean => this.ECPair.fromPublicKey(pubkey).verify(msghash, signature)

    return validator
  }

  public fromPubKey(pubKey: string): any {
    return this.ECPair.fromPublicKey(Buffer.from(pubKey, 'hex'))
  }

  public tapTweakHash(pubKey: Buffer, h: Buffer | undefined): Buffer {
    return this.btcjs.crypto.taggedHash(
      'TapTweak',
      Buffer.concat(h ? [pubKey, h] : [pubKey])
    )
  }

  public tweakSigner(signer: any, opts: any = {}): any {
    let privateKey: Uint8Array | undefined = signer.privateKey!
    if (!privateKey) {
      throw new Error('Private key is required for tweaking signer!')
    }
    if (signer.publicKey[0] === 3) {
      privateKey = ecc.privateNegate(privateKey)
    }

    const tweakedPrivateKey = ecc.privateAdd(
      privateKey,
      this.tapTweakHash(toXOnly(signer.publicKey), opts.tweakHash)
    )
    if (!tweakedPrivateKey) {
      throw new Error('Invalid tweaked private key!')
    }

    return this.ECPair.fromPrivateKey(Buffer.from(tweakedPrivateKey), {
      network: opts.network,
    })
  }

  public tweakPubKey(pubKey: Buffer): Buffer {
    return pubKey.slice(1, 33)
  }

  public validate(signed: Psbt, indexes?: number[], pubKey?: Buffer) {
    const validator = (
      pubkey: Buffer,
      msghash: Buffer,
      signature: Buffer
    ): boolean => this.ECPair.fromPublicKey(pubkey).verify(msghash, signature)

    if (indexes) {
      return indexes.every((index) => {
        if (pubKey) {
          return signed.validateSignaturesOfInput(index, validator, pubKey)
        }

        return signed.validateSignaturesOfInput(index, validator)
      })
    }

    return signed.validateSignaturesOfAllInputs(validator)
  }
}

export default BtcHelpers
