#!/usr/bin/env python3
"""Render a public business brief from owner-held, verified evaluation packets.

The two scenario inputs are intentionally separate. Source identifiers and
mailbox addresses are never copied into the public data or the brief.
"""
import argparse
import hashlib
import json
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib.colors import HexColor, white
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph, Table, TableStyle

PRODUCT = "5e79ba3d7b35ed70a625db5b82f03f82d3f65a64"
SAVE_RUN = "https://github.com/Trex2021/mermail-skills/actions/runs/37214396573"
AGENT_RUN = "https://github.com/Trex2021/mermail-skills/actions/runs/37148484024"
PR = "https://github.com/Nudgen-Marketing/mermail-skills/pull/124"
VIDEO = "https://x.com/Ehsan_Benvari/status/2104965245617983902"
PREVIEW = "13bdea16b8ac8f48a515a80294d847cd0c1e520df9d6a16d37b6de952ee3e1cd"
ARCHIVE = "af1dab4b043b1740a400b366d42124734f18bf42fcf07c79968ceb0a985c4d6a"


def cents(value):
    return Decimal(str(value)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def money(value):
    return f"${cents(value):,.2f}"


def fee_range(value):
    return f"{money(value['min'])}-{money(value['max'])}"


def hours(value):
    return f"{value['min']:g}-{value['max']:g}"


def public_scenario(packet, scenario_id, label):
    margin = packet["marginSnapshot"]
    rows = []
    for entry in packet["requestLedger"]:
        if entry["status"] == "scope_change" and entry["kind"] != "deadline":
            e = entry["effortHours"]
            rows.append({"id": entry["id"], "label": entry["label"],
                         "hours": {"min": e["min"], "max": e["max"]},
                         "baseFee": {side: float(cents(Decimal(str(e[side])) * Decimal(str(margin["effectiveHourlyRate"]))))
                                     for side in ("min", "max")}})
    for side in ("min", "max"):
        assert sum(Decimal(str(row["hours"][side])) for row in rows) == Decimal(str(margin["knownAddedHours"][side]))
        assert sum(cents(row["baseFee"][side]) for row in rows) == cents(margin["completeBaseFeeRange"][side])
        ordinary = cents(margin["completeBaseFeeRange"][side])
        premium = cents(ordinary * Decimal(str(margin["rushPremium"]["percent"])) / 100)
        assert premium == cents(margin["rushPremiumAmountRange"][side])
        assert ordinary + premium == cents(margin["completeTotalFeeRange"][side])
    return {"id": scenario_id, "label": label, "scope": rows,
            "addedHours": margin["knownAddedHours"], "hourlyRate": margin["effectiveHourlyRate"],
            "currency": margin["currency"], "ordinaryFee": margin["completeBaseFeeRange"],
            "rushPercent": margin["rushPremium"]["percent"], "rushPremium": margin["rushPremiumAmountRange"],
            "rushTotal": margin["completeTotalFeeRange"], "options": packet["clientOptions"],
            "originalDeadline": packet["baseline"]["deadline"]["date"],
            "requestedDeadline": packet["request"]["requestedDeadline"],
            "compressionDays": packet["request"]["compressionDays"],
            "revision": packet["baseline"]["revisionBudget"],
            "clientDelayDays": packet["delayAttribution"]["totalDaysByOwner"]["client"],
            "packetDigest": packet["integrity"]["packetDigest"]}


def build_data(benchmark, saved):
    assert saved["productHead"] == PRODUCT
    assert saved["previewDigest"] == PREVIEW
    assert saved["outcome"]["previewDigest"] == PREVIEW
    assert saved["outcome"]["readbackVerified"] is True
    assert saved["outcome"]["sent"] is False
    assert saved["preview"]["body"]
    a = public_scenario(benchmark["packet"], "A", "Original demo benchmark, replayed locally")
    b = public_scenario(saved["packet"], "B", "Live saved draft with distinct owner estimates")
    assert a["addedHours"] == {"min": 26, "max": 33}
    assert a["ordinaryFee"] == {"min": 390, "max": 495}
    assert b["addedHours"] == {"min": 15, "max": 22}
    return {"productHead": PRODUCT, "createdDate": "2026-10-04", "scenarios": [a, b],
            "receipt": {"status": "SAVED_AND_READ_BACK", "checkedAt": saved["outcome"]["checkedAt"],
                        "saveAttempts": 1, "exactDraftReadbacksVerified": 1, "externalSends": 0,
                        "previewDigest": PREVIEW, "archiveSha256": ARCHIVE,
                        "runUrl": SAVE_RUN, "helperHead": "3ba1a37aa6fb7ea12120b066ba37eb96a251155a"},
            "evidence": {"agentCases": "5/5", "agentRunUrl": AGENT_RUN,
                         "pullRequestUrl": PR, "mainDemoUrl": VIDEO},
            "sourceLimits": {"type": "two pre-existing synthetic self-addressed Sent messages",
                             "scanStatus": None, "senderAuthentication": "unknown",
                             "ownerAssumptions": ["labor estimates", "hourly rate", "rush rule", "previous revision usage", "client delay attribution"],
                             "commercialOutcome": "estimates only; no client approval, revenue, contract, delivery or payment claimed"}}


def render_pdf(data, path):
    a, b = data["scenarios"]
    pdfmetrics.registerFont(TTFont("BriefSans", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"))
    pdfmetrics.registerFont(TTFont("BriefSans-Bold", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"))
    pdfmetrics.registerFontFamily("BriefSans", normal="BriefSans", bold="BriefSans-Bold", italic="BriefSans", boldItalic="BriefSans-Bold")
    c = canvas.Canvas(str(path), pagesize=(595.276, 841.89), pageCompression=1)
    c.setTitle("Mermail Freelance Margin Guard - Commercial Value and Live Draft Proof")
    c.setAuthor("Mermail Freelance Margin Guard | PR #124")
    c.setSubject("English reviewer brief; synthetic commercial scenarios and a verified unsent Mermail draft")
    W, H = 595.276, 841.89
    x, width = 36, W - 72
    ink, muted = HexColor("#182C40"), HexColor("#526575")
    teal, green = HexColor("#007A73"), HexColor("#E8F6F1")

    def para(text, xpos, top, w, size=9, color=ink, leading=None, bold=False):
        style = ParagraphStyle("brief", fontName="BriefSans-Bold" if bold else "BriefSans",
                               fontSize=size, leading=leading or size * 1.34, textColor=color)
        p = Paragraph(text, style)
        _, h = p.wrap(w, H)
        assert top - h >= 28, "content exceeds page footer"
        p.drawOn(c, xpos, top - h)
        return h

    def box(xpos, y, w, h, fill):
        c.setFillColor(fill)
        c.roundRect(xpos, y, w, h, 9, fill=1, stroke=0)

    c.setFillColor(teal)
    c.rect(0, H-10, W, 10, fill=1, stroke=0)
    para("MERMAIL FREELANCE MARGIN GUARD", x, 807, width, 10, teal, bold=True)
    para("04 OCT 2026 | ENGLISH REVIEWER BRIEF", x, 787, width, 8, muted)
    para("Make scope changes visible.", x, 766, width, 25, ink, bold=True)
    para("From selected email evidence to priced choices and an owner-approved, unsent draft.", x, 730, width, 10.2)

    gap, card = 10, (width - 20) / 3
    for idx, (num, title, note) in enumerate([
        (f"{hours(a['addedHours'])} hours", "ADDED WORK", "Original demo benchmark A"),
        ("$390-$495", "ORDINARY ADDED-LABOR FEE", "Estimated value at $15/hour"),
        (f"{a['compressionDays']} days earlier", "DEADLINE COMPRESSION", "20 Oct requested to become 15 Oct")]):
        xpos = x + idx * (card + gap)
        box(xpos, 624, card, 80, HexColor("#EEF4F7"))
        para(title, xpos + 12, 693, card - 24, 7.3, muted, bold=True)
        para(num, xpos + 12, 672, card - 24, 17, ink, bold=True)
        para(note, xpos + 12, 644, card - 24, 7.7, muted)

    para("A | What changed", x, 607, width, 12, teal, bold=True)
    para("<b>Accepted:</b> responsive landing page, two included revision rounds, 20 Oct deadline. "
         "<b>Requested:</b> dashboard, Stripe, login, two more revision rounds and delivery on 15 Oct.",
         x, 586, width, 9.1)
    labels = {"admin-dashboard": "Admin dashboard", "payment-integration": "Stripe integration",
              "authentication": "Login and authentication", "two-revisions:overflow": "One overflow revision round"}
    rows = [["Additional work", "Billable hours", "Ordinary added fee"]]
    for r in a["scope"]:
        rows.append([labels[r["id"]], hours(r["hours"]), fee_range(r["baseFee"])])
    rows.append(["Total", hours(a["addedHours"]), fee_range(a["ordinaryFee"])])
    t = Table(rows, colWidths=[width * .50, width * .19, width * .31], rowHeights=[23] * 6)
    t.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, 0), "BriefSans-Bold"), ("FONTNAME", (0, 1), (-1, -2), "BriefSans"),
        ("FONTNAME", (0, -1), (-1, -1), "BriefSans-Bold"), ("FONTSIZE", (0, 0), (-1, -1), 8.5),
        ("TEXTCOLOR", (0, 0), (-1, -1), ink), ("BACKGROUND", (0, 0), (-1, 0), HexColor("#DDEBEC")),
        ("BACKGROUND", (0, -1), (-1, -1), HexColor("#EEF4F7")),
        ("LINEBELOW", (0, 0), (-1, -1), .3, HexColor("#DBE4E8")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10), ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("ALIGN", (1, 0), (-1, -1), "RIGHT")]))
    t.wrap(width, H)
    t.drawOn(c, x, 408)
    para("One requested revision remains included: $0 additional. Earlier delivery adds no standalone labor. "
         "Two owner-attributed client-delay days are separate from the five-day deadline compression.",
         x, 398, width, 8.3, muted)

    para("Three choices before added work begins", x, 361, width, 11.5, teal, bold=True)
    option_texts = [
        ("01 | REMOVE OR SWAP", "$0 additional", "Keep 20 Oct. Remove additions or approve an effort-equivalent swap."),
        ("02 | EXTEND", "$390-$495", "26-27 Oct indicative. Ordinary fee; 8 h/day plus 2 client-delay days."),
        ("03 | RUSH", "$487.50-$618.75", "15 Oct only if approved. Includes 25% on added labor ($97.50-$123.75).")]
    for idx, (title, price, note) in enumerate(option_texts):
        xpos = x + idx * (card + gap)
        box(xpos, 242, card, 99, HexColor("#F2F6F8"))
        para(title, xpos+11, 330, card-22, 8.0, muted, bold=True)
        para(price, xpos+11, 308, card-22, 12.4, ink, bold=True)
        para(note, xpos+11, 284, card-22, 8.5, muted)
    para("Schedule estimates require confirmation of the working calendar and actual capacity.", x, 232, width, 8, muted)

    box(x, 117, width, 98, green)
    para("B | LIVE MERMAIL RESULT - A DISTINCT PRICING SCENARIO", x+14, 201, width-28, 9, teal, bold=True)
    para("1 saved draft | 1 verified readback | 0 sends", x+14, 180, width-28, 14.0, ink, bold=True)
    para(f"{hours(b['addedHours'])} h at $23.50/h: {fee_range(b['ordinaryFee'])} ordinary; "
         f"10% rush gives {fee_range(b['rushTotal'])}. These are the amounts in the saved draft, not A's benchmark.",
         x+14, 156, width-28, 8.4)
    para("Saved and read back on 04 Oct 2026, 15:49:15 UTC. Exact approved text and recipients matched; draft remains unsent.",
         x+14, 133, width-28, 8.1, muted)

    para("<b>Evidence limits:</b> two pre-existing synthetic self-addressed Sent emails; scan status null, sender authentication unknown. "
         "Estimates, rates, revision usage and delay attribution are hypothetical owner inputs. "
         "Estimated fees are not revenue, a client agreement, a signed contract or a payment.", x, 106, width, 7.8, muted, 10.1)
    c.setStrokeColor(HexColor("#D8E3E7"))
    c.line(x, 58, W-x, 58)
    links = [("Saved draft proof", SAVE_RUN), ("5/5 agent cases", AGENT_RUN), ("PR #124", PR), ("Main 2:10 demo", VIDEO)]
    xpos = x
    c.setFont("BriefSans-Bold", 8)
    for title, url in links:
        c.setFillColor(teal)
        c.drawString(xpos, 43, title)
        length = c.stringWidth(title, "BriefSans-Bold", 8)
        c.linkURL(url, (xpos, 40, xpos+length, 51), relative=0)
        xpos += length + 20
    c.setFont("BriefSans", 7.2)
    c.setFillColor(muted)
    c.drawRightString(W-x, 28, "Product 5e79ba3 | Historical video retained | Supporting brief")
    c.showPage()
    c.save()


def render_markdown(data):
    a, b = data["scenarios"]
    lines = ["# Mermail Freelance Margin Guard - Commercial Value and Live Draft Proof", "",
             "English reviewer brief, 4 October 2026. Product `" + PRODUCT + "`.", "",
             "[English one-page PDF](Mermail-Commercial-Value.pdf).", "",
             "Selected email evidence makes added work, changed commitments and three owner-approved choices explicit. "
             "This is a supporting view for the existing video; it does not replace proof of actual agent execution.", "",
             "## A. Original demo benchmark, replayed locally", "",
             "Accepted: responsive landing page, two included revision rounds, 20 October 2026 deadline. "
             "Requested: dashboard, Stripe, login, two more revision rounds and delivery on 15 October.", "",
             "| Additional work | Additional billable hours | Ordinary added fee at USD 15/hour |",
             "| --- | ---: | ---: |"]
    for r in a["scope"]:
        lines.append(f"| {r['label']} | {hours(r['hours'])} | {fee_range(r['baseFee'])} |")
    lines.extend([f"| **Total** | **{hours(a['addedHours'])}** | **{fee_range(a['ordinaryFee'])}** |", "",
                  "One of the two newly requested revision rounds remains covered by the baseline allowance and adds no fee. "
                  "The other round exceeds the remaining allowance. The accelerated deadline adds no standalone labor. "
                  "Two explicitly owner-attributed client-delay days are accounted for separately from the five-day compression.", "",
                  "| Choice | Additional fee | Date / condition |", "| --- | ---: | --- |",
                  "| Remove additions or approve an effort-equivalent swap | $0 | Keep 20 October |",
                  "| Keep additions and extend | $390-$495 | Indicative 26-27 October at eight hours/day plus two client-delay days |",
                  "| Approve a paid rush change order | $487.50-$618.75 | 15 October only if approved; 25% added-labor premium is $97.50-$123.75 |", "",
                  "Working-calendar availability and actual capacity must be confirmed before agreement. "
                  "These are hypothetical owner estimates, not customer-authorized terms.", "",
                  "## B. Real saved draft; distinct owner estimates", "",
                  f"The [successful live save/readback]({SAVE_RUN}) completed on `{data['receipt']['checkedAt']}`. "
                  "One `save_draft` was followed by `get_email` for that exact returned draft identifier. "
                  "The body, sender, recipients, Drafts state and absence of attachments matched. **External sends: 0.**", "",
                  f"Scenario B uses **{hours(b['addedHours'])} additional hours at USD 23.50/hour**, "
                  f"**{fee_range(b['ordinaryFee'])}** ordinary added fees and a **10%** rush premium "
                  f"of **{fee_range(b['rushPremium'])}**, totaling **{fee_range(b['rushTotal'])}**. "
                  "Its indicative extension is 24-25 October. These amounts belong to the saved draft; "
                  "scenario A's USD 390-495 benchmark must not be presented as the draft's price.", "",
                  "## Evidence and honest limits", "",
                  "Both sources are pre-existing synthetic self-addressed Sent emails with null scan status and unknown sender authentication. "
                  "Labor estimates, hourly rate, rush rule, previous revision usage and client-delay attribution are hypothetical owner inputs. "
                  "The verified save demonstrates a tangible unsent Mermail draft. It does not demonstrate customer adoption, client approval, "
                  "recovered revenue, contract acceptance, delivery or payment. No wallet connection or transaction occurred.", "",
                  f"- [Five fresh agent cases, 5/5]({AGENT_RUN}), pinned to product `{PRODUCT}`.",
                  f"- [Existing main 2:10 X demo]({VIDEO}), retained as historical evidence rather than relabelled as the current product revision.",
                  f"- [PR #124]({PR}).", f"- Exact approved preview SHA-256: `{PREVIEW}`.",
                  f"- Saved-run original ZIP SHA-256: `{ARCHIVE}`.",
                  "- Full mailbox/source/draft identifiers and exact owner review remain encrypted in the preserved saved-run evidence.", "",
                  "A public JSON companion provides both scenario calculations without private mailbox or source identifiers.", ""])
    return "\n".join(lines)


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--benchmark", type=Path, required=True)
    p.add_argument("--saved", type=Path, required=True)
    p.add_argument("--public-dir", type=Path, required=True)
    p.add_argument("--pdf", type=Path, required=True)
    args = p.parse_args()
    data = build_data(json.loads(args.benchmark.read_text()), json.loads(args.saved.read_text()))
    args.public_dir.mkdir(parents=True, exist_ok=True)
    args.pdf.parent.mkdir(parents=True, exist_ok=True)
    (args.public_dir / "commercial-value.json").write_text(json.dumps(data, indent=2) + "\n")
    (args.public_dir / "COMMERCIAL-VALUE.md").write_text(render_markdown(data))
    render_pdf(data, args.pdf)
    print(json.dumps({"pdfPages": 1, "scenarioAMath": "26-33 h; USD 390-495 ordinary",
                      "scenarioBMath": "15-22 h; USD 387.75-568.70 including rush",
                      "savedDraft": "SAVED_AND_READ_BACK", "externalSends": 0,
                      "pdfSha256": hashlib.sha256(args.pdf.read_bytes()).hexdigest()}))


if __name__ == "__main__":
    main()
