from ultralytics import YOLO
import cv2
import numpy as np
import requests

# Load the YOLOv8 segmentation model
model = YOLO('deepfashion2_yolov8s-seg.pt')

def yolo(image_path_or_url, min_width=50, min_height=50):
    # Check if the input is a URL
    if image_path_or_url.startswith('http://') or image_path_or_url.startswith('https://'):
        # Download the image from the URL
        resp = requests.get(image_path_or_url, stream=True)
        resp.raise_for_status()
        image_data = np.asarray(bytearray(resp.content), dtype="uint8")
        image = cv2.imdecode(image_data, cv2.IMREAD_COLOR)
    else:
        # Read the image from the local path
        image = cv2.imread(image_path_or_url)

    results = model(image)

    # Mapping category indices to DeepFashion2 category names (Example)
    category_names = [
        'short_sleeve_top', 'long_sleeve_top', 'short_sleeve_outwear',
        'long_sleeve_outwear', 'vest', 'sling', 'shorts', 'trousers',
        'skirt', 'short_sleeve_dress', 'long_sleeve_dress', 'vest_dress',
        'sling_dress'
    ]
    
    outputs = []

    # Iterate over each detection result
    for _, result in enumerate(results):
        orig_img = result.orig_img  # Original image (numpy array)
        masks = result.masks.data.cpu().numpy()  # Masks as numpy arrays
        classes = result.boxes.cls.cpu().numpy()  # Class indices

        print(f"[INFO] Found {len(masks)} masks in image.")

        # Get original image dimensions
        orig_h, orig_w = orig_img.shape[:2]

        for i, mask in enumerate(masks):
            # Resize mask to match original image dimensions
            mask_resized = cv2.resize(mask, (orig_w, orig_h), interpolation=cv2.INTER_NEAREST)
            mask_img = (mask_resized * 255).astype(np.uint8)  # Convert mask to 0-255

            # Find the bounding box of the mask
            coords = cv2.findNonZero(mask_img)
            x, y, w, h = cv2.boundingRect(coords) if coords is not None else (0, 0, orig_w, orig_h)

            # Filter out small bounding boxes
            if w < min_width or h < min_height:
                continue

            # Crop the original image and mask
            cropped_img = orig_img[y:y + h, x:x + w]
            cropped_mask = mask_img[y:y + h, x:x + w]

            # Create white background for the cropped region
            white_background = np.ones_like(cropped_img, dtype=np.uint8) * 255

            # Apply the mask to the cropped image
            for c in range(3):
                white_background[:, :, c] = np.where(cropped_mask == 255, cropped_img[:, :, c], 255)

            # Get the category name (if index is valid)
            class_idx = int(classes[i])
            category_name = category_names[class_idx] if class_idx < len(category_names) else f'category_{class_idx}'

            outputs.append({
                'category': category_name,
                'image': white_background
            })
    return outputs
