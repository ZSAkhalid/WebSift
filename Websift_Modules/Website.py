from selenium.webdriver import Chrome
from selenium.webdriver import ChromeOptions
import requests
from PIL import Image
from io import BytesIO
import os
import string
import random
import json
import ijson
from urllib.parse import urlparse
import time

class Website:
    link = ""
    files = []
    root_directory = None
    json_file_path = None
    webPageHTML = None
    webPageLines = None


    def __init__(self, link):
        self.link = link
    
    def get_url(self):
        return self.link
        
    def set_url(self, link):
        self.link = link

    def get_files(self):
        return self.files
    
    def set_files(self, files):
        self.files = files

    def get_root_directory(self):
        return self.root_directory


    def is_website_reachable(self):
        headers = {'User-Agent': 'Mozilla/5.0'}
        try:
            response = requests.get(self.link, headers=headers, timeout=10)
            return 200 <= response.status_code < 400
        except requests.ConnectionError:
            return False
        except requests.Timeout:
            return False
        
    
    def is_link(self, link):
        try:
            parsed = urlparse(link)
            return all([parsed.scheme, parsed.netloc])
        except:
            return False

    def download_HTML(self):
        options = ChromeOptions()
        options.add_argument('--headless=new')
        
        driver = Chrome(options=options)
        driver.get(self.link)
        
        # To load heavy websites
        # time.sleep(10)

        self.webPageHTML = driver.page_source
        
        driver.quit()
        self.root_directory = self.create_random_directory()
        self.store_html_file(self.webPageHTML,"original")
    
    def get_HTML(self):
        if self.webPageHTML:
            return self.webPageHTML
        else:
            return None
    
    def get_striped_HTML(self):
        self.webPageLines = self.webPageHTML.split('\n')
        return self.webPageLines
    
    #------------------------------------------------------------
    # | Image downloadable |
    # This make a HEAD request to check if the image URL is accessible.
    def is_image_downloadable(self, link):
        if not self.is_link(link):
            return False
        if not self.link_ends_with_image_extension(link):
            return False
        else:
            return True
        
    def link_ends_with_image_extension(self, link):
        IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg']
        if link.endswith(tuple(IMAGE_EXTENSIONS)):
            return True
        else:
            return False
    #------------------------------------------------------------
    # | Download image |
    # This function download the image using a URL and saves it into a new directory and returns the path.
    def download_image(self, link):
        if not self.is_image_downloadable(link):
            return None
        if not str(link).startswith(('http://', 'https://')):
            link = 'http://' + link
        filename = ''.join(random.choices(string.ascii_letters + string.digits, k=15))
        directory = os.path.join(self.root_directory, 'Images')
        os.makedirs(directory, exist_ok=True)
        file_path = os.path.join(directory, f'{filename}.png')
        try:
            img_data = requests.get(link).content
            with open(file_path, 'wb') as handler:
                handler.write(img_data)
            return file_path

        except (requests.RequestException, IOError) as e:
            return None
        

    #------------------------------------------------------------
    # | Delete image |
    # This function deletes the image from the directory.
    def delete_image(self, file_path):
        file_path = os.path.join(file_path)
        if os.path.exists(file_path):
            os.remove(file_path)
            return True
        else:
            return False

        
    
    #------------------------------------------------------------
    # | Create JSON file |
    # This function creates a JSON file and returns the path.
    def create_json_file(self):
        try:
            # Generating a random filename
            filename = 'analysis_results.json'
            directory = os.path.join(self.root_directory, 'JSON')
            os.makedirs(directory, exist_ok=True)

            # Combining directory path and filename
            self.json_file_path = os.path.join(directory, filename)

            # Creating an empty JSON file
            with open(self.json_file_path, 'w') as json_file:
                json.dump([], json_file)
            return self.json_file_path

        except Exception as e:
            return None
        

    def append_data_to_json(self, new_data):
        if not os.path.exists(self.json_file_path):
            return False

        try:
            with open(self.json_file_path, 'r') as file:
                existing_data = json.load(file)
        except Exception as e:
            return False

        existing_data.append(new_data)

        try:
            with open(self.json_file_path, 'w') as file:
                json.dump(existing_data, file, indent=4)
            return True
        except Exception as e:
            return False

    
    #------------------------------------------------------------
    # | Get JSON file path |
    # This function returns the path of the JSON file.
    def get_json_file_path(self):
        return self.json_file_path
    
    #------------------------------------------------------------
    # | Delete JSON file |
    # This function deletes the JSON file.
    def delete_json_file(self):
        if os.path.exists(self.json_file_path):
            os.remove(self.json_file_path)
            self.json_file_path = ""
            return True
        else:
            return False
    
    #------------------------------------------------------------
    # | Get Analysis JSON path |
    # This function returns all the data in the JSON file.
    def get_analysis_json_path(self, progress):
        if not os.path.exists(self.root_directory):
            return None
        else:
            full_path = os.path.abspath(self.root_directory)
            normalized_path = os.path.normpath(full_path)
            file_path = {
                "file_path": normalized_path,
                "progress": progress
            }
            print(json.dumps(file_path))

    #------------------------------------------------------------
    # | Create random directory |
    # This function creates a random directory to store the files.
    # The structure of the files would be like this:
    #   - Websift_Modules
    #       - Files
    #           - Random File Name
    #               - HTML
    #                   -Original.html
    #                   -Modified.html 
    #               - JSON
    #                   - JSON file with random name
    #               - Images
    #                   - Website image1
    #                   - Website image2
    #                   - .............
    def create_random_directory(self):
        dirname = ''.join(random.choices(string.ascii_letters + string.digits, k=10))
        root_directory = os.path.join('Websift_Modules', 'Files', dirname)
        
        os.makedirs(os.path.join(root_directory, 'HTML'), exist_ok=True)
        os.makedirs(os.path.join(root_directory, 'JSON'), exist_ok=True)
        os.makedirs(os.path.join(root_directory, 'Images'), exist_ok=True)
        os.makedirs(os.path.join(root_directory, 'Report'), exist_ok=True)
        
        return root_directory


    def store_html_file(self, input_string, type):
        filename = type+'.html'
        directory = os.path.join(self.root_directory, 'HTML')
        filepath = os.path.join(directory, filename)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(input_string)
        return filepath
    
    # This function stripps a URL to its domain name.
    # Example: https://www.google.com/search?q=hello
    # Result: google.com
    def strip_link(self, link):
        if self.is_link(link):
            parsed = urlparse(link)
            return parsed.netloc
        else:
            return None
    