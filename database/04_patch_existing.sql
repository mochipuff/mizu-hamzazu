drop table if exists public.viewers_notes;

update public.likes_dislikes set label = label - 'kr' where label ? 'kr';
update public.stream_slots set description = description - 'kr' where description ? 'kr';

alter table public.likes_dislikes drop constraint if exists likes_dislikes_label_check;
alter table public.likes_dislikes add constraint likes_dislikes_label_check check (label ?& array['en', 'jp', 'id']);

alter table public.stream_slots drop constraint if exists stream_slots_description_check;
alter table public.stream_slots add constraint stream_slots_description_check check (description ?& array['en', 'jp', 'id']);

revoke all on public.likes_dislikes, public.fanarts, public.videos, public.stream_slots from anon, authenticated;
