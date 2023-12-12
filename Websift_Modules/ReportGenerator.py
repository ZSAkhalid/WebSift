from jinja2 import Environment, FileSystemLoader
from weasyprint import HTML
import os
import json
from datetime import datetime
import Website

class ReportGenerator:
    def __init__(self, stripped_link, full_link,request_id, progress, service_type, json_path, pdf_output_path):
        self.stripped_link = stripped_link
        self.request_id = request_id
        self.progress = progress
        self.service_type = service_type
        self.json_path = json_path  # Path to the JSON file
        self.pdf_output_path = pdf_output_path  # Path to store the PDF report
        self.this_folder = os.path.dirname(os.path.abspath(__file__))
        template_folder = os.path.join(self.this_folder, 'asset')
        self.data = {
            'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M"),  # Current timestamp
            'analyzed_website': stripped_link,
            'full_link': full_link,
            'request_id': request_id,
            'logo_url': 'file:\\' + os.path.join(template_folder, 'WebSiftWhite.png'),
            'progress': progress
        }

    @staticmethod
    def add_rtl_markers(text):
        RTL_EMBEDDING = "\u202B"
        POP_DIRECTIONAL_FORMATTING = "\u202C"
        RTL_MARK = "\u200F"
        return RTL_EMBEDDING + RTL_MARK + text + POP_DIRECTIONAL_FORMATTING
    
    @staticmethod
    def remove_phrase_after(text, phrase):
        # Find the phrase and delete everything after it, including the phrase itself
        index = text.find(phrase)
        if index != -1:
            return text[:index]
        return text

    def generate_report(self):
        try:
            # Reading the json file from the provided path
            with open(self.json_path, 'r', encoding='utf-8') as file:
                errors = json.load(file)

            # Replace colons in the values of the JSON object
            for error in errors:
                for key, value in error.items():
                    if isinstance(value, str):
                        error[key] = value.replace(":", " ")

            # Counting the number of errors and updating the data dictionary
            self.data['number_of_errors'] = len(errors)

            # Adding RTL markers if needed
            for error in errors:
                if 'message' in error:
                    error['message'] = self.remove_phrase_after(error['message'], "في السطر")
                    error['message'] = self.add_rtl_markers(error['message'])

            self.data['errors'] = errors

            # Load HTML template based on service type
            template_folder = os.path.join(self.this_folder, 'asset')
            env = Environment(loader=FileSystemLoader(searchpath=template_folder))
            template_name = f'template{self.service_type.capitalize()}.html'
            template = env.get_template(template_name)

            # Render the template with data
            html_out = template.render(self.data)

            # Generate the PDF and save it to the specified path
            output_filename = os.path.join(self.pdf_output_path, 'accessibility_report.pdf')
            HTML(string=html_out).write_pdf(output_filename)
            return "Report generated successfully"
        except Exception as e:
            return "Error: " + str(e)
