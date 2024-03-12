import { getFiatRate } from '@/queries/orders-api'
import { useQuery } from '@tanstack/vue-query'
import { createGlobalState, useStorage } from '@vueuse/core'
import Decimal from 'decimal.js'

export const useFiat = createGlobalState(() => {
  // state
  const isShowingFiat = useStorage('show-fiat-price', true)

  const useFiatRateQuery = () =>
    useQuery({
      queryKey: ['fiatRate', { coin: 'btc' }],
      queryFn: getFiatRate,
    })

  function getFiatPrice(price: number | string, rate: number): number {
    return new Decimal(price).times(rate).toNumber()
  }

  function getFiatPriceDisplay(
    price: number | string,
    rate: number,
    showFiatSign = true,
  ): string {
    const fiatPrice = new Decimal(price).times(rate)

    // if it's less than 0.0001, use fixed(8)
    if (fiatPrice.lt(0.0001) && fiatPrice.gt(0))
      return `${showFiatSign ? '$' : ''}${fiatPrice.toFixed(8)}`

    // if it's less than 0.01, use fixed(4)
    if (fiatPrice.lt(0.01) && fiatPrice.gt(0))
      return `${showFiatSign ? '$' : ''}${fiatPrice.toFixed(4)}`

    return `${showFiatSign ? '$' : ''}${fiatPrice.toFixed(2)}`
  }

  return {
    isShowingFiat,
    useFiatRateQuery,
    getFiatPrice,
    getFiatPriceDisplay,
  }
})
