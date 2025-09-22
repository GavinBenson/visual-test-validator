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

        const headers = lines[0].split(',');
        const testCases: TestCase[] = [];

        // Parse Qase CSV format
        for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i]);
            const row: Record<string, string> = {};  // FIXED: Changed from any to Record<string, string>

            headers.forEach((header, index) => {
                row[header.trim()] = values[index] || '';
            });

            // Only process rows that have actual test case data (not suite headers)
            if (row['v2.id'] && row.title && row['v2.id'].trim() !== '') {
                // Combine steps and expected results
                const stepActions = row.steps_actions ? row.steps_actions.split('\n').filter((s: string) => s.trim()) : [];
                const stepResults = row.steps_result ? row.steps_result.split('\n').filter((s: string) => s.trim()) : [];

                const combinedSteps = stepActions.map((action: string, idx: number) => {
                    const cleanAction = action.replace(/^\d+\.\s*"?|"$/g, '').trim();
                    const result = stepResults[idx] ? stepResults[idx].replace(/^\d+\.\s*"?|"$/g, '').trim() : '';
                    return result ? `${cleanAction} -> Expected: ${result}` : cleanAction;
                });

                testCases.push({
                    id: row['v2.id'].toString(),
                    title: row.title,
                    steps: combinedSteps.length > 0 ? combinedSteps : ['No steps defined'],
                    url: 'https://your-ats-domain.com',
                    status: 'pending',
                    description: row.description || '',
                    preconditions: row.preconditions || '',
                    postconditions: row.postconditions || ''
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