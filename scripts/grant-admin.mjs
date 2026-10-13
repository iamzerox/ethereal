// Run only in a trusted environment with Application Default Credentials.
// Firebase CLI login and Admin SDK credentials are separate.
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
initializeApp({ credential: applicationDefault(), projectId: 'ethereal-dashboard' });
const auth = getAuth();
const email = 'bgcon10fps@gmail.com';
try {
  const user = await auth.getUserByEmail(email);
  if (!user.emailVerified || !user.providerData.some(p => p.providerId === 'google.com')) {
    throw new Error('Sign in through Google with the intended account before granting access.');
  }
  await auth.setCustomUserClaims(user.uid, { ...user.customClaims, admin: true });
  const updated = await auth.getUser(user.uid);
  if (updated.customClaims?.admin !== true) throw new Error('Admin claim verification failed.');
  console.log('Administrator access granted. Sign out and sign back in to refresh your session.');
} catch (error) {
  console.error(error.code === 'auth/user-not-found'
    ? 'Account not found. First attempt Google sign-in on Etherium to create the Firebase account.'
    : 'Admin setup failed. Check trusted application credentials, IAM access, and verified Google sign-in.');
  process.exitCode = 1;
}
