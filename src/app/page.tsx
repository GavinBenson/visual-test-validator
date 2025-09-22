'use client'
import { useState } from 'react'
import FileUpload from '@/components/FileUpload'
import TestCaseViewer from '@/components/TestCaseViewer'
import { TestCase } from '@/types'

export default function Home() {
    const [testCases, setTestCases] = useState<TestCase[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [reviewedCount, setReviewedCount] = useState(0)

    const handleTestCasesUploaded = (cases: TestCase[]) => {
        setTestCases(cases)
        setCurrentIndex(0)
        setReviewedCount(0)
    }

    const handleStatusChange = (status: 'approved' | 'rejected') => {
        if (testCases.length === 0) return

        const updatedCases = [...testCases]
        updatedCases[currentIndex].status = status
        setTestCases(updatedCases)
        setReviewedCount(prev => prev + 1)

        // Move to next test case
        if (currentIndex < testCases.length - 1) {
            setCurrentIndex(prev => prev + 1)
        }
    }

    const navigateToCase = (index: number) => {
        setCurrentIndex(index)
    }

    const exportApproved = async () => {
        const approved = testCases.filter(tc => tc.status === 'approved')

        const csv = [
            'id,title,steps,url,status',
            ...approved.map(tc =>
                `"${tc.id}","${tc.title}","${tc.steps.join('\\n')}","${tc.url}","${tc.status}"`
            )
        ].join('\n')

        const blob = new Blob([csv], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'approved-test-cases.csv'
        a.click()
    }

    const currentTestCase = testCases[currentIndex]

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-8">
                <header className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">
                        Visual Test Case Validator
                    </h1>
                    <p className="text-gray-600">
                        Review AI-generated test cases with visual validation
                    </p>
                </header>

                {testCases.length === 0 ? (
                    <FileUpload onTestCasesUploaded={handleTestCasesUploaded} />
                ) : (
                    <>
                        {/* Progress Bar */}
                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-gray-600">
                                    Progress: {reviewedCount}/{testCases.length} reviewed
                                </span>
                                <button
                                    onClick={exportApproved}
                                    className="bg-blue-500 text-white px-4 py-2 rounded text-sm hover:bg-blue-600"
                                >
                                    Export Approved
                                </button>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-green-500 h-2 rounded-full transition-all"
                                    style={{ width: `${(reviewedCount / testCases.length) * 100}%` }}
                                />
                            </div>
                        </div>

                        {/* Navigation */}
                        <div className="mb-4 flex gap-2 flex-wrap">
                            {testCases.map((tc, index) => (
                                <button
                                    key={tc.id}
                                    onClick={() => navigateToCase(index)}
                                    className={`px-3 py-1 rounded text-sm ${index === currentIndex
                                            ? 'bg-blue-500 text-white'
                                            : tc.status === 'pending'
                                                ? 'bg-gray-200 text-gray-700'
                                                : tc.status === 'approved'
                                                    ? 'bg-green-200 text-green-800'
                                                    : 'bg-red-200 text-red-800'
                                        }`}
                                >
                                    {index + 1}
                                </button>
                            ))}
                        </div>

                        {/* Current Test Case */}
                        {currentTestCase && (
                            <TestCaseViewer
                                testCase={currentTestCase}
                                onStatusChange={handleStatusChange}
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    )
}