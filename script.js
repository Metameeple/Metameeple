import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://oywfzyfzpencghrpqfdk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95d2Z6eWZ6cGVuY2docnBxZmRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyMTc4ODUsImV4cCI6MjA2NDc5Mzg4NX0.OdMh5TH47gDdFYkWYQELxruXvdjhyLuMRfRjFJ1tywM';

const supabase = createClient(supabaseUrl, supabaseKey);

// UI basierend auf Login-Status umschalten
function toggleUI(session) {
  const app = document.getElementById('app');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');

  if (session) {
    app.style.display = 'block';
    loginForm.style.display = 'none';
    registerForm.style.display = 'none';
  } else {
    app.style.display = 'none';
    loginForm.style.display = 'block';
    registerForm.style.display = 'block';
  }
}

// Seite geladen → Login-Status prüfen
document.addEventListener('DOMContentLoaded', async () => {
  const { data: { session } } = await supabase.auth.getSession();
  toggleUI(session);
});

// REGISTRIERUNG
document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;
  const region = document.getElementById('register-region').value;
  const favorite_game = document.getElementById('register-favorite-game').value;

  // User registrieren
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    alert('Registrierung fehlgeschlagen: ' + error.message);
    return;
  }

  alert('Registrierung erfolgreich! Bitte logge dich jetzt ein.');

  // Profil-Daten in Tabelle profiles speichern
  // Warte bis user-Objekt verfügbar (registrierung ohne sofortige Anmeldung)
  // User muss sich nochmal einloggen, daher hier noch nicht speichern
  // Stattdessen Profil wird erst nach Login eingetragen (siehe Login-Event)

  // Formular zurücksetzen
  e.target.reset();
});

// LOGIN
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    alert('Login fehlgeschlagen: ' + error.message);
    return;
  }

  // Nach Login Profil prüfen und ggf. anlegen/aktualisieren
  const user = data.user;
  const profileCheck = await supabase.from('profiles').select('*').eq('id', user.id).single();

  if (profileCheck.error || !profileCheck.data) {
    // Kein Profil vorhanden → Daten aus Registrierung nicht gespeichert
    // Bitte User nach Region & Lieblingsspiel fragen (Popup oder Formular)
    // Hier einfach ein prompt als Beispiel:
    const region = prompt('Bitte gib deine Region ein:');
    const favorite_game = prompt('Bitte gib dein Lieblingsspiel ein:');

    if (!region || !favorite_game) {
      alert('Region und Lieblingsspiel sind erforderlich.');
      await supabase.auth.signOut();
      toggleUI(null);
      return;
    }

    // Profil speichern
    const { error: insertError } = await supabase.from('profiles').insert({
      id: user.id,
      email: user.email,
      region,
      favorite_game
    });

    if (insertError) {
      alert('Fehler beim Speichern des Profils: ' + insertError.message);
      await supabase.auth.signOut();
      toggleUI(null);
      return;
    }
  }

  toggleUI(data.session);

  // Formulare zurücksetzen
  document.getElementById('login-form').reset();
  document.getElementById('register-form').reset();
});

// Ausloggen
document.getElementById('logout-btn').addEventListener('click', async () => {
  await supabase.auth.signOut();
  toggleUI(null);
  document.getElementById('output').innerText = '';
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

  // Suche nach registrierten Usern, deren Profilregion und Lieblingsspiel passen
  const { data: matches, error } = await supabase
    .from('profiles')
    .select('id, email, region, favorite_game')
    .eq('region', region)
    .eq('favorite_game', spiel);

  if (error) {
    document.getElementById('output').innerText = 'Fehler: ' + error.message;
    return;
  }

  if (matches.length === 0) {
    document.getElementById('output').innerText = 'Keine passenden Mitspieler gefunden.';
  } else {
    document.getElementById('output').innerText = 'Gefundene Mitspieler:\n' + matches.map(m => `- ${m.email} (${m.region}, Lieblingsspiel: ${m.favorite_game})`).join('\n');
  }
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

  // Suche in spielempfehlungen-Tabelle
  const { data: recommendations, error } = await supabase
    .from('spielempfehlungen')
    .select('spiel')
  .lte('max_spieler', anzahl)      // max_spieler ≥ anzahl
  .gte('min_spieler', anzahl)      // min_spieler ≤ anzahl
  .lte('max_dauer', dauer)          // max_dauer ≥ dauer
  .gte('min_dauer', dauer);         // min_dauer ≤ dauer

  if (error) {
    document.getElementById('output').innerText = 'Fehler: ' + error.message;
  }
  if (!recommendations || recommendations.length === 0) {
    document.getElementById('output').innerText = 'Keine Empfehlungen gefunden.';
  } else {
    document.getElementById('output').innerText = 'Empfohlene Spiele:\n' + recommendations.map(r => `- ${r.spiel}`).join('\n');
  }
 
});
