// pages/report/[uuid].js - Public Report Viewing Page
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import ReportViewer from '../../components/ReportViewer';

export default function ReportPage() {
  const router = useRouter();
  const { uuid } = router.query;
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (uuid) {
      fetchReport(uuid);
    }
  }, [uuid]);
  
  const fetchReport = async (reportUuid) => {
    try {
      const response = await fetch(`/api/report/${reportUuid}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const reportData = await response.json();
      setReport(reportData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleShare = () => {
    const shareUrl = window.location.href;
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert('Share URL copied to clipboard!');
    });
  };
  
  const handleExportPDF = () => {
    window.print();
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading report...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl text-gray-400 mb-4">📄</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Report Not Found</h1>
          <p className="text-gray-600">The requested report could not be found or has expired.</p>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <Head>
        <title>Astra Design QA Report - {report.metadata?.title}</title>
        <meta name="description" content={`Design QA analysis report for ${report.metadata?.url}`} />
      </Head>
      
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">✨ Astra Design QA Report</h1>
                <p className="text-gray-600 mt-1">
                  Generated on {new Date(report.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleShare}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  📋 Copy Share Link
                </button>
                <button
                  onClick={handleExportPDF}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  📄 Export PDF
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="max-w-4xl mx-auto px-4 py-8">
          <ReportViewer report={report} />
        </div>
      </div>
    </>
  );
}