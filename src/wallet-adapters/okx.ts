import { ElMessage } from 'element-plus'
import { type Psbt } from 'bitcoinjs-lib'

import { fetchBalance } from '@/queries/proxy'
import { useBtcJsStore } from '@/stores/btcjs'
import { useConnectionStore } from '@/stores/connection'
import {
  generateRandomString,
  isMobile,
  isUnsupportedAddress,
  log,
  raise,
} from '@/lib/helpers'
import {
  OKX_TEMPLATE_PSBT,
  SIGHASH_SINGLE_ANYONECANPAY,
} from '@/data/constants'

function checkOkx() {
  if (!window.okxwallet) {
    ElMessage.warning('Please install the Okx wallet extension first.')
    throw new Error('Please install the Okx wallet extension first.')
  }
}

export function initPsbt() {
  const bitcoinJs = useBtcJsStore().get!

  // use templatePsbt otherwise for okx
  // return bitcoinJs.Psbt.fromHex(OKX_TEMPLATE_PSBT)
  return new bitcoinJs.Psbt()
}

export const getMvcAddress = async () => {
  return 'undefined'
}

export const signMvcMessage = async (Message: { message: string }) => {
  return 'undefined'
}

export const getMvcPublickey = async () => {
  return 'undefined'
}

export function finishPsbt(psbtStr: string): string {
  return psbtStr
  const btcjs = useBtcJsStore().get ?? raise('btcjs not initialized')

  const psbtObj = btcjs.Psbt.fromHex(psbtStr)

  console.log({ before: psbtObj })
  // finalize psbt
  try {
    psbtObj.finalizeAllInputs()
  } catch (err) {
    console.error(err)
  }
  console.log({ after: psbtObj })

  // return psbt
  // const rebuild = (original: Psbt) => {
  //   const rebuilt = new btcjs.Psbt()
  //   rebuilt.setVersion(original.version)
  //   rebuilt.setLocktime(original.locktime)

  //   const useIndex = 2
  //   const input: any = {
  //     hash: original.txInputs[useIndex].hash,
  //     index: original.txInputs[useIndex].index,
  //   }
  //   if (original.data.inputs[useIndex].witnessUtxo) {
  //     input.witnessUtxo = original.data.inputs[useIndex].witnessUtxo
  //   }
  //   if (original.data.inputs[useIndex].nonWitnessUtxo) {
  //     input.nonWitnessUtxo = original.data.inputs[useIndex].nonWitnessUtxo
  //   }
  //   if (original.data.inputs[useIndex].partialSig) {
  //     input.partialSig = original.data.inputs[useIndex].partialSig
  //   }
  //   if (original.data.inputs[useIndex].finalScriptWitness) {
  //     input.finalScriptWitness =
  //       original.data.inputs[useIndex].finalScriptWitness
  //   }
  //   rebuilt.addInput(input)
  //   rebuilt.addOutput(original.txOutputs[useIndex])

  //   return rebuilt
  // }

  // const psbtObj = btcjs.Psbt.fromHex(psbt)

  // return rebuild(psbtObj).toHex()
}

export const getAddress = async () => {
  if (!window.okxwallet) {
    return ''
  }

  const account: {
    address: string
    publicKey: string
  } = await window.okxwallet.bitcoin.connect()

  if (!account) return ''

  const address = account.address
  if (isUnsupportedAddress(address)) {
    // await window.okxwallet.bitcoin.disconnect()

    ElMessage.error(
      'Please use a native SegWit or Taproot address (Starts with bc1)',
    )
    throw new Error(
      'Please use a native SegWit or Taproot address (Starts with bc1)',
    )
  }

  return address
}

export const getPubKey = async () => {
  if (!window.unisat) {
    return ''
  }

  return await window.okxwallet.bitcoin.getPublicKey()
}

export const connect: () => Promise<{
  address: string
  pubKey: string
}> = async () => {
  const account: {
    address: string
    publicKey: string
    compressedPublicKey: string
  } = await window.okxwallet.bitcoin.connect()
  if (account) {
    const address = account.address
    // if it's a legacy address(1... or m..., n...), throw error
    if (isUnsupportedAddress(address)) {
      // await window.okxwallet.bitcoin.disconnect()

      throw new Error(
        'Please use a native SegWit or Taproot address (Starts with bc1)',
      )
    }

    return {
      address,
      pubKey: account.compressedPublicKey || account.publicKey,
    }
  }

  return {
    address: '',
    pubKey: '',
  }
}

export const disconnect = async () => {
  await window.okxwallet.bitcoin.disconnect()
}

export const getBalance = async () => {
  checkOkx()

  const address = useConnectionStore().getAddress

  const balance: number = await fetchBalance(address).then(
    (balanceInfo) =>
      Math.round(balanceInfo.confirmed) + Math.round(balanceInfo.unconfirmed),
  )
  return balance
}

export const inscribe = async (tick: string) => {
  checkOkx()
  if (isMobile()) {
    ElMessage.warning('Please inscribe BRC-20 directly in the Okx wallet.')
    return
  }

  const address = useConnectionStore().getAddress

  return await window.okxwallet.bitcoin.inscribe({
    type: 51,
    from: address,
    tick,
  })
}

export const signPsbt = async (psbt: string, options?: any) => {
  checkOkx()

  const signed = await window.okxwallet.bitcoin.signPsbt(psbt, options)

  console.log({ equal: psbt === signed })
  console.log({ signed: useBtcJsStore().get!.Psbt.fromHex(signed) })

  return signed
}

export const signPsbts = async (psbts: string[], options: any[]) => {
  checkOkx()

  const address = useConnectionStore().getAddress
  const signRes = []

  for (const psbt of psbts) {
    const signed = await window.okxwallet.bitcoin.signPsbt(psbt, {
      from: address,
    })
    signRes.push(signed)
  }

  return signRes
}

export const pushPsbt = async (psbt: string): Promise<string> => {
  checkOkx()

  const address = useConnectionStore().getAddress
  const randomId = generateRandomString(8)

  // extract raw tx from psbt
  const bitcoinjs = useBtcJsStore().get!
  const psbtObj = bitcoinjs.Psbt.fromHex(psbt)
  const txHex = psbtObj.extractTransaction().toHex()

  return await window.okxwallet.bitcoin
    .sendPsbt(
      [
        {
          itemId: randomId,
          signedTx: txHex,
          type: 52,
        },
      ],
      address,
    )
    .then((res) => {
      return res[0][randomId]
    })
}

export const signMessage = async (message: string): Promise<string> => {
  return ''
}
