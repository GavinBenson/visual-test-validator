export interface TestCase {
    id: string;
    title: string;
    steps: string[];
    url: string;
    status: 'pending' | 'approved' | 'rejected';
}

export interface Screenshot {
    step: string;
    screenshot: string;
}