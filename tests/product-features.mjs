import assert from 'node:assert/strict'
import { spawn, execFileSync } from 'node:child_process'
import { readFileSync, unlinkSync, mkdtempSync, rmSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const php = process.env.PHP_BINARY || 'C:\\xampp\\php\\php.exe'
const env = { ...process.env, DB_NAME: `citypet_test_products_${Date.now()}` }
const port = 19000 + Math.floor(Math.random() * 1000)
const base = `http://127.0.0.1:${port}/api`
const uploaded = []
const runtime = mkdtempSync(path.join(root, 'tests', 'runtime-'))
let server
let checks = 0
function check(value, message) { assert.ok(value, message); checks++; console.log(`PASS ${message}`) }
async function request(route, { method = 'GET', body, session } = {}) {
  const headers = {}
  if (session?.cookie) headers.Cookie = session.cookie
  if (body && !(body instanceof FormData)) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(body) }
  const response = await fetch(`${base}/${route}`, { method, headers, body })
  const cookie = response.headers.get('set-cookie')
  if (session && cookie) session.cookie = cookie.split(';')[0]
  const text = await response.text()
  let result
  try { result = JSON.parse(text) } catch { throw new Error(`Non-JSON response ${response.status}: ${text.slice(0, 150)}`) }
  return { status: response.status, data: result.data, error: result.error }
}
async function login(identifier) {
  const session = {}
  const response = await request('auth.php?action=verify_otp', { method: 'POST', body: { identifier, otp: '123456' }, session })
  assert.equal(response.status, 200)
  const current = await request('auth.php?action=session', { session })
  session.csrfToken = current.data.csrfToken
  return session
}
try {
  execFileSync(php, ['tests/product-features-db.php'], { cwd: root, env, stdio: 'pipe' })
  server = spawn(php, ['-d', `session.save_path=${runtime}`, '-d', `upload_tmp_dir=${runtime}`, '-S', `127.0.0.1:${port}`, '-t', root], { cwd: root, env, stdio: 'ignore', windowsHide: true })
  for (let attempt = 0; attempt < 40; attempt++) {
    try { await request('health.php'); break } catch { await new Promise((resolve) => setTimeout(resolve, 100)) }
  }
  const admin = await login('test-admin@example.test')
  const customer = await login('test-user@example.test')
  check((await request('products.php', { method: 'POST', body: {} })).status === 401, 'Anonymous product writes are rejected')
  check((await request('products.php', { method: 'POST', body: { csrfToken: customer.csrfToken }, session: customer })).status === 403, 'Customers cannot edit products')
  check((await request('products.php', { method: 'POST', body: {}, session: admin })).status === 403, 'Product writes require CSRF token')
  const body = new FormData()
  body.append('csrfToken', admin.csrfToken)
  body.append('file', new Blob([readFileSync(path.join(root, 'src/assets/doctor-sugath.jpg'))], { type: 'image/jpeg' }), 'test.jpg')
  const upload = await request('media.php', { method: 'POST', body, session: admin })
  check(upload.status === 201 && upload.data.type === 'image', 'Admin image upload succeeds')
  uploaded.push(upload.data.url)
  const invalid = new FormData()
  invalid.append('csrfToken', admin.csrfToken)
  invalid.append('file', new Blob(['<?php echo "invalid";'], { type: 'image/jpeg' }), 'disguised.jpg')
  check((await request('media.php', { method: 'POST', body: invalid, session: admin })).status === 422, 'Disguised executable upload is rejected')
  const payload = { csrfToken: admin.csrfToken, id: 'test-food', name: 'Test Food', fullName: 'Complete Test Food', category: 'food', price: 100,
    mainImage: upload.data.url, gallery: Array.from({ length: 4 }, () => upload.data), description: 'Paragraph one\n\nParagraph two',
    ingredients: { composition: 'Chicken, rice', additives: 'Vitamin E', analysis: [{ nutrient: 'Protein', value: '28%' }] },
    feedingGuide: 'Small | 50g | Daily', keyBenefits: 'Healthy coat\nEasy digestion', tags: 'Adults\nNutrition', stockCount: 12,
    sizes: [{ size: '1 kg', price: 100, default: true }, { size: '2 kg', price: 180, default: false }] }
  check((await request('products.php', { method: 'POST', body: { ...payload, gallery: [...payload.gallery, upload.data] }, session: admin })).status === 422, 'More than four gallery items are rejected')
  check((await request('products.php', { method: 'POST', body: { ...payload, mainImage: '' }, session: admin })).status === 422, 'New products require a main image')
  check((await request('products.php', { method: 'POST', body: payload, session: admin })).status === 201, 'Product creation saves details and media')
  const saved = (await request('products.php?id=test-food')).data
  check(saved.mainImage === upload.data.url && saved.imageType === upload.data.url && saved.gallery.length === 4, 'Media appears in the customer API')
  check(saved.description.length === 2 && saved.ingredients.analysis[0].value === '28%' && saved.feedingGuide[0].normalActivity === '50g' && saved.keyBenefits.length === 2 && saved.sizes[1].price === 180 && saved.stockCount === 12, 'All structured details survive a database round trip')
  check((await request('products.php?id=test-food', { method: 'PUT', body: { ...payload, description: 'Updated description', gallery: [] }, session: admin })).status === 200, 'Product editing succeeds')
  const edited = (await request('products.php?id=test-food')).data
  check(edited.description[0] === 'Updated description' && edited.gallery.length === 0, 'Edits and gallery removal persist')
  check((await request('reviews.php', { method: 'POST', body: {} })).status === 401, 'Anonymous reviews are rejected')
  const reviewPayload = { csrfToken: customer.csrfToken, productId: 'test-food', rating: 5, title: 'Great food', comment: 'Our pet enjoyed this food.', author: 'Spoofed author' }
  check((await request('reviews.php', { method: 'POST', body: { ...reviewPayload, rating: 6 }, session: customer })).status === 422, 'Invalid ratings are rejected')
  check((await request('reviews.php', { method: 'POST', body: reviewPayload, session: customer })).status === 201, 'Registered customer can submit a review')
  check((await request('reviews.php', { method: 'POST', body: reviewPayload, session: customer })).status === 409, 'Duplicate reviews are rejected')
  const reviews = (await request('reviews.php?product_id=test-food', { session: customer })).data
  check(reviews.reviews[0].author === 'Test Customer' && !reviews.canReview && reviews.total === 1, 'Review author comes from the signed-in account')
  const reviewed = (await request('products.php?id=test-food')).data
  check(reviewed.rating === 5 && reviewed.reviews === 1, 'Product rating and count reflect real reviews')
  const adminReviewPayload = { csrfToken: admin.csrfToken, productId: 'test-food', rating: 4, title: 'Admin entered customer note', comment: 'Created from the admin reviews page.', authorName: 'Clinic Counter Customer', role: 'user' }
  check((await request('reviews.php', { method: 'POST', body: adminReviewPayload, session: admin })).status === 201, 'Admin can add a review for a registered-user style reviewer')
  const allReviews = (await request('reviews.php?all=1', { session: admin })).data
  check(allReviews.reviews.some((r) => r.author === 'Clinic Counter Customer' && r.author_role === 'user'), 'Admin-created reviewer appears in the reviews table')
  console.log(`${checks} integration checks passed.`)
} finally {
  if (server) { server.kill(); await new Promise((resolve) => server.once('exit', resolve)) }
  for (const url of uploaded) {
    const filename = path.basename(url)
    if (/^[a-f0-9]{32}\.(jpg|png|webp|mp4|webm)$/.test(filename)) unlinkSync(path.join(root, 'api/uploads/products', filename))
  }
  execFileSync(php, ['tests/product-features-db.php', 'drop'], { cwd: root, env, stdio: 'pipe' })
  if (path.dirname(runtime) === path.join(root, 'tests') && path.basename(runtime).startsWith('runtime-')) rmSync(runtime, { recursive: true, force: true })
}
