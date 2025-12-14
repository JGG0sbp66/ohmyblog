import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/show', name: 'show', component: () => import('@/views/show/index.vue') },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
