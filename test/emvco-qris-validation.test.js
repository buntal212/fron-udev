import assert from 'node:assert/strict'
import test from 'node:test'
import {
  computeCrc16Ccitt,
  parseEmvcoTlv,
  validateEmvcoQris,
  isValidEmvcoQris
} from '../src/utils/emvco-qris.js'

const VALID_QRIS =
  '00020101021226570011ID.DANA.WWW011893600915000295707502090029570750303UMI51380014ID.CO.QRIS.WWW02090029570750303UMI5204737253033605405100005802ID5905VZPAY6015Kota Jakarta Se61051224062710119anjartyrtyrtyy1234560440011ID.DANA.WWW0425MER202609041029168370062863046D16'

test('computeCrc16Ccitt menghitung checksum CRC-16/CCITT-FALSE dengan benar', () => {
  const dataToCrc = VALID_QRIS.slice(0, -4)
  const crc = computeCrc16Ccitt(dataToCrc)
  assert.equal(crc, '6D16')
  assert.equal(computeCrc16Ccitt(''), 'FFFF')
  assert.equal(computeCrc16Ccitt(null), '')
})

test('parseEmvcoTlv membedah struktur TLV dari payload yang valid', () => {
  const parsed = parseEmvcoTlv(VALID_QRIS)
  assert.equal(parsed.valid, true)
  assert.ok(parsed.tlvs.length > 5)
  assert.equal(parsed.tlvs[0].tag, '00')
  assert.equal(parsed.tlvs[0].length, 2)
  assert.equal(parsed.tlvs[0].value, '01')
})

test('validateEmvcoQris memvalidasi QRIS EMVCo valid dengan sukses', () => {
  const result = validateEmvcoQris(VALID_QRIS)
  assert.equal(result.valid, true)
  assert.ok(Array.isArray(result.tlvs))
  assert.equal(result.tlvs[0].tag, '00')
  assert.equal(result.tlvs[0].value, '01')
  assert.equal(result.tlvs[result.tlvs.length - 1].tag, '63')
  assert.equal(result.tlvs[result.tlvs.length - 1].value, '6D16')
  assert.equal(isValidEmvcoQris(VALID_QRIS), true)
})

test('validateEmvcoQris menolak QRIS dengan checksum CRC yang tidak cocok', () => {
  const corruptedCrc = VALID_QRIS.slice(0, -4) + '0000'
  const result = validateEmvcoQris(corruptedCrc)
  assert.equal(result.valid, false)
  assert.match(result.error, /Checksum CRC tidak cocok/)
  assert.equal(isValidEmvcoQris(corruptedCrc), false)
})

test('validateEmvcoQris menolak payload diawali 000201 tetapi bukan QR MPM (Custom Checkout payment code)', () => {
  const customCheckoutCode = '000201991823471029'
  const result = validateEmvcoQris(customCheckoutCode)
  assert.equal(result.valid, false)
  assert.equal(isValidEmvcoQris(customCheckoutCode), false)
})

test('validateEmvcoQris menolak string terpotong atau tanpa Tag 63', () => {
  const noCrc = VALID_QRIS.slice(0, -8)
  const result = validateEmvcoQris(noCrc)
  assert.equal(result.valid, false)
  assert.match(result.error, /CRC/)
  assert.equal(isValidEmvcoQris(noCrc), false)
})

test('validateEmvcoQris menolak string yang tidak diawali 000201', () => {
  const invalidPrefix = '010212' + VALID_QRIS.slice(6)
  const result = validateEmvcoQris(invalidPrefix)
  assert.equal(result.valid, false)
  assert.match(result.error, /000201/)
  assert.equal(isValidEmvcoQris(invalidPrefix), false)
})

test('validateEmvcoQris menangani input null, undefined, dan bukan string tanpa error', () => {
  assert.equal(isValidEmvcoQris(null), false)
  assert.equal(isValidEmvcoQris(undefined), false)
  assert.equal(isValidEmvcoQris(12345), false)
  assert.equal(isValidEmvcoQris(''), false)
})
