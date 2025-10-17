<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1hoHWVeXd5PZzEcJU454WizRa_3s_HGo6

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploy to GitHub Pages

The project is configured to emit the production build into the `docs/` directory so that it can be served directly by GitHub Pages.

1. (初回のみ) 依存関係をインストール:
   `npm install`
2. ビルドを実行:
   `npm run build`
3. Commit the generated `docs/` directory to your repository. Make sure the `.nojekyll` marker file in `docs/` is present so GitHub Pages serves the bundled assets without running Jekyll.
4. In your repository settings, enable GitHub Pages for the `main` branch and choose the `docs/` folder as the source.

All asset URLs are relative, so the app will load correctly regardless of the repository name used for the Pages site.
