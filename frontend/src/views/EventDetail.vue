<template>
  <div>
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
    <div v-else-if="error" class="alert alert-danger">{{ error }}</div>
    <div v-else-if="event">
      <div class="mb-3">
        <router-link to="/" class="text-decoration-none text-muted"
          >&larr; イベント一覧に戻る</router-link
        >
      </div>

      <div class="page-header">
        <h2>{{ event.title }}</h2>
        <p>{{ event.artist }}</p>
      </div>

      <div class="card mb-4">
        <div class="card-body">
          <div class="info-grid mb-3">
            <div class="info-item">
              <div>
                <div class="info-label">会場</div>
                <div class="info-value">{{ event.venue }}</div>
              </div>
            </div>
            <div class="info-item">
              <div>
                <div class="info-label">当選枠</div>
                <div class="info-value">{{ event.capacity }}名</div>
              </div>
            </div>
            <div class="info-item">
              <div>
                <div class="info-label">応募数</div>
                <div class="info-value">{{ event.application_count }}名</div>
              </div>
            </div>
          </div>

          <div class="d-flex align-items-center gap-3">
            <span class="badge" :class="event.lottery_executed ? 'bg-secondary' : 'bg-success'">
              {{ event.lottery_executed ? '抽選済み' : '応募受付中' }}
            </span>
            <router-link
              v-if="event.lottery_executed"
              :to="`/events/${event.id}/results`"
              class="btn btn-outline-primary btn-sm"
            >
              抽選結果を見る
            </router-link>
          </div>
        </div>
      </div>

      <ApplicationForm v-if="!event.lottery_executed" :event-id="event.id" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Event, Application } from '@/types';
import { getEvent, getApplications } from '@/services/api';
import ApplicationForm from '@/components/ApplicationForm.vue';

const route = useRoute();
const router = useRouter();
const event = ref<Event | null>(null);
const loading = ref(true);
const error = ref('');
const debugMode = false;
const MAX_RETRY_COUNT = 3;

onMounted(async () => {
  try {
    const id = Number(route.params.id);
    event.value = await getEvent(id);
  } catch {
    error.value = 'イベントの取得に失敗しました';
  } finally {
    loading.value = false;
  }
});
</script>
