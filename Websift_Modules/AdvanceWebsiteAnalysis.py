import json
import Website
import BasicWebsiteAnalysis 
from bs4 import BeautifulSoup
import ijson

class AdvanceWebsiteAnalysis(BasicWebsiteAnalysis.BasicWebsiteAnalysis):
   issues = []
   suggestions = []
   website = None
   soup = None
   #-------------------------------------------------------------
   # |Constructer|
   def __init__(self, website):
    self.website = website
    if self.website.get_HTML() == None:
       self.website.download_HTML()

    self.soup = BeautifulSoup(self.website.get_HTML(), "html.parser")

    #-------------------------------------------------------------       
    # |getSuggestions|
    # This function calls all the issues and give them suggestions 
   def getSuggestions(self):
    for issue in self.issues:
        suggestion = self.generateSuggestions(issue)
        self.suggestions.append(suggestion)
    return self.suggestions

    #-------------------------------------------------------------
    # |generateSuggestion|
    # This function generate suggestions for the issues 
   def generateSuggestions(self):
    filepath = self.website.get_json_file_path()
    
    with open(filepath, 'r') as file:
        
        issues = ijson.items(file, 'item')
        
        modified_issues = []
        
        for issue in issues:
            if 'code' in issue and '1.1.1.1.1' in issue['code']:
                issue['suggestion'] = ('اضف محتوى نصي يبين المغزى من الصورة', 'اضف نص بديل للمحتوى الغير نصي', 'عدم اظهار الصورة الا في الضرورة حتى لا يعيق مستخدمي قارئ الصفحات')
            elif 'code' in issue and '1.1.1.1.2' in issue['code']:
                issue['suggestion'] = ('اضف نص ارتباطي يبين المغزى من الرابط', )
            elif 'code' in issue and '1.4.2.1.1' in issue['code']:
                issue['suggestion'] = ('ضع زرًا للتحكم بالصوت في بداية الصفحة','تشغيل الصوت فقط عند طلب المستخدم')
            elif 'code' in issue and '1.4.2.1.2' in issue['code']:
                issue['suggestion'] = ('اضف خاصية التحكم بالصوت للوسائط', )
            elif 'code' in issue and '1.4.2.1.3' in issue['code']:
                issue['suggestion'] = ('تشغيل الصوت فقط عند طلب المستخدم', )
            elif 'code' in issue and '1.3.5.1.1' in issue['code']:
                issue['suggestion'] = ('استخدم خاصية لملئ الاستبيان بشكل تلقائي','اظهار المغزى من الحقل المطلوب تعبئته')
            elif 'code' in issue and '3.2.0.1.1' in issue['code']:
                issue['suggestion'] = ('(list) تخلص من الدور الزائد', )
            elif 'code' in issue and '3.2.0.2.1' in issue['code']:
                issue['suggestion'] = ('(img) تخلص من الدور الزائد', )
            elif 'code' in issue and '3.2.0.2.2' in issue['code']:
                issue['suggestion'] = ('(presentation) تخلص من الدور الزائد','اضف نص بديل للعرض')
            elif 'code' in issue and '3.2.0.2.3' in issue['code']:
                issue['suggestion'] = ('(img) تخلص من الدور الزائد','اضف نص بديل للصورة')
            elif 'code' in issue and '3.2.0.3.1' in issue['code']:
                issue['suggestion'] = ('(aria-level) تخلص من الدور الزائد',)
            elif 'code' in issue and '3.2.0.4.1' in issue['code']:
                issue['suggestion'] = ('تخلص من الدور الزائد من نوع'+str(issue['role']), )
            elif 'code' in issue and '3.2.0.4.2' in issue['code']:
                issue['suggestion'] = ('احذف الدور ' + issue['role'],'عين دور فقط إذا كان يبين المغزى من العنصر لا ان يكون تكرار')
            elif 'code' in issue and '3.1.0.1.1' in issue['code']:
                issue['suggestion'] = ('تخلص من الدور الغير تفاعلي'+str(issue['role']), 'اضف دور تفاعلي اذا كان العنصر تفاعلي لتبيين المغزى فقط بدون تكرار الدور')
            elif 'code' in issue and '2.4.10.0.1' in issue['code']:
                issue['suggestion'] = ('اضف عنوان للجزء يبين محتواه',)
            elif 'code' in issue and '2.4.10.0.2' in issue['code']:
                issue['suggestion'] = ('تجنب استخدام العناوين الفارغة في الصفحة','اضف عنوان للجزء يبين محتواه')
            elif 'code' in issue and '1.3.4.0.1' in issue['code']:
                issue['suggestion'] = ('اضف meta بإسم viewport للصفحة','استخدم خاصية width=device-width في meta viewport', 'استخدم خاصية initial-scale=1 في meta viewport', 'استخدم خاصية user-scalable=no في meta viewport')
            elif 'code' in issue and '1.3.4.0.2' in issue['code']:
                issue['suggestion'] = ('استخدم خاصية width=device-width في meta viewport',)
            elif 'code' in issue and '1.3.4.0.3' in issue['code']:
                issue['suggestion'] = ('استخدم خاصية initial-scale=1 في meta viewport',)
            elif 'code' in issue and '1.3.4.0.4' in issue['code']:
                issue['suggestion'] =('استخدم خاصية user-scalable=no في meta viewport',)
            elif 'code' in issue and '1.4.4.0.1' in issue['code']:
                issue['suggestion'] =('استخدم % بدلاً من استخدام px', 'استخدم em بدلاً من استخدام px')
            elif 'code' in issue and '1.4.4.0.2' in issue['code']:
                issue['suggestion'] =('استخدم % بدلاً من استخدام pt', 'استخدم em بدلاً من استخدام pt')
            elif 'code' in issue and '1.4.4.1.1' in issue['code']:
                issue['suggestion'] =('استخدم عنصر em بدلاً من استخدام عنصر i', 'استخدم عنصر strong بدلاً من استخدام عنصر i')
            elif 'code' in issue and '1.4.4.1.2' in issue['code']:
                issue['suggestion'] =('استخدم عنصر em بدلاً من استخدام عنصر b', 'استخدم عنصر strong بدلاً من استخدام عنصر b')
            else:
                issue['suggestion'] = ' لمزيد من المعلومات www.w3.org توجه الى'
            modified_issues.append(issue)
            
    with open(filepath, 'w', encoding='utf-8') as file:
        json.dump(modified_issues, file, ensure_ascii=False)

