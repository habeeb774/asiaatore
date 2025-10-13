#!/usr/bin/env node
/* eslint-disable no-irregular-whitespace */
// Generic scraper for external store listing pages (e.g., jomlah.app)
// Usage (example):
//   node server/scripts/scrapeStoreProducts.js \
//     --url "https://jomlah.app/collections/..." \
//     --pages 3 \
//     --card ".product-card, .grid-item, .product, .product-list-item" \
//     --title ".product-title, .title, h3, h2" \
//     --price ".price, .product-price, .amount" \
//     --image "img" \
//     --link "a" \
//     --next "a[rel=next], .pagination__next, a.next, a[aria-label=Next], a:contains('التالي')" \
//     --download-images 1 \
//     --out server/data/jomlah.json
// Notes:
// - Provide selectors appropriate for the site you are scraping.
// - Outputs a JSON array compatible with server/scripts/importProducts.js
// - If --download-images is enabled, images are saved under /uploads/products and product.image updated accordingly.

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import puppeteer from 'puppeteer';

const OUT_DIR = path.join(process.cwd(), 'uploads', 'products');

function parseArgs(){
	const args = process.argv.slice(2);
	const get = (key, def=null) => {
		const i = args.findIndex(a => a === `--${key}`);
		if (i >= 0) return args[i+1] ?? '';
		return def;
	};
	return {
		url: get('url') || '',
		pages: Number(get('pages', '1')) || 1,
		card: get('card') || '.product, .product-card',
		title: get('title') || '.title, .product-title, h2, h3',
		price: get('price') || '.price, .product-price, .amount',
		image: get('image') || 'img',
		link: get('link') || 'a',
		next: get('next') || 'a[rel=next], .pagination__next, a.next',
		linkList: get('linkList') || 'a[href*="/p/"], a[href*="/ar/p/"], a[href*="/products/"], a[href*="/ar/products/"], a[href*="/product/"], a[href*="/ar/product/"]',
		out: get('out') || path.join('server','data','scraped_products.json'),
		headless: (get('headless', '1') !== '0'),
		delay: Number(get('delay', '800')) || 800,
		downloadImages: get('download-images', '0') === '1',
		category: get('category') || '',
		detail: get('detail', '0') === '1',
		dumpLinks: get('dumpLinks', '0') === '1'
	};
}

async function ensureDir(dir){ await fs.promises.mkdir(dir, { recursive: true }); }

function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }

async function autoScroll(page, { step=300, delay=150, max=8000 }={}){
	const start = Date.now();
	let height = 0;
	while ((Date.now() - start) < max){
		try {
			const more = await page.evaluate((s) => {
				const before = document.scrollingElement.scrollTop;
				document.scrollingElement.scrollBy(0, s);
				const after = document.scrollingElement.scrollTop;
				return after > before;
			}, step);
			height += step;
			await sleep(delay);
			if (!more) break;
		} catch { break; }
	}
}

function text(el){ return (el?.innerText || el?.textContent || '').trim(); }

function absUrl(base, u){ try { return new URL(u, base).toString(); } catch { return u; } }

function normalizeDigits(s){
    if (!s) return s;
    const map = {
        '٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9', // Arabic-Indic
        '۰':'0','۱':'1','۲':'2','۳':'3','۴':'4','۵':'5','۶':'6','۷':'7','۸':'8','۹':'9'  // Eastern Arabic-Indic
    };
    return s.replace(/[٠-٩۰-۹]/g, ch => map[ch] || ch);
}

function parsePriceText(s){
	// Extract first number like 12.50 or 12,50
	if (!s) return null;
	const normalized = normalizeDigits(s).replace(/[\s ]/g,'');
	const m = normalized.match(/([0-9]+(?:[.,][0-9]{1,2})?)/);
	if (!m) return null;
	const num = m[1].replace(',', '.');
	const n = Number(num);
	return isNaN(n) ? null : n;
}

async function downloadTo(url, destPath, headers={}){
	await ensureDir(path.dirname(destPath));
	const proto = url.startsWith('https') ? https : http;
	return new Promise((resolve, reject) => {
		const file = fs.createWriteStream(destPath);
		const req = proto.get(url, { headers }, res => {
			if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
				// redirect
				const redir = absUrl(url, res.headers.location);
				downloadTo(redir, destPath, headers).then(resolve).catch(reject);
				file.close?.();
				return;
			}
			if (res.statusCode !== 200) {
				file.close?.();
				return reject(new Error(`HTTP ${res.statusCode}`));
			}
			res.pipe(file);
			file.on('finish', () => file.close(() => resolve(destPath)));
		});
		req.on('error', err => { file.close?.(); reject(err); });
	});
}

function slugify(s){
	let out = String(s||'').toLowerCase()
		.replace(/[^a-z0-9\-\s_]+/g,'')
		.replace(/[\s_]+/g,'-')
		.replace(/-+/g,'-')
		.replace(/^-+|-+$/g,'')
		.slice(0,64);
	if (!out || out === '-') out = 'item-' + Math.random().toString(36).slice(2,8);
	return out;
}

async function main(){
	const cfg = parseArgs();
	if (!cfg.url) {
		console.error('Usage: node server/scripts/scrapeStoreProducts.js --url <list-url> [--pages N] [--card ".product"] ...');
		process.exit(1);
	}
	console.log('[SCRAPE] Start', cfg);
	await ensureDir(OUT_DIR);
	const browser = await puppeteer.launch({ headless: cfg.headless });
	const page = await browser.newPage();
	await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36');
	page.setDefaultNavigationTimeout(45000);
	const items = [];
	const productLinks = new Set();
	let currentUrl = cfg.url;

	for (let p=1; p<=cfg.pages; p++){
		console.log(`[SCRAPE] Page ${p} => ${currentUrl}`);
		await page.goto(currentUrl, { waitUntil: 'networkidle2' });
		await sleep(cfg.delay);
		// trigger lazy content/infinite lists
		await autoScroll(page, { max: 6000 });
		try { await page.waitForSelector(cfg.linkList || 'a[href*="/p/"]', { timeout: 4000 }); } catch {}
		const base = currentUrl;
		const scraped = await page.evaluate(({ cardSel, titleSel, priceSel, imageSel, linkSel, baseUrl, linkListSel }) => {
			const results = [];
			const $$ = (sel, ctx) => Array.from((ctx||document).querySelectorAll(sel));
			const cards = $$(cardSel);
			for (const c of cards){
				let titleEl = c.querySelector(titleSel);
				let priceEl = c.querySelector(priceSel);
				let linkEl = c.querySelector(linkSel);
				let imgEl = c.querySelector(imageSel);
				const title = (titleEl?.innerText || titleEl?.textContent || '').trim();
				const priceText = (priceEl?.innerText || priceEl?.textContent || '').trim();
				const href = linkEl?.getAttribute('href') || null;
				const src = imgEl?.getAttribute('data-src') || imgEl?.getAttribute('src') || null;
				if (!title) continue;
				results.push({
					title,
					priceText,
					imageUrl: src ? (new URL(src, baseUrl)).toString() : null,
					linkUrl: href ? (new URL(href, baseUrl)).toString() : null
				});
			}
			// Also gather product links when available
			const linkHrefs = new Set();
			if (linkListSel) {
				for (const a of $$(linkListSel)){
					const href = a.getAttribute('href');
					if (href) {
						try { linkHrefs.add((new URL(href, baseUrl)).toString()); } catch {}
					}
				}
			}
			return { results, links: Array.from(linkHrefs) };
		}, { cardSel: cfg.card, titleSel: cfg.title, priceSel: cfg.price, imageSel: cfg.image, linkSel: cfg.link, baseUrl: base, linkListSel: cfg.linkList });

		for (const it of scraped.results){
			const price = parsePriceText(it.priceText);
			const nameEn = it.title; // if Arabic, it will be nameAr
			const nameAr = it.title; // we map the same; you can post-process later
			const slug = slugify(`${it.title}-${price ?? ''}`);
			let image = it.imageUrl || null;
						if (cfg.downloadImages && it.imageUrl){
				const file = `scrp-${Date.now()}-${Math.random().toString(36).slice(2,6)}${path.extname(new URL(it.imageUrl).pathname) || '.jpg'}`;
				const dest = path.join(OUT_DIR, file);
								try {
									await downloadTo(it.imageUrl, dest, {
										'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
										'Referer': base
									});
									image = `/uploads/products/${file}`;
								} catch (e) { console.warn('[IMG] download fail', e.message); }
			}
			items.push({
				slug,
				nameEn,
				nameAr,
				shortEn: null,
				shortAr: null,
				category: cfg.category || 'supermarket',
				price: price ?? 0,
				oldPrice: null,
				image,
				stock: 50
			});
		}

		// Accumulate links for detail scraping
		if (Array.isArray(scraped.links)) {
			for (const href of scraped.links) productLinks.add(href);
		}

		// Next page
		let nextUrl = null;
		try {
			if (cfg.next) {
				const found = await page.$(cfg.next);
				if (found) {
					const href = await page.evaluate(el => el.getAttribute('href') || el.getAttribute('data-href') || '', found);
					if (href) nextUrl = absUrl(currentUrl, href);
				}
			}
			if (!nextUrl) {
				// try rel=next
				const n2 = await page.$('a[rel=next]');
				if (n2) {
					const href = await page.evaluate(el => el.getAttribute('href') || '', n2);
					if (href) nextUrl = absUrl(currentUrl, href);
				}
			}
		} catch {}

		if (!nextUrl) {
			console.log('[SCRAPE] No next link, stopping.');
			break;
		}
		currentUrl = nextUrl;
	}

	// If nothing scraped or user requested detail mode, visit product pages directly
	if (cfg.detail || items.length === 0) {
		console.log(`[SCRAPE] Detail mode enabled (${productLinks.size} links collected).`);
		if (productLinks.size === 0) {
			// As a last resort, try to collect product links from the first page directly
			const page2 = await browser.newPage();
			await page2.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36');
			await page2.goto(cfg.url, { waitUntil: 'networkidle2' });
			await sleep(cfg.delay);
			await autoScroll(page2, { max: 6000 });
			const extra = await page2.evaluate((sel, baseUrl) => {
				const out = new Set();
				for (const a of document.querySelectorAll(sel)){
					const href = a.getAttribute('href');
					if (href) {
						try { out.add((new URL(href, baseUrl)).toString()); } catch {}
					}
				}
				return Array.from(out);
			}, cfg.linkList || 'a[href*="/p/"], a[href*="/ar/p/"]', cfg.url);
			for (const u of extra) productLinks.add(u);
			await page2.close();
		}

		// Helper: extract from a single product page
		async function extractFromDetail(url, page3){
			try{
				await page3.goto(url, { waitUntil: 'networkidle2' });
				await sleep(cfg.delay);
				const data = await page3.evaluate(() => {
					function getMeta(sel, attr='content'){ const el = document.querySelector(sel); return el ? el.getAttribute(attr) || '' : ''; }
					function pick(sel){ const el = document.querySelector(sel); return (el?.innerText || el?.textContent || '').trim(); }
					function parseJsonLd(){
						const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
						for (const s of scripts){
							try {
								const json = JSON.parse(s.textContent || '{}');
								const arr = Array.isArray(json) ? json : [json];
								for (const obj of arr){
									if (obj['@type'] === 'Product'){
										const offer = Array.isArray(obj.offers) ? obj.offers[0] : obj.offers;
										return {
											name: obj.name || '',
											image: (Array.isArray(obj.image) ? obj.image[0] : obj.image) || '',
											price: offer?.price || offer?.priceSpecification?.price || ''
										};
									}
								}
							} catch {}
						}
						return null;
					}
					const jsonLd = parseJsonLd();
					const title = jsonLd?.name || pick('h1, .product-title, [itemprop=name], .s-product-title');
					const priceText = jsonLd?.price || getMeta('meta[itemprop="price"]') || getMeta('meta[property="product:price:amount"]') || pick('[itemprop=price], .price, .product-price, .current-price');
					const imageUrl = jsonLd?.image || getMeta('meta[property="og:image"]') || getMeta('link[rel=image_src]','href') || (document.querySelector('.product-gallery img, .swiper-slide img, img')?.getAttribute('src') || '');
					return { title, priceText, imageUrl };
				});
				return data;
			} finally {
				// keep page open for reuse
			}
		}

		const detailPage = await browser.newPage();
		await detailPage.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36');
		for (const href of productLinks){
			try {
				const det = await extractFromDetail(href, detailPage);
				if (!det?.title) continue;
				const price = parsePriceText(det.priceText || '');
				const slug = slugify(`${det.title}-${price ?? ''}`);
				let image = det.imageUrl || null;
				if (cfg.downloadImages && det.imageUrl){
					let ext = '.jpg';
					try { ext = path.extname(new URL(det.imageUrl).pathname) || '.jpg'; } catch {}
					const file = `scrp-${Date.now()}-${Math.random().toString(36).slice(2,6)}${ext}`;
					const dest = path.join(OUT_DIR, file);
					try {
					  await downloadTo(det.imageUrl, dest, {
						'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
						'Referer': href
					  });
					  image = `/uploads/products/${file}`;
					} catch (e) { console.warn('[IMG] download fail', e.message); }
				}
				items.push({
					slug,
					nameEn: det.title,
					nameAr: det.title,
					shortEn: null,
					shortAr: null,
					category: cfg.category || 'supermarket',
					price: price ?? 0,
					oldPrice: null,
					image,
					stock: 50,
					_source: href
				});
			} catch (e) {
				console.warn('[DETAIL] Failed', href, e.message);
			}
		}
		await detailPage.close();
	}

	// De-duplicate by slug
	const map = new Map();
	for (const it of items) { if (!map.has(it.slug)) map.set(it.slug, it); }
	const out = Array.from(map.values());
	await ensureDir(path.dirname(cfg.out));
	fs.writeFileSync(cfg.out, JSON.stringify(out, null, 2), 'utf8');
	console.log(`[SCRAPE] Wrote ${out.length} items to ${path.resolve(cfg.out)}`);
	await browser.close();
}

main().catch(e => { console.error('[SCRAPE] Failed', e); process.exit(1); });

