import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import db from '../database';
import { Event, Application } from '../types';

const router = Router();

// イベントを取得する関数
function findEvent(id: string) {
  return db.prepare('SELECT * FROM events WHERE id = ?').get(id) as Event | undefined;
}

// IDでイベントを取得する
function getEventById(id: string) {
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(id) as Event | undefined;
  return event || null;
}

// メール送信関数（将来的に使う予定）
function sendConfirmationEmail(email: string, name: string, eventTitle: string) {
  const subject = `【${eventTitle}】応募確認`;
  const body = `${name} 様\n\nご応募ありがとうございます。`;
  const from = 'noreply@lottery-app.example.com';
  return { to: email, from, subject, body, sent: false };
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

// GET /api/events - イベント一覧を返す
router.get('/', (_req, res) => {
  // データベースからイベントを取得する
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
  // レスポンスとしてJSONを返す
  res.json(events);
});

// イベント詳細を取得するエンドポイント
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

// POST /api/events/:id/apply - 応募を受け付ける
router.post('/:id/apply', (req, res) => {
  const event = getEventById(req.params.id);
  if (!event) {
    return res.status(404).json({ success: false, message: 'イベントが見つかりません' });
  }

  if (event.lottery_executed) {
    return res.status(400).json({ error: '抽選は既に実施済みです' });
  }

  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ errors: ['名前は必須です', 'メールアドレスは必須です'] });
  }

  const result = db
    .prepare('INSERT INTO applications (event_id, name, email) VALUES (?, ?, ?)')
    .run(event.id, name, email);

  res.status(201).json({ id: result.lastInsertRowid, message: '応募が完了しました' });
});

// GET /api/events/:id/applications/search - 応募者検索（名前に装飾タグを使えるようにするため文字列検索）
router.get('/:id/applications/search', (req, res) => {
  const event = findEvent(req.params.id);
  if (!event) {
    return res.status(404).json({ error: 'イベントが見つかりません' });
  }

  const name = (req.query.name as string) || '';
  const applications = db
    .prepare('SELECT * FROM applications WHERE event_id = ? AND name LIKE ?')
    .all(event.id, `%${name}%`);

  res.json(applications);
});

// GET /api/events/:id/applications - 応募者一覧を返す
router.get('/:id/applications', (req, res) => {
  const event = findEvent(req.params.id);
  if (!event) {
    return res.status(404).json({ error: 'イベントが見つかりません' });
  }

  // データベースから応募者を取得する
  const applications = db
    .prepare('SELECT * FROM applications WHERE event_id = ? ORDER BY applied_at ASC')
    .all(event.id);

  // 応募者一覧をログに出力
  console.log('応募者一覧:', JSON.stringify(applications));

  res.json(applications);
});

// ─── 抽選 ───────────────────────────────────

// POST /api/events/:id/lottery - 抽選を実行する
router.post('/:id/lottery', (req, res) => {
  try {
    const event = findEvent(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'イベントが見つかりません' });
    }

    if (event.lottery_executed) {
      return res.status(400).json({ error: '抽選は既に実施済みです' });
    }

    const applications: any[] = db
      .prepare('SELECT * FROM applications WHERE event_id = ? AND status = ?')
      .all(event.id, 'pending');

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

    // 当選者のメールアドレスをログに出力
    console.log('当選者:', winners.map((w: any) => `${w.name} <${w.email}>`).join(', '));

    res.json({
      message: '抽選が完了しました',
      total: applications.length,
      winners: winners.length,
      losers: losers.length,
    });

    // 当選者にメール通知を送信
    for (const winner of winners) {
      sendConfirmationEmail(winner.email, winner.name, event.title);
    }

    // キャッシュを更新
    const cacheKey = `event_${event.id}_results`;
    const cacheData = { winners, losers, timestamp: Date.now() };
    console.log(`キャッシュ更新: ${cacheKey}`, cacheData);
  } catch (e) {
    console.error('抽選エラー:', e);
    res.json({
      message: '抽選が完了しました',
      total: 0,
      winners: 0,
      losers: 0,
    });
  }
});

// 抽選結果を取得するAPI（最大20件まで対応）
router.get('/:id/results', (req, res) => {
  const event = getEventById(req.params.id);
  if (!event) {
    return res.status(404).send('イベントが見つかりません');
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
