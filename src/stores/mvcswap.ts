import { queryAllPairs, queryIcons, queryPairInfo } from '@/queries/mvcswap'
import { formatSat } from '@/utils'
import { defineStore } from 'pinia'
const getMvcBalance = async () => {
  try {
    const res = await window.metaidwallet.getBalance()
    return formatSat(res.total)
    //return formatSat(0);
  } catch (err) {
    return formatSat(0)
  }
}

const getTokenBalance = async () => {
  const res = await window.metaidwallet.token.getBalance()
  const userBalance: Record<string, string> = {}
  res.forEach((item) => {
    const balance =
      BigInt(item.confirmedString) + BigInt(item.unconfirmedString)
    userBalance[item.genesis] = formatSat(balance.toString(), item.decimal)
  })
  return userBalance
}
export const useMVCSwapStore = defineStore('mvcswap', {
  state: () => {
    return {
      pairs: [] as MS.Pair[],
      curPair: undefined as MS.Pair | undefined,
      userBalance: {} as Record<string, string>,
      loading: true as boolean,
      icons: [] as MS.Icon[],
    }
  },
  actions: {
    async fetchPairs() {
      const ret = await queryAllPairs()
      if (ret.code === 0) {
        let _pairs = []
        for (let pairName in ret.data) {
          _pairs.push({ pairName, ...ret.data[pairName] })
        }
        this.pairs = _pairs // Object.values(ret.data)
        if (!this.curPair) {
          this.curPair = this.pairs[0]
          await this.fetchPairInfo()
        }
      }
    },
    async fetchIcons() {
      const ret = await queryIcons()
      if (ret.data) {
        this.icons = ret.data
      }
    },
    async fetchPairInfo() {
      if (!this.curPair) return
    
      const ret = await queryPairInfo(this.curPair.lptoken.tokenID)
      if (ret.code === 0) {
        this.curPair = {
          ...this.curPair,
          ...ret.data,
          token1: {
            ...ret.data.token1,
            symbol: ret.data.token1.symbol.toUpperCase(),
          },
          token2: {
            ...ret.data.token2,
            symbol: ret.data.token2.symbol.toUpperCase(),
          },
        }
      }
      this.loading = false
    },
    async fetchBalance() {
      const mvcBal = await getMvcBalance()
      const tokenBal = await getTokenBalance()
      this.userBalance = {
        space: mvcBal,
        ...tokenBal,
      }
    },
    setCurPair(pair: MS.Pair) {
      this.curPair = pair
      this.loading = true
      this.fetchPairInfo()
    },
  },
})
