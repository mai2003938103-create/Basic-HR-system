---
name: Systory HRMS
description: "ລະບົບບໍລິຫານບຸກຄະລາກອນພາສາລາວ ທີ່ສະຫງົບ, ແຈ້ງຊັດ ແລະ ເຊື່ອຖືໄດ້."
colors:
  systory-working-teal: "#19827b"
  systory-working-teal-dark: "#2ba495"
  gradient-teal-start: "#046262"
  gradient-teal-end: "#167a78"
  soft-green-neutral: "#f4f7f6"
  soft-green-neutral-dark: "#071c1b"
  card-white: "#ffffff"
  card-green-dark: "#0e2b29"
  sunken-surface: "#eaf2f0"
  sunken-surface-dark: "#133532"
  primary-ink: "#0f2523"
  primary-ink-dark: "#e4f1ef"
  primary-tint: "#e3f2f0"
  primary-tint-dark: "#0f3f3b"
  logo-burgundy: "#81121b"
  poster-red: "#de2323"
  status-success: "#16a34a"
  status-warning: "#f59e0b"
  status-danger: "#dc2626"
  chart-teal: "#008c7c"
  chart-gold: "#b88a00"
  chart-blue: "#2f6fb5"
  chart-red: "#dc2626"
typography:
  clock:
    fontFamily: '"Noto Sans", "Noto Sans Lao", "Phetsarath OT", system-ui, sans-serif'
    fontSize: "40px"
    fontWeight: 700
    lineHeight: "48px"
  stat-money:
    fontFamily: '"Noto Sans", "Noto Sans Lao", "Phetsarath OT", system-ui, sans-serif'
    fontSize: "26px"
    fontWeight: 700
    lineHeight: "38px"
  display:
    fontFamily: '"Noto Sans", "Noto Sans Lao", "Phetsarath OT", system-ui, sans-serif'
    fontSize: "30px"
    fontWeight: 700
    lineHeight: "38px"
  headline:
    fontFamily: '"Noto Sans", "Noto Sans Lao", "Phetsarath OT", system-ui, sans-serif'
    fontSize: "28px"
    fontWeight: 600
    lineHeight: "40px"
  title:
    fontFamily: '"Noto Sans", "Noto Sans Lao", "Phetsarath OT", system-ui, sans-serif'
    fontSize: "20px"
    fontWeight: 600
    lineHeight: "30px"
  body:
    fontFamily: '"Noto Sans", "Noto Sans Lao", "Phetsarath OT", system-ui, sans-serif'
    fontSize: "15px"
    fontWeight: 400
    lineHeight: "24px"
  label:
    fontFamily: '"Noto Sans", "Noto Sans Lao", "Phetsarath OT", system-ui, sans-serif'
    fontSize: "14px"
    fontWeight: 500
    lineHeight: "22px"
  subhead:
    fontFamily: '"Noto Sans", "Noto Sans Lao", "Phetsarath OT", system-ui, sans-serif'
    fontSize: "16px"
    fontWeight: 600
    lineHeight: "26px"
  caption:
    fontFamily: '"Noto Sans", "Noto Sans Lao", "Phetsarath OT", system-ui, sans-serif'
    fontSize: "12px"
    fontWeight: 600
    lineHeight: "18px"
rounded:
  sm: "8px"
  md: "12px"
  pill: "999px"
  none: "0px"
spacing:
  space-1: "4px"
  space-2: "8px"
  space-3: "12px"
  space-4: "16px"
  space-6: "24px"
  space-8: "32px"
components:
  button-primary:
    backgroundColor: "{colors.systory-working-teal}"
    textColor: "var(--on-primary)"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    height: "40px"
    padding: "0 24px"
  button-outline:
    backgroundColor: "var(--surface-card)"
    textColor: "var(--ink)"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    height: "40px"
    padding: "0 24px"
  card:
    backgroundColor: "var(--surface-card)"
    rounded: "{rounded.md}"
    padding: "24px"
  input:
    backgroundColor: "var(--surface-card)"
    textColor: "var(--ink)"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    height: "40px"
    padding: "0 12px"
  navigation:
    backgroundColor: "var(--secondary)"
    textColor: "var(--on-secondary-muted)"
    typography: "{typography.label}"
    width: "248px"
    padding: "16px"
  status-badge:
    backgroundColor: "var(--success-tint)"
    textColor: "var(--success-text)"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: "2px 10px"
  section-tab:
    backgroundColor: "{colors.systory-working-teal}"
    textColor: "var(--on-primary)"
    typography: "{typography.subhead}"
    padding: "8px 32px 8px 24px"
---

# Design System: Systory HRMS

## Overview

**Creative North Star: "The Trusted Teal Ledger"**

ລະບົບນີ້ຄວນຮູ້ສຶກສະຫງົບ, ແຈ້ງຊັດ ແລະ ໜ້າເຊື່ອຖື ຄືລະບົບບັນຊີທີ່ຈັດລະບຽບດີ. ເນື້ອຫາ ແລະ ສະຖານະຕ້ອງອ່ານງ່າຍ, ຂໍ້ມູນສຳຄັນຈັດລຽງໃຫ້ສະແກນເບິ່ງໄດ້ໄວ, ແລະ ສີແບຣນໃຊ້ຢ່າງພໍດີ. ອັດລັກຂອງ Systory ຢູ່ໃນສີຂຽວຄາມ, ພື້ນຜິວໂທນຂຽວເຢັນ ແລະ ການຈັດວາງທີ່ຄາດເດົາໄດ້; ບໍ່ໃຫ້ການຕົກແຕ່ງແຂ່ງຂັນກັບວຽກ.

ຮອງຮັບວຽກປະຈຳວັນຂອງພະນັກງານຜ່ານມືຖື ແລະ ວຽກຈັດການລະອຽດຂອງ HR ຜ່ານ desktop. ທຸກອົງປະກອບຄວນຊັດເຈນ, ໃຊ້ງານໄດ້ຈິງ, ແລະ ຮອງຮັບພາສາລາວທີ່ມີສະຫຼະ/ວັນນະຍຸດຊ້ອນກັນໂດຍບໍ່ຖືກຕັດ.

**Key Characteristics:**
- ສະຫງົບ ແລະ ເຊື່ອຖືໄດ້
- ສີຂຽວຄາມເປັນຈຸດຈຳ; ສີອື່ນມີໜ້າທີ່ຊັດເຈນ
- ຂໍ້ມູນອ່ານງ່າຍ ແລະ ຈັດລຽງເປັນລະບຽບ
- ຄວາມໜາແໜ້ນແລະຮູບແບບປັບຕາມໂທລະສັບ/desktop

## Colors

ສີຫຼັກ “Systory Working Teal” ເປັນສີສຳລັບການກະທຳ; “Quiet Green Neutrals” ຮອງຮັບຄວາມອ່ານງ່າຍ ແລະ ສະຫຼັບຕາມ theme. ຄ່າສີໃນ YAML ແມ່ນສີ canonical ຂອງ light theme ຫຼື ຄ່າ dark-theme ທີ່ລະບຸແຍກ.

### Primary
- **Systory Working Teal** (`--primary`, light `#19827b`; dark `#2ba495`): ປຸ່ມຫຼັກ, ຕົວຄວບຄຸມທີ່ເລືອກແລ້ວ ແລະ ຈຸດເນັ້ນສຳຄັນ.
- **Teal Hover** (`--primary-hover`, light `#046262`; dark `#51c4b5`): hover/pressed, ລິ້ງ ແລະ ວົງ focus ທີ່ເຫັນຊັດ.

### Secondary
- **Gradient Teal** (`--secondary` → `--secondary-end`, light `#046262` → `#167a78`; dark `#04403f` → `#0b5a57`): ພື້ນຫຼັງ sidebar ແລະຈຸດໃຊ້ brand ທີ່ກຳນົດໄວ້.
- **Primary Tint** (`--primary-tint`, light `#e3f2f0`; dark `#0f3f3b`): ລາຍການທີ່ເລືອກ, ຂໍ້ຄວາມແຈ້ງ ແລະ ສ່ວນເນັ້ນຂໍ້ມູນ.

### Neutral
- **Soft Green Neutral** (`--surface-100`, light `#f4f7f6`; dark `#071c1b`): ພື້ນຫຼັງໜ້າ.
- **Card Surface** (`--surface-card`, light `#ffffff`; dark `#0e2b29`): card, header, form field ແລະ dialog.
- **Sunken Surface** (`--surface-sunken`, light `#eaf2f0`; dark `#133532`): ຫົວຕາຕະລາງ, hover, ສະຖານະ disabled.
- **Ink** (`--ink`, light `#0f2523`; dark `#e4f1ef`) ແລະ **Muted Ink** (`--ink-muted`, light `#4a605e`; dark `#9bb5b1`): ຂໍ້ຄວາມຫຼັກ ແລະ ຂໍ້ຄວາມຮອງ.
- **Hairline** (`--border`, light `#d3e3e0`; dark `#22453f`) ແລະ **Control Border** (`--border-strong`, light `#778d8a`; dark `#5e8580`): ເສັ້ນແບ່ງບາງ ແລະ ຂອບຄວບຄຸມ.

### Tertiary
- **Logo Burgundy** (`--accent`, light `#81121b`; dark `#f0a0a4`): ຈຸດສີນ້ອຍໆຂອງແບຣນ ເຊັ່ນອັກສອນໃນ avatar.
- **Poster Red** (`--accent-bright`, light `#de2323`; dark `#ff6b6b`): tagline ໃນໜ້າ login ເທົ່ານັ້ນ.
- **Chart Series:** teal `#008c7c`, gold `#b88a00`, blue `#2f6fb5`, red `#dc2626`; dark theme ປັບເປັນ `#2ba495`, `#b88b18`, `#4f8fd6`, `#e05252` ຕາມລຳດັບ.

### Named Rules
**The Gradient-in-Three-Places Rule.** ໃຊ້ gradient ໃນ sidebar/mobile drawer, ແຜງ brand ຂອງ login, ແລະ dashboard card ແບບ featured ໄດ້ສູງສຸດໜຶ່ງໃບຕໍ່ໜ້າ.

**The Status-Has-a-Word Rule.** ສະຖານະຕ້ອງມີຄຳບອກຄວາມໝາຍຄູ່ກັບສີ; ຫ້າມໃຊ້ສີພຽງຢ່າງດຽວ.

## Typography

**Display Font:** Noto Sans, Noto Sans Lao, Phetsarath OT, system-ui, sans-serif  
**Body Font:** Noto Sans, Noto Sans Lao, Phetsarath OT, system-ui, sans-serif  
**Label/Mono Font:** ສະແຕັກດຽວກັບ body; ຕົວເລກທີ່ຈັດລຽງໃຊ້ tabular figures.

**Character:** ຮູບແບບ sans-serif ທີ່ທັນສະໄໝ ແລະ ອ່ານງ່າຍ; Noto Sans Lao ຮອງຮັບຮູບຊົງຕົວອັກສອນລາວ, Noto Sans ຈັດການອັກສອນລາຕິນ ແລະ ຕົວເລກ.

### Hierarchy
- **Display** (700, 30px / 38px): ຕົວເລກສະຖິຕິ ແລະ ຄ່າສຳຄັນ.
- **Headline** (600, 28px / 40px): ຫົວຂໍ້ຫຼັກຂອງໜ້າ.
- **Title** (600, 20px / 30px): ຫົວຂໍ້ card ແລະ dialog.
- **Subhead** (600, 16px / 26px): ຫົວຂໍ້ກຸ່ມຟອມ ແລະ ຫົວຂໍ້ຍ່ອຍ.
- **Body** (400, 15px / 24px): ຂໍ້ຄວາມຫຼັກ, ຄ່າໃນຟອມ ແລະ cell.
- **Label** (500, 14px / 22px): ປ້າຍກຳກັບ, ປຸ່ມ, ແຖບນຳທາງ.
- **Caption** (600, 12px / 18px): badge, ຫົວຕາຕະລາງ ແລະ ຂໍ້ຄວາມປະກອບ.
- **Clock** (700, 40px / 48px): ໂມງສົດໃນກາດ check-in ເທົ່ານັ້ນ (`text-clock`).
- **Stat Money** (700, 26px / 38px): ຈຳນວນເງິນກີບໃນກາດສະຖິຕິ, ນ້ອຍກວ່າ Display ໜຶ່ງຂັ້ນ ເພື່ອໃຫ້ຕົວເລກ 10 ຫຼັກຢູ່ແຖວດຽວໃນ 4 ຖັນ (`text-stat-money`).

### Named Rules
**The Lao-Line-Height Rule.** ຮັກສາ line-height ປະມານ 1.4–1.6 ແລະ ຢ່າຕັດຄວາມສູງຂໍ້ຄວາມ ເພາະສະຫຼະ ແລະ ວັນນະຍຸດລາວມີສ່ວນຊ້ອນເທິງ/ລຸ່ມ.

## Layout

- ໃຊ້ spacing scale ທີ່ອີງຕາມ 4px: 4, 8, 12, 16, 24 ແລະ 32px. Card ມັກໃຊ້ padding 24px ແລະ gap 24px.
- ເນື້ອຫາຫຼັກກວ້າງສູງສຸດ 1400px; padding 16px ໃນມືຖື ແລະ 32px ໃນ desktop.
- App shell ມີ sidebar 248px ຕັ້ງແຕ່ 1024px ຂຶ້ນໄປ; ປັບເປັນ icon rail 72px ໃນຊ່ວງ 768–1023px; ຕ່ຳກວ່າ 768px ໃຊ້ drawer ກວ້າງ 280px.
- Header ສູງ 64px ແລະ sticky. ໜ້າທົ່ວໄປຈັດເປັນ PageHeader → ສະຖິຕິຖ້າມີ → card/ເນື້ອຫາ.
- ແຖວສະຖິຕິໃຊ້ 4 columns ໃນຈໍກວ້າງ, 2 columns ໃນຈໍກາງ, 1 column ໃນຈໍແຄບ; dashboard ຄົງ 2 columns ໃນມືຖື.
- ຕາຕະລາງກວ້າງເລື່ອນພາຍໃນ card ແທນການເຮັດໃຫ້ໜ້າຈໍທັງໜ້າເລື່ອນແນວນອນ.

## Elevation & Depth

ໃຊ້ຄວາມຕ່າງຂອງສີພື້ນ ແລະ ເສັ້ນຂອບເປັນຫຼັກ. ໃນ light theme card ມີເງົາບາງໆພ້ອມ hairline; ໃນ dark theme card ບໍ່ມີເງົາ ແລະ ໃຊ້ contrast ຂອງພື້ນຜິວແທນ. Dialog, dropdown, popover ໃຊ້ເງົາ overlay ທີ່ເຫັນຊັດກວ່າ. ພື້ນຫຼັງ overlay ມືດດ້ວຍສີດຳ 40%.

### Shadow Vocabulary
- **Card (light):** `0 1px 2px rgba(4,98,98,0.06), 0 1px 3px rgba(4,98,98,0.08)`.
- **Card (dark):** `none`; ອີງໃສ່ surface ແລະ border.
- **Overlay (light):** `0 12px 32px rgba(4,98,98,0.16)`.
- **Overlay (dark):** `0 12px 32px rgba(0,0,0,0.5)`.

**The Quiet Resting Surface Rule.** ເກັບເງົາທີ່ໜັກໄວ້ໃຫ້ overlay; card ແລະ ໜ້າທຳງານບໍ່ຄວນເບິ່ງຄືລອຍເດັ່ນຕະຫຼອດເວລາ.

## Shapes

- ປຸ່ມ, navigation item, badge ແລະ avatar ໃຊ້ຮູບຊົງ pill (`999px`).
- Input, select, checkbox, banner ແລະ icon tile ໃຊ້ມຸມ 8px; card, dialog, dropdown ແລະ popover ໃຊ້ 12px.
- ຂອບ card ແລະຕາຕະລາງເປັນເສັ້ນບາງໂທນຂຽວ; control ໃຊ້ border ເຂັ້ມຂຶ້ນເພື່ອໃຫ້ຂອບເຫັນຊັດ.
- ໃຊ້ຮູບຊົງສີ່ຫຼ່ຽມແຈສາກເທົ່ານັ້ນໃນກຣາຟິກແບຣນທີ່ອີງຕາມໂລໂກ້.

## Components

### Buttons
- **ລັກສະນະ:** ຄວບຄຸມງ່າຍ ແລະ ສຸພາບ; ຮູບຊົງ pill ບອກຂອບເຂດການກົດໄດ້ຊັດ.
- **Primary:** ພື້ນ `primary`, ຂໍ້ຄວາມ `on-primary`, ສູງ 40px ແລະ padding ຂ້າງ 24px.
- **Hover / Focus:** hover ເປັນ `primary-hover`; focus ໃຊ້ outline 2px ແລະ offset 2px.
- **Outline:** ພື້ນ card, ຂອບ `border-strong`, ຂໍ້ຄວາມ `ink`; hover ເປັນ `surface-sunken`.
- **Ghost / Subtle:** ບໍ່ເນັ້ນພື້ນໃນສະພາບປົກກະຕິ; hover ໃຊ້ tint ຫຼື surface ເບົາ.
- **Disabled:** `surface-sunken` ກັບ `ink-muted`; ປິດການກົດ ແລະ ບໍ່ໃຊ້ຄວາມຈາງເປັນສັນຍານພຽງຢ່າງດຽວ.

### Chips
- **Style:** badge ແລະຕົວກອງໃຊ້ພື້ນສີ tint, ສີຂໍ້ຄວາມທີ່ອ່ານໄດ້ ແລະ ມຸມ pill.
- **State:** ສະຖານະສະແດງຄຳອະທິບາຍຄູ່ກັບສີ; ຕົວເລກໃນ badge ໃຊ້ tabular figures.

### Cards / Containers
- **Corner Style:** 12px.
- **Background:** `surface-card` ຢູ່ເທິງ `surface-100`.
- **Shadow Strategy:** ຕາມ Elevation & Depth; ໃຊ້ hairline `border` ທັງສອງ theme.
- **Internal Padding:** 24px ໂດຍທົ່ວໄປ; dashboard card ຫຼຸດເປັນ 16px ໃນຈໍນ້ອຍ.

### Inputs / Fields
- **Style:** ສູງ 40px, padding ນອນ 12px, ມຸມ 8px, ພື້ນ `surface-card`, ຂອບ `border-strong`.
- **Focus:** outline 2px ສີ `focus-ring`, offset 2px.
- **Error / Disabled:** error ປ່ຽນຂອບເປັນ danger; disabled ໃຊ້ `surface-sunken` ແລະ `ink-muted`.

### Navigation
- **Style:** sidebar/mobile drawer ໃຊ້ gradient ຂຽວຄາມ ແລະ ລາຍການ pill ສູງ 40px.
- **Active:** ພື້ນ `surface-card`, ຂໍ້ຄວາມ `primary-hover`, ນ້ຳໜັກເຄິ່ງໜາ.
- **Inactive / Hover:** ຂໍ້ຄວາມອ່ອນສີຂາວ; hover ໃຊ້ພື້ນຂາວໂປ່ງແສງ.
- **Responsive:** sidebar ເຕັມ 248px, icon rail 72px, ຫຼື drawer 280px ຕາມຂະໜາດຈໍ.

### Status Badge
- ໃຊ້ສີ success, warning, danger, info ຫຼື neutral ເທິງພື້ນ tint; ເພີ່ມຈຸດນ້ອຍຄູ່ກັບຂໍ້ຄວາມສະຖານະ. ການແປສະຖານະຕ້ອງມາຈາກ locale.

### Section Tab
- ແຖບຫົວຂໍ້ສີ primary ວາງຊິດຂອບຊ້າຍຂອງ card; ມຸມຊ້າຍຮາບ ແລະ ປາຍຂວາເປັນ pill.

## Do's and Don'ts

### Do:
- **Do** ໃຊ້ CSS custom properties/Tailwind semantic tokens ຈາກ `frontend/styles/tokens.css`; ໄຟລ໌ token ນີ້ສ້າງຈາກ design token source ແລະ ບໍ່ຄວນແກ້ໂດຍກົງ.
- **Do** ກວດທຸກຂໍ້ຄວາມໃນ light ແລະ dark theme; ສີຂອງ text ແລະ control ຕ້ອງອ່ານ/ແຍກໄດ້.
- **Do** ໃຫ້ທຸກສະຖານະມີຂໍ້ຄວາມ ຫຼື icon ປະກອບ; icon-only button ຕ້ອງມີ accessible label ແລະ tooltip.
- **Do** ຈັດວາງຕົວເລກເງິນ, ວັນທີ ແລະ ຈຳນວນໃຫ້ສະໝ່ຳສະເໝີດ້ວຍ tabular figures.
- **Do** ຮັກສາຄວາມສູງບັນທັດທີ່ອ່ານອັກສອນລາວໄດ້ຄົບ ແລະ ທົດສອບການຈັດວາງໃນພາສາລາວ.

### Don't:
- **Don't** ໃຊ້ສີ hex ຫຼື utility ສີດິບໃນ component ເມື່ອມີ semantic token ທີ່ເໝາະສົມ.
- **Don't** ນຳ gradient, poster red ຫຼື ສີຕົກແຕ່ງໄປໃສ່ທົ່ວໜ້າທຳງານ; ຮັກສາກົດການໃຊ້ gradient ຕາມທີ່ລະບຸ.
- **Don't** ໃຊ້ສີຢ່າງດຽວເພື່ອສື່ຄວາມໝາຍ ຫຼື ສະຖານະ.
- **Don't** ໃຊ້ line-height ແຄບ/ຕັດຂໍ້ຄວາມລາວດ້ວຍ overflow ຫຼື fixed height ທີ່ບໍ່ເໝາະສົມ.
- **Don't** ເພີ່ມ radius, shadow ຫຼື font size ແບບ one-off; ໃຫ້ເພີ່ມ/ໃຊ້ລະບົບ token ແທນ.