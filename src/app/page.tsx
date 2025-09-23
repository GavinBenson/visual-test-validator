'use client'
import { useState } from 'react'
import FileUpload from '@/components/FileUpload'
import TestCaseViewer from '@/components/TestCaseViewer'
import { TestCase, Screenshot } from '@/types'  // Add Screenshot here

export default function Home() {
    const [testCases, setTestCases] = useState<TestCase[]>([])
    const [selectedCaseIndex, setSelectedCaseIndex] = useState<number | null>(null)
    const [reviewedCount, setReviewedCount] = useState(0)
    const [atsUrl, setAtsUrl] = useState('https://admin.applicantpro.com')

    const handleTestCasesUploaded = (cases: TestCase[]) => {
        const casesWithUrl = cases.map(tc => ({ ...tc, url: atsUrl }))
        setTestCases(casesWithUrl)
        setSelectedCaseIndex(null)
        setReviewedCount(0)
    }

    const handleStatusChange = (
        status: 'approved' | 'rejected' | 'pending',
        notes?: string,
        stepResults?: { [key: number]: 'pass' | 'fail' | 'pending' },
        screenshots?: Screenshot[]
    ) => {
        if (selectedCaseIndex === null) return

        const updatedCases = [...testCases]
        const previousStatus = updatedCases[selectedCaseIndex].status

        updatedCases[selectedCaseIndex].status = status
        updatedCases[selectedCaseIndex].notes = notes
        updatedCases[selectedCaseIndex].stepResults = stepResults
        updatedCases[selectedCaseIndex].screenshots = screenshots

        setTestCases(updatedCases)

        // Only increment if status changed from 'pending' to 'approved' or 'rejected'
        if (previousStatus === 'pending' && status !== 'pending') {
            setReviewedCount(prev => prev + 1)
        }

        setSelectedCaseIndex(null)
    }

    const exportResults = async () => {
        const csv = [
            'id,title,status,notes',
            ...testCases.map(tc =>
                `"${tc.id}","${tc.title}","${tc.status}","${tc.notes || ''}"`
            )
        ].join('\n')

        const blob = new Blob([csv], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'test-case-review-results.csv'
        a.click()
    }

    if (testCases.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 p-8">
                <div className="max-w-4xl mx-auto">
                    <header className="text-center mb-8">
                        <h1 className="text-4xl font-bold text-gray-800 mb-2">
                            Visual Test Case Validator
                        </h1>
                        <p className="text-gray-600">
                            Review Qase test cases with interactive screenshot validation
                        </p>
                    </header>

                    <div className="bg-white rounded-lg shadow p-6 mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            ATS URL
                        </label>
                        <input
                            type="url"
                            value={atsUrl}
                            onChange={(e) => setAtsUrl(e.target.value)}
                            placeholder="https://admin.applicantpro.com"
                            className="w-full p-3 border border-gray-300 rounded-lg text-gray-900"
                        />
                    </div>

                    <FileUpload onTestCasesUploaded={handleTestCasesUploaded} />
                </div>
            </div>
        )
    }

    if (selectedCaseIndex !== null) {
        return <TestCaseViewer
            testCase={testCases[selectedCaseIndex]}
            onStatusChange={handleStatusChange}
        />
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto">
                <header className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">
                        Select Test Case to Review
                    </h1>
                </header>

                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">
                            Progress: {reviewedCount}/{testCases.length} reviewed
                        </span>
                        <button
                            onClick={exportResults}
                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                        >
                            Export Results
                        </button>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-green-500 h-2 rounded-full transition-all"
                            style={{ width: `${(reviewedCount / testCases.length) * 100}%` }}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {testCases.map((tc, index) => (
                        <div
                            key={tc.id}
                            className={`bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow ${tc.status === 'approved' ? 'border-l-4 border-green-500' :
                                    tc.status === 'rejected' ? 'border-l-4 border-red-500' : ''
                                }`}
                            onClick={() => setSelectedCaseIndex(index)}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-sm font-mono text-gray-500">{tc.id}</span>
                                {tc.status !== 'pending' && (
                                    <span className={`text-sm px-2 py-1 rounded ${tc.status === 'approved'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                        }`}>
                                        {tc.status}
                                    </span>
                                )}
                            </div>
                            <h3 className="font-semibold text-gray-800 mb-2">{tc.title}</h3>
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                {tc.description}
                            </p>
                            <div className="text-sm text-gray-500">
                                {tc.steps.length} steps
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}