/**
 * MySQL to PostgreSQL Import Script
 * 
 * Converts MySQL dump (phpMyAdmin format) to PostgreSQL-compatible SQL
 * for importing into Neon database.
 * 
 * Usage:
 *   node scripts/import-mysql-to-pg.js
 *   npx prisma db execute --file backup/bancodedados/import_pg.sql --schema prisma/schema.prisma
 */

const fs = require('fs');
const path = require('path');

const DUMP_FILE = path.join(__dirname, '..', 'backup', 'bancodedados', 'clubecda_2013.sql');
const OUTPUT_FILE = path.join(__dirname, '..', 'backup', 'bancodedados', 'import_pg.sql');

// Tables to import, ordered by FK dependencies (parents before children)
const IMPORT_ORDER = [
  // No FK dependencies
  'empresas',
  'escritorios',
  'profissionais',
  'noticias',
  'cas_usuarios',
  'cas_modulos',
  'mod_indice',
  'mod_informativo',
  // FK dependencies (depend on tables above)
  'pontos',          // → empresas
  'showroom',        // → empresas
  'promocao',        // → empresas
  'fotos_noticias',  // → noticias
  'mod_informativo_f', // → mod_informativo
  'cas_acessos_mod', // → cas_usuarios, cas_modulos
];

// Skip cas_log_acessos: MySQL has log_acesso_usuario as VARCHAR (user name),
// but Prisma expects Int (FK to cas_usuarios). Incompatible data types.

const RELEVANT_TABLES = new Set(IMPORT_ORDER);

// Sequence reset config: [table, column]
const SEQUENCE_RESETS = [
  ['empresas', 'id'],
  ['escritorios', 'id'],
  ['profissionais', 'id'],
  ['noticias', 'id'],
  ['cas_usuarios', 'usuario_id'],
  ['cas_modulos', 'modulo_id'],
  ['mod_indice', 'id_indice'],
  ['mod_informativo', 'id_informativo'],
  ['pontos', 'id'],
  ['showroom', 'id'],
  ['promocao', 'id'],
  ['fotos_noticias', 'id'],
  ['mod_informativo_f', 'id_informativo_f'],
  // cas_acessos_mod has composite PK, no sequence
];

console.log('Reading MySQL dump file...');
const content = fs.readFileSync(DUMP_FILE, 'utf8');
const lines = content.split('\n');
console.log(`  Total lines: ${lines.length}`);

// -------------------------------------------------------
// Step 1: Collect INSERT blocks per table
// -------------------------------------------------------
const insertBlocks = {};
for (const table of IMPORT_ORDER) {
  insertBlocks[table] = [];
}

let currentTable = null;
let collecting = false;
let currentBlock = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Check for INSERT INTO statement
  const match = line.match(/^INSERT INTO `(\w+)`/);
  if (match) {
    const tableName = match[1];
    if (RELEVANT_TABLES.has(tableName)) {
      currentTable = tableName;
      collecting = true;
      currentBlock = [line];
      
      // Check if single-line INSERT (ends with ;)
      if (line.trimEnd().endsWith(';')) {
        insertBlocks[currentTable].push(currentBlock.join('\n'));
        collecting = false;
        currentTable = null;
        currentBlock = [];
      }
    } else {
      collecting = false;
      currentTable = null;
    }
    continue;
  }
  
  if (collecting) {
    currentBlock.push(line);
    if (line.trimEnd().endsWith(';')) {
      insertBlocks[currentTable].push(currentBlock.join('\n'));
      collecting = false;
      currentTable = null;
      currentBlock = [];
    }
  }
}

// -------------------------------------------------------
// Step 2: Build output SQL
// -------------------------------------------------------
const output = [];

output.push('-- ============================================================');
output.push('-- PostgreSQL Import from MySQL Dump');
output.push('-- Source: clubecda_2013.sql (phpMyAdmin export)');
output.push('-- Generated: ' + new Date().toISOString());
output.push('-- ============================================================');
output.push('');

// Truncate all tables first (reverse FK order) to handle re-runs
output.push('-- Truncate all tables (handles re-runs safely)');
output.push('TRUNCATE TABLE "cas_acessos_mod", "mod_informativo_f", "fotos_noticias", "pontos", "showroom", "promocao", "mod_informativo", "mod_indice", "cas_modulos", "cas_usuarios", "noticias", "profissionais", "escritorios", "empresas" CASCADE;');
output.push('');

// Disable FK checks for import (handles orphaned refs)
output.push('-- Temporarily drop FK constraints for import');
output.push('ALTER TABLE "fotos_noticias" DROP CONSTRAINT IF EXISTS "fotos_noticias_id_evento_fkey";');
output.push('ALTER TABLE "pontos" DROP CONSTRAINT IF EXISTS "pontos_id_empresa_fkey";');
output.push('ALTER TABLE "showroom" DROP CONSTRAINT IF EXISTS "showroom_empresa_fkey";');
output.push('ALTER TABLE "promocao" DROP CONSTRAINT IF EXISTS "promocao_empresa_fkey";');
output.push('ALTER TABLE "mod_informativo_f" DROP CONSTRAINT IF EXISTS "mod_informativo_f_id_informativo_fkey";');
output.push('ALTER TABLE "cas_acessos_mod" DROP CONSTRAINT IF EXISTS "cas_acessos_mod_usuario_id_fkey";');
output.push('ALTER TABLE "cas_acessos_mod" DROP CONSTRAINT IF EXISTS "cas_acessos_mod_modulo_id_fkey";');
output.push('');

// Pre-import: add temporary columns that exist in MySQL but not in Prisma schema
output.push('-- Pre-import: add temporary columns for MySQL-only fields');
output.push('ALTER TABLE "noticias" ADD COLUMN IF NOT EXISTS "foto" VARCHAR(255);');
output.push('ALTER TABLE "escritorios" ADD COLUMN IF NOT EXISTS "datacadastro" TIMESTAMP;');
output.push('ALTER TABLE "profissionais" ADD COLUMN IF NOT EXISTS "datacadastro" TIMESTAMP;');
output.push('');

// Process each table in FK-dependency order
for (const table of IMPORT_ORDER) {
  const blocks = insertBlocks[table];
  if (blocks.length === 0) {
    output.push(`-- Table: ${table} — no data found in dump`);
    output.push('');
    continue;
  }
  
  output.push(`-- ============================================================`);
  output.push(`-- Table: ${table} (${blocks.length} INSERT block(s))`);
  output.push(`-- ============================================================`);
  
  for (let block of blocks) {
    block = convertBlock(table, block);
    output.push(block);
    output.push('');
  }
}

// Post-import: drop temporary columns
output.push('-- ============================================================');
output.push('-- Post-import: drop temporary columns');
output.push('-- ============================================================');
output.push('ALTER TABLE "noticias" DROP COLUMN IF EXISTS "foto";');
output.push('ALTER TABLE "escritorios" DROP COLUMN IF EXISTS "datacadastro";');
output.push('ALTER TABLE "profissionais" DROP COLUMN IF EXISTS "datacadastro";');
output.push('');

// Re-enable FK constraints (Prisma db push will restore them)
output.push('-- Note: Run "npx prisma db push" after import to restore FK constraints');
output.push('');

// Reset sequences to max(id) + 1
output.push('-- ============================================================');
output.push('-- Reset sequences (so new inserts get correct IDs)');
output.push('-- ============================================================');
for (const [table, col] of SEQUENCE_RESETS) {
  output.push(
    `SELECT setval(pg_get_serial_sequence('${table}', '${col}'), ` +
    `COALESCE((SELECT MAX("${col}") FROM "${table}"), 0) + 1, false);`
  );
}

// -------------------------------------------------------
// Step 3: Write output
// -------------------------------------------------------
const outputContent = output.join('\n');
fs.writeFileSync(OUTPUT_FILE, outputContent, 'utf8');

console.log('');
console.log(`Output written to: ${OUTPUT_FILE}`);
console.log(`Output size: ${(outputContent.length / 1024).toFixed(1)} KB`);
console.log('');
console.log('Table summary:');
for (const table of IMPORT_ORDER) {
  const count = insertBlocks[table].length;
  console.log(`  ${table}: ${count} block(s)${count === 0 ? ' (no data)' : ''}`);
}
console.log('');
console.log('Skipped tables:');
console.log('  cas_log_acessos: incompatible data types (VARCHAR → INT FK)');
console.log('  admin, artigos, cidade, estados, fotos_artigos, etc: not in Prisma schema');
console.log('');
console.log('Next step:');
console.log('  npx prisma db execute --file backup/bancodedados/import_pg.sql --schema prisma/schema.prisma');

// -------------------------------------------------------
// Conversion Functions
// -------------------------------------------------------

function convertBlock(table, block) {
  if (table === 'cas_acessos_mod') {
    return convertCasAcessosMod(block);
  }
  
  // General conversion: remove backticks + fix escaping
  block = removeBackticks(block);
  block = convertEscaping(block);
  
  return block;
}

function convertCasAcessosMod(block) {
  // Special handling: remove acesso_mod_id column (not in Prisma composite PK)
  
  // 1. Rewrite column list
  block = block.replace(
    /INSERT INTO `cas_acessos_mod` \(`acesso_mod_id`, `usuario_id`, `modulo_id`, `acesso_atualizacao`\)/g,
    'INSERT INTO "cas_acessos_mod" ("usuario_id", "modulo_id", "acesso_atualizacao")'
  );
  
  // 2. Remove first value (acesso_mod_id) from each tuple
  // Tuples are like: (123, 2, 5, '2013-04-25 00:07:13')
  // Need to become:  (2, 5, '2013-04-25 00:07:13')
  block = block.replace(/\((\d+),\s*/g, '(');
  
  // 3. Add ON CONFLICT for composite PK
  block = block.replace(/;\s*$/, '\nON CONFLICT ("usuario_id", "modulo_id") DO NOTHING;');
  
  // 4. Remove any remaining backticks and fix escaping
  block = removeBackticks(block);
  block = convertEscaping(block);
  
  return block;
}

function removeBackticks(sql) {
  // Replace MySQL backticks with PostgreSQL double quotes for identifiers
  // This safely handles reserved words like "user"
  return sql.replace(/`/g, '"');
}

function convertEscaping(sql) {
  // Convert MySQL string escaping to PostgreSQL standard SQL
  // 
  // MySQL escape sequences inside strings:
  //   \\  → literal backslash
  //   \'  → literal single quote
  //   \"  → literal double quote
  //   \r  → carriage return
  //   \n  → newline
  //   \t  → tab
  //
  // PostgreSQL standard SQL (standard_conforming_strings = ON):
  //   ''  → literal single quote
  //   \   → literal backslash (no special meaning)
  //
  // Conversion:
  //   \\ → \ (one backslash stored)
  //   \' → '' (escaped single quote)
  //   \" → " (double quote, no escaping needed)
  //   \r, \n, \t → kept as-is (stored as literal \r, \n, \t — fine for HTML)
  
  // Step 1: Replace \\ with placeholder (to avoid interference with other replacements)
  sql = sql.replace(/\\\\/g, '<<<BKSLASH>>>');
  
  // Step 2: Replace \' with '' (PostgreSQL single-quote escaping)
  sql = sql.replace(/\\'/g, "''");
  
  // Step 3: Replace \" with " (no escaping needed in PG strings)
  sql = sql.replace(/\\"/g, '"');
  
  // Step 4: Replace placeholder back with single backslash
  sql = sql.replace(/<<<BKSLASH>>>/g, '\\');
  
  return sql;
}
