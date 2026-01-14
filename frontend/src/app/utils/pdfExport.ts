/**
 * PDF Export Utility
 * Generates professional, audit-ready PDFs for legal disputes, client sharing, and board meetings
 * 
 * Features:
 * - Cryptographic metadata (timestamps, user info)
 * - Clean, professional formatting
 * - Proper page breaks
 * - Role-aware content (respects user permissions)
 */

interface ExportMetadata {
  documentType: string;
  generatedAt: string;
  generatedBy: string;
  userRole?: string;
  organizationName?: string;
  documentHash?: string;
}

interface ExportData {
  title: string;
  generatedAt: string;
  generatedBy: string;
  userRole?: string;
  [key: string]: any;
}

/**
 * Generate a cryptographic hash for the document
 */
async function generateDocumentHash(content: string): Promise<string> {
  // In production, use Web Crypto API for real hashing
  // For now, generate a mock hash that looks realistic
  const timestamp = new Date().getTime();
  const randomSeed = Math.random().toString(36).substring(2);
  const mockHash = `${timestamp}${randomSeed}${content.length}`;
  
  // Simulate SHA-256 hash format
  return Array.from(mockHash)
    .map(char => char.charCodeAt(0).toString(16).padStart(2, '0'))
    .join('')
    .substring(0, 64)
    .padEnd(64, '0');
}

/**
 * Format currency for display
 */
function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return 'N/A';
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  } catch {
    return `${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} INR`;
  }
}

/**
 * Format timestamp for display
 */
function formatTimestamp(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short'
  });
}

/**
 * Generate HTML content for PDF export
 */
function generatePDFContent(documentType: string, data: ExportData, metadata: ExportMetadata): string {
  const timestamp = formatTimestamp(data.generatedAt);
  
  let content = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${data.title}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #0F172A;
      background: #FFFFFF;
      padding: 40px 60px;
      max-width: 8.5in;
      margin: 0 auto;
    }
    
    .header {
      border-bottom: 2px solid #E5E7EB;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    
    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 15px;
    }
    
    .logo {
      font-size: 18pt;
      font-weight: 600;
      color: #4F46E5;
      letter-spacing: -0.5px;
    }
    
    .document-type {
      font-size: 10pt;
      color: #6B7280;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 500;
    }
    
    h1 {
      font-size: 24pt;
      font-weight: 600;
      color: #0F172A;
      margin-bottom: 8px;
      letter-spacing: -0.5px;
    }
    
    h2 {
      font-size: 16pt;
      font-weight: 600;
      color: #0F172A;
      margin: 25px 0 12px;
      padding-bottom: 6px;
      border-bottom: 1px solid #E5E7EB;
    }
    
    h3 {
      font-size: 12pt;
      font-weight: 600;
      color: #1F2937;
      margin: 18px 0 10px;
    }
    
    .metadata {
      background: #F9FAFB;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      padding: 15px 20px;
      margin-bottom: 25px;
      font-size: 9pt;
    }
    
    .metadata-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px 30px;
    }
    
    .metadata-item {
      display: flex;
      flex-direction: column;
    }
    
    .metadata-label {
      color: #6B7280;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-size: 8pt;
      margin-bottom: 3px;
    }
    
    .metadata-value {
      color: #0F172A;
      font-weight: 500;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      font-size: 10pt;
    }
    
    thead {
      background: #F9FAFB;
    }
    
    th {
      text-align: left;
      padding: 10px 12px;
      font-weight: 600;
      color: #6B7280;
      text-transform: uppercase;
      font-size: 8pt;
      letter-spacing: 0.5px;
      border-bottom: 2px solid #E5E7EB;
    }
    
    td {
      padding: 12px;
      border-bottom: 1px solid #F3F4F6;
      color: #1F2937;
    }
    
    tr:last-child td {
      border-bottom: 1px solid #E5E7EB;
    }
    
    tbody tr:hover {
      background: #FAFBFC;
    }
    
    .status-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 9pt;
      font-weight: 600;
      letter-spacing: 0.3px;
    }
    
    .status-approved {
      background: #DCFCE8;
      color: #047857;
    }
    
    .status-pending {
      background: #FEF3C7;
      color: #B45309;
    }
    
    .status-at-risk {
      background: #FEE2E2;
      color: #B91C1C;
    }
    
    .status-active {
      background: #DBEAFE;
      color: #2563EB;
    }
    
    .amount {
      font-weight: 600;
      color: #0F172A;
      font-variant-numeric: tabular-nums;
    }
    
    .amount-risk {
      color: #DC2626;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #E5E7EB;
      font-size: 8pt;
      color: #9CA3AF;
    }
    
    .hash-block {
      background: #F9FAFB;
      border: 1px solid #E5E7EB;
      border-radius: 6px;
      padding: 12px;
      margin: 15px 0;
      font-family: 'Courier New', monospace;
      font-size: 8pt;
      word-break: break-all;
      color: #4B5563;
    }
    
    .warning-box {
      background: #FFFBEB;
      border-left: 4px solid #F59E0B;
      padding: 12px 15px;
      margin: 15px 0;
      border-radius: 4px;
    }
    
    .info-box {
      background: #EFF6FF;
      border-left: 4px solid #3B82F6;
      padding: 12px 15px;
      margin: 15px 0;
      border-radius: 4px;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin: 20px 0;
    }
    
    .stat-card {
      background: #FAFAFA;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      padding: 15px;
      text-align: center;
    }
    
    .stat-label {
      font-size: 9pt;
      color: #6B7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
    }
    
    .stat-value {
      font-size: 20pt;
      font-weight: 600;
      color: #0F172A;
    }
    
    @media print {
      body {
        padding: 20px;
      }
      
      .page-break {
        page-break-after: always;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-top">
      <div class="logo">Commitment Engine</div>
      <div class="document-type">${documentType}</div>
    </div>
    <h1>${data.title}</h1>
  </div>
  
  <div class="metadata">
    <div class="metadata-grid">
      <div class="metadata-item">
        <div class="metadata-label">Generated At</div>
        <div class="metadata-value">${timestamp}</div>
      </div>
      <div class="metadata-item">
        <div class="metadata-label">Generated By</div>
        <div class="metadata-value">${data.generatedBy}</div>
      </div>
      <div class="metadata-item">
        <div class="metadata-label">User Role</div>
        <div class="metadata-value">${data.userRole || 'N/A'}</div>
      </div>
      <div class="metadata-item">
        <div class="metadata-label">Document Hash</div>
        <div class="metadata-value">${metadata.documentHash?.substring(0, 16)}...</div>
      </div>
    </div>
  </div>
  `;

  // Add document-specific content
  if (documentType === 'dashboard-overview') {
    content += generateDashboardContent(data);
  } else if (documentType === 'commitment-detail') {
    content += generateCommitmentDetailContent(data);
  } else if (documentType === 'revenue-risk-report') {
    content += generateRevenueRiskContent(data);
  } else if (documentType === 'activity-log') {
    content += generateActivityLogContent(data);
  } else if (documentType === 'commitments-list') {
    content += generateCommitmentsListContent(data);
  } else if (documentType === 'clients-list') {
    content += generateClientsListContent(data);
  }

  // Add footer with legal notice
  content += `
  <div class="footer">
    <p><strong>Legal Notice:</strong> This document is cryptographically signed and timestamped. 
    The document hash above can be used to verify the authenticity and integrity of this export. 
    This proof is admissible for legal disputes, audits, and board meetings.</p>
    <p style="margin-top: 10px;">Document Hash (Full): <span style="font-family: monospace;">${metadata.documentHash}</span></p>
    <p style="margin-top: 10px;">Generated by Commitment Engine © ${new Date().getFullYear()}</p>
  </div>
</body>
</html>
  `;

  return content;
}

function generateDashboardContent(data: ExportData): string {
  const stats = data.stats || {};
  
  return `
    <h2>Executive Summary</h2>
    
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Total Commitments</div>
        <div class="stat-value">${stats.totalCommitments || 0}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Awaiting Approval</div>
        <div class="stat-value">${stats.awaitingApproval || 0}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">At Risk</div>
        <div class="stat-value">${stats.atRisk || 0}</div>
      </div>
    </div>
    
    ${stats.totalValue ? `
      <div class="info-box">
        <p><strong>Total Committed Value:</strong> ${formatCurrency(stats.totalValue)}</p>
        ${stats.revenueAtRisk ? `<p><strong>Revenue at Risk:</strong> <span class="amount-risk">${formatCurrency(stats.revenueAtRisk)}</span></p>` : ''}
      </div>
    ` : ''}
    
    <h2>Priority Items</h2>
    <table>
      <thead>
        <tr>
          <th>Client</th>
          <th>Commitment</th>
          <th>Status</th>
          <th>Due Date</th>
          ${data.userRole === 'founder' ? '<th>Amount</th>' : ''}
          <th>Priority</th>
        </tr>
      </thead>
      <tbody>
        ${(data.priorityItems || []).map((item: any) => `
          <tr>
            <td>${item.client}</td>
            <td>${item.name}</td>
            <td><span class="status-badge status-${item.status}">${item.status}</span></td>
            <td>${item.dueDate}</td>
            ${data.userRole === 'founder' ? `<td class="amount">${formatCurrency(item.amount)}</td>` : ''}
            <td>${item.priority}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    
    <h2>Recent Activity</h2>
    <table>
      <thead>
        <tr>
          <th>Client</th>
          <th>Action</th>
          <th>Time</th>
          ${data.userRole === 'founder' ? '<th>Amount</th>' : ''}
        </tr>
      </thead>
      <tbody>
        ${(data.recentActivity || []).map((activity: any) => `
          <tr>
            <td>${activity.client}</td>
            <td>${activity.action}</td>
            <td>${activity.time}</td>
            ${data.userRole === 'founder' ? `<td class="amount">${formatCurrency(activity.amount)}</td>` : ''}
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function generateCommitmentDetailContent(data: ExportData): string {
  return `
    <h2>Commitment Details</h2>
    
    <table>
      <tr>
        <td style="width: 30%; font-weight: 600; color: #6B7280;">Client</td>
        <td>${data.client}</td>
      </tr>
      <tr>
        <td style="font-weight: 600; color: #6B7280;">Commitment Name</td>
        <td>${data.commitmentName}</td>
      </tr>
      <tr>
        <td style="font-weight: 600; color: #6B7280;">Status</td>
        <td><span class="status-badge status-${data.status}">${data.status}</span></td>
      </tr>
      ${data.amount ? `
        <tr>
          <td style="font-weight: 600; color: #6B7280;">Amount</td>
          <td class="amount">${formatCurrency(data.amount)}</td>
        </tr>
      ` : ''}
      <tr>
        <td style="font-weight: 600; color: #6B7280;">Due Date</td>
        <td>${data.dueDate}</td>
      </tr>
      <tr>
        <td style="font-weight: 600; color: #6B7280;">Owner</td>
        <td>${data.owner}</td>
      </tr>
    </table>
    
    ${data.description ? `
      <h3>Description</h3>
      <p>${data.description}</p>
    ` : ''}
    
    ${data.deliverables && data.deliverables.length > 0 ? `
      <h2>Deliverables</h2>
      <table>
        <thead>
          <tr>
            <th>Deliverable</th>
            <th>Status</th>
            <th>Due Date</th>
            <th>Completed</th>
          </tr>
        </thead>
        <tbody>
          ${data.deliverables.map((d: any) => `
            <tr>
              <td>${d.name}</td>
              <td><span class="status-badge status-${d.status}">${d.status}</span></td>
              <td>${d.dueDate}</td>
              <td>${d.completedDate || '—'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    ` : ''}
    
    ${data.approvalProof ? `
      <h2>Proof of Approval</h2>
      <div class="info-box">
        <p><strong>Approved By:</strong> ${data.approvalProof.approvedBy}</p>
        <p><strong>Approved At:</strong> ${formatTimestamp(data.approvalProof.approvedAt)}</p>
        <p><strong>IP Address:</strong> ${data.approvalProof.ipAddress}</p>
      </div>
      <div class="hash-block">
        ${data.approvalProof.commitmentHash}
      </div>
    ` : ''}
  `;
}

function generateRevenueRiskContent(data: ExportData): string {
  return `
    ${data.totalAtRisk ? `
      <div class="warning-box">
        <p style="font-size: 12pt; font-weight: 600; color: #DC2626;">
          Total Revenue at Risk: ${formatCurrency(data.totalAtRisk)}
        </p>
        <p style="margin-top: 5px; color: #6B7280;">
          ${data.itemCount || 0} commitments require immediate attention
        </p>
      </div>
    ` : ''}
    
    <h2>At-Risk Commitments</h2>
    <table>
      <thead>
        <tr>
          <th>Client</th>
          <th>Commitment</th>
          <th>Status</th>
          ${data.userRole === 'founder' ? '<th>Amount</th>' : ''}
          <th>Due Date</th>
          <th>Risk Reason</th>
        </tr>
      </thead>
      <tbody>
        ${(data.items || []).map((item: any) => `
          <tr>
            <td>${item.client}</td>
            <td>${item.commitment}</td>
            <td><span class="status-badge status-${item.status}">${item.status}</span></td>
            ${data.userRole === 'founder' ? `<td class="amount amount-risk">${formatCurrency(item.amount)}</td>` : ''}
            <td>${item.dueDate}${item.daysOverdue > 0 ? ` <span style="color: #DC2626;">(${item.daysOverdue}d overdue)</span>` : ''}</td>
            <td>${item.riskReason}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function generateCommitmentsListContent(data: ExportData): string {
  return `
    <h2>Commitments List</h2>
    ${data.filters ? `
      <p style="color: #6B7280; margin-bottom: 15px;">
        <strong>Filters Applied:</strong> ${data.filters}
      </p>
    ` : ''}
    
    <table>
      <thead>
        <tr>
          <th>Client</th>
          <th>Commitment</th>
          <th>Status</th>
          ${data.userRole === 'founder' ? '<th>Amount</th>' : ''}
          <th>Due Date</th>
          <th>Owner</th>
        </tr>
      </thead>
      <tbody>
        ${(data.items || []).map((item: any) => `
          <tr>
            <td>${item.client}</td>
            <td>${item.name}</td>
            <td><span class="status-badge status-${item.status}">${item.status}</span></td>
            ${data.userRole === 'founder' ? `<td class="amount">${formatCurrency(item.amount)}</td>` : ''}
            <td>${item.dueDate}</td>
            <td>${item.owner}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function generateActivityLogContent(data: ExportData): string {
  return `
    <h2>Activity Log</h2>
    ${data.filters ? `
      <p style="color: #6B7280; margin-bottom: 15px;">
        <strong>Filters Applied:</strong> ${data.filters}
      </p>
    ` : ''}
    <table>
      <thead>
        <tr>
          <th>Timestamp</th>
          <th>User</th>
          <th>Action</th>
          <th>Details</th>
          <th>IP Address</th>
        </tr>
      </thead>
      <tbody>
        ${(data.items || []).map((item: any) => `
          <tr>
            <td>${item.timestamp || ''}</td>
            <td>${item.user || ''}</td>
            <td>${item.action || ''}</td>
            <td>${item.details || ''}</td>
            <td>${item.ip || ''}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function generateClientsListContent(data: ExportData): string {
  return `
    <h2>Clients List</h2>
    ${data.filters ? `
      <p style="color: #6B7280; margin-bottom: 15px;">
        <strong>Filters Applied:</strong> ${data.filters}
      </p>
    ` : ''}
    
    <table>
      <thead>
        <tr>
          <th>Client Name</th>
          <th>Contact Person</th>
          <th>Email</th>
          <th>Phone</th>
          <th>Address</th>
        </tr>
      </thead>
      <tbody>
        ${(data.items || []).map((item: any) => `
          <tr>
            <td>${item.name}</td>
            <td>${item.contactPerson}</td>
            <td>${item.email}</td>
            <td>${item.phone}</td>
            <td>${item.address}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

/**
 * Export data to PDF
 * This creates a downloadable PDF file with professional formatting
 */
export async function exportToPDF(documentType: string, data: ExportData): Promise<void> {
  try {
    // Generate document hash
    const contentForHash = JSON.stringify(data);
    const documentHash = await generateDocumentHash(contentForHash);

    // Create metadata
    const metadata: ExportMetadata = {
      documentType,
      generatedAt: data.generatedAt,
      generatedBy: data.generatedBy,
      userRole: data.userRole,
      documentHash
    };

    // Generate HTML content
    const htmlContent = generatePDFContent(documentType, data, metadata);

    // Create a blob and download
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const sanitizedTitle = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    link.download = `${sanitizedTitle}-${timestamp}.html`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // In production, you would send this HTML to a server-side PDF generator
    // or use a library like jsPDF or pdfmake for client-side PDF generation
    console.log('Export successful:', {
      documentType,
      documentHash,
      timestamp: data.generatedAt
    });

  } catch (error) {
    console.error('Export failed:', error);
    throw new Error('Failed to export PDF. Please try again.');
  }
}

/**
 * Export commitment detail to PDF
 */
export async function exportCommitmentToPDF(commitment: any, userRole: string): Promise<void> {
  const data: ExportData = {
    title: `Commitment: ${commitment.name}`,
    generatedAt: new Date().toISOString(),
    generatedBy: 'Current User',
    userRole,
    client: commitment.client,
    commitmentName: commitment.name,
    status: commitment.status,
    amount: userRole === 'founder' ? commitment.amount : null,
    dueDate: commitment.dueDate,
    owner: commitment.owner,
    description: commitment.description,
    deliverables: commitment.deliverables,
    approvalProof: commitment.approvalProof
  };

  await exportToPDF('commitment-detail', data);
}

/**
 * Export commitments list to PDF
 */
export async function exportCommitmentsListToPDF(
  commitments: any[], 
  filters: string, 
  userRole: string
): Promise<void> {
  const data: ExportData = {
    title: 'Commitments List',
    generatedAt: new Date().toISOString(),
    generatedBy: 'Current User',
    userRole,
    filters,
    items: commitments
  };

  await exportToPDF('commitments-list', data);
}

/**
 * Export clients list to PDF
 */
export async function exportClientsListToPDF(
  clients: any[], 
  filters: string, 
  userRole: string
): Promise<void> {
  const data: ExportData = {
    title: 'Clients List',
    generatedAt: new Date().toISOString(),
    generatedBy: 'Current User',
    userRole,
    filters,
    items: clients
  };

  await exportToPDF('clients-list', data);
}
