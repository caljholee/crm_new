import React, { useState } from 'react';
import { Search, Plus, ChevronDown, Save } from 'lucide-react';
import type { VideoEntry } from '../types';
import FileUpload from './FileUpload';

interface VideoTableProps {
  videos: VideoEntry[];
  onStatusChange: (id: string, status: VideoEntry['status']) => void;
  onSparkCodeUpdate: (id: string, sparkCode: string) => void;
  onFileSelect: (file: File) => Promise<void>;
  onSaveVideo: (id: string, updates: { video_id?: string; sparkCode?: string; status?: VideoEntry['status'] }) => Promise<void>;
}

export default function VideoTable({ 
  videos, 
  onStatusChange, 
  onSparkCodeUpdate, 
  onFileSelect,
  onSaveVideo 
}: VideoTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [editingVideo, setEditingVideo] = useState<{
    id: string;
    video_id: string;
    sparkCode: string;
  } | null>(null);

  const formatGMV = (gmv: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(gmv);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
      }
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.error('Error formatting date:', dateString);
      return 'Invalid Date';
    }
  };

  const getStatusBadgeClass = (status: VideoEntry['status']) => {
    switch (status) {
      case 'authorized':
        return 'bg-green-50 text-green-700 border border-green-200';
      case 'unauthorized':
        return 'bg-red-50 text-red-700 border border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border border-gray-200';
    }
  };

  const handleEdit = (video: VideoEntry) => {
    setEditingVideo({
      id: video.id,
      video_id: video.video_id,
      sparkCode: video.sparkCode || ''
    });
  };

  const handleSave = async (id: string) => {
    if (!editingVideo) return;

    const updates: {
      video_id?: string;
      sparkCode?: string;
      status?: VideoEntry['status'];
    } = {
      video_id: editingVideo.video_id,
      sparkCode: editingVideo.sparkCode
    };

    // If spark code is not empty, automatically set status to authorized
    if (editingVideo.sparkCode.trim()) {
      updates.status = 'authorized';
    }

    await onSaveVideo(id, updates);
    setEditingVideo(null);
  };

  const filteredVideos = videos.filter(video => 
    video.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    video.video_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    video.creatorUsername.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Video ID Management</h1>
        <p className="mt-2 text-gray-600">Manage spark code authorizations for your videos.</p>
      </div>

      <div className="flex justify-between items-center mb-8 gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search videos..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center gap-2">
          Filter
          <ChevronDown className="h-4 w-4" />
        </button>
        <button 
          onClick={() => setShowUpload(true)}
          className="px-4 py-2 rounded-lg bg-black text-white hover:bg-gray-800 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Upload CSV
        </button>
      </div>

      {showUpload && (
        <div className="mb-8">
          <FileUpload 
            onFileSelect={async (file) => {
              await onFileSelect(file);
              setShowUpload(false);
            }}
          />
          <p className="text-sm text-gray-500 mt-2">
            Required CSV columns: Video Name, Video Post Date (YYYY-MM-DD), Creator Username, GMV
          </p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left py-4 px-6 font-medium text-gray-600">Video ID</th>
                <th className="text-left py-4 px-6 font-medium text-gray-600">Video Name</th>
                <th className="text-left py-4 px-6 font-medium text-gray-600">Post Date</th>
                <th className="text-left py-4 px-6 font-medium text-gray-600">Creator Username</th>
                <th className="text-left py-4 px-6 font-medium text-gray-600">GMV</th>
                <th className="text-left py-4 px-6 font-medium text-gray-600">Spark Code Status</th>
                <th className="text-left py-4 px-6 font-medium text-gray-600">Spark Code</th>
                <th className="text-left py-4 px-6 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVideos.map((video) => {
                const isEditing = editingVideo?.id === video.id;
                return (
                  <tr key={video.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-6">
                      {isEditing ? (
                        <input
                          type="text"
                          className="px-3 py-2 border border-gray-200 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={editingVideo.video_id}
                          onChange={(e) => setEditingVideo({
                            ...editingVideo,
                            video_id: e.target.value
                          })}
                          placeholder="Enter Video ID"
                        />
                      ) : (
                        <span className="text-gray-900">{video.video_id || '-'}</span>
                      )}
                    </td>
                    <td className="py-4 px-6">{video.name}</td>
                    <td className="py-4 px-6">{formatDate(video.postDate)}</td>
                    <td className="py-4 px-6">@{video.creatorUsername}</td>
                    <td className="py-4 px-6">{formatGMV(video.gmv)}</td>
                    <td className="py-4 px-6">
                      <select
                        value={video.status}
                        onChange={(e) => onStatusChange(video.id, e.target.value as VideoEntry['status'])}
                        className={`px-3 py-1.5 rounded-lg ${getStatusBadgeClass(video.status)}`}
                        disabled={video.sparkCode ? true : false}
                      >
                        <option value="pending">Pending</option>
                        <option value="authorized">Authorized</option>
                        <option value="unauthorized">Unauthorized</option>
                      </select>
                    </td>
                    <td className="py-4 px-6">
                      {isEditing ? (
                        <input
                          type="text"
                          className="px-3 py-2 border border-gray-200 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={editingVideo.sparkCode}
                          onChange={(e) => setEditingVideo({
                            ...editingVideo,
                            sparkCode: e.target.value
                          })}
                          placeholder="Enter spark code"
                        />
                      ) : (
                        <span className="text-gray-900">{video.sparkCode || '-'}</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      {isEditing ? (
                        <button
                          onClick={() => handleSave(video.id)}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <Save className="h-4 w-4 mr-1" />
                          Save
                        </button>
                      ) : (
                        <button
                          onClick={() => handleEdit(video)}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}