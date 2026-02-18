<template>
  <div>
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
    <div v-else-if="error" class="alert alert-danger">{{ error }}</div>
    <div v-else-if="result">
      <div class="mb-3">
        <router-link :to="`/events/${result.event.id}`" class="text-decoration-none text-muted">
          &larr; イベント詳細に戻る
        </router-link>
      </div>

      <div class="page-header">
        <h2>抽選結果</h2>
        <p>{{ result.event.title }}</p>
      </div>

      <!-- Stats Summary -->
      <div class="stats-summary">
        <div class="stats-summary-item">
          <div class="stats-summary-value">{{ result.winners.length + result.losers.length }}</div>
          <div class="stats-summary-label">総応募数</div>
        </div>
        <div class="stats-summary-item">
          <div class="stats-summary-value">{{ result.winners.length }}</div>
          <div class="stats-summary-label">当選者</div>
        </div>
        <div class="stats-summary-item">
          <div class="stats-summary-value">{{ result.losers.length }}</div>
          <div class="stats-summary-label">落選者</div>
        </div>
        <div class="stats-summary-item">
          <div class="stats-summary-value">{{ oddsText }}</div>
          <div class="stats-summary-label">倍率</div>
        </div>
      </div>

      <!-- Winners -->
      <div class="mb-4">
        <h5 class="fw-bold mb-3">当選者 ({{ result.winners.length }}名)</h5>

        <div v-if="result.winners.length === 0" class="text-muted">当選者なし</div>
        <div v-else class="row g-3">
          <div v-for="(w, i) in result.winners" :key="w.id" class="col-md-6 col-lg-4">
            <div
              class="card winner-card p-3 winner-stagger"
              :style="{ animationDelay: `${i * 0.15}s` }"
            >
              <div class="d-flex align-items-center gap-3">
                <div class="flex-grow-1">
                  <div class="fw-bold">{{ w.name }}</div>
                  <small class="text-muted">{{ w.email }}</small>
                </div>
                <span class="badge bg-success">当選</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Losers (Collapsible) -->
      <div class="mb-4">
        <h6
          class="fw-bold mb-3 collapse-toggle d-flex align-items-center gap-2"
          @click="showLosers = !showLosers"
        >
          <span class="collapse-arrow" :class="{ expanded: showLosers }">&#9654;</span>
          落選者 ({{ result.losers.length }}名)
        </h6>

        <div v-if="showLosers">
          <div v-if="result.losers.length === 0" class="text-muted">落選者なし</div>
          <div v-else class="card">
            <div class="card-body">
              <table class="table table-sm table-hover mb-0">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>氏名</th>
                    <th>メール</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(l, i) in result.losers" :key="l.id">
                    <td>{{ i + 1 }}</td>
                    <td>{{ l.name }}</td>
                    <td>{{ l.email }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Confetti (inline) -->
      <div v-if="showConfetti" class="confetti-container">
        <span
          v-for="n in 40"
          :key="`c-${n}`"
          class="confetti-piece"
          :style="confettiStyle(n)"
        ></span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';
import { LotteryResult } from '@/types';
import { getResults } from '@/services/api';

const CONFETTI_COLORS = ['#7c3aed', '#ec4899', '#f59e0b', '#059669', '#0891b2', '#dc2626'];

const route = useRoute();
const result = ref<LotteryResult | null>(null);
const loading = ref(true);
const error = ref('');
const showLosers = ref(false);
const showConfetti = ref(false);
let confettiTimer: ReturnType<typeof setTimeout> | null = null;

const oddsText = computed(() => {
  if (!result.value) return '-';
  const total = result.value.winners.length + result.value.losers.length;
  const capacity = result.value.winners.length;
  if (capacity === 0) return '-';
  const ratio = total / capacity;
  return `${ratio.toFixed(1)}倍`;
});

const confettiStyle = (n: number) => ({
  left: `${Math.random() * 100}%`,
  backgroundColor: CONFETTI_COLORS[n % CONFETTI_COLORS.length],
  width: `${6 + Math.random() * 8}px`,
  height: `${6 + Math.random() * 8}px`,
  borderRadius: Math.random() > 0.5 ? '50%' : '2px',
  animationDuration: `${1.5 + Math.random() * 2}s`,
  animationDelay: `${Math.random() * 0.6}s`,
});

onMounted(async () => {
  try {
    const id = Number(route.params.id);
    result.value = await getResults(id);
    if (result.value.winners.length > 0) {
      setTimeout(() => {
        showConfetti.value = true;
        confettiTimer = setTimeout(() => {
          showConfetti.value = false;
        }, 3000);
      }, 300);
    }
  } catch (e: any) {
    error.value = e.response?.data?.error || '結果の取得に失敗しました';
  } finally {
    loading.value = false;
  }
});

onBeforeUnmount(() => {
  if (confettiTimer) clearTimeout(confettiTimer);
});
</script>

<style scoped>
.winner-stagger {
  animation: winner-fade-in 0.5s ease-out both;
}

@keyframes winner-fade-in {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
