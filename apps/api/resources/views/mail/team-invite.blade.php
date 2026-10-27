<!doctype html>
<html lang="en">
<body style="margin:0;padding:24px;background:#faf6ec;font-family:Barlow,Arial,sans-serif;color:#22262e">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e4e7ec">
    <div style="background:#00203f;padding:20px 28px;color:#faf6ec;font-weight:700;font-size:18px;letter-spacing:.02em">JAN. CONF 2027</div>
    <div style="padding:28px">
      <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#00203f">Hi {{ $firstName }},</p>
      <p style="margin:0 0 20px;font-size:15px;line-height:1.5"><strong>{{ $invitedBy }}</strong> registered you for the 37th IMLC &amp; IYLC with <strong>{{ $teamName }}</strong>. Sign in to confirm and get your ticket.</p>
      <p style="margin:0 0 24px;text-align:center;font-size:36px;letter-spacing:.3em;font-weight:700;color:#00203f">{{ $code }}</p>
      <p style="margin:0 0 24px;text-align:center"><a href="{{ $link }}" style="display:inline-block;background:#1460a1;color:#ffffff;text-decoration:none;font-weight:700;padding:14px 28px;border-radius:999px">Confirm and get my ticket</a></p>
      <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.5">The code and link work once and expire in {{ $minutes }} minutes. If you weren't expecting this, you can ignore it and no ticket will be issued.</p>
    </div>
  </div>
</body>
</html>
