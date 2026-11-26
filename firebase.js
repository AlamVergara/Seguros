import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
 
const firebaseConfig = {
  apiKey: "AIzaSyDT19BrtbtYhAlzUlcg0EcJKMsIft7xt2Q",
  authDomain: "agencia-seguros-b8fd5.firebaseapp.com",
  projectId: "agencia-seguros-b8fd5",
  storageBucket: "agencia-seguros-b8fd5.firebasestorage.app",
  messagingSenderId: "742749143615",
  appId: "1:742749143615:web:60b6f00407122390502e8a"
};
 
export const configurado = !firebaseConfig.apiKey.startsWith("PEGA_AQUI");
export const auth = getAuth(initializeApp(firebaseConfig));
 