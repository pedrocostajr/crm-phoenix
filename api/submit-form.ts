import { initializeApp, getApps } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  collection, 
  query, 
  where, 
  addDoc, 
  updateDoc,
  increment
} from 'firebase/firestore';
import crypto from 'crypto';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID || process.env.FIREBASE_MEASUREMENT_ID
};

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST method only' });
  }

  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    const db = getFirestore(app);

    let body = req.body;
    if (body && typeof body === 'object' && Buffer.isBuffer(body)) {
      body = body.toString();
    }
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) {}
    }

    const { 
      formId, 
      responseId, 
      sessionId, 
      answers, 
      currentQuestionId, 
      device, 
      utm, 
      referrerUrl, 
      status, // 'viewed' | 'started' | 'partial' | 'completed' | 'abandoned'
      timeSpent 
    } = body;

    if (!formId || !responseId) {
      return res.status(400).json({ error: 'Missing formId or responseId' });
    }

    // Fetch the form config
    const formRef = doc(db, 'forms', formId);
    const formSnap = await getDoc(formRef);
    if (!formSnap.exists()) {
      return res.status(404).json({ error: 'Form not found' });
    }
    const form = formSnap.data();

    // Prepare response data
    const responseData: any = {
      formId,
      workspaceId: form.workspaceId || 'default',
      sessionId: sessionId || 'anonymous',
      status,
      updatedAt: new Date().toISOString(),
      answers: answers || {},
      currentQuestionId: currentQuestionId || '',
      device: device || null,
      utm: utm || null,
      referrerUrl: referrerUrl || '',
      timeSpent: timeSpent || 0
    };

    // If response does not exist, set createdAt
    const responseRef = doc(db, 'form_responses', responseId);
    const responseSnap = await getDoc(responseRef);
    if (!responseSnap.exists()) {
      responseData.createdAt = new Date().toISOString();
    } else {
      responseData.createdAt = responseSnap.data().createdAt || new Date().toISOString();
    }

    // Save/update response document
    await setDoc(responseRef, responseData, { merge: true });

    let leadId = null;
    let webhookResults: any[] = [];

    // If completed, run lead mapping & automations & webhooks
    if (status === 'completed') {
      // 1. Gather mapped answers
      let leadName = '';
      let leadEmail = '';
      let leadPhone = '';
      let leadCompany = '';
      let leadEstimatedValue = 0;
      let leadObservations = `Submissão do formulário: "${form.settings?.publicTitle || 'Formulário'}"\n\nRespostas:\n`;

      Object.values(answers).forEach((ans: any) => {
        leadObservations += `- **${ans.questionTitle}**: ${Array.isArray(ans.value) ? ans.value.join(', ') : ans.value}\n`;

        if (ans.crmField === 'name' && ans.value) leadName = String(ans.value);
        if (ans.crmField === 'email' && ans.value) leadEmail = String(ans.value).trim().toLowerCase();
        if (ans.crmField === 'phone' && ans.value) leadPhone = String(ans.value).trim();
        if (ans.crmField === 'company' && ans.value) leadCompany = String(ans.value);
        if (ans.crmField === 'estimatedValue' && ans.value) leadEstimatedValue = Number(ans.value) || 0;
      });

      // Default name if none was provided
      if (!leadName) {
        leadName = leadEmail ? leadEmail.split('@')[0] : 'Lead s/ Nome';
      }

      // 2. Lead Deduplication Rules
      let existingLead: any = null;
      let existingLeadId: string | null = null;
      const leadsCollection = collection(db, 'leads');

      if (leadEmail) {
        const qEmail = query(leadsCollection, where('email', '==', leadEmail));
        const snapEmail = await getDocs(qEmail);
        if (!snapEmail.empty) {
          existingLead = snapEmail.docs[0].data();
          existingLeadId = snapEmail.docs[0].id;
        }
      }

      if (!existingLeadId && leadPhone) {
        const qPhone = query(leadsCollection, where('phone', '==', leadPhone));
        const snapPhone = await getDocs(qPhone);
        if (!snapPhone.empty) {
          existingLead = snapPhone.docs[0].data();
          existingLeadId = snapPhone.docs[0].id;
        }
      }

      const stage = form.automations?.pipelineStage || 'Novo Lead';
      const responsible = form.automations?.responsibleUser || 'Sistema';
      const baseTags = form.automations?.addTags || [];
      const formTag = `form:${form.settings?.slug || formId}`;
      const allTags = Array.from(new Set([...baseTags, formTag]));

      const newInteraction = {
        id: crypto.randomUUID(),
        type: 'Outro',
        date: new Date().toISOString(),
        description: `Submeteu o formulário: ${form.settings?.publicTitle || 'Formulário'}\n${leadObservations}`
      };

      if (existingLeadId && existingLead) {
        // UPDATE existing lead (deduplication & complementation)
        const updatedLeadData: any = {
          name: existingLead.name || leadName,
          company: existingLead.company || leadCompany,
          email: existingLead.email || leadEmail,
          phone: existingLead.phone || leadPhone,
          estimated_value: existingLead.estimated_value || leadEstimatedValue,
          responsible: existingLead.responsible || responsible,
          observations: (existingLead.observations || '') + `\n\n[Atualizado via Formulário] ${new Date().toLocaleDateString('pt-BR')}:\n` + leadObservations,
          interactions: [...(existingLead.interactions || []), newInteraction]
        };

        // Standard tags integration in existing lead if lead model supports tags
        // Since original lead might have custom structures, we save safely.
        await updateDoc(doc(db, 'leads', existingLeadId), updatedLeadData);
        leadId = existingLeadId;
      } else {
        // CREATE new lead
        const leadData = {
          name: leadName,
          company: leadCompany,
          email: leadEmail,
          phone: leadPhone,
          status: stage,
          estimated_value: leadEstimatedValue,
          estimatedValue: leadEstimatedValue,
          origin: form.settings?.publicTitle || 'Formulário',
          responsible: responsible,
          observations: leadObservations,
          createdAt: new Date().toISOString(),
          created_at: new Date().toISOString(),
          interactions: [newInteraction]
        };

        const newLeadRef = await addDoc(leadsCollection, leadData);
        leadId = newLeadRef.id;
      }

      // Link response back to the created/updated lead
      await updateDoc(responseRef, { leadId });

      // Increment form completionsCount on the server
      await updateDoc(formRef, {
        completionsCount: increment(1),
        updatedAt: new Date().toISOString()
      });

      // Save notification to the database using a unique notification document
      const notifCollectionRef = collection(db, 'notifications');
      await addDoc(notifCollectionRef, {
        title: 'Novo Lead',
        body: `${leadName} preencheu o formulário de "${form.settings?.publicTitle || 'Captação'}".`,
        createdAt: new Date().toISOString(),
        read: false
      });

      // 3. Dispatch Outgoing Webhooks
      if (form.webhooks && Array.isArray(form.webhooks)) {
        for (const wh of form.webhooks) {
          if (!wh.url) continue;

          const payload = {
            event: 'form.submitted',
            formId,
            formTitle: form.settings?.publicTitle || '',
            responseId,
            leadId,
            answers: answers,
            device: device,
            utm: utm,
            referrerUrl: referrerUrl,
            submittedAt: new Date().toISOString()
          };

          const payloadString = JSON.stringify(payload);
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(wh.headers || {})
          };

          // Cryptographic sign-off
          if (wh.secretKey) {
            const hmac = crypto.createHmac('sha256', wh.secretKey);
            hmac.update(payloadString);
            headers['X-Phoenix-Signature'] = hmac.digest('hex');
          }

          let attempts = 0;
          let success = false;
          let statusCode = null;
          let lastError = null;

          // Retry logic (3 attempts max)
          while (attempts < 3 && !success) {
            attempts++;
            try {
              const fetchPromise = fetch(wh.url, {
                method: 'POST',
                headers,
                body: payloadString
              });

              // Timeout in 10s
              const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout')), 10000)
              );

              const response = (await Promise.race([fetchPromise, timeoutPromise])) as Response;
              statusCode = response.status;

              if (response.ok) {
                success = true;
              } else {
                lastError = `HTTP error ${response.status}`;
              }
            } catch (err: any) {
              lastError = err.message || err;
            }

            if (!success && attempts < 3) {
              // Wait 2s before retry
              await new Promise(r => setTimeout(r, 2000));
            }
          }

          // Record webhook log
          webhookResults.push({
            webhookId: wh.id,
            url: wh.url,
            success,
            statusCode,
            attempts,
            error: success ? null : lastError
          });
        }

        // Save webhook delivery statuses in form response
        await updateDoc(responseRef, { webhookStatus: webhookResults });
      }
    }

    return res.status(200).json({
      success: true,
      responseId,
      leadId,
      webhookResults
    });
  } catch (error: any) {
    console.error('Fatal submit-form error:', error);
    return res.status(500).json({
      error: error.message || 'Internal Server Error'
    });
  }
}
