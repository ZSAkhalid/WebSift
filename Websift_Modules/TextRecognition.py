import base64
import json
import os
import random
import requests
from datetime import datetime

from dotenv import load_dotenv


class TextRecognition:
    def __init__(self):
        # Set the root dir of the project to load the .env
        self.root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        # Load .env
        load_dotenv(dotenv_path=os.path.join(self.root_dir, '.env'))

        self.google_key = os.getenv('GOOGLE_VISION_API_KEY')

    @staticmethod
    def __make_request_json(img_file, output_filename):
        with open(img_file, 'rb') as image_file:
            content_json_obj = {'content': base64.b64encode(image_file.read()).decode('UTF-8')}
        feature_json_arr = [{'type': 'TEXT_DETECTION'}, {'type': 'DOCUMENT_TEXT_DETECTION'}]
        request_list = {'features': feature_json_arr, 'image': content_json_obj}
        with open(output_filename, 'w') as output_json:
            json.dump({'requests': [request_list]}, output_json)

    def __get_text_info(self, json_file):
        try:
            data = open(json_file, 'rb').read()
            response = requests.post(
                url='https://vision.googleapis.com/v1/images:annotate?key=' + self.google_key,
                data=data,
                headers={'Content-Type': 'application/json'})
            ret_json = json.loads(response.text)
            ret_val = ret_json['responses'][0]
        except Exception as e:
            return None
        return ret_val.get('textAnnotations')

    @staticmethod
    def get_field_int(dict_data, field):
        return dict_data.get(field, 0)

    def get_word_coordinate(self, ocr_data, ind):
        p = ocr_data[ind]['boundingPoly']['vertices']
        ret = [[self.get_field_int(p[0], 'x'), self.get_field_int(p[0], 'y')],
               [self.get_field_int(p[1], 'x'), self.get_field_int(p[1], 'y')],
               [self.get_field_int(p[2], 'x'), self.get_field_int(p[2], 'y')],
               [self.get_field_int(p[3], 'x'), self.get_field_int(p[3], 'y')]]
        return ret

    @staticmethod
    def merge_coordinate(rect1, rect2):
        if rect1 is not None and rect2 is not None:
            return [
                [min(rect1[0][0], rect2[0][0]), min(rect1[0][1], rect2[0][1])],
                [max(rect1[1][0], rect2[1][0]), min(rect1[1][1], rect2[1][1])],
                [max(rect1[2][0], rect2[2][0]), max(rect1[2][1], rect2[2][1])],
                [min(rect1[3][0], rect2[3][0]), max(rect1[3][1], rect2[3][1])]
            ]
        return rect2 if rect2 is not None else rect1

    def get_line_rect(self, ocr_json):
        ocr_text = ocr_json[0]['description']
        text_lines = ocr_text.splitlines()
        temp_rect = None
        ret = {'text': [ocr_text], 'rect': [self.get_word_coordinate(ocr_json, 0)], 'index': [0]}
        pos_start = 1
        for i in range(len(text_lines)):
            f_match = False
            ret['index'].append(pos_start)
            f_ignore_line = False
            for j in range(pos_start, len(ocr_json)):
                temp_text = ''
                temp_rect = None
                for k in range(j, min(j + 50, len(ocr_json))):
                    temp_text += ocr_json[k]['description']
                    new_rect = self.get_word_coordinate(ocr_json, k)
                    temp_rect = self.merge_coordinate(temp_rect, new_rect)
                    if len(text_lines[i].replace(' ', '')) == 1 and len(temp_text) > 10:
                        f_ignore_line = True
                        f_match = True
                        break
                    if temp_text == text_lines[i].replace(' ', ''):
                        f_match = True
                        pos_start = k + 1
                        break
                if f_match:
                    break
            if not f_ignore_line:
                ret['text'].append(text_lines[i])
                ret['rect'].append(temp_rect)
        return ret

    def get_ocr_json(self, img_file):
        temp_json = f"temp{datetime.now().microsecond}_{random.randint(0, 100000)}.json"
        self.__make_request_json(img_file, temp_json)
        ret_json = self.__get_text_info(temp_json)
        os.remove(temp_json)
        return ret_json

    def get_ocr_data(self, ocr_json):
        if ocr_json is None:
            return [], [], [], [], []
        line_info = self.get_line_rect(ocr_json)
        word_list = [ocr['description'] for ocr in ocr_json[1:]]
        word_pos_list = [self.get_word_coordinate(ocr_json, i) for i in range(1, len(ocr_json))]
        return ocr_json[0]['description'], line_info['text'], line_info['rect'], word_list, word_pos_list

    def extract_text(self, img_file):
        ret_json = self.get_ocr_json(img_file)
        return self.get_ocr_data(ret_json)