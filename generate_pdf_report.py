#!/usr/bin/env python3
"""
Generate a publication-grade, professional 4-page technical PDF report for:
"Low-Cost Optical Attenuation System for Real-Time Microplastic Detection"
Department of Electronics and Instrumentation / Cyber-Physical Systems (CPS)
Manipal Institute of Technology (MIT), Manipal

Reflects the exact active project architecture:
1. Problem Statement & Motivation
2. Simple & Intuitive Working Principle (Physical Laser & Shadows Flow)
3. Step-by-Step 4-Stage Operational Pipeline & Hardware Pinout
4. Active Embedded DSA Engine & Real-Time Data Lifecycle (When Readings Arrive)
5. Complete Bill of Materials (BOM), Parts Used & Approximate Prices
6. Societal Impact, UN SDGs, National Missions & Final Specifications
"""

import os
import sys
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

# ----------------------------------------------------------------------
# Register Windows Segoe UI Fonts for Crisp Typography & Native Unicode (₹, µm, •, →)
# ----------------------------------------------------------------------
pdfmetrics.registerFont(TTFont('SegoeUI', 'C:/Windows/Fonts/segoeui.ttf'))
pdfmetrics.registerFont(TTFont('SegoeUI-Bold', 'C:/Windows/Fonts/segoeuib.ttf'))
pdfmetrics.registerFont(TTFont('SegoeUI-Italic', 'C:/Windows/Fonts/segoeuii.ttf'))
pdfmetrics.registerFont(TTFont('SegoeUI-SemiBold', 'C:/Windows/Fonts/seguisb.ttf'))

pdfmetrics.registerFontFamily(
    'SegoeUI',
    normal='SegoeUI',
    bold='SegoeUI-Bold',
    italic='SegoeUI-Italic',
    boldItalic='SegoeUI-Bold'
)


# ----------------------------------------------------------------------
# Numbered Canvas for "Page X of Y" and Running Header/Footer
# ----------------------------------------------------------------------
class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_header_footer(num_pages)
            super().showPage()
        super().save()

    def draw_header_footer(self, page_count):
        self.saveState()
        self.setFont("SegoeUI", 7.5)
        self.setFillColor(colors.HexColor("#64748B"))

        # Running Header on Pages 2, 3, 4
        if self._pageNumber > 1:
            self.drawString(40, 810, "OPTICAL ATTENUATION MICROPLASTIC DETECTION SYSTEM — CPS & DSA REPORT")
            self.drawRightString(555, 810, "MIT MANIPAL | DEPT. OF E&I")
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.5)
            self.line(40, 804, 555, 804)

        # Running Footer on All Pages
        self.setStrokeColor(colors.HexColor("#E2E8F0"))
        self.setLineWidth(0.5)
        self.line(40, 32, 555, 32)

        self.drawString(40, 22, "Academic & Technical Evaluation Documentation | Academic Year 2026-27 | B.Tech CPS")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(555, 22, page_str)
        self.restoreState()


def generate_pdf():
    pdf_filename = "Microplastic_Detection_Project_Report.pdf"
    doc = SimpleDocTemplate(
        pdf_filename,
        pagesize=A4,
        leftMargin=40,
        rightMargin=40,
        topMargin=40,
        bottomMargin=38
    )

    usable_width = 595.27 - 80  # 515.27 pt

    # Modern Palette
    NAVY = colors.HexColor("#0F172A")
    DARK_BLUE = colors.HexColor("#1E3A8A")
    PRIMARY_BLUE = colors.HexColor("#0284C7")
    TEAL = colors.HexColor("#0D9488")
    BG_LIGHT = colors.HexColor("#F8FAFC")
    BG_ALT = colors.HexColor("#F1F5F9")
    TEXT_MAIN = colors.HexColor("#1E293B")
    TEXT_MUTED = colors.HexColor("#475569")
    BORDER_COLOR = colors.HexColor("#CBD5E1")
    ALERT_RED = colors.HexColor("#B91C1C")
    ALERT_BG = colors.HexColor("#FEF2F2")
    SUCCESS_GREEN = colors.HexColor("#16A34A")
    SUCCESS_BG = colors.HexColor("#F0FDF4")

    # Typography
    title_style = ParagraphStyle(
        'DocTitle',
        fontName='SegoeUI-Bold',
        fontSize=17,
        leading=21,
        textColor=NAVY,
        spaceAfter=2
    )

    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        fontName='SegoeUI',
        fontSize=9,
        leading=12,
        textColor=PRIMARY_BLUE,
        spaceAfter=6
    )

    h1_style = ParagraphStyle(
        'SectionH1',
        fontName='SegoeUI-Bold',
        fontSize=11,
        leading=14,
        textColor=DARK_BLUE,
        spaceBefore=7,
        spaceAfter=3,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'SectionH2',
        fontName='SegoeUI-Bold',
        fontSize=9,
        leading=12,
        textColor=TEAL,
        spaceBefore=5,
        spaceAfter=2,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'BodyDark',
        fontName='SegoeUI',
        fontSize=7.8,
        leading=10.5,
        textColor=TEXT_MAIN,
        alignment=4,  # Justified
        spaceAfter=3
    )

    bullet_style = ParagraphStyle(
        'BulletText',
        fontName='SegoeUI',
        fontSize=7.8,
        leading=10.5,
        textColor=TEXT_MAIN,
        leftIndent=8,
        spaceAfter=2
    )

    callout_style = ParagraphStyle(
        'CalloutText',
        fontName='SegoeUI',
        fontSize=7.5,
        leading=10,
        textColor=TEXT_MAIN
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        fontName='SegoeUI-Bold',
        fontSize=7.2,
        leading=9,
        textColor=colors.white,
        alignment=1
    )

    table_body_style = ParagraphStyle(
        'TableBody',
        fontName='SegoeUI',
        fontSize=7,
        leading=9,
        textColor=TEXT_MAIN
    )

    table_body_center = ParagraphStyle(
        'TableBodyCenter',
        fontName='SegoeUI',
        fontSize=7,
        leading=9,
        textColor=TEXT_MAIN,
        alignment=1
    )

    table_body_bold_right = ParagraphStyle(
        'TableBodyBoldRight',
        fontName='SegoeUI-Bold',
        fontSize=7,
        leading=9,
        textColor=DARK_BLUE,
        alignment=2
    )

    story = []

    # ==================================================================
    # PAGE 1: COVER HEADER, PROBLEM STATEMENT & SIMPLE WORKING EXPLANATION
    # ==================================================================
    story.append(Paragraph("CYBER-PHYSICAL SENSING PLATFORM — EMBEDDED IoT & DSA ARCHITECTURE", ParagraphStyle(
        'Badge', fontName='SegoeUI-Bold', fontSize=7.2, leading=9, textColor=TEAL, spaceAfter=2
    )))
    story.append(Paragraph("Low-Cost Optical Attenuation System for Real-Time Microplastic Detection", title_style))
    story.append(Paragraph("Continuous In-Line Water Quality Surveillance with Turbidity Interlock Failsafe, Thermal Calibration & Live Web Digital Twin", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=DARK_BLUE, spaceBefore=0, spaceAfter=5))

    # Project Metadata Box
    meta_data = [
        [
            Paragraph("<b>Institution:</b> Manipal Institute of Technology (MIT), Manipal<br/>"
                      "<b>Department:</b> Department of Electronics & Instrumentation<br/>"
                      "<b>Academic Program:</b> B.Tech Cyber Physical Systems (CPS) | 3rd Semester<br/>"
                      "<b>Subject Context:</b> Data Structures & Algorithms (DSA) / CPS Lab Project", table_body_style),
            Paragraph("<b>Project Team Members:</b><br/>"
                      "• <b>Parth Yadav</b> (Reg ID: 251090610366)<br/>"
                      "• <b>Anisha Praveenkumar Mandroli</b> (Reg ID: 251090610160)<br/>"
                      "• <b>Kirtika Kushwaha</b> (Reg ID: 251090610204)<br/>"
                      "<b>Firmware & DSA Architect:</b> Akshat Awasthi", table_body_style)
        ]
    ]
    meta_table = Table(meta_data, colWidths=[255, 260])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BG_ALT),
        ('BOX', (0,0), (-1,-1), 0.8, BORDER_COLOR),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 5))

    # 1. Problem Statement & Motivation
    story.append(Paragraph("1. Problem Statement & Motivation", h1_style))
    story.append(Paragraph(
        "<b>The Microplastic Pollution Crisis:</b> Microplastics (synthetic particles and fibers &lt; 5 mm down to sub-micron dimensions) contaminate freshwater reservoirs, river basins, municipal tap water networks, and commercial bottled water. Emanating from synthetic clothing laundering, tyre wear, packaging breakdown, and industrial runoff, microplastics present severe health hazards. Once ingested, they cross biological cell barriers, induce oxidative stress, cause chronic gut inflammation, and leach toxic endocrine disruptors (phthalates, BPA) while adsorbing heavy metals and bacterial biofilms.",
        body_style
    ))
    story.append(Paragraph(
        "<b>Limitations of Existing Laboratory Equipment:</b> Conventional detection relies on benchtop spectroscopy—specifically Fourier Transform Infrared (μ-FTIR) and Raman Microspectroscopy. While highly accurate, these laboratory instruments suffer from fatal real-world drawbacks: they cost between <b>$30,000 and $180,000+ (₹25,00,000 to ₹1.5 Crore INR)</b>, require centralized cleanrooms, take hours of complex chemical sample digestion to destroy organics, and demand PhD-level analytical chemists. Conversely, manual microscope counting is slow, subjective, and error-prone. Municipal water plants and rural areas have no way to detect plastic in real time.",
        body_style
    ))
    story.append(Paragraph(
        "<b>The Engineering Challenge:</b> To build a portable, automated continuous-flow instrument costing under <b>₹3,000 (~$35 USD)</b> capable of detecting microplastic particles in real time, while completely preventing <i>false positive alarms</i> caused by organic mud, sand, algae, or ambient temperature fluctuations.",
        body_style
    ))

    # Problem Statement Callout Box
    prob_box = [
        [Paragraph("<b>CORE OBJECTIVE:</b> Deliver a fully autonomous cyber-physical edge sensor that uses optical light attenuation and smart sensor fusion to spot microscopic plastic particles in flowing water. Real-time data is processed via in-memory C++ Data Structures on an ESP32 chip and streamed live over Wi-Fi to a web dashboard at &gt;99.9% lower cost than benchtop spectrometers.", callout_style)]
    ]
    prob_table = Table(prob_box, colWidths=[usable_width])
    prob_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#EFF6FF")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#2563EB")),
        ('LEFTPADDING', (0,0), (-1,-1), 7),
        ('RIGHTPADDING', (0,0), (-1,-1), 7),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(prob_table)
    story.append(Spacer(1, 5))

    # 2. How We Detect Microplastics (Simple & Intuitive Explanation)
    story.append(Paragraph("2. How the Detection Works (In Simple Words: Light & Shadows)", h1_style))
    story.append(Paragraph(
        "The system does not use expensive chemistry or destructive radiation. Instead, it works on a simple, elegant optical principle: <b>Light Attenuation & Light Scattering</b> (detecting the microscopic shadows cast by plastic particles):",
        body_style
    ))
    story.append(Paragraph(
        "• <b>1. The Clean Water Baseline:</b> Inside a light-proof dark box, a 650nm Red Laser continuously shoots a beam across a transparent water tube onto a sensitive Light Sensor (BPW34 Photodiode). When clean, particle-free water is flowing, the sensor receives full light and outputs a steady, high voltage (<b>~3.10 Volts</b>).<br/>"
        "• <b>2. The Plastic Particle Passes By:</b> When a microscopic plastic fragment or fiber floats through the laser beam, it scatters and blocks the light photons for a fraction of a millisecond.<br/>"
        "• <b>3. The Voltage Dip (The Detection Signature):</b> The light sensor momentarily receives less light, causing a sharp, microsecond-scale <b>V-shaped voltage dip</b> (e.g., dropping from 3.10V down to 2.20V before bouncing back). The ESP32 microcontroller samples this line 100 times per second: whenever it spots this quick dip, it counts: <b>+1 Microplastic Detected!</b> Deeper drops correspond to larger particles.<br/>"
        "• <b>4. Temperature Correction:</b> Water bends light slightly differently when cold vs warm. A waterproof DS18B20 digital temperature probe continuously checks the water temperature so the ESP32 can automatically adjust the optical baseline threshold, maintaining pinpoint accuracy.",
        bullet_style
    ))

    # Visual Laser/Shadow Box
    visual_box_text = (
        "<b>OPTICAL BEAM & VOLTAGE DIP PRINCIPLE:</b><br/>"
        "Clean Water State:&nbsp;&nbsp;&nbsp;&nbsp;[650nm Red Laser Diode] ═══════════════════════════════════════► [Photodiode Sensor] = 3.10V (Stable Baseline)<br/>"
        "Particle Crossing:&nbsp;&nbsp;&nbsp;&nbsp;[650nm Red Laser Diode] ═════════► [🔴 Plastic Particle] ──────────► [Photodiode Sensor] = 2.15V (Sharp V-Dip Detected!)"
    )
    visual_table = Table([[Paragraph(visual_box_text, table_body_style)]], colWidths=[usable_width])
    visual_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BG_ALT),
        ('BOX', (0,0), (-1,-1), 1, TEAL),
        ('LEFTPADDING', (0,0), (-1,-1), 7),
        ('RIGHTPADDING', (0,0), (-1,-1), 7),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(visual_table)

    # End of Page 1
    story.append(PageBreak())

    # ==================================================================
    # PAGE 2: PHYSICAL PIPELINE, FAILSAFE LOGIC & MASTER PINOUT
    # ==================================================================
    story.append(Paragraph("3. Step-by-Step Physical Pipeline & Failsafe Architecture", h1_style))
    story.append(Paragraph(
        "To guarantee that real-world mud, silt, and algae do not trigger false detections, fluid moves through a strict 4-phase physical pipeline before optical scanning occurs:",
        body_style
    ))

    pipeline_data = [
        [
            Paragraph("<b>Stage 1: Mechanical Pre-Filtration</b>", table_body_style),
            Paragraph("The ESP32 switches an optocoupled relay to start the 5V Peristaltic Pump. The pump draws water smoothly from the sample cup without any impeller contact. Fluid passes through an inline 40–100 μm mesh filter (fuel filter) that mechanically traps large sand grains, grit, pebbles, and organic leaves while allowing water and microplastics to pass straight through.", table_body_style)
        ],
        [
            Paragraph("<b>Stage 2: The Mud Check (Turbidity Failsafe)</b>", table_body_style),
            Paragraph("<b>The Crucial Hardware Hack:</b> If the water contains suspended mud or silt, it would block the laser continuously and produce thousands of fake plastic counts. Filtered water flows past an Analog Turbidity Sensor. If voltage is LOW (&lt; 2.5V, muddy water), the ESP32 <b>instantly cuts the pump relay and locks the counter</b>. Optical counting is strictly allowed ONLY when water clarity is verified (≥ 2.5V).", table_body_style)
        ],
        [
            Paragraph("<b>Stage 3: Core Optical Dark Chamber</b>", table_body_style),
            Paragraph("Clear, validated water enters the light-sealed PVC Dark Chamber. The 650nm laser beam illuminates the flow tube. Microplastic particles scatter the beam, creating microsecond light dips caught by the BPW34 photodiode. An LM358 operational amplifier amplifies the faint current into a clean 0–3.3V analog signal fed into the ESP32 ADC.", table_body_style)
        ],
        [
            Paragraph("<b>Stage 4: IoT Digital Twin Web Sync</b>", table_body_style),
            Paragraph("The ESP32 processes the voltage dip, rates its severity, increments the microplastic tally, and streams live telemetry (voltages, temperature, counts, alerts) over Wi-Fi WebSockets (Port 81) to the Next.js web dashboard. The analyzed fluid exits safely into a waste beaker.", table_body_style)
        ]
    ]
    pipeline_table = Table(pipeline_data, colWidths=[135, 380])
    pipeline_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,-1), BG_ALT),
        ('BACKGROUND', (1,0), (1,-1), colors.white),
        ('BOX', (0,0), (-1,-1), 0.8, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(pipeline_table)
    story.append(Spacer(1, 5))

    # Architecture Flow Box
    flow_text = (
        "<b>COMPLETE SYSTEM FLUID & DATA FLOWCHART:</b><br/>"
        "Sample Beaker ➔ [5V Peristaltic Pump (Relay GPIO 26)] ➔ [Inline 40–100 µm Mesh Filter] ➔ [Turbidity Sensor (GPIO 34) + Temp (GPIO 4)]<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│ (Turbidity OK? YES ➔ Proceed | NO ➔ Emergency Pump Trip & Flag Alert)<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;▼<br/>"
        "[PVC Dark Chamber: 650nm Laser (GPIO 27) ➔ Flow Tube ➔ BPW34 Photodiode + LM358 Op-Amp (GPIO 35)] ➔ [Waste Beaker Outlet]<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│ (Microsecond Analog ADC Voltage Sampling @ 100 Hz)<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;▼<br/>"
        "[ESP32 Edge Controller: Active C++ DSA Pipeline] ➔ [Wi-Fi WebSocket / Port 81] ➔ [Next.js Cloud Digital Twin Dashboard]"
    )
    flow_table = Table([[Paragraph(flow_text, table_body_style)]], colWidths=[usable_width])
    flow_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BG_ALT),
        ('BOX', (0,0), (-1,-1), 1, DARK_BLUE),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(flow_table)
    story.append(Spacer(1, 5))

    # 4. Master Hardware Pinout Table
    story.append(Paragraph("4. Master Hardware Pinout & Circuit Interfacing", h1_style))
    story.append(Paragraph(
        "All hardware components wire directly to the ESP32 DevKit using dedicated low-noise ADC1 channels and isolated digital outputs:",
        body_style
    ))

    pin_data = [
        [Paragraph("Hardware Component", table_header_style), Paragraph("Component Pins", table_header_style), Paragraph("ESP32 Pin", table_header_style), Paragraph("Voltage", table_header_style), Paragraph("Interfacing Role & Circuit Notes", table_header_style)],
        [
            Paragraph("<b>Turbidity Sensor</b>", table_body_style),
            Paragraph("Analog OUT (A0)<br/>VCC / GND", table_body_style),
            Paragraph("<b>GPIO 34</b><br/>VIN (5V) / GND", table_body_style),
            Paragraph("0 – 3.3V<br/>5.0V DC", table_body_style),
            Paragraph("ADC1_CH6 input (safe during active Wi-Fi). Checks water clarity; triggers emergency pump trip if voltage &lt; 2.5V.", table_body_style)
        ],
        [
            Paragraph("<b>BPW34 Photodiode</b>", table_body_style),
            Paragraph("Signal (LM358 Pin 1)<br/>VCC / GND", table_body_style),
            Paragraph("<b>GPIO 35</b><br/>3V3 / GND", table_body_style),
            Paragraph("0 – 3.3V<br/>3.3V DC", table_body_style),
            Paragraph("ADC1_CH7 input. Buffered by LM358 op-amp in transimpedance topology with 100kΩ gain. Reads 3.1V baseline.", table_body_style)
        ],
        [
            Paragraph("<b>DS18B20 Temp Probe</b>", table_body_style),
            Paragraph("Data (Yellow)<br/>VCC (Red) / GND (Black)", table_body_style),
            Paragraph("<b>GPIO 4</b><br/>3V3 / GND", table_body_style),
            Paragraph("3.3V Logic<br/>3.3V DC", table_body_style),
            Paragraph("1-Wire digital thermometer with 4.7kΩ pull-up resistor to 3.3V rail. Calibrates baseline for thermal refractive index shifts.", table_body_style)
        ],
        [
            Paragraph("<b>1-Channel Relay</b>", table_body_style),
            Paragraph("IN (Signal)<br/>VCC / GND", table_body_style),
            Paragraph("<b>GPIO 26</b><br/>VIN (5V) / GND", table_body_style),
            Paragraph("3.3V Logic<br/>5.0V DC", table_body_style),
            Paragraph("Optocoupled input. Switched by ESP32 to safely control the 5V peristaltic pump motor power contacts.", table_body_style)
        ],
        [
            Paragraph("<b>650nm Laser Diode</b>", table_body_style),
            Paragraph("Anode (+) / Cathode (-)", table_body_style),
            Paragraph("<b>GPIO 27</b> / GND", table_body_style),
            Paragraph("3.3V DC / 0V", table_body_style),
            Paragraph("Switched by digital output; energized continuously inside the dark chamber during active interrogation cycles.", table_body_style)
        ]
    ]
    pin_table = Table(pin_data, colWidths=[90, 100, 75, 55, 195])
    pin_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), TEAL),
        ('BOX', (0,0), (-1,-1), 0.8, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_ALT]),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(pin_table)

    # End of Page 2
    story.append(PageBreak())

    # ==================================================================
    # PAGE 3: ACTIVE DSA ARCHITECTURE & DATA FLOW WHEN READINGS ARRIVE
    # ==================================================================
    story.append(Paragraph("5. Embedded DSA Engine: What Happens When Readings Arrive", h1_style))
    story.append(Paragraph(
        "To ensure deterministic execution on the ESP32 with zero heap fragmentation, the project implements a clean, active DSA pipeline written in pure C++ without heavy STL dependencies. Here is the exact data lifecycle when a sensor reading is captured:",
        body_style
    ))

    # DSA Flow Diagram
    dsa_flow_text = (
        "<b>DATA LIFECYCLE WHEN A READING ARRIVES:</b><br/>"
        "[ Physical Sensor Reading (GPIO 35) ] ── (Analog Voltage Sampling @ 100 Hz)<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;▼<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<b>1. SensorReading.h</b> ── Packages data into an immutable capsule (timestamp, voltage, type)<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;┌───────────────────┴───────────────────┐<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;▼&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;▼<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<b>2. SensorLinkedList.h</b>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<b>3. CircularBuffer.h</b><br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(Singly LL: Appends to permanent log)&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(10-node ring: Rolling moving avg filter)<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│ (Computes rolling baseline)<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└───────────────────┬───────────────────┘<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;▼<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<b>4. MicroplasticEvent.h</b> ── Dip detected? Calculates drop % & severity (LOW/MED/HIGH)<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<b>5. AlertQueue.h</b> ───────── Normal alert = FIFO tail | Critical mud/trip = Jump to HEAD!<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<b>6. SortingAlgorithms.h</b> ── Sorts events by particle size & benchmarks ESP32 micros()"
    )
    dsa_flow_table = Table([[Paragraph(dsa_flow_text, table_body_style)]], colWidths=[usable_width])
    dsa_flow_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BG_ALT),
        ('BOX', (0,0), (-1,-1), 1, TEAL),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(dsa_flow_table)
    story.append(Spacer(1, 5))

    # Detailed Step-by-Step Breakdown of Active DSA Files
    story.append(Paragraph("Detailed Breakdown of Active DSA Components", h2_style))

    dsa_breakdown_data = [
        [Paragraph("Active DSA Component & File", table_header_style), Paragraph("How It Works When Data Arrives", table_header_style), Paragraph("Real-World Hardware Purpose", table_header_style)],
        [
            Paragraph("<b>1. SensorReading.h</b><br/>(Data Encapsulation)", table_body_style),
            Paragraph("The instant an analog pin is sampled, this class packages `timestamp`, `voltage`, and `sensorType` into a single immutable object.", table_body_style),
            Paragraph("Prevents loose floating variables in ESP32 memory and standardizes data format for all data structures and WebSocket packets.", table_body_style)
        ],
        [
            Paragraph("<b>2. SensorLinkedList.h</b><br/>(Singly Linked List)", table_body_style),
            Paragraph("Calls `sensorLog.append(reading)`: dynamically allocates a `SensorNode` and links it to `tail->next` in strictly **$O(1)$** time.", table_body_style),
            Paragraph("<b>Unbounded Timeline:</b> Fixed arrays (`float arr[100]`) overflow or waste RAM. The linked list grows node-by-node during continuous water testing.", table_body_style)
        ],
        [
            Paragraph("<b>3. CircularBuffer.h</b><br/>(Circular Linked List)", table_body_style),
            Paragraph("A 10-node ring where `tail->next = head`. New readings overwrite the oldest slot. Computes rolling average in **$O(1)$** time.", table_body_style),
            Paragraph("<b>Optical Noise Filter:</b> Water waves cause voltage jitter. The circular buffer tracks the rolling baseline so true particle drops stand out clearly.", table_body_style)
        ],
        [
            Paragraph("<b>4. MicroplasticEvent.h</b><br/>(Particle Evaluator)", table_body_style),
            Paragraph("Calculates drop magnitude: `drop = baseline - voltage`. If `drop ≥ 0.15V`, evaluates severity: Low (&lt;15%), Medium (15-30%), High (&gt;30%).", table_body_style),
            Paragraph("Translates raw physical voltage drops into tangible environmental metrics (particle size category and contamination confidence).", table_body_style)
        ],
        [
            Paragraph("<b>5. AlertQueue.h</b><br/>(Queue & Priority Queue)", table_body_style),
            Paragraph("• Normal detection: `enqueue()` adds to the back of the line.<br/>• Emergency mud trip: `enqueuePriority()` jumps straight to the **HEAD**!", table_body_style),
            Paragraph("<b>Failsafe Protection:</b> If turbidity spikes, the emergency alarm preempts normal logs, cutting relay power immediately before false counts occur.", table_body_style)
        ],
        [
            Paragraph("<b>6. SortingAlgorithms.h</b><br/>(5 Sorting Algorithms)", table_body_style),
            Paragraph("Implements Bubble, Selection, Insertion ($O(n^2)$), Merge, and Quick Sort ($O(n \log n)$). Measures ESP32 hardware timer (`micros()`).", table_body_style),
            Paragraph("<b>Severity Ranking & Benchmarking:</b> Sorts plastic events to show the biggest particles first, proving how Quick Sort (~38µs) beats Bubble Sort (~290µs).", table_body_style)
        ]
    ]
    dsa_breakdown_table = Table(dsa_breakdown_data, colWidths=[120, 195, 200])
    dsa_breakdown_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), DARK_BLUE),
        ('BOX', (0,0), (-1,-1), 0.8, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_ALT]),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(dsa_breakdown_table)

    # End of Page 3
    story.append(PageBreak())

    # ==================================================================
    # PAGE 4: BILL OF MATERIALS (BOM), PRICES, SDGS & CONCLUSION
    # ==================================================================
    story.append(Paragraph("6. Bill of Materials (BOM), Parts Used & Approximate Prices", h1_style))
    story.append(Paragraph(
        "All components are commercially standard and procurable from local electronics retailers (Robu.in, Quartzcomponents) and international vendors. Estimated retail prices in Indian Rupees (₹ INR) and US Dollars ($ USD at ~₹83.5 / $1) are itemized below:",
        body_style
    ))

    bom_data = [
        [
            Paragraph("S.No", table_header_style),
            Paragraph("Component / Hardware Part", table_header_style),
            Paragraph("Specification & Model", table_header_style),
            Paragraph("Functional Responsibility in System", table_header_style),
            Paragraph("Qty", table_header_style),
            Paragraph("Price (₹ INR)", table_header_style),
            Paragraph("Price ($ USD)", table_header_style)
        ],
        [
            Paragraph("1", table_body_center),
            Paragraph("<b>ESP32 Development Board</b>", table_body_style),
            Paragraph("ESP-WROOM-32 / NodeMCU-32S", table_body_style),
            Paragraph("Master edge processor: 240MHz dual-core, 12-bit ADC, DSA execution, WebSocket server.", table_body_style),
            Paragraph("1", table_body_center),
            Paragraph("₹380", table_body_bold_right),
            Paragraph("$4.55", table_body_center)
        ],
        [
            Paragraph("2", table_body_center),
            Paragraph("<b>5V Regulated Power Source</b>", table_body_style),
            Paragraph("5V 2.0A–2.4A USB Adapter + Cable", table_body_style),
            Paragraph("Supplies stable, low-ripple DC power to ESP32, laser diode, relay coil, and sensor boards.", table_body_style),
            Paragraph("1", table_body_center),
            Paragraph("₹280", table_body_bold_right),
            Paragraph("$3.35", table_body_center)
        ],
        [
            Paragraph("3", table_body_center),
            Paragraph("<b>5V/12V Peristaltic Pump</b>", table_body_style),
            Paragraph("Mini DC Metering Pump (30–60 ml/min)", table_body_style),
            Paragraph("Positive displacement fluid drive; rollers compress tubing so fluid never contacts pump gears.", table_body_style),
            Paragraph("1", table_body_center),
            Paragraph("₹360", table_body_bold_right),
            Paragraph("$4.30", table_body_center)
        ],
        [
            Paragraph("4", table_body_center),
            Paragraph("<b>1-Channel 5V Relay Module</b>", table_body_style),
            Paragraph("5V Coil, Optocoupled, Flyback Diode", table_body_style),
            Paragraph("Galvanically isolates ESP32 GPIO 26 from inductive back-EMF spikes of the pump motor.", table_body_style),
            Paragraph("1", table_body_center),
            Paragraph("₹65", table_body_bold_right),
            Paragraph("$0.78", table_body_center)
        ],
        [
            Paragraph("5", table_body_center),
            Paragraph("<b>Medical Silicone Tubing</b>", table_body_style),
            Paragraph("2mm ID × 4mm OD, Flexible, 1.5m", table_body_style),
            Paragraph("Chemical-resistant, non-reactive fluid line connecting sample reservoir through optical flow cell.", table_body_style),
            Paragraph("1 pk", table_body_center),
            Paragraph("₹90", table_body_bold_right),
            Paragraph("$1.08", table_body_center)
        ],
        [
            Paragraph("6", table_body_center),
            Paragraph("<b>Inline Fuel / Mesh Pre-Filter</b>", table_body_style),
            Paragraph("Transparent 40–100 μm Mesh Filter", table_body_style),
            Paragraph("Stage 1 mechanical separation: traps large sand grains, grit, and mud while letting plastics pass.", table_body_style),
            Paragraph("1", table_body_center),
            Paragraph("₹50", table_body_bold_right),
            Paragraph("$0.60", table_body_center)
        ],
        [
            Paragraph("7", table_body_center),
            Paragraph("<b>650nm Red Laser Diode</b>", table_body_style),
            Paragraph("5V 5mW, Brass Casing, Dot Focus", table_body_style),
            Paragraph("Projects collimated coherent monochromatic beam across the fluidic path inside dark chamber.", table_body_style),
            Paragraph("1", table_body_center),
            Paragraph("₹35", table_body_bold_right),
            Paragraph("$0.42", table_body_center)
        ],
        [
            Paragraph("8", table_body_center),
            Paragraph("<b>BPW34 Silicon Photodiode</b>", table_body_style),
            Paragraph("PIN Photodiode, 7.5mm² area, fast response", table_body_style),
            Paragraph("High radiant sensitivity (430–1100 nm); detects microsecond light scattering drops caused by particles.", table_body_style),
            Paragraph("1", table_body_center),
            Paragraph("₹65", table_body_bold_right),
            Paragraph("$0.78", table_body_center)
        ],
        [
            Paragraph("9", table_body_center),
            Paragraph("<b>LM358 Operational Amplifier</b>", table_body_style),
            Paragraph("Dual Low-Power Op-Amp DIP-8 + Socket", table_body_style),
            Paragraph("Converts micro-amp photodiode current into 0–3.3V analog output conditioned for ESP32 ADC.", table_body_style),
            Paragraph("1", table_body_center),
            Paragraph("₹20", table_body_bold_right),
            Paragraph("$0.24", table_body_center)
        ],
        [
            Paragraph("10", table_body_center),
            Paragraph("<b>Analog Turbidity Sensor Kit</b>", table_body_style),
            Paragraph("Gravity-compatible Probe & Signal Board", table_body_style),
            Paragraph("Measures bulk water cloudiness; hardware interlock trips pump to eliminate mud false positives.", table_body_style),
            Paragraph("1", table_body_center),
            Paragraph("₹520", table_body_bold_right),
            Paragraph("$6.23", table_body_center)
        ],
        [
            Paragraph("11", table_body_center),
            Paragraph("<b>DS18B20 Temperature Probe</b>", table_body_style),
            Paragraph("Waterproof Stainless Probe (1m cable)", table_body_style),
            Paragraph("1-Wire digital thermometer; feeds temperature data to calibrate baseline optical refraction index.", table_body_style),
            Paragraph("1", table_body_center),
            Paragraph("₹140", table_body_bold_right),
            Paragraph("$1.68", table_body_center)
        ],
        [
            Paragraph("12", table_body_center),
            Paragraph("<b>Resistors & Passive Kit</b>", table_body_style),
            Paragraph("4.7kΩ, 10kΩ, 20kΩ, 100kΩ + Caps", table_body_style),
            Paragraph("1-Wire pull-up (4.7k), op-amp feedback gain (100k), and ADC voltage divider scaling.", table_body_style),
            Paragraph("1 set", table_body_center),
            Paragraph("₹30", table_body_bold_right),
            Paragraph("$0.36", table_body_center)
        ],
        [
            Paragraph("13", table_body_center),
            Paragraph("<b>Perfboard & Prototyping Wires</b>", table_body_style),
            Paragraph("Dotted Zero PCB + Dupont Jumper Wire Set", table_body_style),
            Paragraph("Mounting substrate for op-amp amplifier, power rails, header pins, and sensor connections.", table_body_style),
            Paragraph("1 set", table_body_center),
            Paragraph("₹75", table_body_bold_right),
            Paragraph("$0.90", table_body_center)
        ],
        [
            Paragraph("14", table_body_center),
            Paragraph("<b>PVC Dark Chamber Enclosure</b>", table_body_style),
            Paragraph("3/4\" Black PVC Conduit + 2 End Caps", table_body_style),
            Paragraph("Light-tight optical cell eliminating ambient sunlight and room luminaire interference.", table_body_style),
            Paragraph("1", table_body_center),
            Paragraph("₹70", table_body_bold_right),
            Paragraph("$0.84", table_body_center)
        ],
        [
            Paragraph("15", table_body_center),
            Paragraph("<b>Sample & Waste Reservoirs</b>", table_body_style),
            Paragraph("2 × 250ml Clear Acrylic / Glass Beakers", table_body_style),
            Paragraph("Holding vessels for untracked raw water intake and safe post-analysis waste fluid drainage.", table_body_style),
            Paragraph("2", table_body_center),
            Paragraph("₹120", table_body_bold_right),
            Paragraph("$1.44", table_body_center)
        ],
        [
            Paragraph("16", table_body_center),
            Paragraph("<b>Chassis Enclosure Material</b>", table_body_style),
            Paragraph("Laser-Cut Acrylic / MDF Plate & Standoffs", table_body_style),
            Paragraph("Rigid two-tier physical mount separating wet fluidics (bottom) from dry electronics (top).", table_body_style),
            Paragraph("1", table_body_center),
            Paragraph("₹210", table_body_bold_right),
            Paragraph("$2.52", table_body_center)
        ],
        [
            Paragraph("", table_body_style),
            Paragraph("<b>TOTAL PROTOTYPE COST</b>", table_body_style),
            Paragraph("<b>Complete Cyber-Physical Instrument</b>", table_body_style),
            Paragraph("<b>Fully assembled functional system including optics, fluidics, electronics & IoT</b>", table_body_style),
            Paragraph("<b>16</b>", table_body_center),
            Paragraph("<b>₹2,445</b>", table_body_bold_right),
            Paragraph("<b>$29.30</b>", ParagraphStyle('TotalUSD', parent=table_body_center, fontName='SegoeUI-Bold', textColor=DARK_BLUE))
        ]
    ]

    bom_table = Table(bom_data, colWidths=[22, 108, 98, 162, 22, 54, 49])
    bom_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), DARK_BLUE),
        ('BOX', (0,0), (-1,-1), 0.8, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-2), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0,1), (-1,-2), [colors.white, BG_ALT]),
        ('BACKGROUND', (0,-1), (-1,-1), colors.HexColor("#E2E8F0")),
        ('LINEABOVE', (0,-1), (-1,-1), 1.2, DARK_BLUE),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 1.8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 1.8),
        ('LEFTPADDING', (0,0), (-1,-1), 3),
        ('RIGHTPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(bom_table)
    story.append(Spacer(1, 4))

    # Economic Comparison Box
    econ_box = [
        [
            Paragraph("<b>ECONOMIC DISRUPTION & COST BENEFIT ANALYSIS:</b> "
                      "• <b>Commercial Benchtop Systems (μ-FTIR / Raman Microscopes):</b> <b>₹25,00,000 to ₹1,50,00,000+ ($30,000 – $180,000 USD)</b>. Require laboratory cleanrooms, liquid nitrogen detector cooling, and chemical sample digestion.<br/>"
                      "• <b>Our Optical Attenuation Edge Prototype:</b> <b>₹2,445 INR (~$29.30 USD)</b>. Yields a <b>&gt;99.9% cost reduction</b>, operates on 5V USB power, provides automated turbidity rejection, and streams live telemetry to a cloud Digital Twin.", callout_style)
        ]
    ]
    econ_table = Table(econ_box, colWidths=[usable_width])
    econ_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), SUCCESS_BG),
        ('BOX', (0,0), (-1,-1), 1, SUCCESS_GREEN),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 3.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3.5),
    ]))
    story.append(econ_table)
    story.append(Spacer(1, 5))

    # 7. Societal Impact, SDGs & National Missions
    story.append(Paragraph("7. Societal Impact, UN SDGs & National Initiatives", h1_style))
    impact_data = [
        [
            Paragraph("<b>Societal Benefits:</b> Early detection of plastic fibers in municipal water; sub-₹3,000 cost empowers citizen science, schools, and NGOs.", table_body_style),
            Paragraph("<b>UN SDGs Alignment:</b> <b>SDG 6</b> (Clean Water & Sanitation), <b>SDG 9</b> (Innovation & Infrastructure), <b>SDG 14</b> (Life Below Water).", table_body_style)
        ],
        [
            Paragraph("<b>Indian National Missions:</b> <b>Jal Jeevan Mission (JJM)</b> for decentralized tap water testing; <b>Namami Gange</b> for river basin monitoring.", table_body_style),
            Paragraph("<b>Future Scope:</b> Multi-wavelength optical arrays (UV 405nm, Green 532nm) for polymer classification; TinyML edge neural networks on ESP32.", table_body_style)
        ]
    ]
    impact_table = Table(impact_data, colWidths=[255, 260])
    impact_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BG_ALT),
        ('BOX', (0,0), (-1,-1), 0.8, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(impact_table)
    story.append(Spacer(1, 4))

    # 8. Technical Specifications & References Summary
    story.append(Paragraph("8. Technical Specifications & References", h1_style))
    specs_data = [
        [Paragraph("<b>Parameter</b>", table_header_style), Paragraph("<b>Specification</b>", table_header_style), Paragraph("<b>Parameter</b>", table_header_style), Paragraph("<b>Specification</b>", table_header_style)],
        [
            Paragraph("MCU Core", table_body_style), Paragraph("ESP32 (240MHz, 520KB SRAM)", table_body_style),
            Paragraph("Fluid Actuation", table_body_style), Paragraph("5V DC Peristaltic Pump", table_body_style)
        ],
        [
            Paragraph("Light Source", table_body_style), Paragraph("650nm Red Laser (5mW Dot)", table_body_style),
            Paragraph("Pre-Filter", table_body_style), Paragraph("40–100 μm Mesh (Traps sand)", table_body_style)
        ],
        [
            Paragraph("Photodetector", table_body_style), Paragraph("BPW34 PIN Photodiode (7.5mm²)", table_body_style),
            Paragraph("Turbidity Interlock", table_body_style), Paragraph("Analog Probe (Trip &lt; 2.5V)", table_body_style)
        ],
        [
            Paragraph("Sampling Rate", table_body_style), Paragraph("100 Hz continuous ADC polling", table_body_style),
            Paragraph("Total Cost", table_body_style), Paragraph("<b>₹2,445 INR (~$29.30 USD)</b>", table_body_style)
        ]
    ]
    specs_table = Table(specs_data, colWidths=[110, 147, 110, 148])
    specs_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), DARK_BLUE),
        ('BOX', (0,0), (-1,-1), 0.8, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_ALT]),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 1.8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 1.8),
        ('LEFTPADDING', (0,0), (-1,-1), 3),
        ('RIGHTPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(specs_table)
    story.append(Spacer(1, 3))

    # Academic References
    story.append(Paragraph(
        "<b>References:</b> 1. Jal Jeevan Mission Guidelines, Ministry of Jal Shakti. 2. Namami Gange River Pollution Framework, NMCG. 3. UN SDGs 6, 9 & 14. 4. Espressif ESP32 Technical Reference. 5. ISO/TR 21960:2020 Plastics Microplastics Methodologies.",
        ParagraphStyle('RefText', fontName='SegoeUI', fontSize=6.5, leading=8.5, textColor=TEXT_MUTED)
    ))

    # Build Document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated {pdf_filename} with exact 4-page layout!")


if __name__ == "__main__":
    generate_pdf()
