import { useState } from 'react'
import { TestCase } from '@/types'

interface FileUploadProps {
    onTestCasesUploaded: (testCases: TestCase[]) => void
}

export default function FileUpload({ onTestCasesUploaded }: FileUploadProps) {
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        setUploading(true)
        setError(null)

        try {
            const formData = new FormData()
            formData.append('file', file)

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            })

            if (!response.ok) {
                throw new Error('Upload failed')
            }

            const data = await response.json()
            onTestCasesUploaded(data.testCases)
        } catch (err) {
            setError('Failed to upload file. Please try again.')
            console.error('Upload error:', err)
        } finally {
            setUploading(false)
        }
    }

    // Sample data for demo
    const loadSampleData = () => {
        const sampleTestCases: TestCase[] = [
            {
                id: '1',
                title: 'Login Functionality Test',
                steps: [
                    'Navigate to login page',
                    'Enter valid username',
                    'Enter valid password',
                    'Click login button',
                    'Verify successful login'
                ],
                url: 'https://demo.isolved.com',
                status: 'pending'
            },
            {
                id: '2',
                title: 'Job Search Test',
                steps: [
                    'Click on job search',
                    'Enter job title "Software Developer"',
                    'Select location "Portland, OR"',
                    'Click search button',
                    'Verify results display'
                ],
                url: 'https://demo.isolved.com',
                status: 'pending'
            }
        ]
        onTestCasesUploaded(sampleTestCases)
    }

    return (
        <div className="max-w-md mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8">
                <h2 className="text-2xl font-semibold mb-4 text-center">Upload Test Cases</h2>

                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Choose CSV file
                    </label>
                    <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileUpload}
                        disabled={uploading}
                        className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
                    />
                </div>

                {uploading && (
                    <div className="text-center text-blue-600 mb-4">
                        Uploading and processing...
                    </div>
                )}

                {error && (
                    <div className="text-red-600 text-sm mb-4 text-center">
                        {error}
                    </div>
                )}

                <div className="text-center">
                    <div className="text-sm text-gray-500 mb-4">Or</div>
                    <button
                        onClick={loadSampleData}
                        className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600"
                    >
                        Load Sample Data
                    </button>
                </div>

                <div className="mt-6 text-xs text-gray-500">
                    <p>Expected CSV format:</p>
                    <code className="block bg-gray-100 p-2 mt-1 text-xs">
                        id,title,steps,url<br />
                        1,"Login Test","Step 1\nStep 2","https://example.com"
                    </code>
                </div>
            </div>
        </div>
    )
}