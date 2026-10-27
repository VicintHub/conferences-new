<!doctype html>
<html lang="en">
<body style="margin:0;padding:24px;background:#faf6ec;font-family:Barlow,Arial,sans-serif;color:#22262e">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e4e7ec">
    <div style="background:#00203f;padding:20px 28px;color:#faf6ec;font-weight:700;font-size:18px;letter-spacing:.02em">JAN. CONF 2027</div>
    <div style="padding:28px">
      <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#00203f">Thank you, {{ explode(' ', $order->customer_name)[0] }}.</p>
      <p style="margin:0 0 20px;font-size:15px;line-height:1.5">Order <strong>{{ $order->code }}</strong> is paid. Show the pickup code at the merchandise desk at the venue (19–24 January).</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        @foreach ($order->items as $item)
          <tr>
            <td style="padding:8px 0;border-bottom:1px solid #f4f5f7">{{ $item->name }}@if($item->variant_label)<br><span style="color:#6b7280">{{ $item->variant_label }} · ×{{ $item->qty }}</span>@else <span style="color:#6b7280">×{{ $item->qty }}</span>@endif</td>
            <td style="padding:8px 0;border-bottom:1px solid #f4f5f7;text-align:right">₦{{ number_format($item->unit_price_kobo * $item->qty / 100) }}</td>
          </tr>
        @endforeach
        <tr><td style="padding:8px 0;color:#6b7280">Payment fee</td><td style="padding:8px 0;text-align:right;color:#6b7280">₦{{ number_format($order->fee_kobo / 100) }}</td></tr>
        <tr><td style="padding:8px 0;font-weight:700">Total</td><td style="padding:8px 0;text-align:right;font-weight:700">₦{{ number_format($order->total_kobo / 100) }}</td></tr>
      </table>
      <p style="margin:24px 0 0;text-align:center"><a href="{{ $link }}" style="display:inline-block;background:#1460a1;color:#ffffff;text-decoration:none;font-weight:700;padding:14px 28px;border-radius:999px">View pickup code</a></p>
    </div>
  </div>
</body>
</html>
