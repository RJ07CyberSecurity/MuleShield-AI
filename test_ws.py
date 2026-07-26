import asyncio
import websockets
import sys

async def test_ws():
    uri = "ws://localhost:8000/ws/cases?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiZTk3MTlkNi04NzE0LTQ3OWItYjNjMC02MDU5NzJhOGQwNzQiLCJyb2xlcyI6WyJpbnZlc3RpZ2F0b3IiLCJhZG1pbmlzdHJhdG9yIl0sImlhdCI6MTc4NTA4MTIxOCwiZXhwIjoxNzg1MDgyMTE4LCJqdGkiOiJjMDRkMDUwNC1hZWY1LTQwNDAtOTAxZi05YjJlOWY0YjRkMzIiLCJuYmYiOjE3ODUwODEyMTh9.LDTnjnFwV8GXhSBM7rCN_3MIKocjlM-AWaZXAl6SYzc"
    print(f"Connecting to {uri}")
    try:
        async with websockets.connect(uri, origin="http://localhost:3000") as ws:
            print("Connected!")
            try:
                msg = await ws.recv()
                print(f"Received: {msg}")
            except websockets.exceptions.ConnectionClosed as cc:
                print(f"Connection closed with code {cc.code}: {cc.reason}")
    except websockets.exceptions.InvalidStatusCode as e:
        print(f"Rejected with status {e.status_code}")
        # print body if available
        if hasattr(e, 'headers'):
            print(f"Headers: {e.headers}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_ws())
