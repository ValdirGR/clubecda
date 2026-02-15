import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// ========== Tipos ==========

interface Operacao {
  id: number;
  data: string;
  empresaId: number;
  empresaNome: string;
  profissionalNome?: string;
  tipo?: string;
  valor: number;
  valorAjustado?: number;
  construtora?: boolean;
  pontos: number;
  nota?: string;
}

interface EmpresaRelatorio {
  empresaId: number;
  empresaNome: string;
  totalValor: number;
  totalPontos: number;
  pagamento: number;
  operacoes: Operacao[];
}

interface EscritorioRelatorio {
  escritorioId: number;
  escritorioNome: string;
  nomeFantasia?: string;
  totalValor: number;
  totalValorComIndice: number;
  totalEmpresas: number;
  totalPontos: number;
  operacoes: Operacao[];
}

interface ProfissionalRelatorio {
  profissionalId: number;
  profissionalNome: string;
  totalValor: number;
  totalValorComIndice: number;
  totalEmpresas: number;
  totalPontos: number;
  operacoes: Operacao[];
}

interface ResultadoRelatorio {
  empresas?: EmpresaRelatorio[];
  escritorios?: EscritorioRelatorio[];
  profissionais?: ProfissionalRelatorio[];
  operacoes?: Operacao[];
  totalGeral?: {
    valor: number;
    valorComIndice?: number;
    empresas?: number;
    pontos: number;
    pagamento?: number;
    registros?: number;
  };
}

// ========== Helpers ==========

const fmtCurrency = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const fmtNumber = (v: number) => v.toLocaleString('pt-BR');

const fmtDate = (d: string) => {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('pt-BR');
};

function getFileName(tipo: string, periodo: string) {
  const now = new Date().toISOString().slice(0, 10);
  return `relatorio_${tipo}_${periodo}_${now}`;
}

// ========== PDF Export ==========

function createPdfDoc(titulo: string, periodo: string) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  
  // Header
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('CDA - Clube dos Arquitetos', 14, 15);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(titulo, 14, 22);
  
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`Período: ${periodo}`, 14, 28);
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`, 14, 33);
  doc.setTextColor(0);
  
  return doc;
}

export function exportEmpresasPDF(
  data: ResultadoRelatorio,
  periodo: string,
  detalhado: boolean
) {
  const doc = createPdfDoc('Relatório por Empresas', periodo);
  const empresas = data.empresas || [];

  if (detalhado) {
    // Detalhado: cada empresa com suas operações
    let startY = 38;
    empresas.forEach((emp) => {
      // Empresa header
      const rows: (string | number)[][] = [];
      emp.operacoes.forEach((op) => {
        rows.push([
          op.id,
          fmtDate(op.data),
          op.profissionalNome || '-',
          op.tipo || '-',
          fmtCurrency(op.valor),
          op.pontos,
        ]);
      });

      autoTable(doc, {
        startY,
        head: [[{ content: `${emp.empresaNome} (#${emp.empresaId})`, colSpan: 6, styles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' } }]],
        body: [],
        theme: 'grid',
        margin: { left: 14 },
      });

      startY = (doc as any).lastAutoTable.finalY;

      autoTable(doc, {
        startY,
        head: [['ID', 'Data', 'Profissional', 'Tipo', 'Valor', 'Pontos']],
        body: rows,
        foot: [['', '', '', 'SUBTOTAL', fmtCurrency(emp.totalValor), fmtNumber(emp.totalPontos)]],
        theme: 'striped',
        headStyles: { fillColor: [52, 73, 94], fontSize: 8 },
        bodyStyles: { fontSize: 7 },
        footStyles: { fillColor: [236, 240, 241], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 8 },
        margin: { left: 14 },
      });

      startY = (doc as any).lastAutoTable.finalY + 4;
      if (startY > 180) {
        doc.addPage();
        startY = 15;
      }
    });
  } else {
    // Simplificado
    const rows = empresas.map((emp) => [
      emp.empresaId,
      emp.empresaNome,
      fmtCurrency(emp.totalValor),
      fmtNumber(emp.totalPontos),
      fmtCurrency(emp.pagamento),
    ]);

    autoTable(doc, {
      startY: 38,
      head: [['ID', 'Empresa', 'Valor (R$)', 'Pontos', 'Pagamento']],
      body: rows,
      foot: [['', 'TOTAL GERAL', fmtCurrency(data.totalGeral?.valor || 0), fmtNumber(data.totalGeral?.pontos || 0), fmtCurrency(data.totalGeral?.pagamento || 0)]],
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185] },
      footStyles: { fillColor: [236, 240, 241], textColor: [0, 0, 0], fontStyle: 'bold' },
      margin: { left: 14 },
    });
  }

  doc.save(getFileName('empresas', periodo) + '.pdf');
}

export function exportEscritoriosPDF(
  data: ResultadoRelatorio,
  periodo: string,
  detalhado: boolean
) {
  const doc = createPdfDoc('Relatório por Escritórios', periodo);
  const escritorios = data.escritorios || [];

  if (detalhado) {
    let startY = 38;
    escritorios.forEach((esc) => {
      const rows: (string | number)[][] = [];
      esc.operacoes.forEach((op: any) => {
        const valorExibir = op.construtora ? `${fmtCurrency(op.valorAjustado ?? op.valor)} (orig: ${fmtCurrency(op.valor)})` : fmtCurrency(op.valor);
        rows.push([
          op.id,
          fmtDate(op.data),
          op.empresaNome + (op.construtora ? ' [CONSTRUTORA]' : ''),
          valorExibir,
        ]);
      });

      autoTable(doc, {
        startY,
        head: [[{ content: `${esc.escritorioNome} (#${esc.escritorioId})`, colSpan: 4, styles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' } }]],
        body: [],
        theme: 'grid',
        margin: { left: 14 },
      });

      startY = (doc as any).lastAutoTable.finalY;

      autoTable(doc, {
        startY,
        head: [['ID', 'Data', 'Empresa', 'Valor']],
        body: rows,
        foot: [['', 'SUBTOTAL', `Empr: ${esc.totalEmpresas}`, `Valor: ${fmtCurrency(esc.totalValor)} | V+%: ${fmtCurrency(esc.totalValorComIndice)} | Pts: ${fmtNumber(esc.totalPontos)}`]],
        theme: 'striped',
        headStyles: { fillColor: [52, 73, 94], fontSize: 8 },
        bodyStyles: { fontSize: 7 },
        footStyles: { fillColor: [236, 240, 241], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 7 },
        margin: { left: 14 },
      });

      startY = (doc as any).lastAutoTable.finalY + 4;
      if (startY > 180) {
        doc.addPage();
        startY = 15;
      }
    });
  } else {
    const rows = escritorios.map((esc) => [
      esc.escritorioId,
      esc.escritorioNome,
      fmtCurrency(esc.totalValor),
      fmtCurrency(esc.totalValorComIndice),
      esc.totalEmpresas,
      fmtNumber(esc.totalPontos),
    ]);

    autoTable(doc, {
      startY: 38,
      head: [['ID', 'Escritório', 'Valor (R$)', 'Valor + %', 'Empresas', 'Pontos']],
      body: rows,
      foot: [['', 'TOTAL GERAL', fmtCurrency(data.totalGeral?.valor || 0), fmtCurrency(data.totalGeral?.valorComIndice || 0), data.totalGeral?.empresas || 0, fmtNumber(data.totalGeral?.pontos || 0)]],
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185] },
      footStyles: { fillColor: [236, 240, 241], textColor: [0, 0, 0], fontStyle: 'bold' },
      margin: { left: 14 },
    });
  }

  doc.save(getFileName('escritorios', periodo) + '.pdf');
}

export function exportProfissionaisPDF(
  data: ResultadoRelatorio,
  periodo: string,
  detalhado: boolean
) {
  const doc = createPdfDoc('Relatório por Profissionais', periodo);
  const profissionais = data.profissionais || [];

  if (detalhado) {
    let startY = 38;
    profissionais.forEach((prof) => {
      const rows: (string | number)[][] = [];
      prof.operacoes.forEach((op: any) => {
        const valorExibir = op.construtora ? `${fmtCurrency(op.valorAjustado ?? op.valor)} (orig: ${fmtCurrency(op.valor)})` : fmtCurrency(op.valor);
        rows.push([
          op.id,
          fmtDate(op.data),
          op.empresaNome + (op.construtora ? ' [CONSTRUTORA]' : ''),
          valorExibir,
        ]);
      });

      autoTable(doc, {
        startY,
        head: [[{ content: `${prof.profissionalNome} (#${prof.profissionalId})`, colSpan: 4, styles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' } }]],
        body: [],
        theme: 'grid',
        margin: { left: 14 },
      });

      startY = (doc as any).lastAutoTable.finalY;

      autoTable(doc, {
        startY,
        head: [['ID', 'Data', 'Empresa', 'Valor']],
        body: rows,
        foot: [['', 'SUBTOTAL', `Empr: ${prof.totalEmpresas}`, `Valor: ${fmtCurrency(prof.totalValor)} | V+%: ${fmtCurrency(prof.totalValorComIndice)} | Pts: ${fmtNumber(prof.totalPontos)}`]],
        theme: 'striped',
        headStyles: { fillColor: [52, 73, 94], fontSize: 8 },
        bodyStyles: { fontSize: 7 },
        footStyles: { fillColor: [236, 240, 241], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 7 },
        margin: { left: 14 },
      });

      startY = (doc as any).lastAutoTable.finalY + 4;
      if (startY > 180) {
        doc.addPage();
        startY = 15;
      }
    });
  } else {
    const rows = profissionais.map((prof) => [
      prof.profissionalId,
      prof.profissionalNome,
      fmtCurrency(prof.totalValor),
      fmtCurrency(prof.totalValorComIndice),
      prof.totalEmpresas,
      fmtNumber(prof.totalPontos),
    ]);

    autoTable(doc, {
      startY: 38,
      head: [['ID', 'Profissional', 'Valor (R$)', 'Valor + %', 'Empresas', 'Pontos']],
      body: rows,
      foot: [['', 'TOTAL GERAL', fmtCurrency(data.totalGeral?.valor || 0), fmtCurrency(data.totalGeral?.valorComIndice || 0), data.totalGeral?.empresas || 0, fmtNumber(data.totalGeral?.pontos || 0)]],
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185] },
      footStyles: { fillColor: [236, 240, 241], textColor: [0, 0, 0], fontStyle: 'bold' },
      margin: { left: 14 },
    });
  }

  doc.save(getFileName('profissionais', periodo) + '.pdf');
}

export function exportGeralPDF(
  data: ResultadoRelatorio,
  periodo: string
) {
  const doc = createPdfDoc('Relatório Geral', periodo);
  const operacoes = data.operacoes || [];

  const rows = operacoes.map((op) => [
    op.id,
    fmtDate(op.data),
    op.empresaNome,
    op.profissionalNome || '-',
    op.tipo || '-',
    fmtCurrency(op.valor),
    op.pontos,
  ]);

  autoTable(doc, {
    startY: 38,
    head: [['ID', 'Data', 'Empresa', 'Profissional/Escritório', 'Tipo', 'Valor', 'Pontos']],
    body: rows,
    foot: [[
      '', '', '', '',
      `Total (${data.totalGeral?.registros || 0} reg.)`,
      fmtCurrency(data.totalGeral?.valor || 0),
      fmtNumber(data.totalGeral?.pontos || 0),
    ]],
    theme: 'striped',
    headStyles: { fillColor: [41, 128, 185], fontSize: 8 },
    bodyStyles: { fontSize: 7 },
    footStyles: { fillColor: [236, 240, 241], textColor: [0, 0, 0], fontStyle: 'bold' },
    margin: { left: 14 },
  });

  doc.save(getFileName('geral', periodo) + '.pdf');
}

// ========== XLS Export ==========

function createWorkbook() {
  return XLSX.utils.book_new();
}

function autoFitColumns(ws: XLSX.WorkSheet, data: any[][]) {
  const colWidths = data[0].map((_, colIdx) => {
    let maxLen = 10;
    data.forEach((row) => {
      const cell = row[colIdx];
      const len = cell != null ? String(cell).length : 0;
      if (len > maxLen) maxLen = len;
    });
    return { wch: Math.min(maxLen + 2, 40) };
  });
  ws['!cols'] = colWidths;
}

export function exportEmpresasXLS(
  data: ResultadoRelatorio,
  periodo: string,
  detalhado: boolean
) {
  const wb = createWorkbook();
  const empresas = data.empresas || [];

  if (detalhado) {
    // Uma aba com todas as operações agrupadas
    const rows: any[][] = [['Empresa', 'Op ID', 'Data', 'Profissional', 'Tipo', 'Valor', 'Pontos']];
    empresas.forEach((emp) => {
      emp.operacoes.forEach((op) => {
        rows.push([
          emp.empresaNome,
          op.id,
          fmtDate(op.data),
          op.profissionalNome || '-',
          op.tipo || '-',
          op.valor,
          op.pontos,
        ]);
      });
      // Subtotal row
      rows.push(['', '', '', '', 'SUBTOTAL ' + emp.empresaNome, emp.totalValor, emp.totalPontos]);
    });
    rows.push([]);
    rows.push(['', '', '', '', 'TOTAL GERAL', data.totalGeral?.valor || 0, data.totalGeral?.pontos || 0]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    autoFitColumns(ws, rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Detalhado');
  } else {
    const rows: any[][] = [['ID', 'Empresa', 'Valor (R$)', 'Pontos', 'Pagamento']];
    empresas.forEach((emp) => {
      rows.push([emp.empresaId, emp.empresaNome, emp.totalValor, emp.totalPontos, emp.pagamento]);
    });
    rows.push([]);
    rows.push(['', 'TOTAL GERAL', data.totalGeral?.valor || 0, data.totalGeral?.pontos || 0, data.totalGeral?.pagamento || 0]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    autoFitColumns(ws, rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Empresas');
  }

  XLSX.writeFile(wb, getFileName('empresas', periodo) + '.xlsx');
}

export function exportEscritoriosXLS(
  data: ResultadoRelatorio,
  periodo: string,
  detalhado: boolean
) {
  const wb = createWorkbook();
  const escritorios = data.escritorios || [];

  if (detalhado) {
    const rows: any[][] = [['Escritório', 'Op ID', 'Data', 'Empresa', 'Construtora', 'Valor Original', 'Valor Ajustado']];
    escritorios.forEach((esc) => {
      esc.operacoes.forEach((op: any) => {
        rows.push([
          esc.escritorioNome,
          op.id,
          fmtDate(op.data),
          op.empresaNome,
          op.construtora ? 'Sim' : 'Não',
          op.valor,
          op.valorAjustado ?? op.valor,
        ]);
      });
      rows.push(['', '', '', 'SUBTOTAL ' + esc.escritorioNome, '', esc.totalValor, esc.totalValorComIndice]);
    });
    rows.push([]);
    rows.push(['', '', '', 'TOTAL GERAL', '', data.totalGeral?.valor || 0, data.totalGeral?.valorComIndice || 0]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    autoFitColumns(ws, rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Detalhado');
  } else {
    const rows: any[][] = [['ID', 'Escritório', 'Valor (R$)', 'Valor + %', 'Empresas', 'Pontos']];
    escritorios.forEach((esc) => {
      rows.push([esc.escritorioId, esc.escritorioNome, esc.totalValor, esc.totalValorComIndice, esc.totalEmpresas, esc.totalPontos]);
    });
    rows.push([]);
    rows.push(['', 'TOTAL GERAL', data.totalGeral?.valor || 0, data.totalGeral?.valorComIndice || 0, data.totalGeral?.empresas || 0, data.totalGeral?.pontos || 0]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    autoFitColumns(ws, rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Escritórios');
  }

  XLSX.writeFile(wb, getFileName('escritorios', periodo) + '.xlsx');
}

export function exportProfissionaisXLS(
  data: ResultadoRelatorio,
  periodo: string,
  detalhado: boolean
) {
  const wb = createWorkbook();
  const profissionais = data.profissionais || [];

  if (detalhado) {
    const rows: any[][] = [['Profissional', 'Op ID', 'Data', 'Empresa', 'Construtora', 'Valor Original', 'Valor Ajustado']];
    profissionais.forEach((prof) => {
      prof.operacoes.forEach((op: any) => {
        rows.push([
          prof.profissionalNome,
          op.id,
          fmtDate(op.data),
          op.empresaNome,
          op.construtora ? 'Sim' : 'Não',
          op.valor,
          op.valorAjustado ?? op.valor,
        ]);
      });
      rows.push(['', '', '', 'SUBTOTAL ' + prof.profissionalNome, '', prof.totalValor, prof.totalValorComIndice]);
    });
    rows.push([]);
    rows.push(['', '', '', 'TOTAL GERAL', '', data.totalGeral?.valor || 0, data.totalGeral?.valorComIndice || 0]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    autoFitColumns(ws, rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Detalhado');
  } else {
    const rows: any[][] = [['ID', 'Profissional', 'Valor (R$)', 'Valor + %', 'Empresas', 'Pontos']];
    profissionais.forEach((prof) => {
      rows.push([prof.profissionalId, prof.profissionalNome, prof.totalValor, prof.totalValorComIndice, prof.totalEmpresas, prof.totalPontos]);
    });
    rows.push([]);
    rows.push(['', 'TOTAL GERAL', data.totalGeral?.valor || 0, data.totalGeral?.valorComIndice || 0, data.totalGeral?.empresas || 0, data.totalGeral?.pontos || 0]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    autoFitColumns(ws, rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Profissionais');
  }

  XLSX.writeFile(wb, getFileName('profissionais', periodo) + '.xlsx');
}

export function exportGeralXLS(
  data: ResultadoRelatorio,
  periodo: string
) {
  const wb = createWorkbook();
  const operacoes = data.operacoes || [];

  const rows: any[][] = [['ID', 'Data', 'Empresa', 'Profissional/Escritório', 'Tipo', 'Valor', 'Pontos']];
  operacoes.forEach((op) => {
    rows.push([op.id, fmtDate(op.data), op.empresaNome, op.profissionalNome || '-', op.tipo || '-', op.valor, op.pontos]);
  });
  rows.push([]);
  rows.push(['', '', '', '', `Total (${data.totalGeral?.registros || 0} reg.)`, data.totalGeral?.valor || 0, data.totalGeral?.pontos || 0]);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  autoFitColumns(ws, rows);
  XLSX.utils.book_append_sheet(wb, ws, 'Geral');

  XLSX.writeFile(wb, getFileName('geral', periodo) + '.xlsx');
}
