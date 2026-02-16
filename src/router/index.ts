import { createRouter, createWebHistory } from 'vue-router'
import Market from '../views/Market.vue'
import ChronoSetup from '../views/ChronoSetup.vue'

const routes = [
  {
    path: '/',
    name: 'Market',
    component: Market
  },
  {
    path: '/chrono-setup',
    name: 'ChronoSetup',
    component: ChronoSetup
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
