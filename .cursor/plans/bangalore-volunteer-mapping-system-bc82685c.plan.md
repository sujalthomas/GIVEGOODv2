---
name: Bangalore Volunteer & Feeder Mapping System - Complete Implementation Plan
overview: ""
todos:
  - id: e345d141-3a43-4415-b5c9-93ac07e8f18b
    content: Create database migration for volunteer approval system with pincode, status, coordinates, and review tracking
    status: pending
  - id: ba9b7c83-915f-45d1-b08c-a567c28c6c90
    content: Update all Delhi/NCR references to Bangalore across homepage and components
    status: pending
  - id: a75e497b-dd4d-46ae-bfc1-ec8f2a17e754
    content: Add pincode field to VolunteerForm with Bangalore validation (560xxx)
    status: pending
  - id: c9a863b2-81ea-445d-9877-492d83cecf93
    content: Implement pincode geocoding service using Nominatim API and Bangalore pincode reference data
    status: pending
  - id: abe4b09b-e61d-4fe2-a53e-cc85efb0e89e
    content: Create API routes for volunteer approval/rejection with geocoding trigger
    status: pending
  - id: a39b7439-c152-406d-b51a-8c4fd1c9f8bf
    content: Enhance admin volunteers page with status tabs, approval actions, and enhanced volunteer cards
    status: pending
  - id: 85c0c4a4-9bfc-4ab9-a583-a17a7ede3b25
    content: Install and configure Leaflet, react-leaflet, supercluster, and leaflet.heat packages
    status: pending
  - id: bd9ba9b8-f6a3-41f3-86b1-d017672b7c52
    content: Build core VolunteerMap component with markers, clustering, popups, and base Leaflet setup
    status: pending
  - id: be4df426-b8c9-4555-993d-8bd6536efa90
    content: Implement coverage zones, connection lines, heatmap layer, and toggle controls
    status: pending
  - id: 6feb01d0-b8c7-4cc6-bc72-8a1078c43793
    content: Add Framer Motion animations for markers, zones, and layer transitions
    status: pending
  - id: f34dd00a-d023-4cb8-acfb-1ad1464e1c80
    content: Create public volunteer map page showing approved volunteers only
    status: pending
  - id: 7b2e6d5b-135f-4e6a-8d9d-ab9fa9635d51
    content: Create admin volunteer map page with all statuses and quick-approval actions
    status: pending
  - id: 7caf36e4-d624-4133-971f-189dfa9fc641
    content: Add volunteer map links to navigation and homepage CTAs
    status: pending
  - id: 6847c904-87d8-4614-b09a-909122345418
    content: Implement coverage score calculation and display on map
    status: pending
  - id: 292df3a7-1c65-40e3-8f9d-cf3a4230dbe6
    content: Optimize map for mobile responsiveness and performance
    status: pending
  - id: b9c781f1-4286-41d0-ba3a-6cde3ce1d154
    content: Test full workflow end-to-end, verify RLS policies, and create seed data
    status: pending
---

# Bangalore Volunteer & Feeder Mapping System - Complete Implementation Plan

## Phase 1: Database Schema & Branding Updates

### 1.1 Complete Database Schema for Volunteers, Feeders & Refills

**File:** `supabase/migrations/20250XXX_volunteer_feeder_system_bangalore.sql`

**A. Update `volunteers` table:**

```sql
ALTER TABLE volunteers ADD COLUMN pincode VARCHAR(6) NOT NULL;
ALTER TABLE volunteers ADD COLUMN area_name VARCHAR(255);
ALTER TABLE volunteers ADD COLUMN status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE volunteers ADD COLUMN latitude NUMERIC(10, 8);
ALTER TABLE volunteers ADD COLUMN longitude NUMERIC(11, 8);
ALTER TABLE volunteers ADD COLUMN reviewed_by UUID REFERENCES auth.users(id);
ALTER TABLE volunteers ADD COLUMN reviewed_at TIMESTAMPTZ;
ALTER TABLE volunteers ADD COLUMN rejection_reason TEXT;
ALTER TABLE volunteers ADD COLUMN city VARCHAR(100) DEFAULT 'Bangalore';
```

**B. Create `feeders` table:**

```sql
CREATE TABLE feeders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  location_name VARCHAR(255) NOT NULL,
  pincode VARCHAR(6) NOT NULL,
  area_name VARCHAR(255),
  landmark TEXT,
  latitude NUMERIC(10, 8) NOT NULL,
  longitude NUMERIC(11, 8) NOT NULL,
  
  status VARCHAR(20) DEFAULT 'pending',
  capacity_kg NUMERIC(5, 2),
  installation_date DATE,
  photo_url TEXT,
  additional_photos JSONB DEFAULT '[]',
  
  refill_frequency_days INTEGER DEFAULT 7,
  last_refilled_at TIMESTAMPTZ,
  next_refill_due TIMESTAMPTZ,
  
  submitted_by UUID REFERENCES volunteers(id),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  notes TEXT,
  feeder_type VARCHAR(50),
  tags TEXT[],
  metadata JSONB DEFAULT '{}'
);
```

**C. Create `volunteer_feeders` (many-to-many):**

```sql
CREATE TABLE volunteer_feeders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  volunteer_id UUID NOT NULL REFERENCES volunteers(id) ON DELETE CASCADE,
  feeder_id UUID NOT NULL REFERENCES feeders(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'refiller',
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  is_primary BOOLEAN DEFAULT FALSE,
  UNIQUE(volunteer_id, feeder_id)
);
```

**D. Create `feeder_refills` (MOST IMPORTANT):**

```sql
CREATE TABLE feeder_refills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  feeder_id UUID NOT NULL REFERENCES feeders(id) ON DELETE CASCADE,
  refilled_by UUID NOT NULL REFERENCES volunteers(id),
  refill_date TIMESTAMPTZ DEFAULT NOW(),
  food_quantity_kg NUMERIC(5, 2) NOT NULL,
  food_type VARCHAR(100),
  
  verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  photo_url TEXT,
  
  notes TEXT,
  feeder_condition VARCHAR(50)
);
```

Add all necessary indexes and RLS policies, plus trigger to auto-update `next_refill_due` when refill logged.

### 1.2 Update Branding to Bangalore

**Files:** `nextjs/src/app/page.tsx`, `nextjs/src/components/VolunteerForm.tsx`

- Change all Delhi/NCR references to Bangalore
- Update testimonial areas to Bangalore localities

## Phase 2: Enhanced Volunteer Form with Pincode

### 2.1 Add Pincode & Area Fields

**File:** `nextjs/src/components/VolunteerForm.tsx`

- Add `pincode` (required, 560xxx validation)
- Add `area_name` (optional, e.g., "Koramangala 5th Block")
- Validation: Bangalore pincode only
- Helper text with examples

## Phase 3: Admin Approval Workflow (Volunteers & Feeders)

### 3.1 Enhanced Admin Volunteer Dashboard

**File:** `nextjs/src/app/app/volunteers/page.tsx`

- Status tabs: Pending, Approved, Rejected
- Approval/reject buttons with reason modal
- Display pincode, area, geocoded location
- Stats: total, pending, approved counts

### 3.2 New Admin Feeder Dashboard

**File:** `nextjs/src/app/app/feeders/page.tsx` (NEW)

- List all feeder submissions (pending, active, inactive, removed)
- Approve/reject feeder submissions
- View assigned volunteers per feeder
- View refill history per feeder
- Quick actions: Mark needs repair, deactivate
- Stats: total feeders, active, pending approval, needs refill (overdue)

### 3.3 Geocoding Service

**File:** `nextjs/src/lib/geocoding/bangalore-pincodes.ts`

- Nominatim API integration
- Static pincode lookup cache (100+ Bangalore pincodes)
- Auto-populate `area_name` from pincode if not provided

**File:** `nextjs/src/app/api/volunteers/geocode/route.ts`

- Background geocoding for approved volunteers

**File:** `nextjs/src/app/api/feeders/geocode/route.ts`

- Geocoding for approved feeders

### 3.4 API Routes for Approvals

**Files (NEW):**

- `nextjs/src/app/api/volunteers/approve/route.ts` - Approve/reject volunteers
- `nextjs/src/app/api/feeders/approve/route.ts` - Approve/reject feeders
- `nextjs/src/app/api/feeders/assign-volunteer/route.ts` - Assign volunteers to feeders

## Phase 4: Feeder Submission & Refill Logging

### 4.1 Feeder Submission Form (Volunteer-facing)

**File:** `nextjs/src/components/FeederSubmissionForm.tsx` (NEW)

- Location details: name, pincode, area, landmark
- Upload photo (primary)
- Capacity, feeder type
- Auto-assign submitter as primary volunteer
- Submits as "pending" → awaits admin approval

**File:** `nextjs/src/app/submit-feeder/page.tsx` (NEW - Public page)

- Form for volunteers to submit new feeders
- Can be accessed by approved volunteers
- Link from volunteer dashboard

### 4.2 Refill Logging System (CRITICAL)

**File:** `nextjs/src/components/RefillLogForm.tsx` (NEW)

- Select feeder from assigned feeders
- Enter quantity (kg), food type
- Upload photo proof (optional but encouraged)
- Add notes, report feeder condition
- Submits refill record → shows as "unverified" until admin verifies

**File:** `nextjs/src/app/app/log-refill/page.tsx` (NEW - Volunteer dashboard)

- Quick refill logging interface
- Shows volunteer's assigned feeders
- Reminder for feeders needing refill

### 4.3 Refill Verification Dashboard (Admin)

**File:** `nextjs/src/app/app/refills/page.tsx` (NEW)

- List all refills (unverified, verified)
- Verify refill with one click
- View photo proof
- Stats: total refills today/week/month, total kg distributed
- Flag suspicious refills

### 4.4 API Routes for Feeders & Refills

**Files (NEW):**

- `nextjs/src/app/api/feeders/submit/route.ts` - Submit new feeder
- `nextjs/src/app/api/feeders/list/route.ts` - List feeders with filters
- `nextjs/src/app/api/refills/log/route.ts` - Log refill
- `nextjs/src/app/api/refills/verify/route.ts` - Verify refill (admin)
- `nextjs/src/app/api/refills/stats/route.ts` - Refill statistics

## Phase 5: Interactive Map Visualization

### 5.1 Install Dependencies

**File:** `nextjs/package.json`

```json
"leaflet": "^1.9.4",
"react-leaflet": "^4.2.1",
"leaflet.heat": "^0.2.0",
"supercluster": "^8.0.1",
"@types/leaflet": "^1.9.8"
```

### 5.2 Core Map Component with Dual Markers

**File:** `nextjs/src/components/VolunteerFeederMap.tsx` (NEW)

Features:

1. **Volunteer Markers** (colored dots):

   - Blue: builders
   - Green: refillers
   - Amber: ambassadors
   - Cluster with Supercluster

2. **Feeder Markers** (distinct icon - e.g., bowl/house icon):

   - Color by status: Green (active), Yellow (needs refill), Red (needs repair)
   - Show on same map layer
   - Click to see details + refill history

3. **Area Clustering/Aggregation:**

   - Group by pincode automatically
   - Popup shows: "Koramangala (560034): 12 volunteers, 18 feeders, 77% coverage"
   - Individual markers when zoomed in, clusters when zoomed out

4. **Coverage Zones:**

   - Pulsing circles (1-2km radius) around active feeders
   - Toggle on/off

5. **Heatmap Layer:**

   - Density of volunteers + feeders combined
   - Toggle on/off

6. **Connection Lines:**

   - Lines between volunteers and their assigned feeders
   - Toggle on/off

### 5.3 Map Controls & Stats

**Top Stats Cards:**

- Total Volunteers (approved)
- Total Feeders Built (active)
- Areas Covered (unique pincodes)
- Avg Coverage % (calculated)

**Right Sidebar:**

- Toggle: Heatmap, Coverage Zones, Connections
- **Top Areas Ranking:**
  - List top 6 areas by coverage %
  - Show volunteer count + feeder count per area
  - Link to filter map by that area

**Bottom Legend:**

- Volunteer types (blue, green, amber dots)
- Feeder status (green, yellow, red icons)

### 5.4 Data Fetching Endpoints

**Files (NEW):**

- `nextjs/src/app/api/map/volunteers/route.ts` - Get approved volunteers with coords
- `nextjs/src/app/api/map/feeders/route.ts` - Get active feeders with coords
- `nextjs/src/app/api/map/areas/route.ts` - Get area-level aggregated stats
- `nextjs/src/app/api/map/stats/route.ts` - Get top-level stats for cards

## Phase 6: Map Pages

### 6.1 Public Map Page

**File:** `nextjs/src/app/volunteer-map/page.tsx` (NEW)

- Shows approved volunteers + active feeders only
- Read-only, no auth required
- Area aggregation with stats
- CTA: "Join Us" and "Submit a Feeder"

### 6.2 Admin Map Page

**File:** `nextjs/src/app/app/volunteer-map/page.tsx` (NEW)

- Shows ALL volunteers (pending, approved, rejected)
- Shows ALL feeders (pending, active, inactive, needs repair)
- Color-coded by status
- Click marker for quick approve/reject
- View refill history
- Export map data

### 6.3 Navigation Updates

**File:** `nextjs/src/components/AppLayout.tsx`

- Add to super admin nav:
  - Volunteer Map
  - Feeder Dashboard
  - Refill Logs

**File:** `nextjs/src/app/page.tsx`

- Add link to public map in nav
- Add "View Map" CTA in join section

## Phase 7: Coverage Algorithm & Area Intelligence

### 7.1 Coverage Calculator

**File:** `nextjs/src/lib/maps/coverage-calculator.ts` (NEW)

- Divide Bangalore into 1km grid
- Mark covered if feeder within 2km
- Calculate coverage % per area
- Overall city coverage %

### 7.2 Bangalore Pincode Reference

**File:** `nextjs/src/lib/maps/bangalore-pincodes.json` (NEW)

- 100+ Bangalore pincodes with:
  - Area name
  - Coordinates (center)
  - Approximate boundaries
- Use for validation, geocoding fallback, area suggestions

### 7.3 Area Analytics

**File:** `nextjs/src/lib/maps/area-analytics.ts` (NEW)

- Calculate per-area metrics:
  - Volunteer count
  - Feeder count
  - Total refills (last 30 days)
  - Coverage %
  - "Health score" (active feeders / total feeders)
- Power the "Top Areas" sidebar

## Phase 8: Advanced Features & Polish

### 8.1 Refill Reminders & Notifications

**File:** `nextjs/src/app/api/feeders/check-overdue/route.ts` (NEW)

- Cron job or manual trigger
- Find feeders where `next_refill_due < NOW()`
- Mark as "needs refill"
- (Future: Send email to assigned volunteers)

### 8.2 Feeder Health Dashboard

**File:** `nextjs/src/app/app/feeder-health/page.tsx` (NEW - Admin)

- List feeders needing attention:
  - Overdue refills
  - Needs repair
  - No refill in 30+ days (inactive?)
- Quick actions to reassign, mark repaired, deactivate

### 8.3 Volunteer Leaderboard

**File:** `nextjs/src/components/VolunteerLeaderboard.tsx` (NEW)

- Top volunteers by:
  - Most refills logged
  - Most feeders built/managed
  - Most consistent (refills on time)
- Display on public map or homepage

### 8.4 Mobile Responsiveness

- Stack map controls vertically
- Touch-friendly popups
- Adjust zoom for mobile
- Simplified stats on small screens

### 8.5 Performance Optimizations

- React.memo for map components
- Lazy load map (dynamic import)
- Cache geocoding results
- Debounce toggle controls
- Pagination for large datasets

## Phase 9: Testing & Deployment

### 9.1 Seed Data for Testing

Create scripts to seed:

- 30-40 volunteers across Bangalore (mix of status)
- 50-60 feeders (various statuses)
- 100+ refill logs
- Spread across 10+ different pincodes

### 9.2 End-to-End Testing Checklist

- [ ] Volunteer signup with pincode → pending → approve → appears on map
- [ ] Feeder submission → pending → approve → appears on map
- [ ] Refill logging → unverified → verify → updates last_refilled_at
- [ ] Area aggregation shows correct counts
- [ ] Coverage calculation works
- [ ] Map renders on mobile
- [ ] RLS policies enforced (public vs authenticated)
- [ ] Geocoding works for all Bangalore pincodes
- [ ] Overdue feeders flagged correctly

### 9.3 Documentation

**File:** `VOLUNTEER_FEEDER_SYSTEM.md` (NEW)

Document:

- How to sign up as volunteer
- How to submit a feeder
- How to log refills
- Admin approval workflows
- Map features explanation
- API endpoints reference
- Database schema overview

## Files Summary

### New Files (35+ total)

**Database:**

1. `supabase/migrations/20250XXX_volunteer_feeder_system_bangalore.sql`

**Components:**

2. `nextjs/src/components/VolunteerFeederMap.tsx` - Main map
3. `nextjs/src/components/VolunteerMapControls.tsx` - Map toggles
4. `nextjs/src/components/VolunteerMapLegend.tsx` - Legend
5. `nextjs/src/components/VolunteerMapStats.tsx` - Top stats cards
6. `nextjs/src/components/TopAreasPanel.tsx` - Right sidebar ranking
7. `nextjs/src/components/FeederSubmissionForm.tsx` - Feeder form
8. `nextjs/src/components/RefillLogForm.tsx` - Refill logging
9. `nextjs/src/components/FeederMarker.tsx` - Custom feeder icon
10. `nextjs/src/components/VolunteerMarker.tsx` - Custom volunteer dot
11. `nextjs/src/components/AreaClusterPopup.tsx` - Area stats popup
12. `nextjs/src/components/VolunteerLeaderboard.tsx` - Leaderboard

**Pages:**

13. `nextjs/src/app/volunteer-map/page.tsx` - Public map
14. `nextjs/src/app/app/volunteer-map/page.tsx` - Admin map
15. `nextjs/src/app/app/feeders/page.tsx` - Feeder dashboard
16. `nextjs/src/app/app/refills/page.tsx` - Refill verification
17. `nextjs/src/app/app/feeder-health/page.tsx` - Health dashboard
18. `nextjs/src/app/app/log-refill/page.tsx` - Quick refill logging
19. `nextjs/src/app/submit-feeder/page.tsx` - Public feeder submission

**API Routes:**

20. `nextjs/src/app/api/volunteers/approve/route.ts`
21. `nextjs/src/app/api/volunteers/geocode/route.ts`
22. `nextjs/src/app/api/feeders/submit/route.ts`
23. `nextjs/src/app/api/feeders/approve/route.ts`
24. `nextjs/src/app/api/feeders/list/route.ts`
25. `nextjs/src/app/api/feeders/geocode/route.ts`
26. `nextjs/src/app/api/feeders/assign-volunteer/route.ts`
27. `nextjs/src/app/api/feeders/check-overdue/route.ts`
28. `nextjs/src/app/api/refills/log/route.ts`
29. `nextjs/src/app/api/refills/verify/route.ts`
30. `nextjs/src/app/api/refills/stats/route.ts`
31. `nextjs/src/app/api/map/volunteers/route.ts`
32. `nextjs/src/app/api/map/feeders/route.ts`
33. `nextjs/src/app/api/map/areas/route.ts`
34. `nextjs/src/app/api/map/stats/route.ts`

**Utilities:**

35. `nextjs/src/lib/geocoding/bangalore-pincodes.ts`
36. `nextjs/src/lib/maps/bangalore-pincodes.json`
37. `nextjs/src/lib/maps/coverage-calculator.ts`
38. `nextjs/src/lib/maps/area-analytics.ts`
39. `nextjs/src/lib/types/feeder.ts`
40. `nextjs/src/lib/types/refill.ts`
41. `nextjs/src/lib/types/volunteer-map.ts`
42. `nextjs/src/hooks/useVolunteerMapData.ts`
43. `nextjs/src/hooks/useFeederData.ts`
44. `nextjs/src/hooks/useRefillStats.ts`
45. `nextjs/src/styles/leaflet-overrides.css`

**Documentation:**

46. `VOLUNTEER_FEEDER_SYSTEM.md`

### Modified Files (5 total)

1. `nextjs/src/components/VolunteerForm.tsx` - Add pincode + area_name
2. `nextjs/src/app/app/volunteers/page.tsx` - Add approval workflow
3. `nextjs/src/app/page.tsx` - Bangalore branding + map links
4. `nextjs/src/components/AppLayout.tsx` - Add new admin nav items
5. `nextjs/package.json` - Add mapping dependencies

## Key Technical Decisions

**Database Design:**

- **3 core tables:** volunteers, feeders, feeder_refills
- **1 junction table:** volunteer_feeders (many-to-many)
- **Auto-calculated fields:** next_refill_due (via trigger)
- **Status workflows:** pending → approved → active (both volunteers & feeders)

**Feeder-Volunteer Relationship:**

- Many-to-many: One feeder can have multiple volunteers (refiller, builder, maintainer)
- One volunteer can manage multiple feeders
- Primary contact designation per feeder

**Refill Tracking:**

- All refills logged, initially unverified
- Admin verification adds credibility
- Photo proof encouraged
- Auto-updates feeder's last_refilled_at and next_refill_due

**Map Visualization:**

- **Dual markers:** Volunteers (dots) + Feeders (icons)
- **Area clustering:** Group by pincode, show aggregated stats
- **Individual view:** Zoom in to see specific volunteers/feeders
- **Toggle layers:** Heatmap, coverage zones, connections

**Free Tools Used:**

- Leaflet + React-Leaflet (mapping)
- OpenStreetMap (tiles)
- Nominatim (geocoding, 1 req/sec)
- Supercluster (clustering)
- Framer Motion (animations)

## Implementation Order

1. **Phase 1:** Database schema (volunteers + feeders + refills)
2. **Phase 2:** Volunteer form with pincode
3. **Phase 3:** Admin approval dashboards (volunteers & feeders)
4. **Phase 4:** Feeder submission + refill logging
5. **Phase 5:** Map component with dual markers
6. **Phase 6:** Map pages (public + admin)
7. **Phase 7:** Coverage algorithm + area analytics
8. **Phase 8:** Polish + advanced features
9. **Phase 9:** Testing + deployment

**Estimated Time:** 5-7 days for experienced developer

## Critical Features (Must-Have for MVP)

1. ✅ Volunteer signup with pincode + approval
2. ✅ Feeder submission with location + approval
3. ✅ **Refill logging system** (MOST IMPORTANT)
4. ✅ Map showing volunteers + feeders (area aggregation)
5. ✅ Top areas ranking
6. ✅ Coverage calculation
7. ✅ Admin dashboards for all workflows

## Nice-to-Have (Post-MVP)

- Email notifications (approval, refill reminders)
- Photo gallery per feeder
- Volunteer leaderboard
- Mobile app
- Export reports (PDF/CSV)
- Automated refill reminders (cron jobs)