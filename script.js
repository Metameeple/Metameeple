import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://oywfzyfzpencghrpqfdk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95d2Z6eWZ6cGVuY2docnBxZmRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyMTc4ODUsImV4cCI6MjA2NDc5Mzg4NX0.OdMh5TH47gDdFYkWYQELxruXvdjhyLuMRfRjFJ1tywM';
const supabase = createClient(supabaseUrl, supabaseKey);

let chatSubscription = null;
let originalRecommendations = [];
let currentRecommendations = [];

async function checkForNewMessages() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const inboxDiv = document.getElementById('inbox-notifications');
    const { data: messages, error } = await supabase
        .from('messages')
        .select('sender_id, profiles!sender_id ( id, nickname )')
        .eq('receiver_id', user.id)
        .eq('is_read', false);
    if (error) {
        console.error("Fehler bei der Postfach-Abfrage:", error);
        inboxDiv.innerHTML = 'Fehler beim Laden des Postfachs.';
        return;
    }
    if (!messages || messages.length === 0) {
        inboxDiv.innerHTML = '';
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
