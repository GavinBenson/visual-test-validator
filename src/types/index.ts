export interface TestCase {
    id: string;
    title: string;
    steps: string[];
    url: string;
    status: 'pending' | 'approved' | 'rejected';
    description?: string;
    preconditions?: string;
    postconditions?: string;
}

export interface Screenshot {
    step: string;
    screenshot: string;
    stepIndex: number;
}