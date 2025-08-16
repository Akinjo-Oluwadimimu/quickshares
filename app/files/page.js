"use client";
import { createClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import ConfirmDialog from '@/components/ConfirmDialog';
import { FaChevronLeft, FaChevronRight, FaCopy, FaTrash, FaDownload } from 'react-icons/fa';

const ITEMS_PER_PAGE = 6; // Number of files per page

export default function FileList() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const { data, error, count } = await supabase
        .storage
        .from('quickshare-uploads')
        .list('user-uploads', {
          sortBy: { column: 'created_at', order: 'desc' },
          limit: ITEMS_PER_PAGE,
          offset: (currentPage - 1) * ITEMS_PER_PAGE
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
      
      // Calculate total pages (this might need adjustment based on your Supabase setup)
      const { data: countData } = await supabase
        .storage
        .from('quickshare-uploads')
        .list('user-uploads');
      
      setTotalPages(Math.ceil(countData.length / ITEMS_PER_PAGE));

    } catch (err) {
      console.error('Error fetching files:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [currentPage]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Uploaded Files</h1>

        <Link href="/" className="mb-6 inline-block text-blue-600 hover:underline">
          ← Back to Upload
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(ITEMS_PER_PAGE)].map((_, i) => (
            <div key={i} className="border border-gray-300 rounded-lg p-4">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="flex space-x-2">
                  <div className="p-2">
                    <div className="h-5 w-5 bg-gray-200 rounded"></div>
                  </div>
                  <div className="p-2">
                    <div className="h-5 w-5 bg-gray-200 rounded"></div>
                  </div>
                  <div className="p-2">
                    <div className="h-5 w-5 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
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
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {files.map((file) => (
              <div key={file.name} className="border border-gray-300 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="mb-2 truncate">
                  <span className="font-medium">File:</span> {file.name}
                </div>
                <div className="mb-4 text-sm text-gray-500">
                  {new Date(file.uploadedAt).toLocaleString()}
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => navigator.clipboard.writeText(file.publicUrl)}
                    className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
                    title="Copy URL"
                  >
                    <FaCopy className="h-5 w-5" />
                  </button>
                  <a
                    href={file.publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-green-600 hover:text-green-800 transition-colors"
                    title="Download"
                  >
                    <FaDownload className="h-5 w-5" />
                  </a>
                  <button
                    onClick={() => handleDeleteClick(file.name)}
                    disabled={deleting === file.name}
                    className="p-2 text-red-600 hover:text-red-800 transition-colors"
                    title="Delete"
                  >
                    {deleting === file.name ? (
                      <span className="animate-spin">⏳</span>
                    ) : (
                      <FaTrash className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="flex justify-center mt-8 space-x-4">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded ${currentPage === 1 ? 'bg-gray-200 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
            >
              <FaChevronLeft />
            </button>
            
            <div className="flex items-center">
              Page {currentPage} of {totalPages}
            </div>
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded ${currentPage === totalPages ? 'bg-gray-200 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
            >
              <FaChevronRight />
            </button>
          </div>
        </>
      )}

      {showConfirm && (
        <ConfirmDialog
          onConfirm={handleDeleteConfirm}
          onCancel={() => setShowConfirm(false)}
          message={`Are you sure you want to delete ${fileToDelete}?`}
          confirmText={deleting ? 'Deleting...' : 'Delete'}
          isLoading={deleting}
        />
      )}
    </div>
  );
}