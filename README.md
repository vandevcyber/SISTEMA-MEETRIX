# Meetrix - Smart Leads

Plataforma de gestão de leads B2B.

---

## Configurar o Supabase (obrigatório antes de rodar)

O sistema usa o **Supabase** para login, cadastro com código de verificação por email, e para o Master ver as mensagens de suporte. É gratuito. Faça isso antes do Passo 1 abaixo.

### 1. Criar o projeto

1. Acesse https://supabase.com e clique em **Start your project**
2. Faça login com GitHub
3. Clique em **New project**
4. Dê um nome (ex: `meetrix`), crie uma senha de banco de dados (guarde ela) e escolha a região mais próxima (South America - São Paulo)
5. Clique em **Create new project** e aguarde ~2 minutos

### 2. Pegar as chaves

1. Dentro do projeto, vá em **Settings** (ícone de engrenagem) → **API**
2. Copie o **Project URL** e a **anon public key**

### 3. Confirmar que a confirmação por email está ativa

1. Vá em **Authentication** → **Sign In / Providers** → confira que **Email** está habilitado
2. Não precisa mexer em templates — o sistema usa o **link de confirmação padrão** do Supabase. O cliente recebe um email, clica no link, e a conta é ativada automaticamente

### 4. Criar as tabelas do banco de dados

1. Vá em **SQL Editor** (menu lateral) → **New query**
2. Abra o arquivo **`supabase-schema.sql`** (está na raiz da pasta do projeto) com o Bloco de Notas
3. Copie **todo o conteúdo** do arquivo e cole no SQL Editor
4. Clique em **Run**
5. Deve aparecer "Success. No rows returned" — isso é normal e significa que as tabelas `companies`, `profiles`, `leads`, `support_messages`, `chat_groups` e `chat_messages` foram criadas com sucesso, já com as regras de segurança (cada empresa só vê os próprios dados)

**Se você já tinha configurado o Supabase antes** (rodou um SQL mais antigo, sem chat): ao invés do `supabase-schema.sql`, rode o arquivo **`supabase-migration-chat.sql`** — ele só adiciona o que falta, sem duplicar o que já existe.

### 5. Criar o espaço de armazenamento (fotos e áudios do chat, foto de perfil)

1. No menu lateral, clique em **Storage**
2. Clique em **New bucket**
3. Nome do bucket: `media`
4. Marque a opção **Public bucket**
5. Clique em **Create bucket**

### 6. Configurar as variáveis no projeto

1. Na pasta do projeto, faça uma cópia do arquivo `.env.example` e renomeie para `.env`
2. Abra o `.env` e cole a URL e a chave que você copiou no passo 2:
   ```
   VITE_SUPABASE_URL=https://seuprojetoid.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-aqui
   ```
3. Salve o arquivo

**Importante:** o arquivo `.env` nunca vai para o GitHub (já está no `.gitignore`) porque contém informações sensíveis. Quando for colocar na Vercel (Passo 4 abaixo), você vai configurar essas mesmas variáveis lá dentro.

---

## Como subir o sistema (passo a passo)

### Pré-requisitos

Você precisa instalar **2 coisas** no seu computador (só uma vez):

1. **Node.js** — Acesse https://nodejs.org e baixe a versão LTS (botão verde). Instale normalmente (next, next, finish).

2. **Git** — Acesse https://git-scm.com/downloads e baixe para seu sistema. Instale normalmente.

---

### Passo 1: Criar conta no GitHub

1. Acesse https://github.com
2. Clique em **Sign up**
3. Crie sua conta (email, senha, nome de usuário)

---

### Passo 2: Criar um repositório no GitHub

1. No GitHub, clique no botão **+** (canto superior direito) → **New repository**
2. Nome do repositório: `meetrix`
3. Deixe como **Public**
4. **NÃO** marque "Add a README file"
5. Clique em **Create repository**
6. Copie o link que aparece (será algo como `https://github.com/seuusuario/meetrix.git`)

---

### Passo 3: Subir os arquivos para o GitHub

Abra o **Terminal** (Mac/Linux) ou **Prompt de Comando** (Windows) e digite os comandos abaixo, **um por vez**:

```bash
# Entre na pasta do projeto (ajuste o caminho para onde você salvou)
cd meetrix-system

# Inicie o git
git init

# Adicione todos os arquivos
git add .

# Faça o primeiro commit
git commit -m "Meetrix v1.0"

# Conecte ao seu repositório (troque pelo SEU link do passo 2)
git remote add origin https://github.com/seuusuario/meetrix.git

# Envie os arquivos
git branch -M main
git push -u origin main
```

---

### Passo 4: Colocar online na Vercel (grátis)

1. Acesse https://vercel.com
2. Clique em **Sign up** → **Continue with GitHub**
3. Autorize o acesso
4. Na dashboard, clique em **Add New → Project**
5. Encontre o repositório `meetrix` e clique em **Import**
6. Nas configurações:
   - Framework Preset: **Vite**
   - Antes de clicar em Deploy, clique em **Environment Variables** e adicione:
     - `VITE_SUPABASE_URL` → cole a URL do seu projeto Supabase
     - `VITE_SUPABASE_ANON_KEY` → cole a chave anon do seu projeto Supabase
7. Clique em **Deploy**
8. Aguarde 1-2 minutos
9. Pronto! Você receberá um link tipo `https://meetrix-xxxx.vercel.app`

---

### Passo 5: Usar um domínio personalizado (opcional)

1. Compre um domínio (ex: meetrix.com.br) no Registro.br ou GoDaddy
2. Na Vercel, vá em **Settings → Domains**
3. Adicione seu domínio e siga as instruções de DNS

---

## Como usar o sistema

### Conta Master (só você):
- Email: `van.devcyber@gmail.com`
- Essa credencial é fixa no código — ninguém mais consegue logar como Master, mesmo criando conta
- Veja as mensagens de suporte enviadas pelos clientes no Painel Master
- Importe leads via CSV e gerencie clientes

### Clientes (Admin):
- Clicam em "Criar conta", preenchem empresa/email/senha
- Recebem um email com um link de confirmação — basta clicar para ativar a conta
- Depois de confirmado, fazem login normalmente
- Gerenciam equipe, funil de vendas, negociações, e as áreas em manutenção (WhatsApp, Notícias, Pagamentos)

### Colaboradores (SDR, BDR, Closer, Gestor):
- O Admin cadastra na aba **Equipe**, definindo nome, email, cargo, limite de leads e uma senha temporária
- O colaborador recebe um email de confirmação nesse email cadastrado — precisa clicar no link para ativar o próprio login
- Depois de confirmado, o colaborador entra com o email e a senha temporária (pode ser trocada depois em Configurações)
- **Cada cargo vê partes diferentes do sistema:**
  - **SDR / BDR:** veem só os leads atribuídos a eles mesmos, Funil, Chat Interno, Ajuda e Configurações
  - **Closer:** igual ao SDR/BDR, mas também vê Negociações
  - **Gestor:** vê tudo que o Admin vê, exceto Notícias e Pagamentos
  - **Admin:** acesso total

### Chat Interno:
- Grupos e mensagens diretas são compartilhados de verdade entre todos os colaboradores da mesma empresa (em tempo real)
- Dá para enviar texto, fotos (📷), figurinhas de emoji (😊) e áudios gravados na hora (🎤)
- Cada pessoa pode trocar a imagem de fundo do próprio chat pelo botão "Mudar imagem de fundo"
- Cada pessoa pode trocar a própria foto de perfil em Configurações

---

## Estrutura do projeto

```
meetrix-system/
├── index.html            → Página principal
├── package.json          → Configurações e dependências
├── vite.config.js        → Configuração do Vite
├── .env.example          → Modelo para suas chaves do Supabase
├── supabase-schema.sql   → Script para criar as tabelas no Supabase
└── src/
    ├── main.jsx           → Ponto de entrada React
    ├── supabaseClient.js  → Configuração do Supabase e credencial Master
    ├── db.js              → Funções de acesso ao banco (leads, equipe, empresas)
    └── App.jsx            → Todo o sistema (componentes, páginas, lógica)
```

---

## Tecnologias

- **React** — Interface do usuário
- **Vite** — Build e desenvolvimento
- **Supabase** — Autenticação, cadastro por email, banco de dados (leads, equipe, empresas), permissões por linha (RLS)
- **Vercel** — Hospedagem gratuita

---

## Configurar o Mercado Pago (cobrança por exportação de leads)

Toda exportação de leads pelo cliente custa **R$ 2,50 por lead**, cobrado via Pix real através do Mercado Pago. Isso protege seus dados: quem quiser exportar em massa para revender vai pagar caro por isso, e fica tudo registrado no Log de Exportações (visível só para você, na conta Master).

### 1. Criar conta e pegar o Access Token

1. Acesse https://www.mercadopago.com.br e crie uma conta (ou use a que você já tem)
2. Vá em **Seu negócio → Configurações → Credenciais de produção** (ou "Credenciais de teste" para testar antes de ir ao ar)
3. Copie o **Access Token**

### 2. Configurar a chave no projeto

Essa chave é secreta e **nunca** deve aparecer no código do site (por isso ela fica numa "função de servidor", não no navegador).

**Para testar localmente:**
1. Na raiz do projeto, crie um arquivo chamado `.env.local`
2. Coloque dentro:
   ```
   MP_ACCESS_TOKEN=seu-access-token-aqui
   ```
3. Rode `npm run dev` normalmente

**Para funcionar no site publicado (Vercel):**
1. No painel da Vercel, vá em **Settings → Environment Variables**
2. Adicione: Nome `MP_ACCESS_TOKEN`, Valor: seu access token
3. Faça o redeploy do projeto (Vercel → Deployments → ⋮ → Redeploy)

### Como funciona na prática

1. O cliente seleciona os leads e clica em "Exportar CSV"
2. O sistema calcula o valor (R$ 2,50 × quantidade de leads) e mostra o resumo
3. Ao confirmar, o cliente é levado para a página oficial do Mercado Pago, onde escolhe como pagar: **Pix, cartão de crédito ou boleto**
4. Depois de pagar, ele volta automaticamente para o sistema
5. O sistema confirma o pagamento com o Mercado Pago e, assim que aprovado, o CSV baixa automaticamente (se for boleto, isso só acontece depois de alguns dias, quando o boleto for compensado)
6. Cada linha exportada carrega uma **marca d'água invisível** (um código único embutido no texto, que não aparece a olho nu) — se esse arquivo aparecer em outro lugar, dá pra saber de qual exportação ele veio
7. Você (Master) vê todo o histórico em **Painel Master → Log de Exportações**: quem exportou, quantos leads, quanto pagou, e o código da marca d'água



1. **WhatsApp** — Integrar com Evolution API para QR Code real (hoje está com aviso de "em manutenção")
2. **Notícias** — Integrar com uma API de notícias real (hoje está com aviso de "em manutenção")
3. **Pagamentos (aba do menu)** — hoje mostra "em manutenção"; a cobrança de mensalidade dos planos ainda não está integrada (só a cobrança por exportação de leads já está funcionando de verdade via Mercado Pago)
4. **Domínio próprio** — meetrix.com.br

---

meetrix - smart leads
