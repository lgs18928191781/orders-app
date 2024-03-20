import { ElMessage } from 'element-plus'
import { useBtcJsStore } from '@/stores/btcjs'
import { Buffer } from 'buffer'

// Add into life circle

function checkMetalet() {
  if (!window.metaidwallet) {
    ElMessage.warning('Please install the Metalet wallet extension first.')
    throw new Error('Please install the Metalet wallet extension first.')
  }
}

function checkMetaletStatus(res: any, actionName: string) {
  if (res?.status) {
    throw new Error(`Metalet ${actionName} status: ${res?.status}`)
  }
  return res
}

export const connect: () => Promise<connectRes> = async () => {
  checkMetalet()
  const connetRes = await window.metaidwallet.btc.connect()
  return checkMetaletStatus(connetRes, 'connect')
}

export const getMvcAddress = async () => {
  checkMetalet()
  const addressRes = await window.metaidwallet.getAddress()
  const address = checkMetaletStatus(addressRes, 'get address')
  return address
}

export const signMvcMessage = async (Message: { message: string }) => {
  checkMetalet()
  const { message } = Message
  const { signature } = await window.metaidwallet.signMessage({
    message: message,
  })
  const buffer = Buffer.from(signature.signature, 'hex')
  const base64 = buffer.toString('base64')

  return base64
}

export const getMvcPublickey = async () => {
  checkMetalet()
  const MvcPubkey = await window.metaidwallet.getPublicKey()
  const publickey = checkMetaletStatus(MvcPubkey, 'get mvc publickey')
  return publickey
}

export const getAddress = async () => {
  checkMetalet()
  const addressRes = await window.metaidwallet.btc.getAddress()
  const address = checkMetaletStatus(addressRes, 'get address')

  if (address) {
    if (
      address.startsWith('1') ||
      address.startsWith('m') ||
      address.startsWith('n')
    ) {
      ElMessage.error('Please use a SegWit address')
      throw new Error('Please use a SegWit address')
    }
  }

  return address
}

export function initPsbt() {
  const bitcoinJs = useBtcJsStore().get!
  return new bitcoinJs.Psbt()
}

export function finishPsbt<T>(psbt: T): T {
  return psbt
}

export const getPubKey = async () => {
  checkMetalet()
  const pubKeyRes = await window.metaidwallet.btc.getPublicKey()
  return checkMetaletStatus(pubKeyRes, 'get public key')
}

interface connectRes {
  address: string
  pubKey: string
}

export const disconnect = async () => {}

export const getBalance = async () => {
  checkMetalet()

  return await window.metaidwallet.btc
    .getBalance('btc')
    .then((info: { total: number }) => info.total)
}

export const inscribe = async (tick: string): Promise<string> => {
  checkMetalet()

  return await window.metaidwallet.btc.inscribeTransfer(tick)
}

export const signPsbt = async (
  psbtHex: string,
  options?: any
): Promise<string> => {
  checkMetalet()

  return await window.metaidwallet.btc.signPsbt({ psbtHex, options })
}

export const signPsbts = async (
  psbtHexs: string[],
  options?: any[]
): Promise<string[]> => {
  checkMetalet()

  return await window.metaidwallet.btc.signPsbts(psbtHexs, options)
}

export const pushPsbt = async (psbtHex: string): Promise<string> => {
  checkMetalet()

  return await window.metaidwallet.btc.pushPsbt(psbtHex)
}

export const signMessage = async (message: string): Promise<string> => {
  checkMetalet()
  const messageBase64 = await window.metaidwallet.btc.signMessage(message)
  return checkMetaletStatus(messageBase64, 'get signature')
}
