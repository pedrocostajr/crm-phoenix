
export type LeadStatus = string;

export interface PipelineStage {
  id: string;
  name: string;
  position: number;
  color: string;
}

export interface Interaction {
  id: string;
  type: 'Ligação' | 'Email' | 'Reunião' | 'WhatsApp' | 'Outro';
  date: string;
  description: string;
}

export interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  status: LeadStatus;
  estimatedValue: number;
  origin: string;
  responsible: string;
  observations: string;
  createdAt: string;
  interactions: Interaction[];
  tags?: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string;
  status: 'Ativo' | 'Inativo';
  isAdmin?: boolean;
  password?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

export interface FormTheme {
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  buttonColor: string;
  buttonTextColor: string;
  fontFamily: string;
  borderRadius: string;
  logoUrl?: string;
  backgroundImageUrl?: string;
  showBranding: boolean;
}

export interface ConditionalRule {
  questionId: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'is_filled' | 'is_empty';
  value: string;
  action: 'go_to_question' | 'skip_questions' | 'show_question' | 'hide_question' | 'end_form' | 'go_to_thank_you' | 'redirect_url' | 'add_tag' | 'change_stage' | 'set_responsible' | 'mark_qualified' | 'mark_disqualified';
  actionTarget?: string;
}

export type BlockType = 
  | 'welcome' | 'thank_you' | 'name' | 'email' | 'phone' | 'short_text' | 'long_text' 
  | 'number' | 'currency' | 'date' | 'time' | 'address' | 'cpf_cnpj' | 'url' 
  | 'single_choice' | 'multiple_choice' | 'dropdown' | 'button_options' | 'yes_no' 
  | 'scale' | 'stars' | 'nps' | 'file_upload' | 'terms_consent' | 'hidden';

export interface QuestionBlock {
  id: string;
  type: BlockType;
  title: string;
  description?: string;
  required: boolean;
  placeholder?: string;
  defaultValue?: string;
  helpText?: string;
  errorMessage?: string;
  internalId: string;
  crmField?: string;
  options?: { id: string; label: string; value: string }[];
  rules?: ConditionalRule[];
}

export interface FormSettings {
  internalName: string;
  publicTitle: string;
  description: string;
  slug: string;
  status: 'draft' | 'published' | 'paused';
  language: string;
  endedMessage?: string;
  startDate?: string;
  endDate?: string;
  responseLimit?: number;
  password?: string;
  oneResponsePerPerson: boolean;
  captureUtm: boolean;
  captureReferrer: boolean;
  captureDevice: boolean;
  redirectUrl?: string;
  notifyNewResponse: boolean;
  seoTitle?: string;
  seoDescription?: string;
  lgpdConsentText?: string;
  metaPixelId?: string;
  googleAnalyticsId?: string;
}

export interface FormAutomation {
  createLead: boolean;
  addTags: string[];
  pipelineStage?: string;
  responsibleUser?: string;
}

export interface FormWebhook {
  id: string;
  url: string;
  secretKey: string;
  headers: Record<string, string>;
}

export interface Form {
  id: string;
  userId: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
  settings: FormSettings;
  blocks: QuestionBlock[];
  theme: FormTheme;
  automations: FormAutomation;
  webhooks: FormWebhook[];
  viewsCount?: number;
  startsCount?: number;
  completionsCount?: number;
  partialsCount?: number;
  avgTimeSpent?: number;
}

export interface FormResponseValue {
  questionId: string;
  questionTitle: string;
  value: any;
  crmField?: string;
}

export interface FormResponse {
  id: string;
  formId: string;
  workspaceId: string;
  sessionId: string;
  status: 'viewed' | 'started' | 'partial' | 'completed' | 'abandoned';
  createdAt: string;
  updatedAt: string;
  answers: Record<string, FormResponseValue>;
  currentQuestionId?: string;
  device?: {
    browser: string;
    os: string;
    deviceType: 'mobile' | 'tablet' | 'desktop';
  };
  utm?: Record<string, string>;
  referrerUrl?: string;
  timeSpent?: number;
  leadId?: string;
}

