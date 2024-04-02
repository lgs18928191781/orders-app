import BigNumber from 'bignumber.js'

export const FEE_FACTOR = 10000
export const MINAMOUNT = 1000
export const formatAmount = (value: any, n = 4) => {
  if (!value) return 0

  const arr = value.toString().split('.')
  if (value.toString().indexOf('e') > -1 || (arr[1] && arr[1].length > n)) {
    return BigNumber(value).toFixed(n)
  }
  if (typeof value === 'object') return value.toFixed(n)
  return value
}
export const formatTok = (value, dec = 8, str = true) => {
  if (!value) return 0
  const v = BigNumber(value).multipliedBy(Math.pow(10, dec))
  return str ? v.toFixed(0) : v
}
type Params = {
  tokenIn: MS.Token
  tokenOut: MS.Token
  dirForward: boolean
  originAddAmount: number
  pairData: MS.Pair
}
export const calcAmount = ({
  tokenIn,
  tokenOut,
  dirForward,
  originAddAmount = 0,
  pairData,
}: Params) => {
  const { swapToken1Amount, swapToken2Amount, swapFeeRate } = pairData
  let amount1 = dirForward ? swapToken1Amount : swapToken2Amount
  let amount2 = dirForward ? swapToken2Amount : swapToken1Amount
  let decimal1 = dirForward ? pairData.token1.decimal : pairData.token2.decimal
  let decimal2 = dirForward ? pairData.token2.decimal : pairData.token1.decimal

  let _originAddAmount: any = formatTok(originAddAmount, decimal1, false)

  let newAmount1 = BigNumber(amount1 || 0),
    newAmount2 = BigNumber(amount2 || 0)
  let newOriginAddAmount, newAimAddAmount, fee
  if (originAddAmount > 0) {
    _originAddAmount = BigInt(_originAddAmount.toFixed(0))
    const addAmountWithFee =
      _originAddAmount * BigInt(FEE_FACTOR - (swapFeeRate || 0))
    newAmount1 = BigInt(amount1) + _originAddAmount
    let removeAmount =
      (addAmountWithFee * BigInt(amount2)) /
      ((BigInt(amount1) + _originAddAmount) * BigInt(FEE_FACTOR))
    removeAmount = BigNumber(removeAmount)
    newAmount2 = BigNumber(amount2).minus(removeAmount)

    removeAmount = formatAmount(
      removeAmount.div(Math.pow(10, decimal2)),
      decimal2,
    )

    newOriginAddAmount = originAddAmount
    newAimAddAmount = removeAmount
  }
  // console.log('dirForward:', dirForward, 'amount1:', amount1, 'amount2:', amount2, 'newAmount1:', newAmount1.toString(), 'newAmount2:', newAmount2.toString());
  const p = BigNumber(amount2).dividedBy(amount1)
  const p1 = newAmount2.dividedBy(newAmount1)
  const slip = p1.minus(p).dividedBy(p)

  const np = BigNumber(amount1).dividedBy(amount2)
  const np1 = BigNumber(newAmount1).dividedBy(newAmount2)
  const slip1 = np1.minus(np).dividedBy(np)

  return {
    newOriginAddAmount,
    newAimAddAmount,
    slip: slip.multipliedBy(100).toFixed(2).toString() + '%',
    slip1: slip1.multipliedBy(100).toFixed(2).toString() + '%',
    fee,
  }
}

type Params2 = {
  token1AddAmount: string | bigint
  swapToken1Amount: string | bigint
  swapToken2Amount: string | bigint
  swapLpTokenAmount: string | bigint
}
export const countLpAddAmount = ({
  token1AddAmount,
  swapToken1Amount,
  swapToken2Amount,
  swapLpTokenAmount,
}: Params2) => {
  token1AddAmount = BigInt(token1AddAmount)
  swapToken1Amount = BigInt(swapToken1Amount)
  swapToken2Amount = BigInt(swapToken2Amount)
  swapLpTokenAmount = BigInt(swapLpTokenAmount)
  let lpMinted = BigInt(0)
  let token2AddAmount = BigInt(0)
  if (swapLpTokenAmount > BigInt(0)) {
    lpMinted = (token1AddAmount * swapLpTokenAmount) / swapToken1Amount
    token2AddAmount = (token1AddAmount * swapToken2Amount) / swapToken1Amount
  } else {
    lpMinted = token1AddAmount
  }
  return [lpMinted, token2AddAmount]
}

type Params3 = {
  token2AddAmount: string | bigint
  swapToken1Amount: string | bigint
  swapToken2Amount: string | bigint
  swapLpTokenAmount: string | bigint
}
export const countLpAddAmountWithToken2 = ({
  token2AddAmount,
  swapToken1Amount,
  swapToken2Amount,
  swapLpTokenAmount,
}: Params3) => {
  token2AddAmount = BigInt(token2AddAmount)
  swapToken1Amount = BigInt(swapToken1Amount)
  swapToken2Amount = BigInt(swapToken2Amount)
  swapLpTokenAmount = BigInt(swapLpTokenAmount)
  let lpMinted = BigInt(0)
  let token1AddAmount = BigInt(0)
  if (swapLpTokenAmount > BigInt(0)) {
    token1AddAmount = (token2AddAmount * swapToken1Amount) / swapToken2Amount
    lpMinted = (token1AddAmount * swapLpTokenAmount) / swapToken1Amount
  }
  return [lpMinted, token1AddAmount]
}

export function LeastFee(txFee:number, balance:string) {
  let needLeastAmount = BigNumber(txFee).plus(100000).div(Math.pow(10, 8));
  
  if (needLeastAmount.isGreaterThan(balance)) {
    return {
      code: 1,
      msg: `Need ${needLeastAmount.toString()}Space, You have ${balance}`,
    };
  }
  return {
    code: 0,
  };
}
