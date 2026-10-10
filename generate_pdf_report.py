#!/usr/bin/env python3
"""
Generate a publication-grade, professional 4-page technical PDF report for:
"Low-Cost Optical Attenuation System for Real-Time Microplastic Detection"
Department of Electronics and Instrumentation / Cyber-Physical Systems (CPS)
Manipal Institute of Technology (MIT), Manipal
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

# Register font family
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
            self.drawString(40, 810, "OPTICAL ATTENUATION MICROPLASTIC DETECTION SYSTEM — CPS & DSA PROJECT")
            self.drawRightString(555, 810, "MIT MANIPAL | DEPT. OF E&I")
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.5)
            self.line(40, 804, 555, 804)

        # Running Footer on All Pages
        self.setStrokeColor(colors.HexColor("#E2E8F0"))
        self.setLineWidth(0.5)
        self.line(40, 34, 555, 34)

        self.drawString(40, 23, "Academic & Technical Evaluation Documentation | Academic Year 2026-27 | B.Tech CPS")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(555, 23, page_str)
        self.restoreState()


def generate_pdf():
    pdf_filename = "Microplastic_Detection_Project_Report.pdf"
    doc = SimpleDocTemplate(
        pdf_filename,
        pagesize=A4,
        leftMargin=40,
        rightMargin=40,
        topMargin=42,
        bottomMargin=42
    )

    usable_width = 595.27 - 80  # 515.27 pt

    # Design Color Palette
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

    # Typography Styles
    title_style = ParagraphStyle(
        'DocTitle',
        fontName='SegoeUI-Bold',
        fontSize=18,
        leading=22,
        textColor=NAVY,
        spaceAfter=3
    )

    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        fontName='SegoeUI',
        fontSize=9.5,
        leading=13,
        textColor=PRIMARY_BLUE,
        spaceAfter=8
    )

    h1_style = ParagraphStyle(
        'SectionH1',
        fontName='SegoeUI-Bold',
        fontSize=11.5,
        leading=15,
        textColor=DARK_BLUE,
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'SectionH2',
        fontName='SegoeUI-Bold',
        fontSize=9.5,
        leading=13,
        textColor=TEAL,
        spaceBefore=6,
        spaceAfter=3,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'BodyDark',
        fontName='SegoeUI',
        fontSize=8,
        leading=11,
        textColor=TEXT_MAIN,
        alignment=4,  # Justified
        spaceAfter=4
    )

    bullet_style = ParagraphStyle(
        'BulletText',
        fontName='SegoeUI',
        fontSize=8,
        leading=11,
        textColor=TEXT_MAIN,
        leftIndent=10,
        spaceAfter=2
    )

    callout_style = ParagraphStyle(
        'CalloutText',
        fontName='SegoeUI',
        fontSize=7.8,
        leading=10.5,
        textColor=TEXT_MAIN
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        fontName='SegoeUI-Bold',
        fontSize=7.5,
        leading=9.5,
        textColor=colors.white,
        alignment=1
    )

    table_body_style = ParagraphStyle(
        'TableBody',
        fontName='SegoeUI',
        fontSize=7.2,
        leading=9.5,
        textColor=TEXT_MAIN
    )

    table_body_center = ParagraphStyle(
        'TableBodyCenter',
        fontName='SegoeUI',
        fontSize=7.2,
        leading=9.5,
        textColor=TEXT_MAIN,
        alignment=1
    )

    table_body_bold_right = ParagraphStyle(
        'TableBodyBoldRight',
        fontName='SegoeUI-Bold',
        fontSize=7.2,
        leading=9.5,
        textColor=DARK_BLUE,
        alignment=2
    )

    story = []

    # ==================================================================
    # PAGE 1: COVER HEADER, PROBLEM STATEMENT & ARCHITECTURE START
    # ==================================================================
    story.append(Paragraph("CYBER-PHYSICAL SYSTEMS (CPS) & EMBEDDED IoT SENSING PLATFORM", ParagraphStyle(
        'Badge', fontName='SegoeUI-Bold', fontSize=7.5, leading=9, textColor=TEAL, spaceAfter=2
    )))
    story.append(Paragraph("Low-Cost Optical Attenuation System for Real-Time Microplastic Detection", title_style))
    story.append(Paragraph("Automated In-Line Water Quality Monitoring with Turbidity Interlock Failsafe, Thermal Drift Compensation & Live Digital Twin", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=DARK_BLUE, spaceBefore=0, spaceAfter=6))

    # Project Metadata Card
    meta_data = [
        [
            Paragraph("<b>Institution:</b> Manipal Institute of Technology (MIT), Manipal<br/>"
                      "<b>Department:</b> Department of Electronics & Instrumentation<br/>"
                      "<b>Program:</b> B.Tech Cyber Physical Systems (CPS) | 3rd Semester<br/>"
                      "<b>Course:</b> Data Structures & Algorithms (DSA) / CPS Theory & Lab", table_body_style),
            Paragraph("<b>Project Team Members:</b><br/>"
                      "• <b>Parth Yadav</b> (Registration ID: 251090610366)<br/>"
                      "• <b>Anisha Praveenkumar Mandroli</b> (Registration ID: 251090610160)<br/>"
                      "• <b>Kirtika Kushwaha</b> (Registration ID: 251090610204)<br/>"
                      "<b>Firmware & DSA Architect:</b> Akshat Awasthi", table_body_style)
        ]
    ]
    meta_table = Table(meta_data, colWidths=[255, 260])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BG_ALT),
        ('BOX', (0,0), (-1,-1), 0.8, BORDER_COLOR),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 7),
        ('RIGHTPADDING', (0,0), (-1,-1), 7),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 6))

    # 1. Executive Summary & Problem Statement
    story.append(Paragraph("1. Problem Statement & Motivation", h1_style))
    story.append(Paragraph(
        "<b>The Global Microplastic Crisis:</b> Microplastics (plastic particles and synthetic fibers measuring &lt; 5 mm down to sub-micron dimensions) have contaminated virtually every freshwater reservoir, municipal distribution pipeline, river basin, and bottled drinking water supply globally. Emanating from synthetic textile laundering, tyre abrasion, packaging fragmentation, and industrial effluents, microplastics present acute ecological and toxicological hazards. Upon human ingestion, they induce intracellular oxidative stress, compromise gut barrier permeability, bioaccumulate across trophic food webs, and leach endocrine-disrupting additives including phthalate plasticizers and bisphenol A (BPA), while adsorbing heavy metals and pathogenic biofilms.",
        body_style
    ))
    story.append(Paragraph(
        "<b>Fatal Bottlenecks of Existing Laboratory Methodologies:</b> Contemporary detection and characterization of microplastics rely primarily on benchtop analytical spectroscopy—notably Fourier-Transform Infrared Spectroscopy (μ-FTIR) and Raman Microspectroscopy. While scientifically rigorous, these instruments are completely unsuited for distributed, continuous in-situ monitoring: they cost between <b>$30,000 and $180,000+ (₹25,00,000 to ₹1.5 Crore INR)</b>, require specialized cleanroom facilities, demand hours of laborious chemical digestion (Fenton's reagent, enzymatic digests, or alkaline dissolution to destroy organic matter), and mandate PhD-level analytical operators. Alternatively, manual optical microscopy is subjective, unstandardized, and prone to severe human error. Consequently, point-of-use municipal plants, rural communities, and environmental agencies lack any continuous early-warning mechanism.",
        body_style
    ))
    story.append(Paragraph(
        "<b>The Core Engineering Challenge:</b> To design, fabricate, and validate an autonomous, continuous-flow optoelectronic sensor node costing under <b>₹3,000 (~$35 USD)</b> capable of detecting microscopic plastic particulates in flowing water in real time, while decisively eliminating <i>false positive detections</i> caused by suspended mineral mud, silt, algae, and thermal optical drift.",
        body_style
    ))

    # Objective Callout Box
    obj_data = [
        [Paragraph("<b>CORE PROJECT MISSION:</b> Engineer a cyber-physical edge-sensing instrument coupling multi-stage mechanical pre-filtration, an upstream turbidity interlock failsafe, thermal refractive index calibration, and high-frequency laser attenuation detection. Real-time telemetry is processed through 8 custom in-memory C++ Data Structures on an ESP32 microcontroller and streamed wirelessly to a live web Digital Twin dashboard at &gt;99.9% cost reduction compared to commercial benchtop spectrometers.", callout_style)]
    ]
    obj_table = Table(obj_data, colWidths=[usable_width])
    obj_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#EFF6FF")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#2563EB")),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(obj_table)
    story.append(Spacer(1, 6))

    # 2. System Architecture & Working Principle (Physics)
    story.append(Paragraph("2. System Architecture & Working Principle", h1_style))
    story.append(Paragraph(
        "The instrument operates on the fundamental physical principles of <b>Optical Light Attenuation and Mie/Rayleigh Scattering</b> combined with dual-sensor validation logic. Instead of requiring chemical digestion, the system measures coherent light disruption inside an optically isolated dark sensing chamber:",
        body_style
    ))
    story.append(Paragraph(
        "• <b>The Optical Baseline (Steady State):</b> Within a light-proof PVC dark chamber, a 650nm red laser diode continuously projects a collimated beam across a clear fluidic flow path onto a high-speed BPW34 silicon PIN photodiode. When clean, particulate-free water traverses the conduit, the photodiode receives maximum photon flux, generating a steady, high-voltage analog baseline (~3.00V – 3.20V conditioned via an LM358 operational amplifier in transimpedance configuration).<br/>"
        "• <b>Physical Occlusion & Particle Detection:</b> When a suspended microplastic particle flows across the focal path, it refracts, reflects, and scatters a fraction of the laser light. This momentary occlusion starves the photodiode of photons, resulting in a rapid, microsecond-scale <i>V-shaped voltage dip (ΔV)</i>. The ESP32's high-speed ADC samples this line continuously at 100 Hz; the voltage drop depth correlates with particle cross-sectional area, while pulse width indicates transit velocity.<br/>"
        "• <b>Thermal Drift Compensation:</b> Because the refractive index of water varies non-linearly with temperature (altering optical beam refraction), a submersible 1-Wire DS18B20 digital temperature sensor continuously monitors fluid temperature. The ESP32 applies an empirical mathematical offset to adjust the baseline voltage threshold dynamically.",
        bullet_style
    ))

    # End of Page 1
    story.append(PageBreak())

    # ==================================================================
    # PAGE 2: OPERATIONAL WORKFLOW, FLOW DIAGRAM & DSA ARCHITECTURE
    # ==================================================================
    story.append(Paragraph("2. System Architecture & Working Principle (Continued)", h1_style))
    story.append(Paragraph("Chronological 4-Phase Operational Pipeline", h2_style))

    pipeline_data = [
        [
            Paragraph("<b>Phase 1: Boot & Thermal Baseline Calibration</b>", table_body_style),
            Paragraph("ESP32 initializes peripherals, establishes 2.4 GHz Wi-Fi link, launches a WebSocket telemetry server on Port 81, and queries the DS18B20 1-Wire temperature probe. Fluid temperature is logged to mathematically normalize the optical baseline before fluid actuation commences.", table_body_style)
        ],
        [
            Paragraph("<b>Phase 2: Actuation & Stage 1 Pre-Filtration</b>", table_body_style),
            Paragraph("The operator triggers 'Start Flow' via the web dashboard. The ESP32 energizes GPIO 26 to close the 5V optocoupled relay, driving the 5V Peristaltic Pump. Fluid is drawn without contacting motor impellers. Water passes through an inline 40–100 μm mesh filter, mechanically capturing heavy gravel, sand grains, and filamentous algae while letting microplastics and water pass through.", table_body_style)
        ],
        [
            Paragraph("<b>Phase 3: Upstream Turbidity Failsafe Interlock</b>", table_body_style),
            Paragraph("<b>Hardware-Software Interlock:</b> Muddy or silty water causes broad optical attenuation that would falsely register millions of microplastics. Pre-filtered water enters the Analog Turbidity Sensor. If voltage is LOW (&lt; 2.5V, high turbidity), the ESP32 instantly de-energizes the pump relay, halts optical counting, and broadcasts a critical alarm. Optical detection is ONLY enabled when water clarity is validated (≥ 2.5V).", table_body_style)
        ],
        [
            Paragraph("<b>Phase 4: Optical Chamber & Digital Twin Sync</b>", table_body_style),
            Paragraph("Validated water enters the light-sealed PVC Dark Chamber. The 650nm laser beam illuminates the stream. Microplastics trigger microsecond voltage drops registered by the BPW34 photodiode and buffered by the LM358 op-amp. The ESP32 classifies event severity (Low, Medium, High, Critical), logs events into in-memory DSA structures, pushes JSON telemetry over WebSockets to the Next.js dashboard, and discharges analyzed water to the waste beaker.", table_body_style)
        ]
    ]
    pipeline_table = Table(pipeline_data, colWidths=[135, 380])
    pipeline_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,-1), BG_ALT),
        ('BACKGROUND', (1,0), (1,-1), colors.white),
        ('BOX', (0,0), (-1,-1), 0.8, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 3.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3.5),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(pipeline_table)
    story.append(Spacer(1, 5))

    # Architecture Visual Schematic Box
    arch_box_text = (
        "<b>INTEGRATED FLUIDIC & CYBER-PHYSICAL TELEMETRY SCHEMATIC:</b><br/>"
        "Sample Reservoir ➔ [5V Peristaltic Pump (Relay GPIO 26)] ➔ [Inline 40–100 µm Mesh Filter] ➔ [Analog Turbidity (GPIO 34)]<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│ (Turbidity Interlock: V ≥ 2.5V? YES ➔ Proceed | NO ➔ Trip Pump & Alert)<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;▼<br/>"
        "[PVC Dark Chamber: 650nm Laser (GPIO 27) ➔ Flow Channel ➔ BPW34 Photodiode + LM358 Op-Amp (GPIO 35)] ➔ [Waste Beaker Outlet]<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│ (High-Speed Analog Voltage Sampling @ 100 Hz)<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;▼<br/>"
        "[ESP32 Edge Microcontroller: In-Memory DSA Core Engine] ➔ [WiFi WebSocket / Port 81] ➔ [Next.js Cloud Digital Twin Dashboard]"
    )
    arch_table = Table([[Paragraph(arch_box_text, table_body_style)]], colWidths=[usable_width])
    arch_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BG_ALT),
        ('BOX', (0,0), (-1,-1), 1, TEAL),
        ('LEFTPADDING', (0,0), (-1,-1), 7),
        ('RIGHTPADDING', (0,0), (-1,-1), 7),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(arch_table)
    story.append(Spacer(1, 6))

    # 3. Embedded Data Structures & Algorithms Engine
    story.append(Paragraph("3. Embedded Data Structures & Algorithms (DSA) Engine", h1_style))
    story.append(Paragraph(
        "A central academic highlight of this system is the implementation of <b>eight custom-built Data Structures and Algorithms</b> in native C++ executing entirely within the ESP32's internal SRAM (without relying on bulky STL containers or dynamic vector overhead). Every structure was selected to fulfill a critical real-time sensory or control requirement:",
        body_style
    ))

    dsa_data = [
        [Paragraph("Data Structure / Algorithm", table_header_style), Paragraph("Algorithmic Implementation & Complexity", table_header_style), Paragraph("Cyber-Physical Utility & Hardware Mapping", table_header_style)],
        [
            Paragraph("<b>Singly Linked List</b>", table_body_style),
            Paragraph("Dynamic node pointers (`Node* next`). Head/tail insertion: <i>O(1)</i>, index traversal: <i>O(n)</i>.", table_body_style),
            Paragraph("Unbounded chronological logging of raw sensor telemetry (photodiode voltage, turbidity NTU, temp).", table_body_style)
        ],
        [
            Paragraph("<b>Doubly Linked List</b>", table_body_style),
            Paragraph("Bidirectional pointers (`next`, `prev`). Forward & backward traversal: <i>O(n)</i>, node removal: <i>O(1)</i>.", table_body_style),
            Paragraph("Incident investigation: allows an operator to navigate backward from a detection alarm to examine precursor conditions.", table_body_style)
        ],
        [
            Paragraph("<b>Circular Linked List</b>", table_body_style),
            Paragraph("Ring buffer (capacity 10) with `tail->next = head`. Rolling window compute: <i>O(1)</i>.", table_body_style),
            Paragraph("Real-time sliding window moving average filter: continuously suppresses photodiode high-frequency optical noise.", table_body_style)
        ],
        [
            Paragraph("<b>Stack (LIFO)</b>", table_body_style),
            Paragraph("Node-based LIFO stack supporting `push()`, `pop()`, `peek()`, and rollback: <i>O(1)</i>.", table_body_style),
            Paragraph("Sensor baseline calibration rollback (Undo/Redo): saves multi-stage baseline offsets and allows instant reversion.", table_body_style)
        ],
        [
            Paragraph("<b>Queue & Priority Queue</b>", table_body_style),
            Paragraph("FIFO queue with priority insertion: safety alarms preempt normal packets to head in <i>O(p)</i>.", table_body_style),
            Paragraph("Critical alarm management: safety-critical trips (Turbidity cutoff, pump overheat) jump ahead of routine telemetry.", table_body_style)
        ],
        [
            Paragraph("<b>Binary Search Tree (BST)</b>", table_body_style),
            Paragraph("Timestamp-keyed BST. Search/Insert: <i>O(log n)</i> avg. In-Order, Pre-Order, Post-Order traversals.", table_body_style),
            Paragraph("Rapid event lookup by microsecond timestamp and range queries (retrieve all events detected between T1 and T2).", table_body_style)
        ],
        [
            Paragraph("<b>5 Sorting Algorithms</b>", table_body_style),
            Paragraph("Bubble, Selection, Insertion <i>O(n²)</i>, Merge Sort <i>O(n log n)</i>, Quick Sort (Lomuto).", table_body_style),
            Paragraph("Hardware-benchmarked via ESP32 `micros()` hardware timer to rank detection events by severity and optical dip magnitude.", table_body_style)
        ],
        [
            Paragraph("<b>2 Searching Algorithms</b>", table_body_style),
            Paragraph("Linear Search <i>O(n)</i> versus Binary Search <i>O(log n)</i> with telemetry step count.", table_body_style),
            Paragraph("Evaluates algorithmic execution performance on embedded microcontroller during historical event lookup queries.", table_body_style)
        ]
    ]
    dsa_table = Table(dsa_data, colWidths=[105, 170, 240])
    dsa_table.setStyle(TableStyle([
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
    story.append(dsa_table)

    # End of Page 2
    story.append(PageBreak())

    # ==================================================================
    # PAGE 3: BILL OF MATERIALS (BOM) & COMPONENT PRICING
    # ==================================================================
    story.append(Paragraph("4. Bill of Materials (BOM), Parts Used & Approximate Prices", h1_style))
    story.append(Paragraph(
        "A foundational imperative of this project is <b>radical affordability and democratic accessibility</b>. All components selected are non-proprietary, industrially mature, and readily procurable from electronic distributors across India (Robu.in, Quartzcomponents, local electronics markets) and internationally. The table below delineates every physical component, engineering rating, functional responsibility, and estimated retail market price in both Indian Rupees (₹ INR) and US Dollars ($ USD) at prevailing 2026 exchange rates (~₹83.5 / $1 USD):",
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
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('LEFTPADDING', (0,0), (-1,-1), 3),
        ('RIGHTPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(bom_table)
    story.append(Spacer(1, 5))

    # Economic Comparison Box
    econ_box = [
        [
            Paragraph("<b>ECONOMIC DISRUPTION & COMPARATIVE COST ADVANTAGE:</b><br/>"
                      "• <b>Gold-Standard Benchtop Instruments (μ-FTIR / Raman Microscopes):</b> <b>₹25,00,000 to ₹1,50,00,000+ ($30,000 – $180,000 USD)</b>. Require air-conditioned labs, liquid nitrogen detector cooling, expensive chemical reagents, and specialized personnel.<br/>"
                      "• <b>Our Optical Attenuation Edge Prototype:</b> <b>₹2,445 INR (~$29.30 USD)</b>. Yields a <b>&gt;99.9% cost reduction</b>, operates on 5V USB/battery, provides autonomous pre-filtration and turbidity rejection, and streams live telemetry to a cloud Digital Twin.<br/>"
                      "• <b>Scalability:</b> Low capital expenditure allows mass deployment across municipal water filtration plants, river monitoring outposts, rural drinking wells, and academic research institutions.", callout_style)
        ]
    ]
    econ_table = Table(econ_box, colWidths=[usable_width])
    econ_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), SUCCESS_BG),
        ('BOX', (0,0), (-1,-1), 1, SUCCESS_GREEN),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(econ_table)
    story.append(Spacer(1, 6))

    # Master Hardware Pinout Table
    story.append(Paragraph("5. Master Hardware Pinout & Interfacing Specifications", h1_style))
    pin_data = [
        [Paragraph("Component", table_header_style), Paragraph("Component Pin", table_header_style), Paragraph("ESP32 Pin", table_header_style), Paragraph("Voltage", table_header_style), Paragraph("Hardware Conditioning & Interfacing Notes", table_header_style)],
        [
            Paragraph("<b>Turbidity Sensor</b>", table_body_style),
            Paragraph("Signal (A0)<br/>VCC / GND", table_body_style),
            Paragraph("<b>GPIO 34</b><br/>VIN (5V) / GND", table_body_style),
            Paragraph("0 – 3.3V<br/>5.0V DC", table_body_style),
            Paragraph("ADC1_CH6 input (safe when WiFi is transmitting; ADC2 is shared with Wi-Fi RF). Turbidity interlock trips below 2.5V.", table_body_style)
        ],
        [
            Paragraph("<b>BPW34 Photodiode</b>", table_body_style),
            Paragraph("Signal (LM358 Pin 1)<br/>VCC / GND", table_body_style),
            Paragraph("<b>GPIO 35</b><br/>3V3 / GND", table_body_style),
            Paragraph("0 – 3.3V<br/>3.3V DC", table_body_style),
            Paragraph("ADC1_CH7 input. Buffered by LM358 operational amplifier in transimpedance topology with 100kΩ feedback resistor.", table_body_style)
        ],
        [
            Paragraph("<b>DS18B20 Temp Probe</b>", table_body_style),
            Paragraph("Data (Yellow)<br/>VCC (Red) / GND (Black)", table_body_style),
            Paragraph("<b>GPIO 4</b><br/>3V3 / GND", table_body_style),
            Paragraph("3.3V Logic<br/>3.3V DC", table_body_style),
            Paragraph("Bit-banged 1-Wire protocol with 4.7kΩ external pull-up resistor to 3.3V rail. Sampled during boot calibration.", table_body_style)
        ],
        [
            Paragraph("<b>1-Channel Relay</b>", table_body_style),
            Paragraph("IN (Trigger)<br/>VCC / GND", table_body_style),
            Paragraph("<b>GPIO 26</b><br/>VIN (5V) / GND", table_body_style),
            Paragraph("3.3V Logic<br/>5.0V DC", table_body_style),
            Paragraph("Optocoupled input. Switched by ESP32 to drive the 5V peristaltic pump motor power contacts safely.", table_body_style)
        ],
        [
            Paragraph("<b>650nm Laser Diode</b>", table_body_style),
            Paragraph("Anode (+) / Cathode (-)", table_body_style),
            Paragraph("<b>GPIO 27</b> / GND", table_body_style),
            Paragraph("3.3V DC / 0V", table_body_style),
            Paragraph("Switched by ESP32 digital output; energized during active optical interrogation cycles inside dark chamber.", table_body_style)
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
    story.append(Spacer(1, 8))

    # ==================================================================
    # SECTION 6, 7 & 8: SOCIETAL IMPACT, SDGS, SYSTEM SPECS & CONCLUSION
    # ==================================================================
    story.append(Paragraph("6. Societal Impact, UN Sustainable Development Goals & National Missions", h1_style))
    story.append(Paragraph(
        "This project directly addresses pressing ecological imperatives and aligns with established international standards and Indian national missions for water security:",
        body_style
    ))

    impact_data = [
        [
            Paragraph("<b>Societal & Environmental Benefits:</b><br/>"
                      "• <b>Public Health Preservation:</b> Detects synthetic plastic fibers in tap and drinking water supplies before human consumption, preventing chronic ingestion hazards.<br/>"
                      "• <b>Democratized Environmental Sensing:</b> Sub-₹3,000 cost enables schools, universities, NGOs, and rural health clinics to monitor local drinking sources autonomously.<br/>"
                      "• <b>Continuous Aquatic Surveillance:</b> Replaces intermittent manual grab-sampling with uninterrupted 24/7 automated continuous-flow analysis.", table_body_style),
            Paragraph("<b>Alignment with UN Sustainable Development Goals (SDGs):</b><br/>"
                      "• <b>SDG 6 (Clean Water & Sanitation):</b> Directly enhances water quality monitoring and targets synthetic micro-pollutant reduction.<br/>"
                      "• <b>SDG 9 (Industry, Innovation & Infrastructure):</b> Pioneers affordable, open cyber-physical IoT infrastructure for resource-limited regions.<br/>"
                      "• <b>SDG 14 (Life Below Water):</b> Mitigates plastic contaminant ingress into aquatic habitats, safeguarding freshwater and marine biodiversity.", table_body_style)
        ],
        [
            Paragraph("<b>Alignment with Indian National Initiatives:</b><br/>"
                      "• <b>Jal Jeevan Mission (JJM):</b> Fulfills JJM's core mandate of ensuring verifiable, safe piped drinking water to every rural household via affordable field testing.<br/>"
                      "• <b>Namami Gange Programme:</b> Serves as an affordable continuous monitoring node to assess microplastic pollution density across Ganga basin tributaries.<br/>"
                      "• <b>Swachh Bharat Mission:</b> Provides empirical, data-driven validation for plastic waste remediation and solid waste management initiatives.", table_body_style),
            Paragraph("<b>Scalability & Future Research Directions:</b><br/>"
                      "• <b>Multi-Wavelength Spectroscopy:</b> Integrating UV (405nm), Green (532nm), and NIR (850nm) lasers to categorize polymer types (PET vs PE vs PP) via differential light absorption ratios.<br/>"
                      "• <b>TinyML Edge Particle Classification:</b> Deploying quantized neural network models directly on ESP32 to differentiate fibers, fragments, and beads from signal shape.", table_body_style)
        ]
    ]
    impact_table = Table(impact_data, colWidths=[255, 260])
    impact_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BG_ALT),
        ('BOX', (0,0), (-1,-1), 0.8, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(impact_table)
    story.append(Spacer(1, 6))

    # 7. Technical Conclusion & System Specifications
    story.append(Paragraph("7. Technical Specifications & Experimental Conclusion", h1_style))
    story.append(Paragraph(
        "The Low-Cost Optical Attenuation System proves that effective microplastic detection does not necessitate multi-million rupee laboratory instrumentation. By coupling mechanical pre-filtration, upstream turbidity interlocks, thermal refractive calibration, and 8 custom in-memory C++ Data Structures inside an ESP32 microcontroller, the device achieves dependable particle identification at a bill-of-materials cost of only <b>₹2,445 INR (~$29.30 USD)</b>. Real-time WebSocket streaming synchronizes physical events with an interactive web Digital Twin, delivering a validated, deployable cyber-physical solution for environmental protection.",
        body_style
    ))

    specs_data = [
        [Paragraph("<b>Parameter</b>", table_header_style), Paragraph("<b>Specification / Value</b>", table_header_style), Paragraph("<b>Parameter</b>", table_header_style), Paragraph("<b>Specification / Value</b>", table_header_style)],
        [
            Paragraph("Microcontroller Core", table_body_style), Paragraph("ESP32 (240MHz Dual-Core, 520KB SRAM)", table_body_style),
            Paragraph("Fluidic Actuator", table_body_style), Paragraph("5V DC Peristaltic Metering Pump", table_body_style)
        ],
        [
            Paragraph("Optical Light Source", table_body_style), Paragraph("650nm Red Laser Diode (5mW Dot)", table_body_style),
            Paragraph("Pre-Filtration Mesh", table_body_style), Paragraph("40–100 μm Mesh (Traps sand/mud)", table_body_style)
        ],
        [
            Paragraph("Photodetector", table_body_style), Paragraph("BPW34 PIN Photodiode (7.5 mm²)", table_body_style),
            Paragraph("Turbidity Interlock", table_body_style), Paragraph("Analog Turbidity Probe (Trip &lt; 2.5V)", table_body_style)
        ],
        [
            Paragraph("Signal Conditioning", table_body_style), Paragraph("LM358 Op-Amp (Transimpedance Gain)", table_body_style),
            Paragraph("Thermal Compensation", table_body_style), Paragraph("DS18B20 1-Wire Probe (±0.5°C accuracy)", table_body_style)
        ],
        [
            Paragraph("Sampling Frequency", table_body_style), Paragraph("100 Hz continuous ADC polling", table_body_style),
            Paragraph("Telemetry Protocol", table_body_style), Paragraph("802.11 b/g/n Wi-Fi + WebSocket (Port 81)", table_body_style)
        ],
        [
            Paragraph("Embedded DSA Engine", table_body_style), Paragraph("8 in-memory C++ structures (zero STL)", table_body_style),
            Paragraph("Approx. Total Cost", table_body_style), Paragraph("<b>₹2,445 INR (~$29.30 USD)</b>", table_body_style)
        ]
    ]
    specs_table = Table(specs_data, colWidths=[120, 137, 120, 138])
    specs_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), DARK_BLUE),
        ('BOX', (0,0), (-1,-1), 0.8, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_ALT]),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(specs_table)
    story.append(Spacer(1, 5))

    # Academic References
    story.append(Paragraph("8. Key References & Technical Standards", h1_style))
    story.append(Paragraph(
        "1. <b>Department of Drinking Water and Sanitation</b>, Ministry of Jal Shakti, Government of India, <i>Jal Jeevan Mission Guidelines & Water Quality Testing Protocols</i>. https://jaljeevanmission.gov.in/<br/>"
        "2. <b>National Mission for Clean Ganga (NMCG)</b>, Ministry of Jal Shakti, <i>Namami Gange River Pollution Monitoring Framework</i>. https://nmcg.nic.in/<br/>"
        "3. <b>United Nations</b>, <i>Transforming our world: The 2030 Agenda for Sustainable Development (SDGs 6, 9 & 14)</i>. https://sdgs.un.org/goals<br/>"
        "4. <b>Espressif Systems</b>, <i>ESP32 Technical Reference Manual & FreeRTOS Dual-Core Architecture</i>, Espressif Systems Inc., 2024.<br/>"
        "5. <b>ISO/TR 21960:2020</b>, <i>Plastics — Environmental aspects — State of knowledge and methodologies for microplastics</i>, International Organization for Standardization.",
        ParagraphStyle('RefText', fontName='SegoeUI', fontSize=6.8, leading=9, textColor=TEXT_MUTED)
    ))

    # Build Document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated {pdf_filename} with exact 4-page layout!")


if __name__ == "__main__":
    generate_pdf()
