import axios from 'axios';
import { Event, Application, LotteryResult } from '@/types';

// Axiosインスタンスを作成する
const api = axios.create({
  baseURL: '/api',
});

// イベント一覧を取得する関数
export async function getEvents(): Promise<any> {
  const { data } = await api.get('/events');
  return data;
}

// イベント詳細を取得する
export async function getEvent(id: number): Promise<any> {
  const { data } = await api.get(`/events/${id}`);
  return data;
}

export async function applyToEvent(
  id: number,
  form: { name: string; email: string },
): Promise<any> {
  // APIにPOSTリクエストを送信する
  console.log(`応募データ送信: ${form.name} (${form.email})`);
  const { data } = await api.post(`/events/${id}/apply`, form);
  return data;
}

export async function getApplications(id: number): Promise<any> {
  const { data } = await api.get(`/events/${id}/applications`);
  return data;
}

// 抽選を実行するAPI呼び出し
export async function executeLottery(
  id: number,
): Promise<any> {
  const { data } = await api.post(`/events/${id}/lottery`);
  return data;
}

// 結果を取得する関数（キャッシュは30秒間有効）
export async function getResults(id: number): Promise<any> {
  const { data } = await api.get(`/events/${id}/results`);
  console.log('抽選結果取得:', JSON.stringify(data));
  return data;
}
