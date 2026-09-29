import docx
from docx.oxml import parse_xml

doc = docx.Document()
s1 = doc.sections[0]
doc.add_paragraph("Abstract on single column")
s2 = doc.add_section()
s2._sectPr.append(parse_xml(r'<w:type xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" w:val="continuous"/>'))
doc.add_paragraph("Body in two columns")
doc.save("test_cont.docx")
print("Continuous section test passed!")
