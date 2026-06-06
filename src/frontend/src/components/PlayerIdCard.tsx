import type { Student } from "@/types";

const ageCategoryLabel: Record<string, string> = {
  Under12: "Under-12",
  Under14: "Under-14",
  Under16: "Under-16",
  Under19: "Under-19",
  Senior: "Senior",
};

const batchMap: Record<string, string> = {
  morning6to8: "Morning (6–8 AM)",
  morning8to10: "Morning (8–10 AM)",
  evening4to6: "Evening (4–6 PM)",
  evening6to8: "Evening (6–8 PM)",
  Morning: "Morning Batch",
  Evening: "Evening Batch",
};

export function printPlayerIdCard(student: Student): void {
  const batchLabel =
    batchMap[String(student.batchTiming)] ?? String(student.batchTiming);
  const ageCat =
    ageCategoryLabel[String(student.ageCategory)] ??
    String(student.ageCategory);

  const photoHtml = student.photoUrl
    ? `<img src="${student.photoUrl}" alt="Player photo" style="width:80px;height:80px;object-fit:cover;border-radius:50%;border:3px solid #c8a94a;display:block;" />`
    : `<div style="width:80px;height:80px;border-radius:50%;background:#1a4d2e;border:3px solid #c8a94a;display:flex;align-items:center;justify-content:center;font-size:32px;">&#127920;</div>`;

  const origin = window.location.origin;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ID Card - ${student.name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      background: #e8e8e8;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .card {
      width: 340px;
      background: linear-gradient(160deg, #1a4d2e 0%, #0f2d1a 55%, #0a1f12 100%);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 12px 40px rgba(0,0,0,0.4);
      position: relative;
    }
    .card-deco-1 {
      position: absolute;
      top: -50px; right: -50px;
      width: 180px; height: 180px;
      border-radius: 50%;
      border: 2px solid rgba(200,169,74,0.12);
      pointer-events: none;
    }
    .card-deco-2 {
      position: absolute;
      bottom: -40px; left: -40px;
      width: 140px; height: 140px;
      border-radius: 50%;
      border: 2px solid rgba(200,169,74,0.08);
      pointer-events: none;
    }
    /* Header */
    .header {
      background: linear-gradient(90deg, #b8931a 0%, #e8cc7a 50%, #b8931a 100%);
      padding: 10px 14px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .header-logo {
      width: 44px;
      height: 44px;
      object-fit: contain;
      border-radius: 6px;
      flex-shrink: 0;
      background: white;
      padding: 2px;
    }
    .header-text {
      flex: 1;
    }
    .academy-name {
      font-size: 13px;
      font-weight: 900;
      color: #0f2d1a;
      letter-spacing: 0.3px;
      line-height: 1.2;
      text-transform: uppercase;
    }
    .academy-sub {
      font-size: 8.5px;
      color: #2a5a38;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-top: 2px;
    }
    .id-badge {
      background: #0f2d1a;
      color: #c8a94a;
      font-size: 9px;
      font-weight: 800;
      font-family: monospace;
      padding: 3px 7px;
      border-radius: 20px;
      letter-spacing: 1px;
      flex-shrink: 0;
    }
    /* Body */
    .body {
      padding: 16px 16px 14px;
      display: flex;
      gap: 14px;
      align-items: flex-start;
      position: relative;
      z-index: 1;
    }
    .photo-col {
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }
    .info-col {
      flex: 1;
      min-width: 0;
    }
    .player-name {
      font-size: 16px;
      font-weight: 900;
      color: #ffffff;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      line-height: 1.2;
      word-break: break-word;
    }
    .badges {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      margin-top: 8px;
    }
    .badge {
      background: rgba(200,169,74,0.18);
      border: 1px solid rgba(200,169,74,0.45);
      color: #e8cc7a;
      font-size: 10px;
      font-weight: 700;
      padding: 3px 9px;
      border-radius: 20px;
      letter-spacing: 0.4px;
    }
    .details {
      margin-top: 12px;
      display: grid;
      grid-template-columns: max-content 1fr;
      gap: 4px 10px;
    }
    .d-label {
      font-size: 9.5px;
      color: rgba(200,169,74,0.65);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      white-space: nowrap;
    }
    .d-value {
      font-size: 10.5px;
      color: #e0e0e0;
      font-weight: 500;
      word-break: break-word;
    }
    /* Divider */
    .divider {
      height: 1px;
      background: rgba(200,169,74,0.18);
      margin: 0 16px;
    }
    /* Footer */
    .footer {
      padding: 8px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(0,0,0,0.25);
    }
    .social-link {
      font-size: 8.5px;
      color: rgba(200,169,74,0.7);
      font-weight: 600;
      letter-spacing: 0.3px;
    }
    .print-btn {
      margin: 24px auto;
      display: block;
      padding: 10px 28px;
      background: linear-gradient(90deg, #b8931a, #e8cc7a, #b8931a);
      color: #0f2d1a;
      font-size: 14px;
      font-weight: 800;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      letter-spacing: 0.5px;
    }
    @media print {
      body { background: white; padding: 0; }
      .card { box-shadow: none; }
      .print-btn { display: none; }
    }
  </style>
</head>
<body>
  <div>
    <div class="card">
      <div class="card-deco-1"></div>
      <div class="card-deco-2"></div>

      <!-- Header -->
      <div class="header">
        <img
          src="${origin}/assets/images/logo.jpg"
          alt="RCA Logo"
          class="header-logo"
          onerror="this.style.display='none'"
        />
        <div class="header-text">
          <div class="academy-name">Royals Cricket Academy</div>
          <div class="academy-sub">Jalandhar &nbsp;&middot;&nbsp; Est. 2024</div>
        </div>
        <div class="id-badge">${student.receiptNumber}</div>
      </div>

      <!-- Body -->
      <div class="body">
        <div class="photo-col">
          ${photoHtml}
          <div style="font-size:8px;color:rgba(200,169,74,0.5);font-weight:600;text-transform:uppercase;letter-spacing:0.8px;margin-top:2px;">PLAYER</div>
        </div>
        <div class="info-col">
          <div class="player-name">${student.name}</div>
          <div class="badges">
            <span class="badge">${ageCat}</span>
            <span class="badge">${batchLabel}</span>
          </div>
          <div class="details">
            <span class="d-label">Guardian</span>
            <span class="d-value">${student.guardianName}</span>
            <span class="d-label">Mobile</span>
            <span class="d-value">${student.whatsappNumber}</span>
          </div>
        </div>
      </div>

      <!-- Divider -->
      <div class="divider"></div>

      <!-- Footer -->
      <div class="footer">
        <span class="social-link">&#128247; @rca.jalandhar</span>
        <span class="social-link">&#127760; royals-cricket-academy.grexa.site</span>
      </div>
    </div>

    <button class="print-btn" onclick="window.print()">Print ID Card</button>
  </div>
</body>
</html>`;

  const win = window.open("", "_blank", "width=480,height=640");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 500);
}
