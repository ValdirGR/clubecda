# CDA – Clube da Decoração e Arquitetura

Projeto Next.js 14+ com App Router, Prisma ORM, NextAuth.js e Tailwind CSS.

## Pré-requisitos

- Node.js 18+
- MySQL (banco de dados existente `clubecda_2013`)
- Conta na [Vercel](https://vercel.com) (para deploy)
- API Key da [Resend](https://resend.com) (para envio de e-mails)

## Instalação

```bash
# Instalar dependências
npm install

# Copiar variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais

# Gerar client do Prisma
npx prisma generate

# (Opcional) Introspectar o banco existente
npx prisma db pull

# Iniciar em desenvolvimento
npm run dev
```

## Variáveis de Ambiente

Edite `.env.local` com:

- `DATABASE_URL` – Connection string do MySQL remoto
- `NEXTAUTH_URL` – URL do site (ex: http://localhost:3000)
- `NEXTAUTH_SECRET` – Segredo para JWT (gere com `openssl rand -base64 32`)
- `RESEND_API_KEY` – API key da Resend
- `EMAIL_FROM` – E-mail remetente
- `EMAIL_TO` – E-mail destinatário do contato
- `NEXT_PUBLIC_SITE_URL` – URL pública do site
- `NEXT_PUBLIC_LEGACY_IMG_URL` – URL para imagens legadas (ex: https://www.clubecda.com.br/img_mod)

## Estrutura de Páginas

```
/ ..................... Home (slider, empresas, notícias)
/o-clube .............. Sobre o Clube CDA
/empresas ............. Lista de empresas parceiras
/empresas/[id] ........ Detalhe + showroom + promoções
/profissionais ........ Lista de profissionais
/noticias ............. Lista de notícias
/noticias/[id] ........ Detalhe da notícia
/contato .............. Formulário de contato
/cadastro ............. Cadastro de profissional/escritório
/area-restrita ........ Login
/area-restrita/empresas ..... Painel Empresa
/area-restrita/escritorios .. Painel Escritório
/area-restrita/profissionais  Painel Profissional
/admin ................ Painel Administrativo
```

## Deploy na Vercel

1. Conecte o repositório na Vercel
2. Configure as variáveis de ambiente
3. Build automático a cada push

## Tecnologias

- **Next.js 14** – App Router, Server Components, API Routes
- **Prisma** – ORM para MySQL
- **NextAuth.js** – Autenticação multi-tipo
- **Tailwind CSS** – Estilização com tema dark
- **Framer Motion** – Animações suaves
- **Resend** – Envio transacional de e-mails
- **react-hook-form + zod** – Validação de formulários
- **embla-carousel** – Slider/Carrossel
