import urllib.request
import json
import sys

def check_url(name, url, method='GET', data=None):
    try:
        req = urllib.request.Request(url, method=method)
        if data:
            req.data = json.dumps(data).encode('utf-8')
            req.add_header('Content-Type', 'application/json')
        with urllib.request.urlopen(req, timeout=12) as resp:
            content = resp.read().decode('utf-8')
            print(f"[OK] {name} ({url}) -> HTTP {resp.status}")
            return content
    except Exception as e:
        print(f"[FAIL] {name} ({url}) -> Error: {e}")
        return None

def main():
    print("=" * 60)
    print("Testing City Traffic Surveillance Services Locally")
    print("=" * 60)

    # 1. Python ML Service (port 8000)
    print("\n1. Testing ML Service (FastAPI / YOLOv8 / EasyOCR on Port 8000)...")
    ml_health = check_url("ML Service Health", "http://localhost:8000/health")
    ml_detect = check_url(
        "ML Plate Detection on CAM-01",
        "http://localhost:8000/detect-plate",
        method="POST",
        data={"videoPath": "videos/CAM-01.mp4"}
    )
    if ml_detect:
        d = json.loads(ml_detect)
        print(f"   -> Predicted Plate: {d.get('plate')}")
        print(f"   -> Confidence: {d.get('confidence')}")
        print(f"   -> Model: {d.get('model')}")
        print(f"   -> Vehicle Type / Color: {d.get('vehicleType')} / {d.get('color')}")

    # 2. Spring Boot Backend (port 8080)
    print("\n2. Testing Spring Boot Backend (Port 8080)...")
    be_health = check_url("Backend Health", "http://localhost:8080/api/health")
    be_cams = check_url("Backend Cameras", "http://localhost:8080/api/cameras")
    if be_cams:
        cams = json.loads(be_cams)
        print(f"   -> Total Seeded Cameras: {len(cams)} nodes (all 223 RTO codes)")

    be_detect = check_url(
        "Backend AI Proxy /api/detect-plate",
        "http://localhost:8080/api/detect-plate",
        method="POST",
        data={"videoPath": "videos/CAM-01.mp4"}
    )
    if be_detect:
        d = json.loads(be_detect)
        print(f"   -> Proxied Predicted Plate: {d.get('plate')}")

    # 3. Next.js Frontend (port 3000)
    print("\n3. Testing Next.js Frontend (Port 3000)...")
    fe_home = check_url("Frontend Web Interface", "http://localhost:3000")
    fe_vahan = check_url("Frontend VAHAN API Route", "http://localhost:3000/api/vahan/UP14AN7225")
    if fe_vahan:
        v = json.loads(fe_vahan)
        data = v.get("data") or {}
        print(f"   -> VAHAN RC Query Source: {v.get('source')}")
        print(f"   -> Plate Number: {data.get('registrationNumber')}")
        print(f"   -> Registered Owner: {data.get('ownerName')}")
        print(f"   -> Vehicle: {data.get('maker')} {data.get('model')}")

    print("\n" + "=" * 60)
    print("Local Testing Complete!")
    print("=" * 60)

if __name__ == "__main__":
    main()
