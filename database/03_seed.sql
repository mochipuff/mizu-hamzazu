insert into public.site_settings (key, enabled) values ('guerilla_mode', false) on conflict (key) do nothing;

insert into public.likes_dislikes (kind, label, sort_order)
select kind, jsonb_build_object('en', en, 'jp', jp, 'id', id), sort_order
from (
  values
    ('like', 'Valorant', 'Valorant', 'Valorant', 1),
    ('like', 'Minecraft', 'Minecraft', 'Minecraft', 2),
    ('like', 'Tomodachi Life', 'トモダチコレクション', 'Tomodachi Life', 3),
    ('like', 'Sushi', 'お寿司', 'Sushi', 4),
    ('like', 'Cimol', 'Cimol（揚げタピオカ団子）', 'Cimol', 5),
    ('like', 'Spicy food', '辛いもの', 'Makanan pedas', 6),
    ('like', 'Matcha', '抹茶', 'Matcha', 7),
    ('like', 'Coffee', 'コーヒー', 'Kopi', 8),
    ('like', 'Teazzi', 'Teazzi', 'Teazzi', 9),
    ('dislike', 'Insects', '虫', 'Serangga', 1),
    ('dislike', 'Horror games', 'ホラーゲーム', 'Game horor', 2),
    ('dislike', 'Thunderstorms', '雷', 'Badai petir', 3),
    ('dislike', 'Mint-flavored food', 'ミント味の食べ物', 'Makanan mint', 4)
) as v (kind, en, jp, id, sort_order)
where not exists (select 1 from public.likes_dislikes);

insert into public.stream_slots (id, title, description, datetime, duration_minutes, platform, thumbnail_url) values
  ('untilthen', '🔴『UNTIL THEN』kelanjutan setelah ketemu anak baru', '{"en": "Game Stream", "jp": "ゲーム生配信スケジュール", "id": "Stream main game"}', '2026-10-15 08:00+07', 180, 'youtube', 'https://i.ytimg.com/vi/S6PD4T8H4Cw/maxresdefault.jpg'),
  ('thuriview', '#THUREVIEW vtuber fav', '{"en": "Reviewing YOUR Favorite VTubers!", "jp": "みんなの推しV紹介！", "id": "Review VTuber Favorit Kamu!"}', '2026-10-15 15:30+07', 180, 'youtube', null)
on conflict (id) do nothing;
