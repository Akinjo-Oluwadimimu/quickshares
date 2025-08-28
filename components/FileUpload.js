"use client"; 
import { useState, useRef } from 'react'
import Link from 'next/link';
import axios from 'axios'
import { FaTrash, FaCheckCircle, FaUpload, FaTimes } from 'react-icons/fa'

export default function FileUpload() {
  const [files, setFiles] = useState([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({})
  const [uploadResults, setUploadResults] = useState([])
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files)
    if (selectedFiles.length > 0) {
      setFiles(prev => [...prev, ...selectedFiles])
      setError(null)
    }
  }

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (files.length === 0) {
      setError('Please select at least one file first')
      return
    }

    setIsUploading(true)
    setUploadProgress({})
    setError(null)
    setUploadResults([])

    try {
      const uploadPromises = files.map(async (file, index) => {
        const formData = new FormData()
        formData.append('file', file)

        const response = await axios.post('/api/upload', formData, {
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            )
            setUploadProgress(prev => ({
              ...prev,
              [index]: percentCompleted
            }))
          },
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })

        return response.data
      })

      const results = await Promise.all(uploadPromises)
      setUploadResults(results)
      
    } catch (err) {
      console.error('Upload failed:', err)
      setError(err.response?.data?.error || 'Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const resetForm = () => {
    setFiles([])
    setUploadResults([])
    setError(null)
    setUploadProgress({})
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const completedUploads = uploadResults.length
  const totalFiles = files.length

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Multiple File Upload</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="file"
            onChange={handleFileChange}
            ref={fileInputRef}
            multiple
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
            disabled={isUploading}
          />
          <p className="text-sm text-gray-500 mt-1">Select multiple files to upload at once</p>
        </div>
        
        {files.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-medium text-gray-700">Selected Files ({files.length})</h3>
            {files.map((file, index) => (
              <div key={`${file.name}-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                {!isUploading && (
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="ml-2 p-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded"
                  >
                    <FaTimes className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        
        {isUploading && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">
                Uploading {completedUploads} of {totalFiles} files...
              </span>
              <span className="text-sm text-gray-500">
                {Math.round((completedUploads / totalFiles) * 100)}% overall
              </span>
            </div>
            {files.map((file, index) => (
              <div key={index} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="truncate">{file.name}</span>
                  <span>{uploadProgress[index] || 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${uploadProgress[index] || 0}%` }}
                  ></div>
                </div>
              </div>
            ))}
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
            disabled={isUploading || files.length === 0}
            className={`px-4 py-2 rounded-md text-white font-medium flex items-center ${
              isUploading || files.length === 0
                ? 'bg-blue-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <FaUpload className="mr-2 h-4 w-4" />
            {isUploading ? `Uploading... (${completedUploads}/${totalFiles})` : `Upload ${files.length} File${files.length !== 1 ? 's' : ''}`}
          </button>
          
          {(uploadResults.length > 0 || error) && (
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 font-medium flex items-center"
            >
              <FaTrash className="mr-2 h-4 w-4" />
              Reset
            </button>
          )}
        </div>
      </form>
      
      {uploadResults.length > 0 && (
        <div className="mt-6 space-y-4">
          <div className="bg-green-50 p-4 rounded-md">
            <h3 className="text-lg font-medium text-green-800 mb-2 flex items-center">
              <FaCheckCircle className="mr-2 h-5 w-5" />
              Upload Successful! ({uploadResults.length} file{uploadResults.length !== 1 ? 's' : ''})
            </h3>
          </div>
          
          <div className="space-y-3">
            {uploadResults.map((result, index) => (
              <div key={index} className="border rounded-lg p-4 bg-white">
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">File Name:</span> {result.fileName}</p>
                  <p><span className="font-medium">File Size:</span> {(result.size / 1024).toFixed(2)} KB</p>
                  <p><span className="font-medium">Type:</span> {result.mimetype}</p>
                  
                  {result.publicUrl && (
                    <div className="mt-2">
                      <a 
                        href={result.publicUrl} 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        View File
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-center pt-4">
            <Link 
              href="/files" 
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
            >
              View All Files
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}