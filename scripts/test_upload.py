import urllib.request, json

# Build multipart form data
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
    'http://localhost:8004/api/v1/ingestion/upload',
    data=body,
    headers={'Content-Type': 'multipart/form-data; boundary=----FormBoundaryXYZ789'},
    method='POST'
)
try:
    with urllib.request.urlopen(req) as res:
        data = json.loads(res.read())
        print('Status:', res.status)
        print('Success:', data.get('success'))
        print('Message:', data.get('message'))
        d = data.get('data', {})
        print('Staged:', d.get('staged_count'), '| Duplicates:', d.get('duplicate_count'))
except urllib.error.HTTPError as e:
    body_err = e.read().decode()
    print('HTTP Error:', e.code)
    print(body_err[:500])
