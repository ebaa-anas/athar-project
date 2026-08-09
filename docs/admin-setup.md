# Creating an admin account

Admin accounts are not created through the app — `admins/*` Firestore
documents cannot be written by any client (see `firestore.rules`), and
there is no admin sign-up form. To create one:

1. **Create the Auth user.** Firebase Console → Authentication → Users →
   Add user. Set an email and password.
2. **Create the `admins/{uid}` doc.** Firebase Console → Firestore →
   `admins` collection → Add document, with the document ID set to the
   Auth user's UID (copy it from the Authentication tab). Fields:
   - `uid` (string): the same UID
   - `name` (string): admin's display name
   - `email` (string): same email as the Auth user
   - `role` (string): `"admin"`
   - `createdAt` (timestamp): now
3. **Create the matching `users/{uid}` doc** (same UID), so login can
   route the account correctly:
   - `uid` (string): the UID
   - `name` (string): admin's display name
   - `email` (string): same email
   - `role` (string): `"admin"`

The admin can now log in through the normal login form — `loginUser()`
reads `role` from `users/{uid}` to route to the admin dashboard.
