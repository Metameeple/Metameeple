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

    const { data: messages, error } = await supabase
        .from('messages')
        .select('sender_id, profiles ( id, nickname )')
        .eq('receiver_id', user.id)
        .eq('is_read', false);

    if (error || !messages || messages.length === 0) {
        inboxDiv.innerHTML = ''; // Keine Nachrichten, Postfach leeren/verstecken
        return;
    }

    // Nachrichten nach Absender gruppieren
    const senders = messages.reduce((acc, msg) => {
        const senderId = msg.profiles.id;
        const senderNickname = msg.profiles.nickname;
        if (!acc[senderId]) {
            acc[senderId] = { nickname: senderNickname, count: 0 };
        }
        acc[senderId].count++;
        return acc;
    }, {});
    
    // Postfach-HTML aufbauen
    inboxDiv.innerHTML = '<h4>Neue Nachrichten:</h4>';
    const list = document.createElement('ul');
    for (const senderId in senders) {
        const sender = senders[senderId];
        const listItem = document.createElement('li');
        listItem.innerHTML = `<strong>${sender.nickname}</strong> (${sender.count} neue Nachricht${sender.count > 1 ? 'en' : ''})`;
        listItem.onclick = () => openChat(senderId, sender.nickname); // Chat direkt öffnen
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

document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session } } = await supabase.auth.getSession();
    await handleAuthChange(session);

    supabase.auth.onAuthStateChange((_event, session) => {
        handleAuthChange(session);
    });

    document.getElementById('chat-close-btn').addEventListener('click', closeChat);
});

// ... Registrierungs-Funktion (unverändert) ...
document.getElementById('register-form').addEventListener('submit', async (e) => { e.preventDefault(); const email = document.getElementById('register-email').value; const password = document.getElementById('register-password').value; const nickname = document.getElementById('register-nickname').value; const alter = document.getElementById('register-age').value; const region = document.getElementById('register-region').value; const favorite_game = document.getElementById('register-favorite-game').value; const { data: existingProfile, error: checkError } = await supabase .from('profiles') .select('nickname') .eq('nickname', nickname) .single(); if (existingProfile) { alert('Dieser Nickname ist bereits vergeben. Bitte wähle einen anderen.'); return; } const { data, error } = await supabase.auth.signUp({ email, password }); if (error) { alert('Registrierung fehlgeschlagen: ' + error.message); return; } if (data.user) { const { error: insertError } = await supabase.from('profiles').insert({ id: data.user.id, email: data.user.email, nickname, alter, region, favorite_game }); if (insertError) { alert('Fehler beim Speichern des Profils: ' + insertError.message); return; } alert('Registrierung erfolgreich! Bitte bestätige deine E-Mail und logge dich dann ein.'); e.target.reset(); } });

// ... Login-Funktion (unverändert) ...
document.getElementById('login-form').addEventListener('submit', async (e) => { e.preventDefault(); const email = document.getElementById('login-email').value; const password = document.getElementById('login-password').value; const { data, error } = await supabase.auth.signInWithPassword({ email, password }); if (error) { alert('Login fehlgeschlagen: ' + error.message); return; } document.getElementById('login-form').reset(); document.getElementById('register-form').reset(); });


// ... Ausloggen-Funktion (jetzt mit Postfach leeren) ...
document.getElementById('logout-btn').addEventListener('click', async () => {
    await supabase.auth.signOut();
    document.getElementById('output-match').innerHTML = '';
    document.getElementById('output-recommend').innerHTML = '';
    // NEU: Postfach leeren beim Ausloggen
    document.getElementById('inbox-notifications').innerHTML = '';
});


// SPIELEMPFEHLUNG (mit korrigiertem Filter)
document.getElementById('recommend-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const anzahl = parseInt(document.getElementById('spieleranzahl').value);
    const dauer = parseInt(document.getElementById('dauer').value);
    const minAge = parseInt(document.getElementById('min-age').value);
    const outputDiv = document.getElementById('output-recommend');

    const { data: recommendations, error } = await supabase
        .from('spielempfehlungen')
        .select('spiel, Autor, Komplexität, BGG, Buy')
        .lte('min_spieler', anzahl)
        .gte('max_spieler', anzahl)
        // GEÄNDERT: Korrekte Logik für die Dauer
        .lte('max_dauer', dauer)
        .gte('Alter_min', minAge);

    // Rest der Funktion bleibt gleich...
    if (error) { outputDiv.innerText = 'Fehler: ' + error.message; return; }
    if (!recommendations || recommendations.length === 0) { outputDiv.innerText = 'Keine passenden Empfehlungen gefunden.'; } else { outputDiv.innerHTML = '<h3>Empfohlene Spiele:</h3>'; recommendations.forEach(r => { const itemDiv = document.createElement('div'); itemDiv.className = 'result-item'; itemDiv.innerHTML = `<a href="${r.BGG}" target="_blank" class="game-title-link">${r.spiel}</a><p><strong>Autor:</strong> ${r.Autor || 'N/A'}</p><p><strong>Komplexität:</strong> ${r.Komplexität || 'N/A'}</p><a href="${r.Buy}" target="_blank" class="action-button">Bei Amazon kaufen</a>`; outputDiv.appendChild(itemDiv); }); }
});

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

    // GEÄNDERT: Nachrichten als gelesen markieren, BEVOR sie angezeigt werden
    await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('receiver_id', senderId)
        .eq('sender_id', receiverId);
    
    // NEU: Nach dem Markieren das Postfach aktualisieren, damit die Benachrichtigung verschwindet
    await checkForNewMessages();

    // Nachrichten abrufen
    const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .or(`(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),(sender_id.eq.${receiverId},receiver_id.eq.${senderId})`)
        .order('created_at', { ascending: true });

    if (error) { messagesDiv.innerText = 'Fehler beim Laden der Nachrichten.'; return; }
    
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
    if (message.sender_id === currentUserId) {
        msgDiv.classList.add('sent');
    } else {
        msgDiv.classList.add('received');
    }
    messagesDiv.appendChild(msgDiv);
}

function closeChat() {
    document.getElementById('chat-modal').style.display = 'none';
    if (chatSubscription) {
        supabase.removeChannel(chatSubscription);
        chatSubscription = null;
    }
}

// Nachricht senden
document.getElementById('chat-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const chatInput = document.getElementById('chat-input');
    const content = chatInput.value.trim();
    if (!content) return;

    const { data: { user } } = await supabase.auth.getUser();
    const sender_id = user.id;
    const receiver_id = document.getElementById('chat-modal').dataset.receiverId;

    // --- DEBUGGING START ---
    console.log("Sende Nachricht...");
    console.log("Sender ID:", sender_id);
    console.log("Receiver ID:", receiver_id);
    // --- DEBUGGING ENDE ---
    
    const { error } = await supabase.from('messages').insert({
        sender_id,
        receiver_id,
        content
    });

    if (error) {
   // --- DEBUGGING START ---
// Zeige den exakten Fehler in der Entwicklerkonsole an!
        console.error('Supabase INSERT Error:', error);
    // --- DEBUGGING ENDE ---     
        alert('Fehler beim Senden der Nachricht: ' + error.message);
         
    } else {
        chatInput.value = '';
    }
});
