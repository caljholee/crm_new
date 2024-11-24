import React, { useState, useEffect } from 'react';
import VideoTable from './components/VideoTable';
import UploadSummary from './components/UploadSummary';
import Auth from './components/Auth';
import { useAuth } from './components/AuthProvider';
import { saveVideos, fetchUserVideos, supabase, parseCSVLine, findColumnIndices } from './lib/supabase';
import type { VideoEntry, UploadSummaryData } from './types';
import { AlertCircle } from 'lucide-react';

function App() {
  const { user, signOut } = useAuth();
  const [videos, setVideos] = useState<VideoEntry[]>([]);
  const [uploadSummary, setUploadSummary] = useState<UploadSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadUserVideos();
    }
  }, [user]);

  const loadUserVideos = async () => {
    try {
      setError(null);
      const userVideos = await fetchUserVideos(user!.id);
      setVideos(userVideos);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load videos. Please try again later.';
      setError(errorMessage);
      console.error('Error loading videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (file: File) => {
    try {
      setError(null);
      const text = await file.text();
      const lines = text.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      if (lines.length < 2) {
        setUploadSummary({
          newEntries: 0,
          duplicates: 0,
          errors: 1,
          total: 0,
          errorMessages: ['CSV file must contain a header row and at least one data row']
        });
        return;
      }

      // Parse header row to find column indices
      const columnMap = findColumnIndices(lines[0]);

      const newVideos: VideoEntry[] = [];
      const errorMessages: string[] = [];
      let duplicates = 0;

      // Process each data row
      for (let i = 1; i < lines.length; i++) {
        try {
          const csvData = parseCSVLine(lines[i], i + 1, columnMap);
          
          newVideos.push({
            id: '',
            video_id: '',
            name: csvData.name,
            postDate: csvData.post_date,
            creatorUsername: csvData.creator_username,
            gmv: csvData.gmv,
            hasSparkCode: false,
            dateAdded: new Date().toISOString(),
            tags: [],
            status: 'pending',
            sparkCode: ''
          });
        } catch (error) {
          errorMessages.push(error instanceof Error ? error.message : String(error));
        }
      }

      if (newVideos.length > 0) {
        await saveVideos(newVideos, user!.id);
        await loadUserVideos(); // Reload videos to get the updated list
      }

      setUploadSummary({
        newEntries: newVideos.length,
        duplicates,
        errors: errorMessages.length,
        total: lines.length - 1,
        errorMessages
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process CSV file';
      setUploadSummary({
        newEntries: 0,
        duplicates: 0,
        errors: 1,
        total: 0,
        errorMessages: [errorMessage]
      });
    }
  };

  const handleStatusChange = async (id: string, status: VideoEntry['status']) => {
    try {
      setError(null);
      const { error: supabaseError } = await supabase
        .from('videos')
        .update({ status })
        .eq('id', id)
        .eq('user_id', user!.id);

      if (supabaseError) throw supabaseError;

      setVideos(prev =>
        prev.map(video =>
          video.id === id ? { ...video, status } : video
        )
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update status';
      setError(errorMessage);
      console.error('Error updating status:', error);
    }
  };

  const handleSparkCodeUpdate = async (id: string, sparkCode: string) => {
    try {
      setError(null);
      const { error: supabaseError } = await supabase
        .from('videos')
        .update({ spark_code: sparkCode })
        .eq('id', id)
        .eq('user_id', user!.id);

      if (supabaseError) throw supabaseError;

      setVideos(prev =>
        prev.map(video =>
          video.id === id ? { ...video, sparkCode } : video
        )
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update spark code';
      setError(errorMessage);
      console.error('Error updating spark code:', error);
    }
  };

  const handleSaveVideo = async (id: string, updates: { video_id?: string; sparkCode?: string; status?: VideoEntry['status'] }) => {
    try {
      setError(null);
      const { error: supabaseError } = await supabase
        .from('videos')
        .update({
          ...(updates.video_id && { video_id: updates.video_id }),
          ...(updates.sparkCode && { spark_code: updates.sparkCode }),
          ...(updates.status && { status: updates.status })
        })
        .eq('id', id)
        .eq('user_id', user!.id);

      if (supabaseError) throw supabaseError;

      setVideos(prev =>
        prev.map(video =>
          video.id === id
            ? {
                ...video,
                ...(updates.video_id && { video_id: updates.video_id }),
                ...(updates.sparkCode && { sparkCode: updates.sparkCode }),
                ...(updates.status && { status: updates.status })
              }
            : video
        )
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save video updates';
      setError(errorMessage);
      console.error('Error saving video updates:', error);
    }
  };

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1400px] mx-auto">
        {loading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <p className="text-red-600 text-center mb-4">{error}</p>
            <button
              onClick={() => loadUserVideos()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            <VideoTable
              videos={videos}
              onStatusChange={handleStatusChange}
              onSparkCodeUpdate={handleSparkCodeUpdate}
              onFileSelect={handleFileSelect}
              onSaveVideo={handleSaveVideo}
            />
            {uploadSummary && (
              <UploadSummary
                summary={uploadSummary}
                onClose={() => setUploadSummary(null)}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;