# CAS - Centro de Administração do Site

## Visão Geral

O **CAS** é o módulo administrativo do Clube CDA (Clube da Decoração e Arquitetura). Originalmente desenvolvido em PHP, foi migrado para Next.js 14 com Prisma ORM mantendo todas as funcionalidades originais.

O CAS provê:
- **Gerenciamento de Usuários** — CRUD completo de administradores e usuários do sistema
- **Controle de Acessos** — Permissões por módulo (quem pode acessar o quê)
- **Log de Acessos** — Registro de login/logout com IP e horários
- **Relatórios** — Relatórios detalhados e simplificados por Empresa, Escritório, Profissional e Geral
- **Exportação** — PDF (jsPDF) e Excel (xlsx/SheetJS) para todos os tipos de relatório
- **Cálculo Legado** — Algoritmo de pontuação migrado do PHP com construtora /4, índice mensal, e multiplicador dinâmico

---

## Tabelas do Banco de Dados

### `cas_usuarios`
| Coluna         | Tipo          | Descrição                          |
|----------------|---------------|------------------------------------|
| usuario_id     | INT PK AI     | ID do usuário                      |
| usuario_nome   | VARCHAR(255)  | Nome completo                      |
| usuario_user   | VARCHAR(100)  | Login de acesso                    |
| usuario_senha  | VARCHAR(255)  | Senha (hash bcrypt)                |
| usuario_tipo   | VARCHAR(10)   | Tipo: "admin" ou "user"            |

### `cas_modulos`
| Coluna              | Tipo          | Descrição                      |
|---------------------|---------------|--------------------------------|
| modulo_id           | INT PK AI     | ID do módulo                   |
| modulo_nome         | VARCHAR(255)  | Nome do módulo                 |
| modulo_nivel        | VARCHAR(10)   | Nível: "admin" ou "user"       |
| modulo_atualizacao  | DATETIME      | Data de atualização            |

> **Nota:** A tabela `cas_modulos` contém registros duplicados (herança da migração MySQL). A deduplicação é feita na API (`/api/cas/modulos`) usando um Map por `nome+nível`, não no banco de dados.

### `cas_acessos_mod`
| Coluna              | Tipo     | Descrição                           |
|---------------------|----------|-------------------------------------|
| usuario_id          | INT FK   | Referência ao usuário               |
| modulo_id           | INT FK   | Referência ao módulo                |
| acesso_atualizacao  | DATETIME | Data de concessão do acesso         |

> **Chave primária composta:** `[usuario_id, modulo_id]`

### `cas_log_acessos`
| Coluna              | Tipo          | Descrição                      |
|---------------------|---------------|--------------------------------|
| log_acesso_id       | INT PK AI     | ID do registro de log          |
| log_acesso_usuario  | INT FK        | ID do usuário (FK cas_usuarios)|
| log_acesso_login    | DATETIME      | Data/hora do login             |
| log_acesso_logout   | DATETIME      | Data/hora do logout            |
| log_acesso_IP       | VARCHAR(45)   | Endereço IP do acesso          |

### `bonus_multipliers` (Índice Multiplicador)
| Coluna         | Tipo           | Descrição                                |
|----------------|----------------|------------------------------------------|
| id             | INT PK AI      | ID da faixa                              |
| range_min      | INT            | Mínimo de empresas únicas no mês         |
| range_max      | INT NULL       | Máximo (NULL = sem limite superior, ex: 20+) |
| multiplier     | DECIMAL(4,2)   | Fator multiplicador (ex: 1.30)           |
| bonus_percent  | INT            | Percentual de bônus (ex: 30)             |

**Dados atuais:**

| range_min | range_max | multiplier | bonus_percent |
|-----------|-----------|------------|---------------|
| 1         | 1         | 1.00       | 0             |
| 2         | 4         | 1.10       | 10            |
| 5         | 7         | 1.30       | 30            |
| 8         | 10        | 1.50       | 50            |
| 11        | 13        | 1.70       | 70            |
| 14        | 16        | 1.80       | 80            |
| 17        | 19        | 1.90       | 90            |
| 20        | NULL      | 2.00       | 100           |

---

## Módulos do CAS

### 1. Gestão de Usuários (`/admin/cas/usuarios`)

**Funcionalidades:**
- Listar todos os usuários do CAS com busca e paginação
- Criar novo usuário (nome, login, senha, permissões)
- Editar usuário existente (alterar dados e permissões)
- Excluir usuário (remove permissões e o registro)

**Regras de Negócio:**
- Apenas usuários `admin` veem todos os usuários
- Usuários `user` veem apenas outros usuários do tipo `user`
- Login (usuario_user) deve ser único
- Ao deletar um usuário, suas permissões são deletadas em cascata
- Permissões são definidas por checkboxes de módulos disponíveis
- Módulos são matchados por nome (não por ID) para lidar com duplicatas

### 2. Controle de Permissões/Acessos

**Módulos Disponíveis (nível "user"):**
- Notícias, Empresas, Escritórios, Profissionais, Pontos, Relatórios
- Destaque (Banners), Clube, Fidelidade, Informativo, Índice, Baixa

**Módulos Disponíveis (nível "admin"):**
- Usuários do Sistema

**Lógica:**
- Superusuário (`admin`) tem acesso a todos os módulos automaticamente
- Usuários regulares (`user`) acessam apenas os módulos permitidos em `cas_acessos_mod`

### 3. Log de Acessos (`/admin/cas/acessos`)

**Funcionalidades:**
- Visualizar histórico completo de logins/logouts
- Informações: nome do usuário, data/hora login, data/hora logout, IP
- Filtragem por período e usuário

### 4. Relatórios (`/admin/cas/relatorios`)

**Funcionalidades gerais:**
- 4 tipos de relatório: Empresas, Escritórios, Profissionais, Geral
- 2 níveis de detalhe: Detalhado (com operações) e Simplificado (apenas totais)
- Ordenação por nome, valor ou pontos (colunas clicáveis com ícones de seta)
- Expansão de linhas (modo detalhado) para ver operações individuais
- **Exportação para PDF** (botão vermelho) — formato A4 landscape
- **Exportação para Excel** (botão verde) — arquivo .xlsx com colunas auto-dimensionadas
- Filtro por entidade individual ou todas
- Filtro por período (data início/fim)

#### 4.1 Relatório por Empresas
- **Colunas:** Empresa | Valor (R$) | Pontos | Pagamento
- **Pagamento:** 0,15% sobre excedente de R$ 100.000, mínimo R$ 500
- **Detalhes expandidos:** ID operação, data, profissional/escritório, tipo, valor, pontos

#### 4.2 Relatório por Escritórios (Cálculo Legado)
- **Colunas:** Escritório | Valor (R$) | Valor + % | Empresas | Pontos
- **Algoritmo legado** (migrado de `ree2.mod.php`):
  1. Filtra operações `ativo = 'a'`, `tipo = '2'`, ordena por `data ASC`
  2. Construtora → valor / 4
  3. Rastreamento mensal de empresas únicas
  4. Multiplicador dinâmico da tabela `bonus_multipliers`
  5. `valorComIndice = valorAcumulado × multiplicador`
  6. `pontos = valorComIndice / 100`
- **Detalhes expandidos:** ID, data, empresa (com badge CONSTRUTORA amarelo), valor ajustado (original riscado se construtora)

#### 4.3 Relatório por Profissionais (Cálculo Legado)
- **Colunas:** Profissional | Valor (R$) | Valor + % | Empresas | Pontos
- **Mesmo algoritmo legado** dos escritórios, mas filtra `tipo IN ('1', 'PR')`
- **Detalhes expandidos:** Igual ao de escritórios (badge CONSTRUTORA + valor ajustado)

#### 4.4 Relatório Geral
- **Colunas:** ID | Data | Empresa | Profissional/Escritório | Tipo | Valor | Pontos
- Exibe todas as operações do período sem agrupamento

### 5. Bônus Multiplicadores (`/admin/bonus-multipliers`)

**Funcionalidades:**
- Tabela editável inline com todos os campos (mín, máx, multiplicador, bônus %)
- Indicador visual de "Alterações não salvas" com opção de descartar
- Adicionar nova faixa via formulário inline
- Excluir faixa com confirmação
- Salvar em batch (transação atômica no servidor)
- Box informativo explicando o funcionamento do índice

**API:**
| Rota | Método | Descrição |
|---|---|---|
| `/api/admin/bonus-multipliers` | GET | Listar faixas |
| `/api/admin/bonus-multipliers` | PUT | Atualizar todas em batch |
| `/api/admin/bonus-multipliers` | POST | Adicionar nova faixa |
| `/api/admin/bonus-multipliers/[id]` | DELETE | Excluir faixa |

---

## Rotas da Aplicação

### Páginas (Frontend)
| Rota                          | Descrição                        |
|-------------------------------|----------------------------------|
| `/admin/cas`                  | Dashboard CAS                    |
| `/admin/cas/usuarios`         | Gestão de Usuários               |
| `/admin/cas/acessos`          | Log de Acessos                   |
| `/admin/cas/relatorios`       | Central de Relatórios            |
| `/admin/bonus-multipliers`    | Bônus Multiplicadores            |

### API Routes (Backend)
| Rota                                    | Método | Descrição                      |
|-----------------------------------------|--------|--------------------------------|
| `/api/cas/usuarios`                     | GET    | Listar usuários                |
| `/api/cas/usuarios`                     | POST   | Criar usuário                  |
| `/api/cas/usuarios/[id]`               | GET    | Obter usuário individual       |
| `/api/cas/usuarios/[id]`               | PUT    | Editar usuário                 |
| `/api/cas/usuarios/[id]`               | DELETE | Excluir usuário                |
| `/api/cas/modulos`                      | GET    | Listar módulos (deduplicados)  |
| `/api/cas/acessos`                      | GET    | Listar logs de acesso          |
| `/api/cas/configuracoes`               | GET    | Obter configurações            |
| `/api/cas/configuracoes`               | PUT    | Atualizar configurações        |
| `/api/cas/configuracoes/logs`          | GET    | Log de alterações config       |
| `/api/cas/relatorios/empresas`         | GET    | Relatório por empresas         |
| `/api/cas/relatorios/escritorios`      | GET    | Relatório por escritórios      |
| `/api/cas/relatorios/profissionais`    | GET    | Relatório por profissionais    |
| `/api/cas/relatorios/geral`            | GET    | Relatório geral                |
| `/api/cas/relatorios/entidades`        | GET    | Listas de entidades para filtros|
| `/api/admin/bonus-multipliers`         | GET    | Listar multiplicadores         |
| `/api/admin/bonus-multipliers`         | PUT    | Atualizar multiplicadores      |
| `/api/admin/bonus-multipliers`         | POST   | Criar multiplicador            |
| `/api/admin/bonus-multipliers/[id]`    | DELETE | Excluir multiplicador          |

---

## Exportação de Relatórios

### PDF (jsPDF + jspdf-autotable)
- Formato A4 landscape
- Cabeçalho: "CDA - Clube dos Arquitetos", título do relatório, período, data/hora de geração
- Tabelas com tema striped, cabeçalhos coloridos
- Modo detalhado: uma seção por entidade com subtotais
- Modo simplificado: tabela única resumida
- Footer com totais gerais

### Excel (xlsx / SheetJS)
- Arquivo .xlsx
- Colunas auto-dimensionadas
- Subtotais por entidade + total geral
- Modo detalhado: operações individuais agrupadas
- Modo simplificado: uma linha por entidade

### Funções (`src/lib/exportRelatorios.ts`)
| Função | Descrição |
|---|---|
| `exportEmpresasPDF()` | PDF de empresas |
| `exportEmpresasXLS()` | Excel de empresas |
| `exportEscritoriosPDF()` | PDF de escritórios (inclui construtora) |
| `exportEscritoriosXLS()` | Excel de escritórios (inclui construtora) |
| `exportProfissionaisPDF()` | PDF de profissionais (inclui construtora) |
| `exportProfissionaisXLS()` | Excel de profissionais (inclui construtora) |
| `exportGeralPDF()` | PDF geral |
| `exportGeralXLS()` | Excel geral |

---

## Segurança

- Acesso ao CAS requer autenticação via NextAuth.js
- Apenas roles `admin` e `user` podem acessar o CAS
- Middleware protege todas as rotas `/admin/*` e `/api/cas/*`
- Senhas armazenadas com hash bcrypt
- Logs de acesso registram IP para auditoria
- Log de auditoria para edição/exclusão de pontos (tabela `log_pontos`)
- API de multiplicadores protegida por sessão admin/user

---

## Migração do PHP

| PHP Original                     | Next.js                                    |
|----------------------------------|--------------------------------------------|
| `cas/index.php`                  | `/admin/cas/page.tsx`                      |
| `cas/login.php` + `protege.php`  | NextAuth.js + Middleware                   |
| `modulos/sistema/usuarios/`      | `/admin/cas/usuarios/`                     |
| `modulos/relatorios/`            | `/admin/cas/relatorios/`                   |
| `modulos/presidencia/ree2.mod.php` | Lógica em `relatorios/escritorios/route.ts` |
| `cas_log_acessos` direto         | `/admin/cas/acessos/`                      |
| `includes/funcoes_cas.php`       | Lógica distribuída em API routes           |
| `includes/conf_cas.php`          | Configuração no `.env` + Prisma            |
| MySQL direto (`fbd()`)           | Prisma ORM                                 |
| Índice hardcoded em PHP          | Tabela dinâmica `bonus_multipliers` + admin CRUD |

---

## Notas Técnicas

- **Prisma 6** não suporta `mode: 'insensitive'` — buscas case-insensitive usam raw SQL `ILIKE`
- No modelo `Ponto`, `id_profissional` armazena o ID do profissional (tipo '1'/'PR') OU do escritório (tipo '2')
- A deduplicação de `cas_modulos` (41 duplicatas por módulo) é feita na API, não no banco
- O rastreamento `$mesmo_mes` do PHP depende dos dados ordenados `ASC` por data
- O rastreamento `$mesma_empresa` conta mudanças sequenciais (se A→B→A no mesmo mês, conta 3, não 2)
