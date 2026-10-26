import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import QRCode from 'qrcode'

test('generator QRIS lokal menghasilkan data URL PNG yang valid', async () => {
  const dataUrl = await QRCode.toDataURL(
    '00020101021226640014COM.GO-JEK.WWW01189360091432000000000209TEST-QRIS5204581253033605405100005802ID5910UDEV SANDBOX6007JAKARTA6105123456304ABCD',
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
  assert.match(panel, /fetch\(qrisDataUrl\.value\)/)
  assert.match(panel, /png\.type !== 'image\/png'/)
})
