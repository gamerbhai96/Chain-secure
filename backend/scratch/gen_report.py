from fpdf import FPDF
import os, json

class PDF(FPDF):
    def header(self):
        if self.page_no() > 1:
            self.set_font('Helvetica','I',8)
            self.cell(0,8,'ChainSecure - Bitcoin Fraud Detection | Final Year Project Report',0,1,'R')
    def footer(self):
        self.set_y(-13)
        self.set_font('Helvetica','I',8)
        self.cell(0,8,f'Page {self.page_no()}  |  ChainSecure',0,0,'C')

def sec(p,t):
    p.set_font('Helvetica','B',13)
    p.set_text_color(5,150,105)
    p.cell(0,9,t,0,1)
    p.set_text_color(0,0,0)

def body(p,t):
    p.set_font('Times','',11)
    p.multi_cell(0,6,t.strip())
    p.ln(3)

def ch(p,n,t):
    p.add_page()
    p.set_fill_color(5,150,105)
    p.set_text_color(255,255,255)
    p.set_font('Helvetica','B',16)
    p.cell(0,13,f'Chapter {n}  -  {t}',0,1,'L',True)
    p.set_text_color(0,0,0)
    p.ln(5)

pdf = PDF()
pdf.set_auto_page_break(True,15)

