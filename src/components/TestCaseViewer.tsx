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
            alert('Screenshot capture failed. Please make sure you grant screen sharing permission.');
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
            .filter(([_, result]) => result === 'fail')
            .map(([index, _]) => parseInt(index) + 1);

        let finalNotes = notes;
        if (failedSteps.length > 0) {
            finalNotes += `\n\nFailed steps: ${failedSteps.join(', ')}`;
        }

        onStatusChange(decision, finalNotes);
    };

    return (
        <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-lg p-6">
            <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">{testCase.title}</h2>
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="font-semibold text-blue-800 mb-2">
                            Current Step ({currentStepIndex + 1}/{testCase.steps.length})
                        </h3>
                        <p className="text-blue-700 text-lg">{currentStep}</p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-700 mb-2">Instructions:</h4>
                        <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
                            <li>Perform the step above in your browser</li>
                            <li>Click Capture Screenshot when ready</li>
                            <li>Mark if the step worked as expected</li>
                            <li>Move to next step or finish review</li>
                        </ol>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-700 mb-2">Target URL:</h4>
                        <a
                            href={testCase.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline break-all"
                        >
                            {testCase.url}
                        </a>
                    </div>

                    <div className="space-y-3">
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

                        {getCurrentScreenshot() && (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => markStepResult('pass')}
                                    className={`flex-1 py-2 px-3 rounded ${stepResults[currentStepIndex] === 'pass'
                                            ? 'bg-green-500 text-white'
                                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                                        }`}
                                >
                                    Step Passed
                                </button>
                                <button
                                    onClick={() => markStepResult('fail')}
                                    className={`flex-1 py-2 px-3 rounded ${stepResults[currentStepIndex] === 'fail'
                                            ? 'bg-red-500 text-white'
                                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                                        }`}
                                >
                                    Step Failed
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <h3 className="font-semibold text-gray-700 mb-3">
                        Screenshot - Step {currentStepIndex + 1}
                    </h3>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg min-h-96 flex items-center justify-center">
                        {getCurrentScreenshot() ? (
                            <img
                                src={`data:image/png;base64,${getCurrentScreenshot()?.screenshot}`}
                                alt={`Step ${currentStepIndex + 1}`}
                                className="max-w-full max-h-96 object-contain rounded shadow-sm"
                            />
                        ) : (
                            <div className="text-gray-500 text-center">
                                <div className="text-4xl mb-2">Camera Icon</div>
                                <div>No screenshot captured yet</div>
                                <div className="text-sm">Click Capture Screenshot after performing the step</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-center mb-6">
                <button
                    onClick={prevStep}
                    disabled={isFirstStep}
                    className={`px-4 py-2 rounded ${isFirstStep
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                        }`}
                >
                    Previous Step
                </button>

                <div className="flex gap-1">
                    {testCase.steps.map((_, index) => (
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
                        />
                    ))}
                </div>

                <button
                    onClick={nextStep}
                    disabled={isLastStep}
                    className={`px-4 py-2 rounded ${isLastStep
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                        }`}
                >
                    Next Step
                </button>
            </div>

            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Review Notes (optional)
                </label>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    rows={3}
                    placeholder="Add any notes about discrepancies, issues, or observations..."
                />
            </div>

            <div className="flex justify-center space-x-4">
                <button
                    onClick={() => handleFinalDecision('rejected')}
                    className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-lg font-semibold"
                >
                    Reject Test Case
                </button>
                <button
                    onClick={() => handleFinalDecision('approved')}
                    className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg font-semibold"
                >
                    Approve Test Case
                </button>
            </div>
        </div>
    );
}