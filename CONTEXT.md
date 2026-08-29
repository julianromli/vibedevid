# VibeDev ID

Indonesian developer-community platform: project showcases, blog, community events, and an admin dashboard. Server: TanStack Start on Cloudflare Workers. Data: Neon Postgres in `aws-ap-southeast-1` via Drizzle. App traffic uses the pooled `DATABASE_URL`. Schema migrations use `DATABASE_URL_UNPOOLED`. Branch compute policy is in `neon.ts`. Staging schema `supabase_auth_staging` is only for a one-time Supabase import and must be dropped after that import.

## Language

### Content

**Project**:
A member's software work showcased on the platform: title, description, tags, images, links, likes, and view counts.
_Avoid_: Portfolio item, submission, listing

**Post**:
A published blog article with editor content, tags, and an optional cover image.
_Avoid_: Blog entry, article

**Tag**:
A named label attached to a Project or Post for filtering (stored per-entity as `post_tags`/`project_tags` relation names).
_Avoid_: Category

**Category**:
A curated, admin-managed grouping that Projects fall under; filterable.
_Avoid_: Topic, genre

**View**:
A page impression recorded for a Project or Post. Records carry an optional session id so unique-viewer counts can be derived.
_Avoid_: Hit, visit

**Like**:
A signed-in member's endorsement of a Project; toggling it inserts or deletes the member's Like row.
_Avoid_: Reaction

### Community events

**Event**:
A time-bound community gathering (workshop, meetup, conference, hackathon) with a date/time range, location, organizer, and registration link.
_Avoid_: Activity, session

**Event submission**:
A member-authored Event that enters the system unapproved and awaits an admin or moderator decision.
_Avoid_: Draft event, pending event

**Event approval**:
An admin/moderator decision that changes an Event's `approved` flag to true, making it visible on public list/detail pages.
_Avoid_: Publishing, moderation action

**Event rejection**:
An admin/moderator decision that removes the Event.
_Avoid_: Deletion, decline

### Membership

**Member**:
A registered user account with a role (`admin`, `moderator`, or `user`) and an optional public profile.
_Avoid_: Account, customer

**Profile**:
A Member's public presence: display name, bio, avatar, location, website, and social links.
_Avoid_: Account page, user page

**Admin**:
A Member with the `admin` role; can manage Projects, Posts, Events, moderation, and other admins/moderators.
_Avoid_: Superintendent, owner

**Moderator**:
A Member with the `moderator` role; can run Event approval and moderation flows, but not grant roles.
_Avoid_: Staff, reviewer

### Reading and writing

**Project read**:
Fetching Project data for public display: detail (project + its counts) and list (filtered/sorted cards).
_Avoid_: Project query

**Project submission**:
The member flow that validates and inserts a new Project (incl. unique slug generation and image references). Validated by the shared Project submission rules.
_Avoid_: Project creation, upload

**Project edit**:
The owner/authorized-member flow that mutates an existing Project's fields, validated by the same Project submission rules.
_Avoid_: Update flow, patch

**Blog read**:
Fetching published Posts for public display: list and detail (with tags and view counts).
_Avoid_: Blog query

**Blog editor**:
The member or admin flow that creates, updates, tags, or deletes Posts (including drafts).
_Avoid_: Blog authoring, CMS
