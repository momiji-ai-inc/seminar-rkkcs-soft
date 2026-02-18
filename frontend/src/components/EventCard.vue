<template>
  <div class="card h-100 event-card">
    <div :class="['event-card-accent', accentClass]"></div>
    <div class="card-body d-flex flex-column">
      <h5 class="card-title fw-bold mb-1">{{ event.title }}</h5>
      <h6 class="card-subtitle mb-2 text-muted">{{ event.artist }}</h6>

      <div class="small text-muted mb-3">
        <div>{{ event.venue }}</div>
        <div>当選枠: {{ event.capacity }}名</div>
      </div>

      <div class="mt-auto d-flex justify-content-between align-items-center">
        <div class="d-flex align-items-center gap-2">
          <span class="badge" :class="event.lottery_executed ? 'bg-secondary' : 'bg-success'">
            <span class="status-dot" :class="event.lottery_executed ? 'closed' : 'active'"></span>
            {{ event.lottery_executed ? '抽選済み' : '応募受付中' }}
          </span>
          <span
            v-if="event.application_count && event.application_count > 0 && !event.lottery_executed"
            class="odds-badge"
          >
            {{ oddsText }}
          </span>
        </div>
        <router-link :to="`/events/${event.id}`" class="btn btn-primary btn-sm">詳細</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Event } from '@/types';

const props = defineProps<{ event: Event }>();

const accentClass = computed(() => {
  const idx = ((props.event.id - 1) % 5) + 1;
  return `accent-${idx}`;
});

const oddsText = computed(() => {
  const count = props.event.application_count || 0;
  if (count === 0) return '';
  const ratio = count / props.event.capacity;
  return ratio <= 1 ? '1.0倍' : `${ratio.toFixed(1)}倍`;
});
</script>

<style scoped>
.event-card {
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease;
}

.event-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(124, 58, 237, 0.15);
}

/* --- Event Card Accent Bar --- */
.event-card-accent {
  height: 3px;
  border-radius: var(--radius) var(--radius) 0 0;
  margin: -1px -1px 0 -1px;
}

.accent-1 {
  background-color: var(--color-primary);
}
.accent-2 {
  background-color: var(--color-accent);
}
.accent-3 {
  background-color: var(--color-success);
}
.accent-4 {
  background-color: #0891b2;
}
.accent-5 {
  background-color: var(--color-gold);
}

/* --- Odds Badge --- */
.odds-badge {
  display: inline-flex;
  align-items: center;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.2em 0.6em;
  border-radius: 999px;
  background: var(--color-primary-bg);
  color: var(--color-primary);
  border: 1px solid rgba(124, 58, 237, 0.15);
}

/* --- Pulse Status Dot --- */
.status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 0.4rem;
}

.status-dot.active {
  background-color: var(--color-success);
  animation: pulse-dot 2s ease-in-out infinite;
}

.status-dot.closed {
  background-color: #9ca3af;
}

@keyframes pulse-dot {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(5, 150, 105, 0.4);
  }
  50% {
    box-shadow: 0 0 0 5px rgba(5, 150, 105, 0);
  }
}
</style>
