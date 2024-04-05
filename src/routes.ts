import { fetchGeo } from '@/queries/geo'
import { useConnectionStore } from '@/stores/connection'
import { useCredentialsStore } from '@/stores/credentials'
import { useCheckMetaletLoginModal } from '@/hooks/use-check-metalet-modal'
import { useGeoStore } from '@/stores/geo'
import { isRestrictedRegion } from '@/lib/helpers'

const Home = () => import('./pages/Home.vue')
const Recover = () => import('./pages/Recover.vue')
const Swap = () => import('./pages/Swap.vue')
const Bridge = () => import('./pages/asset-bridge/Bridge.vue')
const SwapPools = () => import('./pages/swap-pools/Index.vue')
const Whitelist = () => import('./pages/Whitelist.vue')
const Events = () => import('./pages/Events.vue')
const Leaderboard = () => import('./pages/Leaderboard.vue')
const Changelog = () => import('./pages/Changelog.vue')
const Dev = () => import('./pages/Dev.vue')
const NoService = () => import('./pages/NoService.vue')
const Maintaining = () => import('./pages/Maintaining.vue')

const routes = [
  { path: '/orders/:pair?', component: Home, alias: '/' },
  // { path: '/swap-pools/add', component: SwapPoolsAdd }
  {
    path: '/swap-pools/:pair?',
    component: SwapPools,
    children: [
      {
        path: 'add',
        alias: '',
        name: 'swap-pools-add',
        component: () => import('./pages/swap-pools/Add.vue'),
      },
      {
        path: 'remove',
        name: 'swap-pools-remove',
        component: () => import('./pages/swap-pools/Remove.vue'),
      },
    ],
  },
  // { path: '/swap', component: Swap },
  // {
  //   path: '/bridge/:pair?',
  //   component: Bridge,
  //   beforeEnter: () => {
  //     const connectionStore = useConnectionStore()
  //     const { openConnectionModal } = useCheckMetaletLoginModal()
  //     if (
  //       connectionStore.connected &&
  //       connectionStore.last.wallet !== 'metalet'
  //     ) {
  //       openConnectionModal()
  //     }
  //   },
  // },
  { path: '/swap/:pair?', component: Swap, name: 'swap' },
  { path: '/whitelist', component: Whitelist },
  { path: '/events', component: Events },
  { path: '/leaderboard', component: Leaderboard },
  { path: '/changelog', component: Changelog },
  // { path: '/pool/:pair?', component: Pool },
  { path: '/recover', component: Recover },
  { path: '/dev', component: Dev },
  { path: '/not-available', component: NoService },
  { path: '/maintaining', component: Maintaining },
]

export const maintenanceGuard = async (to: any, from: any, next: any) => {
  if (
    import.meta.env.VITE_IS_MAINTAINING === 'yes' &&
    to.path !== '/maintaining' &&
    to.path !== '/not-available'
  ) {
    next('/maintaining')
  } else {
    if (
      import.meta.env.VITE_IS_MAINTAINING !== 'yes' &&
      to.path === '/maintaining'
    ) {
      next('/')
    } else {
      next()
    }
  }
}

export const geoGuard = async (to: any, from: any, next: any) => {
  const geoStore = useGeoStore()
  if (import.meta.env.VITE_ENVIRONMENT === 'development') {
    geoStore.pass = true
    next()
  } else {
    if (to.path === '/not-available') next()
    else {
      if (geoStore.pass) {
        next()
      } else {
        const geo = await fetchGeo()
        if (!isRestrictedRegion(geo)) {
          geoStore.pass = true
        }
        // geoStore.pass = true
        // next()
        // return
        if (isRestrictedRegion(geo) && to.path !== '/not-available')
          next('/not-available')
        else {
          next()
        }
      }
    }
  }
}

export const credentialGuard = async (to: any, from: any, next: any) => {
  const connectionStore = useConnectionStore()
  const credentialStore = useCredentialsStore()

  const address = connectionStore?.last?.address

  // only guard pool page
  if (!to.path.includes('/pool')) {
    next()
  } else {
    if (address) {
      const credential = credentialStore.getByAddress(address)
      if (credential) {
        next()
      } else {
        next('/')
      }
    } else {
      next()
    }
  }
}

export default routes
