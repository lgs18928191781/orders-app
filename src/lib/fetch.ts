async function fetchWrapper(url: string, options?: RequestInit): Promise<any> {
  const response = await fetch(url, options)
  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${url}: ${response.status} ${response.statusText}`
    )
  }
  return await response.json()
}

export default fetchWrapper

export async function ordersApiFetch(url: string, options?: RequestInit) {
  const ordersApiUrl = `https://api.ordbook.io/book/brc20/${url}`

  const jsoned: {
    code: number
    message: string
    data: any
  } = await fetchWrapper(ordersApiUrl, options)

  if (jsoned.code === 1) {
    throw new Error(jsoned.message)
  }

  return jsoned.data
}
