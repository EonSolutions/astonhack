import base64
import requests
import cv2

def encode_image_from_opencv(cv_image):
    _, buffer = cv2.imencode('.jpg', cv_image)
    return base64.b64encode(buffer).decode("utf-8")

def feat(cv_image, key):
    image_base64 = encode_image_from_opencv(cv_image)
    
    headers = {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json"
    }
    
    prompt = "Describe this clothing item in detail (using telepgrahic speech), including its color, type, sub-type and any patterns."

    data = {
        "model": "gpt-4-turbo",
        "messages": [
            {"role": "system", "content": "You are an AI which uses telegraphic speech to assign a concise description to a clothing item such that it can be uniquely identified by the CLIP AI model by openAI"},
            {"role": "user", "content": [
                {"type": "text", "text": prompt},
                {"type": "image_url", "image_url": { "url" : f"data:image/jpeg;base64,{image_base64}"}}
            ]}
        ],
        "max_tokens": 200
    }
    
    response = requests.post("https://api.openai.com/v1/chat/completions", headers=headers, json=data)
    
    if response.status_code == 200:
        return response.json()["choices"][0]["message"]["content"]
    else:
        return f"Error: {response.status_code}, {response.text}"

