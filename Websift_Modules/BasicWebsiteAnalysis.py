import json
import string
import Website
from bs4 import BeautifulSoup
import re

class BasicWebsiteAnalysis:
   website = None
   soup = None
   totalTagsSifted = 0
   totalIssues = 0
   #-------------------------------------------------------------
   # |Constructer|
   def __init__(self, website):
      self.website = website
      if self.website.get_HTML() == None:
         self.website.download_HTML()
      self.soup = BeautifulSoup(self.website.get_HTML(), "html.parser")

   #-------------------------------------------------------------
   # |Analyze|
   # This function calls all the functions that analyze the website
   def analyze(self):
      if self.website.get_json_file_path() == None:
         self.website.create_json_file()
      self.check_alternative_text("a")
      self.check_alternative_text("img")
      self.check_media_with_no_control()
      self.check_Input_accessibility()
      self.check_invalid_overrides()
      self.check_redundant_roles()
      self.check_view_orientation()
      self.check_unresize_text_tags()
      self.check_style_font_size()


   #-------------------------------------------------------------
   # |Check for alt|
   # This function searches for all the <a> and <img> tags in the page
   # Then it checks if the tag contains "alt" attribute
   # If it does not contain it, it prints the line number of the tag along with the error code
   def check_alternative_text(self, tagName):
      tags = self.soup.find_all(tagName)
      self.totalTagsSifted += len(tags)
      tagErrorCode = None
      if tagName == "img":
         tagErrorCode = "WCAG 1.1.1 محتوى غير نصي: "
         for tag in tags:
               if str(tag.get("alt")).strip() == "" or tag.get("alt") == None:
                  issue = {
                     "error_code": tagErrorCode,
                     "message": f"تم إكتشاف {tagName} من دون وصف بديل في السطر {tag.sourceline}.",
                     "code": "1.1.1.1.1",
                     "tag_name": tag.name,
                     "line": tag.sourceline,
                     "src": tag.get("src")
                     }
                  self.website.append_data_to_json(issue)
                  self.totalIssues += 1
      elif tagName == "a":
         tagErrorCode = "WCAG 2.4.4 الغرض من الرابط (في السياق): "
         for tag in tags:
               if (str(tag.get("alt")).strip() == "" or tag.get("alt") == None) and not tag.contents:
                  issue = {
                           "error_code": tagErrorCode,
                           "message": f"تم إكتشاف {tagName} من دون وصف بديل في السطر {tag.sourceline}.",
                           "code": "1.1.1.1.2",
                           "tag_name": tag.name,
                           "line": tag.sourceline,
                           "href": tag.get("href")
                     }
                  self.website.append_data_to_json(issue)
                  self.totalIssues += 1



   #-------------------------------------------------------------
   # |Check for media with no control|
   # This function searches for all the <video> and <audio> tags in the page
   # Then it checks if the tag contains "controls" attribute
   # If it does not contain it, it prints the line number of the tag
   def check_media_with_no_control(self):
      tagErrorCode = "WCAG 1.4.2 التحكم بالصوت: "
      medias = self.soup.find_all("audio")
      self.totalTagsSifted += len(medias)
      #medias += self.soup.find_all("video")
      for media in medias:
         if media.get("controls") == None and media.get("autoplay"):
            issue = {
               "error_code": tagErrorCode,
               "message": f"WCAG 1.4.2 التحكم بالصوت: تم إكتشاف وسائط لا يوجد بها تحكم وتشتغل تلقائياً في السطر {media.sourceline}",
               "code": "1.4.2.1.1",
               "tag_name": media.name,
               "line": media.sourceline
            }
            self.website.append_data_to_json(issue)
            self.totalIssues += 1
         elif media.get("controls") == None:
            issue = {
               "error_code": tagErrorCode,
               "message": f"WCAG 1.4.2 التحكم بالصوت: تم إكتشاف وسائط لا يوجد بها تحكم في السطر {media.sourceline}",
               "code": "1.4.2.1.2",
               "tag_name": media.name,
               "line": media.sourceline
            }
            self.website.append_data_to_json(issue)
            self.totalIssues += 1
         elif media.get("autoplay"):
            issue = {
               "error_code": tagErrorCode,
               "message": f"WCAG 1.4.2 التحكم بالصوت: تم إكتشاف وسائط تشتغل تلقائياً في السطر {media.sourceline}",
               "code": "1.4.2.1.3",
               "tag_name": media.name,
               "line": media.sourceline
            }
            self.website.append_data_to_json(issue)
            self.totalIssues += 1



   #-------------------------------------------------------------
   # |Check for input accessibility|
   # Check if "input" have "plasceholder" with text
   # Check if inputs have a crossponding "for" attribut in any "label" connected to it
   # Check if input have title
   # Cehck if input uses "aria-label" || "aria-labelledby"
   # Use DOM to check if input's parent is a "label"
   # Check weather buttons contains texts inside or not

   # Explicitly labeling
   def input_contains(self, input, attribute):
      if input.get(attribute) == None:
         return False
      else:
         return True 

   def has_label(self, input):
      if not input.get('id') == None:
         label = self.soup.find('label', attrs={'for': input.get('id')})
         if label == None:
            return False
         else:
            return True
      else:
         return False

   # A general function to be used repeatedly later in check_Input_accessibility function
   def has_general_accessibile(self, input):
      if self.has_label(input):
         return True
         
      elif self.input_contains(input, "title"):
         return True
         
      elif (self.input_contains(input, "aria-label") or self.input_contains(input, "aria-labelledby")):
         return True
         
      elif self.has_label_parent(input):
         return True
      
   # Implicitly labeling
   def has_label_parent(self, input):
      if input.parent.name != 'label':
         return False
      else:
         return True

   def check_Input_accessibility(self):
      inputs = self.soup.find_all('input')
      self.totalTagsSifted += len(inputs) * 2
      errorType = None
   
      for input in inputs:
         hasAccessibilityAttribute = False
         inputLine = input.sourceline
         typeOfInput = input.get("type")

         # Checking if the input has a type
         if typeOfInput == None:
            errorType = "مدخل بدون نوع"
            hasAccessibilityAttribute = False

         # Checking for input with text type in general
         elif typeOfInput == "text" or typeOfInput == "email" or typeOfInput == "number" or typeOfInput == "password" or typeOfInput == "search" or typeOfInput == "tel" or typeOfInput == "url":

            #checking if input have placeholder
            if self.input_contains(input, "placeholder") and not hasAccessibilityAttribute:
               hasAccessibilityAttribute = True
         
            elif self.has_general_accessibile(input) and not hasAccessibilityAttribute:
               hasAccessibilityAttribute = True

            else:
               errorType = "مدخل نصي بدون وصف بديل"

         # Checking for input with button type 
         elif typeOfInput == "button" or typeOfInput == "submit" or typeOfInput == "reset":

            if self.has_general_accessibile(input) and not hasAccessibilityAttribute:
               hasAccessibilityAttribute = True
            
            #checking if input have value
            elif self.input_contains(input, "value"):
               hasAccessibilityAttribute = True
            
            else:
               errorType = "مدخل زر بدون وصف بديل"

      # Checking for input with image type if they contain alt or not
         elif typeOfInput == "image":

            if input.get("alt") != None and not hasAccessibilityAttribute:
               hasAccessibilityAttribute = True

            else:
               errorType = "مدخل صورة بدون وصف بديل"

      # Checking if the input is hidden to skipp the iteration
         elif typeOfInput == "hidden":
            continue
      
         # Checking for the rest of inputs
         else:
            if self.has_general_accessibile(input) and not hasAccessibilityAttribute:
               hasAccessibilityAttribute = True
            else:
               errorType = "مدخل بدون وصف بديل"

         # Writing the error found
         if not hasAccessibilityAttribute:
            issue = {
                "error_code":"WCAG 1.3.5 تحديد الغرض من المدخلات: ",
                "message": f" تم إكتشاف {errorType} في السطر {inputLine}.",
                "code": "1.3.5.1.1",
                "tag_name": input.name,
                "type": typeOfInput,
                "line": input.sourceline
            }
            self.totalIssues += 2
            self.website.append_data_to_json(issue)

   #-------------------------------------------------------------
   # |Check for redundant roles|
   def check_redundant_roles(self):
      anchoreWithHrefTags = self.soup.find_all("a", href=True)
      anchoreWithoutHrefTags = self.soup.find_all("a", href=False) 
      addressTags = self.soup.find_all("address") 
      areaWithHrefTags = self.soup.find_all("area", href=True)
      areaWithoutHrefTags = self.soup.find_all("area", href=False)
      articleTags = self.soup.find_all("article")
      asideTags = self.soup.find_all("aside")
      bTags = self.soup.find_all("b")
      bdiTags = self.soup.find_all("bdi")
      bdoTags = self.soup.find_all("bdo")
      blockquoteTags = self.soup.find_all("blockquote")
      bodyTags = self.soup.find_all("body")
      buttonTags = self.soup.find_all("button")
      captionTags = self.soup.find_all("caption")
      codeTags = self.soup.find_all("code")
      dataTags = self.soup.find_all("data")
      datalistTags = self.soup.find_all("datalist")
      delTags = self.soup.find_all("del")
      detailsTags = self.soup.find_all("details")
      dfnTags = self.soup.find_all("dfn")
      dialogTags = self.soup.find_all("dialog")
      divTags = self.soup.find_all("div")
      emTags = self.soup.find_all("em")
      fieldsetTags = self.soup.find_all("fieldset")
      figureTags = self.soup.find_all("figure")
      formTags = self.soup.find_all("form")
      h1Tags = self.soup.find_all("h1")
      h2Tags = self.soup.find_all("h2")
      h3Tags = self.soup.find_all("h3")
      h4Tags = self.soup.find_all("h4")
      h5Tags = self.soup.find_all("h5")
      h6Tags = self.soup.find_all("h6")
      hgrouptags = self.soup.find_all("hgroup")
      hrTags = self.soup.find_all("hr")
      htmlTags = self.soup.find_all("html")
      iTags = self.soup.find_all("i")
      imgTags = self.soup.find_all("img")
      inputButtonTags = self.soup.find_all("input", type="button")
      inputCheckboxTags = self.soup.find_all("input", type="checkbox")
      inputEmailTags = self.soup.find_all("input", type="email")
      inputImageTags = self.soup.find_all("input", type="image")
      inputNumberTags = self.soup.find_all("input", type="number")
      inputRadioTags = self.soup.find_all("input", type="radio")
      inputRangeTags = self.soup.find_all("input", type="range")
      inputResetTags = self.soup.find_all("input", type="reset")
      inputSearchTags = self.soup.find_all("input", type="search")
      inputSubmitTags = self.soup.find_all("input", type="submit")
      insTags = self.soup.find_all("ins")
      mainTags = self.soup.find_all("main")
      mathTags = self.soup.find_all("math")
      menuTags = self.soup.find_all("menu")
      meterTags = self.soup.find_all("meter")
      navTags = self.soup.find_all("nav")
      olTags = self.soup.find_all("ol")
      optgroupTags = self.soup.find_all("optgroup")
      outputTags = self.soup.find_all("output")
      pTags = self.soup.find_all("p")
      preTags = self.soup.find_all("pre")
      progressTags = self.soup.find_all("progress")
      qTags = self.soup.find_all("q")
      sTags = self.soup.find_all("s")
      sampTags = self.soup.find_all("samp")
      searchTags = self.soup.find_all("search")
      smallTags = self.soup.find_all("small")
      spanTags = self.soup.find_all("span")
      strongTags = self.soup.find_all("strong")
      subTags = self.soup.find_all("sub")
      supTags = self.soup.find_all("sup")
      svgTags = self.soup.find_all("svg")
      tableTags = self.soup.find_all("table")
      tbodyTags = self.soup.find_all("tbody")
      textareaTags = self.soup.find_all("textarea")
      tfootTags = self.soup.find_all("tfoot")
      theadTags = self.soup.find_all("thead")
      timeTags = self.soup.find_all("time")
      trTags = self.soup.find_all("tr")
      uTags = self.soup.find_all("u")
      ulTags = self.soup.find_all("ul")

      # Anchore tags
      self.is_redundent(anchoreWithHrefTags, "link")
      self.is_redundent(anchoreWithoutHrefTags, "generic")

      # Address tags
      self.is_redundent(addressTags, "group")

      # Area tags
      self.is_redundent(areaWithHrefTags, "link")
      self.is_redundent(areaWithoutHrefTags, "generic")

      # Article tags
      self.is_redundent(articleTags, "article")

      # Aside tags
      self.is_redundent(asideTags, "complementary")

      # B tags
      self.is_redundent(bTags, "generic")

      # Bdi tags
      self.is_redundent(bdiTags, "generic")

      # Bdo tags
      self.is_redundent(bdoTags, "generic")

      # Blockquote tags
      self.is_redundent(blockquoteTags, "blockquote")

      # Body tags
      self.is_redundent(bodyTags, "generic")

      # Button tags
      self.is_redundent(buttonTags, "button")

      # Caption tags
      self.is_redundent(captionTags, "caption")

      # Code tags
      self.is_redundent(codeTags, "code")

      # Data tags
      self.is_redundent(dataTags, "generic")

      # Datalist tags
      self.is_redundent(datalistTags, "listbox")

      # Del tags
      self.is_redundent(delTags, "deletion")

      # Details tags
      self.is_redundent(detailsTags, "group")

      # Dfn tags
      self.is_redundent(dfnTags, "term")

      # Dialog tags
      self.is_redundent(dialogTags, "dialog")

      # Div tags
      self.is_redundent(divTags, "generic")

      # Em tags
      self.is_redundent(emTags, "emphasis")

      # Fieldset tags
      self.is_redundent(fieldsetTags, "group")

      # Figure tags
      self.is_redundent(figureTags, "figure")

      # Form tags
      self.is_redundent(formTags, "form")

      # H1 to H6 tags
      self.is_redundent(h1Tags, "heading")
      self.is_redundent(h2Tags, "heading")
      self.is_redundent(h3Tags, "heading")
      self.is_redundent(h4Tags, "heading")
      self.is_redundent(h5Tags, "heading")
      self.is_redundent(h6Tags, "heading")
      self.is_aria_level_valid(h1Tags, "1")
      self.is_aria_level_valid(h2Tags, "2")
      self.is_aria_level_valid(h3Tags, "3")
      self.is_aria_level_valid(h4Tags, "4")
      self.is_aria_level_valid(h5Tags, "5")
      self.is_aria_level_valid(h6Tags, "6")

      # Hgroup tags
      self.is_redundent(hgrouptags, "generic")

      # Hr tags
      self.is_redundent(hrTags, "separator")

      # Html tags
      self.is_redundent(htmlTags, "document")

      # I tags
      self.is_redundent(iTags, "generic")

      # Img tags
      self.is_image_role_valid(imgTags)

      # Input Button tags
      self.is_redundent(inputButtonTags, "button")

      # Input Checkbox tags
      self.is_redundent(inputCheckboxTags, "checkbox")

      # Input Email tags
      self.missing_list_attribute(inputEmailTags, "textbox")

      # Input Image tags
      self.is_redundent(inputImageTags, "button")

      # Input Number tags
      self.is_redundent(inputNumberTags, "spinbutton")

      # Input Radio tags
      self.is_redundent(inputRadioTags, "radio")

      # Input Range tags
      self.is_redundent(inputRangeTags, "slider")

      # Input Reset tags
      self.is_redundent(inputResetTags, "button")

      # Input Search tags
      self.missing_list_attribute(inputSearchTags, "searchbox")

      # Input Submit tags
      self.is_redundent(inputSubmitTags, "button")

      # Ins tags
      self.is_redundent(insTags, "insertion")

      # main tags
      self.is_redundent(mainTags, "main")

      # math tags
      self.is_redundent(mathTags, "math")

      # menu tags
      self.is_redundent(menuTags, "list")

      # meter tags
      self.is_redundent(meterTags, "meter")

      # nav tags
      self.is_redundent(navTags, "navigation")

      # ol tags
      self.is_redundent(olTags, "list")

      # optgroup tags
      self.is_redundent(optgroupTags, "group")

      # output tags
      self.is_redundent(outputTags, "status")

      # p tags
      self.is_redundent(pTags, "paragraph")

      # pre tags
      self.is_redundent(preTags, "generic")

      # progress tags
      self.is_redundent(progressTags, "progressbar")

      # q tags
      self.is_redundent(qTags, "generic")

      # s tags
      self.is_redundent(sTags, "deletion")

      # samp tags
      self.is_redundent(sampTags, "generic")

      # search tags
      self.is_redundent(searchTags, "search")

      # small tags
      self.is_redundent(smallTags, "generic")

      # span tags
      self.is_redundent(spanTags, "generic")

      # strong tags
      self.is_redundent(strongTags, "strong")

      # sub tags
      self.is_redundent(subTags, "subscript")

      # sup tags
      self.is_redundent(supTags, "superscript")

      # svg tags
      self.is_redundent(svgTags, "graphics-document")

      # table tags
      self.is_redundent(tableTags, "table")

      # tbody tags
      self.is_redundent(tbodyTags, "rowgroup")

      # textarea tags
      self.is_redundent(textareaTags, "textbox")

      # tfoot tags
      self.is_redundent(tfootTags, "rowgroup")

      # thead tags
      self.is_redundent(theadTags, "rowgroup")

      # time tags
      self.is_redundent(timeTags, "time")

      # tr tags
      self.is_redundent(trTags, "row")

      # u tags
      self.is_redundent(uTags, "generic")

      # ul tags
      self.is_redundent(ulTags, "list")



   def missing_list_attribute(self, tags, role):
      for tag in tags:
         if tag.get("role") == role and tag.get("list") == None :
            issue = {
               "error_code": "WAI-ARIA 3.2 تجنب تحديد الأدوار الزائدة عن الحاجة : ",
               "message": f"تم اكتشاف دور زائد عن الحاجة في العلامة {tag.name} دوره {role}  في السطر {tag.sourceline}.",
               "code": "3.2.0.1.1",
               "tag_name": tag.name,
               "role": role,
               "attr": "role",
               "line": tag.sourceline
            }
            self.website.append_data_to_json(issue)

   def is_image_role_valid(self, tags):
      for tag in tags:
         role = tag.get("role")
         if str(tag.get("alt")).strip() != "" and tag.get("alt") != None and role == "img":
            issue ={
               "error_code": "WAI-ARIA 3.2 تجنب تحديد الأدوار الزائدة عن الحاجة : ",
               "message":f"تم اكتشاف دور زائد عن الحاجة في العلامة {tag.name} بدور صورة في السطر {tag.sourceline}.",
               "code": "3.2.0.2.1",
               "tag_name": tag.name,
               "role": role,
               "attr": "role",
               "line": tag.sourceline
            }
            self.website.append_data_to_json(issue)
         elif (str(tag.get("alt")).strip() == "" or tag.get("alt") == None) and role == "presentation":
            issue = {
               "error_code": "WAI-ARIA 3.2 تجنب تحديد الأدوار الزائدة عن الحاجة : ",
               "message": f"تم اكتشاف دور زائد عن الحاجة في العلامة {tag.name} بدور العرض على السطر {tag.sourceline}.",
               "code": "3.2.0.2.2",
               "tag_name": tag.name,
               "role": role,
               "issue": "role",
               "line": tag.sourceline
            }
            self.website.append_data_to_json(issue)
         elif (str(tag.get("alt")).strip() == "" or tag.get("alt") == None) and role == "img":
            issue ={
               "error_code": "WAI-ARIA 3.2 تجنب تحديد الأدوار الزائدة عن الحاجة : ",
               "message": f" تم اكتشاف دور زائد عن الحاجة في العلامة {tag.name} بدور صورة في السطر {tag.sourceline}.",
               "code": "3.2.0.2.3",
               "tag_name": tag.name,
               "role": role,
               "attr": "role",
               "line": tag.sourceline
            }
            self.website.append_data_to_json(issue)


   def is_aria_level_valid(self, tags, level):
      for tag in tags:
         if tag.get("aria-level") == level:
            issue = {
               "error_code": "WAI-ARIA 3.2 تجنب تحديد الأدوار الزائدة عن الحاجة : ",
               "message" : (f"تم اكتشاف دور زائد عن الحاجة في العلامة {tag.name} التي تحدد نفس المستوى في الـ aria-level في السطر {tag.sourceline} "),
               "code": "3.2.0.3.1",
               "tag_name": tag.name,
               "aria-level": level,
               "attr": "aria-level",
               "line": tag.sourceline
            }
            self.website.append_data_to_json(issue)



      
   def is_redundent(self, tags, role):
      for tag in tags:
         tag_role = tag.get("role")
         if tag_role == role:
            tag_type = tag.get("type")
            if tag_type == None:
               issue ={
               "error_code": "WAI-ARIA 3.2 تجنب تحديد الأدوار الزائدة عن الحاجة : ",
               "message": f"تم اكتشاف دور زائد عن الحاجة في العلامة {tag.name} بدور { tag_role } في السطر {tag.sourceline}.",
               "code": "3.2.0.4.1",
               "tag_name": tag.name,
               "role": tag_role,
               "attr": "role",
               "line": tag.sourceline
               }
            else:
               issue ={
               "error_code": "WAI-ARIA 3.2 تجنب تحديد الأدوار الزائدة عن الحاجة : ",
               "message": f"تم اكتشاف دور زائد عن الحاجة في العلامة {tag.name} من نوع { tag_type } بدور { tag_role } في السطر {tag.sourceline}.",
               "code": "3.2.0.4.2",
               "tag_name": tag.name,
               "role": tag_role,
               "type": tag_type,
               "attr": "role",
               "line": tag.sourceline
               }
            self.website.append_data_to_json(issue)
            



   #-------------------------------------------------------------
   #|Check for overriding interactive elements with non-interactive roles|
   def check_invalid_overrides(self):
      # Set of invalid roles that should not override interactive elements
      INVALID_ROLES = {
      'article',
      'banner',
      'complementary',
      'contentinfo',
      'definition',
      'doc-abstract',
      'doc-acknowledgments',
      'doc-afterword',
      'doc-appendix',
      'doc-bibliography',
      'doc-chapter', 
      'doc-conclusion',
      'doc-credit',
      'doc-credits',
      'doc-endnotes',
      'doc-epilogue',
      'doc-errata',
      'doc-foreword',
      'doc-glossary',
      'doc-index',
      'doc-introduction',
      'doc-pagelist',
      'doc-preface',
      'doc-prologue',
      'form',
      'img',
      'main',
      'navigation',
      'region',
      'search',
      'section',
      'sectionhead',
      'div'
      }
      # Set of native interactive HTML elements 
      INTERACTIVE_ELEMENTS = {
      'a', 
      'audio',
      'button',
      'details',
      'embed',
      'iframe',
      'input',
      'label',
      'map',
      'meter',
      'object',
      'progress',
      'select',
      'textarea',
      'video'
      }
      # Find all interactive elements in document
      get_interactive_elements = self.soup.find_all(INTERACTIVE_ELEMENTS)

      # Check each interactive element
      for element in get_interactive_elements:
         # Check if element has role attribute and check if role is in invalid roles set
         if element.has_attr('role') and element['role'] in INVALID_ROLES:
            issue ={
               "error_code": "WAI-ARIA 3.1 تجنب تجاوز العناصر التفاعلية بأدوار غير تفاعلية: ",
               "message":f"تم اكتشاف {element.name} بدور خاطئ {element['role']} في السطر {element.sourceline}.",
               "code": "3.1.0.1.1",
               "tag_name": element.name,
               "role": element['role'],
               "attr": "role",
               "line": element.sourceline
            }
            self.website.append_data_to_json(issue)
   
   
   #-------------------------------------------------------------
   #|Check for Section headings|
   def check_section_headings(self):
      sections = self.soup.find_all('section')

      if not sections:
         return
      
      self.totalTagsSifted += len(sections) * 3
      headings =['h1', 'h2', 'h3', 'h4', 'h5', 'h6']
      for section in sections:
         section_heading = section.find(headings)
         if not section_heading:
               issue = {
                  "error_code": "WCAG 2.4.10 Section بدون عنوان : ",
                  "message": f"تم اكتشاف Section بدون أي عنوان في السطر {section.sourceline}.",
                  "code": "2.4.10.0.1",
                  "tag_name": section.name,
                  "line": section.sourceline
               }
               self.website.append_data_to_json(issue)
               self.totalIssues += 3
         elif not section_heading.contents:
               issue = {
                  "error_code": "WCAG 2.4.10 Section بدون عنوان : ",
                  "message": f"تم اكتشاف Section بعنوان فارغ في السطر {section.sourceline}.",
                  "code": "2.4.10.0.2",
                  "tag_name": section.name,
                  "line": section.sourceline
               }
               self.website.append_data_to_json(issue)
               self.totalIssues += 3
       
   #-------------------------------------------------------------
   #|Check for orientation|
   def check_view_orientation(self):
    viewport_tag = self.soup.find('meta', attrs={'name': 'viewport'})
    self.totalTagsSifted += 2
    
    if not viewport_tag:
        issue = {
                "error_code":"WCAG 1.3.4 المعيار التوجيهي: ",
                "message": f"صفحة الويب لاتحتوي على عنصر meta بالاسم viewport.",
                "code": "1.3.4.0.1",
                "tag_name": "meta",
                "line": "N/A"
            }
        self.totalIssues += 2
        self.website.append_data_to_json(issue)
        return

    viewport = viewport_tag.get('content')
    

    if 'width=device-width' not in viewport:
       issue = {
                "error_code":"WCAG 1.3.4 المعيار التوجيهي: ",
                "message": f"تم اكتشاف عنصر meta بالاسم viewport لايحتوي على width=device-width في السطر {viewport_tag.sourceline}.",
                "code": "1.3.4.0.2",
                "tag_name": "meta",
                "line": viewport_tag.sourceline
            }
       self.totalIssues += 2
       self.website.append_data_to_json(issue)
       return

    if 'initial-scale=1' not in viewport:
       issue = {
                "error_code":"WCAG 1.3.4 المعيار التوجيهي: ",
                "message": f"تم اكتشاف عنصر meta بالاسم viewport لايحتوي على initial-scale=1 في السطر {viewport_tag.sourceline}.",
                "code": "1.3.4.0.3",
                "tag_name": "meta",
                "line": viewport_tag.sourceline
            }
       self.totalIssues += 2
       self.website.append_data_to_json(issue)
       return

    if 'user-scalable=no' in viewport:
       issue = {
                "error_code":"WCAG 1.3.4 المعيار التوجيهي: ",
                "message": f"تم اكتشاف عنصر meta بالاسم viewport يحتوي على user-scalable=no في السطر {viewport_tag.sourceline}.",
                "code": "1.3.4.0.4",
                "tag_name": "meta",
                "line": viewport_tag.sourceline
            }
       self.totalIssues += 2
       self.website.append_data_to_json(issue)
       return

   
   # ------------------------------------------------------------
      #|Check Resize Text|
   def extract_all_font_sizes(self, text):
      pattern = r'font-size:\s*\d+px;'
      matches = re.findall(pattern, text)
      return matches

   def check_style_font_size(self):
      style = self.soup.find('style', attrs={'type': 'text/css'})
      if not style:
         return 
      if not style.contents:
         return
      font_sizes = self.extract_all_font_sizes(style.contents[0])
      if len(font_sizes) <= 0:
         return
      
      self.totalTagsSifted += len(font_sizes) * 2

      for font_size in font_sizes:
         if 'px' in font_size:
               issue = {
                  "error_code": "WCAG 1.4.4 تغير حجم النص: ",
                  "message": f"تم إكتشاف استخدام 'px' في تعيين حجم النص في السطر {style.sourceline}.",
                  "code": "1.4.4.0.1",
                  "tag_name": style.name,
                  "line": style.sourceline
               }
               self.website.append_data_to_json(issue)
               self.totalIssues += 2

         elif 'pt' in font_size:
               issue = {
                  "error_code": "WCAG 1.4.4 تغير حجم النص: ",
                  "message": f"تم إكتشاف استخدام 'pt' في تعيين حجم النص في السطر {style.sourceline}.",
                  "code": "1.4.4.0.2",
                  "tag_name": style.name,
                  "line": style.sourceline
               }
               self.website.append_data_to_json(issue)
               self.totalIssues += 2
      
   #Check for <b> and <i> in the code
   def check_unresize_text_tags(self):
         tag_i = self.soup.find_all("i")
         tag_b = self.soup.find_all("b")
         self.totalTagsSifted += len(tag_i) * 2
         self.totalTagsSifted += len(tag_b) * 2
         # Check <i> tags
         for tag in tag_i:
            if tag.contents:
                  issue = {
                     "error_code": "WCAG 1.4.4 تغير حجم النص: ",
                     "message": f"تم إكتشاف حجم نص غير متغير في السطر {tag.sourceline}.",
                     "code": "1.4.4.1.1",
                     "tag_name": tag.name,
                     "line": tag.sourceline
                  }
                  self.website.append_data_to_json(issue)
                  self.totalIssues += 2
         # Check <b> tags
         for tag in tag_b:
            issue = {
               "error_code": "WCAG 1.4.4 تغير حجم النص: ",
               "message": f"تم إكتشاف نص غير متغير في السطر {tag.sourceline}.",
               "code": "1.4.4.1.2",
               "tag_name": tag.name,
               "line": tag.sourceline
            }
            self.website.append_data_to_json(issue)
            self.totalIssues += 2
         
   #-------------------------------------------------------------
   #|Calculate website points|
   def get_calculated_points(self):
    try:
        if self.totalTagsSifted == 0:
            return 100
        elif self.totalIssues == 0:
            return 100
        elif self.totalIssues >= self.totalTagsSifted:
            return 0
        else:
         calculated = 100 - ((self.totalIssues / self.totalTagsSifted) * 100)
         return calculated

    except TypeError:
       return 100

    except ValueError as ve:
       return 100

    except Exception as e:
       return 100

   #-------------------------------------------------------------
   #|Return all of the code issues|
   def getAccessibilityIssues(self, progress):
    return self.website.get_analysis_json_path(progress)