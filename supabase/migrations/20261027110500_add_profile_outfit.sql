alter table public.profiles
  add column if not exists outfit jsonb not null default '{}'::jsonb;

comment on column public.profiles.outfit is
  'Saved character wardrobe: skin tone, hair style/colour, clothing and accessories.';
