import urllib.request, json

with open('E:/MuleShieldAI/fixtures/sample_statement.pdf', 'rb') as f:
    pdf_bytes = f.read()

boundary = b'----FormBoundaryXYZ789'
crlf = b'\r\n'
body = (
    b'--' + boundary + crlf +
    b'Content-Disposition: form-data; name="file"; filename="sample_statement.pdf"' + crlf +
    b'Content-Type: application/pdf' + crlf + crlf +
    pdf_bytes + crlf +
    b'--' + boundary + b'--' + crlf
)

req = urllib.request.Request(
    'http://localhost:8000/api/v1/ingestion/upload',
    data=body,
    headers={'Content-Type': 'multipart/form-data; boundary=----FormBoundaryXYZ789'},
    method='POST'
)
try:
    with urllib.request.urlopen(req) as res:
        data = json.loads(res.read())
        print('Gateway Status:', res.status)
        print('Success:', data.get('success'))
        print('Message:', data.get('message'))
except urllib.error.HTTPError as e:
    print('Gateway HTTP Error:', e.code)
    print(e.read().decode()[:500])
