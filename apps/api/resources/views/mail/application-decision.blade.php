<!doctype html>
<html lang="en">
<body style="margin:0;padding:24px;background:#faf6ec;font-family:Barlow,Arial,sans-serif;color:#22262e">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e4e7ec">
    <div style="background:#00203f;padding:20px 28px;color:#faf6ec;font-weight:700;font-size:18px;letter-spacing:.02em">JAN. CONF 2027</div>
    <div style="padding:28px">
      <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#00203f">Hi {{ $firstName }},</p>
      @if ($approved)
        <p style="margin:0 0 16px;font-size:15px;line-height:1.5">Good news: the committee approved your <strong>{{ $heading }}</strong> application. We will be in touch with the next steps and your pass.</p>
      @else
        <p style="margin:0 0 16px;font-size:15px;line-height:1.5">Thank you for applying as <strong>{{ $heading }}</strong>. After review, the committee was not able to approve this application.</p>
      @endif
      @if ($note)
        <p style="margin:0 0 16px;font-size:15px;line-height:1.5;background:#faf6ec;border-radius:12px;padding:14px">{{ $note }}</p>
      @endif
      <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.5">You can see the full status any time in the Jan. Conf app under Apply.</p>
    </div>
  </div>
</body>
</html>
