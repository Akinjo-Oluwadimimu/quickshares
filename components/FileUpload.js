"use client"; 
import { useState, useRef } from 'react'
import Link from 'next/link';
import axios from 'axios'

export default function FileUpload() {
  const [file, setFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadResult, setUploadResult] = useState(null)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setFile(selectedFile)
      setError(null)
      setUploadResult(null)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!file) {
      setError('Please select a file first')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await axios.post('/api/upload', formData, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          )
          setUploadProgress(percentCompleted)
        },
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      setUploadResult(response.data)
    } catch (err) {
      console.error('Upload failed:', err)
      setError(err.response?.data?.error || 'Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const resetForm = () => {
    setFile(null)
    setUploadResult(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">File Upload</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="file"
            onChange={handleFileChange}
            ref={fileInputRef}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
            disabled={isUploading}
          />
        </div>
        
        {file && (
          <div className="p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-600">
              Selected: <span className="font-medium">{file.name}</span>
              <span className="ml-2 text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
            </p>
          </div>
        )}
        
        {isUploading && (
          <div className="pt-2">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Uploading... {uploadProgress}%
            </p>
          </div>
        )}
        
        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}
        
        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={isUploading || !file}
            className={`px-4 py-2 rounded-md text-white font-medium ${
              isUploading || !file
                ? 'bg-blue-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isUploading ? 'Uploading...' : 'Upload File'}
          </button>
          
          {(uploadResult || error) && (
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 font-medium"
            >
              Reset
            </button>
          )}
        </div>
      </form>
      
      {uploadResult && (
        <div className="mt-6 p-4 bg-green-50 rounded-md">
          <h3 className="text-lg font-medium text-green-800 mb-2">Upload Successful!</h3>
          <div className="space-y-2 text-sm text-gray-700">
            <p><span className="font-medium">File Name:</span> {uploadResult.fileName}</p>
            <p><span className="font-medium">File Size:</span> {(uploadResult.size / 1024).toFixed(2)} KB</p>
            <p><span className="font-medium">Type:</span> {uploadResult.mimetype}</p>
            
            {uploadResult.publicUrl && (
                <div className="mt-2 space-x-2">
                <a 
                    href={uploadResult.publicUrl} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                >
                    View File
                </a>
                <span>|</span>
                <Link href="/files" className="text-blue-600 hover:underline">
                    View All Files
                </Link>
                </div>
            //   <div className="mt-3">
            //     <p className="font-medium mb-1">File URL:</p>
            //     <a 
            //       href={uploadResult.publicUrl} 
            //       target="_blank" 
            //       rel="noopener noreferrer"
            //       className="text-blue-600 hover:underline break-all"
            //     >
            //       {uploadResult.publicUrl}
            //     </a>
            //   </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}