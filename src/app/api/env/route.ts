import { NextResponse } from 'next/server';

/**
 * API route to safely expose public environment variables for testing
 * Only exposes variables that are already accessible on the client side (NEXT_PUBLIC_*)
 */
export const dynamic = "force-static";
export const revalidate = 0;

export async function GET() {
  // Only expose NEXT_PUBLIC_ environment variables
  const publicEnvVars = {
    NEXT_PUBLIC_APPWRITE_ENDPOINT: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || '',
    NEXT_PUBLIC_APPWRITE_PROJECT_ID: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '',
    NEXT_PUBLIC_APPWRITE_HOSTNAME: process.env.NEXT_PUBLIC_APPWRITE_HOSTNAME || '',
  };

  return NextResponse.json(publicEnvVars);
}

