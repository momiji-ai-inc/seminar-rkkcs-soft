<template>
  <div>
    <div class="page-header page-header-admin">
      <h2>管理パネル</h2>
      <p>イベント選択 → 応募者確認 → 抽選実行</p>
    </div>

    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
    <div v-else-if="error" class="alert alert-danger">{{ error }}</div>
    <div v-else>
      <!-- イベントタブ -->
      <div class="admin-tabs mb-4">
        <button
          v-for="ev in events"
          :key="ev.id"
          class="admin-tab"
          :class="{ active: selectedEvent?.id === ev.id }"
          @click="selectEvent(ev)"
        >
          <span class="admin-tab-title">{{ ev.title }}</span>
          <span class="admin-tab-meta">{{ ev.artist }}</span>
          <span class="admin-tab-badge" :class="ev.lottery_executed ? 'executed' : 'open'">
            {{ ev.lottery_executed ? '抽選済' : '受付中' }}
          </span>
        </button>
      </div>

      <!-- 選択中イベント詳細 -->
      <div v-if="selectedEvent">
        <!-- 統計カード -->
        <div class="row g-3 mb-4">
          <div class="col-md-4">
            <div class="stat-card">
              <div class="stat-value">{{ applications.length }}</div>
              <div class="stat-label">応募者数</div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="stat-card">
              <div class="stat-value">{{ selectedEvent.capacity }}</div>
              <div class="stat-label">当選枠</div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="stat-card">
              <div class="stat-value">{{ odds }}</div>
              <div class="stat-label">倍率</div>
            </div>
          </div>
        </div>

        <!-- 抽選アニメーション中 -->
        <div v-if="showAnimation" class="card p-4 mb-4">
          <LotteryAnimation
            :applications="applications"
            :winners="winners"
            @complete="onAnimationComplete"
          />
        </div>

        <!-- 抽選実行ボタン or 結果リンク -->
        <div v-if="!showAnimation" class="text-center mb-4">
          <div v-if="selectedEvent.lottery_executed">
            <p class="text-muted mb-2">抽選は実施済みです</p>
            <router-link
              :to="`/events/${selectedEvent.id}/results`"
              class="btn btn-outline-primary"
            >
              結果を確認する
            </router-link>
          </div>
          <div v-else>
            <button
              class="btn btn-primary btn-lg px-5"
              :disabled="showAnimation || applications.length === 0"
              @click="handleLottery"
            >
              抽選を実行する
            </button>
          </div>
        </div>

        <!-- 応募者一覧テーブル -->
        <div class="card">
          <div class="card-header bg-white border-0 pt-3 px-3">
            <h6 class="fw-bold mb-0">応募者一覧 ({{ applications.length }}名)</h6>
          </div>
          <div class="card-body">
            <div v-if="applications.length === 0" class="text-muted">応募者はまだいません</div>
            <div v-else class="table-responsive">
              <table class="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>氏名</th>
                    <th>メール</th>
                    <th>ステータス</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(app, index) in applications"
                    :key="app.id"
                    :class="statusMap[app.status]?.row || 'status-pending'"
                  >
                    <td>{{ index + 1 }}</td>
                    <!-- 名前に装飾タグを使えるようにする -->
                    <td v-html="app.name"></td>
                    <td>{{ app.email }}</td>
                    <td>
                      <span
                        class="badge"
                        :class="statusMap[app.status]?.badge || 'bg-warning text-dark'"
                      >
                        {{ statusMap[app.status]?.label || '未抽選' }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-5 text-muted">上のタブからイベントを選択してください</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { Event, Application } from '@/types';
import { getEvents, getApplications, executeLottery, getResults } from '@/services/api';
import LotteryAnimation from '@/components/LotteryAnimation.vue';

const statusMap: Record<string, { label: string; badge: string; row: string }> = {
  won: { label: '当選', badge: 'bg-success', row: 'status-won' },
  lost: { label: '落選', badge: 'bg-danger', row: 'status-lost' },
  pending: { label: '未抽選', badge: 'bg-warning text-dark', row: 'status-pending' },
};

const router = useRouter();
const events = ref<Event[]>([]);
const selectedEvent = ref<Event | null>(null);
const applications = ref<Application[]>([]);
const loading = ref(true);
const error = ref('');
const showAnimation = ref(false);
const winners = ref<Application[]>([]);

const odds = computed(() => {
  if (!selectedEvent.value || applications.value.length === 0) return '-';
  const ratio = applications.value.length / selectedEvent.value.capacity;
  return ratio <= 1 ? '1.0倍（全員当選）' : `${ratio.toFixed(1)}倍`;
});

const loadEvents = async () => {
  try {
    events.value = await getEvents();
  } catch {
    error.value = 'イベントの取得に失敗しました';
  } finally {
    loading.value = false;
  }
};

const selectEvent = async (ev: Event) => {
  selectedEvent.value = ev;
  showAnimation.value = false;
  try {
    applications.value = await getApplications(ev.id);
  } catch {
    applications.value = [];
  }
};

const onAnimationComplete = () => {
  if (selectedEvent.value) {
    router.push(`/events/${selectedEvent.value.id}/results`);
  }
};

const handleLottery = async () => {
  if (!selectedEvent.value) return;

  try {
    await executeLottery(selectedEvent.value.id);
    const resultData = await getResults(selectedEvent.value.id);
    winners.value = resultData.winners;
    showAnimation.value = true;
  } catch (e: any) {
    error.value = e.response?.data?.error || '抽選の実行に失敗しました';
  }
};

loadEvents();
</script>

<style scoped>
/* --- Admin Tabs --- */
.admin-tabs {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 0.25rem;
}

.admin-tab {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.2rem;
  padding: 0.75rem 1.25rem;
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  cursor: pointer;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
  min-width: 160px;
}

.admin-tab:hover {
  border-color: var(--color-primary-light);
  box-shadow: var(--shadow-md);
}

.admin-tab.active {
  border-color: var(--color-primary);
  background: var(--color-primary-bg);
}

.admin-tab-title {
  font-weight: 600;
  font-size: 0.85rem;
  color: var(--color-text);
}

.admin-tab-meta {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.admin-tab-badge {
  font-size: 0.65rem;
  font-weight: 600;
  padding: 0.15em 0.5em;
  border-radius: 4px;
}

.admin-tab-badge.open {
  background-color: #d1fae5;
  color: #065f46;
}

.admin-tab-badge.executed {
  background-color: #e5e7eb;
  color: #4b5563;
}
</style>
