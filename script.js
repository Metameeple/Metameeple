import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://oywfzyfzpencghrpqfdk.supabase.co';
const supabaseKey = 'DEIN_ÖFFENTLICHER_API_KEY_HIER';
const supabase = createClient(supabaseUrl, supabaseKey);

// UI umschalten
function toggleUI(session) {
  document.getElementById('app').style.display = session ? 'block' : 'none';
  document.getElementById('login-form').style.display = session ? 'none' : 'block';
  document.getElementById('signup-form').style.display = session ? 'none' : 'block';
}

// Beim Laden prüfen
document.addEventListener('DOMContentLoaded', async () => {
  const { data: { session } } = await supabase.auth.getSession();
  toggleUI(session);
});

// REGISTRIERUNG
document.getElementById('signup-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;

  const { error } = await supabase.auth.signUp({ email, password });

  if (error) {
    alert('Fehler bei Registrierung: ' + error.message);
  } else {
    alert('Registrierung erfolgreich. Bitte jetzt einloggen.');
  }
});

// LOGIN
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

// Mitspieler suchen
document.getElementById('match-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const region = document.getElementById('region').value;
  const spiel = document.getElementById('spiel').value;

  const { data, error } = await supabase
    .from('spielersuche')
    .select('*')
    .eq('region', region)
    .eq('spiel', spiel);

  document.getElementById('output').innerText = error
    ? 'Fehler: ' + error.message
    : data.length > 0
      ? 'Gefundene Mitspieler:\n' + data.map(m => `- ${m.region}, ${m.spiel}`).join('\n')
      : 'Keine Mitspieler gefunden.';
});

// Spiel empfehlen
document.getElementById('recommend-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const anzahl = parseInt(document.getElementById('spieleranzahl').value);
  const dauer = parseInt(document.getElementById('dauer').value);

  let empfehlung = 'Keine Empfehlung gefunden.';

  if (anzahl <= 2 && dauer <= 30) empfehlung = 'Empfehlung: Patchwork';
  else if (anzahl <= 4 && dauer <= 60) empfehlung = 'Empfehlung: Codenames';
  else if (anzahl > 4 && dauer >= 60) empfehlung = 'Empfehlung: Werwölfe von Düsterwald';
  else if (anzahl >= 3 && dauer <= 45) empfehlung = 'Empfehlung: Azul';

  document.getElementById('output').innerText = empfehlung;
});