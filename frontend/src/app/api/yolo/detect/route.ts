import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image, targetPlate = "ET3633P", cameraId = "CAM-01" } = body;

    if (!image) {
      return NextResponse.json({ success: false, detected: false, message: "No frame image provided" }, { status: 400 });
    }

    // Call Python AI microservice YOLO plate detector on port 8000
    try {
      const response = await fetch("http://localhost:8000/detect-plate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image, targetPlate, cameraId }),
        signal: AbortSignal.timeout(1800),
      });

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data);
      }
    } catch {
      // AI service timeout or error, graceful optical fallback handled by client
    }

    return NextResponse.json({
      success: true,
      detected: false,
      message: "Plate not localized in this frame",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, detected: false, error: (error as Error).message },
      { status: 500 },
    );
  }
}
