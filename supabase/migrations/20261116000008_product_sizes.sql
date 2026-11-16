-- Sizes a hardware product comes in (one per entry), shown as chips on the website
-- and picked by the customer in the product inquiry form.
alter table imhcc.products add column if not exists sizes text[] not null default '{}';

-- Common market sizes for the starter catalog. Only fills products that have no sizes yet;
-- the owner can edit them in the dashboard.
update imhcc.products set sizes = array['Gypsum board 4 x 8 ft (1.22 x 2.44 m), 9 mm', 'Gypsum board 4 x 8 ft (1.22 x 2.44 m), 12 mm', 'PVC ceiling slat 20 cm x 2.9 m', 'PVC ceiling slat 20 cm x 5.95 m']
  where name = 'Ceiling materials' and sizes = '{}';
update imhcc.products set sizes = array['16 cm x 2.9 m', '21.9 cm x 2.9 m']
  where name = 'Fluted panels' and sizes = '{}';
update imhcc.products set sizes = array['4 x 8 ft (1.22 x 2.44 m), 2.5 mm', '4 x 8 ft (1.22 x 2.44 m), 3 mm']
  where name = 'Marble sheets' and sizes = '{}';
update imhcc.products set sizes = array['1"', '1 1/2"', '2"', '2 1/2"', '3"', '4"']
  where name = 'Paint Brush' and sizes = '{}';
update imhcc.products set sizes = array['25 cm x 2.9 m', '25 cm x 5.95 m', '30 cm x 2.9 m']
  where name = 'PVC wall panels' and sizes = '{}';
