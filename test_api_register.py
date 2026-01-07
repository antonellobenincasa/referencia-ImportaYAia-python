import urllib.request
import urllib.error
import json

url = "http://127.0.0.1:8001/api/accounts/register/"
data = {
    "email": "test_urllib_user@test.com",
    "password": "TestPass123!",
    "password_confirm": "TestPass123!",
    "first_name": "Test",
    "last_name": "Script",
    "company_name": "Test Script Corp",
    "phone": "0999999999",
    "ruc": "1722222222001"
}

headers = {
    "Content-Type": "application/json",
    "Accept": "application/json"
}

try:
    print(f"Sending POST to {url}")
    req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers=headers, method='POST')
    
    with urllib.request.urlopen(req) as response:
        print(f"Status Code: {response.getcode()}")
        response_body = response.read().decode('utf-8')
        try:
            print("Response JSON:")
            print(json.dumps(json.loads(response_body), indent=2))
        except:
            print("Response (Text):")
            print(response_body)
            
except urllib.error.HTTPError as e:
    print(f"HTTP Error: {e.code} - {e.reason}")
    print(e.read().decode('utf-8'))
except urllib.error.URLError as e:
    print(f"URL Error: {e.reason}")
except Exception as e:
    print(f"Error: {e}")
