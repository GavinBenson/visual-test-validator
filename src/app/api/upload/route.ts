import { NextRequest, NextResponse } from 'next/server';
import { TestCase } from '@/types';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const text = await file.text();
        const lines = text.split('\n').filter(line => line.trim());

        if (lines.length < 2) {
            return NextResponse.json({ error: 'Invalid CSV format' }, { status: 400 });
        }

        const testCases: TestCase[] = [];

        for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i]);

            if (values.length >= 4) {
                testCases.push({
                    id: values[0] || `case-${i}`,
                    title: values[1] || `Test Case ${i}`,
                    steps: values[2] ? values[2].split('\\n').filter(s => s.trim()) : ['No steps defined'],
                    url: values[3] || 'https://demo.isolved.com',
                    status: 'pending'
                });
            }
        }

        return NextResponse.json({ testCases });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: 'Failed to process file' }, { status: 500 });
    }
}

function parseCSVLine(line: string): string[] {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    result.push(current.trim());
    return result;
}