import { auth } from './firebase.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

let cargada = false;
onAuthStateChanged(auth, user => {
  if (!user) { location.replace('login.html'); return; }
  if (cargada) return;
  cargada = true;
  window.AGENCIA_UID = user.uid;
  window.AGENCIA_NAME = user.displayName || '';
  document.querySelector('#who').textContent = user.displayName || user.email;
  document.body.classList.remove('cargando');
  const s = document.createElement('script');
  s.src = 'app.js';
  document.body.append(s);
});
document.querySelector('#logout').addEventListener('click', () => signOut(auth));