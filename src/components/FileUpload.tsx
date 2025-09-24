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
                id: '127',
                title: 'Admin Login Page - Successful Login with Valid Credentials',
                steps: [
                    'Navigate to the Admin Login Page',
                    'Enter a valid admin username in the Username field',
                    'Enter the correct password in the Password field',
                    'Click the Login button'
                ],
                url: 'https://demo.isolved.com',
                status: 'pending'
            },
            {
                id: '128',
                title: 'Admin Login Page - Unsuccessful Login with Invalid Credentials',
                steps: [
                    'Navigate to the Admin Login Page',
                    'Enter a valid username',
                    'Enter an invalid Password',
                    'Click the Login button'
                ],
                url: 'https://demo.isolved.com',
                status: 'pending'
            },
            {
                id: '129',
                title: 'Admin Login Page - Account Lockout After Multiple Failed Attempts',
                steps: [
                    'Navigate to the Admin Login Page',
                    'Enter a valid username and an invalid password',
                    'Repeat step 2 for the maximum allowed failed attempts (5 times)',
                    'Attempt to log in again with the correct password'
                ],
                url: 'https://demo.isolved.com',
                status: 'pending'
            },
            {
                id: '130',
                title: 'Admin Login Page - Password Reset Link Functionality',
                steps: [
                    'Navigate to the Admin Login Page',
                    'Click the Forgot Password link',
                    'Enter the registered email address',
                    'Submit the password reset request'
                ],
                url: 'https://demo.isolved.com',
                status: 'pending'
            },
            {
                id: '133',
                title: 'Admin Login Page - 2FA Prompt on Login',
                steps: [
                    'Navigate to the Admin Login Page',
                    'Enter valid username and password',
                    'Click Login'
                ],
                url: 'https://demo.isolved.com',
                status: 'pending'
            },
            {
                id: '134',
                title: 'Admin Login Page - Successful 2FA Code Entry',
                steps: [
                    'Complete steps to reach the 2FA prompt',
                    'Enter a valid 2FA code',
                    'Click Submit or equivalent button'
                ],
                url: 'https://demo.isolved.com',
                status: 'pending'
            },
            {
                id: '142',
                title: 'Admin Login Page - Session Timeout After Login',
                steps: [
                    'Log in as admin',
                    'Remain inactive for the session timeout period',
                    'Attempt to perform any action'
                ],
                url: 'https://demo.isolved.com',
                status: 'pending'
            },
            {
                id: '144',
                title: 'Admin Login Page - Responsive Design on Mobile Devices',
                steps: [
                    'Open the Admin Login Page on a mobile device or emulator',
                    'Attempt to log in and complete 2FA',
                    'Verify layout, input fields, and buttons are usable'
                ],
                url: 'https://demo.isolved.com',
                status: 'pending'
            },
            {
                id: '145',
                title: 'Admin Login Page - Security: SSL/TLS Enforcement',
                steps: [
                    'Attempt to access the Admin Login Page via HTTP',
                    'Attempt to access via HTTPS',
                    'Attempt to submit credentials over HTTP'
                ],
                url: 'https://demo.isolved.com',
                status: 'pending'
            },
            {
                id: '149',
                title: 'Admin Login Page - Edge Case: Special Characters in Credentials',
                steps: [
                    'Enter a username and password with special characters',
                    'Attempt to log in'
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
                        Load Sample Data (10 Admin Login Test Cases)
                    </button>
                </div>

                <div className="mt-6 text-xs text-gray-500">
                    <p>Expected CSV format:</p>
                    <code className="block bg-gray-100 p-2 mt-1 text-xs">
                        id,title,steps,url<br />
                        1,&quot;Login Test&quot;,&quot;Step 1\nStep 2&quot;,&quot;https://example.com&quot;
                    </code>
                </div>
            </div>
        </div>
    )
}