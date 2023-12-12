import json
import Website
import BasicWebsiteAnalysis
import AdvanceWebsiteAnalysis
import TextRecognition
from bs4 import BeautifulSoup
import re
import ijson
import os
import IconRecognition


class PremiumWebsiteAnalysis(AdvanceWebsiteAnalysis.AdvanceWebsiteAnalysis):
   issues = []
   suggestions = []
   fixesApplied = []
   website = None
   soup = None
   stripped_html = None

   #-------------------------------------------------------------
   # |Constructer|
   def __init__(self, website):
    self.analyzed_images = []
    self.website = website
    if self.website.get_HTML() == None:
         self.website.download_HTML()
    self.stripped_html = self.website.get_striped_HTML()
    self.soup = BeautifulSoup(website.get_HTML(), "html.parser")
   
   #-------------------------------------------------------------
    # |Get Fixed Code|
   def getFixedCode(self):
    result = '\n'.join(self.stripped_html)
    soup = BeautifulSoup(result, "html.parser")
    self.website.store_html_file(str(soup),"fixed")

   #-------------------------------------------------------------
   # | Functions to fix the code |

   def applyFixes(self):
    filepath = self.website.get_json_file_path()
    
    modified_issues = []
    
    with open(filepath, 'r', encoding='utf-8') as file:
        # Stream the JSON content using ijson
        issues = ijson.items(file, 'item')
        
        for issue in issues:
            code_is_fixed = False
            # Check if line number is integer
            if issue['line'] == "N/A":
              continue
            line_number = int(issue['line']) - 1
            if line_number is None:
                continue
            
            elif '1.1.1.1.2' in issue['code']:
              code_is_fixed = self.fix_anchor(line_number, issue)

            elif '3.1.0' in issue['code']:
                tag_name = issue['tag_name']
                tag_role = issue['role']
                tag_attr = issue['attr']
                code_is_fixed = self.remove_attribute(line_number, tag_name, tag_attr, tag_role)

            elif '3.2.0' in issue['code']:
                code_is_fixed = self.fix_redundent_rules(line_number, issue)

            elif '1.1.1.1.1' in issue['code']:
                code_is_fixed = self.fix_images(line_number, issue)

            if code_is_fixed:
                issue['state'] = 'fixed'
            else:
                issue['state'] = 'unfixed'
                
            modified_issues.append(issue)
            
    with open(filepath, 'w', encoding='utf-8') as file:
        json.dump(modified_issues, file, ensure_ascii=False)

   #-------------------------------------------------------------
   # | Replace line |
   # This function replaces the line of code from the HTML page with the fixed line.
   def replace_line(self, line_number, new_line):
    self.stripped_html[line_number] = str(new_line)

   #-------------------------------------------------------------
   # | Remove attribute |
   # This function reomves unnecesary attribute of a tag.
   def remove_attribute(self, line_number, tag_name, tag_attr, tag_issue):
    temp = BeautifulSoup(self.stripped_html[line_number],"html.parser")
    
    tags = temp.find_all(tag_name)

    for tag in tags:
     if tag.get(tag_attr) == tag_issue:
      del tag[tag_attr]
      self.replace_line(line_number, str(temp))
      return True
    return False

   #-------------------------------------------------------------
   # | Fix redundent rules |
   
   def fix_redundent_rules(self, line_number, error):
    tag_name = error['tag_name']
    error_code = error['code']
    if '3.2.0.1.1' in error_code:
     tag_role = error['role']
     return self.fix_missing_list_attribute(line_number, tag_name, tag_role)
    elif '3.2.0.2.3' in error_code:
     tag_issue = error['role']
     tag_attr = error['attr']
     return self.remove_attribute(line_number, tag_name, tag_attr,tag_issue)
    elif '3.2.0.3.1' in error_code:
     tag_aria_level = error['aria-level']
     tag_attr = error['attr']
     return self.remove_attribute(line_number, tag_name, tag_attr,tag_aria_level)
    elif '3.2.0.4.2' in error_code:
     tag_role = error['role']
     tag_attr = error['attr']
     tag_type = error['type']
     return self.fix_redundent_input(line_number, tag_name, tag_attr,tag_role, tag_type)
    elif '3.2.0.4.1':
      tag_attr = error['attr']
      tag_issue = error['role']
      return self.remove_attribute(line_number, tag_name, tag_attr,tag_issue)
    else:
     return False

   # | 3.2.0.1.1 |
   def fix_missing_list_attribute(self, line_number, tag_name, tag_role):
    
    temp = BeautifulSoup(self.stripped_html[line_number],"html.parser")
    
    tags = temp.find_all(tag_name)

    for tag in tags:
     if tag.get('role') == tag_role and not tag.get('list') == 'None':
      del tag['role']
      self.replace_line(line_number, str(temp))
      return True
    return False
   
   # | 3.2.0.4.1 |
   def fix_redundent_input(self, line_number, tag_name, tag_attr,tag_role, tag_type):
    temp = BeautifulSoup(self.stripped_html[line_number],"html.parser")
    
    tags = temp.find_all(tag_name)

    for tag in tags:
     if tag.get('type') == tag_type and tag.get(tag_attr) == tag_role:
      del tag['role']
      self.replace_line(line_number, str(temp))
      return True
    return False
   
   #-------------------------------------------------------------
   # | Fix Images |
   def fix_images(self,line_number,error):
    if not error['src']:
     return False
    
    if not self.website.is_image_downloadable(link=str(error['src'])):
     return False
     
    temp = BeautifulSoup(self.stripped_html[line_number],"html.parser")
    images = temp.find_all("img")
    image_src= error['src']

    for tag in images:

      if self.img_have_alt(tag) and tag.get('src') == image_src:
       if self.analyzed_images:
        for analyzed_image in self.analyzed_images:
          if analyzed_image['image_link'] == image_src:
            tag["alt"] = analyzed_image['alt']
            self.replace_line(line_number, str(temp))
            return True
       # Download the image -> Extract the text
       img_path = self.website.download_image(image_src)
       if os.path.exists(str(img_path)):
        extracted_text, _, _, _, _ = TextRecognition.TextRecognition().extract_text(img_path)

        recognized_icon = IconRecognition.IconRecognition().classify(img_path)

        alt_text = ""
        text_detected_message = "صورة تحتوي على نص: "
        if recognized_icon != "Prediction confidence too low":
          alt_text = "صورة تحتوي على ايقونة: " + recognized_icon
          text_detected_message = "وتحتوي على نص: "
          
        if extracted_text:
          alt_text += text_detected_message + str(extracted_text).replace('\n', ' ')
        if extracted_text or recognized_icon != "Prediction confidence too low":
          analyzed_image = {
            "image_link": image_src,
            "alt": alt_text
          }
          self.analyzed_images.append(analyzed_image)
          tag["alt"] = alt_text
          self.replace_line(line_number, str(temp))
          return True
    return False
      
  # | check img have alt |
   def img_have_alt(self, tag):
    return str(tag.get('alt')).strip() == "" or not tag.get("alt")
   
   def fix_anchor(self, line_number, error):
    link = error['href']
    if link == None or link == "None" or str(link).strip() == '':
      return False
    temp = BeautifulSoup(self.stripped_html[line_number],"html.parser")
    anchors = temp.find_all('a')
    for anchor in anchors:
      if anchor.get('href') == link:
        if self.website.is_link(link):
          stripped_url = self.website.strip_link(link)
          anchor['alt'] = "رابط يؤدي للموقع: " + stripped_url
          self.replace_line(line_number, str(temp))
          return True
        elif str(link).startswith('/'):
          anchor['alt'] = "رابط يؤدي للصفحة: " + link
          self.replace_line(line_number, str(temp))
          return True
        else:
          return False
    return False