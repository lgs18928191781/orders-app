import changelog from './changelog'

// Environments
export const VERSION = changelog[0].version
export const DEBUG = false
export const IS_DEV = import.meta.env.VITE_ENVIRONMENT === 'development'
export const SHOWING_TRADE_STATS = false

// all kinds of satoshis value
export const DUMMY_UTXO_VALUE = 600
export const DUST_UTXO_VALUE = 546
export const MS_BRC20_UTXO_VALUE = 1000
export const ONE_SERVICE_FEE = 10_000
export const SELL_SERVICE_FEE = 16_000
export const EXTRA_INPUT_MIN_VALUE = 600

// feeb
export const MIN_FEEB = 10
export const EXTREME_FEEB = 1
export const FEEB_MULTIPLIER = 1.3
export const MS_FEEB_MULTIPLIER = 2.2

// predefined sizes
export const RELEASE_PAYLOAD_SIZE = 391
export const RELEASE_TX_SIZE = RELEASE_PAYLOAD_SIZE + 68 + 31
export const RECOVER_TX_SIZE = 363
export const BUY_TX_SIZE = 500
export const SELL_TX_SIZE = 673
export const BID_TX_SIZE = 111 + 154 // pay + grant
export const SEND_TX_SIZE = 140
export const SWAP_TX_SIZE = 298
export const SWAP_2X_TX_SIZE = 212 + 240 // 3 inputs
export const SWAP_POOL_ADD_TX_SIZE = 255
export const INSCRIBE_TX_SIZE_FACTOR = 380
export const TX_BASE_SIZE = 300

// Sighash types
export const SIGHASH_DEFAULT = 0x00
export const SIGHASH_ALL = 0x01
export const SIGHASH_NONE = 0x02
export const SIGHASH_SINGLE = 0x03
export const SIGHASH_ANYONECANPAY = 0x80
export const SIGHASH_SINGLE_ANYONECANPAY = 0x83
export const SIGHASH_NONE_ANYONECANPAY = 0x82
export const SIGHASH_ALL_ANYONECANPAY = 0x81

// exchange
export const SERVICE_TESTNET_ADDRESS = import.meta.env
  .VITE_SERVICE_TESTNET_ADDRESS
export const SERVICE_LIVENET_ADDRESS = import.meta.env
  .VITE_SERVICE_LIVENET_ADDRESS
export const SERVICE_LIVENET_BID_ADDRESS = import.meta.env
  .VITE_SERVICE_LIVENET_BID_ADDRESS
export const SERVICE_LIVENET_RDEX_ADDRESS = import.meta.env
  .VITE_SERVICE_LIVENET_RDEX_ADDRESS

// BTC Liquidity Mode (1 for psbt, 2 for custody, 3 for cascade)
export const BTC_POOL_MODE: 1 | 2 | 3 = 3

export const POOL_REWARDS_TICK = 'rdex'
export const EVENT_REWARDS_TICK = 'rdex'

export const USE_UTXO_COUNT_LIMIT = 5

// okx
export const OKX_TEMPLATE_PSBT =
  '70736274ff0100a0020000000200000000000000000000000000000000000000000000000000000000000000000000000000ffffffff00000000000000000000000000000000000000000000000000000000000000000100000000ffffffff0200000000000000001976a914000000000000000000000000000000000000000088ac00000000000000001976a914000000000000000000000000000000000000000088ac000000000001011f0000000000000000160014ae47938f7acd1623e6e10e1ebcc33c2a7cb6e30d0001011f0000000000000000160014ae47938f7acd1623e6e10e1ebcc33c2a7cb6e30d000000'

// All kinds of transactions' types and specifications
export const BUY_PRICE_OUTPUT_INDEX = 2
export const BUY_PAY_INPUT_INDEX = 4

export const SIGNING_MESSAGE = 'orders.exchange'

export const SWAP_THRESHOLD_AMOUNT = 20_000
export const REMOVE_THRESHOLD_AMOUNT = 50_000
export const ADD_THRESHOLD_AMOUNT = 100_000
