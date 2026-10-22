PROJECT_CONTEXT.md — Futsal Opponent Finder (Karachi)
Primary context document for AI coding agents. Read this fully before changing anything.
- Snapshot date: 2026-10-22 (Phase 10 complete — DB verified, lint/build verified, live Realtime bell test passed)
- Repo: https://github.com/UzairInf/Futstal-app (note the spelling: Futstal)
- Code verified against commit: d5c08ef — "Complete Phase 9: Ratings and Reputation". Phase 10 code is uncommitted at the time of writing.
- Database verified against: introspection query outputs supplied by the project owner (tables, constraints, indexes, generated-column expressions, function signatures + bodies, triggers, table RLS policies and flags, table/column grants, Storage object policies and buckets, extensions, role counts, Realtime publication membership, and anon/PUBLIC table-grant query results). Phase 10: RLS flag, RLS policy list, trigger list, Realtime publication membership, and grants all verified by owner-supplied query output (see §16).
Legend: ✅ verified from code or DB output · ⚠️ inferred (reasoned, not directly confirmed) · ⏳ pending verification (work exists, verification output not yet returned) · ❓ unknown (not available; do not assume)

0. TL;DR for agents
1. Frontend-only repo (Frontend/, React 19 + Vite + plain JS/JSX). Backend is Supabase (Postgres + Auth + Storage). There is no backend server and no SQL/migration files in the repo — the database schema lives only inside Supabase (see §5, §6, §13). Phase 10 SQL is recorded in §16 as the audit trail until a `supabase/` folder is introduced (§15.9).
2. All important writes go through SECURITY DEFINER RPC functions. Clients have almost no direct write privileges on tables. Do not "fix" a failing write by loosening grants/RLS; add or change an RPC instead.
3. All schema changes are run by the owner manually in the Supabase SQL Editor. Agents must output numbered SQL for the owner to run, never assume it was applied, and ask for output when verification is needed.
4. Times are always Asia/Karachi (UTC+5) in both the DB functions and the frontend helpers.
5. Never request or write secrets. Only VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are used by the frontend.
6. Current state: Phases 1–10 complete and fully verified. Phase 10 DB verified (table, RLS policy, both triggers, Realtime publication, grants — all confirmed by owner-supplied query output). Frontend lint ✅ (zero errors/warnings) and build ✅ (127 modules, 577 KB / 161 KB gzip; the >500 KB chunk warning is a Phase 11 code-splitting candidate, not a blocker). Live Realtime bell test ✅ passed (notification delivered in under 2 seconds without page reload; second trigger also confirmed via accept flow). Two pre-existing lint errors in Phase 5–6 files fixed during Phase 10 (§16b), behavior unchanged. Phase 11 (final testing, security audit, RLS audit, pagination/perf, mobile responsiveness, prod build, abuse reporting + owner-management process, deployment/migration docs) is next.

1. Project overview and goals
What it is: A web app for futsal players in Karachi, Pakistan to (a) browse and book futsal grounds, (b) post "I need an opponent" match requests, (c) respond to / accept opponents, (d) track match history, and (e) rate opponents to build reputation. Ground owners list grounds and manage bookings against them. An admin approves owner applications. ✅

User roles (profiles.role): player (default), owner, admin. ✅

Payments: none. Booking UI states "No online payment yet. Payment is handled with the ground." ✅

Roadmap context. The owner provided the specs for Phases 8–11. Titles/specs of Phases 1–7 were not provided (❓); what they covered is inferred from the code below.
Phase	Goal (as given by owner)	Status
1–7	❓ not provided. Code shows: auth, profiles + avatars, owner application + admin review, ground CRUD + photos, ground browse/filter, booking + availability, opponent requests/responses/accept	✅ implemented in code (phase numbering ⚠️ inferred)
8	Match History and Status — My Matches page, upcoming/past, cancellation + completion rules, auto-complete after booking end, opponent + ground details, prevent unauthorized status changes	✅ done (see §9 note: "completed" is derived, not stored)
9	Ratings and Reputation — 1–5 stars, optional review, showed-up flag, averages/reputation, public player stats, no duplicate/fake ratings	✅ done
10	Notifications — notify host on join request, notify responder on accept, notifications page/dropdown, mark as read, Supabase Realtime, permission tests	✅ done — table, RLS policy, both triggers, Realtime publication, and grants verified; frontend lint/build ✅; live Realtime bell test ✅ passed (see §16 for full verification log)
11	Final testing, security audit, RLS audit, pagination/perf, mobile responsiveness, prod build, abuse reporting + owner-management process, deployment/migration docs	❌ not started


2. Repository structure
/                         (repo root)
├── PROJECT_CONTEXT.md    <- this file
└── Frontend/
    ├── .env.example      (EMPTY file, 0 bytes — see §8)
    ├── .gitignore        (ignores node_modules, dist, .env, .env.* except .env.example)
    ├── README.md         (unmodified Vite template README)
    ├── eslint.config.js
    ├── index.html        (title "futsal-app"; links /favicon.svg — no public/ folder exists)
    ├── package.json / package-lock.json
    ├── vercel.json       (SPA rewrite: /(.*) -> /index.html)
    ├── vite.config.js    (only @vitejs/plugin-react)
    └── src/
        ├── main.jsx      (BrowserRouter > ToastProvider > AuthProvider > App)
        ├── App.jsx       (all routes)
        ├── styles/global.css           (single global stylesheet, ~860 lines + Phase 10 notification styles appended at end)
        ├── context/      authContext.js, toastContext.js
        ├── hooks/        useAuth.js, useToast.js
        ├── lib/          Supabase client + API wrappers + helpers (see below)
        ├── components/
        │   ├── auth/          AuthProvider, ProtectedRoute, RoleRoute
        │   ├── bookings/      BookingForm
        │   ├── grounds/       GroundForm, GroundListCard, PhotoCarousel
        │   ├── layout/        Layout, Navbar, Footer
        │   ├── notifications/ NotificationDropdown  ← NEW Phase 10
        │   ├── opponents/     MatchContact, RequestCard, RequestRespond, RequestResponses
        │   ├── ratings/       RateMatchForm, StarRating (Stars, StarInput)
        │   └── ui/            Avatar, ErrorMessage, Spinner (Spinner, PageLoader), ToastProvider
        └── pages/
            ├── Home, Login, Signup, Profile, PlayerProfile, BecomeOwner,
            │   AdminOwnerRequests, Grounds, GroundDetails, MyBookings, FindOpponent,
            │   NotFound
            ├── opponents/  MyMatches, MyRequests, MyResponses, RequestCreate
            └── owner/      MyGrounds, GroundCreate, GroundEdit, OwnerBookings

src/lib/ files ✅
File	Purpose
supabaseClient.js	Creates the single supabase client from VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY; throws if missing. Also sets window.supabase = supabase (debug leftover, see §13/§14).
bookingsApi.js	getAvailableSlots, createBooking, listMyBookings, cancelBooking, listOwnerBookings
groundsApi.js	Ground CRUD, photo upload/removal (bucket ground-photos), listActiveGrounds, getActiveGround, photoUrl, validatePhotoFile, MAX_PHOTOS=6, MAX_PHOTO_BYTES=3MB
matchRequestsApi.js	listOpenRequests, listMyRequests, createRequestFromBooking, createRequestManual, closeRequest
matchResponsesApi.js	respondToRequest, withdrawResponse, rejectResponse, acceptResponse, listResponsesToMyRequests, listMyResponses, listMyActiveResponses
matchesApi.js	listMyMatches, cancelMatch
ratingsApi.js	rateMatch, getPlayerStats
notificationsApi.js	← NEW Phase 10. fetchNotifications (SELECT with explicit columns, 50-row limit), markNotificationRead (RPC), subscribeToNotifications (Realtime channel with server-side filter user_id=eq.${userId}).
constants.js	AREAS, TEAM_SIZES ([5,6,7,8]), AMENITIES, PRICE_LIMITS, PHONE_RE, EMAIL_RE, SKILL_LEVELS, DURATION_OPTIONS, MIN_RATINGS_FOR_REPUTATION=3, REVIEW_MAX_LENGTH=500
karachiTime.js	Asia/Karachi date/time helpers (todayInKarachi, addDays, formatDay, formatRange, toKarachiIso, weekStart, …)
bookingStatus.js, matchStatus.js, responseStatus.js	Bucketing (upcoming/past/cancelled) and badge helpers
groundHours.js, matchFormat.js	Hours formatting, duration formatting, phoneHref


3. Technology stack and architecture
✅ from Frontend/package.json (versions as declared, caret ranges):
- React ^19.2.8, react-dom ^19.2.8
- react-router-dom ^7.18.4 (BrowserRouter, <Routes>, layout route with <Outlet>)
- @supabase/supabase-js ^2.118.0
- Vite ^8.3.0 + @vitejs/plugin-react ^6.1.1
- ESLint ^10.10.0 flat config with eslint-plugin-react-hooks ^7.1.1 and eslint-plugin-react-refresh
- Language: plain JavaScript (JSX), ES modules, no TypeScript
- Styling: one global CSS file (src/styles/global.css), CSS variables in :root, class-based (.btn, .card, .badge-*, .tabs, .alert-*, …). No CSS framework / UI library.
- No state library: React Context (auth, toast) + per-page useState/useEffect.
- No tests, no CI config in the repo ✅ (none found).
- Realtime: first and only usage is Phase 10 NotificationDropdown (Supabase Realtime channels via postgres_changes).
- Hosting: Vercel is implied by vercel.json (⚠️; actual project/URL/root-directory settings ❓).
Architecture: SPA → Supabase directly from the browser using the anon key and the signed-in user's JWT. Authorization is enforced by Postgres (RLS + column grants + RPC checks), not by the frontend. Frontend route guards are UX only.

4. Frontend routing, components, and features
4.1 Provider order (main.jsx)
React.StrictMode > BrowserRouter > ToastProvider > AuthProvider > App
4.2 Routes (App.jsx) ✅
Path	Component	Guard
/	Home	public
/login, /signup	Login, Signup	public (redirect away if logged in)
*	NotFound	public
/profile	Profile	ProtectedRoute
/become-owner	BecomeOwner	ProtectedRoute
/grounds	Grounds	ProtectedRoute
/grounds/:id	GroundDetails (+ BookingForm)	ProtectedRoute
/bookings	MyBookings	ProtectedRoute
/opponents	FindOpponent	ProtectedRoute
/opponents/new	RequestCreate	ProtectedRoute
/opponents/mine	MyRequests	ProtectedRoute
/opponents/responses	MyResponses	ProtectedRoute
/opponents/matches	MyMatches (cancel + rating UI)	ProtectedRoute
/players/:id	PlayerProfile (public stats)	ProtectedRoute
/owner/grounds	MyGrounds	ProtectedRoute + RoleRoute owner
/owner/grounds/new	GroundCreate	owner
/owner/grounds/:id/edit	GroundEdit	owner
/owner/bookings	OwnerBookings	owner
/admin/owner-requests	AdminOwnerRequests	RoleRoute admin


Notes ✅: /grounds and /opponents are behind login, but the Navbar shows "Grounds" and "Find opponent" to logged-out users too (they get redirected to /login with state.from). There is no Navbar link for admins; the admin page is reachable from the Profile page button ("Review owner requests"). Owners cannot book their own ground (UI message + DB rule). Phase 10 does NOT add a `/notifications` route — the notification feature is dropdown-only (Phase 10 spec allowed "page and/or dropdown"; dropdown was chosen because it fits the existing Navbar and avoids duplicating the tabbed-page pattern).

4.3 Auth & guards
- AuthProvider (components/auth/AuthProvider.jsx): supabase.auth.getSession() + onAuthStateChange; loads the user's profiles row (select * by id) whenever the user changes; exposes {session, user, loading, profile, profileLoading, profileError, refreshProfile, replaceProfile, signOut} via useAuth().
- ProtectedRoute: waits for loading, redirects to /login with state.from.
- RoleRoute allow={[...]}: waits for the profile; shows "Access denied" if profile.role not allowed.
4.4 Feature inventory & status (all ✅ implemented unless noted)
- Signup/Login: email + password. Signup collects full name, area (required), password ≥ 8 chars; passes {full_name, area} as user metadata and emailRedirectTo: window.location.origin. Detects "existing email" via empty identities. Login handles email_not_confirmed (offers resend) and invalid_credentials. No password-reset / change-password / change-email UI exists.
- Profile: edit name/area/bio (300 chars), avatar upload (JPG/PNG/WebP ≤ 2 MB → bucket avatars, path <user_id>/<timestamp>.<ext>), old avatar removed best-effort.
- Become owner: player submits phone + message (10–500 chars) to owner_requests; one pending at a time; shows pending/rejected states.
- Admin owner requests: lists up to 100 requests with applicant name/area; approve/reject via RPC review_owner_request.
- Owner grounds: create/edit/activate/deactivate/delete (photos ≤ 6, ≤ 3 MB, bucket ground-photos, path <owner_id>/<uuid>.<ext>); delete blocked by FK if any booking exists (UI tells owner to deactivate).
- Grounds browse: filters (area, team size, max price, 24h) stored in URL search params; limit 60.
- Ground details + booking: week/day picker, hourly slot grid from RPC get_available_slots, multi-hour range selection (max 24), phone required, email/notes optional, 12-hour cancellation warning, Google Maps link.
- My bookings / Owner bookings: tabs Upcoming/Past/Cancelled; players cancel ≥12 h before start; owners cancel any time before start with optional reason (limit 100 each).
- Find opponent: open requests list with filters (area, skill, team size, date, "booking verified only"), "Respond" form (phone + optional message). Limit 60.
- Post request: either from an own confirmed upcoming booking ("✓ Booking verified") or manual (ground from list or typed name+area, date, time, duration 30–360 min, team size, skill).
- My requests: tabs Open/Matched/Closed; host sees responses, accepts (must give own phone) / declines, or closes request.
- My responses: tabs Pending/Accepted/Closed; withdraw pending; host phone shown after acceptance.
- My matches (Phase 8): tabs Upcoming/Past/Cancelled via list_my_matches; opponent info + phones (upcoming); cancel before start; "Happening now" badge.
- Ratings (Phase 9): on past matches: rate opponent 1–5, showed-up yes/no, optional review (≤500; only the rated player sees it); view rating the opponent gave you.
- Public player profile (/players/:id): name, area, bio, member since, matches played, average rating and show-up rate (only after ≥ 3 ratings), via RPC get_player_stats. Reviews are not public.
- Notifications (Phase 10) ✅ verified end-to-end: bell icon in Navbar (rendered only when signed in) opens a dropdown listing the 50 most recent notifications. Dropdown subscribes to Supabase Realtime (postgres_changes INSERT+UPDATE on public.notifications, server-side filter user_id=eq.${userId}) so the bell updates live without a page refresh. Clicking an item marks it read via the mark_notification_read RPC (optimistic UI with rollback on error) and navigates: new_response → /opponents/mine; response_accepted → /opponents/matches. Notification creation is trigger-only; clients have SELECT grant only (no direct writes).
- Home page: minimal placeholder (heading + two buttons). Footer: static text.

5. Supabase setup and database schema
Everything here is ✅ from the owner's introspection output unless marked. Schema public. No migration files exist in the repo.
5.1 Extensions ✅
btree_gist 1.7, pg_stat_statements 1.11, pgcrypto 1.3, plpgsql 1.0, supabase_vault 0.3.1, uuid-ossp 1.1. (No pg_cron ⇒ no scheduled jobs in the DB; "expiry/completion" is computed, not stored. pg_net/webhooks ❓.)
5.2 Tables
profiles — one row per auth user (created by trigger)
id uuid NN PK → auth.users(id) ON DELETE CASCADE · full_name text · created_at timestamptz NN default now() · updated_at timestamptz NN default now() · area text NN · bio text · avatar_url text · role text NN default 'player'

grounds
id uuid NN PK default gen_random_uuid() · owner_id uuid NN default auth.uid() → profiles(id) CASCADE · name text NN · area text NN · address text NN · hourly_price integer NN · team_size smallint NN · opening_time time NN · closing_time time NN · amenities text[] NN default '{}' · description text · photo_paths text[] NN default '{}' · is_active boolean NN default true · created_at, updated_at timestamptz NN default now() · is_24h boolean (generated always as (opening_time = closing_time)) ✅
is_24h is confirmed by the supplied information_schema.columns output as is_generated = ALWAYS, expression (opening_time = closing_time), with no column default. The query did not report the generated column's storage mode.

bookings
id uuid NN PK default gen_random_uuid() · ground_id uuid NN → grounds(id) ON DELETE RESTRICT · player_id uuid NN default auth.uid() → profiles(id) CASCADE · start_at timestamptz NN · end_at timestamptz NN · during tstzrange (generated always as tstzrange(start_at, end_at, '[)'::text)) · hourly_price integer NN · total_price integer NN · contact_phone text NN · contact_email text · notes text · status text NN default 'confirmed' · cancelled_by uuid → profiles(id) SET NULL · cancelled_at timestamptz · cancel_reason text · created_at timestamptz NN default now()
during is confirmed by the supplied information_schema.columns output as is_generated = ALWAYS, expression tstzrange(start_at, end_at, '[)'::text), with no column default. The half-open range [) includes the start instant and excludes the end instant. The query did not report the generated column's storage mode.

match_requests — a host's "looking for opponent" post
id uuid NN PK · host_id uuid NN default auth.uid() → profiles CASCADE · booking_id uuid → bookings(id) CASCADE · ground_id uuid → grounds(id) SET NULL · ground_name text NN · area text NN · starts_at timestamptz NN · ends_at timestamptz NN · team_size smallint NN · skill_level text NN · notes text · status text NN default 'open' · closed_at timestamptz · close_reason text · created_at timestamptz NN default now()

match_responses — a player's response to a request; an accepted response row is "the match" (its id is used as match_id everywhere)
id uuid NN PK · request_id uuid NN → match_requests CASCADE · responder_id uuid NN default auth.uid() → profiles CASCADE · message text · responder_phone text NN · host_phone text · status text NN default 'pending' · decided_at timestamptz · created_at timestamptz NN default now() · cancelled_by uuid → profiles SET NULL · cancelled_at timestamptz

match_ratings
id uuid NN PK · match_id uuid NN → match_responses(id) CASCADE · rater_id uuid NN → profiles CASCADE · ratee_id uuid NN → profiles CASCADE · stars smallint NN · showed_up boolean NN · review text · created_at timestamptz NN default now()

owner_requests
id uuid NN PK · user_id uuid NN default auth.uid() → profiles CASCADE · phone text NN · message text NN · status text NN default 'pending' · admin_note text · reviewed_by uuid → auth.users(id) SET NULL · reviewed_at timestamptz · created_at timestamptz NN default now()

notifications — Phase 10 ✅ (created by §16 Script 1; verified via §16 Script 6 queries 1 and 2)
id uuid NN PK default gen_random_uuid() · user_id uuid NN → profiles(id) ON DELETE CASCADE · type text NN CHECK (type IN ('new_response','response_accepted')) · title text NN · body text NN · link_request_id uuid nullable → match_requests(id) ON DELETE CASCADE · link_response_id uuid nullable → match_responses(id) ON DELETE CASCADE · is_read boolean NN default false · created_at timestamptz NN default now()
Design note: title/body NEVER contain phone numbers, full names, or any data masked by RPC column-grants. Only ground_name is embedded. If a future notification type needs to reference a person, use a generic phrase ("Someone responded…") and let the user click through to the authorized page.

5.3 Check / unique / exclusion constraints ✅ (names as in DB)
- bookings: status IN ('confirmed','cancelled'); (status='cancelled') = (cancelled_at IS NOT NULL); duration between 1 h and 24 h; start_at and end_at on the hour; hourly_price 100–100000; total_price = hourly_price * hours; phone regex ^[0-9+() -]{7,20}$; email regex + ≤254 chars; notes ≤300; cancel_reason ≤300; bookings_no_overlap: EXCLUDE USING gist (ground_id WITH =, during WITH &&) WHERE (status='confirmed') (prevents double booking).
- grounds: name 3–80; address 5–200; area 1–60; description ≤1000; hourly_price 100–100000; team_size 3–11; photos ≤ 6; grounds_photos_owner: photo_paths_valid(owner_id, photo_paths) (each path must start with <owner_id>/ and not contain ..); amenities ⊆ {floodlights, parking, washroom, changing_room, drinking_water, cafe, seating, first_aid, wifi}, ≤ 9.
- match_requests: status IN ('open','closed'); close_reason NULL or in (host,booking_cancelled,matched); (status='closed') = (closed_at IS NOT NULL); skill_level IN ('casual','intermediate','competitive'); team_size 3–11; ends_at > starts_at and ≤ 24 h; ground_name 2–80; area 1–60; notes ≤300; booking_id IS NULL OR ground_id IS NOT NULL.
- match_responses: status IN ('pending','accepted','rejected','withdrawn','closed','cancelled'); (status='pending') = (decided_at IS NULL); accepted ⇒ host_phone IS NOT NULL; phone regexes; message ≤300.
- match_ratings: rater_id <> ratee_id; stars 1–5; review ≤500; UNIQUE (match_id, rater_id).
- owner_requests: status in (pending,approved,rejected); message 10–500; admin_note ≤300; phone regex.
- profiles: role in (player,owner,admin); area 1–60; bio ≤300; full_name 1–80 or NULL; avatar_url NULL or matches ^https://[^/]+/storage/v1/object/public/avatars/.
- notifications (Phase 10): type IN ('new_response','response_accepted'). ✅ schema.
5.4 Indexes ✅ (besides PKs)
- bookings: (ground_id, start_at DESC), (player_id, start_at DESC), GiST (ground_id, during) WHERE status='confirmed'
- grounds: (is_active, area), (owner_id)
- match_requests: (host_id, created_at DESC), (starts_at) WHERE status='open', UNIQUE (booking_id) WHERE booking_id IS NOT NULL AND status='open' (one open request per booking)
- match_responses: UNIQUE (request_id) WHERE status='accepted' (only one accepted per request), UNIQUE (request_id, responder_id) WHERE status IN ('pending','accepted'), (request_id, created_at DESC), (responder_id, created_at DESC)
- match_ratings: UNIQUE (match_id, rater_id), (ratee_id), (rater_id)
- owner_requests: UNIQUE (user_id) WHERE status='pending', (status, created_at DESC)
- notifications (Phase 10) ✅: notifications_user_unread_idx on (user_id, is_read, created_at desc) — supports the dropdown query and the unread-count projection.
- ⚠️ Possible perf gap: no full index on match_requests.booking_id (only the partial unique index on open rows); the booking-cancel trigger joins on it for all statuses. Revisit in Phase 11.

6. Relationships, RLS, grants, functions, triggers
6.1 Relationship map
auth.users 1─1 profiles
profiles 1─* grounds (owner_id)            profiles 1─* bookings (player_id)
grounds  1─* bookings (RESTRICT)           bookings 1─* match_requests (booking_id, CASCADE)
profiles 1─* match_requests (host_id)      grounds 1─* match_requests (ground_id, SET NULL)
match_requests 1─* match_responses         profiles 1─* match_responses (responder_id)
match_responses 1─* match_ratings (≤ 2: one per participant)
profiles 1─* owner_requests (user_id)      auth.users 1─* owner_requests (reviewed_by)
profiles 1─* notifications (user_id)       notifications ─* match_requests (link_request_id, CASCADE) [Phase 10]
notifications ─* match_responses (link_response_id, CASCADE) [Phase 10]
6.2 RLS ✅ (all tables, including Phase 10)
RLS enabled on all 8 tables, not forced. Policies (all PERMISSIVE, role authenticated):
Table	Policy	Cmd	Rule
bookings	Players can read own bookings	SELECT	player_id = auth.uid()
bookings	Owners can read bookings at their grounds	SELECT	ground of the booking has owner_id = auth.uid()
grounds	Signed-in users can view active grounds	SELECT	is_active = true
grounds	Owners can read own grounds	SELECT	owner_id = auth.uid()
grounds	Players can view grounds they booked	SELECT	has_booking_at_ground(id) (lets players still see an inactive ground they booked)
grounds	Owners can create grounds	INSERT	check owner_id = auth.uid() AND is_owner()
grounds	Owners can update own grounds	UPDATE	using owner_id = auth.uid() AND is_owner(); check owner_id = auth.uid()
grounds	Owners can delete own grounds	DELETE	owner_id = auth.uid() AND is_owner()
match_requests	Hosts can read own requests	SELECT	host_id = auth.uid()
match_requests	Signed-in users can read open upcoming requests	SELECT	status='open' AND starts_at > now()
match_responses	Players can read own responses	SELECT	responder_id = auth.uid()
owner_requests	Players can submit an owner request	INSERT	check user_id = auth.uid() AND caller's role is player
owner_requests	Admins can read all owner requests	SELECT	is_admin()
owner_requests	Users can read own owner requests	SELECT	user_id = auth.uid()
profiles	Signed-in users can read profiles	SELECT	true (every authenticated user can read every profile row)
profiles	Users can read own profile	SELECT	id = auth.uid()
profiles	Admins can read all profiles	SELECT	is_admin()
profiles	Users can update own profile	UPDATE	using/check id = auth.uid()
notifications (Phase 10)	Users can read own notifications	SELECT	user_id = (select auth.uid()) — ✅ verified. Exactly one policy, no with_check (SELECT-only), role authenticated.


match_ratings has RLS enabled and no policies and no grants ⇒ completely inaccessible directly; only the SECURITY DEFINER RPCs (rate_match, list_my_matches, get_player_stats) touch it. ✅
Phase 10 notifications: RLS enabled ✅, exactly one policy (SELECT) ✅. No INSERT/UPDATE/DELETE policies. Reads restricted to the current user; writes only from SECURITY DEFINER triggers and mark_notification_read RPC.
No INSERT/DELETE policy on profiles, no write policies on bookings / match_requests / match_responses / match_ratings ⇒ those are written only via RPC/trigger. ✅
6.3 Table and column grants for authenticated ✅ (all tables)
Table	Table-level privileges
bookings	SELECT
grounds	SELECT, DELETE
match_requests	SELECT
owner_requests	SELECT
profiles	REFERENCES, SELECT, TRIGGER, TRUNCATE (see §14 — hardening item)
match_responses	none at table level
match_ratings	none
notifications (Phase 10)	SELECT only. anon: none. service_role: all (server-side only; never exposed to the browser). postgres: all (owner). ✅ verified.


Column-level grants:
- grounds: INSERT+UPDATE (aw) on name, area, address, hourly_price, team_size, opening_time, closing_time, amenities, description, photo_paths, is_active — not on owner_id, id, is_24h, timestamps.
- profiles: UPDATE (w) on full_name, area, avatar_url, bio — role is not client-writable.
- owner_requests: INSERT (a) on phone, message only.
- match_responses: SELECT only (r) on id, request_id, responder_id, message, status, decided_at, created_at — i.e. responder_phone, host_phone, cancelled_by, cancelled_at are not selectable directly. Phone numbers are only exposed through RPCs, and only once a response is accepted.
- notifications (Phase 10): no column-level grants at all. The SELECT table-level grant covers all columns; no write grants of any kind. Deliberate — mark-as-read goes through the RPC so the DB can enforce user_id = auth.uid() independently of RLS.
- The separate query for anon / PUBLIC privileges on public schema tables returned no rows. This records the query result only; it does not address function EXECUTE privileges or other schemas (see Appendix A).
6.4 Database functions (all in public)
All are SET search_path TO '' (fully schema-qualified inside). Unless noted: SECURITY DEFINER, EXECUTE granted to postgres, authenticated, service_role (not anon/PUBLIC). Plpgsql functions that RETURNS TABLE(response_id, request_id, status) use #variable_conflict use_column.
Function	Returns	Behaviour / rules (✅ from source)
create_booking(p_ground_id, p_start, p_hours, p_phone, p_email=null, p_notes=null)	bookings	Login required. 1–24 h; start on the hour; ≥ 1 h from now; ≤ 30 days ahead; phone/email validated; ground must be active; cannot book own ground; non-24h grounds: booking must fit inside one opening window (computed in Asia/Karachi, handles after-midnight closing); inserts with ground's current hourly_price; exclusion violation → error 'That time slot was just taken. Please pick another.' with errcode 23P01.
cancel_booking(p_booking_id, p_reason=null)	bookings	Locks row. Caller must be booking player or the ground's owner. Must be confirmed and not started. Players: ≥ 12 h before start. Owners: any time before start. Sets status='cancelled', cancelled_by, cancelled_at, cancel_reason (≤300).
get_available_slots(p_ground_id, p_date)	(slot_start, slot_status)	STABLE. Login required; active ground only. Status ∈ available / booked / unavailable (unavailable = earlier than next whole hour ≥ now+1h, or beyond now+30d). 24h grounds: midnight Karachi of p_date through +29 h. Others: opening window starting on p_date.
create_match_request_from_booking(p_booking_id, p_skill_level, p_notes=null)	match_requests	Booking must be caller's, confirmed, not started. Max 5 open upcoming requests per host. One open request per booking (friendly error on unique violation). Copies ground name/area/times/team size.
create_match_request_manual(p_starts_at, p_duration_minutes, p_team_size, p_skill_level, p_ground_id=null, p_ground_name=null, p_area=null, p_notes=null)	match_requests	Start ≥ 30 min from now and ≤ 30 days; duration 30–360 in 30-min steps; team 3–11; ground optional (must be active if given) else name 2–80 + area 1–60; max 5 open. booking_id = NULL (unverified).
close_match_request(p_request_id)	match_requests	Host only; open → closed, close_reason='host'.
respond_to_match_request(p_request_id, p_phone, p_message=null)	(response_id, request_id, status)	Share-locks the request. Not own request; request open and not started; max 10 pending responses per player; unique active response per request. Fires trg_notify_on_new_response on insert (§6.5).
withdraw_match_response(p_response_id)	table	Responder only; pending → withdrawn. Does NOT notify anyone.
reject_match_response(p_response_id)	table	Request's host only; pending → rejected. Does NOT notify the responder (deliberate Phase 10 scope: only accept triggers a notification).
accept_match_response(p_response_id, p_host_phone)	table	Host only. Locks request then response. Response must be pending, request open, not started; linked booking (if any) must still be confirmed; neither player may already have an accepted match overlapping that time (player_has_match_between). Sets response accepted + host_phone; closes request with close_reason='matched' (trigger then rejects all other pending responses). Fires trg_notify_on_response_accepted on the pending→accepted transition.
cancel_match(p_response_id)	table	Host or accepted responder. Only accepted matches, only before start. Sets response status='cancelled', cancelled_by, cancelled_at. The request stays closed/matched (not reopened). Does NOT notify.
list_my_matches()	big table	status IN ('accepted','cancelled') for rows where caller is host or responder; includes role ('host'/'player'), opponent name/area/avatar/id, opponent_phone/my_phone only when accepted, cancelled_by_me, cancelled_by_system (= cancelled with NULL cancelled_by), my/their stars+showed_up+review. Ordered starts_at DESC, limit 200.
list_my
