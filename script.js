// Alle Importe und Initialisierungen bleiben gleich
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://oywfzyfzpencghrpqfdk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95d2Z6eWZ6cGVuY2docnBxZmRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyMTc4ODUsImV4cCI6MjA2NDc5Mzg4NX0.OdMh5TH47gDdFYkWYQELxruXvdjhyLuMRfRjFJ1tywM';
const supabase = createClient(supabaseUrl, supabaseKey);

let chatSubscription = null;

// --- DOM ELEMENTE ---
const appDiv = document.getElementById('app');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const appMainContent = document.getElementById('app-main-content');
const accountView = document.getElementById('account-view');

// --- KERNFUNKTIONEN ---

// Wird aufgerufen, wenn sich der Auth-Status ändert (Login/Logout)
async function handleAuthChange(session) {
    const isVisible = appDiv.style.display === 'block';

    if (session) {
        appDiv.style.display = 'block';
        loginForm.style.display = 'none';
        registerForm.style.display = 'none';
        // Nur laden, wenn die App gerade sichtbar wird
        if (!isVisible) {
            await loadDashboard();
        }
    } else {
        appDiv.style.display = 'none';
        loginForm.style.display = 'block';
        registerForm.style.display = 'block';
    }
}

// Lädt alle dynamischen Daten nach dem Login
async function loadDashboard() {
    await checkForNewMessages();
    await loadChatHistory();
}

// Lädt die Liste der Chatpartner
async function loadChatHistory() {
    const chatHistoryList = document.getElementById('chat-history-list');
    chatHistoryList.innerHTML = '<li>Lade Chats...</li>';

    // Ruft unsere neue Datenbank-Funktion auf
    const { data, error } = await supabase.rpc('get_chat_partners');

    if (error) {
        chatHistoryList.innerHTML = '<li>Fehler beim Laden der Chats.</li>';
        console.error('Fehler bei get_chat_partners:', error);
        return;
    }

    if (data.length === 0) {
        chatHistoryList.innerHTML = '<li>Noch keine Chats vorhanden.</li>';
        return;
    }

    chatHistoryList.innerHTML = '';
    data.forEach(partner => {
        const li = document.createElement('li');
        li.textContent = partner.nickname;
        li.onclick = () => openChat(partner.partner_id, partner.nickname);
        chatHistoryList.appendChild(li);
    });
}

// --- ACCOUNT VERWALTUNG ---

function showView(viewToShow) {
    appMainContent.style.display = 'none';
    accountView.style.display = 'none';
    viewToShow.style.display = 'block';
}

async function showAccountView() {
    showView(accountView);
    const { data: { user } } = await supabase.auth.getUser();
    
    // Profildaten laden
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('nickname')
        .eq('id', user.id)
        .single();
    
    if (profile) {
        document.getElementById('display-nickname').textContent = profile.nickname;
        document.getElementById('display-email').textContent = user.email;
        document.getElementById('edit-nickname').value = profile.nickname;
        document.getElementById('edit-email-display').textContent = user.email;
    }
    toggleEditMode(false); // Start im Ansichtsmodus
}

function toggleEditMode(isEditing) {
    document.getElementById('account-display-mode').style.display = isEditing ? 'none' : 'block';
    document.getElementById('account-edit-mode').style.display = isEditing ? 'block' : 'none';
}

async function saveAccountChanges() {
    const newNickname = document.getElementById('edit-nickname').value;
    if (!newNickname) {
        alert('Nickname darf nicht leer sein.');
        return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
        .from('profiles')
        .update({ nickname: newNickname })
        .eq('id', user.id);

    if (error) {
        alert('Fehler beim Speichern: ' + error.message);
    } else {
        alert('Änderungen gespeichert!');
        document.getElementById('display-nickname').textContent = newNickname;
        toggleEditMode(false);
    }
}


// --- EVENT LISTENERS ---

document.addEventListener('DOMContentLoaded', () => {
    supabase.auth.onAuthStateChange((_event, session) => {
        handleAuthChange(session);
    });

    // Account-Buttons
    document.getElementById('account-btn').addEventListener('click', showAccountView);
    document.getElementById('back-to-main-btn').addEventListener('click', () => showView(appMainContent));
    document.getElementById('edit-account-btn').addEventListener('click', () => toggleEditMode(true));
    document.getElementById('cancel-edit-btn').addEventListener('click', () => toggleEditMode(false));
    document.getElementById('save-account-btn').addEventListener('click', saveAccountChanges);
    
    // Bestehende Event Listeners
    // ... (Hier kommen die Listener für Login, Register, Logout, Chat, Empfehlungen etc. rein)
    // Die meisten davon habe ich unten wieder eingefügt.
});

// HINWEIS: Hier folgen alle deine anderen Funktionen (checkForNewMessages, openChat, displayMessage, etc.)
// und die Event Listener für die Formulare. Ich habe sie hier zur Vollständigkeit eingefügt.

// --- Bestehende Funktionen und Listener (zur Vollständigkeit) ---
async function checkForNewMessages() { /* ... unverändert ... */ }
async function openChat(receiverId, receiverNickname) { /* ... unverändert ... */ }
function displayMessage(message, currentUserId) { /* ... unverändert ... */ }
function closeChat() { /* ... unverändert ... */ }
document.getElementById('register-form').addEventListener('submit', async (e) => { /* ... unverändert ... */ });
document.getElementById('login-form').addEventListener('submit', async (e) => { /* ... unverändert ... */ });
document.getElementById('logout-btn').addEventListener('click', async () => { await supabase.auth.signOut(); });
document.getElementById('recommend-form').addEventListener('submit', async (e) => { /* ... unverändert ... */ });
document.getElementById('match-form').addEventListener('submit', async (e) => { /* ... unverändert ... */ });
document.getElementById('chat-form').addEventListener('submit', async (e) => { /* ... unverändert ... */ });
document.getElementById('ai-form').addEventListener('submit', async (e) => { /* ... unverändert ... */ });
