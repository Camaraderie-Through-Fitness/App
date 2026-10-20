# Firebase to-do (next laptop session)

Things that need the Firebase console or a rules update. Do these, then run a
full app review that includes Firebase changes.

## Clutter from deleted accounts
- [x] **Leftover salutes** (rule published Oct 16; app now clears them on account delete): when a member deletes their account, other people's
      salutes on that member's story can't be removed by the current rules.
      Fix: in the `stories/{id}/salutes/{uid}` rule, allow the story owner to
      delete too: `allow delete: if isMe(uid) || request.auth.uid == id || isAdmin();`
      Then clear any existing orphans in Firestore → Data.
- [ ] **Deleted admins**: if an admin deletes their account, remove their ID from
      the `admins` collection in Firestore → Data.

## Pending setup
- [ ] **Email sign-up failed for a new member** (Oct 16; he used Google instead).
      Check Authentication → Sign-in method → Email/Password is enabled, check
      Authentication → Users for a half-made account, and try a test sign-up to
      see the exact error. The login page now steers first-timers to Google.
- [x] Publish the latest rules (`firestore-rules.txt`). Done Oct 16.
- [ ] Set up the reminder email script (`reminders/`), per the steps in chat.
- [ ] Zeffy donation form (on hold): finish account, send embed link.

## Next review
- [ ] Full user-side review, this time including items that need Firebase.

## Ideas on hold (waiting on test group feedback)
- [ ] **Multiple stories per member**: 1 free story a month, +1 for each workout
      attended, extra posts for a $1 donation. Open questions: how attendance is
      confirmed (admin marks it vs. QR check-in), whether unused free posts roll
      over, $1 each vs. packs (card fees eat ~1/3 of $1), admin grants paid posts
      by hand after seeing the donation, how it fits with the $22/yr membership,
      and "donation" wording (check with whoever does CTF's books).
- [ ] **Gym membership reimbursement program** (parameters set Oct 19; not built yet):
      veterans joining a partner gym (GHF, Diaz Boxing Club) get a one-time
      start-fee reimbursement, capped at $52.68 per veteran. Must attend one CTF
      monthly workout first; an admin verifies veteran status in person there
      (no document uploads). Requests can be submitted any time but can't be
      approved until verified. Any admin can approve. Payout by Venmo or Cash App
      (one-tap "Pay in" links; admin marks paid). Admins can also record annual
      memberships as one-off awards above the cap. Needs new Firestore rules
      (requests, verified status, workout check-in list).
      - On hold within this: showing how much of the fund is left. No bank
        linking; if built, it would be a budget number an admin types in.
