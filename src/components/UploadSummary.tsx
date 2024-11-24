import React from 'react';
import { CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import type { UploadSummaryData } from '../types';

interface UploadSummaryProps {
  summary: UploadSummaryData;
  onClose: () => void;
}

export default function UploadSummary({ summary, onClose }: UploadSummaryProps) {
  const getIcon = () => {
    if (summary.errors > 0 && summary.newEntries === 0) {
      return <XCircle className="w-12 h-12 text-red-500" />;
    }
    if (summary.errors > 0) {
      return <AlertCircle className="w-12 h-12 text-yellow-500" />;
    }
    return <CheckCircle className="w-12 h-12 text-green-500" />;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-center mb-4">
          {getIcon()}
        </div>
        <h3 className="text-lg font-medium text-center mb-4">Upload Summary</h3>
        <div className="space-y-2 mb-4">
          <p className="text-sm text-gray-600">
            New entries added: <span className="font-medium">{summary.newEntries}</span>
          </p>
          <p className="text-sm text-gray-600">
            Duplicates found: <span className="font-medium">{summary.duplicates}</span>
          </p>
          <p className="text-sm text-gray-600">
            Errors encountered: <span className="font-medium">{summary.errors}</span>
          </p>
          <p className="text-sm text-gray-600">
            Total rows processed: <span className="font-medium">{summary.total}</span>
          </p>
        </div>
        
        {summary.errorMessages.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Error Details:</h4>
            <div className="bg-red-50 rounded-lg p-3 max-h-48 overflow-y-auto">
              {summary.errorMessages.map((error, index) => (
                <p key={index} className="text-sm text-red-700 mb-1">
                  {error}
                </p>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-6 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}