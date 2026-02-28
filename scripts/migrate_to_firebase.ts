
import { createClient } from '@supabase/supabase-js';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, doc, setDoc } from 'firebase/firestore';
import * as dotenv from 'dotenv';

// Load .env.local
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

// --- CONFIGURAÇÃO DO FIREBASE ---
const firebaseConfig = {
    apiKey: "AIzaSyA_lF5yYnq4JeFjBMA-POB8Q45u1bIoSlw",
    authDomain: "phoenix-crm-315cb.firebaseapp.com",
    projectId: "phoenix-crm-315cb",
    storageBucket: "phoenix-crm-315cb.firebasestorage.app",
    messagingSenderId: "1062954272078",
    appId: "1:1062954272078:web:274225dd46d3a40172ca1f"
};

async function migrate() {
    if (!supabaseUrl || !supabaseAnonKey) {
        console.error("❌ Erro: Credenciais do Supabase não encontradas no .env.local");
        return;
    }

    if (firebaseConfig.apiKey === "YOUR_API_KEY") {
        console.error("❌ Erro: Você ainda não configurou as credenciais do Firebase no script.");
        return;
    }

    console.log("🚀 Iniciando migração...");

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    try {
        // 1. Migrar Usuários
        console.log("👥 Migrando usuários...");
        const { data: users, error: userError } = await supabase.from('users').select('*');
        if (userError) throw userError;

        for (const user of users || []) {
            await setDoc(doc(db, "users", user.id), {
                ...user,
                // Garantir nomes de campos consistentes se necessário
                isAdmin: user.is_admin
            });
            console.log(`✅ Usuário migrado: ${user.email}`);
        }

        // 2. Migrar Leads
        console.log("📈 Migrando leads...");
        const { data: leads, error: leadError } = await supabase.from('leads').select('*');
        if (leadError) throw leadError;

        for (const lead of leads || []) {
            await setDoc(doc(db, "leads", lead.id), {
                ...lead,
                estimatedValue: Number(lead.estimated_value)
            });
            console.log(`✅ Lead migrado: ${lead.name}`);
        }

        console.log("✨ Migração concluída com sucesso!");

    } catch (error) {
        console.error("❌ Erro durante a migração:", error);
    }
}

migrate();
