import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://oywfzyfzpencghrpqfdk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95d2Z6eWZ6cGVuY2docnBxZmRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyMTc4ODUsImV4cCI6MjA2NDc5Mzg4NX0.OdMh5TH47gDdFYkWYQELxruXvdjhyLuMRfRjFJ1tywM';
const supabase = createClient(supabaseUrl, supabaseKey);

// Globale Variable für die Chat-Subscription
let chatSubscription = null;

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

    // Event Listener für Chat-Schließen-Button
    document.getElementById('chat-close-btn').addEventListener('click', closeChat);
});

// REGISTRIERUNG
document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const nickname = document.getElementById('register-nickname').value;
    const alter = document.getElementById('register-age').value;
    const region = document.getElementById('register-region').value;
    const favorite_game = document.getElementById('register-favorite-game').value;

    // 1. Prüfen, ob der Nickname bereits existiert
    const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('nickname')
        .eq('nickname', nickname)
        .single();

    if (existingProfile) {
        alert('Dieser Nickname ist bereits vergeben. Bitte wähle einen anderen.');
        return;
    }

    // 2. User registrieren
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
        alert('Registrierung fehlgeschlagen: ' + error.message);
        return;
    }

    if (data.user) {
        // 3. Profil-Daten sofort in Tabelle 'profiles' speichern
        const { error: insertError } = await supabase.from('profiles').insert({
            id: data.user.id,
            email: data.user.email,
            nickname,
            alter,
            region,
            favorite_game
        });

        if (insertError) {
            alert('Fehler beim Speichern des Profils: ' + insertError.message);
            // Optional: User wieder löschen, wenn Profilerstellung fehlschlägt
            return;
        }

        alert('Registrierung erfolgreich! Bitte bestätige deine E-Mail und logge dich dann ein.');
        e.target.reset();
    }
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

    toggleUI(data.session);
    document.getElementById('login-form').reset();
    document.getElementById('register-form').reset();
});

// AUSLOGGEN
document.getElementById('logout-btn').addEventListener('click', async () => {
    await supabase.auth.signOut();
    toggleUI(null);
    document.getElementById('output-match').innerHTML = '';
    document.getElementById('output-recommend').innerHTML = '';
});

// SPIELEMPFEHLUNG
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
        .lte('max_dauer', dauer)
        .gte('Alter_min', minAge);

    if (error) {
        outputDiv.innerText = 'Fehler: ' + error.message;
        return;
    }

    if (!recommendations || recommendations.length === 0) {
        outputDiv.innerText = 'Keine passenden Empfehlungen gefunden.';
    } else {
        outputDiv.innerHTML = '<h3>Empfohlene Spiele:</h3>';
        recommendations.forEach(r => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'result-item';
            itemDiv.innerHTML = `
                <a href="${r.BGG}" target="_blank" class="game-title-link">${r.spiel}</a>
                <p><strong>Autor:</strong> ${r.Autor || 'N/A'}</p>
                <p><strong>Komplexität:</strong> ${r.Komplexität || 'N/A'}</p>
                <a href="${r.Buy}" target="_blank" class="action-button">Bei Amazon kaufen</a>
            `;
            outputDiv.appendChild(itemDiv);
        });
    }
});

// MITSPIELER FINDEN
document.getElementById('match-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const region = document.getElementById('region').value;
    const spiel = document.getElementById('spiel').value;
    const outputDiv = document.getElementById('output-match');
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return; // Sollte nicht passieren, aber sicher ist sicher

    const { data: matches, error } = await supabase
        .from('profiles')
        .select('id, nickname, alter, region, favorite_game')
        .eq('region', region)
        .eq('favorite_game', spiel)
        .neq('id', user.id); // Sich selbst nicht anzeigen

    if (error) {
        outputDiv.innerText = 'Fehler: ' + error.message;
        return;
    }

    if (matches.length === 0) {
        outputDiv.innerText = 'Keine passenden Mitspieler gefunden.';
    } else {
        outputDiv.innerHTML = '<h3>Gefundene Mitspieler:</h3>';
        matches.forEach(m => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'result-item';
            
            const text = document.createElement('p');
            text.textContent = `${m.nickname} (Alter: ${m.alter}, Region: ${m.region})`;
            
            const chatBtn = document.createElement('button');
            chatBtn.textContent = 'Chatten';
            chatBtn.className = 'action-button chat-button';
            chatBtn.dataset.receiverId = m.id;
            chatBtn.dataset.receiverNickname = m.nickname;
            chatBtn.onclick = () => openChat(m.id, m.nickname);
            
            itemDiv.appendChild(text);
            itemDiv.appendChild(chatBtn);
            outputDiv.appendChild(itemDiv);
        });
    }
});

// --- CHAT FUNKTIONEN ---

async function openChat(receiverId, receiverNickname) {
    const modal = document.getElementById('chat-modal');
    const chatTitle = document.getElementById('chat-with-user');
    const messagesDiv = document.getElementById('chat-messages');
    
    chatTitle.textContent = `Chat mit ${receiverNickname}`;
    messagesDiv.innerHTML = 'Lade Nachrichten...'; // Clear previous messages
    modal.dataset.receiverId = receiverId; // Store receiver ID on the modal
    modal.style.display = 'flex';

    const { data: { user } } = await supabase.auth.getUser();
    const senderId = user.id;

    // Fetch initial messages
    const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .or(`(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),(sender_id.eq.${receiverId},receiver_id.eq.${senderId})`)
        .order('created_at', { ascending: true });

    if (error) {
        messagesDiv.innerText = 'Fehler beim Laden der Nachrichten.';
        return;
    }
    
    messagesDiv.innerHTML = '';
    messages.forEach(msg => displayMessage(msg, senderId));
    messagesDiv.scrollTop = messagesDiv.scrollHeight; // Scroll to bottom

    // Subscribe to new messages
    const channelName = `chat-${[senderId, receiverId].sort().join('-')}`;
    if(chatSubscription) {
        supabase.removeChannel(chatSubscription);
    }
    chatSubscription = supabase
        .channel(channelName, {
            config: {
                broadcast: { self: true },
            },
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
            // Check if the message belongs to this chat
            if ((payload.new.sender_id === senderId && payload.new.receiver_id === receiverId) ||
                (payload.new.sender_id === receiverId && payload.new.receiver_id === senderId)) {
                displayMessage(payload.new, senderId);
                messagesDiv.scrollTop = messagesDiv.scrollHeight; // Scroll to bottom
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

    const { error } = await supabase.from('messages').insert({
        sender_id,
        receiver_id,
        content
    });

    if (error) {
        alert('Fehler beim Senden der Nachricht: ' + error.message);
    } else {
        chatInput.value = '';
    }
});
