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

// YOASOBI イベント（ID=1）にデモ応募者を追加
const insertApplication = db.prepare(`
  INSERT INTO applications (event_id, name, email)
  VALUES (?, ?, ?)
`);

const demoApplicants = [
  { name: '田中太郎', email: 'tanaka@example.com' },
  { name: '佐藤花子', email: 'sato@example.com' },
  { name: '鈴木一郎', email: 'suzuki@example.com' },
  { name: '高橋美咲', email: 'takahashi@example.com' },
  { name: '伊藤健太', email: 'ito@example.com' },
  { name: '渡辺さくら', email: 'watanabe@example.com' },
  { name: '山本大輝', email: 'yamamoto@example.com' },
  { name: '中村あかり', email: 'nakamura@example.com' },
];

const insertApplicants = db.transaction(() => {
  for (const app of demoApplicants) {
    insertApplication.run(1, app.name, app.email);
  }
});

insertApplicants();
console.log(`${demoApplicants.length}名のデモ応募者を YOASOBI イベントに追加しました。`);
