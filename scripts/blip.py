import torch
from transformers import BlipProcessor, BlipForImageTextRetrieval
from PIL import Image
import numpy as np
import cv2

# Load BLIP retrieval model (ITM)
device = "cuda" if torch.cuda.is_available() else "cpu"
processor = BlipProcessor.from_pretrained("Salesforce/blip-itm-base-coco")
model = BlipForImageTextRetrieval.from_pretrained("Salesforce/blip-itm-base-coco").to(device)

def image_blip(img, clothing_database):
    cv2_image_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    image = Image.fromarray(cv2_image_rgb)
    scores = []

    for text in clothing_database:
        inputs = processor(images=image, text=text, return_tensors="pt").to(device)

        with torch.no_grad():
            output = model(**inputs)

        # Extract the "Yes" score from itm_score (index 1)
        itm_score = torch.softmax(output.itm_score, dim=-1)[:, 1].item()
        scores.append(itm_score)

    return np.array(scores) 
