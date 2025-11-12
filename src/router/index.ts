import { createRouter, createWebHistory } from 'vue-router'
import Market from '../views/Market.vue'

const routes = [
  {
    path: '/',
    name: 'Market',
    component: Market
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
