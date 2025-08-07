"use client";
import { createClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import TiptapEditor from '@/components/TiptapEditor';
import ConfirmDialog from '@/components/ConfirmDialog';
import { toast } from 'react-toastify';
import { FaCopy, FaEdit, FaTrash, FaSpinner } from 'react-icons/fa';
import 'react-toastify/dist/ReactToastify.css';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function TextPosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('text_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async ({ title, content }) => {
    try {
      if (editingPost) {
        const { error } = await supabase
          .from('text_posts')
          .update({ title, content, updated_at: new Date() })
          .eq('id', editingPost.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('text_posts')
          .insert([{ title, content }]);
        
        if (error) throw error;
      }
      await fetchPosts();
      setEditingPost(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = () => {
    // Scroll to editor section
    document.getElementById('editor-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDelete = async () => {
    if (!postToDelete) return;
    try {
      setIsDeleting(true);
      const { error } = await supabase
        .from('text_posts')
        .delete()
        .eq('id', postToDelete);
      
      if (error) throw error;
      await fetchPosts();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsDeleting(false);
      setPostToDelete(null);
      setShowConfirm(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text.replace(/<[^>]*>/g, ''));
    toast.success('Content copied to clipboard!');
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  if (loading) {
    return <div className="text-center py-8">Loading posts...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Text Posts</h1>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <TiptapEditor 
        onSave={handleSave} 
        initialContent={editingPost?.content || ''}
        initialTitle={editingPost?.title || ''}
        isEditing={!!editingPost}
        onCancel={() => setEditingPost(null)}
      />

      <div className="space-y-6">
        {posts.map((post) => (
          <div key={post.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold">{post.title}</h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => copyToClipboard(post.content)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                  title="Copy to clipboard"
                >
                  <FaCopy className="h-5 w-5" />
                </button>
                <button
                  onClick={() => {
                    setEditingPost(post);
                    handleEdit();
                  }}
                  className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded"
                  title="Edit"
                >
                  <FaEdit className="h-5 w-5" />
                </button>
                <button
                  onClick={() => {
                    setPostToDelete(post.id);
                    setShowConfirm(true);
                  }}
                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                  title="Delete"
                >
                  {isDeleting ? (
                    <FaSpinner className="h-5 w-5 animate-spin" />
                    ) : (
                    <FaTrash className="h-5 w-5" />
                    )}
                </button>
              </div>
            </div>
            <div className="text-sm text-gray-500 mb-4">
              Posted: {new Date(post.created_at).toLocaleString()}
              {post.updated_at && post.updated_at !== post.created_at && (
                <span className="ml-2">(Edited: {new Date(post.updated_at).toLocaleString()})</span>
              )}
            </div>
            <div 
              className="prose max-w-none overflow-y-auto max-h-96 border-t border-gray-300 pt-4"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </div>
        ))}
      </div>

      {showConfirm && (
        <ConfirmDialog
          onConfirm={handleDelete}
          onCancel={() => !isDeleting && setShowConfirm(false)}
          message="Are you sure you want to delete this post?"
          confirmText={isDeleting ? 'Deleting...' : 'Delete'}
          isLoading={isDeleting}
        />
      )}
    </div>
  );
}