from flask import Flask, request, jsonify, session
from flask_cors import CORS  # 🔥 Import Flask-CORS
from flask_session import Session
import numpy as np
import requests
import base64
import cv2
import os
import json
import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv
from openai import OpenAI

# Load environment variables
load_dotenv()

# Initialize Firebase
cred = credentials.Certificate({
  "type": "service_account",
  "project_id": "astonhack-3a04f",
  "private_key_id": os.getenv('FB_KEY_ID'),
  "private_key": os.getenv('FB_KEY_SECRET').replace('\\n', '\n'),
  "client_email": "firebase-adminsdk-fbsvc@astonhack-3a04f.iam.gserviceaccount.com",
  "client_id": "111630641654994038219",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40astonhack-3a04f.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
})
firebase_admin.initialize_app(cred)
db = firestore.client()

client = OpenAI(
    api_key=os.getenv("OPENAI_KEY"),  # This is the default and can be omitted
)

tools = [{
    "type": "function",
    "function": {
        "name": "recommend",
        "description": "Recommend an outfit based on the user's preferences. This function should only be called if the user asks for an outfit, and never the same arguments twice.",
        "parameters": {
            "type": "object",
            "properties": {
                "recommendation": {
                    "type": "array",
                    "description": "List of firebase item IDs to recommend to the user.",
                    "items": {
                        "type": "string",
                        "description": "Firebase item ID to recommend to the user."
                    }
                },
                "message": {
                    "type": "string",
                    "description": "A message to the user very briefly explaining the recommendation."
                }
            },
            "required": [
                "recommendation",
                "message"
            ],
            "additionalProperties": False
        },
        "strict": True
    }
}]

# Initialize Flask App
app = Flask(__name__)
app.secret_key = os.getenv("FUNNY_KEY")
app.config.update(
    SESSION_TYPE='filesystem',
    SESSION_COOKIE_NAME='flask_session',
    SESSION_COOKIE_SAMESITE='Lax',
    SESSION_COOKIE_SECURE=False,  # For local development
    SESSION_COOKIE_HTTPONLY=True,
)
CORS(app, 
    supports_credentials=True,
    expose_headers=['Content-Type', 'Set-Cookie']
)
Session(app)

def upload_cv2_img_to_imgbb(cv2_image):
    _, buffer = cv2.imencode('.jpg', cv2_image)
    img_base64 = base64.b64encode(buffer).decode("utf-8")

    url = "https://api.imgbb.com/1/upload?key=" + os.getenv('IMGBB_KEY')
    payload = {"image": img_base64}
    res = requests.post(url, payload)
    print(res.json())
    return res.json()['data']['url']

import yolo
import blip
import feat
import feat2

GOOGLE_API_URL = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"

@app.route('/process_image', methods=['POST'])
def process_image():
    data = request.get_json()
    image_url = data.get('image_url')

    if not image_url:
        return jsonify({'error': 'No image URL provided'}), 400

    try:
        # 1. Segmentation
        outputs = yolo.yolo(image_url)

        results = []

        # 2. BLIP
        for output in outputs:
            image = output['image']
            category = output['category']
            
            print("Processing:" + category)
            
            # 2.1 Get from DB
            collection = db.collection(category)
            docs = [doc.to_dict() | {'id': doc.id} for doc in collection.stream()]
                
            if len(docs) != 0:

                # 2.2 Get probabilities
                options = [doc['description'] for doc in docs]
                probsarray = blip.image_blip(image, options)
                max_index = np.argmax(probsarray)
                if probsarray[max_index] > 0.85:
                    results.append({
                        "type": "found",
                        "itemid": docs[max_index]['id']
                    })
                    continue
            
            print("Uploading new item...")
            
            # 3.1 Upload cv2 image to imgbb
            uploaded_image_url = upload_cv2_img_to_imgbb(image)
            print("Upload complete.")
        
            # 3.2 Add to collection

            description = feat.feat(image, os.getenv('OPENAI_KEY'))

            doc_ref = collection.add({
                'image': uploaded_image_url,
                'description': description,
                'name': feat2.feat2(image, os.getenv('OPENAI_KEY'), description)
            })
            
            results.append({
                "type": "new",
                "itemid": doc_ref[1].id
            })
                
        return jsonify({'type': "success", 'results': results}), 200
    except Exception as e:
        return jsonify({'type': "fail", 'error': str(e)}), 500

@app.route('/get-charity-shops', methods=['GET'])
def get_charity_shops():
    lat = request.args.get('lat')
    lng = request.args.get('lng')

    if not lat or not lng:
        return jsonify({"error": "Latitude and Longitude are required"}), 400
    
    # Construct the URL for Google Places API
    google_api_key = os.getenv("GOOGLE_API_KEY")  # You should set this in your environment or use dotenv
    url = f"{GOOGLE_API_URL}?location={lat},{lng}&radius=5000&keyword=charity+shop&type=store&key={google_api_key}"

    # Make the request to the Google Places API
    response = requests.get(url)

    if response.status_code != 200:
        return jsonify({"error": "Failed to fetch data from Google Places API"}), response.status_code

    # Return the data as JSON
    return jsonify(response.json())

def init_session(wardrobe):
    print(session)
    # Initialize session conversation history if not already set.
    if 'messages' not in session:
        session['messages'] = [
            {"role": "system", "content": "You are an assistant that can recommend outfits. Only if they ask for an outfit, you will provide with maximum 1 recommendation. If so, you will provide the firebase item IDs from the wardrobe below:\n\n" + wardrobe}]


@app.route('/chat', methods=['POST'])
def chat():
    data = request.get_json()
    user_message = data.get('message')
    wardrobe = data.get('wardrobe')
    if not user_message:
        return jsonify({"error": "No message provided"}), 400

    # Initialize session if needed.
    init_session(wardrobe)

    # Append the user's message to the conversation history.
    messages = session['messages']
    messages.append({"role": "user", "content": user_message})

    # Call the OpenAI API with the full conversation context.
    response = client.chat.completions.with_raw_response.create(
        model="gpt-4-turbo",
        messages=messages,
        tools=tools
    )
    api_return_dict = json.loads(response.text)
    text_reply = api_return_dict.get('choices')[0].get('message').get('content')
    calls = api_return_dict.get('choices')[0].get('message').get('tool_calls')

    # Get all messages
    if calls != None:
        for func in calls:
            if func.get('function').get('name') == 'recommend':
                reply = json.loads(func.get('function').get('arguments')).get('message')
                messages.append({"role": "assistant", "content": reply})

    # Append the assistant's reply to the session's conversation history.
    session['messages'] = messages  # update session
    session.modified = True
    
    return jsonify({"reply": text_reply, "recommendation": calls})


@app.route('/reset', methods=['POST'])
def reset():
    # Clear the conversation history to start a new session.
    session.pop('messages', None)
    session.modified = True
    return jsonify({"status": "Conversation reset."})

if __name__ == '__main__':
    app.run(debug=True)