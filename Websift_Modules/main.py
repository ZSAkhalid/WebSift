import sys
import json
import BasicWebsiteAnalysis
import AdvanceWebsiteAnalysis
import PremiumWebsiteAnalysis
import Website
import os
import ReportGenerator
# Catching the arguments
# link = sys.argv[1]
# typeOfRequest = sys.argv[2]
# requestID = sys.argv[3]

link = "https://web-sift.github.io/websift_demo_page/"
typeOfRequest = "advanced"
requestID = "j4l3k24"

# Check if the website is reachable
website = Website.Website(link)
if not website.is_website_reachable():
    error = []
    error.append("الموقع غير متاح")
    print(json.dumps({"error": error}))
    sys.exit(0)

website.download_HTML()

# Begin the services
if typeOfRequest == "basic":
    try:
        basic_analysis = BasicWebsiteAnalysis.BasicWebsiteAnalysis(website)
        basic_analysis.analyze()
        progress = round(basic_analysis.get_calculated_points(), 2)
        striped_link = website.strip_link(website.link)
        full_url = website.link
        report = ReportGenerator.ReportGenerator(striped_link, full_url, requestID, progress, typeOfRequest, website.get_json_file_path(), os.path.join(website.get_root_directory(), 'Report'))
        isReportGenerated = report.generate_report()
        if isReportGenerated == "Report generated successfully":
            basic_analysis.getAccessibilityIssues(progress)
        else:
            print(json.dumps({"error": isReportGenerated}))
    except Exception as e:
        print(json.dumps({"error": str(e)}))


elif typeOfRequest == "advanced":
    try:
        advanced_analysis = AdvanceWebsiteAnalysis.AdvanceWebsiteAnalysis(website)
        advanced_analysis.analyze()
        advanced_analysis.generateSuggestions()
        progress = round(advanced_analysis.get_calculated_points(), 2)
        striped_link = website.strip_link(website.link)
        full_url = website.link
        report = ReportGenerator.ReportGenerator(striped_link, full_url, requestID, progress, typeOfRequest, website.get_json_file_path(), os.path.join(website.get_root_directory(), 'Report'))
        isReportGenerated = report.generate_report()
        if isReportGenerated == "Report generated successfully":
            advanced_analysis.getAccessibilityIssues(progress)
        else:
            print(json.dumps({"error": isReportGenerated}))
    except Exception as e:
        print(json.dumps({"error": str(e)}))



elif typeOfRequest == "premium":
    premium_analysis = PremiumWebsiteAnalysis.PremiumWebsiteAnalysis(website)
    premium_analysis.analyze()
    premium_analysis.generateSuggestions()
    premium_analysis.applyFixes()
    premium_analysis.getFixedCode()
    progress = round(premium_analysis.get_calculated_points(), 2)
    striped_link = website.strip_link(website.link)
    full_url = website.link
    try:
        report = ReportGenerator.ReportGenerator(striped_link, full_url, requestID, progress, typeOfRequest, website.get_json_file_path(), os.path.join(website.get_root_directory(), 'Report'))
        isReportGenerated = report.generate_report()
        if isReportGenerated == "Report generated successfully":
            premium_analysis.getAccessibilityIssues(progress)
        else:
            print(json.dumps({"error": isReportGenerated}))
    except Exception as e:
        print(json.dumps({"error": str(e)}))