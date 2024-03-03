import { type Ref, computed, ref } from 'vue'
import { createPrepayOrderMintBrc20Req } from '@/queries/bridge-api'
export function useBridgeTools() {
  const mintAmount = 100000

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

  async function createPrepayOrderMintBrc20() {}
}
