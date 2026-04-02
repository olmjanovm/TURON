begin;

create table if not exists public.support_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  status text not null default 'OPEN',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  constraint support_threads_status_valid check (status in ('OPEN', 'RESOLVED', 'CLOSED'))
);

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.support_threads(id) on delete cascade,
  sender_role public.user_role_enum not null,
  sender_label text not null,
  message_text text not null,
  channel text not null default 'MINI_APP',
  telegram_chat_id bigint,
  telegram_message_id bigint,
  reply_to_telegram_message_id bigint,
  metadata jsonb,
  created_at timestamptz not null default now(),
  constraint support_messages_sender_label_not_blank check (btrim(sender_label) <> ''),
  constraint support_messages_text_not_blank check (btrim(message_text) <> ''),
  constraint support_messages_channel_valid check (channel in ('MINI_APP', 'TELEGRAM'))
);

create index if not exists idx_support_threads_user_order_last_message
  on public.support_threads(user_id, order_id, last_message_at desc);
create index if not exists idx_support_threads_last_message
  on public.support_threads(last_message_at desc);
create index if not exists idx_support_messages_thread_created_at
  on public.support_messages(thread_id, created_at asc);
create unique index if not exists ux_support_messages_telegram_message
  on public.support_messages(telegram_chat_id, telegram_message_id)
  where telegram_chat_id is not null and telegram_message_id is not null;

drop trigger if exists trg_support_threads_set_updated_at on public.support_threads;
create trigger trg_support_threads_set_updated_at
before update on public.support_threads
for each row
execute function public.set_updated_at();

commit;
