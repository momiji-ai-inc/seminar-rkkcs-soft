<template>
  <div>
    <div class="page-header">
      <h2>イベント一覧</h2>
      <p>気になるイベントを見つけて応募しよう</p>
    </div>

    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
    <div v-else-if="error" class="alert alert-danger">{{ error }}</div>
    <div v-else class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
      <div v-for="event in events" :key="event.id" class="col">
        <EventCard :event="event" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Event } from '@/types';
import { getEvents } from '@/services/api';
import EventCard from '@/components/EventCard.vue';

const events = ref<Event[]>([]);
const loading = ref(true);
const error = ref('');

onMounted(async () => {
  try {
    events.value = await getEvents();
  } catch {
    error.value = 'イベントの取得に失敗しました';
  } finally {
    loading.value = false;
  }
});
</script>
