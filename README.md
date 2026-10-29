# Static project site

A small multi-page website. Edit the files, push them, and they go live.

You do **not** need an AWS account, and you will not be given one. Hosting is
handled for you. There is nothing to sign up for.

There's no framework here and nothing to install. It's HTML and CSS, which is
all a site this size needs.

---

## Run it on your computer

Open `site/index.html` in your browser and you'll see the page. That works for
quick edits.

For links starting with `/` to behave the same way they do on the real site,
serve the folder instead:

```bash
cd site
python3 -m http.server 8080
```

Then open <http://localhost:8080>. Reload after each change.

Before you push, check that nothing points at a missing file:

```bash
python3 tools/check_links.py
```

---

## Where to put your code

```
site/
  index.html          <- the home page
  about.html          <- a second page
  projects.html       <- a third
  404.html            <- shown when someone hits an address that doesn't exist
  assets/
    style.css         <- all the colors, spacing and fonts
tools/
  check_links.py      <- finds links pointing at files that don't exist
```

**Everything you publish goes in `site/`.** Files outside it (this README, the
deploy settings) are not uploaded.

### Adding a page

1. Copy `about.html` to a new name, say `notes.html`.
2. Change the `<title>` and the content between `<main>` and `</main>`.
3. Add a link to it in the `<nav>` at the top of **every** page.

That last step is manual on purpose. For a handful of pages it's less work than
any tool that would do it for you.

### Adding images

Put them in `site/assets/` next to the stylesheet, then:

```html
<img src="/assets/photo.jpg" alt="a short description of what it shows">
```

Always write the `alt` text. It's what someone using a screen reader hears, and
what shows if the image fails to load.

Keep photos under about 300 KB each. Oversized images are the single most
common reason a student site feels slow.

---

## Deploying

Push to `main`. That's the whole process.

```bash
git add .
git commit -m "Rewrote the about page"
git push
```

Then open the **Actions** tab at the top of this repository on GitHub. You'll
see your deploy running. Green check means it's live.

Deploys happen in this order, and any step can stop the whole thing:

1. Your links are checked.
2. Your files are uploaded.
3. The cache is cleared, so visitors get the new version instead of the old one.

The cache step is why a deploy takes a minute or two rather than a few seconds.

### When a deploy fails

Open the Actions tab, click the red run, then click the step that failed. The
error is at the bottom of the log. The usual suspects:

| What you see | What it means |
|---|---|
| `These links point at files that don't exist` | A `href` or `src` has a typo, or points at a file you renamed. The exact page and link are printed. |
| `site/index.html is missing` | The home page got renamed or moved. It has to be at `site/index.html`. |
| `This repository is missing settings` | Something wasn't set up on the project. Not your fault, and not something to fix yourself. Ask the web team. |
| It's all green but the site looks old | Give it another minute, then hard-reload (Cmd-Shift-R or Ctrl-Shift-R). Your browser caches too. |

---

## Should I add a build step?

Probably not. Site generators and CSS frameworks are worth it when you have
dozens of pages or a team. For a personal or class project site they add a
folder of configuration, a dependency that breaks in a year, and a build that
can fail, in exchange for saving you from copying a `<nav>` block.

If your site really does outgrow plain HTML, talk to the web team before
picking a tool.

---

## Settings the platform fills in

These are set on the repository when your project is created. The deploy
workflow reads them. **Don't type these values into any file** and don't change
them. They're listed here so you can tell what's handed to you and what's yours.

| Setting | Example value | What it's for |
|---|---|---|
| `AWS_DEPLOY_ROLE_ARN` | `arn:aws:iam::111122223333:role/appdeck-deploy-yourproject` | Lets this repository, and only this repository, sign in to publish. |
| `AWS_REGION` | `us-east-1` | Which data center your site is served from. |
| `S3_BUCKET` | `appdeck-yourproject-site` | Where your files are stored. |
| `CLOUDFRONT_DISTRIBUTION_ID` | `E1A2B3C4D5E6F7` | The cache in front of your site, cleared on every deploy. |

You can see the real values under **Settings → Secrets and variables → Actions
→ Variables**. They're variables, not secrets, so there's nothing sensitive in
them and nothing to protect.

There are **no AWS access keys anywhere in this repository**, and there should
never be. Deploys sign in with a token GitHub creates fresh for each run and
throws away after. If you ever find yourself adding `AWS_ACCESS_KEY_ID` to a
file, stop and ask the web team, because something has gone wrong.

---

## Getting help

Stuck on HTML or CSS? Those are yours to research.

Stuck on the deploy or the settings? That's the web team.
