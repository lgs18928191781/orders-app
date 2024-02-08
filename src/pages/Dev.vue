<script lang="ts" setup>
import { onMounted } from 'vue'

// import { getUtxos, getTxHex } from '@/queries/proxy'
import { useBtcJsStore } from '@/stores/btcjs'
// import * as bip39 from 'bip39'
import BIP32Factory from 'bip32'
import { useSelectOrder } from '@/hooks/use-select-order'
import { testnet } from 'bitcoinjs-lib/src/networks'
import { Buffer } from 'buffer'
import { toXOnly } from '@/lib/btc-helpers'

const btcJsStore = useBtcJsStore()
const ECPair = btcJsStore!.ECPair

const { select } = useSelectOrder()
function addRandom() {
  // select('random')
}

onMounted(async () => {
  // gotta trigger deploy again
  const btcjs = window.bitcoin
  const secp256k1 = await import('tiny-secp256k1')
  btcjs.initEccLib(secp256k1)
  btcJsStore.set(btcjs)
})

function debug() {
  const rawOrders =
    '70736274ff0100f4020000000300000000000000000000000000000000000000000000000000000000000000000000000000ffffffff00000000000000000000000000000000000000000000000000000000000000000100000000ffffffffe07bd40244e0b9f507e6b2f23d3da89435ca7011b791cc16fd1b0dbc763975de0000000000ffffffff0300000000000000001976a914000000000000000000000000000000000000000088ac00000000000000001976a914000000000000000000000000000000000000000088ac40420f0000000000225120ead1ab45dad93c3fee5114a586e5548f16076c391854a084fd5961abafcdfacc000000000001011f0000000000000000160014ae47938f7acd1623e6e10e1ebcc33c2a7cb6e30d0001011f0000000000000000160014ae47938f7acd1623e6e10e1ebcc33c2a7cb6e30d0001012b2202000000000000225120ead1ab45dad93c3fee5114a586e5548f16076c391854a084fd5961abafcdfacc0103048300000000000000'
  const rawUnisat =
    '70736274ff0100f4020000000300000000000000000000000000000000000000000000000000000000000000000000000000ffffffff00000000000000000000000000000000000000000000000000000000000000000100000000ffffffffe07bd40244e0b9f507e6b2f23d3da89435ca7011b791cc16fd1b0dbc763975de0000000000ffffffff0300000000000000001976a914000000000000000000000000000000000000000088ac00000000000000001976a914000000000000000000000000000000000000000088ac40420f0000000000225120ead1ab45dad93c3fee5114a586e5548f16076c391854a084fd5961abafcdfacc000000000001011f0000000000000000160014ae47938f7acd1623e6e10e1ebcc33c2a7cb6e30d0001011f0000000000000000160014ae47938f7acd1623e6e10e1ebcc33c2a7cb6e30d0001012b2202000000000000225120ead1ab45dad93c3fee5114a586e5548f16076c391854a084fd5961abafcdfacc0103048300000001172001a16b9c992536e31f7d1a7e2f6019871d6f07346999d15ca04a60dc2b4a62af00000000'
}

function decodePsbt() {
  const raw =
    '70736274ff0100f4020000000300000000000000000000000000000000000000000000000000000000000000000000000000ffffffff00000000000000000000000000000000000000000000000000000000000000000100000000ffffffffe07bd40244e0b9f507e6b2f23d3da89435ca7011b791cc16fd1b0dbc763975de0000000000ffffffff0300000000000000001976a914000000000000000000000000000000000000000088ac00000000000000001976a914000000000000000000000000000000000000000088aca00f000000000000225120ead1ab45dad93c3fee5114a586e5548f16076c391854a084fd5961abafcdfacc000000000001011f0000000000000000160014ae47938f7acd1623e6e10e1ebcc33c2a7cb6e30d0001011f0000000000000000160014ae47938f7acd1623e6e10e1ebcc33c2a7cb6e30d0001012b2202000000000000225120ead1ab45dad93c3fee5114a586e5548f16076c391854a084fd5961abafcdfacc0103048300000001172001a16b9c992536e31f7d1a7e2f6019871d6f07346999d15ca04a60dc2b4a62af00000000'
  const raw2 =
    '70736274ff0100f4020000000300000000000000000000000000000000000000000000000000000000000000000000000000ffffffff00000000000000000000000000000000000000000000000000000000000000000100000000ffffffffe07bd40244e0b9f507e6b2f23d3da89435ca7011b791cc16fd1b0dbc763975de0000000000ffffffff0300000000000000001976a914000000000000000000000000000000000000000088ac00000000000000001976a914000000000000000000000000000000000000000088ac40420f0000000000225120ead1ab45dad93c3fee5114a586e5548f16076c391854a084fd5961abafcdfacc000000000001011f0000000000000000160014ae47938f7acd1623e6e10e1ebcc33c2a7cb6e30d0001011f0000000000000000160014ae47938f7acd1623e6e10e1ebcc33c2a7cb6e30d0001012b2202000000000000225120ead1ab45dad93c3fee5114a586e5548f16076c391854a084fd5961abafcdfacc0103048300000001172001a16b9c992536e31f7d1a7e2f6019871d6f07346999d15ca04a60dc2b4a62af00000000'

  const btcjs = btcJsStore.get!

  const psbt = btcjs.Psbt.fromHex(raw)
  const psbt2 = btcjs.Psbt.fromHex(raw2)
  console.log({ psbt, psbt2 })
  const psbtInput = psbt.data.inputs[0]
  console.log({ psbtInput })
  const input = psbt.txInputs[0]
  console.log(input.hash.toString('hex'))

  const outputScript = (psbt.data.globalMap.unsignedTx as any).tx.outs[0].script
  const outputScript2 = (psbt2.data.globalMap.unsignedTx as any).tx.outs[0]
    .script

  const my = new btcjs.Psbt()
  my.setVersion(2)
  my.addInput({
    hash: '0000000000000000000000000000000000000000000000000000000000000000',
    index: 0,
    witnessUtxo: psbt.data.inputs[0].witnessUtxo,
  })
    .addInput({
      hash: '0000000000000000000000000000000000000000000000000000000000000000',
      index: 1,
      witnessUtxo: psbt.data.inputs[1].witnessUtxo,
    })
    .addOutput({
      script: outputScript,
      value: 0,
    })
    .addOutput({
      script: outputScript,
      value: 0,
    })
  const my2 = new btcjs.Psbt()
  my2.setVersion(2)
  my2
    .addInput({
      hash: '0000000000000000000000000000000000000000000000000000000000000000',
      index: 0,
      witnessUtxo: psbt2.data.inputs[0].witnessUtxo,
    })
    .addInput({
      hash: '0000000000000000000000000000000000000000000000000000000000000000',
      index: 1,
      witnessUtxo: psbt2.data.inputs[1].witnessUtxo,
    })
    .addOutput({
      script: outputScript2,
      value: 0,
    })
    .addOutput({
      script: outputScript2,
      value: 0,
    })
  const myHex = my.toHex()
  const myHex2 = my2.toHex()
  console.log({ myHex, myHex2, equal: myHex === myHex2 })
}

function toOutputScript() {
  const btcjs = btcJsStore.get!
  const outputScript = btcjs.address.toOutputScript(
    'tb1p4g232ucvzqr09dkjccj6fzx56ccyptss69hznz5grdj0fwmcc7ysdj6a3s',
    testnet
  )
  console.log({ outputScript: outputScript.toString('hex') })
}

function onToAddress() {
  const btcjs = btcJsStore.get!
  const pubkey =
    '02281f762b96311b468e50dfd6e48c5e7a45944f02b531544e2addff10cffbdb75'
  const pubkeyBuffer = Buffer.from(pubkey, 'hex')
  console.log('length', pubkeyBuffer.length)
  const { address } = btcjs.payments.p2tr({
    pubkey: toXOnly(pubkeyBuffer),
    network: testnet,
  })
  console.log({ address })
}

function onSignTaproot() {
  const btcjs = btcJsStore.get!
  const psbt = btcjs.Psbt.fromHex(
    '70736274ff0100fd080102000000025242f878b9f889b022fd55982505567f9e2ac7aab9c5194fd2a22a942f5346050000000000ffffffff75f02384d28074ea07cf822fe30695c3e1903b656466dafbc350a922d6c475c20100000000ffffffff042202000000000000225120ead1ab45dad93c3fee5114a586e5548f16076c391854a084fd5961abafcdfacca086010000000000225120aa1515730c1006f2b6d2c625a488d4d63040ae10d16e298a881b64f4bb78c7899808000000000000225120196631527aa44e6842e99e46541ebd50770eb99f691da7eb264b57144118b3966652040000000000225120ead1ab45dad93c3fee5114a586e5548f16076c391854a084fd5961abafcdfacc000000000001012b2202000000000000225120196631527aa44e6842e99e46541ebd50770eb99f691da7eb264b57144118b3960001012beee3050000000000225120ead1ab45dad93c3fee5114a586e5548f16076c391854a084fd5961abafcdfacc0103040100000001134174ec95aa7cdaf85a3628b20ac418781a0c6cc82b93a938ebb2f378b1b19c015688de9ad877a28e7c33dbf807c37777c8c61d84e1409898b4ab5b7f2e980cfa8e0101172001a16b9c992536e31f7d1a7e2f6019871d6f07346999d15ca04a60dc2b4a62af0000000000',
    { network: testnet }
  )
  console.log({ psbt })

  const privateKeyStr = ''
  const signer = ECPair?.fromPrivateKey(Buffer.from(privateKeyStr, 'hex'), {
    network: testnet,
  })
  if (!signer) {
    console.error('Signer not found')
    return
  }
  const pubkey2 = signer.publicKey.toString('hex')

  const addressRight =
    'tb1pr9nrz5n6538xsshfner9g84a2pmsawvldyw606exfdt3gsgckwtq85md6v'
  // tweak signer
  const pubkey1 =
    '02281f762b96311b468e50dfd6e48c5e7a45944f02b531544e2addff10cffbdb75'

  console.log({ pubkey1, pubkey2 })

  const { address } = btcjs.payments.p2tr({
    internalPubkey: toXOnly(Buffer.from(pubkey1, 'hex')),
    network: testnet,
  })
  const outputScript = psbt.data.inputs[0].witnessUtxo!.script
  const address2 = btcjs.address.fromOutputScript(outputScript, testnet)
  const { address: address3 } = btcjs.payments.p2tr({
    internalPubkey: toXOnly(Buffer.from(pubkey2, 'hex')),
    network: testnet,
  })
  const prevTxid = psbt.txInputs[0].hash.toString('hex')

  console.log({ address, address2, address3, prevTxid })
  const xOnlyPubkey = toXOnly(signer.publicKey)
  const tweaked = signer.tweak(btcjs.crypto.taggedHash('TapTweak', xOnlyPubkey))

  psbt.signInput(0, tweaked)
}
</script>

<template>
  <div class="p-8">
    <button class="border p-2 rounded-md" @click="decodePsbt">
      decode psbt
    </button>
  </div>

  <div class="p-8">
    <h3>Test Reactivity</h3>

    <div class="flex gap-4">
      <button @click="addRandom" class="p-2 rounded border border-zinc-500">
        Add Random String
      </button>

      <button
        @click="toOutputScript"
        class="p-2 rounded border border-zinc-500"
      >
        to output script
      </button>

      <button @click="onToAddress" class="p-2 rounded border border-zinc-500">
        taproot pubkey to address
      </button>

      <button @click="onSignTaproot" class="p-2 rounded border border-zinc-500">
        sign taproot
      </button>
    </div>
  </div>
</template>
