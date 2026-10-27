// Sign-in code email. Table layout and inline styles for Gmail and Outlook.
// Every value passed in must already be HTML-escaped.

export type OtpEmailTemplateValues = {
  lang: string;
  subject: string;
  preheader: string;
  heading: string;
  intro: string;
  code: string;
  expiry: string;
  noShare: string;
  ignore: string;
  footer: string;
};

export function renderOtpEmailHtml(v: OtpEmailTemplateValues): string {
  return `<!doctype html>
<html lang="${v.lang}" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${v.subject}</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
<!-- Preheader: shown in the inbox list, hidden in the body -->
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#f4f4f5;opacity:0;">${v.preheader}&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f4f5;">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <!--[if mso]><table role="presentation" width="480" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;">
        <!-- Wordmark -->
        <tr>
          <td style="padding:0 4px 16px 4px;font-family:Geist,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:16px;line-height:24px;font-weight:700;color:#0a0a0a;letter-spacing:-0.2px;">
            VibeDev ID
          </td>
        </tr>
        <!-- Card -->
        <tr>
          <td style="background-color:#ffffff;border:1px solid #e5e5e5;border-radius:12px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr><td height="4" style="height:4px;line-height:4px;font-size:4px;background-color:#fdc700;border-radius:12px 12px 0 0;">&nbsp;</td></tr>
              <tr>
                <td style="padding:32px 32px 8px 32px;font-family:Geist,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                  <h1 style="margin:0 0 8px 0;font-size:22px;line-height:28px;font-weight:600;color:#0a0a0a;">${v.heading}</h1>
                  <p style="margin:0;font-size:15px;line-height:22px;color:#404040;">${v.intro}</p>
                </td>
              </tr>
              <!-- Code -->
              <tr>
                <td style="padding:24px 32px 8px 32px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="center" style="background-color:#fafafa;border:1px solid #e5e5e5;border-radius:8px;padding:20px 12px 20px 20px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,'Liberation Mono','Courier New',monospace;font-size:36px;line-height:44px;font-weight:600;letter-spacing:8px;color:#0a0a0a;mso-line-height-rule:exactly;">
                        ${v.code}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding:8px 32px 24px 32px;font-family:Geist,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;line-height:20px;color:#525252;">
                  ${v.expiry}
                </td>
              </tr>
              <tr>
                <td style="padding:0 32px 32px 32px;font-family:Geist,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;line-height:20px;color:#525252;border-top:0;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr><td style="border-top:1px solid #e5e5e5;padding-top:20px;font-family:Geist,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;line-height:20px;color:#525252;">
                      <p style="margin:0 0 8px 0;">${v.noShare}</p>
                      <p style="margin:0;">${v.ignore}</p>
                    </td></tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:16px 4px 0 4px;font-family:Geist,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;line-height:18px;color:#737373;">
            ${v.footer}<br>
            <a href="https://vibedeveloper.id" style="color:#525252;text-decoration:underline;">vibedeveloper.id</a>
          </td>
        </tr>
      </table>
      <!--[if mso]></td></tr></table><![endif]-->
    </td>
  </tr>
</table>
</body>
</html>`;
}
