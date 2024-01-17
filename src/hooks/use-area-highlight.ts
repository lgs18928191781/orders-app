export function useAreaHighlight() {
  type Area = 'askOrdersList' | 'bidOrdersList'
  function highlight(area: Area) {
    const areaEl = document.getElementById(area)

    if (areaEl) {
      areaEl.classList.add('bg-amber-300/10')
      setTimeout(() => {
        areaEl.classList.add('transition-all')
        areaEl.classList.add('duration-1000')
      }, 10)

      setTimeout(() => {
        areaEl.classList.remove('bg-amber-300/10')
      }, 2000)
      setTimeout(() => {
        areaEl.classList.remove('transition-all')
        areaEl.classList.remove('duration-1000')
      }, 3000)
    }
  }

  return {
    highlight,
  }
}
