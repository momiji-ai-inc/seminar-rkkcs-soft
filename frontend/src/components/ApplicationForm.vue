<template>
  <div class="card">
    <div class="card-body">
      <h5 class="fw-bold mb-3">応募フォーム</h5>

      <div v-if="submitted" class="text-center py-4">
        <div class="success-check mb-3">&#10003;</div>
        <h5 class="fw-bold text-success">応募が完了しました！</h5>
        <p class="text-muted mb-0">抽選結果をお楽しみに</p>
      </div>

      <div v-if="error" class="alert alert-danger">{{ error }}</div>

      <form v-if="!submitted" @submit.prevent="handleSubmit">
        <div class="form-floating mb-3">
          <input
            id="name"
            v-model="form.name"
            type="text"
            class="form-control"
            placeholder="氏名"
            required
          />
          <label for="name">氏名</label>
        </div>
        <div class="form-floating mb-3">
          <input
            id="email"
            v-model="form.email"
            type="email"
            class="form-control"
            placeholder="メールアドレス"
            required
          />
          <label for="email">メールアドレス</label>
        </div>
        <button type="submit" class="btn btn-primary w-100 py-2" :disabled="loading">
          {{ loading ? '送信中...' : '応募する' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { applyToEvent } from '@/services/api';

const props = defineProps<{ eventId: number }>();

const form = reactive({ name: '', email: '' });
const loading = ref(false);
const submitted = ref(false);
const error = ref('');

const handleSubmit = async () => {
  loading.value = true;
  error.value = '';
  try {
    await applyToEvent(props.eventId, form);
    submitted.value = true;
  } catch (e: any) {
    error.value = e.response?.data?.error || '応募に失敗しました';
  } finally {
    loading.value = false;
  }
};
</script>
