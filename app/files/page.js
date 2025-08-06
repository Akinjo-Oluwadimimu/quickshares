"use client";
import { createClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function FileList() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .storage
        .from('quickshare-uploads')
        .list('user-uploads', {
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) throw error;

      const filesWithUrls = await Promise.all(
        data.map(async (file) => {
          const { data: { publicUrl } } = supabase
            .storage
            .from('quickshare-uploads')
            .getPublicUrl(`user-uploads/${file.name}`);

          return {
            name: file.name,
            publicUrl,
            uploadedAt: file.created_at,
            metadata: file.metadata
          };
        })
      );

      setFiles(filesWithUrls);
    } catch (err) {
      console.error('Error fetching files:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

    // Update the delete handler
    const handleDeleteClick = (fileName) => {
    setFileToDelete(fileName);
    setShowConfirm(true);
    };

    const handleDeleteConfirm = async () => {
    if (!fileToDelete) return;
    
    try {
        setDeleting(fileToDelete);
        const { error } = await supabase
        .storage
        .from('quickshare-uploads')
        .remove([`user-uploads/${fileToDelete}`]);

        if (error) throw error;

        await fetchFiles();
    } catch (err) {
        console.error('Error deleting file:', err);
        setError(err.message);
    } finally {
        setDeleting(null);
        setFileToDelete(null);
        setShowConfirm(false);
    }
    };

    

  useEffect(() => {
    fetchFiles();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Uploaded Files</h1>

        <Link href="/" className="mb-6 inline-block text-blue-600 hover:underline">
            ← Back to Upload
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="border rounded-lg p-4">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-8 bg-gray-200 rounded w-full mt-4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        Error: {error}
        <button 
          onClick={fetchFiles}
          className="ml-4 px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Uploaded Files</h1>

      <Link href="/" className="mb-6 inline-block text-blue-600 hover:underline">
        ← Back to Upload
      </Link>
      
      {files.length === 0 ? (
        <div className="text-center py-8">
          <p>No files uploaded yet</p>
          <Link href="/" className="text-blue-600 hover:underline mt-4 inline-block">
            Upload your first file
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {files.map((file) => (
            <div key={file.name} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="mb-2 truncate">
                <span className="font-medium">File:</span> {file.name}
              </div>
              <div className="mb-4 text-sm text-gray-500">
                {new Date(file.uploadedAt).toLocaleString()}
              </div>
              <div className="flex space-x-2">
                <a
                  href={file.publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors text-sm"
                >
                  Download
                </a>
                <button
                  onClick={() => handleDeleteClick(file.name)}
                  disabled={deleting === file.name}
                  className="flex-1 text-center bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors text-sm disabled:bg-red-400"
                >
                  {deleting === file.name ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {showConfirm && (
        <ConfirmDialog
            onConfirm={handleDeleteConfirm}
            onCancel={() => setShowConfirm(false)}
            message={`Are you sure you want to delete ${fileToDelete}?`}
        />
        )}
    </div>
  );
}