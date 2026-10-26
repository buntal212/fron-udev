import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import QRCode from 'qrcode'

test('generator QRIS lokal menghasilkan data URL PNG yang valid', async () => {
  const dataUrl = await QRCode.toDataURL(
    '00020101021226570011ID.DANA.WWW011893600915000295707502090029570750303UMI51380014ID.CO.QRIS.WWW02090029570750303UMI5204737253033605405100005802ID5905VZPAY6015Kota Jakarta Se61051224062710119anjartyrtyrtyy1234560440011ID.DANA.WWW0425MER202609041029168370062863046D16',
    {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 440
    }
  )

  assert.match(dataUrl, /^data:image\/png;base64,/)
  const png = Buffer.from(
    dataUrl.slice('data:image/png;base64,'.length),
    'base64'
  )
  assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10])
})

test('panel QRIS merender PNG lokal dengan state eksplisit dan tidak menggandakan payload', async () => {
  const panel = await readFile(
    new URL(
      '../src/pages/PaymentGateway/comp/DanaSandboxTesterPanel.vue',
      import.meta.url
    ),
    'utf8'
  )

  assert.match(panel, /<img\s+v-if="qrisDataUrl"/)
  assert.match(panel, /qrisLoading/)
  assert.match(panel, /qrisError/)
  assert.match(panel, /@error="handleQrisImageError"/)
  assert.match(panel, /payment_instruction\.payment_code && !qrisPayload/)
  assert.match(panel, /instruction\?\.type === 'qris_mpm'/)
  assert.match(panel, /instruction\.qr_content/)
  assert.match(panel, /transaction\.payment_instruction\.type === 'qris_mpm'/)
  assert.match(panel, /transaction\.payment_instruction\.qr_image/)
  assert.match(panel, /fetch\(qrisDataUrl\.value\)/)
  assert.match(panel, /png\.type !== 'image\/png'/)
})
