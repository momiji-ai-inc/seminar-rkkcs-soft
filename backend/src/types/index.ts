export interface Event {
  id: number;
  title: string;
  artist: string;
  venue: string;
  capacity: number;
  lottery_executed: number;
  created_at: string;
}

export interface Application {
  id: number;
  event_id: number;
  name: string;
  email: string;
  status: 'pending' | 'won' | 'lost';
  applied_at: string;
}
