import { useState, useEffect } from 'react';
import { TestCase, Screenshot } from '@/types';

interface TestCaseViewerProps {
    testCase: TestCase;
    onStatusChange: (
        status: 'approved' | 'rejected' | 'pending', 
        notes?: string,
        stepResults?: { [key: number]: 'pass' | 'fail' | 'pending' },
        screenshots?: Screenshot[]
    ) => void;
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
        const screenWidth = window.screen.availWidth;
        const screenHeight = window.screen.availHeight;
        const atsWidth = Math.floor(screenWidth * 0.5);

        const popup = window.open(
            testCase.url,
            'ats-window',
            `width=${atsWidth},height=${screenHeight},left=0,top=0,scrollbars=yes`
        );
        setAtsWindow(popup);

        return () => {
            if (popup && !popup.closed) {
                popup.close();
            }
        };
    }, [testCase.url]);

    useEffect(() => {
        if (testCase.notes) {
            setNotes(testCase.notes);
        } else {
            setNotes('');
        }

        if (testCase.stepResults) {
            setStepResults(testCase.stepResults);
        } else {
            setStepResults({});
        }

        if (testCase.screenshots) {
            setScreenshots(testCase.screenshots);
        } else {
            setScreenshots([]);
        }
    }, [testCase]);

    const openAtsWindow = () => {
        if (atsWindow && !atsWindow.closed) {
            atsWindow.focus();
        } else {
            const screenWidth = window.screen.availWidth;
            const screenHeight = window.screen.availHeight;
            const atsWidth = Math.floor(screenWidth * 0.5);

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

        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: false
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

                window.focus();
            });
        } catch (error) {
            console.error('Error capturing screenshot:', error);
            alert('Screenshot capture failed. Make sure to select the ATS window when prompted.');
            setIsCapturing(false);
        }
    };

    const markStepResult = (result: 'pass' | 'fail') => {
        setStepResults(prev => {
            const updated = {
                ...prev,
                [currentStepIndex]: result
            };

            // Check if this completes all steps
            if (Object.keys(updated).length === testCase.steps.length) {
                // Scroll to top after a brief delay to show the approve/reject buttons
                setTimeout(() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }, 100);
            }

            return updated;
        });
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

        onStatusChange(decision, finalNotes, stepResults, screenshots);
    };

    const handleBackToList = () => {
        // Save current progress without changing status
        onStatusChange(testCase.status, notes, stepResults, screenshots);
    };

    return (
        <div className="h-screen bg-gray-50 overflow-y-auto">
            <div className="max-w-full p-4">
                <div className="bg-white rounded-lg shadow-lg p-4 mb-4 sticky top-0 z-10">
                    <div className="flex items-center gap-3 mb-3">
                        <button
                            onClick={handleBackToList}
                            className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-sm font-medium"
                        >
                            &lt; Back to List
                        </button>
                        <h2 className="text-xl font-semibold text-gray-800 flex-1">{testCase.title}</h2>
                    </div>

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

                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-4">
                    <h3 className="font-semibold text-blue-800 mb-2 text-sm">
                        Step {currentStepIndex + 1}
                    </h3>
                    <p className="text-blue-700">{currentStep}</p>
                </div>

                {Object.keys(stepResults).length < testCase.steps.length ? (
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
                ) : (
                    <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 mb-4">
                        <h3 className="font-semibold text-yellow-900 mb-4 text-center text-lg">
                            All steps reviewed!
                        </h3>
                        <div className="flex gap-3">
                            <button
                                onClick={() => handleFinalDecision('rejected')}
                                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-4 rounded-lg font-semibold text-lg"
                            >
                                Reject Test Case
                            </button>
                            <button
                                onClick={() => handleFinalDecision('approved')}
                                className="flex-1 bg-green-500 hover:bg-green-600 text-white py-4 rounded-lg font-semibold text-lg"
                            >
                                Approve Test Case
                            </button>
                        </div>
                    </div>
                )}

                {getCurrentScreenshot() && (
                    <div className="bg-white rounded-lg shadow-lg p-3 mb-4">
                        <h3 className="font-semibold text-gray-700 mb-2 text-sm">Screenshot:</h3>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={`data:image/png;base64,${getCurrentScreenshot()?.screenshot}`}
                            alt={`Step ${currentStepIndex + 1}`}
                            className="w-full max-h-[500px] object-contain rounded border"
                        />
                    </div>
                )}

                {getCurrentScreenshot() && (
                    <div className="flex gap-2 mb-4">
                        <button
                            onClick={() => markStepResult('fail')}
                            className={`flex-1 py-2 px-3 rounded font-semibold ${stepResults[currentStepIndex] === 'fail'
                                    ? 'bg-red-500 text-white'
                                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                                }`}
                        >
                            Fail
                        </button>
                        <button
                            onClick={() => markStepResult('pass')}
                            className={`flex-1 py-2 px-3 rounded font-semibold ${stepResults[currentStepIndex] === 'pass'
                                    ? 'bg-green-500 text-white'
                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                                }`}
                        >
                            Pass
                        </button>
                    </div>
                )}

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

                <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notes (optional)
                    </label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded text-sm text-gray-900"
                        rows={3}
                        placeholder="Add observations..."
                    />
                </div>
            </div>
        </div>
    );
}