import Head from 'next/head'
import FileUpload from '../components/FileUpload'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <Head>
        <title>File Upload with Supabase</title>
        <meta name="description" content="Upload files to Supabase Storage" />
      </Head>
      
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">
          Serverless File Upload
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Upload files directly to Supabase Storage from your browser
        </p>
        
        <FileUpload />
        
        <div className="mt-12 p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">How it works</h2>
          <ul className="list-disc pl-5 space-y-2 text-gray-700">
            <li>Select a file from your device (max 10MB)</li>
            <li>Click "Upload File" to send it to our serverless API</li>
            <li>The file is securely stored in Supabase Storage</li>
            <li>You'll receive a URL to access your uploaded file</li>
          </ul>
        </div>
      </div>
    </div>
  )
}