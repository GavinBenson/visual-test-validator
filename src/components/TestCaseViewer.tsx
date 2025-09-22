import { useState, useEffect } from 'react';
import { TestCase, Screenshot } from '@/types';

interface TestCaseViewerProps {
    testCase: TestCase;
    onStatusChange: (status: 'approved' | 'rejected') => void;
}

export default function TestCaseViewer({ testCase, onStatusChange }: TestCaseViewerProps) {
    const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (testCase) {
            captureScreenshots();
        }
    }, [testCase]);

    const captureScreenshots = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/screenshot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: testCase.url,
                    steps: testCase.steps
                })
            });

            if (!response.ok) {
                throw new Error('Failed to capture screenshots');
            }

            const data = await response.json();
            setScreenshots(data.screenshots);
        } catch (err) {
            console.error('Error capturing screenshots:', err);
            setError('Failed to capture screenshots. Using mock data for demo.');

            // Fallback mock data
            setScreenshots([
                {
                    step: 'Demo Mode - Screenshots would appear here',
                    screenshot: ''
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="text-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <div>Capturing screenshots...</div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">{testCase.title}</h2>

            {error && (
                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6">
                    <p className="font-bold">Demo Mode</p>
                    <p>{error}</p>
                </div>
            )}

            <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-700 mb-2">Test Steps:</h3>
                    <ol className="list-decimal list-inside space-y-1">
                        {testCase.steps.map((step, index) => (
                            <li key={index} className="text-gray-600">{step}</li>
                        ))}
                    </ol>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-700 mb-2">Target URL:</h3>
                    <p className="text-blue-600 break-all">{testCase.url}</p>
                </div>

                {screenshots.map((item, index) => (
                    <div key={index} className="border rounded-lg p-4">
                        <div className="mb-3 font-medium text-gray-700">
                            Step {index + 1}: {item.step}
                        </div>
                        {item.screenshot ? (
                            <img
                                src={`data:image/png;base64,${item.screenshot}`}
                                alt={`Step ${index + 1}`}
                                className="max-w-full border rounded shadow-sm"
                            />
                        ) : (
                            <div className="bg-gray-100 h-64 rounded border-2 border-dashed border-gray-300 flex items-center justify-center">
                                <div className="text-gray-500 text-center">
                                    <div className="text-4xl mb-2">ScreenshotIcon</div>
                                    <div>Screenshot would appear here</div>
                                    <div className="text-sm">(Demo mode)</div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="sticky bottom-0 bg-white border-t pt-4 mt-8">
                <div className="flex justify-center space-x-4">
                    <button
                        onClick={() => onStatusChange('rejected')}
                        className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-lg font-semibold flex items-center gap-2"
                    >
                         Reject Test Case
                    </button>
                    <button
                        onClick={() => onStatusChange('approved')}
                        className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg font-semibold flex items-center gap-2"
                    >
                         Approve Test Case
                    </button>
                </div>
            </div>
        </div>
    );
}