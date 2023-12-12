import tensorflow as tf
from PIL import Image
import numpy as np
import os

class IconRecognition:
    def __init__(self):
        model_path = os.path.join(os.path.dirname(__file__), './Model Directory/model.tflite')
        classes = ["إشارة مرجعية", "تقويم", "مكالمة", "عربة", "بطاقة ائتمان", "تحميل", "مصفي", "كرة أرضية", "قلب", "منزل", "رابط", "موقع", "بريد", "قائمة", "ميكروفون", "موسيقى", "إشعارات", "طابعة", "إزالة", "حفظ", "بحث", "إعدادات", "نجمة", "إعجاب", "مستخدم", "صوت", "تحذير"]
        self.model = tf.lite.Interpreter(model_path=model_path)
        self.classes = classes

        # Learn about its input and output details
        input_details = self.model.get_input_details()
        output_details = self.model.get_output_details()

        self.model.resize_tensor_input(input_details[0]['index'], (1, 224, 224, 3))
        self.model.allocate_tensors()

    def classify(self, image_path):
        img = Image.open(image_path).convert('RGB')
        img = img.resize((224, 224))
        img_np = np.array(img)[None].astype('float32')

        input_details = self.model.get_input_details()
        self.model.set_tensor(input_details[0]['index'], img_np)
        self.model.invoke()

        output_details = self.model.get_output_details()
        class_scores = self.model.get_tensor(output_details[0]['index'])

        if class_scores.max() < 0.7:
            return "Prediction confidence too low"

        return self.classes[class_scores.argmax()]