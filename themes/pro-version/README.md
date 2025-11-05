# Pro version of the theme — feature overview

This folder describes the 'Pro' product offering. It is not a separate binary in the repo, but documents what the Pro package would include.

Features
- Full RTL support and QA for Arabic/Hebrew (mirrored layouts, RTL-specific CSS)
- Extra widgets: promotional countdown, sticky cart widget, advanced banner rotation
- Multiple shipping connectors and rule engine for zone-based rates
- Extra payment flows and pre-built integrations (local gateways)
- Premium support, setup assistance and migration scripts

How to get Pro
- Contact the project owner or vendor. Pro is intended to be a paid add-on; the deliverable includes a full theme bundle, RTL QA report, and installation support.

Developer notes
- RTL-specific styles are placed under `themes/pro-version/rtl/` and must be merged into a chosen template's CSS.
- Shipping rules for Pro are expressed as JSON samples under `themes/pro-version/shipping-samples/`.
