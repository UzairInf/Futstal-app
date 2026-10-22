PROJECT_CONTEXT.md — Futsal Opponent Finder (Karachi)
Primary context document for AI coding agents. Read this fully before changing anything.
- Snapshot date: 2026-10-22
- Repo: https://github.com/UzairInf/Futstal-app (note the spelling: Futstal)
- Code verified against commit: d5c08ef — "Complete Phase 9: Ratings and Reputation" (only commit visible in a shallow clone; earlier history not inspected)
- Database verified against: introspection query outputs supplied by the project owner (tables, constraints, indexes, generated-column expressions, function signatures + bodies, triggers, table RLS policies and flags, table/column grants, Storage object policies and buckets, extensions, role counts, Realtime publication membership, and anon/PUBLIC table-grant query results).
Legend: ✅ verified from code or DB output · ⚠️ inferred (reasoned, not directly confirmed) · ❓ unknown (not available; do not assume)

0. TL;DR for agents
1. Frontend-only repo (Frontend/, React 19 + Vite + plain JS/JSX). Backend is Supabase (Postgres + Auth + Storage). There is no backend server and no SQL/migration files in the repo — the database schema lives only inside Supabase (see §5, §6, §13).
2. All important writes go through SECURITY DEFINER RPC functions. Clients have almost no direct write privileges on tables. Do not "fix" a failing write by loosening grants/RLS; add or change an RPC instead.
3. All schema changes are run by the owner manually in the Supabase SQL Editor. Agents must output numbered SQL for the owner to run, never assume it was applied, and ask for output when verification is needed.
4. Times are always Asia/Karachi (UTC+5) in both the DB functions and the frontend helpers.
5. Never request or write secrets. Only VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are used by the frontend.
6. Do not start building a new phase until the owner says to proceed. Current state: Phases 1–9 complete; Phase 10 (Notifications) is next.
1. Project overview and goals
What it is: A web app for futsal players in Karachi, Pakistan to (a) browse and book futsal grounds, (b) post "I need an opponent" match requests, (c) respond to / accept opponents, (d) track match history, and (e) rate opponents to build reputation. Ground owners list grounds and manage bookings against them. An admin approves owner applications. ✅

User roles (profiles.role): player (default), owner, admin. ✅

Payments: none. Booking UI states "No online payment yet. Payment is handled with the ground." ✅

Roadmap context. The owner provided the specs for Phases 8–11. Titles/specs of Phases 1–7 were not provided (❓); what they covered is inferred from the code below.
Phase	Goal (as given by owner)	Status
1–7	❓ not provided. Code shows: auth, profiles + avatars, owner application + admin review, ground CRUD + photos, ground browse/filter, booking + availability, opponent requests/responses/accept	✅ implemented in code (phase numbering ⚠️ inferred)
8	Match History and Status — My Matches page, upcoming/past, cancellation + completion rules, auto-complete after booking end, opponent + ground details, prevent unauthorized status changes	✅ done (see §9 note: "completed" is derived, not stored)
9	Ratings and Reputation — 1–5 stars, optional review, showed-up flag, averages/reputation, public player stats, no duplicate/fake ratings	✅ done
10	Notifications — notify host on join request, notify responder on accept, notifications page/dropdown, mark as read, Supabase Realtime, permission tests	❌ not started (no notifications table exists)
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
        ├── styles/global.css           (single global stylesheet, ~860 lines)
        ├── context/      authContext.js, toastContext.js
        ├── hooks/        useAuth.js, useToast.js
        ├── lib/          Supabase client + API wrappers + helpers (see below)
        ├── components/
        │   ├── auth/       AuthProvider, ProtectedRoute, RoleRoute
        │   ├── bookings/   BookingForm
        │   ├── grounds/    GroundForm, GroundListCard, PhotoCarousel
        │   ├── layout/     Layout, Navbar, Footer
        │   ├── opponents/  MatchContact, RequestCard, RequestRespond, RequestResponses
        │   ├── ratings/    RateMatchForm, StarRating (Stars, StarInput)
        │   └── ui/         Avatar, ErrorMessage, Spinner (Spinner, PageLoader), ToastProvider
        └── pages/
            ├── Home, Login, Signup, Profile, PlayerProfile, BecomeOwner,
            │   AdminOwnerRequests, Grounds, GroundDetails, MyBookings,
            │   FindOpponent, NotFound
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


Notes ✅: /grounds and /opponents are behind login, but the Navbar shows "Grounds" and "Find opponent" to logged-out users too (they get redirected to /login with state.from). There is no Navbar link for admins; the admin page is reachable from the Profile page button ("Review owner requests"). Owners cannot book their own ground (UI message + DB rule).
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
- Notifications (Phase 10): ❌ not implemented. Realtime: ❌ no supabase.channel(...) usage anywhere in the frontend.
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
5.3 Check / unique / exclusion constraints ✅ (names as in DB)
- bookings: status IN ('confirmed','cancelled'); (status='cancelled') = (cancelled_at IS NOT NULL); duration between 1 h and 24 h; start_at and end_at on the hour; hourly_price 100–100000; total_price = hourly_price * hours; phone regex ^[0-9+() -]{7,20}$; email regex + ≤254 chars; notes ≤300; cancel_reason ≤300; bookings_no_overlap: EXCLUDE USING gist (ground_id WITH =, during WITH &&) WHERE (status='confirmed') (prevents double booking).
- grounds: name 3–80; address 5–200; area 1–60; description ≤1000; hourly_price 100–100000; team_size 3–11; photos ≤ 6; grounds_photos_owner: photo_paths_valid(owner_id, photo_paths) (each path must start with <owner_id>/ and not contain ..); amenities ⊆ {floodlights, parking, washroom, changing_room, drinking_water, cafe, seating, first_aid, wifi}, ≤ 9.
- match_requests: status IN ('open','closed'); close_reason NULL or in (host,booking_cancelled,matched); (status='closed') = (closed_at IS NOT NULL); skill_level IN ('casual','intermediate','competitive'); team_size 3–11; ends_at > starts_at and ≤ 24 h; ground_name 2–80; area 1–60; notes ≤300; booking_id IS NULL OR ground_id IS NOT NULL.
- match_responses: status IN ('pending','accepted','rejected','withdrawn','closed','cancelled'); (status='pending') = (decided_at IS NULL); accepted ⇒ host_phone IS NOT NULL; phone regexes; message ≤300.
- match_ratings: rater_id <> ratee_id; stars 1–5; review ≤500; UNIQUE (match_id, rater_id).
- owner_requests: status in (pending,approved,rejected); message 10–500; admin_note ≤300; phone regex.
- profiles: role in (player,owner,admin); area 1–60; bio ≤300; full_name 1–80 or NULL; avatar_url NULL or matches ^https://[^/]+/storage/v1/object/public/avatars/.
5.4 Indexes ✅ (besides PKs)
- bookings: (ground_id, start_at DESC), (player_id, start_at DESC), GiST (ground_id, during) WHERE status='confirmed'
- grounds: (is_active, area), (owner_id)
- match_requests: (host_id, created_at DESC), (starts_at) WHERE status='open', UNIQUE (booking_id) WHERE booking_id IS NOT NULL AND status='open' (one open request per booking)
- match_responses: UNIQUE (request_id) WHERE status='accepted' (only one accepted per request), UNIQUE (request_id, responder_id) WHERE status IN ('pending','accepted'), (request_id, created_at DESC), (responder_id, created_at DESC)
- match_ratings: UNIQUE (match_id, rater_id), (ratee_id), (rater_id)
- owner_requests: UNIQUE (user_id) WHERE status='pending', (status, created_at DESC)
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
6.2 RLS ✅
RLS enabled on all 7 tables, not forced. Policies (all PERMISSIVE, role authenticated):
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


match_ratings has RLS enabled and no policies and no grants ⇒ completely inaccessible directly; only the SECURITY DEFINER RPCs (rate_match, list_my_matches, get_player_stats) touch it. ✅
No INSERT/DELETE policy on profiles, no write policies on bookings / match_requests / match_responses / match_ratings ⇒ those are written only via RPC/trigger. ✅
6.3 Table and column grants for authenticated ✅
Table	Table-level privileges
bookings	SELECT
grounds	SELECT, DELETE
match_requests	SELECT
owner_requests	SELECT
profiles	REFERENCES, SELECT, TRIGGER, TRUNCATE (see §14 — hardening item)
match_responses	none at table level
match_ratings	none


Column-level grants:
- grounds: INSERT+UPDATE (aw) on name, area, address, hourly_price, team_size, opening_time, closing_time, amenities, description, photo_paths, is_active — not on owner_id, id, is_24h, timestamps.
- profiles: UPDATE (w) on full_name, area, avatar_url, bio — role is not client-writable.
- owner_requests: INSERT (a) on phone, message only.
- match_responses: SELECT only (r) on id, request_id, responder_id, message, status, decided_at, created_at — i.e. responder_phone, host_phone, cancelled_by, cancelled_at are not selectable directly. Phone numbers are only exposed through RPCs, and only once a response is accepted.
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
respond_to_match_request(p_request_id, p_phone, p_message=null)	(response_id, request_id, status)	Share-locks the request. Not own request; request open and not started; max 10 pending responses per player; unique active response per request.
withdraw_match_response(p_response_id)	table	Responder only; pending → withdrawn.
reject_match_response(p_response_id)	table	Request's host only; pending → rejected.
accept_match_response(p_response_id, p_host_phone)	table	Host only. Locks request then response. Response must be pending, request open, not started; linked booking (if any) must still be confirmed; neither player may already have an accepted match overlapping that time (player_has_match_between). Sets response accepted + host_phone; closes request with close_reason='matched' (trigger then rejects all other pending responses).
cancel_match(p_response_id)	table	Host or accepted responder. Only accepted matches, only before start. Sets response status='cancelled', cancelled_by, cancelled_at. The request stays closed/matched (not reopened).
list_my_matches()	big table	status IN ('accepted','cancelled') for rows where caller is host or responder; includes role ('host'/'player'), opponent name/area/avatar/id, opponent_phone/my_phone only when accepted, cancelled_by_me, cancelled_by_system (= cancelled with NULL cancelled_by), my/their stars+showed_up+review. Ordered starts_at DESC, limit 200.
list_my_responses()	table	Caller's responses with request details + host name/avatar; host_phone only when accepted. limit 100. (Does not return host_id.)
list_responses_to_my_requests()	table	Responses to the caller's requests with responder info; phones only when accepted. limit 300.
rate_match(p_match_id, p_stars, p_showed_up, p_review=null)	uuid	Caller must be host or responder of that response row; match must be accepted (cancelled cannot be rated) and ends_at <= now(); ratee is derived server-side (the other participant); duplicate → 'You have already rated this match'. Review trimmed to ≤500.
get_player_stats(p_player_id)	table	Any authenticated user. Returns profile basics, matches_played (accepted matches with ends_at <= now() where player is host or responder), rating_count, average_rating and show_up_rate only if ≥ 3 ratings (else NULL).
review_owner_request(p_request_id, p_approve, p_note=null)	void	is_admin() required. Locks request; must be pending; sets status/admin_note/reviewed_by/reviewed_at; on approve sets profiles.role='owner' only if current role is player.
is_admin(), is_owner()	boolean	STABLE; RLS helpers checking profiles.role for auth.uid().
has_booking_at_ground(p_ground_id)	boolean	STABLE; RLS helper (player has any booking at ground).
player_has_match_between(p_player, p_start, p_end)	boolean	STABLE helper; EXECUTE only postgres/service_role (called internally by accept_match_response).
photo_paths_valid(p_owner, p_paths)	boolean	IMMUTABLE, not SECURITY DEFINER; used by grounds_photos_owner check. EXECUTE also granted to PUBLIC/anon.
set_updated_at()	trigger	Sets new.updated_at = now(). Not SECURITY DEFINER; EXECUTE also granted to PUBLIC/anon.
handle_new_user()	trigger	After insert on auth.users: requires raw_user_meta_data->>'area' (else raises 'Area is required', which blocks signup); inserts profiles(id, full_name, area). EXECUTE granted to PUBLIC/anon/authenticated (trigger function; cannot be called directly).
cancel_matches_on_booking_cancel(), close_requests_on_booking_cancel(), settle_responses_on_request_close()	trigger	See §6.5. EXECUTE only postgres/service_role.


6.5 Triggers ✅
Table	Trigger	When	Effect
auth.users	on_auth_user_created	AFTER INSERT	handle_new_user() creates the profile
profiles	profiles_set_updated_at	BEFORE UPDATE	updated_at = now()
grounds	grounds_set_updated_at	BEFORE UPDATE	updated_at = now()
bookings	bookings_cancel_matches	AFTER UPDATE OF status, when confirmed → cancelled	Accepted responses on requests linked to that booking → status='cancelled', cancelled_at=now() (cancelled_by stays NULL ⇒ treated as "system" cancellation)
bookings	bookings_close_requests_on_cancel	same condition	Open requests with that booking_id → closed, close_reason='booking_cancelled'
match_requests	match_requests_settle_responses	AFTER UPDATE OF status, when open → closed	Pending responses → 'rejected' if close_reason='matched', otherwise 'closed' (sets decided_at)


6.6 Core state machines (derived from the above)
- booking.status: confirmed → cancelled. No stored "completed": UI treats a confirmed booking with end_at in the past as "Completed".
- match_requests.status: open → closed (reasons host | booking_cancelled | matched). A request past its starts_at stays open in the DB; RLS hides it from other users and the UI shows "Expired" (no cron).
- match_responses.status: pending → accepted | rejected | withdrawn | closed; accepted → cancelled.
- Match "completed": purely derived (accepted and request ends_at passed). Nothing is stored for completion — a deliberate design for Phase 8 ("auto-complete") ✅ per comment in src/lib/matchStatus.js.
7. Authentication, roles, authorization flow
- Provider: Supabase Auth, email + password only (no OAuth in code). Frontend assumes email confirmation is enabled (shows "check your email" and resend flow). ❓ actual dashboard setting not verified.
- Signup → profile: auth.signUp with metadata {full_name, area} → trigger handle_new_user inserts profiles (role defaults to player).
- Roles: stored in profiles.role; not client-writable (column grants). Promotion player → owner happens only via admin RPC review_owner_request. Admin accounts are assigned manually in the DB (no UI/RPC path) ⚠️. Current data (owner-reported counts): 1 admin, 1 owner, 5 players.
- Authorization layers: (1) RLS + grants, (2) RPC internal checks (auth.uid(), ownership, role, state), (3) frontend ProtectedRoute/RoleRoute (UX only).
- Owner vs player: an owner is also a normal player (can book other grounds, post/respond to requests); frontend queries filter by player_id/owner_id explicitly because owners can read bookings at their grounds.
- Session handling: supabase-js default (localStorage persistence) ⚠️ default behaviour; no custom auth storage in code.
8. Environment variables and setup
Used by the app (✅ only these two):
Name	Where	Notes
VITE_SUPABASE_URL	Frontend/.env (local) and Vercel project env (⚠️)	https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY	same	Public anon key. Never put a service-role key in the frontend.


Frontend/.env.example is currently empty — it should contain:
VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR-ANON-PUBLIC-KEY
Local setup
cd Frontend
npm install
# create Frontend/.env with the two variables above
npm run dev        # Vite dev server
npm run build      # production build -> dist/
npm run preview
npm run lint
Supabase dashboard settings the app relies on (❓ not verified — confirm before launch): Auth email confirmation on; Site URL and Redirect URLs include the local dev origin and the production domain (signup/resend use window.location.origin); SMTP/email templates; password policy; storage buckets (below).

Storage buckets ✅
Bucket	Public	Size limit	MIME types
avatars	yes	2 MiB	jpeg, png, webp
ground-photos	yes	3 MiB	jpeg, png, webp


Storage object policies (storage.objects) are verified from the owner's query output. Path conventions used by the frontend: avatars/<user_id>/<timestamp>.<ext>, ground-photos/<owner_id>/<uuid>.<ext>.

Verified Storage policies (every returned policy has role {authenticated}):
Policy	Command	USING / WITH CHECK condition
Owners can delete own ground photos	DELETE	USING: bucket_id = 'ground-photos' and the first folder component of the object name equals auth.uid().
Owners can upload ground photos	INSERT	WITH CHECK: bucket is ground-photos, first folder component equals auth.uid(), and is_owner() is true.
Owners can view own ground photo files	SELECT	USING: bucket is ground-photos and first folder component equals auth.uid().
Users can delete own avatar	DELETE	USING: bucket is avatars and first folder component equals auth.uid().
Users can upload own avatar	INSERT	WITH CHECK: bucket is avatars and first folder component equals auth.uid().
Users can view own avatar files	SELECT	USING: bucket is avatars and first folder component equals auth.uid().


No UPDATE policy appeared in the supplied policy query output. Do not assume Storage updates/upserts are allowed without verifying the operation and its required policies. Both buckets are public, so public-object URL access is separate from these authenticated SELECT policies; these policies do not make the objects private.
9. Data flow between frontend and Supabase
Pattern: UI page → src/lib/*Api.js wrapper → supabase.rpc(...) or supabase.from(...) → throws on error → page catches, shows toast.error(err.message) or <ErrorMessage onRetry>.

Direct table access from the browser (reads unless noted):
Table	Operations in code
profiles	select * own row (AuthProvider); update own full_name/area/bio/avatar_url (Profile); embedded as profiles(full_name, area, avatar_url) on match_requests
owner_requests	own latest select and insert {phone, message} (BecomeOwner); admin list with embed profiles!owner_requests_user_id_fkey(full_name, area)
grounds	list/get/insert/update/delete (owner), list/get active (everyone)
bookings	select *, grounds(...) for the player; select *, grounds!inner(...) filtered by grounds.owner_id for owners
match_requests	open list with host profile embed; own list
match_responses	select request_id, status for own pending/accepted (permitted columns only)
storage	buckets avatars, ground-photos (upload/remove/getPublicUrl)


RPCs called from the frontend ✅: get_available_slots, create_booking, cancel_booking, create_match_request_from_booking, create_match_request_manual, close_match_request, respond_to_match_request, withdraw_match_response, reject_match_response, accept_match_response, list_responses_to_my_requests, list_my_responses, list_my_matches, cancel_match, rate_match, get_player_stats, review_owner_request.
(Table-returning RPCs come back as arrays — wrappers use data?.[0].)

Typical flows
1. Book: GroundDetails → get_available_slots → user picks range → create_booking (DB re-validates everything; race → 23P01 → UI refreshes slots).
2. Find opponent: host posts request (from booking = verified, or manual) → others respond_to_match_request (phone stored hidden) → host accept_match_response (host phone stored, request closes, other pendings rejected) → both see each other's phone through list_my_matches / list_my_responses / list_responses_to_my_requests.
3. Cancel booking cascades: cancel_booking → triggers cancel accepted matches (system) and close open requests → pending responses become closed.
4. After match ends: either participant calls rate_match once; stats derive from match_ratings.
5. Owner onboarding: player inserts owner_requests → admin review_owner_request(approve) → role becomes owner → user's AuthProvider picks it up via refreshProfile (BecomeOwner page does this when it sees an approved request).
Realtime: not used. All pages fetch on mount and on explicit reloadKey bumps.
10. Dependencies and coding conventions (observed ✅)
- JS/JSX, ES modules, no semicolons, single quotes. Indentation is mixed (2 spaces in most files; 4 spaces in Signup.jsx, Profile.jsx, FindOpponent.jsx, GroundForm.jsx, MyGrounds.jsx, groundsApi.js, Navbar.jsx). Match the file you edit.
- File names: components PascalCase.jsx; lib camelCase.js; API wrappers named <domain>Api.js; imports always include the .js/.jsx extension.
- Data-loading pattern (needed to satisfy the strict react-hooks v7 lint rules): page state is one object ({loading, data, error} or {key, data, error}); useEffect with a cancelled flag; a reloadKey counter to refetch; "loading" is often derived (result.key !== filterKey) rather than set synchronously inside the effect. now is captured in state (Date.now()) at fetch time to keep render pure.
- UI pattern: PageLoader while loading, ErrorMessage with retry on failure, useToast() for success/error, window.confirm(...) for destructive actions, tabs with counts (.tabs, .tab, .tab-count), .card, .badge badge-*, .form-group, .form-actions, .btn[-outline|-danger|-small|-block].
- Filters are mirrored in URL search params (useSearchParams) and validated with a pick(value, allowed) helper to ignore hand-edited values.
- Reuse components via "shape adapters" (e.g. asRequest(match) in MyMatches.jsx/MyResponses.jsx to feed RequestCard).
- Dates: never use toLocaleString for match times; use karachiTime.js. Build timestamps with toKarachiIso(date, time) (+05:00).
- Mutations: call an RPC; client-side validation (regexes in constants.js) mirrors but never replaces DB validation.
- Money: integers in PKR, displayed Rs {n.toLocaleString()}.
- Comments say "Phase N" for pending work (e.g. // pagination comes in Phase 11).
11. Deployment
- Frontend/vercel.json: single SPA rewrite /(.*) → /index.html ✅.
- Build: npm run build (Vite) → Frontend/dist. Vercel must be configured with Root Directory = Frontend (⚠️ implied by repo layout; actual Vercel settings, production URL, domain ❓).
- Required Vercel env vars: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (set per environment). VITE_* values are baked into the client bundle at build time.
- Supabase: one project (❓ whether separate dev/prod projects exist). No migration tooling, no Supabase CLI config, no CI/CD files in the repo ✅.
12. Business rules quick reference (✅ enforced in DB unless noted)
Rule	Value
Booking length / alignment	1–24 h, starts and ends on the hour
Booking lead time / horizon	≥ 1 h ahead, ≤ 30 days ahead
Player cancellation	≥ 12 h before start (owner: any time before start)
Double booking	prevented by exclusion constraint
Own ground	owner cannot book it
Match request limits	max 5 open requests per host; manual request start ≥ 30 min ahead
Response limits	max 10 pending per player; 1 active response per request
Accepting	host phone required; one accepted per request; no overlapping accepted matches for either player
Match cancel	accepted matches only, before start, by either participant
Rating	after match end; once per participant; stars 1–5; showed-up required; review ≤ 500, visible only to the rated player
Reputation	average + show-up rate public only with ≥ 3 ratings (literal 3 in SQL and MIN_RATINGS_FOR_REPUTATION in constants.js must be kept in sync)
Phone privacy	responder_phone/host_phone hidden until accepted (column grants + RPC masking)
Time zone	Asia/Karachi hard-coded (DB + frontend)


13. Known bugs, limitations, unfinished work, open decisions
Verified from code/DB
1. Team-size mismatch: DB allows 3–11 (grounds, match_requests, RPC), frontend TEAM_SIZES = [5,6,7,8].
2. No pagination: hard limits — grounds 60, open requests 60, bookings 100, my requests 100, my responses 100, responses to my requests 300, my matches 200, admin owner requests 100 (comments: "pagination comes in Phase 11").
3. Notifications and Realtime do not exist (Phase 10).
4. Schema is not version-controlled. No SQL/migration files in repo; function comments reference a "section 9a" of an SQL script that is not in the repo.
5. Frontend/.env.example is empty. Frontend/README.md is the stock Vite README. index.html references /favicon.svg but there is no public/ folder (404 favicon); page title is "futsal-app".
6. window.supabase = supabase left in supabaseClient.js (debug).
7. No password reset / change password / change email flows. No Terms/Privacy pages.
8. Admin role has no UI to be granted; owners have no demotion/revocation path (Phase 11 "owner-management process" pending). No abuse reporting feature.
9. Navbar: no admin link; "Grounds"/"Find opponent" visible when logged out but routes require login.
10. Host link missing on My responses: list_my_responses doesn't return host_id, so RequestCard can't link the host to /players/:id there.
11. Duplicated helpers: phoneHref exists in lib/matchFormat.js and again inside pages/owner/OwnerBookings.jsx; bucketOf exists separately in bookingStatus.js, matchStatus.js, MyRequests.jsx, MyResponses.jsx.
12. Cancelled-by edge case: match_responses.cancelled_by is ON DELETE SET NULL; if the canceller's profile were deleted, the match would appear as a "system" cancellation. Booking-cancel trigger deliberately leaves cancelled_by NULL to mean "system".
13. Cancelling a match does not reopen the request or free the booking; request stays closed/matched.
14. Ground deletion is blocked forever once any booking exists (FK RESTRICT); owners must deactivate.
15. Expiry is computed, not stored: stale open requests / pending responses remain in the DB after start time; there is no cleanup job.
16. Open requests overlap not checked on creation (overlap is only checked at accept time).
17. No automated tests, no CI. ESLint is configured (npm run lint).
18. Orphaned storage files are cleaned up best-effort only (failures are swallowed).
Outstanding decisions (❓ ask the owner): notification event list and retention for Phase 10; whether a "completed" status should ever be stored; whether admin creation needs a UI; abuse-report workflow; separate dev/prod Supabase projects; production domain/SMTP.
14. Security considerations
Design strengths (✅): RLS on every table; client write access minimized by column grants; all state changes in SECURITY DEFINER functions with search_path='', row locks (FOR UPDATE/FOR SHARE) and ownership checks; phone numbers masked until a match is accepted; role not client-writable; match_ratings fully closed to direct access; DB-level constraints mirror client validation; trigger-based cascades keep state consistent; exclusion constraint prevents double booking.

Items to review (Phase 11 audit candidates):
1. profiles still has table-level REFERENCES, TRIGGER, TRUNCATE for authenticated (✅ from grants output). Other tables were stripped to minimum. RLS does not govern TRUNCATE. PostgREST does not expose TRUNCATE, so API exploitability is unlikely (⚠️ not tested), but these should be reviewed for hardening: REVOKE REFERENCES, TRIGGER, TRUNCATE ON public.profiles FROM authenticated; (owner to run only after review).
2. window.supabase exposure — remove for production.
3. Storage policies verified: authenticated INSERT/SELECT/DELETE policies restrict the listed operations to the caller's UID folder; the ground-photo upload policy additionally checks is_owner(). No UPDATE policy appeared in the returned list. Both buckets are public, so the authenticated SELECT policies do not make the files private. Review public-read implications and whether the current upload/delete rules and bucket-level MIME/size limits remain appropriate.
4. The query for anon/PUBLIC table grants returned no rows for public schema tables. This is evidence of no matching grants in that query result; re-run if grants change. Function EXECUTE privileges are a separate concern: handle_new_user, photo_paths_valid, set_updated_at have EXECUTE for PUBLIC/anon (the first is a trigger function and not directly callable; still flag in a Supabase security-advisor pass).
5. Every authenticated user can read all profile rows (full_name, area, bio, avatar_url, role, timestamps) and all open upcoming match_requests (including host_id, notes). Profiles hold no email/phone ✅.
6. Phone/email exposure by design: bookings.contact_phone/contact_email visible to the booking player and the ground owner; owner_requests.phone visible to the applicant and admins.
7. Abuse controls are minimal: only per-user caps (5 open requests, 10 pending responses). No rate limiting beyond Supabase defaults, no reporting/blocking.
8. Dashboard auth settings (email confirmation, redirect URLs) unverified (❓).
9. Never commit .env* (already gitignored). Never use or request the service-role key in frontend code.
15. Instructions for future AI agents
Before coding
1. Read this file end-to-end, then read the actual files you will touch. Do not infer behavior from filenames.
2. Check "Legend" markers: ❓/⚠️ items are not facts. Ask the owner or request an introspection query rather than guessing.
3. Confirm which phase the owner wants; do not start the next phase unprompted.
Database work
4. The owner runs SQL manually in the Supabase SQL Editor. Provide numbered, copy-pasteable SQL, explain what each does, say which output (if any) to paste back, and never claim a change is live until confirmed.
5. Follow the established pattern for new features: new table → ENABLE ROW LEVEL SECURITY → explicit minimal policies → explicit minimal GRANTs (⚠️ the existing tables show default Supabase grants were stripped down; don't assume default privileges) → all writes through SECURITY DEFINER RPCs with SET search_path TO '', auth.uid() null check (errcode '42501'), row locking for read-modify-write, friendly raise exception messages, and masking of private columns.
6. Use #variable_conflict use_column in plpgsql functions that RETURNS TABLE(response_id, request_id, status).
7. Revoke EXECUTE from PUBLIC/anon on new functions and grant only to authenticated (+ service_role/postgres).
8. Keep the Karachi timezone assumptions consistent. Keep MIN_RATINGS_FOR_REPUTATION aligned with the SQL literal.
9. Recommend (and, when asked, create) a supabase/ folder with versioned SQL/migrations so the schema stops living only in the dashboard.

Frontend work
10. Reuse lib/*Api.js wrappers, useAuth, useToast, PageLoader, ErrorMessage, RequestCard, MatchContact, tabs/badge CSS classes. Add new API calls to the relevant lib file, not inside pages.
11. Follow the data-loading pattern in §10 so npm run lint passes (react-hooks v7 is strict about setState in effects).
12. Add new routes in App.jsx inside the right guard group; remember RoleRoute is UX-only — security must be in the DB.
13. Match the indentation/style of the file being edited; keep single quotes/no semicolons.
14. Run npm run lint and npm run build before declaring work done.

Phase 10 notes (guidance, ⚠️ not verified decisions)
15. All relevant events already pass through RPCs/triggers (respond_to_match_request, accept_match_response, reject_match_response, cancel_match, booking-cancel triggers), so notifications can be inserted DB-side without client-controlled writes. A notifications table needs RLS user_id = auth.uid() for SELECT, a narrow UPDATE (mark read) via RPC or column grant. The supabase_realtime publication membership query returned no rows (see Appendix A); verify the publication exists and add required tables as part of the reviewed SQL plan. Do not leak responder_phone/host_phone in notification payloads.
16. Test every new policy with two different accounts (player A cannot see player B's rows).
17. The existing supabase_realtime publication membership query returned no rows. Before relying on Realtime for Phase 10, verify the publication exists and add the intended table(s) to it as part of the reviewed SQL plan; do not assume Realtime subscriptions will receive database changes.

After finishing a phase: update this file (§1 table, §4.4, §5, §6, §13, §14) so it stays the source of truth.
