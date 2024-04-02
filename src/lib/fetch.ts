import { useCredentialsStore } from '@/stores/credentials'

export type ApiOptions = { headers?: HeadersInit } & RequestInit & {
    auth?: boolean
  }

async function fetchWrapper(url: string, options?: RequestInit): Promise<any> {
  const response = await fetch(url, options)
  if (!response.ok) {
    if (response.status === 422 || response.status === 403) {
      const jsoned = await response.json()

      throw new Error(jsoned.message)
    }

    throw new Error(
      `Failed to fetch ${url}: ${response.status} ${response.statusText}`,
    )
  }
  return await response.json()
}

export default fetchWrapper

export async function ordersCommonApiFetch(url: string, options?: ApiOptions) {
  const ordersApiUrl = `https://www.orders.exchange/api-book/common/${url}`
  if (!options)
    options = {
      headers: {
        'Content-Type': 'application/json',
      },
    }

  if (options.headers && 'Content-Type' in options.headers) {
  } else {
    options.headers = { ...options.headers, 'Content-Type': 'application/json' }
  }
  if (options.auth) {
    const credentialsStore = useCredentialsStore()
    const credential = credentialsStore.get
    if (!credential) {
      throw new Error('Please login first.')
    }

    options.headers = {
      ...options.headers,
      'X-Signature': credential.signature,
      'X-Public-Key': credential.publicKey,
    }
  }

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

export async function ordersV2Fetch(url: string, options?: ApiOptions) {
  const ordersApiUrl = `https://www.orders.exchange/api-book/brc20/order-v2/${url}`
  if (!options)
    options = {
      headers: {
        'Content-Type': 'application/json',
      },
    }

  if (options.headers && 'Content-Type' in options.headers) {
  } else {
    options.headers = { ...options.headers, 'Content-Type': 'application/json' }
  }
  if (options.auth) {
    const credentialsStore = useCredentialsStore()
    const credential = credentialsStore.get
    if (!credential) {
      throw new Error('Please login first.')
    }

    options.headers = {
      ...options.headers,
      'X-Signature': credential.signature,
      'X-Public-Key': credential.publicKey,
    }
  }

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

export async function ordersApiFetch(url: string, options?: ApiOptions) {
  const ordersApiUrl = `https://www.orders.exchange/api-book/brc20/${url}`
  if (!options)
    options = {
      headers: {
        'Content-Type': 'application/json',
      },
    }

  if (options.headers && 'Content-Type' in options.headers) {
  } else {
    options.headers = { ...options.headers, 'Content-Type': 'application/json' }
  }
  if (options.auth) {
    const credentialsStore = useCredentialsStore()
    const credential = credentialsStore.get
    if (!credential) {
      throw new Error('Please login first.')
    }

    options.headers = {
      ...options.headers,
      'X-Signature': credential.signature,
      'X-Public-Key': credential.publicKey,
    }
  }

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

export async function swapApiFetch(url: string, options?: ApiOptions) {
  const swapApiUrl = `${import.meta.env.VITE_SWAP_API_HOST}/api/${url}`
  if (!options)
    options = {
      headers: {
        'Content-Type': 'application/json',
      },
    }

  if (options.headers && 'Content-Type' in options.headers) {
  } else {
    options.headers = { ...options.headers, 'Content-Type': 'application/json' }
  }
  if (options.auth) {
    const credentialsStore = useCredentialsStore()
    const credential = credentialsStore.get
    if (!credential) {
      throw new Error('Please login first.')
    }

    options.headers = {
      ...options.headers,
      'X-Signature': credential.signature,
      'X-Public-Key': credential.publicKey,
    }
  }

  const jsoned:
    | {
        status: 'ok'
        data: any
      }
    | {
        status: 'error'
        message: string
      } = await fetchWrapper(swapApiUrl, options)

  if (jsoned.status === 'error') {
    throw new Error(jsoned.message)
  }

  return jsoned.data
}

export async function bridgeApiFetch(
  url: string,
  options?: { headers?: HeadersInit } & RequestInit,
  returnRaw: boolean = false,
) {
  const ordersApiUrl = `https://api.orders.exchange/api-bridge-testnet${url}`
  if (!options)
    options = {
      headers: {
        'Content-Type': 'application/json',
      },
    }

  if (options.headers && 'Content-Type' in options.headers) {
  } else {
    options.headers = { ...options.headers, 'Content-Type': 'application/json' }
  }
  // if (options?.auth) {
  //   const credentialsStore = useCredentialsStore()
  //   const credential = credentialsStore.get
  //   if (!credential) {
  //     throw new Error('Please login first.')
  //   }

  //   options.headers = {
  //     ...options.headers,
  //     'X-Signature': credential.signature,
  //     'X-Public-Key': credential.publicKey,
  //   }
  // }

  const jsoned:
    | {
        status: 'ok'
        data: any
        success?: boolean
      }
    | {
        status: 'error'
        message: string
        success?: boolean
      } = await fetchWrapper(ordersApiUrl, options)

  if (jsoned.status === 'error') {
    throw new Error(jsoned.message)
  }

  return jsoned.data ?? jsoned
}

export async function metasvApiFetch(
  url: string,
  options?: { headers?: HeadersInit } & RequestInit,
  returnRaw: boolean = false,
) {
  const ordersApiUrl = `https://testnet.mvcapi.com${url}`
  if (!options)
    options = {
      headers: {
        'Content-Type': 'application/json',
      },
    }

  if (options.headers && 'Content-Type' in options.headers) {
  } else {
    options.headers = { ...options.headers, 'Content-Type': 'application/json' }
  }
  // if (options?.auth) {
  //   const credentialsStore = useCredentialsStore()
  //   const credential = credentialsStore.get
  //   if (!credential) {
  //     throw new Error('Please login first.')
  //   }

  //   options.headers = {
  //     ...options.headers,
  //     'X-Signature': credential.signature,
  //     'X-Public-Key': credential.publicKey,
  //   }
  // }

  const jsoned:
    | {
        status: 'ok'
        data: any
      }
    | {
        status: 'error'
        message: string
      } = await fetchWrapper(ordersApiUrl, options)

  if (jsoned.status === 'error') {
    throw new Error(jsoned.message)
  }

  return jsoned.data ?? jsoned
}

export async function originalFetch(url: string, options?: RequestInit) {
  const response = await fetch(url, options)
  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${url}: ${response.status} ${response.statusText}`,
    )
  }
  return response
}
