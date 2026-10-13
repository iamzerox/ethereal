# ETHERIUM admin console

Monochrome responsive dashboard with Google sign-in through Firebase Authentication. Bundler and credential-token tools are omitted. This version does not include an executable or device collection.

## Connect Firebase

1. The public web configuration is connected to `ethereal-dashboard`. Intended administrator: `bgcon10fps@gmail.com`. Configuration alone does not grant access or deploy database rules.
2. Enable Google in Firebase Authentication and add the deployed site hostname to Authorized domains.
3. Attempt Google sign-in as `bgcon10fps@gmail.com` to create its Firebase Authentication account; the dashboard will deny access until the admin claim exists. In a trusted environment with Application Default Credentials and permission to manage this Firebase project's users, install `firebase-admin` and run `node scripts/grant-admin.mjs`. The script preserves existing claims and grants `admin: true` only to that verified Google account. Firebase CLI login alone is not Admin SDK authentication. Never put administrative credentials into this site. Sign out and in after granting the claim.
4. Create Firestore and deploy the included rules using `firebase deploy --only firestore:rules --project YOUR_PROJECT_ID`. Review before deploying to an existing project: these rules deny access to all other collections.
5. Optional: create `workspaceRecords` documents through your trusted backend or Firebase console. Supported display fields: `name` (string), `type` (string), `updatedAt` (Firestore timestamp). Browser writes are denied.
6. Publish updated static assets. For Firebase Hosting: `firebase deploy --only hosting --project YOUR_PROJECT_ID`.

Both Firebase sign-in and the admin claim are required. The UI is hidden until authorization finishes; Firestore rules independently enforce data access. Static HTML/CSS/JS are public source assets and contain no secrets. Session authentication is scoped to the browser tab session. Do not add sensitive data to static assets.

Official access-control reference: https://firebase.google.com/docs/auth/admin/custom-claims

## Tool status

- Steam Profiles opens a public profile by numeric Steam ID64. It never accepts refresh tokens.
- Donut Stats is a styled, explicitly unavailable integration placeholder. A verified API contract and server-side integration are needed before enabling lookup.
- No registration, guest mode, demo login, or client-side admin grant is included.

## Verification

Syntax checked locally. Firebase public configuration has been added, but administrative credentials have not been supplied. Live sign-in, custom-claim enforcement, and deployed Firestore rules have not been verified. Verify signed-out denial, non-admin denial, admin reads, and sign-out clearing before using real data.
