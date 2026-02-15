# CDA – Clube da Decoração e Arquitetura

Projeto Next.js 14+ com App Router, Prisma ORM, NextAuth.js e Tailwind CSS.  
Migrado do sistema legado PHP/MySQL para Next.js/PostgreSQL (Neon), deployed na Vercel.

**Produção:** [clubecda.vercel.app](https://clubecda.vercel.app)  
**Repositório:** [github.com/ValdirGR/clubecda](https://github.com/ValdirGR/clubecda)

---

## Pré-requisitos

- Node.js 18+
- Banco de dados [Neon](https://neon.tech) (PostgreSQL serverless, região sa-east-1)
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

- `DATABASE_URL` – Connection string do Neon PostgreSQL (pooled)
- `DIRECT_URL` – Connection string direta do Neon (para migrations)
- `NEXTAUTH_URL` – URL do site (ex: http://localhost:3000)
- `NEXTAUTH_SECRET` – Segredo para JWT (gere com `openssl rand -base64 32`)
- `RESEND_API_KEY` – API key da Resend
- `EMAIL_FROM` – E-mail remetente
- `EMAIL_TO` – E-mail destinatário do contato
- `NEXT_PUBLIC_SITE_URL` – URL pública do site
- `NEXT_PUBLIC_LEGACY_IMG_URL` – URL para imagens legadas (ex: https://www.clubecda.com.br/img_mod)

---

## Tecnologias

| Tecnologia | Versão | Uso |
|---|---|---|
| **Next.js** | 14.2.x | App Router, Server Components, API Routes |
| **Prisma** | 6.19.x | ORM para PostgreSQL (Neon), adapter serverless |
| **NextAuth.js** | 4.24.x | Autenticação multi-tipo (JWT, CredentialsProvider) |
| **Tailwind CSS** | 3.x | Estilização com tema dark customizado |
| **Framer Motion** | 11.x | Animações suaves |
| **Resend** | 4.x | Envio transacional de e-mails |
| **react-hook-form + zod** | 7.x / 3.x | Validação de formulários |
| **embla-carousel** | 8.x | Slider/Carrossel na home |
| **jsPDF + jspdf-autotable** | — | Exportação de relatórios para PDF |
| **xlsx (SheetJS)** | — | Exportação de relatórios para Excel |
| **react-hot-toast** | 2.x | Notificações toast |
| **lucide-react** | 0.460.x | Ícones SVG |

> **Nota:** Prisma 6 NÃO suporta `mode: 'insensitive'` — buscas case-insensitive usam raw SQL `ILIKE`.

---

## Estrutura de Páginas

### Páginas Públicas

```
/ ......................... Home (hero slider, empresas parceiras, notícias)
/o-clube .................. Sobre o Clube CDA
/empresas ................. Lista de empresas parceiras
/empresas/[id] ............ Detalhe da empresa + showroom + promoções
/profissionais ............ Lista de profissionais
/noticias ................. Lista de notícias
/noticias/[id] ............ Detalhe da notícia
/contato .................. Formulário de contato (e-mail via Resend)
/cadastro ................. Cadastro público de profissional/escritório
/area-restrita ............ Login (autenticação)
```

### Área Restrita (Painel do Usuário)

```
/area-restrita/empresas .............. Dashboard da Empresa
/area-restrita/empresas/pontos ....... Pontos da Empresa
/area-restrita/empresas/showroom ..... Showroom da Empresa
/area-restrita/escritorios ........... Dashboard do Escritório
/area-restrita/escritorios/empresas .. Empresas vinculadas
/area-restrita/escritorios/pontos .... Pontos do Escritório
/area-restrita/profissionais ......... Dashboard do Profissional
/area-restrita/profissionais/empresas  Empresas vinculadas
/area-restrita/profissionais/pontos .. Pontos do Profissional
```

### Painel Administrativo

```
/admin ............................ Dashboard com stats e módulos
/admin/empresas ................... CRUD de Empresas parceiras
/admin/escritorios ................ CRUD de Escritórios
/admin/profissionais .............. CRUD de Profissionais
/admin/noticias ................... CRUD de Notícias
/admin/pontos ..................... Gerenciamento de Pontos (criar, editar, excluir com auditoria)
/admin/dia-limite ................. Dia Limite de Pontuação mensal
/admin/relatorios ................. Relatórios (4 tipos, exportação PDF/Excel)
/admin/bonus-multipliers .......... Bônus Multiplicadores (faixas de índice)
/admin/cas ........................ Centro de Administração do Site (hub)
/admin/cas/usuarios ............... Gestão de Usuários CAS
/admin/cas/acessos ................ Log de Acessos
/admin/cas/relatorios ............. Relatórios CAS
```

---

## Módulos do Painel Admin

| Módulo | Rota | Descrição |
|---|---|---|
| **Empresas** | `/admin/empresas` | CRUD de empresas parceiras |
| **Escritórios** | `/admin/escritorios` | CRUD de escritórios cadastrados |
| **Profissionais** | `/admin/profissionais` | CRUD de profissionais |
| **Notícias** | `/admin/noticias` | Publicar e gerenciar notícias |
| **Pontos** | `/admin/pontos` | Gerenciar programa de pontos (com log de auditoria) |
| **Dia Limite Pontuação** | `/admin/dia-limite` | Definir prazo mensal para pontuação |
| **Relatórios** | `/admin/relatorios` | Relatórios por empresa/escritório/profissional/geral com exportação PDF e Excel |
| **Bônus Multiplicadores** | `/admin/bonus-multipliers` | Gerenciar faixas de índice multiplicador por empresas únicas/mês |
| **CAS** | `/admin/cas` | Centro de Administração: usuários, acessos e relatórios |

---

## API Routes

### Autenticação
| Rota | Método | Descrição |
|---|---|---|
| `/api/auth/[...nextauth]` | GET, POST | NextAuth.js (login/logout/session) |

### Público
| Rota | Método | Descrição |
|---|---|---|
| `/api/contato` | POST | Envio de formulário de contato |
| `/api/cadastro` | POST | Cadastro público de profissional/escritório |

### Busca
| Rota | Método | Descrição |
|---|---|---|
| `/api/search` | GET | Autocomplete: `?type=profissional\|escritorio&q=termo` |

### Pontos
| Rota | Método | Descrição |
|---|---|---|
| `/api/pontos` | GET, POST | Listar e criar pontos |
| `/api/pontos/[id]` | PUT, DELETE | Editar e excluir pontos (com log de auditoria) |
| `/api/pontos/dia-limite` | GET | Obter dia limite de pontuação |

### Admin — Bônus Multiplicadores
| Rota | Método | Descrição |
|---|---|---|
| `/api/admin/bonus-multipliers` | GET | Listar todas as faixas |
| `/api/admin/bonus-multipliers` | PUT | Atualizar faixas em batch (transação) |
| `/api/admin/bonus-multipliers` | POST | Adicionar nova faixa |
| `/api/admin/bonus-multipliers/[id]` | DELETE | Excluir faixa |

### CAS (Centro de Administração)
| Rota | Método | Descrição |
|---|---|---|
| `/api/cas/usuarios` | GET, POST | Listar e criar usuários CAS |
| `/api/cas/usuarios/[id]` | GET, PUT, DELETE | CRUD individual de usuário CAS |
| `/api/cas/modulos` | GET | Listar módulos (deduplicados por nome+nível) |
| `/api/cas/acessos` | GET | Listar log de acessos |
| `/api/cas/configuracoes` | GET, PUT | Configurações do sistema |
| `/api/cas/configuracoes/logs` | GET | Log de alterações de configuração |
| `/api/cas/relatorios/empresas` | GET | Relatório por empresas |
| `/api/cas/relatorios/escritorios` | GET | Relatório por escritórios (cálculo legado) |
| `/api/cas/relatorios/profissionais` | GET | Relatório por profissionais (cálculo legado) |
| `/api/cas/relatorios/geral` | GET | Relatório geral |
| `/api/cas/relatorios/entidades` | GET | Listas de entidades para filtros |

---

## Banco de Dados — Modelos Prisma

### Tabelas Principais

| Modelo | Tabela | Descrição |
|---|---|---|
| `Empresa` | `empresas` | Empresas parceiras (incluindo campo `construtora`) |
| `Escritorio` | `escritorios` | Escritórios de arquitetura/decoração |
| `Profissional` | `profissionais` | Profissionais cadastrados |
| `Ponto` | `pontos` | Operações de pontuação (FK empresa) |
| `LogPonto` | `log_pontos` | Log de auditoria de edições/exclusões de pontos |
| `BonusMultiplier` | `bonus_multipliers` | Faixas de índice multiplicador |
| `Configuracao` | `configuracoes` | Configurações do sistema (chave-valor) |
| `LogConfiguracao` | `log_configuracoes` | Log de alterações de configuração |

### Tabelas de Conteúdo

| Modelo | Tabela | Descrição |
|---|---|---|
| `Noticia` | `noticias` | Notícias/matérias do site |
| `FotoNoticia` | `fotos_noticias` | Fotos das notícias |
| `Showroom` | `showroom` | Itens do showroom das empresas |
| `Promocao` | `promocao` | Promoções das empresas |
| `Informativo` | `mod_informativo` | Informativos |
| `InformativoFoto` | `mod_informativo_f` | Fotos dos informativos |
| `Indice` | `mod_indice` | Índice |

### Tabelas CAS

| Modelo | Tabela | Descrição |
|---|---|---|
| `CasUsuario` | `cas_usuarios` | Usuários administrativos |
| `CasModulo` | `cas_modulos` | Módulos do sistema |
| `CasAcessoMod` | `cas_acessos_mod` | Permissões (usuário⇔módulo) |
| `CasLogAcesso` | `cas_log_acessos` | Log de logins/logouts |

### Tabela bonus_multipliers (Índice Multiplicador)

Define as faixas de bônus por quantidade de empresas únicas atendidas por mês:

| range_min | range_max | multiplier | bonus_percent |
|---|---|---|---|
| 1 | 1 | 1.00 | 0 |
| 2 | 4 | 1.10 | 10 |
| 5 | 7 | 1.30 | 30 |
| 8 | 10 | 1.50 | 50 |
| 11 | 13 | 1.70 | 70 |
| 14 | 16 | 1.80 | 80 |
| 17 | 19 | 1.90 | 90 |
| 20 | NULL (∞) | 2.00 | 100 |

---

## Cálculo de Pontuação (Lógica Legada)

Os relatórios de **escritórios** e **profissionais** utilizam o algoritmo legado (migrado do PHP `ree2.mod.php`):

### Fluxo do Cálculo

1. **Filtrar operações** — apenas `ativo = 'a'`, ordenadas por `data ASC`
2. **Ajuste Construtora** — se a empresa é construtora (`construtora = 's'`), o valor é dividido por 4
3. **Rastreamento Mensal** — para cada operação, ao mudar de mês, resetam-se os contadores
4. **Contagem de Empresas Únicas** — a cada mudança de empresa dentro do mesmo mês, incrementa o contador
5. **Buscar Multiplicador** — consulta a tabela `bonus_multipliers` com base no número de empresas únicas do mês
6. **Aplicar Índice** — `valorComIndice = valorAcumuladoMensal × multiplicador`
7. **Calcular Pontos** — `pontos = valorComIndice / 100`

### Campos de Saída (por escritório/profissional)

- `totalValor` — soma bruta dos valores (com ajuste construtora /4)
- `totalValorComIndice` — soma com multiplicador aplicado
- `totalEmpresas` — total de empresas únicas atendidas
- `totalPontos` — pontuação final

---

## Exportação de Relatórios

Os relatórios podem ser exportados para **PDF** e **Excel** diretamente pelo navegador:

- **PDF** — gerado com `jsPDF` + `jspdf-autotable`, formato A4 landscape
- **Excel** — gerado com `xlsx` (SheetJS), colunas auto-dimensionadas

Ambos suportam modo **detalhado** (com operações individuais por entidade) e **simplificado** (apenas totais).

Funções disponíveis em `src/lib/exportRelatorios.ts`:
- `exportEmpresasPDF()` / `exportEmpresasXLS()`
- `exportEscritoriosPDF()` / `exportEscritoriosXLS()`
- `exportProfissionaisPDF()` / `exportProfissionaisXLS()`
- `exportGeralPDF()` / `exportGeralXLS()`

---

## Componentes

| Diretório | Componente | Descrição |
|---|---|---|
| `components/common/` | `SearchAutocomplete` | Busca global com autocomplete |
| `components/dashboard/` | `DashboardShell` | Shell de layout da área restrita |
| `components/empresas/` | `EmpresaCard` | Card de empresa |
| `components/forms/` | `CadastroEscritorio`, `CadastroProfissional`, `ContatoForm` | Formulários públicos |
| `components/home/` | `HeroSlider` | Carrossel hero da homepage |
| `components/layout/` | `Header`, `Footer`, `ScrollToTop` | Layout global |
| `components/noticias/` | `NoticiaCard` | Card de notícia |
| `components/providers/` | `AuthProvider` | Provider de sessão NextAuth |
| `components/ui/` | `Animations` | Utilidades de animação |

## Utilitários (`src/lib/`)

| Arquivo | Descrição |
|---|---|
| `auth.ts` | Configuração NextAuth (CredentialsProvider, JWT, roles) |
| `prisma.ts` | Singleton Prisma client (Neon serverless adapter) |
| `email.ts` | Envio de e-mails via Resend |
| `utils.ts` | Funções utilitárias (formatDate, formatCurrency, slugify, etc.) |
| `exportRelatorios.ts` | Exportação de relatórios para PDF e Excel |

---

## Segurança

- **Middleware** protege `/admin/*` e `/api/cas/*` — requer role `admin` ou `user`
- **Área Restrita** protege `/area-restrita/*` — requer qualquer sessão autenticada
- Autenticação via **NextAuth.js** com estratégia JWT
- Senhas com hash **bcrypt**
- Roles: `empresa`, `escritorio`, `profissional`, `admin`, `user`
- Log de auditoria para edição/exclusão de pontos (`log_pontos`)
- Log de acessos CAS com IP

---

## Deploy na Vercel

1. Conecte o repositório `ValdirGR/clubecda` na Vercel
2. Configure as variáveis de ambiente
3. Build automático a cada push na branch `main`
4. Banco de dados: Neon PostgreSQL (sa-east-1)

---

## Scripts NPM

```bash
npm run dev        # Desenvolvimento local
npm run build      # Build de produção
npm run start      # Iniciar servidor de produção
npm run lint       # Linting (ESLint)
npm run db:push    # Sincronizar schema com o banco
npm run db:pull    # Introspectar banco → schema
npm run db:studio  # Abrir Prisma Studio (GUI)
npm run db:generate # Gerar Prisma Client
```
