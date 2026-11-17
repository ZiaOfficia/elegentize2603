# How the blog works (no backend)

elegantize.com is now a fully static website. There is no server, database,
admin panel or Render account behind it. Every blog post is a file in
`frontend/content/blog/`, and its pictures live in `frontend/public/blog-images/<slug>/`.

When the site is built, every post becomes a complete HTML page with its own title,
description, canonical link and Article data. That is exactly what Google
crawls and indexes, so nothing waits on JavaScript or a server.

All commands below are run from the `frontend` folder.

---

## One-time setup on a new computer

```bash
cd frontend
npm install
```

---

## Moving the old posts in (one time only)

The 172 posts that used to sit in the database are copied from the live
website into files:

```bash
npm run import-live-blog
npm run blog
```

* `import-live-blog` reads every post on elegantize.com and writes
  `content/blog/<slug>.html`. It also downloads every picture, including the
  ones that were pasted inside the text, into `public/blog-images/<slug>/` as
  compressed WebP files. It takes a while and needs internet.
* `npm run blog` checks every post and rebuilds the sitemap. Fix anything it
  marks with ✗.
* If some posts fail (for example, a timeout), run `import-live-blog` again. It
  only retries the posts that are missing.

Then commit `content/blog/` and `public/blog-images/`.

---

## Writing a new post

**1. Create it**

```bash
npm run new-post -- "How Much Does Wedding Decor Cost in New Jersey?"
```

This creates `content/blog/how-much-does-wedding-decor-cost-in-new-jersey.md`
(with today's date) and an empty picture folder for it.

**2. Fill in the top section** (between the `---` lines): title, category,
tags, metaTitle, metaDescription, image, imageAlt. Each field is explained in
`content/blog/_TEMPLATE.md`.

**3. Write the article** below the second `---`, in Markdown:

| You type | You get |
|---|---|
| `## Heading` | section heading |
| `### Smaller heading` | sub-heading |
| `**bold**`, `*italic*` | **bold**, *italic* |
| `[link text](/services/ceiling-design)` | a link |
| `![what the picture shows](/blog-images/my-post/1.webp)` | a picture |
| `- item` | bullet list |
| an empty line | new paragraph |

You can also paste plain HTML (`<p>`, `<table>`, `<iframe>` for YouTube).
Don't use `#` (single) headings: the post title is already the page's heading.

**4. Add pictures.** Copy the photos into `public/blog-images/<slug>/`, named
`cover.jpg`, `1.jpg`, `2.jpg` and so on, then run:

```bash
npm run blog-images
```

This turns them into small `.webp` files. Link them in the post as
`/blog-images/<slug>/cover.webp`, `/blog-images/<slug>/1.webp`, …
**Never paste images straight into the text.** The build refuses posts that do
this, because embedded images were what used up the old server's bandwidth.

**5. Publish:** change `draft: true` to `draft: false`.

**6. Preview:**

```bash
npm run dev
```

Open <http://localhost:5173/blog>. If you change the post while the preview is
running, run `npm run blog` and refresh the page.

---

## Putting it live

### Option A: push to GitHub (automatic)

Commit and push to `main`. GitHub Actions ("Deploy Frontend to Hostinger")
builds the whole site and uploads it to Hostinger by FTP. It takes about 5–10
minutes. If a post has a mistake, the build stops and nothing is uploaded;
the error is shown in the Actions tab.

### Option B: upload by hand

```bash
npm run build
```

Then upload **the contents of** `frontend/dist/` into `public_html` on
Hostinger. The easy way: zip the contents of `dist`, upload the zip in
Hostinger's File Manager, and extract it in `public_html`, replacing existing
files.

> ⚠️ Do **not** empty `public_html` first. The site's photos in
> `public_html/images/` are only on the server, not in this project, so
> deleting them would break every page. Upload over the top instead.

---

## Editing or removing a post

* **Edit:** change the file, set `updated: YYYY-MM-DD` to today, and publish
  again.
* **Remove:** delete the file (or set `draft: true`) and publish again. Then add
  a redirect in `frontend/public/.htaccess` from the old URL to the closest
  related page, so visitors and Google don't hit a dead end:
  ```
  RewriteRule ^2025/03/12/old-post-slug/?$ /2025/04/01/related-post [R=301,L]
  ```
* **Never change `slug` or `date` of a live post.** Both are part of its URL.
  If you really must, add a redirect from the old URL as above.

---

## SEO checklist for every post

* [ ] **metaTitle** under 60 characters, with the main keyword near the start
* [ ] **metaDescription** 150–160 characters, with the keyword and a reason to click
* [ ] One clear topic; the keyword in the title, the first paragraph and one `##` heading
* [ ] `##` / `###` headings in order (no `#`)
* [ ] A cover image plus pictures in the text, each with a description in `![...]`
* [ ] 2–4 links to other pages on the site (services, related posts, contact)
* [ ] Images converted with `npm run blog-images` (fast pages rank better)
* [ ] After it is live: Google Search Console → URL Inspection → paste the URL →
      **Request indexing**

---

## When the build complains

`npm run blog` (and every build) checks all posts first:

* `✗ ...` is a **problem**. The site will not build until it is fixed. The
  message names the file and what is wrong (bad date, missing image, duplicate
  slug, image pasted into the text…).
* `! ...` is a **warning**. The site builds, but the post could be better
  (description too long, no cover image…).

---

## Where things are

| What | Where |
|---|---|
| Posts | `frontend/content/blog/*.md` (new) and `*.html` (imported) |
| Post template | `frontend/content/blog/_TEMPLATE.md` |
| Post pictures | `frontend/public/blog-images/<slug>/` |
| Sitemap | `frontend/public/sitemap.xml` (rebuilt automatically, never edit) |
| Redirects | `frontend/public/.htaccess` |
| Build scripts | `frontend/scripts/build-blog.mjs`, `prerender.mjs` |
