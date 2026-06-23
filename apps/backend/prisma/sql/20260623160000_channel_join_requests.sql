begin;

-- Guard Mode (chat_join_request) — VIP kanal/guruhga qo'shilish so'rovlari.
-- Bot so'rovni PENDING yozadi + foydalanuvchiga Mini App tugmali DM yuboradi;
-- foydalanuvchi ro'yxatdan/loyallikdan o'tgach API approveChatJoinRequest qiladi.
create table if not exists public.channel_join_requests (
  id               uuid primary key default gen_random_uuid(),
  chat_id          bigint not null,
  user_telegram_id bigint not null,
  user_id          uuid,
  status           text not null default 'PENDING',
  username         text,
  full_name        text,
  created_at       timestamptz not null default now(),
  decided_at       timestamptz,
  constraint channel_join_requests_chat_user_uniq unique (chat_id, user_telegram_id)
);

create index if not exists channel_join_requests_user_status_idx
  on public.channel_join_requests (user_telegram_id, status);

commit;
