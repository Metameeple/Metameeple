const supabase = supabase.createClient('https://oywfzyfzpencghrpqfdk.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95d2Z6eWZ6cGVuY2docnBxZmRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyMTc4ODUsImV4cCI6MjA2NDc5Mzg4NX0.OdMh5TH47gDdFYkWYQELxruXvdjhyLuMRfRjFJ1tywM');

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    alert('Login fehlgeschlagen');
  } else {
    alert('Erfolgreich eingeloggt');
  }
});

function findPlayers() {
  const region = document.getElementById('region').value;
  const spiel = document.getElementById('spiel').value;
  document.getElementById('output').innerText = `Suche Mitspieler für "${spiel}" in "${region}"...`;
  // Hier würdest du mit Supabase eine Abfrage starten
}

function recommendGame() {
  const anzahl = parseInt(document.getElementById('spieleranzahl').value);
  const dauer = parseInt(document.getElementById('dauer').value);
  let recommendation = "Kein Spiel gefunden.";

  if (anzahl <= 2 && dauer <= 30) {
    recommendation = "Empfehlung: Patchwork";
  } else if (anzahl <= 4 && dauer <= 60) {
    recommendation = "Empfehlung: Codenames";
  } else if (anzahl > 4) {
    recommendation = "Empfehlung: Werwölfe von Düsterwald";
  }

  document.getElementById('output').innerText = recommendation;
}
