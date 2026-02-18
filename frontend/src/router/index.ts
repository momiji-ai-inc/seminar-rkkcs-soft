import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import EventList from '@/views/EventList.vue';
import EventDetail from '@/views/EventDetail.vue';
import LotteryResult from '@/views/LotteryResult.vue';
import AdminPanel from '@/views/AdminPanel.vue';

const routes: Array<RouteRecordRaw> = [
  // ユーザー画面
  { path: '/', name: 'EventList', component: EventList },
  { path: '/events/:id', name: 'EventDetail', component: EventDetail },
  { path: '/events/:id/results', name: 'LotteryResult', component: LotteryResult },

  // 管理者画面
  { path: '/admin', name: 'AdminPanel', component: AdminPanel },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
