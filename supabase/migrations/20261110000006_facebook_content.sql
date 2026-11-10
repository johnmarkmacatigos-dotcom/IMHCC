-- Content from the company's Facebook page (harvest of 2026-11-10, docs/reference/facebook-harvest.md).
-- Only changes rows the owner has not edited yet: each update checks that the old
-- starter text is still there, so nothing the owner typed in the dashboard is overwritten.
-- Safe to run more than once.

update imhcc.site_settings set
  hero_title = 'We design. We execute.',
  hero_subtitle = 'Your dream home starts here. From house construction to condo renovations, modular kitchens, and PVC ceilings, Iloilo Modern Homes brings your vision to life with quality workmanship, affordable rates, and on-time completion.'
where id = 1 and hero_title = 'Building your dreams, creating spaces that last.';

update imhcc.site_settings set phone_secondary = '0966 396 3855' where id = 1 and phone_secondary is null;

update imhcc.site_settings set
  facebook_url = 'https://www.facebook.com/modernhomesrose',
  messenger_url = 'https://m.me/modernhomesrose?ref=website'
where id = 1 and facebook_url = 'https://www.facebook.com/iloilomodernhomesconstructionco';

update imhcc.services set name = 'PVC ceilings and lighting', summary = 'PVC, gypsum, and wood ceilings with cove and accent lighting. Clean finish, on time.', description = 'PVC ceiling installation, drop ceilings, cove lighting, wood slat ceilings, and lighting layouts that make a room feel finished. Quality workmanship, affordable rates, a clean finish, and on-time completion. We handle framing, boarding, finishing, and the electrical work behind it.', scope = array['PVC ceiling installation', 'Gypsum board drop ceilings', 'Cove and LED strip lighting', 'Wood slat ceilings', 'Lighting layout and installation']::text[]
where slug = 'ceilings-and-lighting' and name = 'Ceilings and lighting';

update imhcc.services set name = 'House design and build', summary = 'We design. We execute. New houses from plans to turnover.', description = 'We design your house and build it, from the first floor plan and 3D concept to foundation, structure, roofing, and finishing. One team coordinates the plans, permits, and every trade, so you deal with one contractor from start to turnover.', scope = array['House design and 3D concepts', 'Foundation and structural works', 'Masonry and concrete', 'Roofing', 'Finishing and turnover']::text[]
where slug = 'residential-construction' and name = 'Residential construction';

update imhcc.services set name = 'Commercial fit-out', summary = 'Counters, cafés, offices, and shops built for business.', description = 'Fit-out and construction of cafés, reception and service counters, offices, shops, and rental spaces: wood-slat cladding, feature walls, track lighting, and backlit signage, planned to minimize downtime for your business.', scope = array['Café and reception counters', 'Office and store fit-outs', 'Feature walls and signage', 'Rental unit construction']::text[]
where slug = 'commercial-construction' and name = 'Commercial construction';

update imhcc.services set name = 'Home and condo renovation', summary = 'Don''t replace your home, transform it. From outdated to outstanding.', description = 'Whole-house, condo, or room-by-room renovation: layout changes, repairs, feature walls, ceilings, built-ins, and modern finishes that turn an outdated space into one you love coming home to.', scope = array['Condo unit makeovers', 'Layout changes', 'Repairs and restoration', 'Modern finishes']::text[]
where slug = 'renovation' and name = 'General renovation';

insert into imhcc.services (slug, name, category, summary, description, scope, cover_image, sort_order, is_featured, is_published) values ('phased-kitchen-renovation', 'Phased kitchen renovation', 'Renovation', 'Your dream kitchen, one phase at a time, according to your budget and priorities.', 'Not ready to redo the whole kitchen at once? We plan the full design up front, then build it in phases: cabinets first, then the countertop and backsplash, then the ceiling and lighting, or in whatever order fits your budget and priorities. Every phase is finished properly, so the kitchen looks complete at each step.', array['Full kitchen design up front', 'Phase-by-phase quotation', 'Modular cabinets', 'Countertops, backsplash, ceiling, and lighting']::text[], '/images/projects/white-kitchen-marble-counter.jpg', 10, false, true) on conflict (slug) do nothing;
insert into imhcc.services (slug, name, category, summary, description, scope, cover_image, sort_order, is_featured, is_published) values ('building-permit-assistance', 'Building permit assistance', 'Construction', 'We guide you through every permit step so nothing is missed.', 'Building a house in the Philippines takes paperwork: land title, signed plans, barangay clearance, the building permit, and fees. We walk you through each step under the National Building Code and prepare the plans your application needs. See the full checklist on our Resources page.', array['Land title check', 'Signed and sealed building plans', 'Barangay clearance', 'Building permit application', 'Permit fees and bond']::text[], '/images/projects/loft-bedroom.jpg', 11, false, true) on conflict (slug) do nothing;
