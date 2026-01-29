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

## Passo 3: Pegar as Chaves de Acesso
1. No painel do Supabase, vá em **Settings** (ícone de engrenagem) > **API**.
2. Você verá duas informações importantes:
   - **Project URL:** algo como `https://xyzabcdefg.supabase.co`
   - **Project API keys:**
     - `anon` `public`: Chave pública
     - `service_role` `secret`: Chave secreta (Cuidado com essa!)

## Passo 4: Atualizar no Vercel (Site)
1. Vá para o painel do seu projeto na **Vercel**.
2. Clique em **Settings** > **Environment Variables**.
3. Atualize (ou crie) as variáveis:
   - `VITE_SUPABASE_URL`: Cole a **Project URL**.
   - `VITE_SUPABASE_ANON_KEY`: Cole a chave `anon` `public`.
4. Vá na aba **Deployments** e clique em **Redeploy** no último deploy para que as mudanças façam efeito.

## Passo 5: Atualizar no GitHub (Workflow de Deploy)
Para que a automação que eu criei funcione (e corrija o erro de "Invalid Credentials"):
1. Vá no seu repositório GitHub.
2. **Settings** > **Secrets and variables** > **Actions**.
3. Atualize o `SUPABASE_PROJECT_ID`:
   - O ID é a parte da URL: de `https://xyzabcdefg.supabase.co`, o ID é `xyzabcdefg`.
4. Atualize o `SUPABASE_ACCESS_TOKEN` (se você mudou de conta Supabase, gere um novo, senão mantenha).

## Passo 6: Finalizar
1. Faça deploy da função Supabase. Como você atualizou o GitHub, vá na aba **Actions** do GitHub, selecione o workflow e clique em **Re-run**.
2. Crie seu primeiro usuário administrador.
   - Vá no Supabase > **Authentication** > **Users**.
   - Clique em **Add User**.
   - Crie seu usuário.
   - **IMPORTANTE:** Vá na tabela `users` (Table Editor) e mude a coluna `is_admin` para `TRUE` para esse usuário, ou edite a tabela `profiles` e mude o role para `admin`.

Seu sistema deve voltar a funcionar 100%!
