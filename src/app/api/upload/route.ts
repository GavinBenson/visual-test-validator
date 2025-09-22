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

        // Use a proper CSV parser to handle quoted fields with newlines
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());

        const testCases: TestCase[] = [];
        let currentLine = '';
        let inQuotes = false;

        for (let i = 1; i < lines.length; i++) {
            currentLine += lines[i];

            // Count quotes to determine if we're inside a quoted field
            const quoteCount = (currentLine.match(/"/g) || []).length;
            inQuotes = quoteCount % 2 !== 0;

            if (!inQuotes && currentLine.trim()) {
                // We have a complete row
                const values = parseCSVRow(currentLine);
                const row: Record<string, string> = {};

                headers.forEach((header, index) => {
                    row[header] = values[index] || '';
                });

                // Only process rows that have actual test case data
                if (row['v2.id'] && row['v2.id'].trim() && row.title) {
                    const stepActions = parseSteps(row.steps_actions);
                    const stepResults = parseSteps(row.steps_result);

                    // Combine steps with expected results
                    const combinedSteps = stepActions.map((action, idx) => {
                        const result = stepResults[idx] || '';
                        return result ? `${action} -> Expected: ${result}` : action;
                    });

                    if (combinedSteps.length > 0) {
                        testCases.push({
                            id: row['v2.id'].toString(),
                            title: row.title,
                            steps: combinedSteps,
                            url: 'https://your-ats-domain.com',
                            status: 'pending',
                            description: row.description || '',
                            preconditions: row.preconditions || '',
                            postconditions: row.postconditions || ''
                        });
                    }
                }

                currentLine = '';
            } else if (inQuotes) {
                // Continue to next line (multi-line field)
                currentLine += '\n';
            }
        }

        return NextResponse.json({ testCases });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: 'Failed to process file' }, { status: 500 });
    }
}

function parseCSVRow(line: string): string[] {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                // Escaped quote
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }

    result.push(current);
    return result;
}

function parseSteps(stepsField: string): string[] {
    if (!stepsField || !stepsField.trim()) {
        return [];
    }

    // Split by newlines and clean each step
    return stepsField
        .split('\n')
        .map(step => step.trim())
        .filter(step => step.length > 0)
        .map(step => {
            // Remove step numbers and surrounding quotes
            return step
                .replace(/^\d+\.\s*"?/, '')  // Remove "1. " or "1. ""
                .replace(/"$/, '')            // Remove trailing quote
                .trim();
        });
}