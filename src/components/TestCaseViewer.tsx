import { useState } from 'react';
import { TestCase, Screenshot } from '@/types';

interface TestCaseViewerProps {
    testCase: TestCase;
    onStatusChange: (status: 'approved' | 'rejected', notes?: string) => void;
}

export default function TestCaseViewer({ testCase, onStatusChange }: TestCaseViewerProps) {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
    const [isCapturing, setIsCapturing] = useState(false);
    const [notes, setNotes] = useState('');
    const [stepResults, setStepResults] = useState<{ [key: number]: 'pass' | 'fail' | 'pending' }>({});
    const [iframeKey, setIframeKey] = useState(0);

    const currentStep = testCase.steps[currentStepIndex];
    const isLastStep = currentStepIndex === testCase.steps.length - 1;
    const isFirstStep = currentStepIndex === 0;

    const captureScreenshot = async () => {
        setIsCapturing(true);
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: true
            });

            const video = document.createElement('video');
            video.srcObject = stream;
            video.play();

            video.addEventListener('loadedmetadata', () => {
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;

                const ctx = canvas.getContext('2d');
                ctx?.drawImage(video, 0, 0);

                const screenshot = canvas.toDataURL('image/png');

                setScreenshots(prev => [
                    ...prev.filter(s => s.stepIndex !== currentStepIndex),
                    {
                        step: currentStep,
                        screenshot: screenshot.split(',')[1],
                        stepIndex: currentStepIndex
                    }
                ]);

                stream.getTracks().forEach(track => track.stop());
                setIsCapturing(false);
            });
        } catch (error) {
            console.error('Error capturing screenshot:', error);
            alert('Screenshot capture failed. Make sure to select the browser window/tab with your ATS when prompted.');
            setIsCapturing(false);
        }
    };

    const markStepResult = (result: 'pass' | 'fail') => {
        setStepResults(prev => ({
            ...prev,
            [currentStepIndex]: result
        }));
    };

    const nextStep = () => {
        if (!isLastStep) {
            setCurrentStepIndex(prev => prev + 1);
        }
    };

    const prevStep = () => {
        if (!isFirstStep) {
            setCurrentStepIndex(prev => prev - 1);
        }
    };

    const getCurrentScreenshot = () => {
        return screenshots.find(s => s.stepIndex === currentStepIndex);
    };

    const handleFinalDecision = (decision: 'approved' | 'rejected') => {
        const failedSteps = Object.entries(stepResults)
            .filter(([, result]) => result === 'fail')
            .map(([index]) => parseInt(index) + 1);

        let finalNotes = notes;
        if (failedSteps.length > 0) {
            finalNotes += `\n\nFailed steps: ${failedSteps.join(', ')}`;
        }

        onStatusChange(decision, finalNotes);
    };

    const openInNewWindow = () => {
        window.open(testCase.url, 'ats-window', 'width=1200,height=800');
    };

    const refreshIframe = () => {
        setIframeKey(prev => prev + 1);
    };

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Left Panel - ATS Website */}
            <div className="w-2/3 bg-white border-r border-gray-300 flex flex-col">
                <div className="bg-gray-800 text-white p-3 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <h3 className="font-semibold">Your ATS</h3>
                        <span className="text-sm text-gray-300">{testCase.url}</span>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={refreshIframe}
                            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
                        >
                            Refresh
                        </button>
                        <button
                            onClick={openInNewWindow}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-sm"
                        >
                            Open in New Window
                        </button>
                    </div>
                </div>

                <div className="flex-1 relative">
                    <iframe
                        key={iframeKey}
                        src={testCase.url}
                        className="w-full h-full border-0"
                        title="ATS Website"
                        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
                    />
                    <div className="absolute bottom-4 left-4 bg-yellow-100 border border-yellow-400 p-2 rounded text-sm">
                        If the site does not load in iframe, use &quot;Open in New Window&quot; button above
                    </div>
                </div>
            </div>

            {/* Right Panel - Test Case Steps & Controls */}
            <div className="w-1/3 bg-white flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">{testCase.title}</h2>
                    <div className="text-sm text-gray-600">
                        Step {currentStepIndex + 1} of {testCase.steps.length}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div
                            className="bg-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${((currentStepIndex + 1) / testCase.steps.length) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Current Step */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="font-semibold text-blue-800 mb-2">
                            Step {currentStepIndex + 1}
                        </h3>
                        <p className="text-blue-700">{currentStep}</p>
                    </div>

                    {/* Instructions */}
                    <div className="bg-gray-50 rounded-lg p-3">
                        <h4 className="font-semibold text-gray-700 mb-2 text-sm">Instructions:</h4>
                        <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
                            <li>Perform the step in the ATS (left side)</li>
                            <li>Click Capture Screenshot</li>
                            <li>Select the ATS browser window/tab</li>
                            <li>Mark pass/fail and continue</li>
                        </ol>
                    </div>

                    {/* Screenshot Button */}
                    <button
                        onClick={captureScreenshot}
                        disabled={isCapturing}
                        className={`w-full py-3 px-4 rounded-lg font-semibold ${isCapturing
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-blue-500 hover:bg-blue-600 text-white'
                            }`}
                    >
                        {isCapturing ? 'Capturing...' : 'Capture Screenshot'}
                    </button>

                    {/* Screenshot Preview */}
                    {getCurrentScreenshot() && (
                        <div className="border rounded-lg p-2">
                            <div className="text-sm font-medium text-gray-700 mb-2">Screenshot:</div>
                            <img
                                src={`data:image/png;base64,${getCurrentScreenshot()?.screenshot}`}
                                alt={`Step ${currentStepIndex + 1}`}
                                className="w-full rounded border"
                            />
                        </div>
                    )}

                    {/* Pass/Fail Buttons */}
                    {getCurrentScreenshot() && (
                        <div className="flex gap-2">
                            <button
                                onClick={() => markStepResult('pass')}
                                className={`flex-1 py-2 px-3 rounded ${stepResults[currentStepIndex] === 'pass'
                                        ? 'bg-green-500 text-white'
                                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                                    }`}
                            >
                                Pass
                            </button>
                            <button
                                onClick={() => markStepResult('fail')}
                                className={`flex-1 py-2 px-3 rounded ${stepResults[currentStepIndex] === 'fail'
                                        ? 'bg-red-500 text-white'
                                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                                    }`}
                            >
                                Fail
                            </button>
                        </div>
                    )}

                    {/* Step Indicators */}
                    <div className="flex gap-1 justify-center py-2">
                        {testCase.steps.map((step, index) => (
                            <div
                                key={index}
                                className={`w-3 h-3 rounded-full ${index === currentStepIndex
                                        ? 'bg-blue-500'
                                        : stepResults[index] === 'pass'
                                            ? 'bg-green-500'
                                            : stepResults[index] === 'fail'
                                                ? 'bg-red-500'
                                                : 'bg-gray-300'
                                    }`}
                                title={step}
                            />
                        ))}
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Notes (optional)
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded text-sm"
                            rows={3}
                            placeholder="Add any observations..."
                        />
                    </div>
                </div>

                {/* Footer - Navigation & Actions */}
                <div className="border-t border-gray-200 p-4 space-y-3">
                    {/* Navigation */}
                    <div className="flex justify-between">
                        <button
                            onClick={prevStep}
                            disabled={isFirstStep}
                            className={`px-4 py-2 rounded ${isFirstStep
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                                }`}
                        >
                            Previous
                        </button>
                        <button
                            onClick={nextStep}
                            disabled={isLastStep}
                            className={`px-4 py-2 rounded ${isLastStep
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                                }`}
                        >
                            Next
                        </button>
                    </div>

                    {/* Final Decision */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleFinalDecision('rejected')}
                            className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded font-semibold"
                        >
                            Reject
                        </button>
                        <button
                            onClick={() => handleFinalDecision('approved')}
                            className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded font-semibold"
                        >
                            Approve
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}