import axios from 'axios';
import { Event, Application, LotteryResult } from '@/types';

const api = axios.create({
  baseURL: '/api',
});

export async function getEvents(): Promise<Event[]> {
  const { data } = await api.get('/events');
  return data;
}

export async function getEvent(id: number): Promise<Event> {
  const { data } = await api.get(`/events/${id}`);
  return data;
}

export async function applyToEvent(
  id: number,
  form: { name: string; email: string },
): Promise<void> {
  await api.post(`/events/${id}/apply`, form);
}

export async function getApplications(id: number): Promise<Application[]> {
  const { data } = await api.get(`/events/${id}/applications`);
  return data;
}

export async function executeLottery(
  id: number,
): Promise<{ message: string; total: number; winners: number; losers: number }> {
  const { data } = await api.post(`/events/${id}/lottery`);
  return data;
}

export async function getResults(id: number): Promise<LotteryResult> {
  const { data } = await api.get(`/events/${id}/results`);
  return data;
}
