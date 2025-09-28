import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { componentId, modifiedCode, originalCode, changes } = await request.json();

    console.log('💾 Saving modified code for component:', componentId);
    console.log('📄 Original code length:', originalCode?.length || 0);
    console.log('📄 Modified code length:', modifiedCode?.length || 0);
    console.log('🎨 Changes applied:', changes);

    if (!componentId || !modifiedCode) {
      return NextResponse.json(
        { error: 'Missing componentId or modifiedCode' },
        { status: 400 }
      );
    }

    // In a real application, this would save to a database
    // For now, we'll simulate saving by returning the data
    // The client will handle localStorage persistence
    
    const savedData = {
      componentId,
      modifiedCode,
      originalCode,
      changes,
      savedAt: new Date().toISOString(),
      codeLength: modifiedCode.length
    };

    console.log('✅ Modified code saved successfully for component:', componentId);
    console.log('📊 Saved data:', savedData);

    return NextResponse.json({
      success: true,
      message: 'Modified code saved successfully',
      data: savedData
    });

  } catch (error) {
    console.error('❌ Error saving modified code:', error);
    return NextResponse.json(
      { error: 'Failed to save modified code' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Save Modified Code API is running',
    endpoints: {
      POST: '/api/save-modified-code - Save modified generated code for a component'
    }
  });
} 