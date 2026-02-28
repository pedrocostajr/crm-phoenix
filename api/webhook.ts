import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

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
        return res.status(405).json({ error: 'POST only' });
    }

    try {
        const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
        const db = getFirestore(app);

        let body = req.body;
        if (typeof body === 'string') {
            try { body = JSON.parse(body); } catch (e) { }
        }

        // Capture the payload for the UI to see
        await setDoc(doc(db, 'settings', 'webhook'), {
            lastPayload: body,
            lastReceived: new Date().toISOString()
        }, { merge: true });

        // Fetch mappings
        const settingsSnap = await getDoc(doc(db, 'settings', 'webhook'));
        const settings = settingsSnap.exists() ? settingsSnap.data() : { mappings: {} };
        const mappings = settings.mappings || {};

        // Helper to get value from nested path like "data.name"
        const getValue = (obj: any, path: string) => {
            if (!path || !obj) return undefined;
            try {
                return path.split('.').reduce((acc, part) => acc && acc[part], obj);
            } catch (e) {
                console.error(`Error getting value for path ${path}:`, e);
                return undefined;
            }
        };

        console.log('--- Webhook Processing ---');
        console.log('Body:', JSON.stringify(body, null, 2));
        console.log('Mappings:', JSON.stringify(mappings, null, 2));

        // Apply Mappings or use Defaults
        const leadData: any = {
            name: getValue(body, mappings.name) || body.name || body.data?.name || body.nome || 'Lead s/ Nome',
            email: getValue(body, mappings.email) || body.email || body.data?.email || body.email || '',
            phone: getValue(body, mappings.phone) || body.phone || body.data?.phone || body.telefone || '',
            company: getValue(body, mappings.company) || body.company || body.data?.company || body.empresa || '',
            status: 'Novo Lead',
            origin: getValue(body, mappings.origin) || body.origin || body.data?.origin || 'Webhook',
            estimated_value: Number(getValue(body, mappings.estimated_value) || body.estimated_value || body.data?.estimated_value || 0),
            responsible: 'Sistema',
            observations: '',
            created_at: new Date().toISOString(),
            interactions: []
        };

        console.log('Mapped Lead Data:', JSON.stringify(leadData, null, 2));

        // Include all unmapped data in observations for safety
        leadData.observations = `Payload Completo:\n${JSON.stringify(body, null, 2)}`;

        const leadId = `lead_webhook_${Date.now()}`;
        await setDoc(doc(db, 'leads', leadId), leadData);

        console.log('Lead saved successfully:', leadId);
        console.log('--- End Webhook Processing ---');

        return res.status(200).json({ success: true, id: leadId });
    } catch (error: any) {
        console.error('Webhook Error Detail:', error);
        return res.status(500).json({
            error: error.message,
            stack: error.stack,
            config: {
                projectId: firebaseConfig.projectId,
                hasApiKey: !!firebaseConfig.apiKey
            }
        });
    }
}
