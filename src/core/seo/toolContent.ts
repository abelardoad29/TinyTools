export type Faq = { question: string; answer: string };
export type ToolContent = { intro: string; faqs: Faq[] };

/**
 * Prose for the bottom of each tool page. Two jobs: answer the questions people
 * actually arrive with, and give search engines something to index — a page with a
 * form and no text can't rank. Kept out of the manifests for the same reason the SEO
 * titles are (CODEX.md §8): this is marketing copy, not tool behaviour.
 *
 * The angle throughout is the one the big players can't honestly claim, because they
 * upload your file to a server: this doesn't.
 */
export const TOOL_CONTENT: Record<string, ToolContent> = {
  count: {
    intro:
      "A tally counter for anything you'd otherwise track on paper — people through a door, laps, inventory, cups of coffee. Add as many counters as you need, give each one a name, and set a goal or an automatic daily reset when it helps. Counts are saved on your device, so closing the tab doesn't lose them.",
    faqs: [
      {
        question: "Are my counts saved if I close the tab?",
        answer:
          "Yes. Counters are stored in your browser's local storage on this device, so they're still there when you come back. They aren't synced to an account or a server, which also means they won't follow you to another device or survive clearing your browser data.",
      },
      {
        question: "Can I count several things at once?",
        answer:
          "Yes — add a counter per thing you're tracking and switch to board view to see them all as large tiles, which is easier at a distance or on a phone propped up at a door.",
      },
      {
        question: "What does the daily reset do?",
        answer:
          "A counter set to reset daily starts from zero each new day and files the previous day's total into its history, so you keep the record without having to write it down or reset manually.",
      },
    ],
  },

  time: {
    intro:
      "A timer, a stopwatch with laps, a Pomodoro cycle and countdowns to a future date, in one page. Nothing to install and no sign-up — useful when you want a timer running in a browser tab rather than reaching for your phone.",
    faqs: [
      {
        question: "Does the timer keep running if I switch tabs?",
        answer:
          "Yes. Time is tracked against the clock rather than counted tick by tick, so a background tab that the browser throttles still shows the correct remaining time when you come back to it.",
      },
      {
        question: "Will it make a sound when the timer ends?",
        answer:
          "Yes, a short chime plays when a timer or a Pomodoro phase finishes. Browsers only allow sound after you've interacted with the page, so it works because you started the timer yourself.",
      },
      {
        question: "How is the Pomodoro cycle set up?",
        answer:
          "It alternates a focus phase and a break, both of which you can set to any length — 25 and 5 minutes by default. When a phase ends it rolls into the next one and counts the completed cycles.",
      },
    ],
  },

  "dev-toolkit": {
    intro:
      "The small conversions you reach for a dozen times a day — formatting JSON, decoding Base64, generating a UUID, hashing a string, checking a regex, peeking inside a JWT, converting a Unix timestamp. All of them run as JavaScript in your own browser, so nothing you paste is transmitted to a server.",
    faqs: [
      {
        question: "Is the data I paste sent anywhere?",
        answer:
          "No. Every operation here runs locally in your browser — there is no upload step and no request carrying your input. That matters most for the JWT and hash tools, where what you paste is often sensitive.",
      },
      {
        question: "Does the JWT tool verify the signature?",
        answer:
          "No, deliberately. It decodes the header and payload so you can read the claims, but verifying a signature would mean handling your secret. As a rule, don't paste a production token into any site that offers to verify it for you.",
      },
      {
        question: "Which hash algorithms are supported?",
        answer:
          "SHA-1, SHA-256, SHA-384 and SHA-512, computed with the browser's built-in Web Crypto API. MD5 isn't included — it's been unsafe for integrity checking for years.",
      },
      {
        question: "Where does it tell me a JSON error is?",
        answer:
          "Invalid JSON reports the line and column of the failure, not just that something is wrong, so you can go straight to the missing comma or bracket.",
      },
    ],
  },

  "text-toolkit": {
    intro:
      "Convert case, count words and characters, strip invisible characters, find and replace, sort or deduplicate lines, turn a title into a URL slug, generate placeholder text, and compare two versions of something. Everything happens in the page — useful when the text is a draft, a client's copy, or anything you'd rather not paste into a stranger's server.",
    faqs: [
      {
        question: "Is my text uploaded anywhere?",
        answer:
          "No. Nothing you type or paste leaves your browser, which is the point of the tool — plenty of free text utilities post your content to a backend to process it.",
      },
      {
        question: "What are 'invisible characters' and why remove them?",
        answer:
          "Text copied from web pages, PDFs and word processors often carries zero-width spaces and joiners you can't see. They break search, comparison and sometimes code. The cleaner strips them along with stray whitespace.",
      },
      {
        question: "How does the diff work?",
        answer:
          "It compares the two texts line by line and marks each line as unchanged, added or removed, which is enough to spot what changed between two versions of a paragraph or a config file.",
      },
      {
        question: "Which case formats can it convert to?",
        answer:
          "UPPERCASE, lowercase, Title Case, Sentence case, camelCase, PascalCase, snake_case, kebab-case and CONSTANT_CASE. The programming ones re-tokenize the words; Title and Sentence case keep your original punctuation and spacing.",
      },
    ],
  },

  "calculators-toolkit": {
    intro:
      "Ten small calculators that would each otherwise be their own tab: unit and storage conversion, DPI and aspect ratio, the difference between two dates, percentages, rule of three, hh:mm to decimal hours, the byte size of a piece of text, and coordinate formats.",
    faqs: [
      {
        question: "Does storage conversion use 1024 or 1000?",
        answer:
          "Both — you choose. Binary (1024) is what operating systems usually report; decimal (1000) is what drive manufacturers print on the box. It's the reason a '1 TB' disk shows up as roughly 931 GB.",
      },
      {
        question: "What is the time decimal converter for?",
        answer:
          "Timesheets and invoicing. Most billing systems want 1.5 hours rather than 1:30, and this converts in both directions without the mental arithmetic that causes rounding errors.",
      },
      {
        question: "How does the date difference handle months?",
        answer:
          "It gives both readings: the exact total in days, hours and minutes, and a calendar breakdown in years, months and days — which are different numbers because months aren't a fixed length.",
      },
    ],
  },

  "qr-toolkit": {
    intro:
      "Generate QR codes for text and links, a WiFi QR that connects a phone on scan, and standard barcodes. Codes are generated in your browser and downloaded straight to your device, with no watermark, no account and no redirect service in the middle.",
    faqs: [
      {
        question: "Do these QR codes expire or stop working?",
        answer:
          "No. The content is encoded directly into the image, so the code works forever and offline. Many free generators encode a link to their own domain and redirect — those stop working if the company shuts down or starts charging.",
      },
      {
        question: "Is scanning tracked?",
        answer:
          "No. There's no analytics or redirect in the code, which also means there's no scan count — that's the trade-off for a code nobody else controls.",
      },
      {
        question: "How does the WiFi QR code work?",
        answer:
          "It encodes your network name, password and security type in the standard WIFI: format that iOS and Android recognise. Scanning it offers to join the network, so guests never have to type the password.",
      },
      {
        question: "Which barcode formats are supported?",
        answer:
          "CODE128, EAN-13, EAN-8, UPC, CODE39, ITF-14, MSI, pharmacode and codabar. Formats like EAN-13 require an exact digit count and will tell you when the value doesn't fit.",
      },
    ],
  },

  "image-toolkit": {
    intro:
      "Resize, compress and convert images between PNG, JPG and WebP, crop to a ratio, add a watermark or a border, and pull out an image's dominant colors. Images are processed by your own browser through the Canvas API — they're never uploaded, which is the difference between this and most free image tools.",
    faqs: [
      {
        question: "Are my images uploaded to a server?",
        answer:
          "No. The file is read and re-drawn locally by your browser, and the result is handed straight back to you as a download. Nothing crosses the network, so it also works with the connection off once the page has loaded.",
      },
      {
        question: "Does this remove EXIF data like GPS location?",
        answer:
          "Yes, as a side effect of how it works. Re-encoding an image through canvas produces a clean file without the original metadata — camera model, timestamps and GPS coordinates included. It's worth doing before posting a photo publicly.",
      },
      {
        question: "Which format should I choose?",
        answer:
          "WebP gives the smallest files and is supported everywhere modern; JPG is the safest for old software and email; PNG is the one to keep when the image has transparency, since converting it to JPG fills transparent areas with white.",
      },
      {
        question: "Why did my PNG get bigger when saved as PNG?",
        answer:
          "PNG is lossless, so re-encoding a screenshot or an illustration can produce a slightly larger file than the original if the original was optimized. If your goal is a smaller file, use WebP or JPG with the quality slider.",
      },
    ],
  },

  "pdf-toolkit": {
    intro:
      "Merge several PDFs into one, split a file into parts, pull out specific pages, rotate, build a PDF from images, add page numbers and read or clean document metadata. Everything runs in your browser, which matters more here than in most tools — PDFs are contracts, invoices and medical records.",
    faqs: [
      {
        question: "Are my PDFs uploaded anywhere?",
        answer:
          "No. The file is parsed and rewritten in your browser and the result downloads directly to you. Nothing is transmitted, stored on a server, or deleted-after-an-hour the way upload-based converters describe — because it was never sent in the first place.",
      },
      {
        question: "Is there a file size or page limit?",
        answer:
          "There's no imposed limit. The practical ceiling is your device's memory, since the document is held in the tab while you work on it. Very large scanned files are the ones most likely to struggle.",
      },
      {
        question: "Can it open a password-protected PDF?",
        answer:
          "No. Encrypted documents can't be opened here, and you'll get a message saying so rather than a silent failure. Remove the password in the application that created the file first.",
      },
      {
        question: "Does merging or splitting reduce quality?",
        answer:
          "No. Pages are copied from one document into another as-is, not re-rendered or re-compressed, so text stays selectable and images keep their original resolution.",
      },
      {
        question: "How do I write page ranges?",
        answer:
          "The way you'd say them out loud: 1-3, 7, 10-12. Single pages and ranges can be mixed, and repeated pages are only included once.",
      },
    ],
  },
};

export const contentForTool = (toolId: string): ToolContent | undefined => TOOL_CONTENT[toolId];
