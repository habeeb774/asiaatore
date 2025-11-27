import { z } from 'zod';

const HEX = /^#([0-9a-fA-F]{6})$/;
const DIGITS = /^[0-9+\s-]+$/;
const NUMERIC_STR = /^-?\d*(\.\d+)?$/;

const urlOrEmpty = z.string().url().or(z.literal(''));
const hexOrEmpty = z.string().regex(HEX, 'الرجاء إدخال لون بصيغة #RRGGBB').or(z.literal(''));
const digitsOrEmpty = z.string().regex(DIGITS, 'أرقام فقط مسموحة').or(z.literal(''));
const numericStrOrEmpty = z.string().regex(NUMERIC_STR, 'رقم صحيح').or(z.literal(''));
const emailOrEmpty = z.string().email('صيغة بريد غير صحيحة').or(z.literal(''));

export const settingsSchema = z.object({
  // Names
  siteNameAr: z.string(),
  siteNameEn: z.string(),
  // Colors
  colorPrimary: z.string().regex(HEX, 'الرجاء إدخال لون بصيغة #RRGGBB'),
  colorSecondary: z.string().regex(HEX, 'الرجاء إدخال لون بصيغة #RRGGBB'),
  colorAccent: z.string().regex(HEX, 'الرجاء إدخال لون بصيغة #RRGGBB'),
  // Contact
  supportPhone: digitsOrEmpty,
  supportMobile: digitsOrEmpty,
  supportWhatsapp: digitsOrEmpty,
  supportEmail: emailOrEmpty,
  supportHours: z.string().optional().default(''),
  taxNumber: z.string().optional().default(''),
  // Footer / company
  footerAboutAr: z.string().optional().default(''),
  footerAboutEn: z.string().optional().default(''),
  companyNameAr: z.string().optional().default(''),
  companyNameEn: z.string().optional().default(''),
  commercialRegNo: z.string().optional().default(''),
  addressAr: z.string().optional().default(''),
  addressEn: z.string().optional().default(''),
  // Links
  linkBlog: urlOrEmpty,
  linkSocial: urlOrEmpty,
  linkReturns: urlOrEmpty,
  linkPrivacy: urlOrEmpty,
  appStoreUrl: urlOrEmpty,
  playStoreUrl: urlOrEmpty,
  // UI
  ui_sidebar_hover_preview: z.boolean().or(z.literal('true')).or(z.literal('false')).transform(v => v === true || v === 'true'),
  ui_sidebar_collapsed_default: z.boolean().or(z.literal('true')).or(z.literal('false')).transform(v => v === true || v === 'true'),
  ui_button_radius: numericStrOrEmpty,
  ui_button_shadow: z.boolean().or(z.literal('true')).or(z.literal('false')).transform(v => v === true || v === 'true'),
  ui_input_radius: numericStrOrEmpty,
  ui_font_family: z.enum(['Cairo','Inter','System']).or(z.literal('')).transform(v => v || 'Cairo'),
  ui_base_font_size: numericStrOrEmpty,
  ui_spacing_scale: numericStrOrEmpty,
  ui_theme_default: z.enum(['system','light','dark']).or(z.literal('system')),
  // Top strip
  topStripEnabled: z.boolean(),
  topStripAutoscroll: z.boolean(),
  topStripBackground: hexOrEmpty,
  // Hero
  heroBackgroundImage: urlOrEmpty,
  heroBackgroundGradient: z.string().optional().default(''),
  heroCenterImage: urlOrEmpty,
  heroAutoplayInterval: z.string().regex(/^\d+$/, 'قيمة رقمية بالمللي ثانية').or(z.literal('')),
  // Shipping config
  shippingBase: numericStrOrEmpty,
  shippingPerKm: numericStrOrEmpty,
  shippingMin: numericStrOrEmpty,
  shippingMax: numericStrOrEmpty,
  shippingFallback: numericStrOrEmpty,
  originLat: numericStrOrEmpty,
  originLng: numericStrOrEmpty,
  // Payments
  payPaypalEnabled: z.boolean(),
  payStcEnabled: z.boolean(),
  payCodEnabled: z.boolean(),
  payBankEnabled: z.boolean(),
  // Messaging
  whatsappEnabled: z.boolean(),
  // Providers
  aramexEnabled: z.boolean(),
  aramexApiUrl: urlOrEmpty,
  aramexApiKey: z.string().optional().default(''),
  aramexApiUser: z.string().optional().default(''),
  aramexApiPass: z.string().optional().default(''),
  aramexWebhookSecret: z.string().optional().default(''),
  smsaEnabled: z.boolean(),
  smsaApiUrl: urlOrEmpty,
  smsaApiKey: z.string().optional().default(''),
  smsaWebhookSecret: z.string().optional().default(''),
});

export function validateSettings(values){
  const parsed = settingsSchema.superRefine((obj, ctx) => {
    if (!obj.siteNameAr && !obj.siteNameEn) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'يرجى إدخال اسم المتجر', path: ['siteNameEn'] });
    }
  }).safeParse(values);
  if (parsed.success) return { success: true, errors: {} };
  const errors = {};
  for (const issue of parsed.error.issues) {
    const key = Array.isArray(issue.path) ? issue.path[0] : issue.path;
    if (key) errors[key] = issue.message || 'غير صالح';
  }
  return { success: false, errors };
}
