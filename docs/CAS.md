# CAS - Centro de Administração do Site

## Visão Geral

O **CAS** é o módulo administrativo do Clube CDA (Clube da Decoração e Arquitetura). Originalmente desenvolvido em PHP, foi migrado para Next.js 14 com Prisma ORM mantendo todas as funcionalidades originais.

O CAS provê:
- **Gerenciamento de Usuários** — CRUD completo de administradores e usuários do sistema
- **Controle de Acessos** — Permissões por módulo (quem pode acessar o quê)
- **Log de Acessos** — Registro de login/logout com IP e horários
- **Relatórios** — Relatórios detalhados e simplificados por Empresa, Escritório, Profissional e Geral

---

## Tabelas do Banco de Dados

### `cas_usuarios`
| Coluna         | Tipo          | Descrição                          |
|----------------|---------------|------------------------------------|
| usuario_id     | INT PK AI     | ID do usuário                      |
| usuario_nome   | VARCHAR(255)  | Nome completo                      |
| usuario_user   | VARCHAR(100)  | Login de acesso                    |
| usuario_senha  | VARCHAR(255)  | Senha (hash)                       |
| usuario_tipo   | VARCHAR(10)   | Tipo: "admin" ou "user"            |

### `cas_modulos`
| Coluna              | Tipo          | Descrição                      |
|---------------------|---------------|--------------------------------|
| modulo_id           | INT PK AI     | ID do módulo                   |
| modulo_nome         | VARCHAR(255)  | Nome do módulo                 |
| modulo_nivel        | VARCHAR(10)   | Nível: "admin" ou "user"       |
| modulo_atualizacao  | DATETIME      | Data de atualização            |

### `cas_acessos_mod`
| Coluna              | Tipo     | Descrição                           |
|---------------------|----------|-------------------------------------|
| usuario_id          | INT FK   | Referência ao usuário               |
| modulo_id           | INT FK   | Referência ao módulo                |
| acesso_atualizacao  | DATETIME | Data de concessão do acesso         |

### `cas_log_acessos`
| Coluna              | Tipo          | Descrição                      |
|---------------------|---------------|--------------------------------|
| log_acesso_id       | INT PK AI     | ID do registro de log          |
| log_acesso_usuario  | INT FK        | ID do usuário (FK cas_usuarios)|
| log_acesso_login    | DATETIME      | Data/hora do login             |
| log_acesso_logout   | DATETIME      | Data/hora do logout            |
| log_acesso_IP       | VARCHAR(45)   | Endereço IP do acesso          |

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

**Tipos de Relatório:**

#### 4.1 Relatório por Empresas (Detalhado)
- Filtros: Empresa (individual ou todas), Período (data início/fim)
- Dados: ID operação, data, profissional/escritório, valor (R$), pontos, nota
- Cálculo de pagamento: 0,15% sobre excedente de R$ 100.000, mínimo R$ 500

#### 4.2 Relatório por Empresas (Simplificado)
- Mesmos filtros, exibe apenas resumo: valor total, pontos total, pagamento
- Modo "Todas": agrupa por empresa com ranking por pontos

#### 4.3 Relatório por Escritórios (Detalhado)
- Filtros: Escritório (individual ou todos), Período
- Dados: operações vinculadas, empresa de origem, valor, pontos

#### 4.4 Relatório por Escritórios (Simplificado)
- Apenas totais por escritório

#### 4.5 Relatório por Profissionais (Detalhado)
- Filtros: Profissional (individual ou todos), Período
- Dados: operações vinculadas, empresa de origem, valor, pontos

#### 4.6 Relatório por Profissionais (Simplificado)
- Apenas totais por profissional

#### 4.7 Relatório Geral
- Filtro: Somente período (data início/fim)
- Exibe todas as operações no período com todos os campos

---

## Rotas da Aplicação

### Páginas (Frontend)
| Rota                          | Descrição                        |
|-------------------------------|----------------------------------|
| `/admin/cas`                  | Dashboard CAS                    |
| `/admin/cas/usuarios`         | Gestão de Usuários               |
| `/admin/cas/acessos`          | Log de Acessos                   |
| `/admin/cas/relatorios`       | Central de Relatórios            |

### API Routes (Backend)
| Rota                          | Método | Descrição                      |
|-------------------------------|--------|--------------------------------|
| `/api/cas/usuarios`           | GET    | Listar usuários                |
| `/api/cas/usuarios`           | POST   | Criar usuário                  |
| `/api/cas/usuarios/[id]`      | PUT    | Editar usuário                 |
| `/api/cas/usuarios/[id]`      | DELETE | Excluir usuário                |
| `/api/cas/acessos`            | GET    | Listar logs de acesso          |
| `/api/cas/relatorios/empresas`| GET    | Relatório por empresas         |
| `/api/cas/relatorios/escritorios` | GET | Relatório por escritórios   |
| `/api/cas/relatorios/profissionais` | GET | Relatório por profissionais|
| `/api/cas/relatorios/geral`   | GET    | Relatório geral                |

---

## Segurança

- Acesso ao CAS requer autenticação via NextAuth.js
- Apenas roles `admin` e `user` podem acessar o CAS
- Middleware protege todas as rotas `/admin/*`
- Senhas armazenadas com hash (bcrypt na versão Next.js)
- Logs de acesso registram IP para auditoria

---

## Migração do PHP

| PHP Original                     | Next.js                          |
|----------------------------------|----------------------------------|
| `cas/index.php`                  | `/admin/cas/page.tsx`            |
| `cas/login.php` + `protege.php`  | NextAuth.js + Middleware         |
| `modulos/sistema/usuarios/`      | `/admin/cas/usuarios/`           |
| `modulos/relatorios/`            | `/admin/cas/relatorios/`         |
| `cas_log_acessos` direto         | `/admin/cas/acessos/`            |
| `includes/funcoes_cas.php`       | Lógica distribuída em API routes |
| `includes/conf_cas.php`          | Configuração no `.env` + Prisma  |
| MySQL direto (`fbd()`)           | Prisma ORM                       |
