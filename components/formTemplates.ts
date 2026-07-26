import { Form, QuestionBlock } from '../types';

export interface FormTemplate {
  name: string;
  description: string;
  icon: string;
  blocks: Omit<QuestionBlock, 'id'>[];
  theme: {
    primaryColor: string;
    backgroundColor: string;
    textColor: string;
    buttonColor: string;
    buttonTextColor: string;
    fontFamily: string;
    borderRadius: string;
    showBranding: boolean;
  };
}

export const FORM_TEMPLATES: Record<string, FormTemplate> = {
  lead_capture: {
    name: 'Captação de leads',
    description: 'Ideal para coletar informações básicas de novos leads.',
    icon: 'UserPlus',
    theme: {
      primaryColor: '#3b82f6',
      backgroundColor: '#f8fafc',
      textColor: '#1e293b',
      buttonColor: '#3b82f6',
      buttonTextColor: '#ffffff',
      fontFamily: 'Inter',
      borderRadius: '0.75rem',
      showBranding: true
    },
    blocks: [
      { type: 'welcome', title: 'Olá! Seja bem-vindo(a).', description: 'Gostaríamos de conhecer você melhor. Vamos começar?', required: false, internalId: 'welcome' },
      { type: 'name', title: 'Qual é o seu nome completo?', required: true, placeholder: 'Digite seu nome...', internalId: 'name', crmField: 'name' },
      { type: 'email', title: 'E qual é o seu melhor e-mail?', required: true, placeholder: 'nome@exemplo.com', internalId: 'email', crmField: 'email' },
      { type: 'phone', title: 'Qual o seu número de WhatsApp/Telefone?', required: true, placeholder: '(00) 00000-0000', internalId: 'phone', crmField: 'phone' },
      { type: 'short_text', title: 'Qual a sua empresa ou segmento de negócio?', required: false, placeholder: 'Digite aqui...', internalId: 'company', crmField: 'company' },
      { type: 'thank_you', title: 'Obrigado pelas informações!', description: 'Nossa equipe entrará em contato em breve.', required: false, internalId: 'thank_you' }
    ]
  },
  budget_request: {
    name: 'Solicitação de orçamento',
    description: 'Colete detalhes do projeto e estimativas de valor para orçamento.',
    icon: 'DollarSign',
    theme: {
      primaryColor: '#8b5cf6',
      backgroundColor: '#fbfbfe',
      textColor: '#0f172a',
      buttonColor: '#8b5cf6',
      buttonTextColor: '#ffffff',
      fontFamily: 'Inter',
      borderRadius: '0.5rem',
      showBranding: true
    },
    blocks: [
      { type: 'welcome', title: 'Solicitar Orçamento', description: 'Responda algumas perguntas rápidas para receber uma proposta personalizada.', required: false, internalId: 'welcome' },
      { type: 'name', title: 'Como podemos te chamar?', required: true, placeholder: 'Seu nome...', internalId: 'name', crmField: 'name' },
      { type: 'email', title: 'Qual e-mail devemos enviar o orçamento?', required: true, placeholder: 'nome@empresa.com', internalId: 'email', crmField: 'email' },
      { type: 'phone', title: 'Qual o seu WhatsApp para contato?', required: true, placeholder: '(00) 00000-0000', internalId: 'phone', crmField: 'phone' },
      { type: 'long_text', title: 'Descreva brevemente o que você precisa:', required: true, placeholder: 'Ex: Criação de um site institucional de 5 páginas...', internalId: 'observations', crmField: 'observations' },
      { 
        type: 'single_choice', 
        title: 'Qual a sua faixa de investimento prevista?', 
        required: true, 
        internalId: 'investment_range',
        options: [
          { id: '1', label: 'Até R$ 2.000', value: '2000' },
          { id: '2', label: 'De R$ 2.000 a R$ 5.000', value: '5000' },
          { id: '3', label: 'De R$ 5.000 a R$ 10.000', value: '10000' },
          { id: '4', label: 'Acima de R$ 10.000', value: '20000' }
        ]
      },
      { type: 'thank_you', title: 'Pedido recebido com sucesso!', description: 'Estamos analisando seus dados e enviaremos o orçamento em até 24 horas úteis.', required: false, internalId: 'thank_you' }
    ]
  },
  commercial_qualification: {
    name: 'Qualificação comercial',
    description: 'Filtre e qualifique seus leads antes do primeiro contato.',
    icon: 'ShieldCheck',
    theme: {
      primaryColor: '#0ea5e9',
      backgroundColor: '#fafafa',
      textColor: '#171717',
      buttonColor: '#0ea5e9',
      buttonTextColor: '#ffffff',
      fontFamily: 'Inter',
      borderRadius: '1rem',
      showBranding: true
    },
    blocks: [
      { type: 'welcome', title: 'Queremos entender as suas necessidades', description: 'Por favor, preencha este formulário para que possamos direcionar o especialista correto.', required: false, internalId: 'welcome' },
      { type: 'name', title: 'Qual o seu nome?', required: true, internalId: 'name', crmField: 'name' },
      { type: 'email', title: 'Seu e-mail corporativo:', required: true, placeholder: 'nome@empresa.com', internalId: 'email', crmField: 'email' },
      { type: 'phone', title: 'WhatsApp:', required: true, internalId: 'phone', crmField: 'phone' },
      { 
        type: 'single_choice', 
        title: 'Qual é o seu cargo atualmente?', 
        required: true, 
        internalId: 'role',
        options: [
          { id: '1', label: 'Diretor / C-Level', value: 'c_level' },
          { id: '2', label: 'Gerente / Coordenador', value: 'manager' },
          { id: '3', label: 'Analista / Técnico', value: 'analyst' },
          { id: '4', label: 'Outro', value: 'other' }
        ]
      },
      { 
        type: 'yes_no', 
        title: 'Você possui orçamento aprovado para este projeto?', 
        required: true, 
        internalId: 'has_budget' 
      },
      { 
        type: 'dropdown', 
        title: 'Qual o prazo estimado de contratação?', 
        required: true, 
        internalId: 'timeframe',
        options: [
          { id: '1', label: 'Imediato (este mês)', value: 'immediate' },
          { id: '2', label: 'Em até 3 meses', value: '3_months' },
          { id: '3', label: 'Apenas pesquisando', value: 'researching' }
        ]
      },
      { type: 'thank_you', title: 'Tudo pronto!', description: 'Um de nossos consultores entrará em contato em breve para apresentar a melhor solução.', required: false, internalId: 'thank_you' }
    ]
  },
  customer_registration: {
    name: 'Cadastro de cliente',
    description: 'Cadastro formal com dados de contato, endereço e CNPJ.',
    icon: 'FileText',
    theme: {
      primaryColor: '#10b981',
      backgroundColor: '#f0fdf4',
      textColor: '#14532d',
      buttonColor: '#10b981',
      buttonTextColor: '#ffffff',
      fontFamily: 'Inter',
      borderRadius: '0.375rem',
      showBranding: true
    },
    blocks: [
      { type: 'welcome', title: 'Formulário de Cadastro', description: 'Preencha suas informações cadastrais de forma segura.', required: false, internalId: 'welcome' },
      { type: 'name', title: 'Nome Completo / Razão Social:', required: true, internalId: 'name', crmField: 'name' },
      { type: 'cpf_cnpj', title: 'CPF ou CNPJ:', required: true, placeholder: '00.000.000/0000-00', internalId: 'cpf_cnpj' },
      { type: 'email', title: 'E-mail principal para faturamento/contato:', required: true, internalId: 'email', crmField: 'email' },
      { type: 'phone', title: 'Telefone para Contato:', required: true, internalId: 'phone', crmField: 'phone' },
      { type: 'address', title: 'Qual é o seu endereço completo?', required: true, placeholder: 'Rua, Número, Bairro, Cidade, Estado', internalId: 'address' },
      { type: 'terms_consent', title: 'Aceite de Termos e LGPD', description: 'Você autoriza o processamento dos seus dados de acordo com nossa Política de Privacidade.', required: true, internalId: 'terms' },
      { type: 'thank_you', title: 'Cadastro Concluído!', description: 'Seus dados foram salvos em nossa base cadastral com segurança.', required: false, internalId: 'thank_you' }
    ]
  },
  satisfaction_survey: {
    name: 'Pesquisa de satisfação',
    description: 'Avalie a qualidade do seu atendimento com NPS e estrelas.',
    icon: 'Smile',
    theme: {
      primaryColor: '#f59e0b',
      backgroundColor: '#fffbeb',
      textColor: '#78350f',
      buttonColor: '#f59e0b',
      buttonTextColor: '#ffffff',
      fontFamily: 'Inter',
      borderRadius: '0.75rem',
      showBranding: true
    },
    blocks: [
      { type: 'welcome', title: 'Sua opinião é muito importante!', description: 'Leva menos de 1 minuto para nos ajudar a melhorar.', required: false, internalId: 'welcome' },
      { type: 'nps', title: 'Em uma escala de 0 a 10, qual a probabilidade de você nos recomendar a um amigo ou colega?', required: true, internalId: 'nps' },
      { type: 'stars', title: 'Como você avalia a qualidade do nosso atendimento geral?', required: true, internalId: 'stars_rating' },
      { type: 'long_text', title: 'Deixe um comentário sobre o que podemos fazer melhor:', required: false, placeholder: 'Escreva sua sugestão...', internalId: 'feedback' },
      { type: 'thank_you', title: 'Muito obrigado pelo seu feedback!', description: 'Suas respostas nos ajudam a evoluir todos os dias.', required: false, internalId: 'thank_you' }
    ]
  },
  contact_scheduling: {
    name: 'Agendamento de contato',
    description: 'Coleta de dados de leads interessados em agendar um contato telefônico.',
    icon: 'Calendar',
    theme: {
      primaryColor: '#ec4899',
      backgroundColor: '#fdf2f8',
      textColor: '#500724',
      buttonColor: '#ec4899',
      buttonTextColor: '#ffffff',
      fontFamily: 'Inter',
      borderRadius: '9999px',
      showBranding: true
    },
    blocks: [
      { type: 'welcome', title: 'Fale com um Especialista', description: 'Escolha o melhor dia e horário para ligarmos para você.', required: false, internalId: 'welcome' },
      { type: 'name', title: 'Qual o seu nome?', required: true, internalId: 'name', crmField: 'name' },
      { type: 'phone', title: 'Qual número de WhatsApp/Telefone ligaremos?', required: true, placeholder: '(00) 90000-0000', internalId: 'phone', crmField: 'phone' },
      { type: 'date', title: 'Qual a melhor data?', required: true, internalId: 'schedule_date' },
      { type: 'time', title: 'E qual o melhor período/horário?', required: true, placeholder: 'Ex: Entre as 14h e 16h', internalId: 'schedule_time' },
      { type: 'thank_you', title: 'Agendado!', description: 'Anotado aqui. Fique de olho no seu celular no dia selecionado!', required: false, internalId: 'thank_you' }
    ]
  },
  real_estate_capture: {
    name: 'Captação imobiliária',
    description: 'Focado em proprietários querendo vender ou alugar imóveis.',
    icon: 'Home',
    theme: {
      primaryColor: '#059669',
      backgroundColor: '#f0fdf4',
      textColor: '#064e3b',
      buttonColor: '#059669',
      buttonTextColor: '#ffffff',
      fontFamily: 'Inter',
      borderRadius: '0.5rem',
      showBranding: true
    },
    blocks: [
      { type: 'welcome', title: 'Quer vender ou alugar seu imóvel?', description: 'Cadastre os detalhes básicos em 3 passos e nossa equipe imobiliária cuidará do resto.', required: false, internalId: 'welcome' },
      { 
        type: 'single_choice', 
        title: 'Qual é o tipo do seu imóvel?', 
        required: true, 
        internalId: 'property_type',
        options: [
          { id: '1', label: 'Casa', value: 'house' },
          { id: '2', label: 'Apartamento', value: 'apartment' },
          { id: '3', label: 'Terreno', value: 'land' },
          { id: '4', label: 'Comercial', value: 'commercial' }
        ]
      },
      { type: 'address', title: 'Onde o imóvel fica localizado?', required: true, placeholder: 'Endereço, Bairro, Cidade...', internalId: 'property_address' },
      { 
        type: 'single_choice', 
        title: 'Você deseja vender ou alugar?', 
        required: true, 
        internalId: 'goal_type',
        options: [
          { id: '1', label: 'Vender', value: 'sell' },
          { id: '2', label: 'Alugar', value: 'rent' }
        ]
      },
      { type: 'currency', title: 'Qual o valor estimado pretendido?', required: false, placeholder: 'R$ 0,00', internalId: 'estimatedValue', crmField: 'estimatedValue' },
      { type: 'name', title: 'Seu nome completo:', required: true, internalId: 'name', crmField: 'name' },
      { type: 'phone', title: 'Seu WhatsApp:', required: true, internalId: 'phone', crmField: 'phone' },
      { type: 'thank_you', title: 'Cadastro enviado!', description: 'Um de nossos corretores especialistas fará a avaliação inicial e entrará em contato.', required: false, internalId: 'thank_you' }
    ]
  },
  vehicle_resale: {
    name: 'Captação para revenda de veículos',
    description: 'Colete dados sobre carros ou motos para avaliação e compra.',
    icon: 'Car',
    theme: {
      primaryColor: '#ef4444',
      backgroundColor: '#fef2f2',
      textColor: '#7f1d1d',
      buttonColor: '#ef4444',
      buttonTextColor: '#ffffff',
      fontFamily: 'Inter',
      borderRadius: '0.75rem',
      showBranding: true
    },
    blocks: [
      { type: 'welcome', title: 'Quer vender ou trocar de veículo?', description: 'Insira os dados do seu veículo e receba uma avaliação prévia em poucos minutos.', required: false, internalId: 'welcome' },
      { type: 'short_text', title: 'Qual a marca e modelo do seu veículo?', required: true, placeholder: 'Ex: Honda Civic 2020 LXR', internalId: 'car_model' },
      { type: 'number', title: 'Qual é a quilometragem atual?', required: true, placeholder: 'Ex: 45000', internalId: 'car_km' },
      { 
        type: 'single_choice', 
        title: 'Qual é o tipo de câmbio?', 
        required: true, 
        internalId: 'transmission_type',
        options: [
          { id: '1', label: 'Manual', value: 'manual' },
          { id: '2', label: 'Automático', value: 'automatic' }
        ]
      },
      { type: 'name', title: 'Como se chama?', required: true, internalId: 'name', crmField: 'name' },
      { type: 'phone', title: 'Qual o seu WhatsApp?', required: true, internalId: 'phone', crmField: 'phone' },
      { type: 'thank_you', title: 'Dados recebidos!', description: 'Nossos avaliadores farão uma análise de mercado e te mandarão a cotação no WhatsApp.', required: false, internalId: 'thank_you' }
    ]
  },
  local_business: {
    name: 'Captação para negócios locais',
    description: 'Formulário de captação genérico para delivery, serviços locais, etc.',
    icon: 'MapPin',
    theme: {
      primaryColor: '#3b82f6',
      backgroundColor: '#f8fafc',
      textColor: '#1e293b',
      buttonColor: '#3b82f6',
      buttonTextColor: '#ffffff',
      fontFamily: 'Inter',
      borderRadius: '0.5rem',
      showBranding: true
    },
    blocks: [
      { type: 'welcome', title: 'Fale Conosco!', description: 'Deixe sua mensagem ou dúvida e entraremos em contato o mais rápido possível.', required: false, internalId: 'welcome' },
      { type: 'name', title: 'Seu Nome:', required: true, internalId: 'name', crmField: 'name' },
      { type: 'phone', title: 'Seu Celular:', required: true, internalId: 'phone', crmField: 'phone' },
      { type: 'long_text', title: 'Como podemos ajudar você hoje?', required: true, placeholder: 'Escreva sua mensagem...', internalId: 'observations', crmField: 'observations' },
      { type: 'thank_you', title: 'Mensagem enviada!', description: 'Agradecemos o contato. Responderemos o mais breve possível.', required: false, internalId: 'thank_you' }
    ]
  }
};
