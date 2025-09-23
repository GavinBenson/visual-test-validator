'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import TestCaseViewer from '@/components/TestCaseViewer'
import { TestCase, Screenshot } from '@/types'

export default function ReviewPage() {
    const params = useParams()
    const testCaseIndex = parseInt(params.id as string)
    const [testCase, setTestCase] = useState<TestCase | null>(null)

    useEffect(() => {
        const stored = sessionStorage.getItem('testCases')
        if (stored) {
            const testCases = JSON.parse(stored) as TestCase[]
            setTestCase(testCases[testCaseIndex])
        }
    }, [testCaseIndex])

    const handleStatusChange = (
        status: 'approved' | 'rejected' | 'pending',
        notes?: string,
        stepResults?: { [key: number]: 'pass' | 'fail' | 'pending' },
        screenshots?: Screenshot[]
    ) => {
        if (window.opener) {
            window.opener.postMessage({
                type: 'TEST_CASE_UPDATE',
                index: testCaseIndex,
                status,
                notes,
                stepResults,
                screenshots
            }, '*')
        }

        window.close()
    }

    if (!testCase) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-gray-600">Loading test case...</div>
            </div>
        )
    }

    return <TestCaseViewer testCase={testCase} onStatusChange={handleStatusChange} />
}