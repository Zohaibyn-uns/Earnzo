-- ==============================================================================
-- WATCH EARN — SEED DATA
-- ==============================================================================

-- 1. SEED DEFAULT RS. 300 MEMBERSHIP PLAN
INSERT INTO public.plans (
    id, name, description, price, duration_days, daily_task_limit, reward_per_task, min_withdrawal, max_withdrawal, withdrawal_fee_pct, is_active
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'WatchEarn Standard Membership',
    'Official 30-day verified member access to daily sponsored brand video tasks, platform reward credits, and prioritized localized withdrawals.',
    300.00,
    30,
    10,
    10.00,
    150.00,
    5000.00,
    2.50,
    TRUE
) ON CONFLICT (id) DO NOTHING;

-- 2. SEED VIDEO CAMPAIGNS
INSERT INTO public.video_campaigns (
    id, name, sponsor_name, description, total_budget, spent_budget, reward_per_completion, max_completions, status
) VALUES 
(
    '22222222-2222-2222-2222-222222222221',
    'SmartTech Ecosystem Launch',
    'SmartTech Pakistan',
    'Promoting our new affordable smart home accessories line with high-definition product trailers.',
    50000.00,
    4200.00,
    10.00,
    5000,
    'active'
),
(
    '22222222-2222-2222-2222-222222222222',
    'EduLearn Future Skills Program',
    'EduLearn Academy',
    'Spreading awareness for emerging AI & Web engineering scholarships for university students.',
    35000.00,
    2800.00,
    10.00,
    3500,
    'active'
),
(
    '22222222-2222-2222-2222-222222222223',
    'GreenEnergy Solar Inverter Campaign',
    'SolarTech Solutions',
    'Solar battery storage awareness campaign highlighting residential net-metering advantages.',
    40000.00,
    1950.00,
    15.00,
    2666,
    'active'
) ON CONFLICT (id) DO NOTHING;

-- 3. SEED SPONSORED VIDEOS
INSERT INTO public.videos (
    id, campaign_id, title, description, video_url, thumbnail_url, duration_seconds, reward_amount, daily_limit, per_user_limit, status, category, sponsor_badge
) VALUES 
(
    '33333333-3333-3333-3333-333333333331',
    '22222222-2222-2222-2222-222222222221',
    'Smart Living 2026: IoT Automation Preview',
    'Discover how seamless smart home automation makes everyday living energy-efficient and secure.',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    'https://images.unsplash.com/photo-1558002038-1055907df827?w=600&auto=format&fit=crop&q=80',
    30,
    10.00,
    500,
    1,
    'active',
    'Technology',
    'SmartTech Certified'
),
(
    '33333333-3333-3333-3333-333333333332',
    '22222222-2222-2222-2222-222222222222',
    'Full-Stack Developer Bootcamp 2026',
    'Learn how modern cloud architects build scalable digital systems in 12 intensive weeks.',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80',
    45,
    12.00,
    400,
    1,
    'active',
    'Education',
    'EduLearn Sponsor'
),
(
    '33333333-3333-3333-3333-333333333333',
    '22222222-2222-2222-2222-222222222223',
    'Zero-Electricity Bills with Hybrid Solar',
    'Understanding net metering, solar inverter efficiency, and clean renewable backup batteries.',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=600&auto=format&fit=crop&q=80',
    35,
    15.00,
    300,
    1,
    'active',
    'Clean Energy',
    'SolarTech Verified'
),
(
    '33333333-3333-3333-3333-333333333334',
    '22222222-2222-2222-2222-222222222221',
    'Next-Gen Active Noise Cancelling Earbuds',
    'Experience crystal-clear studio acoustics and all-day 48-hour battery longevity.',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
    'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80',
    30,
    10.00,
    600,
    1,
    'active',
    'Gadgets',
    'SmartTech Certified'
) ON CONFLICT (id) DO NOTHING;

-- 4. SEED THIRD-PARTY AD DISPLAY PLACEMENTS (Clearly marked, Non-Incentivized)
INSERT INTO public.ad_placements (
    id, title, placement, image_url, target_url, sponsor_name, is_active
) VALUES 
(
    '44444444-4444-4444-4444-444444444441',
    'Cloud Hosting Deals 2026',
    'dashboard',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
    'https://example.com/cloud-hosting',
    'GlobalHost Infrastructure',
    TRUE
),
(
    '44444444-4444-4444-4444-444444444442',
    'Modern Developer Productivity Tools',
    'sidebar',
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&auto=format&fit=crop&q=80',
    'https://example.com/dev-tools',
    'DevCraft Suite',
    TRUE
) ON CONFLICT (id) DO NOTHING;

-- 5. SEED SYSTEM SETTINGS
INSERT INTO public.settings (key, value, description) VALUES
('payment_destinations', '{
    "jazzcash": {"title": "WatchEarn Official Payouts", "number": "03001234567"},
    "easypaisa": {"title": "WatchEarn Corporate Operations", "number": "03451234567"},
    "bank": {"bank_name": "Meezan Bank Ltd", "title": "WatchEarn Technologies Pvt Ltd", "iban": "PK36MEZN0001234567890123"}
}', 'Authorized platform collection channels for membership fees'),
('fraud_thresholds', '{
    "max_daily_tasks": 10,
    "min_watch_percentage": 95,
    "max_concurrent_sessions": 1
}', 'Thresholds for anti-fraud detection engine')
ON CONFLICT (key) DO NOTHING;
