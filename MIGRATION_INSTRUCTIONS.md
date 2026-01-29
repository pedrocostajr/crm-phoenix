# Guia de Migração para Novo Projeto Supabase

Siga estes passos para configurar seu novo projeto Supabase e fazer sua aplicação funcionar.

## Passo 1: Criar Novo Projeto
1. Acesse [https://supabase.com/dashboard](https://supabase.com/dashboard) e faça login.
2. Clique em **"New Project"**.
3. Escolha sua organização.
4. Preencha os detalhes:
   - **Name:** Phoenix CRM (ou outro de sua escolha)
   - **Database Password:** Crie uma senha forte e **SALVE-A**. Você vai precisar dela para deploys futuros.
   - **Region:** Escolha a mais próxima (ex: São Paulo).
5. Clique em **"Create new project"**.

## Passo 2: Configurar Banco de Dados
1. No painel do novo projeto, vá para o **SQL Editor** (ícone de terminal/prompt na barra lateral esquerda).
2. Clique em **"New Query"**.
3. Copie **TODO O CONTEÚDO** do arquivo `setup_database.sql` que eu criei no seu projeto (está na raiz).
4. Cole no editor SQL do Supabase.
5. Clique em **"Run"** (botão verde no canto inferior direito).
   - Isso vai criar todas as tabelas (leads, users, boards, etc.) que o projeto precisa.

## Passo 3: Pegar as Chaves de Acesso (JÁ RECUPERADAS)
Você já me forneceu os dados, então apenas copie e cole onde indicado:

**Dados do seu Projeto:**
- **Project URL:** `https://neaxlhqzgaylvhdttqoe.supabase.co`
- **Project ID:** `neaxlhqzgaylvhdttqoe`
- **Anon Key (Public):** (O token longo começando com `eyJhbGciOiJIUzI1Ni...` que você me enviou)

## Passo 4: Atualizar no Vercel (Site)
1. Vá para o painel do seu projeto na **Vercel** > **Settings** > **Environment Variables**.
2. Adicione/Atualize:
   - `VITE_SUPABASE_URL`: `https://neaxlhqzgaylvhdttqoe.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lYXhsaHF6Z2F5bHZoZHR0cW9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MjczOTQsImV4cCI6MjA4NTMwMzM5NH0.cUJIyG7bCoUxl1r1dU69pKFoiumEA9TZBiMyKWDQdAU`
3. Vá na aba **Deployments** e clique em **Redeploy**.

## Passo 5: Atualizar no GitHub (Workflow de Deploy)
Para a automação funcionar, precisamos de duas chaves no GitHub (**Settings** > **Secrets/Actions**):

1. **`SUPABASE_PROJECT_ID`**:
   - Valor: `neaxlhqzgaylvhdttqoe`

2. **`SUPABASE_ACCESS_TOKEN`**:
   - ⚠️ **ATENÇÃO:** Este **NÃO** é a chave que você me mandou (Service Role).
   - Você precisa gerar um **Token Pessoal** novo.
   - Vá em: [https://supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens)
   - Clique em **Generate new token**.
   - Dê um nome (ex: "GitHub Deploy") e copie esse código.
   - Cole este código no segredo `SUPABASE_ACCESS_TOKEN` do GitHub.

## Passo 6: Finalizar
1. Faça deploy da função Supabase. Como você atualizou o GitHub, vá na aba **Actions** do GitHub, selecione o workflow e clique em **Re-run**.
2. Crie seu primeiro usuário administrador.
   - Vá no Supabase > **Authentication** > **Users**.
   - Clique em **Add User**.
   - Crie seu usuário.
   - **IMPORTANTE:** Vá na tabela `users` (Table Editor) e mude a coluna `is_admin` para `TRUE` para esse usuário, ou edite a tabela `profiles` e mude o role para `admin`.

Seu sistema deve voltar a funcionar 100%!
