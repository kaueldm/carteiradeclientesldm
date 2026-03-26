# 🚀 Guia de Deploy — Carteira CRM Loja do Mecânico

## Opções de Deploy

O projeto está configurado para funcionar em múltiplas plataformas. Escolha a que preferir:

---

## 1️⃣ **VERCEL** (Recomendado para Next.js)

A Vercel é a plataforma oficial do Next.js e oferece o melhor desempenho e suporte nativo.

### Passo a passo:

1. Acesse [vercel.com](https://vercel.com)
2. Clique em **"New Project"**
3. Conecte seu repositório GitHub: `https://github.com/kaueldm/carteiradeclientesldm`
4. Clique em **"Import"**
5. Configure as variáveis de ambiente:

| Variável | Valor |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://ujojzlwhucpdjpmlzmiu.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqb2p6bHdodWNwZGpwbWx6bWl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1NTM3OTIsImV4cCI6MjA5MDEyOTc5Mn0.3IXRQ7jcrw6W9MFSJawzfmK2dZQ6KRTRZ5nOF6d8RMo` |

6. Clique em **"Deploy"**
7. Pronto! Seu site estará online em poucos minutos

---

## 2️⃣ **CLOUDFLARE PAGES**

Excelente alternativa gratuita com CDN global.

### Passo a passo:

1. Acesse [dash.cloudflare.com](https://dash.cloudflare.com)
2. Vá para **"Pages"** no menu lateral
3. Clique em **"Create a project"**
4. Selecione **"Connect to Git"**
5. Conecte seu repositório GitHub
6. Escolha o repositório: `carteiradeclientesldm`
7. Configure o build:
   - **Build command**: `npm run build`
   - **Build output directory**: `.next`
8. Adicione as variáveis de ambiente:

| Variável | Valor |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://ujojzlwhucpdjpmlzmiu.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqb2p6bHdodWNwZGpwbWx6bWl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1NTM3OTIsImV4cCI6MjA5MDEyOTc5Mn0.3IXRQ7jcrw6W9MFSJawzfmK2dZQ6KRTRZ5nOF6d8RMo` |

9. Clique em **"Save and Deploy"**

---

## 3️⃣ **RAILWAY**

Alternativa moderna e fácil de usar.

### Passo a passo:

1. Acesse [railway.app](https://railway.app)
2. Clique em **"New Project"**
3. Selecione **"Deploy from GitHub"**
4. Conecte seu repositório
5. Selecione `carteiradeclientesldm`
6. Configure as variáveis de ambiente na aba **"Variables"**:

| Variável | Valor |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://ujojzlwhucpdjpmlzmiu.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqb2p6bHdodWNwZGpwbWx6bWl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1NTM3OTIsImV4cCI6MjA5MDEyOTc5Mn0.3IXRQ7jcrw6W9MFSJawzfmK2dZQ6KRTRZ5nOF6d8RMo` |

7. Deploy automático iniciará

---

## 4️⃣ **RENDER**

Plataforma confiável com suporte a Next.js.

### Passo a passo:

1. Acesse [render.com](https://render.com)
2. Clique em **"New +"** → **"Web Service"**
3. Conecte seu repositório GitHub
4. Selecione `carteiradeclientesldm`
5. Configure:
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
6. Adicione as variáveis de ambiente
7. Clique em **"Create Web Service"**

---

## ✅ Após o Deploy

Após escolher uma plataforma e fazer o deploy:

1. **Crie as tabelas no Supabase**: Execute o SQL do arquivo `supabase_schema.md` no SQL Editor do Supabase
2. **Teste o login** com as credenciais dos vendedores:
   - Email: `ana@ldm.com` | Senha: `anaLDM01`
   - Email: `bruna@ldm.com` | Senha: `brunaLDM02`
   - (e assim por diante...)

---

## 🔗 Links Úteis

- **Vercel**: https://vercel.com
- **Cloudflare Pages**: https://pages.cloudflare.com
- **Railway**: https://railway.app
- **Render**: https://render.com
- **Supabase**: https://supabase.com/dashboard/project/ujojzlwhucpdjpmlzmiu

---

## 📝 Notas

- **Vercel** é a opção mais recomendada para Next.js (melhor performance e suporte)
- **Cloudflare Pages** é excelente se você já usa Cloudflare
- **Railway** e **Render** são ótimas alternativas gratuitas
- Todas as plataformas oferecem HTTPS automático e domínio gratuito

Qualquer dúvida, consulte a documentação da plataforma escolhida!
