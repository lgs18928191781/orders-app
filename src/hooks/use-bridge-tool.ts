import { type Ref, computed, ref } from 'vue'
import {
  getAssetPairList,
  createPrepayOrderMintBtcReq,
  submitPrepayOrderMintBtcReq,
} from '@/queries/bridge-api'
export function useBridgeTools() {
  // const mintAmount = 100000 //100000

  function confirmNumberBySeqAndAmount(
    amount: number,
    seq: number[][],
    network: 'BTC' | 'BRC20' | 'MVC'
  ) {
    for (const item of seq) {
      const [start, end, confirmBtc, confirmMvc] = item
      if (end) {
        if (start <= amount && amount <= end) {
          if (network === 'MVC') {
            return confirmMvc
          } else {
            return confirmBtc
          }
        }
      } else {
        if (start <= amount) {
          if (network === 'MVC') {
            return confirmMvc
          } else {
            return confirmBtc
          }
        }
      }
    }
    return 5
  }

  async function createPrepayOrderMintBtc(data: any) {
    const res = await createPrepayOrderMintBtcReq(data)

    return res.data.data
  }

  async function submitPrepayOrderMintBtc(data: any) {
    const res = await submitPrepayOrderMintBtcReq(data)

    return res.data
  }

  function calcReceiveInfo(mintAmount: number, assetInfo: any) {
    const {
      btcPrice,
      mvcPrice,
      feeBtc,
      feeMvc,
      amountLimitMaximum,
      amountLimitMinimum,
      confirmSequence,
      transactionSize,
      assetList,
    } = assetInfo
    console.log('assetInfo', assetInfo)

    if (mintAmount < amountLimitMinimum || mintAmount > amountLimitMaximum) {
      const error = JSON.stringify({
        amountLimitMinimum,
        amountLimitMaximum,
      })
      throw Error(error)
    }

    const confirmNumber = confirmNumberBySeqAndAmount(
      mintAmount,
      confirmSequence,
      // mint btc -> mvc, get mvc confirm number
      'BTC'
    )
    const btcAsset = assetList[0]
    let bridgeFee: number = 0
    let minerFee: number = 0
    if (btcAsset.feeRateNumeratorMint > 0 || btcAsset.feeRateConstMint > 0) {
      bridgeFee =
        (mintAmount * btcAsset.feeRateNumeratorMint) / 10000 +
        btcAsset.feeRateConstMint
      minerFee = (transactionSize.BTC_MINT * feeMvc * mvcPrice) / btcPrice
    }
    const totalFee = Math.floor(bridgeFee + minerFee)
    const receiveAmount = mintAmount - totalFee
    return {
      receiveAmount,
      confirmNumber,
    }
  }

  return {
    calcReceiveInfo,
  }
}
