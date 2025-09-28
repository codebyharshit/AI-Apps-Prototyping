import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Direct manipulation API is working',
    timestamp: new Date().toISOString()
  });
}

export async function POST(request: NextRequest) {
  try {
    console.log('💾 API: Request received');
    console.log('💾 API: Request headers:', Object.fromEntries(request.headers.entries()));
    
    const body = await request.json();
    const { componentId, changes, styleOverrides, contentChanges } = body;

    console.log('💾 API: Received request body:', body);

    if (!componentId) {
      console.error('💾 API: Missing componentId in request');
      return NextResponse.json(
        { error: 'Component ID is required' },
        { status: 400 }
      );
    }

    if (!changes || !Array.isArray(changes)) {
      console.error('💾 API: Missing or invalid changes array');
      return NextResponse.json(
        { error: 'Changes array is required' },
        { status: 400 }
      );
    }

    console.log(`💾 API: Received save request for component ${componentId}:`, {
      changesCount: changes?.length || 0,
      styleOverridesCount: Object.keys(styleOverrides || {}).length,
      contentChangesCount: Object.keys(contentChanges || {}).length
    });

    // Note: In a real application, this would be saved to a database
    // For now, we'll return success and let the client handle localStorage
    // The client-side code will handle the actual persistence

    return NextResponse.json({
      success: true,
      message: 'Direct manipulation changes saved successfully',
      componentId,
      changesApplied: {
        styleOverrides: Object.keys(styleOverrides || {}).length,
        contentChanges: Object.keys(contentChanges || {}).length,
        totalChanges: changes?.length || 0
      },
      // Return the data that should be saved to localStorage
      data: {
        componentId,
        changes,
        styleOverrides,
        contentChanges,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error saving direct manipulation changes:', error);
    return NextResponse.json(
      { error: 'Failed to save changes' },
      { status: 500 }
    );
  }
} 