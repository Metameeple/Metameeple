// === Supabase Initialisierung ===
const supabaseUrl = 'https://oywfzyfzpencghrpqfdk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95d2Z6eWZ6cGVuY2docnBxZmRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyMTc4ODUsImV4cCI6MjA2NDc5Mzg4NX0.OdMh5TH47gDdFYkWYQELxruXvdjhyLuMRfRjFJ1tywM';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// === Login-Formular behandeln ===
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    alert('Login fehlgeschlagen: ' + error.message);
  } else {
    alert('Erfolgreich eingeloggt');
    const session = data.session;
    const user = data.user;
    // Optional: automatisch ein Profil erstellen, falls noch nicht vorhanden
    await createOrUpdateProfile(user.id);
  }
});

// === Profil-Erstellung (nur wenn nicht vorhanden) ===
async function createOrUpdateProfile(userId) {
  const { data: existing, error: selectError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (!existing) {
    const { error: insertError } = await supabase
      .from('user_profiles')
      .insert([{ id: userId, username: '', region: '', lieblingsspiel: '' }]);
    if (insertError) {
      console.error('Fehler beim Anlegen des Profils:', insertError.message);
    }
  }
}

// === Mitspieler-Suche speichern ===
async function findPlayers() {
  const spiel = document.getElementById('spiel').value;
  const region = document.getElementById('region').value;

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    alert('Bitte zuerst einloggen.');
    return;
  }

  const { error } = await supabase.from('game_requests').insert([
    {
      user_id: user.id,
      spiel: spiel,
      region: region
    }
  ]);

  if (error) {
    alert('Fehler beim Speichern der Anfrage: ' + error.message);
  } else {
    document.getElementById('output').innerText = `Gesuch für "${spiel}" in "${region}" gespeichert.`;
  }
}

// === Brettspiel-Empfehlung ===
function recommendGame() {
  const anzahl = parseInt(document.getElementById('spieleranzahl').value);
  const dauer = parseInt(document.getElementById('dauer').value);
  let recommendation = "Keine Empfehlung gefunden.";

  if (anzahl <= 2 && dauer <= 30) {
    recommendation = "Empfehlung: Patchwork – ideal für 2 Spieler und kurze Dauer.";
  } else if (anzahl <= 4 && dauer <= 60) {
    recommendation = "Empfehlung: Codenames – leicht, schnell und für 2–4 Spieler.";
  } else if (anzahl > 4 && dauer >= 60) {
    recommendation = "Empfehlung: Werwölfe von Düsterwald – super für Gruppen!";
  } else if (anzahl >= 3 && dauer <= 45) {
    recommendation = "Empfehlung: Azul – tolles Strategiespiel mit kurzer Dauer.";
  }

  document.getElementById('output').innerText = recommendation;
}
