<template>
  <div class="text-center py-3">
    <h5 class="fw-bold mb-3">
      <template v-if="phase === 'countdown'">抽選開始！</template>
      <template v-else-if="phase === 'shuffle'">抽選中...</template>
      <template v-else>抽選完了！</template>
    </h5>

    <!-- Lottery Stage -->
    <div class="lottery-stage mx-auto mb-3">
      <!-- Phase 1: Countdown -->
      <div v-if="phase === 'countdown'" :key="countdownNum" class="lottery-countdown">
        {{ countdownNum }}
      </div>

      <!-- Phase 2: Name Shuffle -->
      <div v-else-if="phase === 'shuffle'" class="lottery-name-card">
        <div class="lottery-name-text">{{ currentName }}</div>
      </div>

      <!-- Phase 3: Complete -->
      <div v-else class="lottery-complete">
        <div class="lottery-name-card">
          <div class="lottery-name-text">{{ currentName }}</div>
        </div>
      </div>
    </div>

    <p v-if="phase === 'shuffle'" class="text-muted small">抽選しています...</p>
    <p v-else-if="phase === 'complete'" class="fw-bold" style="color: var(--color-gold)">
      当選者が決定しました
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { Application } from '@/types';

const props = defineProps<{ applications: Application[] }>();
const emit = defineEmits<{ complete: [] }>();

const phase = ref<'countdown' | 'shuffle' | 'complete'>('countdown');
const countdownNum = ref(3);
const currentName = ref('');
let intervalId: ReturnType<typeof setInterval> | null = null;
let timeoutId: ReturnType<typeof setTimeout> | null = null;

const names = computed(() => props.applications.map((a) => a.name));

const cleanup = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  if (timeoutId) {
    clearTimeout(timeoutId);
    timeoutId = null;
  }
};

const startShuffle = () => {
  phase.value = 'shuffle';
  let elapsed = 0;
  let delay = 80;

  const step = () => {
    currentName.value = names.value[Math.floor(Math.random() * names.value.length)];
    elapsed += delay;

    if (elapsed >= 3500) {
      cleanup();
      phase.value = 'complete';
      timeoutId = setTimeout(() => emit('complete'), 1500);
      return;
    }

    // 徐々に減速: 80ms → 400ms
    delay = Math.min(400, 80 + (elapsed / 3500) * (elapsed / 3500) * 320);
    cleanup();
    intervalId = setTimeout(step, delay);
  };

  step();
};

const startCountdown = () => {
  if (names.value.length === 0) {
    emit('complete');
    return;
  }

  phase.value = 'countdown';
  countdownNum.value = 3;

  // 3 → 2 → 1 → shuffle
  timeoutId = setTimeout(() => {
    countdownNum.value = 2;
    timeoutId = setTimeout(() => {
      countdownNum.value = 1;
      timeoutId = setTimeout(() => startShuffle(), 1000);
    }, 1000);
  }, 1000);
};

onMounted(() => startCountdown());
onBeforeUnmount(() => cleanup());
</script>
