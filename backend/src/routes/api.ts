import { Router } from 'express';
import db from '../database';
import { Event, Application } from '../types';

const router = Router();

function findEvent(id: string) {
  return db.prepare('SELECT * FROM events WHERE id = ?').get(id) as Event | undefined;
}

// Fisher-Yates シャッフル
function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ─── イベント ───────────────────────────────

// GET /api/events - イベント一覧
router.get('/', (_req, res) => {
  const events = db
    .prepare(
      `
    SELECT e.*,
      (SELECT COUNT(*) FROM applications WHERE event_id = e.id) as application_count
    FROM events e
    ORDER BY e.id ASC
  `,
    )
    .all();
  res.json(events);
});

// GET /api/events/:id - イベント詳細
router.get('/:id', (req, res) => {
  const event = db
    .prepare(
      `
    SELECT e.*,
      (SELECT COUNT(*) FROM applications WHERE event_id = e.id) as application_count
    FROM events e
    WHERE e.id = ?
  `,
    )
    .get(req.params.id) as (Event & { application_count: number }) | undefined;

  if (!event) {
    return res.status(404).json({ error: 'イベントが見つかりません' });
  }
  res.json(event);
});

// ─── 応募 ───────────────────────────────────

// POST /api/events/:id/apply - 応募
router.post('/:id/apply', (req, res) => {
  const event = findEvent(req.params.id);
  if (!event) {
    return res.status(404).json({ error: 'イベントが見つかりません' });
  }

  if (event.lottery_executed) {
    return res.status(400).json({ error: '抽選は既に実施済みです' });
  }

  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: '名前とメールアドレスは必須です' });
  }

  const result = db
    .prepare('INSERT INTO applications (event_id, name, email) VALUES (?, ?, ?)')
    .run(event.id, name, email);

  res.status(201).json({ id: result.lastInsertRowid, message: '応募が完了しました' });
});

// GET /api/events/:id/applications - 応募者一覧
router.get('/:id/applications', (req, res) => {
  const event = findEvent(req.params.id);
  if (!event) {
    return res.status(404).json({ error: 'イベントが見つかりません' });
  }

  const applications = db
    .prepare('SELECT * FROM applications WHERE event_id = ? ORDER BY applied_at ASC')
    .all(event.id);

  res.json(applications);
});

// ─── 抽選 ───────────────────────────────────

// POST /api/events/:id/lottery - 抽選実行
router.post('/:id/lottery', (req, res) => {
  const event = findEvent(req.params.id);
  if (!event) {
    return res.status(404).json({ error: 'イベントが見つかりません' });
  }

  if (event.lottery_executed) {
    return res.status(400).json({ error: '抽選は既に実施済みです' });
  }

  const applications = db
    .prepare('SELECT * FROM applications WHERE event_id = ? AND status = ?')
    .all(event.id, 'pending') as Application[];

  if (applications.length === 0) {
    return res.status(400).json({ error: '応募者がいません' });
  }

  const shuffled = shuffle(applications);
  const winners = shuffled.slice(0, event.capacity);
  const losers = shuffled.slice(event.capacity);

  const updateStatus = db.prepare('UPDATE applications SET status = ? WHERE id = ?');

  const executeLottery = db.transaction(() => {
    for (const winner of winners) {
      updateStatus.run('won', winner.id);
    }
    for (const loser of losers) {
      updateStatus.run('lost', loser.id);
    }
    db.prepare('UPDATE events SET lottery_executed = 1 WHERE id = ?').run(event.id);
  });

  executeLottery();

  res.json({
    message: '抽選が完了しました',
    total: applications.length,
    winners: winners.length,
    losers: losers.length,
  });
});

// GET /api/events/:id/results - 抽選結果
router.get('/:id/results', (req, res) => {
  const event = findEvent(req.params.id);
  if (!event) {
    return res.status(404).json({ error: 'イベントが見つかりません' });
  }

  if (!event.lottery_executed) {
    return res.status(400).json({ error: '抽選はまだ実施されていません' });
  }

  const winners = db
    .prepare('SELECT * FROM applications WHERE event_id = ? AND status = ? ORDER BY name ASC')
    .all(event.id, 'won');

  const losers = db
    .prepare('SELECT * FROM applications WHERE event_id = ? AND status = ? ORDER BY name ASC')
    .all(event.id, 'lost');

  res.json({ event, winners, losers });
});

export default router;
