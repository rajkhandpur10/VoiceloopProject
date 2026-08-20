create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  review_text text not null,
  rating integer,
  review_date date,
  source text,
  reviewer_name text,
  sentiment text,
  theme text,
  created_at timestamp with time zone not null default now(),

  constraint reviews_review_text_not_blank
    check (length(btrim(review_text)) > 0),
  constraint reviews_rating_range
    check (rating is null or rating between 1 and 5),
  constraint reviews_sentiment_values
    check (
      sentiment is null
      or sentiment in ('positive', 'negative', 'neutral')
    )
);

create index reviews_created_at_idx
  on public.reviews (created_at desc);

create index reviews_review_date_idx
  on public.reviews (review_date desc nulls last);

create index reviews_source_idx
  on public.reviews (source)
  where source is not null;

alter table public.reviews enable row level security;

create policy "Public clients can read reviews"
  on public.reviews
  for select
  to anon, authenticated
  using (true);

create policy "Public clients can insert reviews"
  on public.reviews
  for insert
  to anon, authenticated
  with check (true);
