import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://oywfzyfzpencghrpqfdk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95d2Z6eWZ6cGVuY2docnBxZmRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyMTc4ODUsImV4cCI6MjA2NDc5Mzg4NX0.OdMh5TH47gDdFYkWYQELxruXvdjhyLuMRfRjFJ1tywM';
const supabase = createClient(supabaseUrl, supabaseKey);


// UI basierend auf Login-Status umschalten
function toggleUI(session) {
  const app = document.getElementById('app');
  const loginForm = document.getElementById('login-form');
  if (session) {
    app.style.display = 'block';
    loginForm.style.display = 'none';
  } else {
    app.style.display = 'none';
    loginForm.style.display = 'block';
  }
}

// Seite geladen → Login-Status prüfen
document.addEventListener('DOMContentLoaded', async () => {
  const { data: { session } } = await supabase.auth.getSession();
  toggleUI(session);
});

// LOGIN-FORM
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    alert('Login fehlgeschlagen: ' + error.message);
  } else {
    toggleUI(data.session);
  }
});

document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    alert('Registrierung fehlgeschlagen: ' + error.message);
  } else {
    alert('Registrierung erfolgreich! Bitte einloggen.');
  }
});
// Nach erfolgreicher Registrierung
document.getElementById('profile-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase
    .from('profiles')
    .upsert({ id: user.id, username });

  if (error) {
    alert('Fehler beim Speichern: ' + error.message);
  } else {
    alert('Profil gespeichert!');
  }
});

// Mitspieler finden
document.getElementById('match-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    alert('Bitte zuerst einloggen.');
    return;
  }

  const region = document.getElementById('region').value;
  const spiel = document.getElementById('spiel').value;

  const { data: matches, error } = await supabase
    .from('spielersuche')
    .select('*')
    .eq('region', region)
    .eq('spiel', spiel);

  document.getElementById('output').innerText = error
    ? 'Fehler: ' + error.message
    : matches.length > 0
    ? 'Gefundene Mitspieler:\n' + matches.map(m => `- ${m.region}, ${m.spiel}`).join('\n')
    : 'Keine passenden Mitspieler gefunden.';
});

// Spiel empfehlen
document.getElementById('recommend-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    alert('Bitte zuerst einloggen.');
    return;
  }

  const anzahl = parseInt(document.getElementById('spieleranzahl').value);
  const dauer = parseInt(document.getElementById('dauer').value);
  let recommendation = 'Keine Empfehlung gefunden.';

  if (anzahl <= 2 && dauer <= 30) {
    recommendation = 'Empfehlung: Patchwork';
  } else if (anzahl <= 4 && dauer <= 60) {
    recommendation = 'Empfehlung: Codenames';
  } else if (anzahl > 4 && dauer >= 60) {
    recommendation = 'Empfehlung: Werwölfe von Düsterwald';
  } else if (anzahl >= 3 && dauer <= 45) {
    recommendation = 'Empfehlung: Azul';
  }

  document.getElementById('output').innerText = recommendation;
});
