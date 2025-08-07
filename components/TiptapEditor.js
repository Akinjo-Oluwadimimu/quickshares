"use client";
import { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { toast } from 'react-toastify';
import { Plugin, PluginKey } from 'prosemirror-state';
import { FaBold, FaItalic, FaHeading, FaListUl, FaLink, FaImage, FaSpinner } from 'react-icons/fa';

// Create unique plugin keys
const editorStateKey = new PluginKey('editorState');
const wordCountKey = new PluginKey('wordCount');

export default function TiptapEditor({ 
    onSave, 
    initialContent = '', 
    initialTitle = '', 
    isEditing = false, 
    onCancel,
    scrollToEditor }) {
  const [content, setContent] = useState(initialContent);
  const [title, setTitle] = useState(initialTitle);
  const [isSaving, setIsSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      // Custom state plugin
      new Plugin({
        key: editorStateKey,
        state: {
          init: () => ({ lastUpdated: Date.now() }),
          apply: (tr, value) => {
            return { lastUpdated: Date.now() };
          }
        }
      }),
      // Word count plugin
      new Plugin({
        key: wordCountKey,
        state: {
          init: () => ({ count: 0 }),
          apply: (tr, value) => {
            if (!tr.docChanged) return value;
            const text = tr.doc.textBetween(0, tr.doc.content.size, ' ', ' ');
            return { count: text.split(/\s+/).filter(Boolean).length };
          }
        }
      })
    ],
    immediatelyRender: false,
    content: initialContent,
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML());
      console.log({
        editorState: editor.storage[editorStateKey],
        wordCount: editor.storage[wordCountKey]
      });
    },
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-xl m-5 focus:outline-none min-h-[200px]',
      },
    },
  });

  useEffect(() => {
    if (editor && initialContent !== content) {
      editor.commands.setContent(initialContent);
      setContent(initialContent);
      setTitle(initialTitle);  // Also update the title when editing
    }
  }, [initialContent, initialTitle, editor]);

  useEffect(() => {
    if (scrollToEditor && editor) {
      document.getElementById('editor-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [scrollToEditor, editor]);

  const addImage = () => {
    const url = window.prompt('Enter the URL of the image:');
    if (url) {
      editor?.chain().focus().setImage({ src: url }).run();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave({ title, content });
      toast.success('Post saved successfully!');
      if (!isEditing) {
        setContent('');
        setTitle('');
        editor?.commands.clearContent();
      }
    } catch (error) {
      toast.error('Failed to save post');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="h-[300px] flex items-center justify-center">
          Loading editor...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8" id="editor-section">
      <h2 className="text-xl font-bold mb-4">{isEditing ? 'Edit Post' : 'Create New Post'}</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Content</label>
          <div className="border border-gray-300 rounded-lg p-4 min-h-[300px]">
            {!editor ? (
              <div>Loading editor...</div>
            ) : (
              <>
                <div className="flex flex-wrap gap-2 mb-4">
                  <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        className={`p-2 rounded ${editor?.isActive('bold') ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                        title="Bold"
                    >
                        <FaBold className="h-5 w-5" />
                    </button>
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        className={`p-2 rounded ${editor?.isActive('italic') ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                        title="Italic"
                    >
                        <FaItalic className="h-5 w-5" />
                    </button>
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                        className={`p-2 rounded ${editor?.isActive('heading', { level: 1 }) ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                        title="Heading"
                    >
                        <FaHeading className="h-5 w-5" />
                    </button>
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        className={`p-2 rounded ${editor?.isActive('bulletList') ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                        title="Bullet List"
                    >
                        <FaListUl className="h-5 w-5" />
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                        const previousUrl = editor.getAttributes('link').href;
                        const url = window.prompt('URL', previousUrl);
                        if (url === null) return;
                        if (url === '') {
                            editor.chain().focus().extendMarkRange('link').unsetLink().run();
                            return;
                        }
                        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
                        }}
                        className={`p-2 rounded ${editor?.isActive('link') ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                        title="Link"
                    >
                        <FaLink className="h-5 w-5" />
                    </button>
                    <button
                        type="button"
                        onClick={addImage}
                        className="p-2 rounded hover:bg-gray-100"
                        title="Image"
                    >
                        <FaImage className="h-5 w-5" />
                    </button>
                </div>
                <EditorContent editor={editor} />
              </>
            )}
          </div>
        </div>
        <div className="flex justify-end space-x-2">
          {isEditing && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
              disabled={isSaving}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-400 flex items-center"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {isEditing ? 'Updating...' : 'Posting...'}
              </>
            ) : (
              isEditing ? 'Update' : 'Post'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}