import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
    measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

export default async function handler(req: any, res: any) {
    // Configurar CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Apenas método POST é permitido' });
    }

    const { name, email, phone, company, estimated_value, origin, observations } = req.body;

    if (!name || !email) {
        return res.status(400).json({ error: 'Nome e email são obrigatórios' });
    }

    try {
        const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
        const db = getFirestore(app);

        const leadId = Math.random().toString(36).substring(2, 15);
        const leadData = {
            name,
            company: company || '',
            email,
            phone: phone || '',
            status: 'Novo Lead',
            estimated_value: Number(estimated_value) || 0,
            origin: origin || 'Webhook',
            responsible: 'Sistema',
            observations: observations || '',
            created_at: new Date().toISOString(),
            interactions: []
        };

        await setDoc(doc(db, 'leads', leadId), leadData);

        return res.status(200).json({
            success: true,
            message: 'Lead recebido com sucesso',
            id: leadId
        });
    } catch (error: any) {
        console.error('Webhook error:', error);
        return res.status(500).json({
            error: 'Erro interno ao processar lead',
            message: error.message
        });
    }
}
