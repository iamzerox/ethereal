import { firebaseConfig } from './firebase-config.js';
const $ = id => document.getElementById(id);
let auth, authorized = false, unsubscribe, records = [], generation = 0;
function lock(message = 'Sign in with an approved administrator account.') {
  authorized = false; generation++; unsubscribe?.(); unsubscribe = undefined;
  records = []; $('records').replaceChildren(); $('record-count').textContent = '—';
  $('account').textContent = ''; $('app').hidden = true; $('login').hidden = false;
  $('login-status').textContent = message;
}
function showPage(page) {
  if (!authorized || !['overview','donut','steam'].includes(page)) return;
  document.querySelectorAll('.page').forEach(el => el.hidden = el.id !== page);
  document.querySelectorAll('nav button').forEach(el => el.classList.toggle('active', el.dataset.page === page));
  $('breadcrumb').textContent = {overview:'Overview',donut:'Donut Stats',steam:'Steam Profiles'}[page];
}
document.querySelectorAll('[data-page]').forEach(el => el.addEventListener('click', () => showPage(el.dataset.page)));
$('clear-minecraft').onclick = () => { $('minecraft').value = ''; $('minecraft').focus(); };
$('steam-form').onsubmit = event => {
  event.preventDefault(); if (!authorized) return;
  const id = $('steam-id').value.trim(); if (!/^\d{17}$/.test(id)) return;
  window.open(`https://steamcommunity.com/profiles/${encodeURIComponent(id)}`, '_blank', 'noopener,noreferrer');
  $('steam-status').textContent = 'Public profile opened in a new tab.';
};
function renderRecords() {
  $('records').replaceChildren();
  const term = $('search').value.toLowerCase();
  const visible = records.filter(r => String(r.name || '').toLowerCase().includes(term));
  for (const record of visible) {
    const tr = document.createElement('tr');
    const date = record.updatedAt?.toDate?.();
    for (const value of [record.name || 'Untitled', record.type || 'Record', date ? date.toLocaleDateString() : '—']) {
      const td = document.createElement('td'); td.textContent = String(value); tr.append(td);
    }
    $('records').append(tr);
  }
  $('data-status').hidden = visible.length > 0;
  $('data-status').textContent = term ? 'No matching records.' : 'No workspace records yet.';
  $('record-count').textContent = String(records.length);
}
$('search').oninput = renderRecords;
$('today').textContent = new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric',year:'numeric'}).format(new Date());
async function start() {
  if (!firebaseConfig?.apiKey || !firebaseConfig?.projectId || !firebaseConfig?.authDomain) {
    lock('Firebase configuration is required. Sign-in is unavailable until the workspace owner connects a project.'); return;
  }
  try {
    const [{initializeApp}, A, F] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js'),
      import('https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js')
    ]);
    const app = initializeApp(firebaseConfig); auth = A.getAuth(app);
    await A.setPersistence(auth, A.browserSessionPersistence);
    const db = F.getFirestore(app);
    $('google').disabled = false;
    $('google').onclick = async () => {
      $('google').disabled = true;
      try { await A.signInWithPopup(auth, new A.GoogleAuthProvider()); }
      catch { lock('Sign-in could not be completed. Please try again.'); }
      finally { $('google').disabled = false; }
    };
    $('logout').onclick = async () => { lock(); try { await A.signOut(auth); } catch { $('login-status').textContent = 'Sign-out could not complete. Close this tab to end the session.'; } };
    A.onIdTokenChanged(auth, async user => {
      lock(); const epoch = generation;
      if (!user) return;
      try {
        const token = await user.getIdTokenResult();
        if (epoch !== generation || auth.currentUser?.uid !== user.uid) return;
        if (token.claims.admin !== true) { await A.signOut(auth); lock('This account does not have administrator access.'); return; }
        authorized = true; $('login').hidden = true; $('app').hidden = false;
        $('account').textContent = user.email || 'Administrator'; showPage('overview');
        $('data-status').hidden = false; $('data-status').textContent = 'Loading records…';
        unsubscribe = F.onSnapshot(F.query(F.collection(db,'workspaceRecords'),F.limit(200)), snapshot => {
          if (!authorized || epoch !== generation) return;
          records = snapshot.docs.map(doc => doc.data()); renderRecords();
        }, () => {
          if (epoch !== generation) return;
          records = []; renderRecords(); $('data-status').textContent = 'Records could not be loaded. Check the database connection and deployed access rules.';
        });
      } catch { if (epoch === generation) lock('Your session could not be verified. Please sign in again.'); }
    });
  } catch { lock('Firebase could not be initialized. Check the configuration and connection, then reload.'); }
}
start();
