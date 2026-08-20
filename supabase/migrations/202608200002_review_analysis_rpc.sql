create or replace function public.update_review_analysis(
  p_id uuid,
  p_theme text,
  p_sentiment text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_count integer;
begin
  if p_theme not in (
    'Food Quality', 'Service Speed', 'Staff Friendliness', 'Wait Time',
    'Atmosphere', 'Cleanliness', 'Value', 'Parking',
    'Ordering / Delivery', 'Other'
  ) then
    raise exception 'Invalid review theme';
  end if;

  if p_sentiment not in ('positive', 'neutral', 'negative') then
    raise exception 'Invalid review sentiment';
  end if;

  update public.reviews
  set theme = p_theme, sentiment = p_sentiment
  where id = p_id and theme is null and sentiment is null;

  get diagnostics updated_count = row_count;
  return updated_count = 1;
end;
$$;

revoke all on function public.update_review_analysis(uuid, text, text) from public;
grant execute on function public.update_review_analysis(uuid, text, text) to anon, authenticated;

