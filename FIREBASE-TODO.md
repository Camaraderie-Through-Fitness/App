# Firebase to-do (next laptop session)

Things that need the Firebase console or a rules update. Do these, then run a
full app review that includes Firebase changes.

## Clutter from deleted accounts
- [ ] **Leftover salutes**: when a member deletes their account, other people's
      salutes on that member's story can't be removed by the current rules.
      Fix: in the `stories/{id}/salutes/{uid}` rule, allow the story owner to
      delete too: `allow delete: if isMe(uid) || request.auth.uid == id || isAdmin();`
      Then clear any existing orphans in Firestore → Data.
- [ ] **Deleted admins**: if an admin deletes their account, remove their ID from
      the `admins` collection in Firestore → Data.

## Pending setup
- [ ] Publish the latest rules (`firestore-rules.txt`) if not already done.
- [ ] Set up the reminder email script (`reminders/`), per the steps in chat.
- [ ] Zeffy donation form (on hold): finish account, send embed link.

## Next review
- [ ] Full user-side review, this time including items that need Firebase.
