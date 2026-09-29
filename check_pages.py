import os
import win32com.client

word = win32com.client.Dispatch("Word.Application")
word.Visible = False

doc_path = os.path.abspath("Makalah_IEEE_Ketimpangan_Pembangunan_Indonesia.docx")
doc = word.Documents.Open(doc_path)
page_count = doc.ComputeStatistics(2) # 2 = wdStatisticPages
doc.Close(False)
word.Quit()

print("PAGE_COUNT:", page_count)
