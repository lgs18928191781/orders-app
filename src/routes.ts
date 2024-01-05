import { fetchGeo } from '@/queries/geo'
import { useAddressStore, useCredentialsStore, useGeoStore } from '@/store'
import { isRestrictedRegion } from '@/lib/helpers'

const Home = () => import('./pages/Home.vue')
const Recover = () => import('./pages/Recover.vue')
const Whitelist = () => import('./pages/Whitelist.vue')
const Changelog = () => import('./pages/Changelog.vue')
const Dev = () => import('./pages/Dev.vue')
const Pool = () => import('./pages/Pool.vue')
const NoService = () => import('./pages/NoService.vue')
const Maintaining = () => import('./pages/Maintaining.vue')

const routes = [
  { path: '/orders/:pair?', component: Home, alias: '/' },
  { path: '/whitelist', component: Whitelist },
  { path: '/changelog', component: Changelog },
  { path: '/pool/:pair?', component: Pool },
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
  const addressStore = useAddressStore()
  const credentialStore = useCredentialsStore()

  const address = addressStore.get

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
