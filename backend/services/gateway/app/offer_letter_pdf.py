import os
from fpdf import FPDF
from datetime import datetime

class OfferLetterPDF(FPDF):
    def header(self):
        # Draw top right corner graphics (Yellow and Black polygons)
        self.set_fill_color(255, 204, 0) # Yellow
        self.polygon([(140, 0), (210, 0), (210, 50)], style="F")
        self.set_fill_color(51, 51, 51) # Dark Gray/Black
        self.polygon([(170, 0), (210, 0), (210, 40)], style="F")
        self.set_fill_color(255, 204, 0) # Yellow
        self.polygon([(0, 0), (40, 0), (0, 30)], style="F")
        
        # Logo Area (Top Left)
        self.set_xy(20, 20)
        self.set_font('helvetica', 'B', 24)
        self.set_text_color(20, 20, 20)
        self.cell(0, 10, "MuleShield AI", new_x="LMARGIN", new_y="NEXT")
        self.set_font('helvetica', '', 12)
        self.set_text_color(100, 100, 100)
        self.cell(0, 10, "Empowering The Digital Defenders", new_x="LMARGIN", new_y="NEXT")
        
        self.ln(10)
        
        # Horizontal Line
        self.set_draw_color(100, 100, 100)
        self.set_line_width(1)
        self.line(20, self.get_y(), 190, self.get_y())
        self.ln(5)
        
        # Title
        self.set_font('helvetica', 'B', 22)
        self.set_text_color(40, 40, 40)
        self.cell(0, 15, "INTERNSHIP OFFER LETTER", align="C", new_x="LMARGIN", new_y="NEXT")
        
        self.ln(5)

    def footer(self):
        # Draw bottom corners
        self.set_fill_color(255, 204, 0) # Yellow
        self.polygon([(170, 297), (210, 297), (210, 250)], style="F")
        self.set_fill_color(51, 51, 51) # Dark Gray/Black
        self.polygon([(185, 297), (210, 297), (210, 270)], style="F")
        
        self.set_y(-25)
        self.set_font('helvetica', '', 10)
        self.set_text_color(100, 100, 100)
        self.cell(0, 10, "info@muleshield.ai    |    www.muleshield.ai", align="C")

def generate_offer_letter_pdf(name, role, date_start, date_end) -> bytearray:
    pdf = OfferLetterPDF()
    pdf.add_page()
    pdf.set_margins(20, 20, 20)
    
    pdf.ln(15)
    pdf.set_font("helvetica", "", 12)
    pdf.set_text_color(0, 0, 0)
    pdf.cell(0, 8, "To:", new_x="LMARGIN", new_y="NEXT")
    
    pdf.set_font("helvetica", "B", 14)
    pdf.cell(0, 10, name.upper(), new_x="LMARGIN", new_y="NEXT")
    
    pdf.ln(5)
    pdf.set_font("helvetica", "B", 12)
    pdf.cell(0, 8, "Congratulations!", new_x="LMARGIN", new_y="NEXT")
    
    pdf.ln(2)
    pdf.set_font("helvetica", "", 12)
    
    # Text block
    text = f"We are pleased to inform you that you have been successfully selected for {role} Internship Program at MuleShield AI.\n\n"
    text += "This internship has been carefully designed to emphasize practical learning and real-world implementation, enabling you to build strong technical foundations and industry-relevant skills within your chosen domain.\n\n"
    text += "During the internship, you will engage in:\n"
    
    pdf.multi_cell(0, 6, text)
    
    # Bullet points
    pdf.ln(2)
    bullets = [
        chr(149) + " Hands-on, project-based learning aligned with industry standards",
        chr(149) + " Practical exposure to real-world problem-solving and workflows",
        chr(149) + " Portfolio-ready project development suitable for professional platforms",
        chr(149) + " Developing discipline, consistency, and a professional mindset"
    ]
    for bullet in bullets:
        pdf.set_x(25)
        pdf.multi_cell(0, 6, bullet)
        
    pdf.ln(5)
    
    text2 = f"The internship will be conducted in virtual mode from {date_start} to {date_end}. Active participation and a learning-oriented approach are expected throughout the duration of the program.\n\n"
    text2 += "We wish you a productive and successful internship journey with MuleShield AI."
    
    pdf.multi_cell(0, 6, text2)
    
    pdf.ln(15)
    pdf.set_x(120)
    pdf.set_font("helvetica", "B", 12)
    pdf.cell(0, 6, "Best Regards,", new_x="LMARGIN", new_y="NEXT")
    
    pdf.ln(8)
    pdf.set_x(120)
    pdf.set_font("helvetica", "I", 18)
    pdf.set_text_color(100, 100, 100)
    pdf.cell(0, 10, "MuleShield AI", new_x="LMARGIN", new_y="NEXT")
    
    pdf.set_x(120)
    pdf.set_font("helvetica", "", 11)
    pdf.set_text_color(0, 0, 0)
    pdf.cell(0, 5, "Founder of MuleShield AI", new_x="LMARGIN", new_y="NEXT")
    
    return pdf.output()
