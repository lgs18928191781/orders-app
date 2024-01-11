import Decimal from 'decimal.js'

export default class SwapAlgo {
  public FEE_FACTOR: number = 10000
  public MIN_TOKEN1_FEE: number = 500
  static instance: SwapAlgo

  constructor() {
    if (SwapAlgo.instance) {
      return SwapAlgo.instance
    }
    SwapAlgo.instance = this
  }

  // count token2 and lp token amount with fixed token1 amount when add liquidity
  public countLpAddAmount(
    token1AddAmount: number,
    swapToken1Amount: number,
    swapToken2Amount: number,
    swapLpTokenAmount: number
  ) {
    token1AddAmount = token1AddAmount
    swapToken1Amount = swapToken1Amount
    swapToken2Amount = swapToken2Amount
    swapLpTokenAmount = swapLpTokenAmount
    let lpMinted = 0
    let token2AddAmount = 0
    if (swapLpTokenAmount > 0) {
      lpMinted = (token1AddAmount * swapLpTokenAmount) / swapToken1Amount
      token2AddAmount = (token1AddAmount * swapToken2Amount) / swapToken1Amount
    } else {
      lpMinted = token1AddAmount
    }
    return {
      lpMinted,
      token2AddAmount,
    }
  }

  // count token1 and lp token amount with fixed token2 amount when add liquidity
  public countLpAddAmountWithToken2(
    token2AddAmount: number,
    swapToken1Amount: number,
    swapToken2Amount: number,
    swapLpTokenAmount: number
  ) {
    token2AddAmount = token2AddAmount
    swapToken1Amount = swapToken1Amount
    swapToken2Amount = swapToken2Amount
    swapLpTokenAmount = swapLpTokenAmount
    let lpMinted = 0
    let token1AddAmount = 0
    if (swapLpTokenAmount > 0) {
      token1AddAmount = (token2AddAmount * swapToken1Amount) / swapToken2Amount
      lpMinted = (token1AddAmount * swapLpTokenAmount) / swapToken1Amount
    } else {
      lpMinted = 0
    }
    return {
      lpMinted,
      token1AddAmount,
    }
  }

  // count token1 and token2 amount when remove liquidity
  public countLpRemoveAmount(
    lpTokenRemoveAmount: number,
    swapToken1Amount: number,
    swapToken2Amount: number,
    swapLpTokenAmount: number
  ) {
    lpTokenRemoveAmount = lpTokenRemoveAmount
    swapToken1Amount = swapToken1Amount
    swapToken2Amount = swapToken2Amount
    swapLpTokenAmount = swapLpTokenAmount
    const token1RemoveAmount =
      (lpTokenRemoveAmount * swapToken1Amount) / swapLpTokenAmount
    const token2RemoveAmount =
      (lpTokenRemoveAmount * swapToken2Amount) / swapLpTokenAmount
    return {
      token1RemoveAmount,
      token2RemoveAmount,
    }
  }

  // count token2 amount when swap token1 to token2
  public swapToken1ToToken2(
    token1AddAmount: number,
    swapToken1Amount: number,
    swapToken2Amount: number,
    swapFeeRate: number,
    projFeeRate: number,
    minProjFee: number = this.MIN_TOKEN1_FEE
  ) {
    token1AddAmount = token1AddAmount
    swapToken1Amount = swapToken1Amount
    swapToken2Amount = swapToken2Amount

    const token2RemoveAmount =
      (token1AddAmount * (this.FEE_FACTOR - swapFeeRate) * swapToken2Amount) /
      ((swapToken1Amount + token1AddAmount) * this.FEE_FACTOR)

    return {
      token2RemoveAmount,
    }
  }

  // count token1 amount with expected token2 amount when swap token1 to token2
  public swapToken1ToToken2ByToken2(
    token2RemoveAmount: number,
    swapToken1Amount: number,
    swapToken2Amount: number,
    swapFeeRate: number,
    projFeeRate: number,
    minProjFee: number = this.MIN_TOKEN1_FEE
  ) {
    token2RemoveAmount = token2RemoveAmount
    swapToken1Amount = swapToken1Amount
    swapToken2Amount = swapToken2Amount

    const token1AddAmount =
      (token2RemoveAmount * this.FEE_FACTOR * swapToken1Amount) /
      ((this.FEE_FACTOR - swapFeeRate) * swapToken2Amount -
        token2RemoveAmount * this.FEE_FACTOR)

    return {
      token1AddAmount,
    }
  }

  // count token1 amount when swap token2 to token1
  public swapToken2ToToken1(
    token2AddAmount: number,
    swapToken1Amount: number,
    swapToken2Amount: number,
    swapFeeRate: number,
    projFeeRate: number,
    minProjFee: number = this.MIN_TOKEN1_FEE
  ) {
    token2AddAmount = token2AddAmount
    swapToken1Amount = swapToken1Amount
    swapToken2Amount = swapToken2Amount
    const token1RemoveAmount =
      (token2AddAmount * (this.FEE_FACTOR - swapFeeRate) * swapToken1Amount) /
      ((swapToken2Amount + token2AddAmount) * this.FEE_FACTOR)

    return {
      token1RemoveAmount,
    }
  }

  // count token2 amount with expected token1 amount when swap token2 to token1
  public swapToken2ToToken1ByToken1(
    token1RemoveAmount: number,
    swapToken1Amount: number,
    swapToken2Amount: number,
    swapFeeRate: number,
    projFeeRate: number,
    minProjFee: number = this.MIN_TOKEN1_FEE
  ) {
    token1RemoveAmount = token1RemoveAmount
    swapToken1Amount = swapToken1Amount
    swapToken2Amount = swapToken2Amount

    const token2AddAmount =
      (token1RemoveAmount * this.FEE_FACTOR * swapToken2Amount) /
      ((this.FEE_FACTOR - swapFeeRate) * swapToken1Amount -
        token1RemoveAmount * this.FEE_FACTOR)

    return {
      token2AddAmount,
    }
  }

  public tokenPriceImpact(
    token1: tokenInfo,
    token2: tokenInfo,
    originAddAmount: number,
    aimAddAmount: number,
    pairData: pairInfo,
    dirForward: boolean = false
  ) {
    const { swapToken1Amount, swapToken2Amount } = pairData

    let amount1 = dirForward ? swapToken1Amount : swapToken2Amount
    let amount2 = dirForward ? swapToken2Amount : swapToken1Amount
    let decimal1 = dirForward ? token1.decimal : token2.decimal
    let decimal2 = dirForward ? token2.decimal : token1.decimal

    const p = new Decimal(amount1).div(amount2)
    const p1 = new Decimal(
      new Decimal(amount1).sub(new Decimal(aimAddAmount).mul(10 ** decimal1))
    ).div(
      new Decimal(amount2).add(new Decimal(originAddAmount).mul(10 ** decimal2))
    )
    const q = new Decimal(amount2).div(amount1)
    const q1 = new Decimal(
      new Decimal(amount2).add(new Decimal(originAddAmount).mul(10 ** decimal2))
    ).div(
      new Decimal(amount1).sub(new Decimal(aimAddAmount).mul(10 ** decimal1))
    )
    return {
      slip1: new Decimal(p1).sub(p).div(p).mul(100).toNumber().toFixed(2) + '%',
      slip2: new Decimal(q1).sub(q).div(q).mul(100).toNumber().toFixed(2) + '%',
    }
  }
}
