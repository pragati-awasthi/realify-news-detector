import requests

url = "http://127.0.0.1:5001/predict"

data = {
    "text": "NASA confirms water found on Mars"
}

response = requests.post(url, json=data)

print(response.json())