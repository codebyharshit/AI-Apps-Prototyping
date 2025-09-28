import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { TableData } from '@/components/ui/datatable';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Read the file buffer
    const buffer = await file.arrayBuffer();
    
    // Parse based on file type
    if (file.name.endsWith('.csv')) {
      // Handle CSV
      const text = new TextDecoder().decode(buffer);
      const rows = text.split('\n').map(row => row.split(','));
      
      const tableData: TableData = {
        headers: rows[0].map(header => header.trim()),
        rows: rows.slice(1).map(row => row.map(cell => cell.trim()))
      };
      
      return NextResponse.json({ tableData });
      
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      // Handle Excel
      const workbook = XLSX.read(buffer);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1 });
      
      if (!jsonData.length) {
        return NextResponse.json({ error: 'Empty spreadsheet' }, { status: 400 });
      }
      
      const tableData: TableData = {
        headers: jsonData[0].map(String),
        rows: jsonData.slice(1).map(row => (row || []).map(String))
      };
      
      return NextResponse.json({ tableData });
    }
    
    return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
    
  } catch (error) {
    console.error('Error processing document upload:', error);
    return NextResponse.json({ error: 'Failed to process document' }, { status: 500 });
  }
} 