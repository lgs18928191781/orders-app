import { sleep } from '@/lib/helpers'

export function useScrollOrdersArea() {
  function scroll() {
    sleep(100).then(() => {
      const scrollElement = document.getElementById('askOrders')
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight
      }
    })
  }

  return {
    scroll,
  }
}
