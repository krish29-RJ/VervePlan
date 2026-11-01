-- ============================================================================
-- UtsavAI — Illustrative Seed Data (supabase/seed.sql)
-- Note: All vendors, prices, and guests below are explicitly marked as
-- illustrative sample data for demonstration and testing.
-- ============================================================================

-- When seeding a local Supabase project with a test user UUID:
-- Replace '00000000-0000-0000-0000-000000000001' with your authenticated user ID if needed.

insert into public.profiles (id, display_name, email)
values ('00000000-0000-0000-0000-000000000001', 'Aarav Sharma (Demo Host)', 'demo@utsavai.local')
on conflict (id) do nothing;

-- Demo Event 1: Elegant Garden Birthday (Bengaluru, 50 guests, ₹75,000)
insert into public.events (
  id, owner_id, title, event_type, description, event_date, location,
  guest_target, total_budget_minor, currency, theme, preferences_json, status, version
) values (
  '11111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000001',
  'Elegant Garden Birthday',
  'Birthday',
  'An intimate sunset garden birthday celebration in Bengaluru featuring acoustic live music, botanical tablescapes, and curated regional grazing tables.',
  (current_date + interval '28 days')::date,
  'Bengaluru, Karnataka (Outdoor Courtyard / Terrace)',
  50,
  7500000,
  'INR',
  'Sunset Garden',
  '{"atmosphere":"Warm, botanical, acoustic sunset evening","venuePreference":"Outdoor garden terrace","indoorOutdoor":"Outdoor","duration":"5 hours (5:00 PM - 10:00 PM)","colorPalette":["#7456E8","#FF8075","#F4C56A","#241D39"],"foodPreferences":"Contemporary vegetarian & fusion live counters","dietaryRequirements":"Vegetarian, Jain options, nut-free dessert station","entertainmentPreferences":"Live acoustic guitarist & curated sunset playlist","accessibilityRequirements":"Step-free garden lawn access and reserved elder seating","traditions":"Cake cutting at golden hour & gratitude toast","priorities":["Catering quality","Warm ambient lighting","Effortless guest flow"],"avoid":["Loud DJ bass","Plastic single-use decor"]}'::jsonb,
  'planning',
  1
) on conflict (id) do nothing;

-- Demo Event 2: Dream Wedding Celebration (Jaipur, 250 guests, ₹12,00,000)
insert into public.events (
  id, owner_id, title, event_type, description, event_date, location,
  guest_target, total_budget_minor, currency, theme, preferences_json, status, version
) values (
  '22222222-2222-2222-2222-222222222222',
  '00000000-0000-0000-0000-000000000001',
  'Dream Wedding Celebration',
  'Wedding',
  'A heritage-inspired wedding celebration in Jaipur blending classical architecture, marigold and jasmine florals, folk music ensembles, and royal Rajasthani hospitality.',
  (current_date + interval '75 days')::date,
  'Jaipur, Rajasthan (Heritage Haveli Courtyard)',
  250,
  120000000,
  'INR',
  'Royal Heritage',
  '{"atmosphere":"Regal, welcoming, timeless celebration","venuePreference":"Heritage Courtyard","indoorOutdoor":"Hybrid","duration":"2 Days","colorPalette":["#4934A6","#F4C56A","#FF8075","#FAF8FF"],"foodPreferences":"Multi-cuisine royal buffet with traditional chaat & thali stations","dietaryRequirements":"Vegetarian, Jain, Gluten-free options","entertainmentPreferences":"Folk instrumental welcome, Sangeet choreography, live band","accessibilityRequirements":"Golf cart transfers, ramps, quiet lounge for seniors","traditions":"Varmala under floral mandap, morning pheras","priorities":["Photography","Hospitality","Venue ambiance"],"avoid":["Overcrowded buffet lines"]}'::jsonb,
  'planning',
  1
) on conflict (id) do nothing;

-- Demo Event 3: College Cultural Festival (Pune, 500 guests, ₹3,00,000)
insert into public.events (
  id, owner_id, title, event_type, description, event_date, location,
  guest_target, total_budget_minor, currency, theme, preferences_json, status, version
) values (
  '33333333-3333-3333-3333-333333333333',
  '00000000-0000-0000-0000-000000000001',
  'College Cultural Festival — Aarohan',
  'College Festival',
  'High-energy inter-collegiate cultural and music festival in Pune with battle of bands, street art installations, food trucks, and student creator showcases.',
  (current_date + interval '42 days')::date,
  'Pune, Maharashtra (Campus Amphitheatre & Lawns)',
  500,
  30000000,
  'INR',
  'Neon Carnival',
  '{"atmosphere":"Electric, youthful, creative festival vibe","venuePreference":"Open-air Campus Amphitheatre","indoorOutdoor":"Outdoor","duration":"10 hours (11:00 AM - 9:00 PM)","colorPalette":["#7456E8","#FF8075","#F4C56A","#241D39"],"foodPreferences":"Campus food stalls, grab-and-go wraps, cold brew & mocktail bars","dietaryRequirements":"Vegetarian, Vegan options","entertainmentPreferences":"Battle of bands, dance showcase, indie headliner","accessibilityRequirements":"Accessible stage viewing zone & clear signage","traditions":"Annual trophy handover & lantern finale","priorities":["Stage AV & sound","Crowd safety & barricading","Sponsorship booths"],"avoid":["Long registration queues"]}'::jsonb,
  'planning',
  1
) on conflict (id) do nothing;
