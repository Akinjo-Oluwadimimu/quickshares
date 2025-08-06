"use client";
import { createClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import TiptapEditor from '@/components/TiptapEditor';
import ConfirmDialog from '@/components/ConfirmDialog';

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
    // Add toast notification here if desired
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
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                    <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                  </svg>
                </button>
                <button
                  onClick={() => setEditingPost(post)}
                  className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded"
                  title="Edit"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </button>
                <button
                  onClick={() => {
                    setPostToDelete(post.id);
                    setShowConfirm(true);
                  }}
                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                  title="Delete"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
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
              className="prose max-w-none overflow-y-auto max-h-96 border-t pt-4"
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