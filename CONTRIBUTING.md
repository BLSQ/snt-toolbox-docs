# 🚀 Project Update: SNT Toolbox Documentation Website

Hi all!

I have created a simple static documentation website using **GitHub Pages**. You can view the live site here: https://viz.bluesquare.org/snt-toolbox-docs/

This is currently a template to help us evaluate the workflow and "feel" of the documentation. Most of the content still needs to be migrated or added—please see the guide below on how we can collaborate on this.

For the actual content, refer to this ![Google Docs](https://docs.google.com/document/d/15TrBn2AD21zK_-ZU7xt1GTnf2_3LT5hHXGQ981hx8wU/edit?usp=sharing) !

---

## 💡 Points for Discussion

As we transition to this new format, here are a few things to consider:

* **Simplicity & Maintenance:** This is Jekyll-based approach, which seemed the most straightforward starting point. Updating the site _content_ is as simple as editing a Markdown (`.md`) file. While major layout changes require a bit more technical work, the goal is for everyone to easily update their own pipeline descriptions, with a dedicated maintainer handling the overall site structure.
<br> We should eventually consult with more experienced developers to see if a more custom solution is needed, but this allows us to get started right away 🤓.
* **Repo Separation:** I’ve created a dedicated repository for this site (`snt-toolbox-docs`) to avoid cluttering our primary code repository (![snt_development](https://github.com/BLSQ/snt_development)).
* **Pipeline Documentation:** We need to decide on the best way to document specific pipelines. We’ve agreed on using `.md` files, but we still need to finalize:
    1. Where to store them. Iideally the description .md files could be versioned alongside the code in `snt_development` (i.e., next to the `pipeline.py` code).
    2. How to "link" or sync those files into this documentation website automatically.

---

## 🛠️ How the Website Works

The main feature of this site is the **fixed navigation panel (TOC)** on the left-hand side. To make this work, we are moving away from a single, long Google Doc. Instead, we "break down" the manual into individual, independent files—one for each section or subsection.

> [!WARNING]  
> **Please do _not_ add or update a `README.md` file in the root directory!** <br>
Because we use `index.md` as the website’s official homepage, a `README.md` file can cause technical conflicts during the build process. More importantly, we want to avoid returning to a "single massive file" workflow. All content should live in its specific modular `.md` file.


### 1. The "Front Matter" Logic
Every `.md` file starts with a small block of configuration text between triple dashes (`---`). This tells the site where the page belongs in the sidebar.

**Standard Page "Fron Matter" Example:**
```
---
layout: default
title: Getting Started
nav_order: 3
---
```

### 2. Creating Sections & Subsections (Nesting)
To make a page appear "inside" another in the sidebar:

1.  **In the Parent File** (e.g., `01_about.md`), add: `has_children: true`
2.  **In the Child File** (e.g., `01_01_intro.md`), add: `parent: [Exact Title of Parent]` and a `nav_order`.

**Child Header "Fron Matter" Example:**
```
---
layout: default
title: 1.1 What is SNT?
parent: 1. About the SNT Toolbox
nav_order: 1
---
```

### 3. Adding Images
Simply upload your image file to the root directory (or an `/images` folder) and reference it in your Markdown:  
`![Description of image](image_name.png)`

---

## 🚀 How to Contribute

### A. Editing or Adding Content
* **To Edit:** Find the relevant `.md` file in the GitHub repo, click the 'Pencil' icon (or edit locally), and commit your changes.
* **To Add:** Create a new `.md` file, copy a "Front Matter" header from an existing file, and start writing!

### B. Safe Testing (Branches)
The live website is deployed automatically from the **`main`** branch. 
* If you want to "play around" or test significant changes without affecting the live site:
    1. Create a new branch for your work.
    2. Go to **Settings > Pages** in the GitHub repo.
    3. Change the "Build and deployment" branch to your new branch to see your specific version of the site.
    4. Once satisfied, open a Pull Request to merge into `main`.

---
**Questions or feedback?** Reach out to Giulia!
