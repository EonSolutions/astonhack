from transformers import CLIPProcessor, CLIPModel
import cv2
from PIL import Image

# Load model and processor
model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")


def image_clip(img, options):
    cv2_image_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    image = Image.fromarray(cv2_image_rgb)

    # Preprocess
    inputs = processor(text=options, images=image,
                       return_tensors="pt", padding=True)

    # Get similarity logits
    outputs = model(**inputs)
    logits_per_image = outputs.logits_per_image  # image-text similarity
    probs = logits_per_image.softmax(dim=1)      # normalize to probabilities
    probsarray = probs.cpu().detach().numpy()
    return probsarray
