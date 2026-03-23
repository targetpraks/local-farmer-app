# The Local Farmer — Project Roadmap

> Last updated: 2026-03-23 | App: ~/local-farmer-app

---

## Bug Fixes (In Progress)

| # | Fix | Status |
|---|-----|--------|
| B1 | Pricing tab: state value 'pricing' → 'mushrooms' | 🔄 Builder running |
| B2 | Subscriptions: clean up dead mixes tab code | 🔄 Builder running |

---

## Route Health

| Route | Status | Notes |
|-------|--------|-------|
| / | ✅ 200 | Dashboard |
| /microgreens | ✅ 200 | |
| /microgreens/mixes | ✅ 200 | |
| /microgreens/mixes/new | ✅ 200 | |
| /microgreens/[id] | ✅ 200 | |
| /microgreens/new | ✅ 200 | |
| /mushrooms | ✅ 200 | |
| /mushrooms/prices | ✅ 200 | |
| /mushrooms/mixes | ✅ 200 | |
| /mushrooms/production | ✅ 200 | |
| /mushrooms/costing | ✅ 200 | |
| /mushrooms/[id] | ✅ 200 | |
| /mushrooms/new | ✅ 200 | |
| /subscriptions | ✅ 200 | |
| /pricing | ✅ 200 | |
| /costing | ✅ 200 | |
| /trade-costing | ✅ 200 | |
| /admin | ✅ 200 | |
| /admin/pricing-tiers | ✅ 200 | |
| /admin/reset | ✅ 200 | |
| /mixes | ⚠️ 404 | Root page missing |
| /suppliers | ⚠️ 404 | Root page missing + page.tsx.bak |

---

## Priority Backlog

### P0 — Must Fix
- [ ] Zoho credentials + Item IDs from Targetpraks

### P1 — Core Polish
- [ ] /mixes root page (or redirect)
- [ ] /suppliers root page (restore from .bak)
- [ ] Mobile responsiveness audit
- [ ] Subscriptions mushroom PlanCard interaction

### P2 — Nice to Have
- [ ] Admin dashboard stats
- [ ] Onboarding/first-run setup
- [ ] Email notifications
- [ ] Customer-facing order portal
- [ ] PDF price list export
- [ ] Production calendar view

---

## Integration Status

| Integration | Status |
|-------------|--------|
| Prisma + SQLite | ✅ |
| Zoho Inventory | ⏳ Waiting on credentials |
| Mushroom batch tracking | ✅ |
| Subscriptions tabs | ✅ |
| Pricing calculator | ✅ |
