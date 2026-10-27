<!doctype html>
<html lang="en">
<body style="margin:0;padding:24px;background:#faf6ec;font-family:Barlow,Arial,sans-serif;color:#22262e">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e4e7ec">
    <div style="background:#00203f;padding:20px 28px;color:#faf6ec;font-weight:700;font-size:18px;letter-spacing:.02em">JAN. CONF 2027</div>
    <div style="padding:28px">
      <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#00203f">Hi {{ $firstName }},</p>
      @if ($approved)
        <p style="margin:0 0 16px;font-size:15px;line-height:1.5">The committee has verified your minister registration. You can now add your spouse and up to three aides from <strong>More → My team → Minister’s team</strong> in the Jan. Conf app.</p>
      @else
        <p style="margin:0 0 16px;font-size:15px;line-height:1.5">We weren’t able to verify your minister registration, so you remain registered as a delegate. Your ticket is unchanged and you are still welcome at the conference.</p>
      @endif
      @if ($note)
        <p style="margin:0 0 16px;font-size:15px;line-height:1.5;background:#faf6ec;border-radius:12px;padding:14px">{{ $note }}</p>
      @endif
    </div>
  </div>
</body>
</html>
