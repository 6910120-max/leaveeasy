# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

LeaveEasy (🔧 ระบบขอลาออนไลน์) is a training prototype for the ADT-RAISE Non-Degree Batch 2, Module 2
curriculum (weeks 6–9). It's a plain HTML/CSS/JS employee leave-request system: employees submit leave
requests, a manager/HR approves or rejects them. The student owner is meant to grow this codebase
week-by-week following `leaveeasy-spec.md` — **do not build ahead of the current week's scope**.

**Read `leaveeasy-spec.md` first, in full, before making any change.** It is the authority on field
names, folder names, status rules, and what is in/out of scope for the current week — not this file.
Section 0.2 states hard technical constraints (no frameworks, no custom server, Firestore only,
Firebase Auth/Hosting on their fixed weeks) that must never be relaxed. Section 9 is an explicit
"do not build this" list — if something there looks like it's missing, propose it and wait, don't add it.
Section 8 is the week-by-week scope table; check it before adding CRUD, auth, security rules, or AI
features that belong to a later week than the one currently being worked on.

## Commands

```bash
npm run dev   # serves the static site at http://localhost:3000 via `serve`
```

There is no build step, bundler, linter, or test suite — everything is static HTML/CSS/JS loaded
directly by the browser. "Running" the app means serving these files and opening pages in a browser.

## Architecture

### Pages are independent, not a SPA

Five screens + a landing page, each its own `.html` file with its own `<script>` for page logic — there
is no router or shared page-load framework:

- `index.html` — landing page with links to the other screens
- `leave-requests.html` → `js/leave-requests.js` — list of all leave requests
- `new-leave-request.html` → `js/new-leave-request.js` — submission form
- `leave-request-detail.html` → `js/leave-request-detail.js` — one request's detail, approve/reject, comments
- `leave-types.html` → `js/leave-types.js` — CRUD on leave-type list
- `dashboard.html` (not yet built — Module 3 scope, see spec §4)

`js/nav.js` renders the shared top nav into `<div id="nav">` on every page — edit menu items there once,
not per page. `js/util.js` holds cross-page helpers (`esc`, `ป้ายสถานะ`, `เวลาตอนนี้`, `ค่าจากURL`) loaded
as plain non-module scripts before the page-specific script.

### Two data-access styles coexist right now — this is expected, not a bug

The migration to Firestore is happening incrementally, one page at a time, per spec §8:

- **`js/leave-requests.js`**, **`js/new-leave-request.js`**, and **`js/leave-request-detail.js`** already
  read/write live Firestore (`import { db } from "./firebase-config.js"`, each a `type="module"` script).
  `leave-request-detail.js` changes status with `updateDoc` (touches only the `status` field, never the
  rest of the document) and reads/writes that request's `approvals` subcollection for comments.
- **`js/leave-types.js`** is the one page still on `window.LEAVE_DATA` (from `js/data.js`, loaded as a
  plain script) in memory only — nothing persists across a page refresh yet for this page.

When migrating another page to Firestore, follow the same pattern as `leave-requests.js`: import `db`
from `js/firebase-config.js`, switch the page's `<script>` tag to `type="module"`, and remove its
dependency on `js/data.js`. Don't migrate a page's persistence ahead of the week the spec assigns it.

`js/seed.js` (run via `seed.html`) is a one-time tool that copies `js/data.js`'s fake data into Firestore
using the exact collection/document shape in spec §5.2 and §7 — it is not one of the 5 real screens.

### Data shape (Firestore) and its rules

**All Firestore collections (spec §5.2) — there are no others, don't invent new top-level ones:**

- `users` — documents `u001`, `u002`, … each `{ name, email, role }`
- `leaveTypes` — documents `lt001`, `lt002`, … each `{ name }`
- `leaveRequests` — documents `lr001`, `lr002`, … the main leave-request records (fields below)
  - `approvals` — **subcollection nested inside each `leaveRequests/{id}` document**, not top-level;
    documents `ap001`, `ap002`, … each `{ authorId, authorName, message, createdAt }`

Field names are camelCase and must match spec §5.2 **exactly** — `status` vs `Status` would silently
break the app since Firestore has no schema enforcement. Names are intentionally denormalized (e.g.
`leaveRequests.requesterName` duplicates `users.name`) because Firestore has no JOIN — see spec §5.3
before "fixing" what looks like duplicated data.

**The 3 leave-request statuses (spec §6) — `status` must always be exactly one of these Thai strings,
nothing else:**

| value | meaning | who can set it | can move to |
|---|---|---|---|
| `รอพิจารณา` | pending — just submitted | set automatically by the system on create, never chosen by the user | `อนุมัติ` or `ไม่อนุมัติ` |
| `อนุมัติ` | approved | manager · hr | nothing — terminal |
| `ไม่อนุมัติ` | rejected | manager · hr | nothing — terminal |

Transitions are one-way only (never back to pending, never between approved/rejected), only a manager/HR
may change it, changing it must touch only the `status` field (never overwrite the rest of the document),
and rejecting requires at least one existing entry in that request's `approvals` subcollection first — see
spec §6 for the full rule set before touching approve/reject logic.

Roles (`users.role`): `employee`, `manager`, `hr` — always store these English codes (Thai labels are
display-only). Role-based access isn't enforced yet (arrives week 8 via Security Rules) — until then all
screens are open to everyone.

### Never commit API keys or secrets to a file that gets pushed

**Never write an API key, token, or other secret into any file that is tracked by git and will be
pushed** (GitHub is public for this course). This applies to every key added from week 7 onward —
most importantly the OpenRouter API key for the week 8 AI assist feature — not just Firebase.

- `js/firebase-config.js` holds the real Firebase project config (`apiKey` included) and is **gitignored
  on purpose** — even though Firebase web client keys aren't secret by design (they're protected by
  Security Rules, not secrecy), this project's owner chose to keep it out of the public repo anyway.
  `js/firebase-config.example.js` is the **tracked template** with placeholder values — anyone who forks
  copies it to `js/firebase-config.js` and fills in their own project's real values locally. If you ever
  regenerate or restructure `firebase-config.js`, update the `.example.js` template to match its shape
  (keys only, no real values) so forks keep working.
- `.gitignore` now also blocks common secret/config patterns (`.env*`, `*.key`, `*.pem`, `*secret*`,
  `*credentials*`, `config.local.*`, `*.local.js`) — use one of these naming conventions for any future
  secret file (e.g. the week-8 OpenRouter key) rather than inventing a new untracked filename each time.
- Before adding any real secret, either put it in a file matching one of those gitignored patterns, or
  have the user supply it at runtime (e.g. typed into the page and kept in `localStorage`) — never as a
  literal string in a tracked `.js`/`.html` file.
- Before any `git push`, list the files about to be committed and check by eye for anything containing
  `key` / `secret` / `token` / `config` that shouldn't be public, per the checklist at the bottom of
  `.gitignore`.

### Code style notes specific to this repo

- Many identifiers (variables, function names) are Thai words on purpose (e.g. `กล่อง`, `ใบ`, `ความเห็น`,
  `เปลี่ยนสถานะ`) — this is the existing convention, match it in new code rather than switching to English
  names.
- No modern JS tooling assumed: plain `var`/function-expression style, IIFEs `(function () {...})()` per
  page script, no import bundling outside of the native `type="module"` Firestore imports.
- Firebase is loaded straight from the `gstatic.com` CDN as ES modules (see `js/firebase-config.js`) — no
  `npm install` for Firebase, per spec §0.2.
