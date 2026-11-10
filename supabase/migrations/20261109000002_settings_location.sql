-- Exact map pin of the shop, used for "directions from my location" on the contact page.
alter table imhcc.site_settings
  add column if not exists latitude double precision check (latitude between -90 and 90),
  add column if not exists longitude double precision check (longitude between -180 and 180);

update imhcc.site_settings set latitude = 10.8231, longitude = 122.5337 where id = 1 and latitude is null;
