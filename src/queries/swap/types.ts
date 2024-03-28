export type TaskType = '1x' | 'x2' | '2x' | 'x1' | 'add' | 'remove'

export type InscriptionUtxo = {
  id: string
  satoshis: number
  amount?: string
}
