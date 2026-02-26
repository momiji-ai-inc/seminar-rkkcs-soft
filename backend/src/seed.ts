import db, { initializeDatabase } from './database';

initializeDatabase();

const existingEvents = db.prepare('SELECT COUNT(*) as count FROM events').get() as {
  count: number;
};

if (existingEvents.count > 0) {
  console.log('データは既に存在します。シードをスキップします。');
  process.exit(0);
}

const insertEvent = db.prepare(`
  INSERT INTO events (title, artist, venue, capacity)
  VALUES (?, ?, ?, ?)
`);

const events = [
  { title: 'YOASOBI ARENA TOUR 2026', artist: 'YOASOBI', venue: '東京ドーム', capacity: 3 },
  {
    title: 'Official髭男dism ONE-MAN LIVE',
    artist: 'Official髭男dism',
    venue: '横浜アリーナ',
    capacity: 4,
  },
  { title: 'あいみょん弾き語りTOUR', artist: 'あいみょん', venue: '大阪城ホール', capacity: 2 },
  { title: 'King Gnu Stadium Live', artist: 'King Gnu', venue: '日産スタジアム', capacity: 5 },
  {
    title: 'Mrs. GREEN APPLE FESTIVAL 2026',
    artist: 'Mrs. GREEN APPLE',
    venue: 'ZOZOマリンスタジアム',
    capacity: 3,
  },
];

const insertMany = db.transaction(() => {
  for (const event of events) {
    insertEvent.run(event.title, event.artist, event.venue, event.capacity);
  }
});

insertMany();
console.log(`${events.length}件のイベントデータを投入しました。`);

// デモ応募者を複数イベントに追加
const insertApplication = db.prepare(`
  INSERT INTO applications (event_id, name, email)
  VALUES (?, ?, ?)
`);

const demoApplicants: { eventId: number; name: string; email: string }[] = [
  // イベント1: YOASOBI
  { eventId: 1, name: '田中太郎', email: 'tanaka@example.com' },
  { eventId: 1, name: '佐藤花子', email: 'sato@example.com' },
  { eventId: 1, name: '鈴木一郎', email: 'suzuki@example.com' },
  { eventId: 1, name: '高橋美咲', email: 'takahashi@example.com' },
  { eventId: 1, name: '伊藤健太', email: 'ito@example.com' },
  { eventId: 1, name: '渡辺さくら', email: 'watanabe@example.com' },
  { eventId: 1, name: '山本大輝', email: 'yamamoto@example.com' },
  { eventId: 1, name: '中村あかり', email: 'nakamura@example.com' },
  // イベント2: Official髭男dism
  { eventId: 2, name: '小林拓海', email: 'kobayashi@example.com' },
  { eventId: 2, name: '加藤めぐみ', email: 'kato@example.com' },
  { eventId: 2, name: '吉田翔太', email: 'yoshida@example.com' },
  { eventId: 2, name: '山田あおい', email: 'yamada@example.com' },
  { eventId: 2, name: '松本蓮', email: 'matsumoto@example.com' },
  { eventId: 2, name: '井上結衣', email: 'inoue@example.com' },
  // イベント3: あいみょん
  { eventId: 3, name: '木村陽菜', email: 'kimura@example.com' },
  { eventId: 3, name: '林大地', email: 'hayashi@example.com' },
  { eventId: 3, name: '清水彩花', email: 'shimizu@example.com' },
  { eventId: 3, name: '森本悠人', email: 'morimoto@example.com' },
  { eventId: 3, name: '岡田ひなた', email: 'okada@example.com' },
];

const insertApplicants = db.transaction(() => {
  for (const app of demoApplicants) {
    insertApplication.run(app.eventId, app.name, app.email);
  }
});

insertApplicants();
const eventCount = new Set(demoApplicants.map((a) => a.eventId)).size;
console.log(`${demoApplicants.length}名のデモ応募者を${eventCount}件のイベントに追加しました。`);
