import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://oywfzyfzpencghrpqfdk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95d2Z6eWZ6cGVuY2docnBxZmRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyMTc4ODUsImV4cCI6MjA2NDc5Mzg4NX0.OdMh5TH47gDdFYkWYQELxruXvdjhyLuMRfRjFJ1tywM';
const supabase = createClient(supabaseUrl, supabaseKey);

let chatSubscription = null;

// NEU: Funktion, um nach neuen Nachrichten zu suchen und das Postfach zu füllen
async function checkForNewMessages() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const inboxDiv = document.getElementById('inbox-notifications');
    
    // HIER IST DIE KORREKTUR IN DER SELECT-ANWEISUNG
    const { data: messages, error } = await supabase
        .from('messages')
        .select('sender_id, profiles!sender_id ( id, nickname )') // Eindeutige Beziehung angegeben!
        .eq('receiver_id', user.id)
        .eq('is_read', false);

    if (error) {
        // Dieser Fehler sollte jetzt nicht mehr auftreten
        console.error("Fehler bei der Postfach-Abfrage:", error);
        inboxDiv.innerHTML = 'Fehler beim Laden des Postfachs.';
        return;
    }

    if (!messages || messages.length === 0) {
        inboxDiv.innerHTML = ''; // Keine Nachrichten, Postfach leeren/verstecken
        return;
    }

    const senders = messages.reduce((acc, msg) => {
        if (msg.profiles) {
            const senderId = msg.profiles.id;
            const senderNickname = msg.profiles.nickname;
            if (!acc[senderId]) {
                acc[senderId] = { nickname: senderNickname, count: 0 };
            }
            acc[senderId].count++;
        }
        return acc;
    }, {});
    
    inboxDiv.innerHTML = '<h4>Neue Nachrichten:</h4>';
    const list = document.createElement('ul');
    for (const senderId in senders) {
        const sender = senders[senderId];
        const listItem = document.createElement('li');
        listItem.innerHTML = `<strong>${sender.nickname}</strong> (${sender.count} neue Nachricht${sender.count > 1 ? 'en' : ''})`;
        listItem.onclick = () => openChat(senderId, sender.nickname);
        list.appendChild(listItem);
    }
    inboxDiv.appendChild(list);
}


async function handleAuthChange(session) {
    toggleUI(session);
    if (session) {
        // NEU: Nach dem Einloggen auf neue Nachrichten prüfen
        await checkForNewMessages();
    }
}

function toggleUI(session) {
    const app = document.getElementById('app');
    const authSection = document.getElementById('auth-section'); 
    const showAuthBtn = document.getElementById('show-auth-btn'); 
    const logoutBtnContainer = document.getElementById('logout-button-container'); // NEU

    if (session) {
        app.style.display = 'block';
        authSection.style.display = 'none'; 
        showAuthBtn.style.display = 'none'; 
        logoutBtnContainer.style.display = 'flex'; // NEU: Logout Button anzeigen
    } else {
        app.style.display = 'none';
        authSection.style.display = 'none'; 
        showAuthBtn.style.display = 'block'; 
        logoutBtnContainer.style.display = 'none'; // NEU: Logout Button verstecken
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session } } = await supabase.auth.getSession();
    await handleAuthChange(session);

    supabase.auth.onAuthStateChange((_event, session) => {
        handleAuthChange(session);
    });

    document.getElementById('chat-close-btn').addEventListener('click', closeChat);
    document.getElementById('guest-login-btn').addEventListener('click', handleGuestLogin);
    
    // NEU: Event-Listener für den Button, der die Auth-Sektion zeigt
    document.getElementById('show-auth-btn').addEventListener('click', () => {
        document.getElementById('auth-section').style.display = 'block';
        document.getElementById('show-auth-btn').style.display = 'none';
    });

    // NEU: Event-Listener für Filter-Checkboxes
    document.getElementById('enable-spieleranzahl').addEventListener('change', function() {
        document.getElementById('spieleranzahl').disabled = !this.checked;
        if (!this.checked) document.getElementById('spieleranzahl').value = '';
    });
    document.getElementById('enable-dauer').addEventListener('change', function() {
        document.getElementById('dauer').disabled = !this.checked;
        if (!this.checked) document.getElementById('dauer').value = '';
    });
    document.getElementById('enable-min-age').addEventListener('change', function() {
        document.getElementById('min-age').disabled = !this.checked;
        if (!this.checked) document.getElementById('min-age').value = '';
    });

    // Initialen Zustand setzen (falls Checkboxes beim Laden schon unchecked sind)
    document.getElementById('spieleranzahl').disabled = !document.getElementById('enable-spieleranzahl').checked;
    document.getElementById('dauer').disabled = !document.getElementById('enable-dauer').checked;
    document.getElementById('min-age').disabled = !document.getElementById('enable-min-age').checked;
});

// ERSETZE die alte Registrierungs-Funktion mit dieser:
document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Alle Daten aus dem Formular sammeln
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const nickname = document.getElementById('register-nickname').value;
    const region = document.getElementById('register-region').value;
    const age = document.getElementById('register-age').value;
    const favorite_game = document.getElementById('register-favorite-game').value;

    // Den "Daten-Rucksack" (options.data) packen
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                nickname: nickname,
                region: region,
                alter: age, // Wichtig: wird als Text gespeichert, die Datenbank wandelt es um
                favorite_game: favorite_game
            }
        }
    });

    if (error) {
        alert('Registrierung fehlgeschlagen: ' + error.message);
        return;
    }

    alert('Registrierung erfolgreich! Bitte prüfe deine E-Mails, um deinen Account zu bestätigen.');
    e.target.reset();
});
// ... Login-Funktion (unverändert) ...
document.getElementById('login-form').addEventListener('submit', async (e) => { e.preventDefault(); const email = document.getElementById('login-email').value; const password = document.getElementById('login-password').value; const { data, error } = await supabase.auth.signInWithPassword({ email, password }); if (error) { alert('Login fehlgeschlagen: ' + error.message); return; } document.getElementById('login-form').reset(); document.getElementById('register-form').reset(); });


// NEU: Gast-Login Funktion
async function handleGuestLogin() {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) {
        alert('Gast-Login fehlgeschlagen: ' + error.message);
        return;
    }
    // Nach erfolgreichem Gast-Login können wir optional ein Profil anlegen
    // oder einfach die UI aktualisieren.
    // Für dieses Beispiel aktualisieren wir nur die UI.
    alert('Erfolgreich als Gast eingeloggt!');
    // Die handleAuthChange Funktion wird durch onAuthStateChange aufgerufen
    // und kümmert sich um die UI-Aktualisierung.
}


// ... Ausloggen-Funktion (jetzt mit Postfach leeren) ...
document.getElementById('logout-btn').addEventListener('click', async () => {
    await supabase.auth.signOut();
    document.getElementById('output-match').innerHTML = '';
    document.getElementById('output-recommend').innerHTML = '';
    // NEU: Postfach leeren beim Ausloggen
    document.getElementById('inbox-notifications').innerHTML = '';
});


// ======================= ANFANG: AKTUALISIERTER SPIELEMPFEHLUNGS-CODE =======================

// GEÄNDERT: Zwei globale Variablen zum Speichern der Listen
let originalRecommendations = []; // Speichert die unveränderte Originalliste
let currentRecommendations = [];  // Speichert die Liste, die sortiert und angezeigt wird

// Hilfsfunktion, um Text-Komplexität in sortierbare Zahlen umzuwandeln
function getComplexityValue(complexity) {
    const complexityMap = {
        'sehr leicht': 1,
        'leicht': 2,
        'mittel': 3,
        'hoch': 4,
        'sehr hoch': 5,
        'experte': 6
    };
    return complexityMap[String(complexity).toLowerCase()] || 99; // Unbekannte Werte ans Ende
}

// Funktion, die die Spiele-Liste im HTML darstellt (unverändert)
function renderRecommendations(recommendations) {
    const outputDiv = document.getElementById('output-recommend');
    outputDiv.innerHTML = '<h3>Empfohlene Spiele:</h3>'; // Container leeren und Überschrift setzen

    if (!recommendations || recommendations.length === 0) {
        outputDiv.innerHTML += '<p>Keine passenden Empfehlungen gefunden.</p>';
        return;
    }

    recommendations.forEach(r => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'result-item';

        let imageHtml = r.image_url ?
            `<img src="${r.image_url}" alt="Bild von ${r.spiel}" class="game-image">` :
            `<img src="https://via.placeholder.com/150?text=Kein+Bild" alt="Platzhalterbild" class="game-image">`;

        const descriptionHtml = r.description ? `<p>${r.description}</p>` : '';

        itemDiv.innerHTML = `
            <a href="${r.BGG}" target="_blank" class="game-title-link">${r.spiel}</a>
            <div class="result-item-content">
                ${imageHtml}
                <div class="result-item-details">
                    ${descriptionHtml}
                    <p><strong>Autor:</strong> ${r.Autor || 'N/A'}</p>
                    <p><strong>Komplexität:</strong> ${r.Komplexität || 'N/A'}</p>
                    <p><strong>Max. Dauer:</strong> ${r.max_dauer || 'N/A'} Minuten</p>
                    <a href="${r.Buy}" target="_blank" class="action-button">Bei Amazon kaufen</a>
                </div>
            </div>
        `;
        outputDiv.appendChild(itemDiv);
    });
}

// Event-Listener für das Empfehlungs-Formular (unverändert)
document.getElementById('recommend-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const anzahl = parseInt(document.getElementById('spieleranzahl').value);
    const dauer = parseInt(document.getElementById('dauer').value);
    const minAge = parseInt(document.getElementById('min-age').value);

    const enableAnzahl = document.getElementById('enable-spieleranzahl').checked;
    const enableDauer = document.getElementById('enable-dauer').checked;
    const enableMinAge = document.getElementById('enable-min-age').checked;

    const outputDiv = document.getElementById('output-recommend');
    const sortControls = document.getElementById('sort-controls');
    
    outputDiv.innerText = 'Suche nach Empfehlungen...';
    sortControls.style.display = 'none'; // Sortier-Buttons während der Suche ausblenden

    let query = supabase.from('spielempfehlungen').select('spiel, Autor, Komplexität, BGG, Buy, image_url, description, max_dauer');

    if (enableAnzahl && !isNaN(anzahl)) {
        query = query.lte('min_spieler', anzahl).gte('max_spieler', anzahl);
    }
    if (enableDauer && !isNaN(dauer)) {
        query = query.gte('max_dauer', dauer);
    }
    if (enableMinAge && !isNaN(minAge)) {
        query = query.lte('Alter_min', minAge);
    }

    const { data: recommendations, error } = await query;

    if (error) {
        outputDiv.innerText = 'Fehler: ' + error.message;
        return;
    }
    
    // GEÄNDERT: Beide Listen mit den neuen Ergebnissen füllen
    originalRecommendations = recommendations || [];
    currentRecommendations = [...originalRecommendations]; // Eine bearbeitbare Kopie erstellen
    
    // Sortier-Buttons nur anzeigen, wenn Ergebnisse vorhanden sind
    document.querySelectorAll('#sort-controls button').forEach(btn => btn.classList.remove('active'));
    if (currentRecommendations.length > 0) {
        sortControls.style.display = 'flex';
    }
    
    // Ergebnisse zum ersten Mal rendern
    renderRecommendations(currentRecommendations);
});

// GEÄNDERT: Event-Listener für die Sortier-Buttons mit Toggle-Funktion
document.getElementById('sort-controls').addEventListener('click', (e) => {
    // Nur reagieren, wenn ein Button geklickt wurde
    if (!e.target.matches('button')) return;

    const clickedButton = e.target;
    const isAlreadyActive = clickedButton.classList.contains('active');

    // Zuerst alle Buttons deaktivieren
    document.querySelectorAll('#sort-controls button').forEach(btn => btn.classList.remove('active'));

    if (isAlreadyActive) {
        // --- FALL 1: Button war bereits aktiv ---
        // Sortierung wird aufgehoben, indem die ursprüngliche Reihenfolge wiederhergestellt wird.
        currentRecommendations = [...originalRecommendations];
        renderRecommendations(currentRecommendations);
    } else {
        // --- FALL 2: Ein neuer Button wird aktiviert ---
        clickedButton.classList.add('active'); // Nur den geklickten Button aktivieren

        const sortKey = clickedButton.dataset.sort;
        const sortOrder = clickedButton.dataset.order;

        // Die Liste sortieren
        currentRecommendations.sort((a, b) => {
            let valA, valB;

            switch (sortKey) {
                case 'name':
                    valA = (a.spiel || '').toLowerCase();
                    valB = (b.spiel || '').toLowerCase();
                    break;
                case 'duration':
                    valA = a.max_dauer || 0;
                    valB = b.max_dauer || 0;
                    break;
                case 'complexity':
                    valA = getComplexityValue(a.Komplexität);
                    valB = getComplexityValue(b.Komplexität);
                    break;
                default:
                    return 0;
            }

            if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
            if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
        
        // Liste neu mit der sortierten Reihenfolge rendern
        renderRecommendations(currentRecommendations);
    }
});

// ======================= ENDE: AKTUALISIERTER SPIELEMPFEHLUNGS-CODE =========================


// ... Mitspieler finden (unverändert) ...
document.getElementById('match-form').addEventListener('submit', async (e) => { e.preventDefault(); const region = document.getElementById('region').value; const spiel = document.getElementById('spiel').value; const outputDiv = document.getElementById('output-match'); const { data: { user } } = await supabase.auth.getUser(); if (!user) return; const { data: matches, error } = await supabase .from('profiles') .select('id, nickname, alter, region, favorite_game') .eq('region', region) .eq('favorite_game', spiel) .neq('id', user.id); if (error) { outputDiv.innerText = 'Fehler: ' + error.message; return; } if (matches.length === 0) { outputDiv.innerText = 'Keine passenden Mitspieler gefunden.'; } else { outputDiv.innerHTML = '<h3>Gefundene Mitspieler:</h3>'; matches.forEach(m => { const itemDiv = document.createElement('div'); itemDiv.className = 'result-item'; const text = document.createElement('p'); text.textContent = `${m.nickname} (Alter: ${m.alter}, Region: ${m.region})`; const chatBtn = document.createElement('button'); chatBtn.textContent = 'Chatten'; chatBtn.className = 'action-button chat-button'; chatBtn.dataset.receiverId = m.id; chatBtn.dataset.receiverNickname = m.nickname; chatBtn.onclick = () => openChat(m.id, m.nickname); itemDiv.appendChild(text); itemDiv.appendChild(chatBtn); outputDiv.appendChild(itemDiv); }); } });

// --- CHAT FUNKTIONEN (mit "als gelesen markieren") ---

async function openChat(receiverId, receiverNickname) {
    const modal = document.getElementById('chat-modal');
    const chatTitle = document.getElementById('chat-with-user');
    const messagesDiv = document.getElementById('chat-messages');
    
    chatTitle.textContent = `Chat mit ${receiverNickname}`;
    messagesDiv.innerHTML = 'Lade Nachrichten...';
    modal.dataset.receiverId = receiverId;
    modal.style.display = 'flex';

    const { data: { user } } = await supabase.auth.getUser();
    const senderId = user.id;

    // Nachrichten als gelesen markieren
    await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('receiver_id', senderId)
        .eq('sender_id', receiverId);
    
    // Postfach aktualisieren
    await checkForNewMessages();

    // Nachrichten abrufen
    const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        // HIER IST DIE KORREKTUR: Die Klammern () wurden durch and() ersetzt
        .or(`and(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${senderId})`)
        .order('created_at', { ascending: true });

    if (error) {
        // Dieser Fehler sollte jetzt nicht mehr auftreten
        console.error("Fehler beim Laden des Chats:", error);
        messagesDiv.innerText = 'Fehler beim Laden der Nachrichten.';
        return;
    }
    
    messagesDiv.innerHTML = '';
    messages.forEach(msg => displayMessage(msg, senderId));
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

    // Subscription für neue Nachrichten
    const channelName = `chat-${[senderId, receiverId].sort().join('-')}`;
    if(chatSubscription) supabase.removeChannel(chatSubscription);
    chatSubscription = supabase
        .channel(channelName, { config: { broadcast: { self: true } } })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
            if ((payload.new.sender_id === senderId && payload.new.receiver_id === receiverId) ||
                (payload.new.sender_id === receiverId && payload.new.receiver_id === senderId)) {
                displayMessage(payload.new, senderId);
                messagesDiv.scrollTop = messagesDiv.scrollHeight;
            }
        })
        .subscribe();
}

function displayMessage(message, currentUserId) {
    const messagesDiv = document.getElementById('chat-messages');
    const msgDiv = document.createElement('div');
    msgDiv.className = 'chat-message';
    msgDiv.textContent = message.content;
    if (message.
        
