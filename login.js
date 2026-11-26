import { auth, configurado } from './firebase.js';
import {
  signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile,
  sendPasswordResetEmail, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const $ = s => document.querySelector(s);
const msg = (t, ok) => { const m = $('#msg'); m.textContent = t; m.className = ok ? 'ok' : 'err'; };
const errores = {
  'auth/invalid-credential': 'Correo o contraseña incorrectos.',
  'auth/invalid-email': 'El correo no es válido.',
  'auth/missing-email': 'Escribe tu correo primero.',
  'auth/email-already-in-use': 'Ese correo ya tiene una cuenta. Inicia sesión.',
  'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
  'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.',
  'auth/user-disabled': 'Esta cuenta está desactivada.',
  'auth/network-request-failed': 'Sin conexión. Revisa tu internet.'
};

if (!configurado) msg('Falta pegar la configuración de Firebase en firebase.js.');

// Mientras se crea la cuenta y se guarda el nombre, no se redirige todavía
let ocupado = false;
onAuthStateChanged(auth, u => { if (u && !ocupado) location.replace('index.html'); });

let registro = false;
function modo(r) {
  registro = r;
  msg('');
  $('#titulo').textContent = r ? 'Crear cuenta' : 'Iniciar sesión';
  $('#intro').textContent = r ? 'Completa tus datos para registrarte.' : 'Entra con tu correo y contraseña.';
  $('#go').textContent = r ? 'Crear cuenta' : 'Entrar';
  $('#rowTop').hidden = $('#rowTel').hidden = $('#row2').hidden = !r;
  $('#forgot').hidden = r;
  $('#alt-text').textContent = r ? '¿Ya tienes cuenta?' : '¿Aún no tienes cuenta?';
  $('#toggle').textContent = r ? 'Iniciar sesión' : 'Crear cuenta';
  $('#pass').autocomplete = r ? 'new-password' : 'current-password';
  document.title = r ? 'Crear cuenta' : 'Iniciar sesión';
}
$('#toggle').addEventListener('click', () => modo(!registro));

$('#login').addEventListener('submit', async e => {
  e.preventDefault();
  const email = $('#email').value.trim(), pass = $('#pass').value;
  let perfil;
  if (registro) {
    const nombre = $('#nombre').value.trim(), apellido = $('#apellido').value.trim();
    const telefono = $('#tel').value.replace(/\D/g, '');
    if (!nombre || !apellido) return msg('Escribe tu nombre y tu apellido.');
    if (!email) return msg(errores['auth/missing-email']);
    if (telefono.length < 10) return msg('Escribe un número de teléfono de 10 dígitos.');
    if (pass.length < 6) return msg(errores['auth/weak-password']);
    if (pass !== $('#pass2').value) return msg('Las contraseñas no coinciden.');
    perfil = { nombre, apellido, telefono };
  }
  const btn = $('#go'); btn.disabled = true; msg('');
  try {
    if (registro) {
      ocupado = true;
      const { user } = await createUserWithEmailAndPassword(auth, email, pass);
      try {
        await updateProfile(user, { displayName: `${perfil.nombre} ${perfil.apellido}` });
        localStorage.setItem('agencia-perfil-' + user.uid, JSON.stringify({ ...perfil, correo: email }));
      } catch {}
      location.replace('index.html');
    } else {
      await signInWithEmailAndPassword(auth, email, pass);
    }
  } catch (err) {
    ocupado = false;
    msg(errores[err.code] || (registro ? 'No se pudo crear la cuenta. Inténtalo de nuevo.' : 'No se pudo iniciar sesión. Inténtalo de nuevo.'));
    btn.disabled = false;
  }
});

$('#forgot').addEventListener('click', async () => {
  const email = $('#email').value.trim();
  if (!email) return msg('Escribe tu correo arriba y vuelve a pulsar esta opción.');
  try {
    await sendPasswordResetEmail(auth, email);
    msg('Te enviamos un correo para restablecer tu contraseña.', true);
  } catch (err) { msg(errores[err.code] || 'No se pudo enviar el correo.'); }
});

$('#show').addEventListener('click', () => {
  const ver = $('#pass').type === 'password';
  $('#pass').type = ver ? 'text' : 'password';
  $('#pass2').type = ver ? 'text' : 'password';
  $('#show').textContent = ver ? 'Ocultar' : 'Mostrar';
});