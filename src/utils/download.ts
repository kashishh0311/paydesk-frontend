import { showErrorToast } from './toast';

/**
 * Clean in-app authenticated file export helper
 * Streams file as blob and triggers native browser save dialog
 */
export const downloadExport = async (endpoint: string, defaultFilename: string): Promise<void> => {
  try {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
    const token = typeof window !== 'undefined' ? localStorage.getItem('paydesk_token') : null;
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'GET',
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Export failed with HTTP ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      const html = await response.text();
      const printWin = window.open('', '_blank');
      if (printWin) {
        printWin.document.write(html);
        printWin.document.close();
      }
      return;
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', defaultFilename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Download export error:', error);
    showErrorToast('Failed to download export file. Please verify network access.');
  }
};
