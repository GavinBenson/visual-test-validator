import { useState, useEffect } from 'react';
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
    const [atsWindow, setAtsWindow] = useState<Window | null>(null);

    const currentStep = testCase.steps[currentStepIndex];
    const isLastStep = currentStepIndex === testCase.steps.length - 1;
    const isFirstStep = currentStepIndex === 0;

    useEffect(() => {
        // Get screen dimensions
        const screenWidth = window.screen.availWidth;
        const screenHeight = window.screen.availHeight;

        // Calculate positions for side-by-side layout
        const atsWidth = Math.floor(screenWidth * 0.6); // 60% for ATS
        const validatorWidth = Math.floor(screenWidth * 0.4); // 40% for validator

        // Position ATS on the left
        const popup = window.open(
            testCase.url,
            'ats-window',
            `width=${atsWidth},height=${screenHeight},left=0,top=0,scrollbars=yes`
        );
        setAtsWindow(popup);

        // Position validator on the right
        window.moveTo(atsWidth, 0);
        window.resizeTo(validatorWidth, screenHeight);

        return () => {
            // Clean up on unmount
            if (atsWindow && !atsWindow.closed) {
                atsWindow.close();
            }
        };
    }, []);

    const openAtsWindow = () => {
        if (atsWindow && !atsWindow.closed) {
            atsWindow.focus();
        } else {
            const screenWidth = window.screen.availWidth;
            const screenHeight = window.screen.availHeight;
            const atsWidth = Math.floor(screenWidth * 0.6);

            const popup = window.open(
                testCase.url,
                'ats-window',
                `width=${atsWidth},height=${screenHeight},left=0,top=0,scrollbars=yes`
            );
            setAtsWindow(popup);
        }
    };

    const captureScreenshot = async () => {
        setIsCapturing(true);

        // Don't switch focus - keep validator window active
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                preferCurrentTab: false
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

                // Keep validator focused
                window.focus();
            });
        } catch (error) {
            console.error('Error capturing screenshot:', error);
            alert('Screenshot capture failed. Make sure to select the ATS window when prompted.');
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
            // Keep focus on validator
            window.focus();
        }
    };

    const prevStep = () => {
        if (!isFirstStep) {
            setCurrentStepIndex(prev => prev - 1);
            // Keep focus on validator
            window.focus();
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

    return (
        <div className="h-screen bg-gray-50 overflow-y-auto">
            <div className="max-w-full p-4">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-lg p-4 mb-4 sticky top-0 z-10">
                    <h2 className="text-xl font-semibold text-gray-800 mb-3">{testCase.title}</h2>

                    <div className="flex items-center justify-between mb-3">
                        <div className="text-sm text-gray-600">
                            Step {currentStepIndex + 1} of {testCase.steps.length}
                        </div>
                        <button
                            onClick={openAtsWindow}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium"
                        >
                            Open/Focus ATS
                        </button>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${((currentStepIndex + 1) / testCase.steps.length) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Step Indicators */}
                <div className="flex gap-1 justify-center mb-4 flex-wrap">
                    {testCase.steps.map((step, index) => (
                        <div
                            key={index}
                            className={`w-3 h-3 rounded-full ${index === currentStepIndex
                                    ? 'bg-blue-500 ring-2 ring-blue-300'
                                    : stepResults[index] === 'pass'
                                        ? 'bg-green-500'
                                        : stepResults[index] === 'fail'
                                            ? 'bg-red-500'
                                            : 'bg-gray-300'
                                }`}
                            title={step.slice(0, 50)}
                        />
                    ))}
                </div>

                {/* Current Step */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-4">
                    <h3 className="font-semibold text-blue-800 mb-2 text-sm">
                        Step {currentStepIndex + 1}
                    </h3>
                    <p className="text-blue-700">{currentStep}</p>
                </div>

                {/* Instructions */}
                <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm">
                    <h4 className="font-semibold text-gray-700 mb-2">Instructions:</h4>
                    <ol className="list-decimal list-inside text-gray-600 space-y-1">
                        <li>Perform step in ATS window (left side)</li>
                        <li>Click Capture Screenshot</li>
                        <li>Select ATS window in popup</li>
                        <li>Mark Pass/Fail and continue</li>
                    </ol>
                </div>

                {/* Capture Button */}
                <button
                    onClick={captureScreenshot}
                    disabled={isCapturing}
                    className={`w-full py-3 px-4 rounded-lg font-semibold mb-4 ${isCapturing
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                        }`}
                >
                    {isCapturing ? 'Capturing...' : 'Capture Screenshot'}
                </button>

                {/* Screenshot Preview */}
                {getCurrentScreenshot() && (
                    <div className="bg-white rounded-lg shadow-lg p-3 mb-4">
                        <h3 className="font-semibold text-gray-700 mb-2 text-sm">Screenshot:</h3>
                        <img
                            src={`data:image/png;base64,${getCurrentScreenshot()?.screenshot}`}
                            alt={`Step ${currentStepIndex + 1}`}
                            className="w-full rounded border"
                        />
                    </div>
                )}

                {/* Pass/Fail Buttons */}
                {getCurrentScreenshot() && (
                    <div className="flex gap-2 mb-4">
                        <button
                            onClick={() => markStepResult('pass')}
                            className={`flex-1 py-2 px-3 rounded font-semibold ${stepResults[currentStepIndex] === 'pass'
                                    ? 'bg-green-500 text-white'
                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                                }`}
                        >
                            Pass
                        </button>
                        <button
                            onClick={() => markStepResult('fail')}
                            className={`flex-1 py-2 px-3 rounded font-semibold ${stepResults[currentStepIndex] === 'fail'
                                    ? 'bg-red-500 text-white'
                                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                                }`}
                        >
                            Fail
                        </button>
                    </div>
                )}

                {/* Navigation */}
                <div className="flex justify-between mb-4">
                    <button
                        onClick={prevStep}
                        disabled={isFirstStep}
                        className={`px-4 py-2 rounded font-medium ${isFirstStep
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                            }`}
                    >
                        Previous
                    </button>

                    <button
                        onClick={nextStep}
                        disabled={isLastStep}
                        className={`px-4 py-2 rounded font-medium ${isLastStep
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                            }`}
                    >
                        Next
                    </button>
                </div>

                {/* Notes */}
                <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notes (optional)
                    </label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded text-sm"
                        rows={3}
                        placeholder="Add observations..."
                    />
                </div>

                {/* Final Decision */}
                <div className="flex gap-3 pb-4">
                    <button
                        onClick={() => handleFinalDecision('rejected')}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-semibold"
                    >
                        Reject
                    </button>
                    <button
                        onClick={() => handleFinalDecision('approved')}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold"
                    >
                        Approve
                    </button>
                </div>
            </div>
        </div>
    );
}