import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID,
    measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID || process.env.FIREBASE_MEASUREMENT_ID
};

console.log('Firebase Config Check:', {
    hasApiKey: !!firebaseConfig.apiKey,
    projectId: firebaseConfig.projectId,
    appId: !!firebaseConfig.appId
});

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
        if (body && typeof body === 'object' && Buffer.isBuffer(body)) {
            body = body.toString();
        }
        if (typeof body === 'string') {
            try { body = JSON.parse(body); } catch (e) { }
        }

        // Determine profile
        const profile = req.query?.config || body?.config || 'default';
        const settingsPath = `settings/webhook_${profile}`;

        console.log(`--- Webhook Processing (Profile: ${profile}) ---`);
        console.log('Body:', JSON.stringify(body, null, 2));

        // Capture the payload for the UI to see (per profile)
        try {
            await setDoc(doc(db, 'settings', `webhook_${profile}`), {
                lastPayload: body,
                lastReceived: new Date().toISOString()
            }, { merge: true });
            console.log(`Payload captured in settings/webhook_${profile}`);
        } catch (e) {
            console.error('Error capturing payload:', e);
        }

        // Fetch mappings for the specific profile
        const settingsSnap = await getDoc(doc(db, 'settings', `webhook_${profile}`));
        const settings = settingsSnap.exists() ? settingsSnap.data() : { mappings: {} };
        const mappings = settings.mappings || {};
        console.log(`Mappings fetched for ${profile}:`, JSON.stringify(mappings, null, 2));

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

        // Apply Mappings or use Defaults
        const leadData: any = {
            name: getValue(body, mappings.name) || body.name || body.data?.name || body.nome || 'Lead s/ Nome',
            email: getValue(body, mappings.email) || body.email || body.data?.email || body.email || '',
            phone: getValue(body, mappings.phone) || body.phone || body.data?.phone || body.telefone || '',
            company: getValue(body, mappings.company) || body.company || body.data?.company || body.empresa || '',
            status: 'Novo Lead',
            origin: profile !== 'default' ? profile : (getValue(body, mappings.origin) || body.origin || body.data?.origin || 'Webhook'),
            estimated_value: Number(getValue(body, mappings.estimated_value) || body.estimated_value || body.data?.estimated_value || 0),
            responsible: 'Sistema',
            observations: `Payload Completo (Perfil: ${profile}):\n${JSON.stringify(body, null, 2)}`,
            created_at: new Date().toISOString(),
            interactions: []
        };

        // Sanitize leadData (Firestore doesn't like undefined)
        Object.keys(leadData).forEach(key => {
            if (leadData[key] === undefined) {
                leadData[key] = null;
            }
        });

        console.log('Final Lead Data to save:', JSON.stringify(leadData, null, 2));

        const leadId = `lead_webhook_${Date.now()}`;
        try {
            await setDoc(doc(db, 'leads', leadId), leadData);
            console.log('Lead saved successfully:', leadId);
            return res.status(200).json({
                success: true,
                id: leadId,
                message: `Lead criado com sucesso (${profile})`,
                mapped_data: leadData
            });
        } catch (e: any) {
            console.error('FAILED TO SAVE LEAD:', e);
            return res.status(500).json({
                error: 'Erro ao gravar lead no banco',
                details: e.message,
                code: e.code,
                mapped_data: leadData
            });
        }
    } catch (error: any) {
        console.error('Webhook Fatal Error:', error);
        return res.status(500).json({
            error: error.message,
            stack: error.stack
        });
    }
}
