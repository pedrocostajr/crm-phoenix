import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  ChevronRight, 
  Upload, 
  Check, 
  AlertCircle, 
  Star, 
  ChevronDown, 
  Lock,
  Loader2
} from 'lucide-react';
import { storageService } from '../services/storage';
import { Form, QuestionBlock, FormResponse, FormResponseValue } from '../types';

interface FormViewerProps {
  formSlug: string;
}

const FormViewer: React.FC<FormViewerProps> = ({ formSlug }) => {
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Player state
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [validationError, setValidationError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState('');
  const [responseId, setResponseId] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [historyIdx, setHistoryIdx] = useState<number[]>([]); // To allow going back in conditional flows

  // Form startTime for analytics
  const startTimeRef = useRef<number>(Date.now());

  // Refs for focusing inputs
  const inputRef = useRef<any>(null);

  const fetchFormBySlug = async () => {
    try {
      setLoading(true);
      const data = await storageService.getFormBySlug(formSlug);
      if (!data) {
        setError('Formulário não encontrado ou inativo.');
        return;
      }
      setForm(data);

      // Check dates and limits
      const now = new Date();
      if (data.settings.startDate && new Date(data.settings.startDate) > now) {
        setError('Este formulário ainda não está disponível.');
        return;
      }
      if (data.settings.endDate && new Date(data.settings.endDate) < now) {
        setError(data.settings.endedMessage || 'Este formulário foi encerrado.');
        return;
      }
      if (data.settings.responseLimit && data.completionsCount && data.completionsCount >= data.settings.responseLimit) {
        setError('Este formulário atingiu o limite máximo de respostas.');
        return;
      }
      if (data.settings.status === 'paused') {
        setError('Este formulário está temporariamente pausado.');
        return;
      }

      // Check Password
      if (!data.settings.password) {
        setIsUnlocked(true);
      }

      // Initialize session and response id
      const sessKey = `sess_${data.id}`;
      let savedSessId = localStorage.getItem(sessKey);
      if (!savedSessId) {
        savedSessId = `session_${Math.random().toString(36).substring(2, 15)}`;
        localStorage.setItem(sessKey, savedSessId);
      }
      setSessionId(savedSessId);

      const respKey = `resp_${data.id}`;
      let savedRespId = localStorage.getItem(respKey);
      if (!savedRespId) {
        savedRespId = `resp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        localStorage.setItem(respKey, savedRespId);
      }
      setResponseId(savedRespId);

      // Track Form View Metric
      await storageService.incrementFormMetric(data.id, 'viewsCount');

      // Restore saved progress if any
      const progressKey = `progress_${data.id}`;
      const savedProgress = localStorage.getItem(progressKey);
      if (savedProgress) {
        try {
          const parsed = JSON.parse(savedProgress);
          setAnswers(parsed.answers || {});
          
          // Re-validate index
          const restoredIdx = data.blocks.findIndex(b => b.id === parsed.currentBlockId);
          if (restoredIdx !== -1) {
            setCurrentIdx(restoredIdx);
            setHistoryIdx(parsed.historyIdx || []);
          }
        } catch (e) {
          console.error('Failed to restore progress:', e);
        }
      }
    } catch (err) {
      console.error('Error loading form viewer:', err);
      setError('Ocorreu um erro ao carregar o formulário.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFormBySlug();
  }, [formSlug]);

  // Inject Meta Pixel and Google Analytics Scripts dynamically based on form settings
  useEffect(() => {
    if (!form) return;

    const { metaPixelId, googleAnalyticsId } = form.settings;

    // 1. Meta Pixel (Facebook) setup and PageView tracking
    if (metaPixelId) {
      const pixelId = metaPixelId.trim();
      if (!window.document.getElementById(`meta-pixel-${pixelId}`)) {
        const fbScript = window.document.createElement('script');
        fbScript.id = `meta-pixel-${pixelId}`;
        fbScript.innerHTML = `
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${pixelId}');
          fbq('track', 'PageView');
        `;
        window.document.head.appendChild(fbScript);
      } else {
        try {
          (window as any).fbq?.('track', 'PageView');
        } catch (e) {
          console.error(e);
        }
      }
    }

    // 2. Google Analytics (gtag.js) setup and pageview tracking
    if (googleAnalyticsId) {
      const gaId = googleAnalyticsId.trim();
      if (!window.document.getElementById(`ga-script-${gaId}`)) {
        const gaScript = window.document.createElement('script');
        gaScript.id = `ga-script-${gaId}`;
        gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
        gaScript.async = true;
        window.document.head.appendChild(gaScript);

        const gaInitScript = window.document.createElement('script');
        gaInitScript.id = `ga-init-${gaId}`;
        gaInitScript.innerHTML = `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}');
        `;
        window.document.head.appendChild(gaInitScript);
      } else {
        try {
          (window as any).gtag?.('config', gaId);
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [form]);

  // Focus input when index changes
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus?.();
    }
  }, [currentIdx, isUnlocked]);

  // Handle keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isUnlocked || loading || submitted || error) return;
      if (e.key === 'Enter') {
        // Prevent default only if not in textarea
        if (e.target instanceof HTMLTextAreaElement) return;
        e.preventDefault();
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIdx, answers, isUnlocked, form]);

  const activeBlock = form?.blocks[currentIdx] || null;

  // Validation functions
  const validateField = (block: QuestionBlock, value: any): string | null => {
    if (block.required && (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0))) {
      return block.errorMessage || 'Este campo é obrigatório.';
    }

    if (!value) return null;

    if (block.type === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return block.errorMessage || 'Por favor, insira um e-mail válido.';
      }
    }

    if (block.type === 'url') {
      try {
        new URL(value.startsWith('http') ? value : `https://${value}`);
      } catch (_) {
        return block.errorMessage || 'Por favor, insira uma URL válida.';
      }
    }

    if (block.type === 'cpf_cnpj') {
      const cleanVal = String(value).replace(/\D/g, '');
      if (cleanVal.length !== 11 && cleanVal.length !== 14) {
        return block.errorMessage || 'CPF deve ter 11 dígitos e CNPJ 14 dígitos.';
      }
    }

    return null;
  };

  // Progressive Save
  const saveProgressToDb = async (updatedAnswers: Record<string, any>, nextIdx: number) => {
    if (!form || !responseId) return;

    // Map answers format
    const mappedAnswers: Record<string, FormResponseValue> = {};
    Object.entries(updatedAnswers).forEach(([blockId, val]) => {
      const b = form.blocks.find(x => x.id === blockId);
      if (b) {
        mappedAnswers[blockId] = {
          questionId: b.id,
          questionTitle: b.title,
          value: val,
          crmField: b.crmField
        };
      }
    });

    const isFirstStep = currentIdx === 0 && Object.keys(updatedAnswers).length > 0;
    
    // Increment metric for startsCount on first question answered
    if (isFirstStep) {
      await storageService.incrementFormMetric(form.id, 'startsCount');
    }

    // Determine device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const deviceType = 
      /ipad|tablet|playbook|silk/.test(userAgent) ? 'tablet' :
      /mobile|iphone|android|phone/.test(userAgent) ? 'mobile' : 'desktop';

    // Parse URL params for UTMs
    const urlParams = new URLSearchParams(window.location.search);
    const utm: Record<string, string> = {};
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(param => {
      const val = urlParams.get(param);
      if (val) utm[param.replace('utm_', '')] = val;
    });

    const partialResponse: FormResponse = {
      id: responseId,
      formId: form.id,
      workspaceId: form.workspaceId,
      sessionId,
      status: 'partial',
      createdAt: new Date().toISOString(), // Storage handles override if exists
      updatedAt: new Date().toISOString(),
      answers: mappedAnswers,
      currentQuestionId: form.blocks[nextIdx]?.id || '',
      device: {
        browser: getBrowserName(userAgent),
        os: getOSName(userAgent),
        deviceType
      },
      utm,
      referrerUrl: document.referrer || '',
      timeSpent: Math.round((Date.now() - startTimeRef.current) / 1000)
    };

    await storageService.saveResponse(partialResponse);
    
    // Save to localStorage too
    localStorage.setItem(`progress_${form.id}`, JSON.stringify({
      currentBlockId: form.blocks[nextIdx]?.id || '',
      answers: updatedAnswers,
      historyIdx: [...historyIdx, currentIdx]
    }));
  };

  // Helper to parse UA
  const getBrowserName = (ua: string) => {
    if (ua.includes('chrome')) return 'Chrome';
    if (ua.includes('firefox')) return 'Firefox';
    if (ua.includes('safari')) return 'Safari';
    if (ua.includes('edge')) return 'Edge';
    return 'Other';
  };

  const getOSName = (ua: string) => {
    if (ua.includes('windows')) return 'Windows';
    if (ua.includes('mac')) return 'MacOS';
    if (ua.includes('android')) return 'Android';
    if (ua.includes('iphone') || ua.includes('ipad')) return 'iOS';
    return 'Linux';
  };

  // Evaluate conditional jumps
  const evaluateJumps = (block: QuestionBlock, value: any): number | null => {
    if (!block.rules || block.rules.length === 0 || !form) return null;

    for (const rule of block.rules) {
      let isMatch = false;
      const strVal = String(value || '').trim();
      const ruleVal = String(rule.value || '').trim();

      switch (rule.operator) {
        case 'equals':
          isMatch = strVal.toLowerCase() === ruleVal.toLowerCase();
          break;
        case 'not_equals':
          isMatch = strVal.toLowerCase() !== ruleVal.toLowerCase();
          break;
        case 'contains':
          isMatch = strVal.toLowerCase().includes(ruleVal.toLowerCase());
          break;
        case 'not_contains':
          isMatch = !strVal.toLowerCase().includes(ruleVal.toLowerCase());
          break;
        case 'greater_than':
          isMatch = Number(strVal) > Number(ruleVal);
          break;
        case 'less_than':
          isMatch = Number(strVal) < Number(ruleVal);
          break;
        case 'is_filled':
          isMatch = strVal.length > 0;
          break;
        case 'is_empty':
          isMatch = strVal.length === 0;
          break;
      }

      if (isMatch) {
        // Run action
        if (rule.action === 'go_to_question' && rule.actionTarget) {
          const targetIdx = form.blocks.findIndex(b => b.id === rule.actionTarget);
          if (targetIdx !== -1) return targetIdx;
        }
        if (rule.action === 'go_to_thank_you') {
          const targetIdx = form.blocks.findIndex(b => b.type === 'thank_you');
          if (targetIdx !== -1) return targetIdx;
        }
        if (rule.action === 'end_form') {
          // Immediately complete
          triggerFinalSubmit(answers);
          return -2; // Demarcates immediately completed
        }
      }
    }

    return null;
  };

  const handleNext = async () => {
    if (!form || !activeBlock) return;

    const currentVal = answers[activeBlock.id];
    
    // 1. Validate
    const err = validateField(activeBlock, currentVal);
    if (err) {
      setValidationError(err);
      return;
    }
    setValidationError(null);

    // 2. Check Conditional Logic
    const jumpIdx = evaluateJumps(activeBlock, currentVal);
    if (jumpIdx === -2) {
      return; // Already submitted
    }

    let nextIdx = currentIdx + 1;
    if (jumpIdx !== null) {
      nextIdx = jumpIdx;
    }

    setHistoryIdx(prev => [...prev, currentIdx]);

    if (nextIdx >= form.blocks.length) {
      // Completed!
      await triggerFinalSubmit(answers);
    } else {
      setCurrentIdx(nextIdx);
      // Save partial progress
      await saveProgressToDb(answers, nextIdx);
    }
  };

  const handleBack = () => {
    if (historyIdx.length === 0 || !form) return;
    const prevIdx = historyIdx[historyIdx.length - 1];
    setHistoryIdx(prev => prev.slice(0, -1));
    setCurrentIdx(prevIdx);

    // Update partial progress pointing back
    saveProgressToDb(answers, prevIdx);
  };

  const triggerFinalSubmit = async (finalAnswers: Record<string, any>) => {
    if (!form || submitting) return;
    setSubmitting(true);

    try {
      // Map answers format
      const mappedAnswers: Record<string, FormResponseValue> = {};
      Object.entries(finalAnswers).forEach(([blockId, val]) => {
        const b = form.blocks.find(x => x.id === blockId);
        if (b) {
          mappedAnswers[blockId] = {
            questionId: b.id,
            questionTitle: b.title,
            value: val,
            crmField: b.crmField
          };
        }
      });

      const userAgent = window.navigator.userAgent.toLowerCase();
      const deviceType = 
        /ipad|tablet|playbook|silk/.test(userAgent) ? 'tablet' :
        /mobile|iphone|android|phone/.test(userAgent) ? 'mobile' : 'desktop';

      // Parse UTMs
      const urlParams = new URLSearchParams(window.location.search);
      const utm: Record<string, string> = {};
      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(param => {
        const val = urlParams.get(param);
        if (val) utm[param.replace('utm_', '')] = val;
      });

      const payload = {
        formId: form.id,
        responseId,
        sessionId,
        status: 'completed',
        answers: mappedAnswers,
        currentQuestionId: 'thank_you',
        device: {
          browser: getBrowserName(userAgent),
          os: getOSName(userAgent),
          deviceType
        },
        utm,
        referrerUrl: document.referrer || '',
        timeSpent: Math.round((Date.now() - startTimeRef.current) / 1000)
      };

      let leadId = null;
      let apiSuccess = false;

      try {
        // Call API Endpoint to safely write Lead & trigger Webhooks
        const res = await fetch('/api/submit-form', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const apiData = await res.json();
          leadId = apiData.leadId;
          apiSuccess = true;
        }
      } catch (apiErr) {
        console.warn('API submission failed or unreachable, using client-side Firestore fallback:', apiErr);
      }

      if (!apiSuccess) {
        // Client-side Fallback (resilient client-side save)
        const completedResponse: FormResponse = {
          id: responseId,
          formId: form.id,
          workspaceId: form.workspaceId || 'default',
          sessionId: sessionId || 'anonymous',
          status: 'completed',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          answers: mappedAnswers,
          currentQuestionId: 'thank_you',
          device: {
            browser: getBrowserName(userAgent),
            os: getOSName(userAgent),
            deviceType
          },
          utm,
          referrerUrl: document.referrer || '',
          timeSpent: Math.round((Date.now() - startTimeRef.current) / 1000)
        };

        // Write the completed response to Firestore client-side
        await storageService.saveResponse(completedResponse);

        // Gather mapped answers to build the Lead
        let leadName = '';
        let leadEmail = '';
        let leadPhone = '';
        let leadCompany = '';
        let leadEstimatedValue = 0;
        let leadObservations = `Submissão do formulário: "${form.settings?.publicTitle || 'Formulário'}"\n\nRespostas:\n`;

        Object.values(mappedAnswers).forEach((ans: any) => {
          leadObservations += `- **${ans.questionTitle}**: ${Array.isArray(ans.value) ? ans.value.join(', ') : ans.value}\n`;

          if (ans.crmField === 'name' && ans.value) leadName = String(ans.value);
          if (ans.crmField === 'email' && ans.value) leadEmail = String(ans.value).trim().toLowerCase();
          if (ans.crmField === 'phone' && ans.value) leadPhone = String(ans.value).trim();
          if (ans.crmField === 'company' && ans.value) leadCompany = String(ans.value);
          if (ans.crmField === 'estimatedValue' && ans.value) leadEstimatedValue = Number(ans.value) || 0;
        });

        if (!leadName) {
          leadName = leadEmail ? leadEmail.split('@')[0] : 'Lead s/ Nome';
        }

        // Search for existing lead to update (deduplication)
        let existingLead: any = null;
        let existingLeadId: string | null = null;
        const allLeads = await storageService.getLeads();

        if (leadEmail) {
          const match = allLeads.find((l: any) => l.email?.trim().toLowerCase() === leadEmail);
          if (match) {
            existingLead = match;
            existingLeadId = match.id;
          }
        }

        if (!existingLeadId && leadPhone) {
          const match = allLeads.find((l: any) => l.phone?.trim() === leadPhone);
          if (match) {
            existingLead = match;
            existingLeadId = match.id;
          }
        }

        const stage = form.automations?.pipelineStage || 'Novo Lead';
        const responsible = form.automations?.responsibleUser || 'Sistema';
        const baseTags = form.automations?.addTags || [];
        const formTag = `form:${form.settings?.slug || form.id}`;
        const allTags = Array.from(new Set([...baseTags, formTag]));

        const randId = typeof crypto !== 'undefined' && crypto.randomUUID 
          ? crypto.randomUUID() 
          : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

        const newInteraction = {
          id: randId,
          type: 'Outro' as const,
          date: new Date().toISOString(),
          description: `Submeteu o formulário: ${form.settings?.publicTitle || 'Formulário'}\n${leadObservations}`
        };

        if (existingLeadId && existingLead) {
          // Update existing lead client-side
          const updatedLead = {
            ...existingLead,
            name: existingLead.name || leadName,
            company: existingLead.company || leadCompany,
            email: existingLead.email || leadEmail,
            phone: existingLead.phone || leadPhone,
            estimatedValue: existingLead.estimatedValue || leadEstimatedValue,
            responsible: existingLead.responsible || responsible,
            tags: Array.from(new Set([...(existingLead.tags || []), ...allTags])),
            observations: (existingLead.observations || '') + `\n\n[Atualizado via Formulário] ${new Date().toLocaleDateString('pt-BR')}:\n` + leadObservations,
            interactions: [...(existingLead.interactions || []), newInteraction]
          };
          await storageService.saveLead(updatedLead);
          leadId = existingLeadId;
        } else {
          // Create new lead client-side
          const newLeadId = typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

          const newLead = {
            id: newLeadId,
            name: leadName,
            company: leadCompany,
            email: leadEmail,
            phone: leadPhone,
            status: stage,
            estimatedValue: leadEstimatedValue,
            origin: form.settings?.publicTitle || 'Formulário',
            responsible: responsible,
            tags: allTags,
            observations: leadObservations,
            interactions: [newInteraction]
          };
          await storageService.saveLead(newLead);
          leadId = newLeadId;
        }

        // Link response to lead client-side
        await storageService.saveResponse({
          ...completedResponse,
          leadId: leadId || undefined
        });
      }

      // Increment form completionsCount
      await storageService.incrementFormMetric(form.id, 'completionsCount');

      // Clear local progress
      localStorage.removeItem(`progress_${form.id}`);
      localStorage.removeItem(`resp_${form.id}`);

      // Track conversion events on successful form submit
      if (form.settings.metaPixelId) {
        try {
          (window as any).fbq?.('track', 'Lead', {
            content_name: form.settings.internalName,
            status: 'completed'
          });
        } catch (fbError) {
          console.warn('Meta Pixel Lead tracking failed:', fbError);
        }
      }

      if (form.settings.googleAnalyticsId) {
        try {
          (window as any).gtag?.('event', 'generate_lead', {
            event_category: 'engagement',
            event_label: form.settings.internalName
          });
        } catch (gaError) {
          console.warn('Google Analytics Lead tracking failed:', gaError);
        }
      }

      setSubmitted(true);

      // Handle redirect if configured
      if (form.settings.redirectUrl) {
        setTimeout(() => {
          window.location.href = form.settings.redirectUrl!;
        }, 1500);
      } else {
        // Go to thank_you block index if exists
        const thankYouIdx = form.blocks.findIndex(b => b.type === 'thank_you');
        if (thankYouIdx !== -1) {
          setCurrentIdx(thankYouIdx);
        }
      }
    } catch (e) {
      console.error('Submission error:', e);
      setValidationError('Erro ao enviar suas respostas. Por favor, tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleValueChange = (val: any) => {
    setAnswers(prev => ({
      ...prev,
      [activeBlock!.id]: val
    }));
    // Remove validation errors on edit
    if (validationError) setValidationError(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setValidationError('O arquivo excede o limite máximo de 5MB.');
      return;
    }

    // Convert file to Base64 to store in Firestore securely without setup bucket
    const reader = new FileReader();
    reader.onloadend = () => {
      handleValueChange({
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        dataUrl: reader.result
      });
    };
    reader.onerror = () => {
      setValidationError('Erro ao ler arquivo.');
    };
    reader.readAsDataURL(file);
  };

  const handleUnlockForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (form && passwordInput === form.settings.password) {
      setIsUnlocked(true);
      setValidationError(null);
    } else {
      setValidationError('Senha incorreta.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-lg border border-slate-100 text-center space-y-4">
          <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle size={24} />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Formulário Indisponível</h2>
          <p className="text-slate-500 text-sm leading-relaxed">{error}</p>
        </div>
      </div>
    );
  }

  if (!form) return null;

  // Render Password Screen
  if (!isUnlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: form.theme.backgroundColor }}>
        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border text-center space-y-6">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
            <Lock size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Formulário Protegido</h2>
            <p className="text-slate-500 text-xs mt-1">Este formulário exige uma senha para responder.</p>
          </div>
          
          <form onSubmit={handleUnlockForm} className="space-y-4">
            <input
              type="password"
              placeholder="Digite a senha..."
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 text-center"
              required
            />
            {validationError && <p className="text-red-500 text-xs font-bold">⚠️ {validationError}</p>}
            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-colors"
            >
              Acessar Formulário
            </button>
          </form>
        </div>
      </div>
    );
  }

  const progressPercent = form.blocks.length > 0 
    ? Math.round((currentIdx / (form.blocks.length - 1)) * 100) 
    : 0;

  return (
    <div className="min-h-screen flex flex-col justify-between p-4 md:p-8" style={{ backgroundColor: form.theme.backgroundColor, fontFamily: form.theme.fontFamily }}>
      
      {/* Top Header & Progress */}
      <header className="max-w-3xl w-full mx-auto shrink-0 flex flex-col gap-3">
        <div className="flex justify-between items-center">
          {form.theme.logoUrl && (
            <img src={form.theme.logoUrl} alt="Logo" className="max-h-10 object-contain" />
          )}
          <span className="text-xs font-bold text-slate-400 opacity-80">
            {progressPercent}% concluído
          </span>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-slate-200/50 rounded-full overflow-hidden">
          <div 
            className="h-full transition-all duration-500 ease-out" 
            style={{ width: `${progressPercent}%`, backgroundColor: form.theme.primaryColor }}
          ></div>
        </div>
      </header>

      {/* Main Interactive Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto flex flex-col justify-center py-10 relative">
        {activeBlock ? (
          <div key={activeBlock.id} className="animate-in fade-in slide-in-from-bottom-6 duration-500 w-full space-y-8 text-left" style={{ color: form.theme.textColor }}>
            {/* Question title */}
            <div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight leading-snug">
                {activeBlock.title}
                {activeBlock.required && <span className="text-red-500 ml-1">*</span>}
              </h2>
              {activeBlock.description && (
                <p className="text-sm mt-3 opacity-70 leading-relaxed font-medium">
                  {activeBlock.description}
                </p>
              )}
            </div>

            {/* Answers input widgets */}
            <div className="w-full">
              {activeBlock.type === 'welcome' && (
                <button
                  onClick={handleNext}
                  className="py-3.5 px-8 text-base font-bold rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 text-white"
                  style={{ backgroundColor: form.theme.buttonColor, color: form.theme.buttonTextColor, borderRadius: form.theme.borderRadius }}
                >
                  Começar
                </button>
              )}

              {activeBlock.type === 'thank_you' && (
                <div className="flex flex-col items-center justify-center py-6 text-center space-y-3">
                  <div className="p-4 bg-green-50 text-green-600 rounded-full shadow-lg shadow-green-500/10">
                    <Check size={40} />
                  </div>
                  <h3 className="text-xl font-bold">Respostas salvas!</h3>
                  <p className="text-sm opacity-65 font-medium leading-normal max-w-xs">{form.settings.endedMessage || 'Obrigado por dedicar seu tempo para responder a esta pesquisa.'}</p>
                </div>
              )}

              {/* Standard text forms */}
              {['name', 'short_text', 'url'].includes(activeBlock.type) && (
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={activeBlock.placeholder || 'Digite sua resposta aqui...'}
                  value={answers[activeBlock.id] || ''}
                  onChange={(e) => handleValueChange(e.target.value)}
                  className="w-full px-1 py-3 bg-transparent border-b-2 border-slate-350 text-xl font-bold outline-none transition-all placeholder:text-slate-300"
                  style={{ borderBottomColor: form.theme.primaryColor }}
                />
              )}

              {activeBlock.type === 'email' && (
                <input
                  ref={inputRef}
                  type="email"
                  placeholder={activeBlock.placeholder || 'nome@exemplo.com'}
                  value={answers[activeBlock.id] || ''}
                  onChange={(e) => handleValueChange(e.target.value)}
                  className="w-full px-1 py-3 bg-transparent border-b-2 border-slate-350 text-xl font-bold outline-none transition-all placeholder:text-slate-300"
                  style={{ borderBottomColor: form.theme.primaryColor }}
                />
              )}

              {activeBlock.type === 'phone' && (
                <input
                  ref={inputRef}
                  type="tel"
                  placeholder={activeBlock.placeholder || '(00) 00000-0000'}
                  value={answers[activeBlock.id] || ''}
                  onChange={(e) => handleValueChange(e.target.value)}
                  className="w-full px-1 py-3 bg-transparent border-b-2 border-slate-350 text-xl font-bold outline-none transition-all placeholder:text-slate-300"
                  style={{ borderBottomColor: form.theme.primaryColor }}
                />
              )}

              {activeBlock.type === 'long_text' && (
                <textarea
                  ref={inputRef}
                  rows={3}
                  placeholder={activeBlock.placeholder || 'Escreva sua resposta detalhada...'}
                  value={answers[activeBlock.id] || ''}
                  onChange={(e) => handleValueChange(e.target.value)}
                  className="w-full px-1 py-3 bg-transparent border-b-2 border-slate-350 text-lg font-medium outline-none transition-all placeholder:text-slate-300 resize-none leading-relaxed"
                  style={{ borderBottomColor: form.theme.primaryColor }}
                />
              )}

              {activeBlock.type === 'number' && (
                <input
                  ref={inputRef}
                  type="number"
                  placeholder={activeBlock.placeholder || '0'}
                  value={answers[activeBlock.id] || ''}
                  onChange={(e) => handleValueChange(e.target.value)}
                  className="w-full px-1 py-3 bg-transparent border-b-2 border-slate-350 text-xl font-bold outline-none transition-all placeholder:text-slate-300"
                  style={{ borderBottomColor: form.theme.primaryColor }}
                />
              )}

              {activeBlock.type === 'currency' && (
                <div className="relative flex items-center">
                  <span className="text-xl font-bold mr-2 opacity-50">R$</span>
                  <input
                    ref={inputRef}
                    type="number"
                    placeholder={activeBlock.placeholder || '0,00'}
                    value={answers[activeBlock.id] || ''}
                    onChange={(e) => handleValueChange(e.target.value)}
                    className="w-full px-1 py-3 bg-transparent border-b-2 border-slate-350 text-xl font-bold outline-none transition-all placeholder:text-slate-300"
                    style={{ borderBottomColor: form.theme.primaryColor }}
                  />
                </div>
              )}

              {activeBlock.type === 'date' && (
                <input
                  ref={inputRef}
                  type="date"
                  value={answers[activeBlock.id] || ''}
                  onChange={(e) => handleValueChange(e.target.value)}
                  className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-lg font-bold outline-none shadow-sm focus:ring-2 focus:ring-blue-500/10 cursor-pointer"
                  style={{ borderRadius: form.theme.borderRadius }}
                />
              )}

              {activeBlock.type === 'time' && (
                <input
                  ref={inputRef}
                  type="time"
                  value={answers[activeBlock.id] || ''}
                  onChange={(e) => handleValueChange(e.target.value)}
                  className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-lg font-bold outline-none shadow-sm focus:ring-2 focus:ring-blue-500/10 cursor-pointer"
                  style={{ borderRadius: form.theme.borderRadius }}
                />
              )}

              {activeBlock.type === 'address' && (
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={activeBlock.placeholder || 'Rua, número, bairro, cidade, estado'}
                  value={answers[activeBlock.id] || ''}
                  onChange={(e) => handleValueChange(e.target.value)}
                  className="w-full px-1 py-3 bg-transparent border-b-2 border-slate-350 text-xl font-bold outline-none transition-all placeholder:text-slate-300"
                  style={{ borderBottomColor: form.theme.primaryColor }}
                />
              )}

              {activeBlock.type === 'cpf_cnpj' && (
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={activeBlock.placeholder || '000.000.000-00'}
                  value={answers[activeBlock.id] || ''}
                  onChange={(e) => handleValueChange(e.target.value)}
                  className="w-full px-1 py-3 bg-transparent border-b-2 border-slate-350 text-xl font-bold outline-none transition-all placeholder:text-slate-300"
                  style={{ borderBottomColor: form.theme.primaryColor }}
                />
              )}

              {activeBlock.type === 'yes_no' && (
                <div className="flex flex-col sm:flex-row gap-4 max-w-md">
                  {[
                    { label: 'Sim', val: 'Sim', key: 'S' },
                    { label: 'Não', val: 'Não', key: 'N' }
                  ].map((item) => {
                    const isSelected = answers[activeBlock.id] === item.val;
                    return (
                      <button
                        key={item.val}
                        onClick={() => {
                          handleValueChange(item.val);
                          // Auto advance on Sim/Não selection
                          setTimeout(handleNext, 300);
                        }}
                        className={`flex-1 py-4 px-6 text-sm font-bold border rounded-xl shadow-sm flex items-center justify-between transition-all ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700'
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                        style={{ borderRadius: form.theme.borderRadius }}
                      >
                        <span>{item.label}</span>
                        <span className={`text-[10px] font-bold border px-1.5 py-0.5 rounded transition-colors ${
                          isSelected ? 'bg-blue-700 border-blue-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-400'
                        }`}>
                          {item.key}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {['single_choice', 'button_options'].includes(activeBlock.type) && (
                <div className="space-y-3 max-w-md">
                  {(activeBlock.options || []).map((opt, i) => {
                    const isSelected = answers[activeBlock.id] === opt.value;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => {
                          handleValueChange(opt.value);
                          // Auto-advance choice selection
                          setTimeout(handleNext, 300);
                        }}
                        className={`w-full py-4 px-5 text-sm font-bold border rounded-xl shadow-sm text-left flex items-center justify-between transition-all ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700'
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                        style={{ borderRadius: form.theme.borderRadius }}
                      >
                        <span>{opt.label}</span>
                        <span className={`text-[10px] font-bold border px-1.5 py-0.5 rounded transition-colors ${
                          isSelected ? 'bg-blue-700 border-blue-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-400'
                        }`}>
                          {i + 1}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {activeBlock.type === 'multiple_choice' && (
                <div className="space-y-3 max-w-md">
                  {(activeBlock.options || []).map((opt) => {
                    const currentValues = answers[activeBlock.id] || [];
                    const isSelected = currentValues.includes(opt.value);
                    return (
                      <button
                        key={opt.id}
                        onClick={() => {
                          if (isSelected) {
                            handleValueChange(currentValues.filter((v: any) => v !== opt.value));
                          } else {
                            handleValueChange([...currentValues, opt.value]);
                          }
                        }}
                        className={`w-full py-4 px-5 text-sm font-bold border rounded-xl shadow-sm text-left flex items-center justify-between transition-all ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700'
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                        style={{ borderRadius: form.theme.borderRadius }}
                      >
                        <span>{opt.label}</span>
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                          isSelected ? 'bg-blue-700 border-blue-700 text-white' : 'bg-slate-50 border-slate-250 text-transparent'
                        }`}>
                          <Check size={12} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {activeBlock.type === 'dropdown' && (
                <div className="max-w-md relative">
                  <select
                    value={answers[activeBlock.id] || ''}
                    onChange={(e) => handleValueChange(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none shadow-sm focus:ring-2 focus:ring-blue-500/10 cursor-pointer appearance-none"
                    style={{ borderRadius: form.theme.borderRadius }}
                  >
                    <option value="">Selecione uma opção...</option>
                    {(activeBlock.options || []).map(opt => (
                      <option key={opt.id} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-3.5 text-slate-400 pointer-events-none" size={16} />
                </div>
              )}

              {activeBlock.type === 'scale' && (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2 py-2">
                    {Array.from({ length: 10 }, (_, i) => i + 1).map(num => {
                      const isSelected = answers[activeBlock.id] === num;
                      return (
                        <button
                          key={num}
                          onClick={() => {
                            handleValueChange(num);
                            setTimeout(handleNext, 300);
                          }}
                          className={`w-11 h-11 text-sm font-bold border rounded-xl flex items-center justify-center transition-all shadow-sm ${
                            isSelected
                              ? 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700'
                              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          {num}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeBlock.type === 'stars' && (
                <div className="flex gap-3.5 py-2">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const rating = i + 1;
                    const isSelected = (answers[activeBlock.id] || 0) >= rating;
                    return (
                      <button
                        key={i}
                        onClick={() => {
                          handleValueChange(rating);
                          setTimeout(handleNext, 300);
                        }}
                        className={`text-4xl transition-all ${
                          isSelected ? 'text-amber-400 scale-105' : 'text-slate-200 hover:text-amber-200'
                        }`}
                      >
                        <Star fill={isSelected ? 'currentColor' : 'none'} size={36} />
                      </button>
                    );
                  })}
                </div>
              )}

              {activeBlock.type === 'nps' && (
                <div className="space-y-2 max-w-lg">
                  <div className="flex gap-1.5 py-2 overflow-x-auto">
                    {Array.from({ length: 11 }, (_, i) => i).map(num => {
                      const isSelected = answers[activeBlock.id] === num;
                      return (
                        <button
                          key={num}
                          onClick={() => {
                            handleValueChange(num);
                            setTimeout(handleNext, 300);
                          }}
                          className={`w-10 h-10 text-xs font-bold border rounded-xl flex items-center justify-center hover:bg-slate-50 shadow-sm shrink-0 transition-all ${
                            isSelected
                              ? 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700'
                              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          {num}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider px-1">
                    <span>Pouco provável</span>
                    <span>Muito provável</span>
                  </div>
                </div>
              )}

              {activeBlock.type === 'file_upload' && (
                <div className="max-w-md space-y-3">
                  {answers[activeBlock.id] ? (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs font-medium">
                      <div className="min-w-0 pr-2">
                        <p className="truncate text-slate-800">{answers[activeBlock.id].fileName}</p>
                        <p className="text-[10px] text-slate-400 font-bold">{(answers[activeBlock.id].fileSize / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                      <button
                        onClick={() => handleValueChange(null)}
                        className="text-red-500 font-bold hover:underline shrink-0"
                      >
                        Limpar
                      </button>
                    </div>
                  ) : (
                    <label 
                      className="w-full border-2 border-dashed border-slate-350 p-8 rounded-2xl flex flex-col items-center justify-center bg-white/40 hover:bg-white/60 transition-colors cursor-pointer"
                      style={{ borderRadius: form.theme.borderRadius }}
                    >
                      <Upload className="text-slate-400 mb-2" size={24} />
                      <span className="text-xs text-slate-500 font-bold">Clique para enviar arquivo</span>
                      <span className="text-[10px] text-slate-400 mt-1">Limite: 5MB</span>
                      <input type="file" className="hidden" onChange={handleFileUpload} />
                    </label>
                  )}
                </div>
              )}

              {activeBlock.type === 'terms_consent' && (
                <div className="flex items-start gap-3 py-2 max-w-xl">
                  <input
                    type="checkbox"
                    checked={answers[activeBlock.id] || false}
                    onChange={(e) => handleValueChange(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded cursor-pointer"
                  />
                  <p className="text-xs opacity-75 font-medium leading-relaxed">
                    {form.settings.lgpdConsentText || 'Eu concordo com a coleta e processamento dos meus dados para fins comerciais de acordo com as diretrizes da LGPD.'}
                  </p>
                </div>
              )}
            </div>

            {/* Validation errors */}
            {validationError && (
              <p className="text-red-500 text-xs font-bold flex items-center gap-1 bg-red-50 p-3 rounded-lg max-w-md animate-in fade-in duration-200">
                <AlertCircle size={14} /> {validationError}
              </p>
            )}

            {/* Footer Buttons navigation */}
            <div className="flex items-center gap-4 pt-4 shrink-0">
              {activeBlock.type !== 'welcome' && activeBlock.type !== 'thank_you' && (
                <button
                  type="submit"
                  disabled={submitting}
                  onClick={handleNext}
                  className="py-3 px-6 text-sm font-bold rounded-xl transition-all shadow-md hover:scale-[1.02] active:scale-95 flex items-center gap-1 text-white"
                  style={{ backgroundColor: form.theme.buttonColor, color: form.theme.buttonTextColor, borderRadius: form.theme.borderRadius }}
                >
                  {submitting ? (
                    <Loader2 className="animate-spin text-white" size={16} />
                  ) : (
                    <>Avançar <ChevronRight size={16} /></>
                  )}
                </button>
              )}

              {/* Show Enter cue on desktop */}
              {activeBlock.type !== 'welcome' && activeBlock.type !== 'thank_you' && (
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider hidden md:inline opacity-60">
                  pressione <span className="border rounded px-1.5 py-0.5 bg-slate-50">Enter ↵</span>
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center text-slate-400">Bloco não encontrado.</div>
        )}
      </main>

      {/* Bottom Floating Back Arrow */}
      <footer className="max-w-3xl w-full mx-auto shrink-0 flex justify-between items-center py-2">
        {currentIdx > 0 && activeBlock?.type !== 'thank_you' && (
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 py-2 px-3 bg-white/70 hover:bg-white text-slate-500 hover:text-slate-700 rounded-lg text-xs font-bold transition-all shadow-sm hover:shadow"
          >
            <ArrowLeft size={14} /> Voltar
          </button>
        )}
        <div className="flex-1"></div>
        {/* CRM Branding */}
        {form.theme.showBranding && (
          <div className="text-[9px] font-bold text-slate-400 opacity-40 uppercase tracking-wider flex items-center gap-1">
            <span>Powered by</span>
            <span className="text-blue-500 font-black">Phoenix CRM</span>
          </div>
        )}
      </footer>
    </div>
  );
};

export default FormViewer;
