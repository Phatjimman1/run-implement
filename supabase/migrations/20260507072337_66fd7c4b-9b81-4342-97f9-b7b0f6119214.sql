
insert into storage.buckets (id, name, public)
values ('condition-overlays', 'condition-overlays', true)
on conflict (id) do nothing;

create policy "condition-overlays public read"
on storage.objects for select
using (bucket_id = 'condition-overlays');
