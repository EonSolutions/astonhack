from flask import Flask, request, jsonify
from flask_cors import CORS  # 🔥 Import Flask-CORS
import numpy as np
import requests
import base64
import cv2
import os
import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv

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

# Initialize Flask App
app = Flask(__name__)
CORS(app)  # 🔥 Enable CORS for all routes

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

            doc_ref = collection.add({
                'image': uploaded_image_url,
                'description': feat.feat(image, os.getenv('OPENAI_KEY')),
                'name': feat2.feat2(image, os.getenv('OPENAI_KEY'))
            })
            
            results.append({
                "type": "new",
                "itemid": doc_ref[1].id
            })
                
        return jsonify({'type': "success", 'results': results}), 200
    except Exception as e:
        return jsonify({'type': "fail", 'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)