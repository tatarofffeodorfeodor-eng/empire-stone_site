-- ============================================================================
-- Империя камня — схема базы данных (Supabase / Postgres)
--
-- Как применить:
--   1. Создайте проект на https://supabase.com (бесплатный тариф достаточен).
--   2. Откройте SQL Editor в панели проекта → вставьте этот файл целиком → Run.
--   3. Создайте пользователя-админа: Authentication → Users → Add user
--      (email + пароль, которым вы будете входить в /#admin на сайте).
--   4. Внизу этого файла есть одна строка — выполните её отдельно, подставив
--      email администратора, чтобы выдать ему права admin (см. раздел
--      "Шаг 4" в самом низу).
--   5. Settings → API — скопируйте Project URL и anon public key в .env сайта
--      (см. .env.example), а Project URL + service_role key — в переменные
--      окружения Netlify (Site configuration → Environment variables).
-- ============================================================================

create extension if not exists pgcrypto; -- для gen_random_uuid()

-- ----------------------------------------------------------------------------
-- Кто администратор сайта. Отдельная таблица (а не просто "первый юзер"),
-- потому что так проще дать доступ второму человеку позже — одна строка.
-- ----------------------------------------------------------------------------
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

-- Таблицу admins со стороны браузера не читаем и не пишем напрямую —
-- RLS включаем без единой policy, то есть доступ закрыт для anon/authenticated
-- полностью (service-role из серверных функций всё равно обходит RLS).
alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(select 1 from public.admins where user_id = auth.uid());
$$;

-- is_admin() помечена security definer, поэтому может читать admins даже
-- у вызывающего без доступа к таблице — открываем сам вызов функции, чтобы
-- клиентский код мог спросить "я админ?" через supabase.rpc('is_admin').
grant execute on function public.is_admin() to anon, authenticated;

-- ----------------------------------------------------------------------------
-- Камень: цена за м³. Набор материалов (g/d/s/r/k/q) фиксирован — он зашит
-- в логику калькулятора на сайте, — редактируются только name и price_per_m3.
-- ----------------------------------------------------------------------------
create table if not exists public.materials (
  key text primary key,
  name text not null,
  price_per_m3 numeric not null default 0,
  chamfer_rate numeric not null default 180 -- ставка фаски, ₽/пог.м (общая для всех, хранится в строке 'g' как единое число)
);

alter table public.materials enable row level security;

drop policy if exists "materials_select_all" on public.materials;
create policy "materials_select_all" on public.materials for select using (true);

drop policy if exists "materials_write_admin" on public.materials;
create policy "materials_write_admin" on public.materials for update
  using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- Каталог товаров.
-- ----------------------------------------------------------------------------
create table if not exists public.products (
  id bigint generated always as identity primary key,
  name text not null,
  price numeric not null default 0,
  category text not null,
  material text references public.materials(key),
  image text,
  tag text,
  created_at timestamptz not null default now()
);

alter table public.products enable row level security;

drop policy if exists "products_select_all" on public.products;
create policy "products_select_all" on public.products for select using (true);

drop policy if exists "products_write_admin" on public.products;
create policy "products_write_admin" on public.products for all
  using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- Фото выполненных работ («Наши работы»).
-- ----------------------------------------------------------------------------
create table if not exists public.gallery (
  id bigint generated always as identity primary key,
  src text not null,
  caption text not null default '',
  position int not null default 0,
  lat double precision, -- координаты объекта для карты на "Наши работы" — необязательны
  lng double precision,
  created_at timestamptz not null default now()
);

alter table public.gallery enable row level security;

drop policy if exists "gallery_select_all" on public.gallery;
create policy "gallery_select_all" on public.gallery for select using (true);

drop policy if exists "gallery_write_admin" on public.gallery;
create policy "gallery_write_admin" on public.gallery for all
  using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- Заявки на обратный звонок. Любой посетитель может создать (отправить форму),
-- но видеть и удалять список может только админ — иначе любой читал бы чужие
-- телефоны через публичный API.
-- ----------------------------------------------------------------------------
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  name text,
  created_at timestamptz not null default now()
);

alter table public.leads enable row level security;

drop policy if exists "leads_insert_all" on public.leads;
create policy "leads_insert_all" on public.leads for insert with check (true);

drop policy if exists "leads_read_admin" on public.leads;
create policy "leads_read_admin" on public.leads for select using (public.is_admin());

drop policy if exists "leads_delete_admin" on public.leads;
create policy "leads_delete_admin" on public.leads for delete using (public.is_admin());

-- ----------------------------------------------------------------------------
-- Заказы из корзины. order_no — читаемый номер заказа, растёт сам.
-- Публичный SELECT НЕ открываем (иначе кто угодно мог бы прочитать все
-- заказы всех покупателей по API) — личный кабинет получает свои заказы
-- через серверную функцию Netlify (service-role ключ, фильтр по телефону).
-- ----------------------------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_no bigint generated always as identity (start with 1001),
  phone text not null,
  items jsonb not null default '[]'::jsonb,
  total numeric not null default 0,
  -- Этапы для таймлайна в личном кабинете: принят → подобран камень → гравировка/обработка → готов → выдан/доставлен.
  status text not null default 'new' check (status in ('new', 'material', 'engraving', 'ready', 'done')),
  created_at timestamptz not null default now()
);

alter table public.orders enable row level security;

drop policy if exists "orders_insert_all" on public.orders;
create policy "orders_insert_all" on public.orders for insert with check (true);

drop policy if exists "orders_admin_all" on public.orders;
create policy "orders_admin_all" on public.orders for all
  using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- Посетители, вошедшие в кабинет (по телефону) — для вкладки "Пользователи"
-- в админке: кто заходил, когда первый/последний раз, сколько раз, сколько
-- суммарно провёл времени на сайте. Пишет это ТОЛЬКО серверная функция
-- netlify/functions/track-visit.js через service-role ключ — поэтому RLS
-- включена без единой policy (anon/authenticated доступа не имеют вообще,
-- даже на чтение: в этой таблице номера телефонов всех клиентов).
-- telegram_chat_id/telegram_link_token — задел под уведомления в Telegram
-- (опционально подключается самим клиентом, см. README).
-- ----------------------------------------------------------------------------
create table if not exists public.visitors (
  phone text primary key,
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  visits_count int not null default 1,
  time_spent_seconds bigint not null default 0,
  telegram_chat_id text,
  telegram_link_token text
);

alter table public.visitors enable row level security;

-- ----------------------------------------------------------------------------
-- Отзывы клиентов (с фото) — оставляет сам покупатель через форму на сайте
-- (без логина), админ может их удалить (модерация постфактум); показываются
-- на "Наши работы" всем посетителям.
-- ----------------------------------------------------------------------------
create table if not exists public.reviews (
  id bigint generated always as identity primary key,
  author_name text not null,
  rating int not null default 5 check (rating between 1 and 5),
  text text not null,
  photo_url text,
  created_at timestamptz not null default now()
);

alter table public.reviews enable row level security;

drop policy if exists "reviews_select_all" on public.reviews;
create policy "reviews_select_all" on public.reviews for select using (true);

-- Отзыв теперь оставляет сам покупатель через форму на сайте (без логина) —
-- поэтому insert открыт всем, а не только админу. Админ может редактировать/
-- удалять (модерация), но публикует отзыв сам посетитель.
drop policy if exists "reviews_insert_all" on public.reviews;
create policy "reviews_insert_all" on public.reviews for insert with check (true);

drop policy if exists "reviews_write_admin" on public.reviews;
drop policy if exists "reviews_admin_update_delete" on public.reviews;
create policy "reviews_admin_update_delete" on public.reviews for all
  using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- Заявки на индивидуальный проект (фото-эскиз + описание того, что хочет
-- клиент) — отдельно от обычных заказов каталога, т.к. тут нет ни цены,
-- ни готового товара, только бриф для менеджера.
-- ----------------------------------------------------------------------------
create table if not exists public.custom_orders (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  name text,
  description text not null,
  photo_url text,
  status text not null default 'new' check (status in ('new', 'in_review', 'done')),
  created_at timestamptz not null default now()
);

alter table public.custom_orders enable row level security;

drop policy if exists "custom_orders_insert_all" on public.custom_orders;
create policy "custom_orders_insert_all" on public.custom_orders for insert with check (true);

drop policy if exists "custom_orders_admin_all" on public.custom_orders;
create policy "custom_orders_admin_all" on public.custom_orders for all
  using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- Затравочные данные — те же товары/материалы/фото, что раньше жили прямо в
-- коде сайта (src/data/*.js). Если таблицы уже заполнены — ничего не трогаем.
-- ----------------------------------------------------------------------------
insert into public.materials (key, name, price_per_m3, chamfer_rate) values
  ('g', 'Габбро-диабаз',     778650, 180),
  ('d', 'Дымовский гранит',  689040, 180),
  ('s', 'Сибирский гранит',  437900, 180),
  ('r', 'Кордайский гранит', 669900, 180),
  ('k', 'Мрамор Коелга',     480000, 180),
  ('q', 'Серый мрамор',      340000, 180)
on conflict (key) do nothing;

insert into public.products (name, price, category, material, image, tag) values
  ('Памятник из гранита простой АртГ00001', 12380, 'Памятники', 'g', 'https://granit-tmb.ru/wp-content/uploads/2023/02/АртГ0001.jpg', null),
  ('Памятник из мрамора Коелга АртМ0034', 51500, 'Памятники', 'k', 'https://granit-tmb.ru/wp-content/uploads/2023/03/АртМ0034-e1697616320348.jpg', 'Спецпредложение'),
  ('Памятник из красного гранита АртВ00093-18', 27000, 'Памятники', 'r', 'https://granit-tmb.ru/wp-content/uploads/2023/07/Арт00093-18-2-e1697608884469.jpeg', null),
  ('Памятник из гранита фигурный АртГ00005', 48000, 'Памятники', 'd', 'https://granit-tmb.ru/wp-content/uploads/2023/02/АртЭ0005.jpg', null),
  ('Ваза из гранита Габбро-диабаз, h=30 см', 4500, 'Для могилы', 'g', 'https://granit-tmb.ru/wp-content/uploads/2023/04/РВ0007-Ваза-гранит.jpg', 'Спецпредложение'),
  ('Плитка 300×300×20 мм, Дымовский гранит', 7500, 'Плитка', 'd', 'https://granit-tmb.ru/wp-content/uploads/2023/01/Гранит-Дымовский-4-scaled.jpg', 'Акция'),
  ('Камин из мрамора Коелга', 220000, 'Камины', 'k', 'https://granit-tmb.ru/wp-content/uploads/2023/02/На-продажу-scaled.jpg', null)
on conflict do nothing;

insert into public.gallery (src, caption, position) values
  ('/img/work-01.jpg', 'Ландшафтные гранитные ступени с цветниками', 1),
  ('/img/work-02.jpg', 'Крыльцо: гранитные ступени и белое балясное ограждение', 2),
  ('/img/work-03.jpg', 'Ступени с белым балясным ограждением, вид сверху', 3),
  ('/img/work-04.jpg', 'Гранитная лестница с коваными перилами', 4),
  ('/img/work-05.jpg', 'Барбекю-комплекс с гранитными столешницами', 5),
  ('/img/work-06.jpg', 'Столешница-лавка из тёмного гранита у камина', 6),
  ('/img/work-07.jpg', 'Ступени из розово-бежевого гранита', 7),
  ('/img/work-08.jpg', 'Ступени из тёмного гранита с мраморной облицовкой', 8),
  ('/img/work-09.jpg', 'Ступени из гранита с вечерней подсветкой', 9),
  ('/img/work-10.jpg', 'Кухонный стол из гранита', 10),
  ('/img/work-11.jpg', 'Столешница-лавка из тёмного гранита у камина, вид 2', 11),
  ('/img/work-12.jpg', 'Кухонная столешница и фартук из гранита', 12),
  ('/img/work-13.jpg', 'Гранитная столешница на кухне', 13),
  ('/img/work-14.jpg', 'Летняя кухня с гранитной столешницей', 14),
  ('/img/work-15.jpg', 'Ступени из тёмного гранита, вечерний вид', 15),
  ('/img/work-16.jpg', 'Широкие ступени из гранита на закате', 16),
  ('/img/work-17.jpg', 'Столешница барбекю-комплекса из гранита', 17),
  ('/img/work-18.jpg', 'Широкие гранитные ступени, вечернее освещение', 18)
on conflict do nothing;

-- ----------------------------------------------------------------------------
-- Хранилище файлов — фото новых работ, которые админ будет добавлять через
-- сайт (вместо прежнего "сохранить картинку как текст в base64").
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('gallery-photos', 'gallery-photos', true)
on conflict (id) do nothing;

drop policy if exists "gallery_photos_public_read" on storage.objects;
create policy "gallery_photos_public_read" on storage.objects for select
  using (bucket_id = 'gallery-photos');

drop policy if exists "gallery_photos_admin_write" on storage.objects;
create policy "gallery_photos_admin_write" on storage.objects for insert
  with check (bucket_id = 'gallery-photos' and public.is_admin());

drop policy if exists "gallery_photos_admin_delete" on storage.objects;
create policy "gallery_photos_admin_delete" on storage.objects for delete
  using (bucket_id = 'gallery-photos' and public.is_admin());

-- Фото к отзывам — загружает сам покупатель через форму отзыва (без логина).
insert into storage.buckets (id, name, public)
values ('review-photos', 'review-photos', true)
on conflict (id) do nothing;

drop policy if exists "review_photos_public_read" on storage.objects;
create policy "review_photos_public_read" on storage.objects for select
  using (bucket_id = 'review-photos');

drop policy if exists "review_photos_admin_write" on storage.objects;
drop policy if exists "review_photos_public_insert" on storage.objects;
create policy "review_photos_public_insert" on storage.objects for insert
  with check (bucket_id = 'review-photos');

drop policy if exists "review_photos_admin_delete" on storage.objects;
create policy "review_photos_admin_delete" on storage.objects for delete
  using (bucket_id = 'review-photos' and public.is_admin());

-- Фото-эскизы к индивидуальным заявкам — загружает сам посетитель (форма
-- без логина), читает потом только админ по прямой ссылке в панели; бакет
-- публичный (иначе пришлось бы городить подписанные ссылки), но без
-- листинга содержимого посторонним — имя файла никто не угадает.
insert into storage.buckets (id, name, public)
values ('custom-order-photos', 'custom-order-photos', true)
on conflict (id) do nothing;

drop policy if exists "custom_order_photos_public_read" on storage.objects;
create policy "custom_order_photos_public_read" on storage.objects for select
  using (bucket_id = 'custom-order-photos');

drop policy if exists "custom_order_photos_public_insert" on storage.objects;
create policy "custom_order_photos_public_insert" on storage.objects for insert
  with check (bucket_id = 'custom-order-photos');

drop policy if exists "custom_order_photos_admin_delete" on storage.objects;
create policy "custom_order_photos_admin_delete" on storage.objects for delete
  using (bucket_id = 'custom-order-photos' and public.is_admin());

-- ============================================================================
-- Шаг 4 (выполнить ОТДЕЛЬНО, после того как создали пользователя в
-- Authentication → Users → Add user): сделать его админом сайта.
-- Замените email на тот, что указали при создании пользователя.
-- ============================================================================
-- insert into public.admins (user_id)
-- select id from auth.users where email = 'owner@example.com';
