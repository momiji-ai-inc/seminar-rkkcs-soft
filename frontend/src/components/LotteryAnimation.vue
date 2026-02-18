<template>
  <div class="text-center py-3">
    <h5 class="fw-bold mb-3">
      <template v-if="phase === 'countdown'">抽選開始！</template>
      <template v-else-if="phase === 'revealing'">
        当選者発表中... ({{ revealedWinners.length }}/{{ totalWinners }}名)
      </template>
      <template v-else-if="phase === 'batch'">残りの当選者を発表！</template>
      <template v-else>抽選完了！</template>
    </h5>

    <!-- プログレスバー -->
    <div v-if="phase !== 'countdown'" class="lottery-progress mx-auto mb-3">
      <div
        class="lottery-progress-bar"
        :style="{ width: progressPercent + '%' }"
      ></div>
    </div>

    <!-- Lottery Stage -->
    <div class="lottery-stage mx-auto mb-3">
      <!-- Phase 1: Countdown -->
      <div v-if="phase === 'countdown'" :key="countdownNum" class="lottery-countdown">
        {{ countdownNum }}
      </div>

      <!-- Phase 2: Revealing (1人ずつルーレット) -->
      <div v-else-if="phase === 'revealing'">
        <div
          class="lottery-name-card"
          :class="{ 'is-winner': isShowingWinner }"
        >
          <div class="lottery-name-text">{{ currentName }}</div>
        </div>
      </div>

      <!-- Phase 3: Batch (残りの当選者一括表示) -->
      <div v-else-if="phase === 'batch'" class="lottery-batch">
        <div class="lottery-name-text" style="font-size: 1.1rem; color: var(--color-gold);">
          他 {{ batchWinners.length }}名 当選！
        </div>
      </div>

      <!-- Phase 4: Complete -->
      <div v-else class="lottery-complete">
        <div class="lottery-name-card">
          <div class="lottery-name-text">
            全{{ totalWinners }}名 当選！
          </div>
        </div>
      </div>
    </div>

    <!-- 公開済み当選者リスト -->
    <div v-if="revealedWinners.length > 0" class="lottery-revealed mx-auto">
      <TransitionGroup name="revealed-item">
        <span
          v-for="winner in revealedWinners"
          :key="winner.id"
          class="lottery-revealed-item"
        >
          {{ winner.name }}
        </span>
      </TransitionGroup>
    </div>

    <!-- フッターメッセージ -->
    <p v-if="phase === 'revealing' && !isShowingWinner" class="text-muted small mt-2">
      抽選しています...
    </p>
    <p v-else-if="phase === 'revealing' && isShowingWinner" class="fw-bold mt-2" style="color: var(--color-gold);">
      当選！
    </p>
    <p v-else-if="phase === 'complete'" class="fw-bold mt-2" style="color: var(--color-gold);">
      当選者が決定しました
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { Application } from '@/types';

const props = defineProps<{
  applications: Application[];
  winners: Application[];
}>();
const emit = defineEmits<{ complete: [] }>();

const phase = ref<'countdown' | 'revealing' | 'batch' | 'complete'>('countdown');
const countdownNum = ref(3);
const currentName = ref('');
const isShowingWinner = ref(false);
const revealedWinners = ref<Application[]>([]);
const batchWinners = ref<Application[]>([]);
const currentRevealIndex = ref(0);

let timeoutId: ReturnType<typeof setTimeout> | null = null;
let shuffleTimeoutId: ReturnType<typeof setTimeout> | null = null;

const names = computed(() => props.applications.map((a) => a.name));
const totalWinners = computed(() => props.winners.length);

// 10人以下なら全員個別公開、11人以上なら最初の5人を個別公開
const individualCount = computed(() =>
  props.winners.length <= 10 ? props.winners.length : 5,
);

const progressPercent = computed(() => {
  if (totalWinners.value === 0) return 0;
  if (phase.value === 'complete') return 100;
  if (phase.value === 'batch') return 100;
  return (revealedWinners.value.length / totalWinners.value) * 100;
});

const cleanup = () => {
  if (timeoutId) {
    clearTimeout(timeoutId);
    timeoutId = null;
  }
  if (shuffleTimeoutId) {
    clearTimeout(shuffleTimeoutId);
    shuffleTimeoutId = null;
  }
};

// ルーレットシャッフル: 2秒間名前をシャッフルして減速→当選者名で停止
const runRoulette = (winnerIndex: number) => {
  isShowingWinner.value = false;
  const winner = props.winners[winnerIndex];
  let elapsed = 0;
  let delay = 80;

  const step = () => {
    currentName.value = names.value[Math.floor(Math.random() * names.value.length)];
    elapsed += delay;

    if (elapsed >= 2000) {
      // ルーレット終了: 当選者名を表示
      currentName.value = winner.name;
      isShowingWinner.value = true;
      revealedWinners.value = [...revealedWinners.value, winner];

      // 1秒間当選者名を表示 → 次へ
      timeoutId = setTimeout(() => {
        currentRevealIndex.value++;
        revealNext();
      }, 1000);
      return;
    }

    // 減速カーブ: 80ms → 350ms
    delay = Math.min(350, 80 + (elapsed / 2000) * (elapsed / 2000) * 270);
    shuffleTimeoutId = setTimeout(step, delay);
  };

  step();
};

const revealNext = () => {
  if (currentRevealIndex.value >= individualCount.value) {
    // 個別公開完了
    if (props.winners.length > individualCount.value) {
      // 残りをバッチ表示
      showBatch();
    } else {
      // 全員個別公開済み → 完了
      showComplete();
    }
    return;
  }

  runRoulette(currentRevealIndex.value);
};

const showBatch = () => {
  phase.value = 'batch';
  const remaining = props.winners.slice(individualCount.value);
  batchWinners.value = remaining;

  // 残り全員をrevealedWinnersに追加（少しずつ追加するアニメーション）
  let i = 0;
  const addNext = () => {
    if (i >= remaining.length) {
      // バッチ表示完了 → 完了フェーズへ
      timeoutId = setTimeout(() => showComplete(), 1000);
      return;
    }
    revealedWinners.value = [...revealedWinners.value, remaining[i]];
    i++;
    timeoutId = setTimeout(addNext, 100);
  };

  addNext();
};

const showComplete = () => {
  phase.value = 'complete';
  timeoutId = setTimeout(() => emit('complete'), 2000);
};

const startRevealing = () => {
  if (props.winners.length === 0) {
    emit('complete');
    return;
  }

  phase.value = 'revealing';
  currentRevealIndex.value = 0;
  revealNext();
};

const startCountdown = () => {
  if (names.value.length === 0) {
    emit('complete');
    return;
  }

  phase.value = 'countdown';
  countdownNum.value = 3;

  // 3 → 2 → 1 → revealing
  timeoutId = setTimeout(() => {
    countdownNum.value = 2;
    timeoutId = setTimeout(() => {
      countdownNum.value = 1;
      timeoutId = setTimeout(() => startRevealing(), 1000);
    }, 1000);
  }, 1000);
};

onMounted(() => startCountdown());
onBeforeUnmount(() => cleanup());
</script>
