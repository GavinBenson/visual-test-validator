'use client'
import { useState, useEffect } from 'react'
import FileUpload from '@/components/FileUpload'
import { TestCase, Screenshot } from '@/types'

export default function Home() {
    const [testCases, setTestCases] = useState<TestCase[]>([])
    const [reviewedCount, setReviewedCount] = useState(0)
    const [atsUrl, setAtsUrl] = useState('https://admin.applicantpro.com')

    // Listen for messages from popup windows
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data.type === 'TEST_CASE_UPDATE') {
                const { index, status, notes, stepResults, screenshots } = event.data;

                const updatedCases = [...testCases];
                const previousStatus = updatedCases[index].status;

                updatedCases[index].status = status;
                updatedCases[index].notes = notes;
                updatedCases[index].stepResults = stepResults;
                updatedCases[index].screenshots = screenshots;

                setTestCases(updatedCases);

                // Save to sessionStorage so it persists when reopening
                sessionStorage.setItem('testCases', JSON.stringify(updatedCases));

                if (previousStatus === 'pending' && status !== 'pending') {
                    setReviewedCount(prev => prev + 1);
                }
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [testCases]);

    const handleTestCasesUploaded = (cases: TestCase[]) => {
        // Explicitly preserve all fields including expectedResults
        const casesWithUrl = cases.map(tc => ({
            id: tc.id,
            title: tc.title,
            description: tc.description,
            steps: tc.steps,
            expectedResults: tc.expectedResults, // Explicitly include this
            status: tc.status,
            url: atsUrl,
            preconditions: tc.preconditions,
            postconditions: tc.postconditions,
            notes: tc.notes,
            stepResults: tc.stepResults,
            screenshots: tc.screenshots
        }))

        setTestCases(casesWithUrl)
        sessionStorage.setItem('testCases', JSON.stringify(casesWithUrl))
        setReviewedCount(0)
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

    const openTestCaseReview = (index: number) => {
        const screenWidth = window.screen.availWidth;
        const screenHeight = window.screen.availHeight;
        const validatorWidth = Math.floor(screenWidth * 0.5);

        window.open(
            `/review/${index}`,
            `validator-${index}`,
            `width=${validatorWidth},height=${screenHeight},left=${validatorWidth},top=0,scrollbars=yes`
        );
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
                            onClick={() => openTestCaseReview(index)}
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